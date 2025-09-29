import { DiscordAuthenticator, GoogleAuthenticator } from "@lit-protocol/auth";
import { Settings } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { privateKeyToAccount } from "viem/accounts";
import { useWalletClient } from "wagmi";
import { useLitServiceSetup } from "../hooks/useLitServiceSetup";
import litPrimaryOrangeIcon from "../assets/lit-primary-orange.svg";
// Import icon assets
import tfaIcon from "../assets/2fa.svg";
import discordIcon from "../assets/discord.png";
import emailIcon from "../assets/email.svg";
import googleIcon from "../assets/google.png";
import passkeyIcon from "../assets/passkey.svg";
import phoneIcon from "../assets/phone.svg";
import web3WalletIcon from "../assets/web3-wallet.svg";
import whatsappIcon from "../assets/whatsapp.svg";
import PKPSelectionSection from "./PKPSelectionSection";
import { APP_INFO } from "../_config";
import { nagaDev, nagaStaging, nagaTest } from "@lit-protocol/networks";

type SupportedNetworkName = "naga" | "naga-dev" | "naga-staging" | "naga-test";
const NETWORK_MODULES: Partial<Record<SupportedNetworkName, any>> = {
  "naga-dev": nagaDev,
  "naga-staging": nagaStaging,
  "naga-test": nagaTest,
};

// Configuration constants
const DEFAULT_PRIVATE_KEY = APP_INFO.defaultPrivateKey;
const FAUCET_URL = APP_INFO.faucetUrl;
const DEFAULT_AUTH_SERVICE_BASE_URL = APP_INFO.litAuthServer;
const AUTH_SERVICE_URL_STORAGE_KEY = "lit-auth-server-url"; // canonical key
const DEFAULT_LOGIN_SERVICE_BASE_URL = APP_INFO.litLoginServer;
const LOGIN_SERVICE_URL_STORAGE_KEY = "lit-login-server-url"; // canonical key

type AuthMethod =
  | "google"
  | "discord"
  | "eoa"
  | "webauthn"
  | "stytch-email"
  | "stytch-sms"
  | "stytch-whatsapp"
  | "stytch-totp"
  | "custom";

interface AuthUser {
  authContext: any;
  pkpInfo: any;
  method: AuthMethod;
  timestamp: number;
  authData?: any; // Optional for backward compatibility
}

interface LitAuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  logout: () => void;
  isAuthenticating: boolean;
  services: { litClient: any; authManager: any } | null;
  isServicesReady: boolean;
  showAuthModal: () => void;
  hideAuthModal: () => void;
  initiateAuthentication: () => void;
  isInitializingServices: boolean;
  showPkpSelectionModal: () => void;
  updateUserWithPkp: (pkpInfo: any, authContext?: any) => void;
  currentNetworkName: string;
  shouldDisplayNetworkMessage: boolean;
  authServiceBaseUrl: string;
  setAuthServiceBaseUrl: (url: string) => void;
  loginServiceBaseUrl: string;
  setLoginServiceBaseUrl: (url: string) => void;
}

const LitAuthContext = createContext<LitAuthContextValue | null>(null);

export const useLitAuth = () => {
  const context = useContext(LitAuthContext);
  if (!context) {
    throw new Error("useLitAuth must be used within a LitAuthProvider");
  }
  return context;
};

/**
 * useOptionalLitAuth
 *
 * Safe variant that returns null if no provider is present.
 * Use this when rendering components that may be mounted outside the provider.
 */
export const useOptionalLitAuth = () => {
  return useContext(LitAuthContext);
};

interface LitAuthProviderProps {
  children: ReactNode;
  appName?: string;
  networkName?: string;
  autoSetup?: boolean;
  storageKey?: string;
  closeOnBackdropClick?: boolean;
  networkModule?: any;
  supportedNetworks?: SupportedNetworkName[];
  defaultNetwork?: SupportedNetworkName;
  showSettingsButton?: boolean;
  showNetworkMessage?: boolean;
  supportedAuthMethods?: AuthMethod[];
  showSignUpPage?: boolean;
  authServiceBaseUrl?: string;
}

interface AuthMethodInfo {
  id: AuthMethod;
  name: string;
  icon: string;
  description: string;
  available: boolean;
  comingSoon?: boolean;
}

