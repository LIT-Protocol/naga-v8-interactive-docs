/**
 * LitAuthProvider.tsx
 *
 * Authentication provider that shows a modal for Lit Protocol authentication.
 * Once authenticated, users can access the main app with auth context available.
 */

import { DiscordAuthenticator, GoogleAuthenticator } from "@lit-protocol/auth";
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

// Import icon assets
import tfaIcon from "../assets/2fa.svg";
import discordIcon from "../assets/discord.png";
import emailIcon from "../assets/email.svg";
import googleIcon from "../assets/google.png";
import passkeyIcon from "../assets/passkey.svg";
import phoneIcon from "../assets/phone.svg";
import web3WalletIcon from "../assets/web3-wallet.svg";
import whatsappIcon from "../assets/whatsapp.svg";

// Configuration constants
const DEFAULT_PRIVATE_KEY =
  "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const FAUCET_URL = "https://chronicle-yellowstone-faucet.getlit.dev/";
const DEFAULT_AUTH_SERVICE_BASE_URL = "http://localhost:3301";

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
}

const LitAuthContext = createContext<LitAuthContextValue | null>(null);

export const useLitAuth = () => {
  const context = useContext(LitAuthContext);
  if (!context) {
    throw new Error("useLitAuth must be used within a LitAuthProvider");
  }
  return context;
};