export const LitAuthProvider: React.FC<LitAuthProviderProps> = ({
  children,
  appName = "lit-auth-app",
  networkName = APP_INFO.network,
  autoSetup = false,
  storageKey = "lit-auth-user",
  closeOnBackdropClick = true,
  networkModule = APP_INFO.networkModule,
  supportedNetworks = ["naga-dev", "naga-test", "naga"],
  defaultNetwork,
  showSettingsButton = true,
  showNetworkMessage = false,
  supportedAuthMethods,
  showSignUpPage = true,
  authServiceBaseUrl: authServiceBaseUrlProp,
}) => {
  const { data: walletClient } = useWalletClient();

  // Local network selection state for runtime switching
  const [localNetwork, setLocalNetwork] = useState<any>(networkModule);
  const [localNetworkName, setLocalNetworkName] = useState<string>(
    defaultNetwork || networkName
  );

  useEffect(() => {
    setLocalNetwork(networkModule);
    setLocalNetworkName(defaultNetwork || networkName);
  }, [networkModule, networkName, defaultNetwork]);

  // Setup Lit Protocol services
  const {
    services,
    isInitializing,
    error: setupError,
    setupServices,
    clearServices,
    isReady: isServicesReady,
  } = useLitServiceSetup({
    appName,
    networkName: localNetworkName,
    autoSetup,
    network: localNetwork,
  });

  // Auth state
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isUserAuthenticated = !!user && !!user.authContext && !!user.pkpInfo;

  // UI state
  const [showModal, setShowModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<AuthMethod | null>(null);
  const [showMethodDetail, setShowMethodDetail] = useState(false);
  const [authStep, setAuthStep] = useState<"select" | "input" | "verify">(
    "select"
  );
  const [modalMode, setModalMode] = useState<"signin" | "signup">("signin");
  const [showSettingsView, setShowSettingsView] = useState(false);

  // Ensure we never remain in signup mode when sign up page is disabled
  useEffect(() => {
    if (!showSignUpPage && modalMode === "signup") {
      setModalMode("signin");
    }
  }, [showSignUpPage, modalMode]);

  // EOA specific state
  const [privateKey, setPrivateKey] = useState(DEFAULT_PRIVATE_KEY);
  const [accountMethod, setAccountMethod] = useState<"privateKey" | "wallet">(
    "wallet"
  );

  // Compute network default once from the incoming module
  // TODO: We need to use this as the default auth service base url instead
  // of the hardcoded APP_INFO.litAuthServer
  // const networkDefaultAuthUrl =
  //   networkModule?.getDefaultAuthServiceBaseUrl?.();

  // console.log("networkDefaultAuthUrl:", networkDefaultAuthUrl)

  // Stytch specific state
  const [authServiceBaseUrl, setAuthServiceBaseUrl] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_SERVICE_URL_STORAGE_KEY);
      return saved || authServiceBaseUrlProp || DEFAULT_AUTH_SERVICE_BASE_URL;
    } catch {
      return authServiceBaseUrlProp || DEFAULT_AUTH_SERVICE_BASE_URL;
    }
  });

  // Login service state
  const [loginServiceBaseUrl, setLoginServiceBaseUrl] = useState(() => {
    try {
      const saved = localStorage.getItem(LOGIN_SERVICE_URL_STORAGE_KEY);
      return saved || DEFAULT_LOGIN_SERVICE_BASE_URL;
    } catch {
      return DEFAULT_LOGIN_SERVICE_BASE_URL;
    }
  });

  // No restore effect needed; initialiser above ensures correct precedence on first render

  useEffect(() => {
    try {
      if (authServiceBaseUrl) {
        localStorage.setItem(AUTH_SERVICE_URL_STORAGE_KEY, authServiceBaseUrl);
      } else {
        localStorage.removeItem(AUTH_SERVICE_URL_STORAGE_KEY);
      }
    } catch (e) {
      console.warn("Failed to write auth service URL to storage", e);
    }
  }, [authServiceBaseUrl]);

  useEffect(() => {
    try {
      if (loginServiceBaseUrl) {
        localStorage.setItem(
          LOGIN_SERVICE_URL_STORAGE_KEY,
          loginServiceBaseUrl
        );
      } else {
        localStorage.removeItem(LOGIN_SERVICE_URL_STORAGE_KEY);
      }
    } catch (e) {
      console.warn("Failed to write login service URL to storage", e);
    }
  }, [loginServiceBaseUrl]);
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [userId, setUserId] = useState("");
  const [methodId, setMethodId] = useState("");

  // WebAuthn specific state
  const [webAuthnUsername, setWebAuthnUsername] = useState("");
  const [webAuthnMode, setWebAuthnMode] = useState<"register" | "authenticate">(
    "register"
  );
  const [isFido2Available, setIsFido2Available] = useState<boolean | null>(
    null
  );

  // Custom auth specific state (demo PKP and validation)
  const [customPkpPublicKey, setCustomPkpPublicKey] = useState(
    "0x04b8e68a0b4b95e39b2c49f7b8c4b8b3b6f16b52e4a1e4b6b8b3b6f16b52e4a1e4b6b8b3b6f16b52e4a1e4b6b8b3b6f16b52e4a1e4b6b8b3b6f16b52e4a1e4b6b8b3b6f16b52e4a1e"
  );
  const [customValidationCid, setCustomValidationCid] = useState(
    "QmYLeVmwJPVs7Uebk85YdVPivMyrvoeKR6X37kyVRZUXW4"
  );
  const [customUsername, setCustomUsername] = useState("alice");
  const [customPassword, setCustomPassword] = useState("lit");
  const [customAuthMethodId, setCustomAuthMethodId] = useState(
    "0x22b562b86d5d467a9f06c3f20137b37ed13981f63bd5dbdf6fc1e0fb97015401"
  );

  // PKP selection state for modal flow
  const [tempAuthData, setTempAuthData] = useState<any>(null);
  const [tempMethod, setTempMethod] = useState<AuthMethod | null>(null);
  const [showPkpSelection, setShowPkpSelection] = useState(false);
  const [isWebAuthnExistingFlow, setIsWebAuthnExistingFlow] = useState(false);

  // Authentication methods configuration
  const authMethods: AuthMethodInfo[] = [
    {
      id: "google",
      name: "Google",
      icon: googleIcon,
      description: "Continue with Google",
      available: true,
    },
    {
      id: "discord",
      name: "Discord",
      icon: discordIcon,
      description: "Continue with Discord",
      available: true,
    },
    {
      id: "eoa",
      name: "Web3 Wallet",
      icon: web3WalletIcon,
      description: "Connect your web3 wallet",
      available: true,
    },
    {
      id: "webauthn",
      name: "WebAuthn",
      icon: passkeyIcon,
      description: "Use WebAuthn/Passkey",
      available: true,
    },
    {
      id: "stytch-email",
      name: "Email OTP",
      icon: emailIcon,
      description: "Email verification code",
      available: true,
    },
    {
      id: "stytch-sms",
      name: "SMS",
      icon: phoneIcon,
      description: "SMS verification code",
      available: true,
    },
    {
      id: "stytch-whatsapp",
      name: "WhatsApp",
      icon: whatsappIcon,
      description: "WhatsApp verification code",
      available: true,
    },
    {
      id: "stytch-totp",
      name: "Authenticator",
      icon: tfaIcon,
      description: "TOTP authenticator app",
      available: true,
    },
    {
      id: "custom",
      name: "Custom Auth",
      icon: passkeyIcon,
      description: "Test custom authentication",
      available: true,
    },
  ];

  // Determine which methods to show based on provided prop; defaults to all available
  const methodsToShow =
    supportedAuthMethods && supportedAuthMethods.length > 0
      ? supportedAuthMethods
      : authMethods.map((m) => m.id);
  const filteredAuthMethods = authMethods.filter((m) =>
    methodsToShow.includes(m.id)
  );

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(storageKey);
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        // Check if user data is not too old (24 hours)
        const isStale = Date.now() - userData.timestamp > 24 * 60 * 60 * 1000;
        if (!isStale) {
          setUser(userData);
        } else {
          localStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      console.error("Failed to load saved user:", error);
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  // Auto-initialize services when user exists but services aren't ready
  useEffect(() => {
    if (user && !isServicesReady && !isInitializing) {
      console.log(
        "🔄 User exists but services not ready - initializing services..."
      );
      setupServices().catch((error) => {
        console.error(
          "Failed to auto-initialize services for existing user:",
          error
        );
        // Don't logout the user automatically, but log the error
        // The user can try to use functionality and it will show appropriate error messages
      });
    }
  }, [user, isServicesReady, isInitializing, setupServices]);

  // Recreate authContext when services become ready for existing user
  useEffect(() => {
    const recreateAuthContext = async () => {
      if (
        user &&
        user.authData &&
        user.pkpInfo &&
        isServicesReady &&
        services
      ) {
        // Check if authContext is missing methods (indicates it was loaded from localStorage)
        const needsRecreation =
          !user.authContext?.authNeededCallback ||
          typeof user.authContext?.authNeededCallback !== "function";

        if (needsRecreation) {
          console.log(
            "🔧 Recreating authContext for user loaded from localStorage..."
          );
          try {
            const newAuthContext =
              await services.authManager.createPkpAuthContext({
                authData: user.authData,
                pkpPublicKey: user.pkpInfo.pubkey || user.pkpInfo.publicKey,
                authConfig: {
                  expiration: new Date(
                    Date.now() + 1000 * 60 * 60 * 24
                  ).toISOString(),
                  statement: "",
                  domain: "",
                  resources: [
                    ["pkp-signing", "*"],
                    ["lit-action-execution", "*"],
                    ["access-control-condition-decryption", "*"],
                  ],
                },
                litClient: services.litClient,
              });

            // Update user with new authContext
            const updatedUser = {
              ...user,
              authContext: newAuthContext,
            };
            setUser(updatedUser);
            localStorage.setItem(storageKey, JSON.stringify(updatedUser));
            console.log("✅ AuthContext recreated successfully");
          } catch (error) {
            console.error("Failed to recreate authContext:", error);
            // Don't logout user, but they may need to re-authenticate for some functions
          }
        }
      }
    };

    recreateAuthContext();
  }, [user, isServicesReady, services, storageKey]);

  // Check WebAuthn availability
  useEffect(() => {
    async function checkFido2Availability() {
      if (window.PublicKeyCredential) {
        try {
          const available =
            await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsFido2Available(available);
        } catch (e) {
          console.warn("Error checking FIDO2 availability:", e);
          setIsFido2Available(false);
        }
      } else {
        setIsFido2Available(false);
      }
    }
    checkFido2Availability();
  }, []);

  // ESC key handler
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showModal) {
        resetModalState();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, [showModal]);

  const formatError = (prefix: string, error: any): string => {
    if (error?.message) return `${prefix}${error.message}`;
    if (typeof error === "object")
      return `${prefix}${JSON.stringify(error, null, 2)}`;
    return `${prefix}${String(error)}`;
  };

  const handleError = (error: any, context: string) => {
    const errorMessage = formatError(`${context}: `, error);
    setError(errorMessage);
    setIsAuthenticating(false);
    console.error(`❌ ${context}:`, error);
  };

  const resetModalState = () => {
    setShowModal(false);
    setSelectedMethod(null);
    setShowMethodDetail(false);
    setAuthStep("select");
    setModalMode("signin");
    setShowSettingsView(false);
    setError(null);
    setEmail("");
    setPhoneNumber("");
    setOtpCode("");
    setTotpCode("");
    setUserId("");
    setMethodId("");
    setWebAuthnUsername("");
    setWebAuthnMode("register");
    // Reset PKP selection states
    setShowPkpSelection(false);
    setTempAuthData(null);
    setTempMethod(null);
    setIsWebAuthnExistingFlow(false);
  };

  const saveUser = (userData: AuthUser) => {
    setUser(userData);
    localStorage.setItem(storageKey, JSON.stringify(userData));
    resetModalState();
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(storageKey);
    resetModalState();
    // Don't automatically show modal on logout - let user manually reconnect

    // redirect back to home page
    window.location.href = "/";
  };

  const showAuthModal = () => {
    if (!isUserAuthenticated) {
      setShowModal(true);
    }
  };
  const hideAuthModal = () => resetModalState();

  const initiateAuthentication = async () => {
    try {
      // If already authenticated, don't open modal; just ensure services are ready
      if (isUserAuthenticated) {
        if (!isServicesReady && !isInitializing) {
          await setupServices();
        }
        return;
      }

      // Show the modal (this will show loading if services aren't ready)
      setShowModal(true);

      // If services aren't ready, set them up first
      if (!isServicesReady && !isInitializing) {
        await setupServices();
      }
    } catch (error) {
      handleError(error, "Failed to initialize Lit Protocol services");
    }
  };

  // Close modal automatically if we detect an authenticated user (e.g., after refresh)
  useEffect(() => {
    if (isUserAuthenticated && showModal) {
      setShowModal(false);
      setShowMethodDetail(false);
      setShowPkpSelection(false);
      setShowSettingsView(false);
      setSelectedMethod(null);
    }
  }, [isUserAuthenticated, showModal]);

  const handlePkpSelectionInModal = async (pkpInfo: any) => {
    if (!tempAuthData || !tempMethod || !services) {
      console.error("Cannot complete PKP selection: missing data or services");
      return;
    }

    try {
      setIsAuthenticating(true);

      // Create auth context for the selected PKP
      const authContext = await services.authManager.createPkpAuthContext({
        authData: tempAuthData,
        pkpPublicKey: pkpInfo.pubkey || pkpInfo.publicKey,
        authConfig: {
          expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
          statement: "",
          domain: "",
          resources: [
            ["pkp-signing", "*"],
            ["lit-action-execution", "*"],
            ["access-control-condition-decryption", "*"],
          ],
        },
        litClient: services.litClient,
      });

      // Create complete user object
      const userData: AuthUser = {
        authContext,
        pkpInfo,
        method: tempMethod,
        timestamp: Date.now(),
        authData: tempAuthData,
      };

      // Save user and provide success feedback before closing modal
      setUser(userData);
      localStorage.setItem(storageKey, JSON.stringify(userData));

      // Brief success state before closing
      setTimeout(() => {
        resetModalState();
      }, 800);
    } catch (error) {
      console.error("Failed to create auth context for selected PKP:", error);
      handleError(error, "Failed to create auth context for selected PKP");
    } finally {
      setIsAuthenticating(false);
    }
  };

  // ========== AUTHENTICATION FLOWS ==========

  const authenticateAndShowPkpSelection = async (
    authData: any,
    method: AuthMethod
  ) => {
    try {
      // Set WebAuthn existing-flow flag deterministically based on method and mode
      setIsWebAuthnExistingFlow(
        method === "webauthn" &&
          modalMode === "signin" &&
          webAuthnMode === "authenticate"
      );
      // Store auth data temporarily and show PKP selection in modal
      setTempAuthData(authData);
      setTempMethod(method);
      setSelectedMethod(null);
      setShowMethodDetail(false);
      setShowPkpSelection(true);
      setAuthStep("select");
      setError(null);

      // Modal stays open for PKP selection
    } catch (error) {
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const mintAndCreateContext = async (authData: any, method: AuthMethod) => {
    try {
      // Mint PKP
      const result = await services!.litClient.authService.mintWithAuth({
        authData,
        scopes: ["sign-anything"],
      });

      // Create auth context
      const authContext = await services!.authManager.createPkpAuthContext({
        authData,
        pkpPublicKey: result.data.pubkey,
        authConfig: {
          expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
          statement: "",
          domain: "",
          resources: [
            ["pkp-signing", "*"],
            ["lit-action-execution", "*"],
          ],
        },
        litClient: services!.litClient,
      });

      const userData: AuthUser = {
        authContext,
        pkpInfo: result.data,
        method,
        timestamp: Date.now(),
        authData,
      };

      saveUser(userData);
    } catch (error) {
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const authenticateGoogle = async () => {
    try {
      setIsAuthenticating(true);
      setError(null);

      const authData = await GoogleAuthenticator.authenticate(
        loginServiceBaseUrl
      );

      if (modalMode === "signin") {
        await authenticateAndShowPkpSelection(authData, "google");
      } else {
        await mintAndCreateContext(authData, "google");
      }
    } catch (error) {
      handleError(error, "Google authentication failed");
    }
  };

  const authenticateDiscord = async () => {
    try {
      setIsAuthenticating(true);
      setError(null);

      const authData = await DiscordAuthenticator.authenticate(
        loginServiceBaseUrl
      );

      if (modalMode === "signin") {
        await authenticateAndShowPkpSelection(authData, "discord");
      } else {
        await mintAndCreateContext(authData, "discord");
      }
    } catch (error) {
      handleError(error, "Discord authentication failed");
    }
  };

  const authenticateEOA = async () => {
    try {
      setIsAuthenticating(true);
      setError(null);

      let account;
      let authData;

      if (accountMethod === "privateKey") {
        if (!privateKey.startsWith("0x") || privateKey.length !== 66) {
          throw new Error("Invalid private key format");
        }
        account = privateKeyToAccount(privateKey as `0x${string}`);

        const { ViemAccountAuthenticator } = await import("@lit-protocol/auth");
        authData = await ViemAccountAuthenticator.authenticate(account);
      } else {
        if (!walletClient?.account) {
          throw new Error("No wallet connected");
        }
        account = walletClient;

        const { WalletClientAuthenticator } = await import(
          "@lit-protocol/auth"
        );
        authData = await WalletClientAuthenticator.authenticate(walletClient);
      }

      if (modalMode === "signin") {
        await authenticateAndShowPkpSelection(authData, "eoa");
      } else {
        // Mint PKP and create context for signup
        let result;
        if (accountMethod === "privateKey") {
          result = await services!.litClient.mintWithAuth({
            account,
            authData,
            scopes: ["sign-anything"],
          });
        } else {
          result = await services!.litClient.mintWithAuth({
            account: walletClient,
            authData,
            scopes: ["sign-anything"],
          });
        }

        const authContext = await services!.authManager.createPkpAuthContext({
          authData,
          pkpPublicKey: result.data.pubkey,
          authConfig: {
            expiration: new Date(
              Date.now() + 1000 * 60 * 60 * 24
            ).toISOString(),
            statement: "",
            domain: "",
            resources: [
              ["pkp-signing", "*"],
              ["lit-action-execution", "*"],
            ],
          },
          litClient: services!.litClient,
        });

        const userData: AuthUser = {
          authContext,
          pkpInfo: result.data,
          method: "eoa",
          timestamp: Date.now(),
          authData: authData,
        };

        saveUser(userData);
      }
    } catch (error) {
      handleError(error, "EOA authentication failed");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const authenticateWebAuthn = async () => {
    try {
      setIsAuthenticating(true);
      setError(null);

      const { WebAuthnAuthenticator } = await import("@lit-protocol/auth");

      if (webAuthnMode === "register" || modalMode === "signup") {
        // Register new credential and mint PKP
        const { pkpInfo } = await WebAuthnAuthenticator.registerAndMintPKP({
          authServiceBaseUrl: authServiceBaseUrl,
          username: webAuthnUsername || `naga-user-${Date.now()}`,
          scopes: ["sign-anything"],
        });

        // For registerAndMintPKP, we need to authenticate to get authData
        const authData = await WebAuthnAuthenticator.authenticate();

        const authContext = await services!.authManager.createPkpAuthContext({
          authData,
          pkpPublicKey: pkpInfo.pubkey,
          authConfig: {
            expiration: new Date(
              Date.now() + 1000 * 60 * 60 * 24
            ).toISOString(),
            statement: "",
            domain: "",
            resources: [
              ["pkp-signing", "*"],
              ["lit-action-execution", "*"],
            ],
          },
          litClient: services!.litClient,
        });

        const userData: AuthUser = {
          authContext,
          pkpInfo,
          method: "webauthn",
          timestamp: Date.now(),
          authData,
        };

        saveUser(userData);
      } else {
        // Authenticate with existing credential
        const authData = await WebAuthnAuthenticator.authenticate();

        if (authData) {
          if (modalMode === "signin") {
            await authenticateAndShowPkpSelection(authData, "webauthn");
          } else {
            await mintAndCreateContext(authData, "webauthn");
          }
        }
      }
    } catch (error) {
      handleError(error, "WebAuthn authentication failed");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const sendStytchOtp = async () => {
    try {
      setIsAuthenticating(true);
      setError(null);

      let result;

      if (selectedMethod === "stytch-email") {
        if (!email || !email.includes("@")) {
          throw new Error("Please enter a valid email address");
        }
        const { StytchEmailOtpAuthenticator } = await import(
          "@lit-protocol/auth"
        );
        result = await StytchEmailOtpAuthenticator.sendOtp({
          email,
          authServiceBaseUrl,
        });
      } else if (selectedMethod === "stytch-sms") {
        if (!phoneNumber) {
          throw new Error("Please enter a valid phone number");
        }
        const { StytchSmsOtpAuthenticator } = await import(
          "@lit-protocol/auth"
        );
        result = await StytchSmsOtpAuthenticator.sendOtp({
          phoneNumber,
          authServiceBaseUrl,
        });
      } else if (selectedMethod === "stytch-whatsapp") {
        if (!phoneNumber) {
          throw new Error("Please enter a valid phone number");
        }
        const { StytchWhatsAppOtpAuthenticator } = await import(
          "@lit-protocol/auth"
        );
        result = await StytchWhatsAppOtpAuthenticator.sendOtp({
          phoneNumber,
          authServiceBaseUrl,
        });
      }

      if (result?.methodId) {
        setMethodId(result.methodId);
        setAuthStep("verify");
      }
    } catch (error) {
      handleError(error, "Failed to send OTP");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const verifyStytchOtp = async () => {
    try {
      setIsAuthenticating(true);
      setError(null);

      let authData;

      if (selectedMethod === "stytch-email") {
        const { StytchEmailOtpAuthenticator } = await import(
          "@lit-protocol/auth"
        );
        authData = await StytchEmailOtpAuthenticator.authenticate({
          methodId,
          code: otpCode,
          authServiceBaseUrl,
        });
      } else if (selectedMethod === "stytch-sms") {
        const { StytchSmsOtpAuthenticator } = await import(
          "@lit-protocol/auth"
        );
        authData = await StytchSmsOtpAuthenticator.authenticate({
          methodId,
          code: otpCode,
          authServiceBaseUrl,
        });
      } else if (selectedMethod === "stytch-whatsapp") {
        const { StytchWhatsAppOtpAuthenticator } = await import(
          "@lit-protocol/auth"
        );
        authData = await StytchWhatsAppOtpAuthenticator.authenticate({
          methodId,
          code: otpCode,
          authServiceBaseUrl,
        });
      }

      if (authData) {
        if (modalMode === "signin") {
          await authenticateAndShowPkpSelection(
            authData,
            selectedMethod as AuthMethod
          );
        } else {
          await mintAndCreateContext(authData, selectedMethod as AuthMethod);
        }
      }
    } catch (error) {
      handleError(error, "Failed to verify OTP");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const authenticateStytchTotp = async () => {
    try {
      setIsAuthenticating(true);
      setError(null);

      if (!userId || !totpCode) {
        throw new Error("Please enter both User ID and TOTP code");
      }

      const { StytchTotp2FAAuthenticator } = await import("@lit-protocol/auth");
      const authData = await StytchTotp2FAAuthenticator.authenticate({
        userId,
        totpCode,
        authServiceBaseUrl,
      });

      if (modalMode === "signin") {
        await authenticateAndShowPkpSelection(authData, "stytch-totp");
      } else {
        await mintAndCreateContext(authData, "stytch-totp");
      }
    } catch (error) {
      handleError(error, "TOTP authentication failed");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const authenticateCustom = async () => {
    try {
      setIsAuthenticating(true);
      setError(null);

      if (
        !customPkpPublicKey ||
        !customValidationCid ||
        !customUsername ||
        !customPassword ||
        !customAuthMethodId
      ) {
        throw new Error("Please fill in all custom auth parameters");
      }

      // Create custom auth context using the demo parameters
      const customAuthContext =
        await services!.authManager.createCustomAuthContext({
          pkpPublicKey: customPkpPublicKey,
          authConfig: {
            expiration: new Date(
              Date.now() + 1000 * 60 * 60 * 24
            ).toISOString(),
            statement: "",
            domain: "",
            resources: [
              ["pkp-signing", "*"],
              ["lit-action-execution", "*"],
            ],
          },
          litClient: services!.litClient,
          customAuthParams: {
            litActionIpfsId: customValidationCid,
            jsParams: {
              pkpPublicKey: customPkpPublicKey,
              username: customUsername,
              password: customPassword,
              authMethodId: customAuthMethodId,
            },
          },
        });

      const userData: AuthUser = {
        authContext: customAuthContext,
        pkpInfo: { pubkey: customPkpPublicKey, tokenId: "demo-token-id" },
        method: "custom",
        timestamp: Date.now(),
        authData: {
          authMethodType: 10, // Custom auth method type
          authMethodId: customAuthMethodId,
        },
      };

      saveUser(userData);
    } catch (error) {
      handleError(error, "Custom authentication failed");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleMethodSelect = (method: AuthMethod) => {
    if (!authMethods.find((m) => m.id === method)?.available) return;

    setSelectedMethod(method);
    setError(null);

    if (
      [
        "eoa",
        "webauthn",
        "custom",
        "stytch-email",
        "stytch-sms",
        "stytch-whatsapp",
        "stytch-totp",
      ].includes(method)
    ) {
      setShowMethodDetail(true);
      setAuthStep("input");
    } else {
      // Direct authentication for OAuth methods
      switch (method) {
        case "google":
          authenticateGoogle();
          break;
        case "discord":
          authenticateDiscord();
          break;
      }
    }
  };

  const handleAuthAction = () => {
    switch (selectedMethod) {
      case "eoa":
        authenticateEOA();
        break;
      case "webauthn":
        authenticateWebAuthn();
        break;
      case "stytch-email":
      case "stytch-sms":
      case "stytch-whatsapp":
        if (authStep === "input") {
          sendStytchOtp();
        } else if (authStep === "verify") {
          verifyStytchOtp();
        }
        break;
      case "stytch-totp":
        authenticateStytchTotp();
        break;
      case "custom":
        authenticateCustom();
        break;
    }
  };

  const contextValue: LitAuthContextValue = {
    user,
    isAuthenticated: !!user && !!user.authContext && !!user.pkpInfo,
    logout,
    isAuthenticating,
    services,
    isServicesReady,
    showAuthModal,
    hideAuthModal,
    initiateAuthentication,
    isInitializingServices: isInitializing,
    showPkpSelectionModal: () => {
      if (user && user.authData) {
        setTempAuthData(user.authData);
        setTempMethod(user.method);
        setShowPkpSelection(true);
        setShowModal(true);
        setShowMethodDetail(false);
        setSelectedMethod(null);
        setIsWebAuthnExistingFlow(user.method === "webauthn");
      }
    },
    updateUserWithPkp: (pkpInfo: any, authContext?: any) => {
      if (user) {
        const updatedUser = {
          ...user,
          pkpInfo,
          authContext: authContext || user.authContext,
        };
        setUser(updatedUser);
        saveUser(updatedUser);
      }
    },
    currentNetworkName: localNetworkName,
    shouldDisplayNetworkMessage:
      showNetworkMessage && localNetworkName !== "naga",
    authServiceBaseUrl,
    setAuthServiceBaseUrl,
    loginServiceBaseUrl,
    setLoginServiceBaseUrl,
  };

  // Always render children with context
  return (
    <LitAuthContext.Provider value={contextValue}>
      {children}

      {/* Setup loading overlay */}
      {!isServicesReady && showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-xl p-10 text-center max-w-[400px] m-5">
            {setupError ? (
              <div>
                <h3 className="text-red-600 mb-5">⚠️ Setup Failed</h3>
                <p className="text-gray-600 mb-5">{setupError}</p>
                <button
                  onClick={setupServices}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg text-base cursor-pointer"
                >
                  Retry Setup
                </button>
              </div>
            ) : (
              <div>
                <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-5" />
                <h3 className="text-gray-800 mb-2">Setting up Lit Protocol</h3>
                <p className="text-gray-600 m-0">Initialising services...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Authentication Modal */}
      {showModal && isServicesReady && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4 sm:p-5"
          onClick={(e) => {
            if (!closeOnBackdropClick) return;
            if (e.target === e.currentTarget) {
              resetModalState();
            }
          }}
        >
          <div
            id="lit-auth-modal-container"
            className={`bg-white rounded-xl px-4 sm:px-7 pt-6 sm:pt-7 pb-6 sm:pb-7 w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200 relative ${
              showPkpSelection
                ? "max-w-[92vw] sm:max-w-lg md:max-w-xl lg:max-w-[48rem]"
                : "max-w-[92vw] sm:max-w-sm md:max-w-md lg:max-w-[32rem]"
            }`}
          >
            {/* Network message moved to LoggedInDashboard */}
            {/* Settings (top-right) */}
            {showSettingsButton && !showPkpSelection && !showSettingsView && (
              <div className="absolute top-3 right-3 z-[1]">
                <button
                  aria-label="Settings"
                  onClick={() => {
                    setShowSettingsView(true);
                    setShowMethodDetail(false);
                    setShowPkpSelection(false);
                  }}
                  className="inline-flex items-center justify-center p-1.5 border border-gray-300 rounded-md bg-white text-gray-700 cursor-pointer outline-none shadow-none hover:bg-gray-50"
                >
                  <Settings size={16} />
                </button>
              </div>
            )}
            {showSettingsView ? (
              // Settings view
              <div className="text-black">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-[18px] font-semibold text-gray-900 m-0">
                    Settings
                  </h3>
                  <button
                    onClick={() => setShowSettingsView(false)}
                    className="bg-transparent border-0 text-gray-500 text-[12px] cursor-pointer px-2 py-1 rounded hover:bg-gray-100 hover:text-gray-700"
                  >
                    ← Back
                  </button>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-gray-200 mb-4">
                  <label className="text-[13px] font-semibold block mb-2 text-gray-900">
                    Network
                  </label>
                  <div className="grid gap-2">
                    {supportedNetworks.map((net) => {
                      const isActive = localNetworkName === net;
                      const isDisabled = net === "naga"; // future production, disabled
                      return (
                        <button
                          key={net}
                          onClick={async () => {
                            try {
                              if (isDisabled) return;
                              const key = net as SupportedNetworkName;
                              const selected = NETWORK_MODULES[key] || nagaDev;
                              setLocalNetworkName(net);
                              setLocalNetwork(selected);
                              clearServices();
                              await setupServices();
                            } catch (err) {
                              console.error("Failed to switch network:", err);
                            }
                          }}
                          className={`flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md ${
                            isActive ? "bg-indigo-50" : "bg-white"
                          } text-gray-900 ${isDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <span className="text-[13px] font-semibold">
                            {net}
                          </span>
                          {isActive && (
                            <span className="text-[12px] text-indigo-600 font-semibold">
                              Selected
                            </span>
                          )}
                          {isDisabled && !isActive && (
                            <span className="text-[12px] text-gray-500">
                              (Coming soon)
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Auth & Login Service URLs */}
                <div className="p-3 bg-slate-50 rounded-lg border border-gray-200 mb-4">
                  <label className="text-[13px] font-semibold block mb-2 text-gray-900">
                    Auth Service URL
                  </label>
                  <input
                    type="url"
                    value={authServiceBaseUrl}
                    onChange={(e) => setAuthServiceBaseUrl(e.target.value)}
                    placeholder={APP_INFO.litAuthServer}
                    className="w-full px-2.5 py-2 border border-gray-300 rounded text-[12px] font-mono"
                  />
                  <div className="mt-2">
                    <button
                      onClick={() =>
                        setAuthServiceBaseUrl(DEFAULT_AUTH_SERVICE_BASE_URL)
                      }
                      className="px-3 py-1.5 border border-gray-300 rounded text-[12px] cursor-pointer bg-white hover:bg-gray-100 text-gray-700"
                    >
                      Reset to default
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-gray-200 mb-4">
                  <label className="text-[13px] font-semibold block mb-2 text-gray-900">
                    Login Service URL
                  </label>
                  <input
                    type="url"
                    value={loginServiceBaseUrl}
                    onChange={(e) => setLoginServiceBaseUrl(e.target.value)}
                    placeholder={APP_INFO.litLoginServer}
                    className="w-full px-2.5 py-2 border border-gray-300 rounded text-[12px] font-mono"
                  />
                  <div className="mt-2">
                    <button
                      onClick={() =>
                        setLoginServiceBaseUrl(DEFAULT_LOGIN_SERVICE_BASE_URL)
                      }
                      className="px-3 py-1.5 border border-gray-300 rounded text-[12px] cursor-pointer bg-white hover:bg-gray-100 text-gray-700"
                    >
                      Reset to default
                    </button>
                  </div>
                </div>
              </div>
            ) : !showMethodDetail ? (
              // Main method selection or PKP selection
              showPkpSelection ? (
                // PKP Selection View
                <div>
                  <div className="mb-5">
                    <button
                      onClick={() => {
                        setShowPkpSelection(false);
                        setIsWebAuthnExistingFlow(false);
                      }}
                      className="bg-transparent border-0 text-gray-500 text-[13px] cursor-pointer mb-3 flex items-center gap-1.5 px-2 py-1 rounded transition hover:bg-gray-100 hover:text-gray-700"
                    >
                      ← Back to Authentication
                    </button>
                  </div>

                  {tempAuthData && tempMethod && services && (
                    <PKPSelectionSection
                      authData={tempAuthData}
                      onPkpSelected={handlePkpSelectionInModal}
                      authMethodName={`${tempMethod} Auth`}
                      services={services}
                      disabled={isAuthenticating}
                      authServiceBaseUrl={authServiceBaseUrl}
                      singlePkpMessaging={isWebAuthnExistingFlow}
                    />
                  )}
                </div>
              ) : (
                // Main method selection
                <div className="text-black">
                  <div className="text-center mb-5">
                    <h2 className="text-[22px] font-bold mb-1.5 text-gray-900 leading-tight">
                      {modalMode === "signin" ? "Log in" : "Sign up"}
                    </h2>
                    <p className="text-[13px] text-gray-500 leading-snug m-0">
                      {modalMode === "signin"
                        ? "Access your existing PKP wallet"
                        : "Create a new wallet secured by accounts you already have"}
                    </p>
                  </div>

                  {error && (
                    <div className="px-3 py-2 bg-red-50 border border-red-200 rounded mb-4 text-red-600 text-[12px]">
                      {error}
                    </div>
                  )}

                  <div className="grid gap-2 mb-4">
                    {filteredAuthMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => handleMethodSelect(method.id)}
                        disabled={
                          !method.available ||
                          isAuthenticating ||
                          (method.id === "webauthn" &&
                            isFido2Available === false)
                        }
                        className={`flex items-center gap-3 px-3 py-2 border border-gray-300 rounded-lg text-[14px] font-medium text-gray-700 transition ${
                          method.available &&
                          !isAuthenticating &&
                          !(
                            method.id === "webauthn" &&
                            isFido2Available === false
                          )
                            ? "bg-white hover:bg-gray-100 hover:border-gray-400 cursor-pointer"
                            : "bg-gray-50 cursor-not-allowed opacity-60"
                        } min-h-[44px] text-left`}
                      >
                        <div className="w-10 flex items-center justify-center">
                          <img
                            src={method.icon}
                            alt={method.name}
                            className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
                          />
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                          <span className="font-semibold leading-tight text-center">
                            {method.name}
                            {method.comingSoon && (
                              <span className="text-[12px] text-gray-500 font-normal ml-1">
                                (Soon)
                              </span>
                            )}
                            {method.id === "webauthn" &&
                              isFido2Available === false && (
                                <span className="text-[12px] text-red-600 font-normal ml-1">
                                  (Not Available)
                                </span>
                              )}
                          </span>
                        </div>
                        <div className="w-10 flex items-center justify-center">
                          {isAuthenticating && selectedMethod === method.id && (
                            <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                          )}
                        </div>
                      </button>
                    ))}
                    {filteredAuthMethods.length === 0 && (
                      <div className="px-3 py-2 border border-gray-200 rounded-lg text-gray-500 text-[12px] text-center">
                        No sign-in methods available.
                      </div>
                    )}
                  </div>

                  {closeOnBackdropClick && (
                    <div className="text-center mt-4 text-[11px] text-gray-500">
                      Press ESC to close
                    </div>
                  )}

                  {/* Mode Toggle */}
                  {showSignUpPage && (
                    <div className="text-center mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() =>
                          setModalMode(
                            modalMode === "signin" ? "signup" : "signin"
                          )
                        }
                        className="bg-transparent border-0 text-blue-500 text-[13px] cursor-pointer underline font-medium"
                      >
                        {modalMode === "signin"
                          ? "Need an account? Sign up"
                          : "Already have an account? Sign in"}
                      </button>
                    </div>
                  )}
                </div>
              )
            ) : (
              // Method detail view
              <div>
                <div style={{ marginBottom: "16px" }}>
                  <button
                    onClick={() => {
                      setShowMethodDetail(false);
                      setSelectedMethod(null);
                      setAuthStep("select");
                      setError(null);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#6b7280",
                      fontSize: "12px",
                      cursor: "pointer",
                      marginBottom: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    ← Back
                  </button>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#111827",
                      margin: 0,
                    }}
                  >
                    {authMethods.find((m) => m.id === selectedMethod)?.name}
                  </h3>
                </div>

                {error && (
                  <div
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "6px",
                      marginBottom: "16px",
                      color: "#dc2626",
                      fontSize: "12px",
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* Method-specific form inputs */}
                <div className="mb-4">
                  {selectedMethod === "eoa" && (
                    <div className="text-black">
                      <div className="mb-3">
                        <label className="text-[13px] font-medium mb-1.5 block">
                          Account Method:
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setAccountMethod("wallet")}
                            className={`px-4 py-2 border border-gray-300 rounded text-[12px] cursor-pointer font-medium ${
                              accountMethod === "wallet"
                                ? "bg-[#4285F4] text-white"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            Connected Wallet
                          </button>
                          <button
                            onClick={() => setAccountMethod("privateKey")}
                            className={`px-4 py-2 border border-gray-300 rounded text-[12px] cursor-pointer font-medium ${
                              accountMethod === "privateKey"
                                ? "bg-[#4285F4] text-white"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            Private Key
                          </button>
                        </div>
                      </div>
                      {accountMethod === "wallet" && (
                        <div className="text-black mb-3 p-3 bg-[#f8f9fa] rounded border border-[#e9ecef]">
                          <p className="m-0 mb-2 text-[13px] font-medium">
                            <strong>Using Connected Wallet:</strong>
                          </p>
                          <p className="m-0 mb-2 text-[12px] text-gray-600 leading-snug">
                            This will use your currently connected wallet
                            account (e.g., MetaMask). Make sure your wallet is
                            connected and you have test tokens.
                          </p>
                          <p className="m-0 mb-2 text-[12px] text-gray-600">
                            Need tokens? Visit the{" "}
                            <a
                              href={FAUCET_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#4285F4] underline"
                            >
                              Chronicle Yellowstone Faucet
                            </a>
                          </p>
                          <div className="mt-2">
                            <ConnectButton showBalance={false} />
                          </div>
                        </div>
                      )}
                      {accountMethod === "privateKey" && (
                        <div className="mb-3">
                          <label className="text-[13px] font-medium mb-1.5 block">
                            Private Key:
                          </label>
                          <input
                            type="password"
                            value={privateKey}
                            onChange={(e) =>
                              setPrivateKey(e.target.value as any)
                            }
                            placeholder="0x..."
                            className="w-full px-3 py-2 border border-gray-300 rounded text-[12px] font-mono"
                          />
                          <small className="text-gray-600 text-[11px] block mt-1">
                            Default test private key is provided. Replace with
                            your own for production use.
                          </small>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedMethod === "webauthn" && (
                    <div className="text-black">
                      <div className="mb-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setWebAuthnMode("register")}
                            className={`px-3 py-1.5 border border-gray-300 rounded text-[12px] cursor-pointer ${
                              webAuthnMode === "register"
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            Register New
                          </button>
                          <button
                            onClick={() => setWebAuthnMode("authenticate")}
                            className={`px-3 py-1.5 border border-gray-300 rounded text-[12px] cursor-pointer ${
                              webAuthnMode === "authenticate"
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            Use Existing
                          </button>
                        </div>
                      </div>

                      {webAuthnMode === "register" && (
                        <div className="mb-3">
                          <label className="text-[13px] font-medium mb-1.5 block">
                            Username (optional):
                          </label>
                          <input
                            type="text"
                            value={webAuthnUsername}
                            onChange={(e) =>
                              setWebAuthnUsername(e.target.value)
                            }
                            placeholder="user@example.com"
                            className="w-full px-2.5 py-2 border border-gray-300 rounded text-[12px]"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {(selectedMethod === "stytch-email" ||
                    selectedMethod === "stytch-sms" ||
                    selectedMethod === "stytch-whatsapp") && (
                    <div className="text-black">
                      {authStep === "input" && (
                        <div className="mb-3">
                          <label className="text-[13px] font-medium mb-1.5 block">
                            {selectedMethod === "stytch-email"
                              ? "Email Address:"
                              : "Phone Number:"}
                          </label>
                          <input
                            type={
                              selectedMethod === "stytch-email"
                                ? "email"
                                : "tel"
                            }
                            value={
                              selectedMethod === "stytch-email"
                                ? email
                                : phoneNumber
                            }
                            onChange={(e) =>
                              selectedMethod === "stytch-email"
                                ? setEmail(e.target.value)
                                : setPhoneNumber(e.target.value)
                            }
                            placeholder={
                              selectedMethod === "stytch-email"
                                ? "user@example.com"
                                : "+1234567890"
                            }
                            className="w-full px-2.5 py-2 border border-gray-300 rounded text-[12px]"
                          />
                        </div>
                      )}

                      {authStep === "verify" && (
                        <div className="mb-3">
                          <label className="text-[13px] font-medium mb-1.5 block">
                            Verification Code:
                          </label>
                          <input
                            type="text"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            placeholder="123456"
                            maxLength={6}
                            className="w-full px-2.5 py-2 border border-gray-300 rounded text-[14px] font-mono tracking-[0.2em] text-center"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {selectedMethod === "stytch-totp" && (
                    <div className="text-black">
                      <div className="mb-3">
                        <label className="text-[13px] font-medium mb-1.5 block">
                          Stytch User ID:
                        </label>
                        <input
                          type="text"
                          value={userId}
                          onChange={(e) => setUserId(e.target.value)}
                          placeholder="user-test-uuid-1234"
                          className="w-full px-2.5 py-2 border border-gray-300 rounded text-[12px] font-mono"
                        />
                      </div>

                      <div className="mb-3">
                        <label className="text-[13px] font-medium mb-1.5 block">
                          TOTP Code:
                        </label>
                        <input
                          type="text"
                          value={totpCode}
                          onChange={(e) => setTotpCode(e.target.value)}
                          placeholder="123456"
                          maxLength={6}
                          className="w-full px-2.5 py-2 border border-gray-300 rounded text-[14px] font-mono tracking-[0.2em] text-center"
                        />
                      </div>
                    </div>
                  )}

                  {selectedMethod === "custom" && (
                    <div className="text-black">
                      <div className="mb-3">
                        <label className="text-[13px] font-medium mb-1.5 block">
                          PKP Public Key:
                        </label>
                        <input
                          type="text"
                          value={customPkpPublicKey}
                          onChange={(e) =>
                            setCustomPkpPublicKey(e.target.value)
                          }
                          className="w-full px-2.5 py-2 border border-gray-300 rounded text-[11px] font-mono"
                        />
                      </div>

                      <div className="mb-3">
                        <label className="text-[13px] font-medium mb-1.5 block">
                          Validation CID:
                        </label>
                        <input
                          type="text"
                          value={customValidationCid}
                          onChange={(e) =>
                            setCustomValidationCid(e.target.value)
                          }
                          className="w-full px-2.5 py-2 border border-gray-300 rounded text-[12px] font-mono"
                        />
                      </div>

                      <div className="flex gap-2 mb-3">
                        <div className="flex-1">
                          <label className="text-[13px] font-medium mb-1.5 block">
                            Username:
                          </label>
                          <input
                            type="text"
                            value={customUsername}
                            onChange={(e) => setCustomUsername(e.target.value)}
                            className="w-full px-2.5 py-2 border border-gray-300 rounded text-[12px]"
                          />
                        </div>

                        <div className="flex-1">
                          <label className="text-[13px] font-medium mb-1.5 block">
                            Password:
                          </label>
                          <input
                            type="password"
                            value={customPassword}
                            onChange={(e) => setCustomPassword(e.target.value)}
                            className="w-full px-2.5 py-2 border border-gray-300 rounded text-[12px]"
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="text-[13px] font-medium mb-1.5 block">
                          Auth Method ID:
                        </label>
                        <input
                          type="text"
                          value={customAuthMethodId}
                          onChange={(e) =>
                            setCustomAuthMethodId(e.target.value)
                          }
                          className="w-full px-2.5 py-2 border border-gray-300 rounded text-[11px] font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleAuthAction}
                  disabled={isAuthenticating}
                  className={`w-full px-3 py-2 ${
                    isAuthenticating ? "bg-gray-400" : "bg-blue-500"
                  } text-white rounded-md text-[13px] font-semibold ${
                    isAuthenticating ? "cursor-not-allowed" : "cursor-pointer"
                  } flex items-center justify-center gap-1.5`}
                >
                  {isAuthenticating && (
                    <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  )}
                  {isAuthenticating
                    ? "Connecting..."
                    : authStep === "verify"
                    ? "Verify Code"
                    : authStep === "input" &&
                      (selectedMethod === "stytch-email" ||
                        selectedMethod === "stytch-sms" ||
                        selectedMethod === "stytch-whatsapp")
                    ? "Send Code"
                    : "Connect"}
                </button>
              </div>
            )}
            <div className="text-gray-700 text-xs text-center font-bold mt-4 flex items-center justify-center gap-1">
              <span>Powered by</span>
              <img src={litPrimaryOrangeIcon} alt="Lit logo" className="h-3" />
            </div>
          </div>
        </div>
      )}
    </LitAuthContext.Provider>
  );
};