interface LitAuthProviderProps {
  children: ReactNode;
  appName?: string;
  networkName?: string;
  autoSetup?: boolean;
  storageKey?: string;
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
  networkName = "naga-dev",
  autoSetup = false,
  storageKey = "lit-auth-user",
}) => {
  const { data: walletClient } = useWalletClient();

  // Setup Lit Protocol services
  const {
    services,
    isInitializing,
    error: setupError,
    setupServices,
    isReady: isServicesReady,
  } = useLitServiceSetup({
    appName,
    networkName,
    autoSetup,
  });

  // Auth state
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [showModal, setShowModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<AuthMethod | null>(null);
  const [showMethodDetail, setShowMethodDetail] = useState(false);
  const [authStep, setAuthStep] = useState<"select" | "input" | "verify">(
    "select"
  );

  // EOA specific state
  const [privateKey, setPrivateKey] = useState(DEFAULT_PRIVATE_KEY);
  const [accountMethod, setAccountMethod] = useState<"privateKey" | "wallet">(
    "privateKey"
  );

  // Stytch specific state
  const [authServiceBaseUrl, setAuthServiceBaseUrl] = useState(
    DEFAULT_AUTH_SERVICE_BASE_URL
  );
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
    "0x04b8e68a0b4b95e39b2c49f7b8c4b8b3b6f16b52e4a1e4b6b8b3b6f16b52e4a1e4b6b8b3b6f16b52e4a1e4b6b8b3b6f16b52e4a1e4b6b8b3b6f16b52e4a1e"
  );
  const [customValidationCid, setCustomValidationCid] = useState(
    "QmYLeVmwJPVs7Uebk85YdVPivMyrvoeKR6X37kyVRZUXW4"
  );
  const [customUsername, setCustomUsername] = useState("alice");
  const [customPassword, setCustomPassword] = useState("lit");
  const [customAuthMethodId, setCustomAuthMethodId] = useState(
    "0x22b562b86d5d467a9f06c3f20137b37ed13981f63bd5dbdf6fc1e0fb97015401"
  );

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
    setError(null);
    setEmail("");
    setPhoneNumber("");
    setOtpCode("");
    setTotpCode("");
    setUserId("");
    setMethodId("");
    setWebAuthnUsername("");
    setWebAuthnMode("register");
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
    setShowModal(true);
  };

  const showAuthModal = () => setShowModal(true);
  const hideAuthModal = () => resetModalState();

  const initiateAuthentication = async () => {
    try {
      // Show the modal immediately (this will show loading if services aren't ready)
      setShowModal(true);

      // If services aren't ready, set them up first
      if (!isServicesReady && !isInitializing) {
        await setupServices();
      }
    } catch (error) {
      handleError(error, "Failed to initialize Lit Protocol services");
    }
  };

  // ========== AUTHENTICATION FLOWS ==========

  const authenticateGoogle = async () => {
    try {
      setIsAuthenticating(true);
      setError(null);

      const authData = await GoogleAuthenticator.authenticate(
        "https://login.litgateway.com"
      );
      await mintAndCreateContext(authData, "google");
    } catch (error) {
      handleError(error, "Google authentication failed");
    }
  };

  const authenticateDiscord = async () => {
    try {
      setIsAuthenticating(true);
      setError(null);

      const authData = await DiscordAuthenticator.authenticate(
        "https://login.litgateway.com"
      );
      await mintAndCreateContext(authData, "discord");
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

      // Mint PKP and create context
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
          capabilityAuthSigs: [],
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
        method: "eoa",
        timestamp: Date.now(),
      };

      saveUser(userData);
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

      if (webAuthnMode === "register") {
        const { pkpInfo } = await WebAuthnAuthenticator.registerAndMintPKP({
          authServiceBaseUrl: authServiceBaseUrl,
          username: webAuthnUsername || `user-${Date.now()}`,
        });

        // For registerAndMintPKP, we need to authenticate to get authData
        const authData = await WebAuthnAuthenticator.authenticate();

        const authContext = await services!.authManager.createPkpAuthContext({
          authData,
          pkpPublicKey: pkpInfo.pubkey,
          authConfig: {
            capabilityAuthSigs: [],
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
        };

        saveUser(userData);
      } else {
        const authData = await WebAuthnAuthenticator.authenticate();
        await mintAndCreateContext(authData, "webauthn");
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
        await mintAndCreateContext(authData, selectedMethod as AuthMethod);
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

      await mintAndCreateContext(authData, "stytch-totp");
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
            capabilityAuthSigs: [],
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
      };

      saveUser(userData);
    } catch (error) {
      handleError(error, "Custom authentication failed");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const mintAndCreateContext = async (authData: any, method: AuthMethod) => {
    try {
      // Mint PKP
      const result = await services!.litClient.authService.mintWithAuth({
        authData,
      });

      // Create auth context
      const authContext = await services!.authManager.createPkpAuthContext({
        authData,
        pkpPublicKey: result.data.pubkey,
        authConfig: {
          capabilityAuthSigs: [],
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
      };

      saveUser(userData);
    } catch (error) {
      throw error;
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
    isAuthenticated: !!user,
    logout,
    isAuthenticating,
    services,
    isServicesReady,
    showAuthModal,
    hideAuthModal,
    initiateAuthentication,
    isInitializingServices: isInitializing,
  };

  // Always render children with context
  return (
    <LitAuthContext.Provider value={contextValue}>
      {children}

      {/* Setup loading overlay */}
      {!isServicesReady && showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "40px",
              textAlign: "center",
              maxWidth: "400px",
              margin: "20px",
            }}
          >
            {setupError ? (
              <div>
                <h3 style={{ color: "#dc3545", marginBottom: "20px" }}>
                  ⚠️ Setup Failed
                </h3>
                <p style={{ color: "#666", marginBottom: "20px" }}>
                  {setupError}
                </p>
                <button
                  onClick={setupServices}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    cursor: "pointer",
                  }}
                >
                  Retry Setup
                </button>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    border: "4px solid #e3e3e3",
                    borderTop: "4px solid #007bff",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 20px",
                  }}
                />
                <h3 style={{ color: "#333", marginBottom: "10px" }}>
                  Setting up Lit Protocol
                </h3>
                <p style={{ color: "#666", margin: 0 }}>
                  Initializing services...
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Authentication Modal */}
      {showModal && isServicesReady && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              resetModalState();
            }
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "28px",
              maxWidth: "32rem",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              border: "1px solid #e5e7eb",
            }}
          >
            {!showMethodDetail ? (
              // Main method selection
              <div>
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <h2
                    style={{
                      fontSize: "22px",
                      fontWeight: "700",
                      marginBottom: "6px",
                      color: "#111827",
                      lineHeight: "1.2",
                    }}
                  >
                    Connect to Lit Protocol
                  </h2>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#6b7280",
                      lineHeight: "1.4",
                      margin: 0,
                    }}
                  >
                    Create a wallet secured by accounts you already have
                  </p>
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

                <div
                  style={{ display: "grid", gap: "8px", marginBottom: "16px" }}
                >
                  {authMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => handleMethodSelect(method.id)}
                      disabled={
                        !method.available ||
                        isAuthenticating ||
                        (method.id === "webauthn" && isFido2Available === false)
                      }
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "8px 12px",
                        backgroundColor:
                          method.available &&
                          !isAuthenticating &&
                          !(
                            method.id === "webauthn" &&
                            isFido2Available === false
                          )
                            ? "white"
                            : "#f9fafb",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        cursor:
                          method.available &&
                          !isAuthenticating &&
                          !(
                            method.id === "webauthn" &&
                            isFido2Available === false
                          )
                            ? "pointer"
                            : "not-allowed",
                        opacity:
                          method.available &&
                          !isAuthenticating &&
                          !(
                            method.id === "webauthn" &&
                            isFido2Available === false
                          )
                            ? 1
                            : 0.6,
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        transition: "all 0.2s",
                        textAlign: "left",
                        minHeight: "44px",
                      }}
                      onMouseEnter={(e) => {
                        if (
                          method.available &&
                          !isAuthenticating &&
                          !(
                            method.id === "webauthn" &&
                            isFido2Available === false
                          )
                        ) {
                          e.currentTarget.style.backgroundColor = "#f3f4f6";
                          e.currentTarget.style.borderColor = "#9ca3af";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (
                          method.available &&
                          !isAuthenticating &&
                          !(
                            method.id === "webauthn" &&
                            isFido2Available === false
                          )
                        ) {
                          e.currentTarget.style.backgroundColor = "white";
                          e.currentTarget.style.borderColor = "#d1d5db";
                        }
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <img
                          src={method.icon}
                          alt={method.name}
                          style={{
                            width: "24px",
                            height: "24px",
                            objectFit: "contain",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "600",
                            lineHeight: "1.2",
                            textAlign: "center",
                          }}
                        >
                          {method.name}
                          {method.comingSoon && (
                            <span
                              style={{
                                fontSize: "12px",
                                color: "#6b7280",
                                fontWeight: "400",
                                marginLeft: "4px",
                              }}
                            >
                              (Soon)
                            </span>
                          )}
                          {method.id === "webauthn" &&
                            isFido2Available === false && (
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: "#dc2626",
                                  fontWeight: "400",
                                  marginLeft: "4px",
                                }}
                              >
                                (Not Available)
                              </span>
                            )}
                        </span>
                      </div>
                      <div
                        style={{
                          width: "40px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {isAuthenticating && selectedMethod === method.id && (
                          <div
                            style={{
                              width: "16px",
                              height: "16px",
                              border: "2px solid #e5e7eb",
                              borderTop: "2px solid #3b82f6",
                              borderRadius: "50%",
                              animation: "spin 1s linear infinite",
                            }}
                          />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div
                  style={{
                    textAlign: "center",
                    marginTop: "16px",
                    fontSize: "11px",
                    color: "#6b7280",
                  }}
                >
                  Press ESC to close
                </div>
              </div>
            ) : (
              // Method detail forms
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
                    <img
                      src={
                        authMethods.find((m) => m.id === selectedMethod)?.icon
                      }
                      alt={
                        authMethods.find((m) => m.id === selectedMethod)?.name
                      }
                      style={{
                        width: "20px",
                        height: "20px",
                        objectFit: "contain",
                        marginRight: "8px",
                        verticalAlign: "middle",
                      }}
                    />
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

                {/* Form content based on selected method and step */}
                {selectedMethod === "eoa" && (
                  <div>
                    <div style={{ marginBottom: "16px" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          marginBottom: "10px",
                        }}
                      >
                        <button
                          onClick={() => setAccountMethod("privateKey")}
                          style={{
                            padding: "6px 12px",
                            backgroundColor:
                              accountMethod === "privateKey"
                                ? "#3b82f6"
                                : "#f3f4f6",
                            color:
                              accountMethod === "privateKey"
                                ? "white"
                                : "#374151",
                            border: "1px solid #d1d5db",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          Private Key
                        </button>
                        <button
                          onClick={() => setAccountMethod("wallet")}
                          style={{
                            padding: "6px 12px",
                            backgroundColor:
                              accountMethod === "wallet"
                                ? "#3b82f6"
                                : "#f3f4f6",
                            color:
                              accountMethod === "wallet" ? "white" : "#374151",
                            border: "1px solid #d1d5db",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          Wallet
                        </button>
                      </div>

                      {accountMethod === "privateKey" ? (
                        <div>
                          <input
                            type="password"
                            value={privateKey}
                            onChange={(e) => setPrivateKey(e.target.value)}
                            placeholder="0x..."
                            style={{
                              width: "100%",
                              padding: "8px",
                              border: "1px solid #d1d5db",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontFamily: "monospace",
                            }}
                          />
                          <p
                            style={{
                              fontSize: "10px",
                              color: "#6b7280",
                              margin: "4px 0 0 0",
                            }}
                          >
                            Test key provided. Get tokens from{" "}
                            <a
                              href={FAUCET_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#3b82f6" }}
                            >
                              faucet
                            </a>
                          </p>
                        </div>
                      ) : (
                        <div>
                          <ConnectButton />
                          {!walletClient?.account && (
                            <p
                              style={{
                                fontSize: "10px",
                                color: "#6b7280",
                                margin: "4px 0 0 0",
                              }}
                            >
                              Please connect your wallet
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleAuthAction}
                      disabled={
                        isAuthenticating ||
                        (accountMethod === "wallet" && !walletClient?.account)
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        backgroundColor: isAuthenticating
                          ? "#9ca3af"
                          : "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: isAuthenticating ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      {isAuthenticating && (
                        <div
                          style={{
                            width: "12px",
                            height: "12px",
                            border: "2px solid #ffffff40",
                            borderTop: "2px solid #ffffff",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                          }}
                        />
                      )}
                      {isAuthenticating ? "Connecting..." : "Connect"}
                    </button>
                  </div>
                )}

                {selectedMethod === "webauthn" && (
                  <div>
                    <div style={{ marginBottom: "16px" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          marginBottom: "10px",
                        }}
                      >
                        <button
                          onClick={() => setWebAuthnMode("register")}
                          style={{
                            padding: "6px 12px",
                            backgroundColor:
                              webAuthnMode === "register"
                                ? "#3b82f6"
                                : "#f3f4f6",
                            color:
                              webAuthnMode === "register" ? "white" : "#374151",
                            border: "1px solid #d1d5db",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          Register New
                        </button>
                        <button
                          onClick={() => setWebAuthnMode("authenticate")}
                          style={{
                            padding: "6px 12px",
                            backgroundColor:
                              webAuthnMode === "authenticate"
                                ? "#3b82f6"
                                : "#f3f4f6",
                            color:
                              webAuthnMode === "authenticate"
                                ? "white"
                                : "#374151",
                            border: "1px solid #d1d5db",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          Authenticate
                        </button>
                      </div>

                      {webAuthnMode === "register" && (
                        <div>
                          <input
                            type="text"
                            value={webAuthnUsername}
                            onChange={(e) =>
                              setWebAuthnUsername(e.target.value)
                            }
                            placeholder="Username (optional)"
                            style={{
                              width: "100%",
                              padding: "8px",
                              border: "1px solid #d1d5db",
                              borderRadius: "4px",
                              fontSize: "12px",
                            }}
                          />
                          <p
                            style={{
                              fontSize: "10px",
                              color: "#6b7280",
                              margin: "4px 0 0 0",
                            }}
                          >
                            Username for your WebAuthn credential
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleAuthAction}
                      disabled={isAuthenticating || isFido2Available === false}
                      style={{
                        width: "100%",
                        padding: "10px",
                        backgroundColor:
                          isAuthenticating || isFido2Available === false
                            ? "#9ca3af"
                            : "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor:
                          isAuthenticating || isFido2Available === false
                            ? "not-allowed"
                            : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      {isAuthenticating && (
                        <div
                          style={{
                            width: "12px",
                            height: "12px",
                            border: "2px solid #ffffff40",
                            borderTop: "2px solid #ffffff",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                          }}
                        />
                      )}
                      {isAuthenticating
                        ? "Processing..."
                        : webAuthnMode === "register"
                        ? "Register & Mint PKP"
                        : "Authenticate"}
                    </button>
                  </div>
                )}

                {(selectedMethod === "stytch-email" ||
                  selectedMethod === "stytch-sms" ||
                  selectedMethod === "stytch-whatsapp") && (
                  <div>
                    {authStep === "input" && (
                      <div>
                        <div style={{ marginBottom: "12px" }}>
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
                                ? "your@email.com"
                                : "+1234567890"
                            }
                            style={{
                              width: "100%",
                              padding: "8px",
                              border: "1px solid #d1d5db",
                              borderRadius: "4px",
                              fontSize: "12px",
                            }}
                          />
                        </div>
                        <div style={{ marginBottom: "12px" }}>
                          <input
                            type="url"
                            value={authServiceBaseUrl}
                            onChange={(e) =>
                              setAuthServiceBaseUrl(e.target.value)
                            }
                            placeholder="http://localhost:3301"
                            style={{
                              width: "100%",
                              padding: "8px",
                              border: "1px solid #d1d5db",
                              borderRadius: "4px",
                              fontSize: "12px",
                            }}
                          />
                          <p
                            style={{
                              fontSize: "10px",
                              color: "#6b7280",
                              margin: "4px 0 0 0",
                            }}
                          >
                            Auth service URL
                          </p>
                        </div>
                      </div>
                    )}

                    {authStep === "verify" && (
                      <div>
                        <div style={{ marginBottom: "12px" }}>
                          <input
                            type="text"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            placeholder="123456"
                            maxLength={6}
                            style={{
                              width: "100%",
                              padding: "8px",
                              border: "1px solid #d1d5db",
                              borderRadius: "4px",
                              fontSize: "14px",
                              fontFamily: "monospace",
                              letterSpacing: "2px",
                              textAlign: "center",
                            }}
                          />
                          <p
                            style={{
                              fontSize: "10px",
                              color: "#6b7280",
                              margin: "4px 0 0 0",
                            }}
                          >
                            Enter the verification code
                          </p>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleAuthAction}
                      disabled={
                        isAuthenticating ||
                        (authStep === "input" &&
                          (selectedMethod === "stytch-email"
                            ? !email
                            : !phoneNumber)) ||
                        (authStep === "verify" && !otpCode)
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        backgroundColor: isAuthenticating
                          ? "#9ca3af"
                          : "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: isAuthenticating ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      {isAuthenticating && (
                        <div
                          style={{
                            width: "12px",
                            height: "12px",
                            border: "2px solid #ffffff40",
                            borderTop: "2px solid #ffffff",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                          }}
                        />
                      )}
                      {isAuthenticating
                        ? authStep === "input"
                          ? "Sending..."
                          : "Verifying..."
                        : authStep === "input"
                        ? "Send Code"
                        : "Verify & Create PKP"}
                    </button>
                  </div>
                )}

                {selectedMethod === "stytch-totp" && (
                  <div>
                    <div style={{ marginBottom: "12px" }}>
                      <input
                        type="text"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="Stytch User ID"
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1px solid #d1d5db",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: "12px" }}>
                      <input
                        type="text"
                        value={totpCode}
                        onChange={(e) => setTotpCode(e.target.value)}
                        placeholder="123456"
                        maxLength={6}
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1px solid #d1d5db",
                          borderRadius: "4px",
                          fontSize: "14px",
                          fontFamily: "monospace",
                          letterSpacing: "2px",
                          textAlign: "center",
                        }}
                      />
                      <p
                        style={{
                          fontSize: "10px",
                          color: "#6b7280",
                          margin: "4px 0 0 0",
                        }}
                      >
                        TOTP code from authenticator app
                      </p>
                    </div>
                    <div style={{ marginBottom: "12px" }}>
                      <input
                        type="url"
                        value={authServiceBaseUrl}
                        onChange={(e) => setAuthServiceBaseUrl(e.target.value)}
                        placeholder="http://localhost:3301"
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1px solid #d1d5db",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      />
                    </div>

                    <button
                      onClick={handleAuthAction}
                      disabled={isAuthenticating || !userId || !totpCode}
                      style={{
                        width: "100%",
                        padding: "10px",
                        backgroundColor:
                          isAuthenticating || !userId || !totpCode
                            ? "#9ca3af"
                            : "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor:
                          isAuthenticating || !userId || !totpCode
                            ? "not-allowed"
                            : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      {isAuthenticating && (
                        <div
                          style={{
                            width: "12px",
                            height: "12px",
                            border: "2px solid #ffffff40",
                            borderTop: "2px solid #ffffff",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                          }}
                        />
                      )}
                      {isAuthenticating
                        ? "Authenticating..."
                        : "Authenticate with TOTP"}
                    </button>
                  </div>
                )}

                {selectedMethod === "custom" && (
                  <div>
                    {/* Info about custom auth */}
                    <div
                      style={{
                        padding: "12px",
                        backgroundColor: "#fef3c7",
                        border: "1px solid #f59e0b",
                        borderRadius: "6px",
                        marginBottom: "16px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          marginBottom: "4px",
                        }}
                      >
                        ⚙️ Custom Auth - Example Interface
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#92400e",
                          lineHeight: "1.4",
                        }}
                      >
                        This is just an example interface for testing custom
                        authentication concepts. For real implementation, dApp
                        owners must follow the complete setup process in the{" "}
                        <strong>Custom Authentication Tab</strong> including PKP
                        minting and validation logic creation.
                      </div>
                    </div>

                    {/* Custom auth parameters form */}
                    <div style={{ marginBottom: "12px" }}>
                      <label
                        style={{
                          fontSize: "11px",
                          fontWeight: "500",
                          marginBottom: "4px",
                          display: "block",
                        }}
                      >
                        PKP Public Key:
                      </label>
                      <input
                        type="text"
                        value={customPkpPublicKey}
                        onChange={(e) => setCustomPkpPublicKey(e.target.value)}
                        placeholder="0x04..."
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          border: "1px solid #d1d5db",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontFamily: "monospace",
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: "12px" }}>
                      <label
                        style={{
                          fontSize: "11px",
                          fontWeight: "500",
                          marginBottom: "4px",
                          display: "block",
                        }}
                      >
                        Validation IPFS CID:
                      </label>
                      <input
                        type="text"
                        value={customValidationCid}
                        onChange={(e) => setCustomValidationCid(e.target.value)}
                        placeholder="QmYour..."
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          border: "1px solid #d1d5db",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontFamily: "monospace",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "8px",
                        marginBottom: "12px",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            fontSize: "11px",
                            fontWeight: "500",
                            marginBottom: "4px",
                            display: "block",
                          }}
                        >
                          Username:
                        </label>
                        <input
                          type="text"
                          value={customUsername}
                          onChange={(e) => setCustomUsername(e.target.value)}
                          placeholder="alice"
                          style={{
                            width: "100%",
                            padding: "6px 8px",
                            border: "1px solid #d1d5db",
                            borderRadius: "4px",
                            fontSize: "12px",
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            fontSize: "11px",
                            fontWeight: "500",
                            marginBottom: "4px",
                            display: "block",
                          }}
                        >
                          Password:
                        </label>
                        <input
                          type="text"
                          value={customPassword}
                          onChange={(e) => setCustomPassword(e.target.value)}
                          placeholder="lit"
                          style={{
                            width: "100%",
                            padding: "6px 8px",
                            border: "1px solid #d1d5db",
                            borderRadius: "4px",
                            fontSize: "12px",
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <label
                        style={{
                          fontSize: "11px",
                          fontWeight: "500",
                          marginBottom: "4px",
                          display: "block",
                        }}
                      >
                        Auth Method ID:
                      </label>
                      <input
                        type="text"
                        value={customAuthMethodId}
                        onChange={(e) => setCustomAuthMethodId(e.target.value)}
                        placeholder="0x..."
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          border: "1px solid #d1d5db",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontFamily: "monospace",
                        }}
                      />
                    </div>

                    <button
                      onClick={handleAuthAction}
                      disabled={
                        isAuthenticating ||
                        !customPkpPublicKey ||
                        !customValidationCid ||
                        !customUsername ||
                        !customPassword ||
                        !customAuthMethodId
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        backgroundColor:
                          isAuthenticating ||
                          !customPkpPublicKey ||
                          !customValidationCid ||
                          !customUsername ||
                          !customPassword ||
                          !customAuthMethodId
                            ? "#9ca3af"
                            : "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor:
                          isAuthenticating ||
                          !customPkpPublicKey ||
                          !customValidationCid ||
                          !customUsername ||
                          !customPassword ||
                          !customAuthMethodId
                            ? "not-allowed"
                            : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      {isAuthenticating && (
                        <div
                          style={{
                            width: "12px",
                            height: "12px",
                            border: "2px solid #ffffff40",
                            borderTop: "2px solid #ffffff",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                          }}
                        />
                      )}
                      {isAuthenticating
                        ? "Authenticating..."
                        : "Test Custom Auth"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </LitAuthContext.Provider>
  );
};
