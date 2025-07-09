/**
 * CreatingAuthContext.tsx
 *
 * A beginner-friendly guide to creating Auth Context using the three available methods.
 * Explains what Auth Context is, when to use each method, and provides interactive examples.
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  generatePrivateKey,
  privateKeyToAccount,
  type PrivateKeyAccount,
} from "viem/accounts";
import { GoogleAuthenticator } from "@lit-protocol/auth";
import { utils as litUtils } from "@lit-protocol/lit-client";
import GreyBoarderWhiteBgContainer from "../../../../components/layout/GreyboardWhiteBgContainer";
import { RequiredPackages, NoteCallout } from "../../../../components/common";
import { DisplayCode } from "../../../../components/DisplayCode";
import PkpSelectionComponent from "../../../../components/common/PkpSelectionComponent";
import { pageStyles } from "../../../../styles/pageStyles";
import { useAppContext } from "../../../../router";

const CUSTOM_LIT_ACTION_CODE = `(async () => {

  // 1. Set your unique authMethodType eg. keccak256(toBytes("<your_unique_app_name>"))
  const dAppUniqueAuthMethodType = "0x22b562b86d5d467a9f06c3f20137b37ed13981f63bd5dbdf6fc1e0fb97015401";
  
  // 2. Get the params from jsParams
  const { pkpPublicKey, username, password, authMethodId } = jsParams;
  
  // 3. Validate the user with your IdP provider.
  // In a real-life scenario, you would make a fetch request to your IdP provider to validate the user.
  const EXPECTED_USERNAME = 'alice';
  const EXPECTED_PASSWORD = 'lit';

  const userIsValid = username === EXPECTED_USERNAME && password === EXPECTED_PASSWORD;

  // 4. Auth Method Validation
  const tokenId = await Lit.Actions.pubkeyToTokenId({ publicKey: pkpPublicKey });

  const permittedAuthMethods = await Lit.Actions.getPermittedAuthMethods({ tokenId });

  const isPermitted = permittedAuthMethods.some((permittedAuthMethod) => {
    if (permittedAuthMethod["auth_method_type"] === dAppUniqueAuthMethodType && 
      permittedAuthMethod["id"] === authMethodId) {
    return true;
    }
    return false;
  });

  const isValid = isPermitted && userIsValid;

  // 5. return
  LitActions.setResponse({ response: isValid ? "true" : "false" });
})();`;

interface AuthMethod {
  key: string;
  name: string;
  description: string;
  detailedDescription: React.ReactNode;
  icon: string;
  code: string;
}

interface GoogleAuthData {
  authMethodType: bigint;
  accessToken: string;
  authMethodId: string;
  publicKey?: string;
  metadata?: unknown;
}

// Use PKPInfo from PkpSelectionComponent
interface PKPInfo {
  tokenId: string;
  publicKey: string;
  ethAddress: string;
  pubkey?: string; // Alternative naming
}

const CreatingAuthContext: React.FC = () => {
  const { areDependenciesLoaded, assertDependenciesLoaded, showError } =
    useAppContext();

  const [selectedMethod, setSelectedMethod] = useState<string>("eoa");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [authStatus, setAuthStatus] = useState<string>("Not initialized");
  const [authResult, setAuthResult] = useState<unknown>(null);
  const [showLitActionModal, setShowLitActionModal] = useState<boolean>(false);

  // EOA-specific state
  const [userAccount, setUserAccount] = useState<PrivateKeyAccount | null>(
    null
  );
  const [userPrivateKey, setUserPrivateKey] = useState<string | null>(null);

  // PKP-specific state
  const [isSigningInWithGoogle, setIsSigningInWithGoogle] = useState(false);
  const [googleAuthData, setGoogleAuthData] = useState<GoogleAuthData | null>(
    null
  );
  const [pkpInfo, setPkpInfo] = useState<PKPInfo | null>(null);

  // Custom auth PKP state
  const [customPkpInfo, setCustomPkpInfo] = useState<PKPInfo | null>(null);
  const [customAuthData, setCustomAuthData] = useState<{
    authMethodType: bigint;
    authMethodId: string;
  } | null>(null);

  // Function to get updated code examples with actual PKP public keys
  const getAuthMethods = (): Record<string, AuthMethod> => {
    const pkpPublicKey = pkpInfo?.pubkey || pkpInfo?.publicKey || "0x...";
    const customPkpPublicKey =
      customPkpInfo?.pubkey || customPkpInfo?.publicKey || "0x...";

    return {
      eoa: {
        key: "eoa",
        name: "EOA Auth Context",
        description: "Authenticate using an Ethereum wallet like MetaMask",
        detailedDescription: (
          <>
            Creates an Auth Context using an{" "}
            <strong>Externally Owned Account</strong> (EOA) - a regular Ethereum
            wallet like MetaMask, WalletConnect, or Coinbase Wallet. This is the
            most common method for web applications where users already have
            crypto wallets.
          </>
        ),
        icon: "🦊",
        code: `import { createAuthManager, storagePlugins } from "@lit-protocol/auth";
import { createLitClient } from "@lit-protocol/lit-client";
import { nagaDev } from "@lit-protocol/networks";
import { privateKeyToAccount } from "viem/accounts";

const litClient = await createLitClient({
  network: nagaDev
});

const authManager = createAuthManager({
  storage: storagePlugins.localStorage({
    appName: "my-app",
    networkName: import.meta.env.VITE_LIT_NETWORK || "naga-dev",
  }),
});

const myAccount = privateKeyToAccount("${
          userPrivateKey || "YOUR_PRIVATE_KEY_HERE"
        }" as \`0x\${string}\`);

const eoaAuthContext = await authManager.createEoaAuthContext({
  config: {
    account: myAccount,
  },
  authConfig: {
      statement: 'I authorize the Lit Protocol to execute this Lit Action.',
      domain: 'example.com',
      resources: [
        ['lit-action-execution', '*'],
        ['pkp-signing', '*'],
        ['access-control-condition-decryption', '*'],
      ],
      capabilityAuthSigs: [],
      expiration: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
    },
  litClient,
});`,
      },
      pkp: {
        key: "pkp",
        name: "PKP Auth Context",
        description: "Authenticate using a Programmable Key Pair",
        detailedDescription: (
          <>
            <>
              Authenticate using a <strong>Programmable Key Pair</strong> (PKP)
              — a blockchain account that's controlled by code, not a
              user-managed private key. PKPs can be created from familiar auth
              methods like Google, Discord, GitHub, email, or phone numbers,
              making them perfect for onboarding users without requiring wallets
              or seed phrases.
            </>
          </>
        ),
        icon: "🔑",
        code: `import { createAuthManager, GoogleAuthenticator, storagePlugins } from "@lit-protocol/auth";
import { createLitClient } from "@lit-protocol/lit-client";
import { nagaDev } from "@lit-protocol/networks";

const litClient = await createLitClient({
  network: nagaDev
});

const authManager = createAuthManager({
  storage: storagePlugins.localStorage({
    appName: "my-app", 
    networkName: import.meta.env.VITE_LIT_NETWORK || "naga-dev",
  }),
});

// Uses Google oAuth to authenticate the user, and returns Google oAuth metadata
const authData = await GoogleAuthenticator.authenticate(
  "https://login.litgateway.com"
);

const pkpAuthContext = await authManager.createPkpAuthContext({
  authData,
  pkpPublicKey: "${pkpPublicKey}",
  authConfig: {
      statement: 'I authorize the Lit Protocol to execute this Lit Action.',
      domain: 'example.com',
      resources: [
        ['lit-action-execution', '*'],
        ['pkp-signing', '*'],
        ['access-control-condition-decryption', '*'],
      ],
      capabilityAuthSigs: [],
      expiration: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
    },
  litClient,
});`,
      },
      custom: {
        key: "custom",
        name: "Custom Auth Context",
        description: "Create custom authentication using Lit Actions",
        detailedDescription: (
          <>
            <p>
              Creates an Auth Context using a custom <strong>Lit Action</strong>{" "}
              - a JavaScript function that runs on Lit nodes to define your own
              authentication logic.
            </p>
            <p>
              The Lit Action determines <em>when</em> a PKP is allowed to sign
              to authorize the Session Key to act on the behalf of the
              authenticated identity. This is the most flexible option, ideal
              for custom auth flows, additional social login providers, or
              app-specific conditions.
            </p>
          </>
        ),
        icon: "⚙️",
        code: `import { createAuthManager, storagePlugins } from "@lit-protocol/auth";
import { createLitClient, utils as litUtils } from "@lit-protocol/lit-client";
import { nagaDev } from "@lit-protocol/networks";

const litClient = await createLitClient({
  network: nagaDev
});

const authManager = createAuthManager({
  storage: storagePlugins.localStorage({
    appName: "my-app",
    networkName: import.meta.env.VITE_LIT_NETWORK || "naga-dev", 
  }),
});

// Generate auth data for your custom authentication method
const authData = litUtils.generateAuthData({
  uniqueDappName: 'my-supa-dupa-app-name',
  uniqueAuthMethodType: BigInt('0x22b562b86d5d467a9f06c3f20137b37ed13981f63bd5dbdf6fc1e0fb97015401'),
  userId: 'alice'
});

const customAuthContext = await authManager.createCustomAuthContext({
  pkpPublicKey: "${customPkpPublicKey}",
  authConfig: {
    statement: 'I authorize the Lit Protocol to execute this Lit Action.',
    domain: 'example.com',
    resources: [
      ['lit-action-execution', '*'],
      ['pkp-signing', '*'],
      ['access-control-condition-decryption', '*'],
    ],
    capabilityAuthSigs: [],
    expiration: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
  },
  litClient,
  customAuthParams: {
    litActionIpfsId: 'QmYLeVmwJPVs7Uebk85YdVPivMyrvoeKR6X37kyVRZUXW4',
    jsParams: {
      pkpPublicKey: "${customPkpPublicKey}", // Same PKP public key
      username: 'alice',
      password: 'lit',
      authMethodId: authData.authMethodId, // Generated using Lit utilities
    },
  },
});`,
      },
    };
  };

  const formatErrorMessage = (prefix: string, error: unknown): string => {
    let errorMessage = prefix;
    if (error instanceof Error) {
      errorMessage += error.message;
    } else if (typeof error === "object" && error !== null) {
      try {
        // Handle BigInt serialization by converting to string
        errorMessage += JSON.stringify(
          error,
          (key, value) =>
            typeof value === "bigint" ? value.toString() : value,
          2
        );
      } catch (serializationError) {
        // Fallback if JSON.stringify still fails
        errorMessage += String(error);
      }
    } else {
      errorMessage += String(error);
    }
    return errorMessage;
  };

  const createUserAccount = () => {
    try {
      const newPrivateKey = generatePrivateKey();
      const account = privateKeyToAccount(newPrivateKey);
      setUserAccount(account);
      setUserPrivateKey(newPrivateKey);
      setAuthStatus(`Account created: ${account.address}`);
      setAuthResult(null);
    } catch (error) {
      const errorMessage = formatErrorMessage(
        "Failed to create account: ",
        error
      );
      setAuthStatus(errorMessage);
      showError?.(errorMessage);
    }
  };

  const handleMethodSelect = (methodKey: string) => {
    setSelectedMethod(methodKey);
    setAuthResult(null);
    setAuthStatus("Not initialized");

    // Generate authData for custom method
    if (methodKey === "custom") {
      const authData = litUtils.generateAuthData({
        uniqueDappName: "my-supa-dupa-app-name",
        uniqueAuthMethodType: BigInt(
          "0x22b562b86d5d467a9f06c3f20137b37ed13981f63bd5dbdf6fc1e0fb97015401"
        ),
        userId: "alice",
      });

      // Keep the original authData with bigint for PKP selection component
      setCustomAuthData(authData);
    } else {
      setCustomAuthData(null);
    }
  };

  const handleCreateAuthContext = async () => {
    if (selectedMethod === "eoa") {
      if (!userAccount) {
        setAuthStatus("❌ Please create a user account first");
        return;
      }

      if (!areDependenciesLoaded()) {
        setAuthStatus(
          "❌ Lit Protocol not initialized. Please check the Dependencies tab."
        );
        return;
      }

      setIsCreating(true);
      try {
        setAuthStatus("Creating EOA Auth Context...");
        setAuthResult(null);

        const { authManager, litClient } = assertDependenciesLoaded();

        const authContext = await authManager.createEoaAuthContext({
          config: {
            account: userAccount,
          },
          authConfig: {
            domain: "example.com",
            statement:
              "I authorize the Lit Protocol to execute this Lit Action.",
            expiration: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
            resources: [
              ["lit-action-execution", "*"],
              ["pkp-signing", "*"],
              ["access-control-condition-decryption", "*"],
            ],
          },
          litClient,
        });

        console.log("✅ Auth Context created:", authContext);
        setAuthStatus(`✅ EOA Auth Context created for ${userAccount.address}`);
        setAuthResult(authContext);
      } catch (error) {
        console.error("Error creating EOA Auth Context:", error);
        const errorMessage = formatErrorMessage(
          "Failed to create EOA Auth Context: ",
          error
        );
        setAuthStatus(`❌ ${errorMessage}`);
        setAuthResult({
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        });
        showError?.(errorMessage);
      } finally {
        setIsCreating(false);
      }
    } else if (selectedMethod === "pkp") {
      await createPkpAuthContext();
    } else if (selectedMethod === "custom") {
      await createCustomAuthContext();
    } else {
      setAuthStatus("❌ Unknown authentication method selected");
    }
  };

  const signInWithGoogle = async () => {
    try {
      setIsSigningInWithGoogle(true);

      const authData = await GoogleAuthenticator.authenticate(
        "https://login.litgateway.com"
      );

      setGoogleAuthData(authData);
      setAuthStatus("✅ Successfully signed in with Google");
    } catch (error) {
      console.error("Error signing in with Google:", error);
      const errorMessage = formatErrorMessage(
        "Failed to sign in with Google: ",
        error
      );
      setAuthStatus(`❌ ${errorMessage}`);
      showError?.(errorMessage);
    } finally {
      setIsSigningInWithGoogle(false);
    }
  };

  const createPkpAuthContext = async () => {
    if (!areDependenciesLoaded() || !googleAuthData || !pkpInfo) {
      setAuthStatus(
        "❌ Please complete Google sign-in and PKP selection first"
      );
      return;
    }

    try {
      setIsCreating(true);
      setAuthStatus("Creating PKP Auth Context...");
      setAuthResult(null);

      const { authManager, litClient } = assertDependenciesLoaded();

      const pkpAuthContext = await authManager.createPkpAuthContext({
        authData: googleAuthData,
        pkpPublicKey: pkpInfo.pubkey || pkpInfo.publicKey,
        authConfig: {
          resources: [
            ["pkp-signing", "*"],
            ["lit-action-execution", "*"],
          ],
          capabilityAuthSigs: [],
          expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
          statement: "I authorize the Lit Protocol to execute this Lit Action.",
          domain: window.location.origin,
        },
        litClient: litClient,
      });

      console.log("✅ PKP Auth Context created successfully");
      setAuthStatus(`✅ PKP Auth Context created for ${pkpInfo.ethAddress}`);

      // Serialize BigInt values in the result before setting state
      const serializedResult = JSON.parse(
        JSON.stringify(pkpAuthContext, (key, value) =>
          typeof value === "bigint" ? value.toString() : value
        )
      );
      setAuthResult(serializedResult);
    } catch (error) {
      console.error("Error creating PKP auth context");

      // Safely extract error message without BigInt serialization issues
      let safeErrorMessage = "Failed to create PKP auth context: ";
      try {
        if (error instanceof Error) {
          safeErrorMessage += error.message;
        } else {
          safeErrorMessage += "Unknown error occurred";
        }
      } catch (serializationError) {
        safeErrorMessage += "Error occurred (details could not be serialized)";
      }

      setAuthStatus(`❌ ${safeErrorMessage}`);
      setAuthResult({
        success: false,
        error: safeErrorMessage,
        timestamp: new Date().toISOString(),
      });
      showError?.(safeErrorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const createCustomAuthContext = async () => {
    if (!areDependenciesLoaded() || !customPkpInfo || !customAuthData) {
      setAuthStatus(
        "❌ Please select a PKP first, then Lit Protocol dependencies must be loaded."
      );
      return;
    }

    try {
      setIsCreating(true);
      setAuthStatus("Creating Custom Auth Context...");
      setAuthResult(null);

      const { authManager, litClient } = assertDependenciesLoaded();

      const customAuthContext = await authManager.createCustomAuthContext({
        pkpPublicKey: customPkpInfo.pubkey || customPkpInfo.publicKey,
        authConfig: {
          statement: "I authorize the Lit Protocol to execute this Lit Action.",
          domain: "example.com",
          resources: [
            ["lit-action-execution", "*"],
            ["pkp-signing", "*"],
            ["access-control-condition-decryption", "*"],
          ],
          capabilityAuthSigs: [],
          expiration: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
        },
        litClient,
        customAuthParams: {
          litActionIpfsId: "QmYLeVmwJPVs7Uebk85YdVPivMyrvoeKR6X37kyVRZUXW4",
          jsParams: {
            pkpPublicKey: customPkpInfo.pubkey || customPkpInfo.publicKey,
            username: "alice",
            password: "lit",
            authMethodId: customAuthData.authMethodId,
          },
        },
      });

      console.log("✅ Custom Auth Context created:", customAuthContext);
      setAuthStatus("✅ Custom Auth Context created successfully");
      setAuthResult(customAuthContext);
    } catch (error) {
      console.error("Error creating custom auth context:", error);
      const errorMessage = formatErrorMessage(
        "Failed to create custom auth context: ",
        error
      );
      setAuthStatus(`❌ ${errorMessage}`);
      setAuthResult({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
      showError?.(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const installationCode = `npm install @lit-protocol/auth @lit-protocol/lit-client`;

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>Creating Your Auth Context</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>What is an Auth Context?</h2>
        <p style={pageStyles.p}>
          An Auth Context combines your authentication method, session keys, and
          permissions into one secure bundle that proves who you are and what
          you're allowed to do.
        </p>
        <p style={pageStyles.p}>
          Think of it like a security badge for a building - it has your photo
          (authentication), access levels (permissions), and an expiration date
          (session duration). The Auth Context is what you'll use to prove your
          identity for your network operations.
        </p>
        <p style={pageStyles.p}>
          Creating an Auth Context is the final step before you can start using
          the Lit Client for encryption, PKP operations, and running Lit
          Actions.
        </p>
      </GreyBoarderWhiteBgContainer>

      <RequiredPackages
        description="To create Auth Contexts, you'll need these packages:"
        packages={[
          {
            name: "@lit-protocol/auth",
            description:
              "Provides the Auth Manager and authentication methods for creating Auth Contexts.",
          },
          {
            name: "@lit-protocol/lit-client",
            description:
              "The Lit Client needed to communicate with the Lit network during authentication.",
          },
          {
            name: "@lit-protocol/networks",
            description:
              "Network configuration objects that define the network metadata used to connect to and communicate with the Lit networks.",
          },
        ]}
        installationCode={installationCode}
        style={{ marginTop: "32px" }}
      />

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Understanding Auth Context Components</h2>
        <p style={pageStyles.p}>
          Every Auth Context contains the same core components, regardless of
          which method of authentication you use to create it:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            marginTop: "24px",
          }}
        >
          {[
            {
              title: "Session Key Pair",
              description:
                "Cryptographic keys that represent your temporary identity. The public key is shared with Lit nodes, while the private key stays on your device.",
              icon: "🔐",
              detail:
                "Automatically generated when you create the Auth Context. These keys are used to sign requests to the Lit network on behalf of your identity.",
            },
            {
              title: "Authentication Data",
              description:
                "Information about how you proved your identity - whether through a wallet signature, email verification, or custom method.",
              icon: "🪪",
              detail:
                "Contains the auth method type, access tokens, and any metadata about your authentication.",
            },
            {
              title: "Auth Configuration",
              description:
                "Settings that define your session duration, what resources you can access, and the context of your authentication.",
              icon: "⚙️",
              detail: (
                <>
                  Includes{" "}
                  <a
                    href="https://eips.ethereum.org/EIPS/eip-5573"
                    target="_blank"
                    style={{ color: "#3b82f6", textDecoration: "underline" }}
                  >
                    ERC-5573
                  </a>{" "}
                  metadata like expiration time, domain, statement, and
                  capability signatures that define your permissions.
                </>
              ),
            },
            {
              title: "Callback Functions",
              description:
                "Special functions that handle re-authentication when your session expires or when additional authentication is needed.",
              icon: "🔄",
              detail:
                "Automatically called by the SDK when you need to refresh your authentication or grant additional permissions.",
            },
          ].map((component, index) => (
            <div
              key={index}
              style={{
                padding: "20px",
                backgroundColor: "#f8fafc",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                <div style={{ fontSize: "2rem" }}>{component.icon}</div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.2rem",
                    fontWeight: "600",
                    color: "#1f2937",
                  }}
                >
                  {component.title}
                </h3>
              </div>
              <p
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "0.95rem",
                  color: "#4b5563",
                  lineHeight: "1.5",
                }}
              >
                {component.description}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.85rem",
                  color: "#6b7280",
                  lineHeight: "1.4",
                  fontStyle: "italic",
                }}
              >
                {component.detail}
              </p>
            </div>
          ))}
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Choose Your Authentication Method</h2>
        <p style={pageStyles.p}>
          There are three ways to create an Auth Context, each designed for
          different use cases and user experiences:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            gap: "20px",
            marginTop: "24px",
            marginBottom: "24px",
          }}
        >
          {Object.entries(getAuthMethods()).map(([key, method]) => (
            <div
              key={key}
              style={{
                padding: "24px",
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                border: "2px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                <div style={{ fontSize: "2rem" }}>{method.icon}</div>
                <div style={{ flex: 1 }}>
                  <h4
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: "1.3rem",
                      fontWeight: "600",
                      color: "#1f2937",
                    }}
                  >
                    {method.name}
                  </h4>
                </div>
              </div>
              <p
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "0.95rem",
                  color: "#374151",
                  fontWeight: "500",
                }}
              >
                {method.description}
              </p>
              <p
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "0.85rem",
                  color: "#6b7280",
                  lineHeight: "1.4",
                }}
              >
                {method.detailedDescription}
              </p>
            </div>
          ))}
        </div>

        <NoteCallout
          variant="tip"
          title="Which Method Should I Choose?"
          message={
            <>
              <strong>EOA Auth Context</strong> - Choose this if your users
              already have crypto wallets (MetaMask, WalletConnect, etc.) and
              you want to leverage existing Web3 infrastructure.
              <br />
              <br />
              <strong>PKP Auth Context</strong> - Use this when you want users
              to authenticate with familiar methods like Google, Discord,
              GitHub, email, or phone numbers without needing crypto wallets or
              seed phrases.
              <br />
              <br />
              <strong>Custom Auth Context</strong> - Choose this for specialized
              authentication flows, integrating additional social login
              providers without out-of-the-box support, or when you need custom
              conditions that determine when a user is authenticated.
            </>
          }
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Create Your Auth Context</h2>
        <p style={pageStyles.p}>
          Now let's create an Auth Context using your chosen authentication
          method. This will give you everything needed to perform Lit Protocol
          operations:
        </p>

        <DisplayCode
          code={getAuthMethods()[selectedMethod].code}
          language="typescript"
          useSideBySide={true}
          renderComponent={
            <div>
              <h4
                style={{
                  marginTop: "0",
                  color: "#2c5282",
                  marginBottom: "16px",
                }}
              >
                🔧 Choose Authentication Method
              </h4>
              <p
                style={{
                  fontSize: "14px",
                  color: "#666",
                  marginBottom: "20px",
                }}
              >
                Select an authentication method to see how to create an Auth
                Context with it.
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  marginBottom: "24px",
                }}
              >
                {Object.entries(getAuthMethods()).map(([key, method]) => (
                  <button
                    key={key}
                    onClick={() => handleMethodSelect(key)}
                    style={{
                      padding: "16px",
                      backgroundColor:
                        selectedMethod === key ? "#3b82f6" : "#ffffff",
                      color: selectedMethod === key ? "white" : "#374151",
                      border: `2px solid ${
                        selectedMethod === key ? "#3b82f6" : "#d1d5db"
                      }`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                      }}
                    >
                      <div style={{ fontSize: "1.5rem" }}>{method.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "4px",
                          }}
                        >
                          <strong style={{ fontSize: "1rem" }}>
                            {method.name}
                          </strong>
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color:
                              selectedMethod === key ? "#e6f3ff" : "#6b7280",
                            marginBottom: "8px",
                            fontWeight: "500",
                          }}
                        >
                          {method.description}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color:
                              selectedMethod === key ? "#dbeafe" : "#9ca3af",
                            lineHeight: "1.4",
                          }}
                        >
                          {method.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Account Creation - only show for EOA method */}
              {selectedMethod === "eoa" && (
                <div style={{ marginBottom: "20px" }}>
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      marginBottom: "12px",
                    }}
                  >
                    <h5
                      style={{
                        margin: "0 0 8px 0",
                        color: "#374151",
                        fontSize: "0.9rem",
                      }}
                    >
                      👤 User Account
                    </h5>
                    {userAccount ? (
                      <div>
                        <p
                          style={{
                            margin: "0 0 8px 0",
                            fontSize: "0.8rem",
                            color: "#6b7280",
                          }}
                        >
                          Account Address:
                        </p>
                        <code
                          style={{
                            padding: "4px 8px",
                            backgroundColor: "#e5e7eb",
                            borderRadius: "4px",
                            fontSize: "0.8rem",
                            color: "#374151",
                            wordBreak: "break-all",
                          }}
                        >
                          {userAccount.address}
                        </code>
                        <div style={{ marginTop: "8px" }}>
                          <button
                            onClick={createUserAccount}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#f3f4f6",
                              color: "#374151",
                              border: "1px solid #d1d5db",
                              borderRadius: "4px",
                              fontSize: "0.8rem",
                              cursor: "pointer",
                            }}
                          >
                            🔄 Generate New Account
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={createUserAccount}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "0.9rem",
                          fontWeight: "500",
                          cursor: "pointer",
                          width: "100%",
                        }}
                      >
                        🔑 Create User Account
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* PKP Method Flow - only show for PKP method */}
              {selectedMethod === "pkp" && (
                <div style={{ marginBottom: "20px" }}>
                  {/* Step 1: Google Sign-in */}
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      marginBottom: "12px",
                    }}
                  >
                    <h5
                      style={{
                        margin: "0 0 8px 0",
                        color: "#374151",
                        fontSize: "0.9rem",
                      }}
                    >
                      1. Google Authentication
                    </h5>
                    {googleAuthData ? (
                      <div>
                        <p
                          style={{
                            margin: "0 0 8px 0",
                            fontSize: "0.8rem",
                            color: "#16a34a",
                          }}
                        >
                          ✅ Successfully signed in with Google
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={signInWithGoogle}
                        disabled={isSigningInWithGoogle}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: isSigningInWithGoogle
                            ? "#9ca3af"
                            : "#4285f4",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "0.9rem",
                          fontWeight: "500",
                          cursor: isSigningInWithGoogle
                            ? "not-allowed"
                            : "pointer",
                          width: "100%",
                        }}
                      >
                        {isSigningInWithGoogle
                          ? "🔄 Signing in..."
                          : "🔑 Sign in with Google"}
                      </button>
                    )}
                  </div>

                  {/* Step 2: PKP Selection/Minting using PkpSelectionComponent */}
                  {googleAuthData && (
                    <div
                      style={{
                        padding: "16px",
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        marginBottom: "12px",
                      }}
                    >
                      <h5
                        style={{
                          margin: "0 0 8px 0",
                          color: "#374151",
                          fontSize: "0.9rem",
                        }}
                      >
                        2. PKP Selection
                      </h5>
                      <PkpSelectionComponent
                        authData={googleAuthData}
                        accountMethod={undefined}
                        onPkpSelected={(pkpInfo: PKPInfo) => {
                          setPkpInfo(pkpInfo);
                          setAuthStatus(
                            `✅ PKP selected: ${pkpInfo.ethAddress}`
                          );
                          // Clear any existing auth context result
                          setAuthResult(null);
                        }}
                        setStatus={setAuthStatus}
                        assertDependenciesLoaded={assertDependenciesLoaded}
                        showError={showError}
                        authMethodName="Google Auth"
                        disabled={false}
                        showDisplayCode={false}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Custom Auth PKP Selection - only show when custom is selected */}
              {selectedMethod === "custom" && (
                <div style={{ marginBottom: "20px" }}>
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      marginBottom: "12px",
                    }}
                  >
                    <h5
                      style={{
                        margin: "0 0 8px 0",
                        color: "#374151",
                        fontSize: "0.9rem",
                      }}
                    >
                      🔑 PKP Selection for Custom Auth
                    </h5>
                    <p
                      style={{
                        margin: "0 0 12px 0",
                        fontSize: "0.8rem",
                        color: "#6b7280",
                        lineHeight: "1.4",
                      }}
                    >
                      Custom Auth Context requires a PKP to validate the Lit
                      Action. Select or mint a PKP to continue.
                    </p>
                    <PkpSelectionComponent
                      authData={customAuthData}
                      accountMethod={undefined}
                      setStatus={(status: string) => setAuthStatus(status)}
                      assertDependenciesLoaded={assertDependenciesLoaded}
                      authMethodName="Custom Auth"
                      onPkpSelected={(pkpInfo: PKPInfo) => {
                        setCustomPkpInfo(pkpInfo);
                        setAuthResult(null);
                        setAuthStatus("PKP selected for custom auth");
                      }}
                      showDisplayCode={false}
                    />
                    {customPkpInfo && (
                      <div style={{ marginTop: "12px" }}>
                        <p
                          style={{
                            margin: "0 0 4px 0",
                            fontSize: "0.8rem",
                            color: "#16a34a",
                          }}
                        >
                          ✅ PKP Selected: {customPkpInfo.ethAddress}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Custom Lit Action Button - only show when custom is selected */}
              {selectedMethod === "custom" && (
                <div style={{ marginBottom: "20px" }}>
                  <button
                    onClick={() => setShowLitActionModal(true)}
                    style={{
                      padding: "12px 20px",
                      backgroundColor: "#ffffff",
                      color: "#3b82f6",
                      border: "2px solid #3b82f6",
                      borderRadius: "8px",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    📋 View Custom Lit Action
                  </button>
                </div>
              )}

              {/* Auth Context Status */}
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  marginBottom: "20px",
                }}
              >
                <h5
                  style={{
                    margin: "0 0 8px 0",
                    color: "#374151",
                    fontSize: "0.9rem",
                  }}
                >
                  🔧 Auth Context Status
                </h5>
                <p
                  style={{
                    margin: "0",
                    fontFamily: "monospace",
                    fontSize: "13px",
                    padding: "8px 12px",
                    backgroundColor: authStatus.includes("✅")
                      ? "#dcfce7"
                      : authStatus.includes("❌")
                      ? "#fee2e2"
                      : "#fef3c7",
                    borderRadius: "6px",
                    border: `1px solid ${
                      authStatus.includes("✅")
                        ? "#bbf7d0"
                        : authStatus.includes("❌")
                        ? "#fecaca"
                        : "#fde68a"
                    }`,
                    color: authStatus.includes("✅")
                      ? "#166534"
                      : authStatus.includes("❌")
                      ? "#991b1b"
                      : "#92400e",
                  }}
                >
                  {authStatus}
                </p>
              </div>

              <button
                onClick={handleCreateAuthContext}
                disabled={
                  isCreating ||
                  (selectedMethod === "eoa" && !userAccount) ||
                  (selectedMethod === "pkp" && (!googleAuthData || !pkpInfo)) ||
                  (selectedMethod === "custom" &&
                    (!customPkpInfo || !customAuthData))
                }
                style={{
                  padding: "14px 24px",
                  backgroundColor:
                    isCreating ||
                    (selectedMethod === "eoa" && !userAccount) ||
                    (selectedMethod === "pkp" &&
                      (!googleAuthData || !pkpInfo)) ||
                    (selectedMethod === "custom" &&
                      (!customPkpInfo || !customAuthData))
                      ? "#6b7280"
                      : "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor:
                    isCreating ||
                    (selectedMethod === "eoa" && !userAccount) ||
                    (selectedMethod === "pkp" &&
                      (!googleAuthData || !pkpInfo)) ||
                    (selectedMethod === "custom" &&
                      (!customPkpInfo || !customAuthData))
                      ? "not-allowed"
                      : "pointer",
                  transition: "background-color 0.2s",
                  width: "100%",
                }}
              >
                {isCreating
                  ? "Creating Auth Context..."
                  : `🚀 Create ${getAuthMethods()[selectedMethod].name}`}
              </button>
            </div>
          }
          resultData={authResult}
          resultLabel={authResult ? "Auth Context" : undefined}
          isSuccess={Boolean(authResult && authStatus.includes("✅"))}
          isError={Boolean(authResult && authStatus.includes("❌"))}
        />
      </GreyBoarderWhiteBgContainer>

      {/* Next Steps */}
      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>
          Next Step: Start Building with Lit Protocol
        </h2>
        <p style={pageStyles.p}>
          Congratulations! You now have everything needed to use Lit Protocol: a
          Lit Client, an Auth Manager, and an Auth Context.
        </p>

        <p style={pageStyles.p}>
          Next checkout the guides below to try out the different features of
          Lit:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
            marginTop: "24px",
          }}
        >
          {[
            {
              title: "Encryption & Access Control",
              description:
                "Learn to encrypt sensitive data and control who can decrypt it using flexible access control conditions.",
              icon: "🔒",
              path: "/encryption/quickstart",
              color: "#3b82f6",
            },
            {
              title: "PKP Signing",
              description:
                "Discover how to use your PKPs to sign transactions and messages across multiple blockchain networks.",
              icon: "🔑",
              path: "/programmable-keys/pkps/signing/eth",
              color: "#8b5cf6",
            },
            {
              title: "Lit Actions",
              description:
                "Explore serverless JavaScript functions that can access both on-chain and off-chain data for automated workflows.",
              icon: "⚙️",
              path: "/lit-actions/quick-start",
              color: "#f59e0b",
            },
          ].map((guide, index) => (
            <div
              key={index}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                border: `2px solid ${guide.color}20`,
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                padding: "24px",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <div style={{ fontSize: "2rem" }}>{guide.icon}</div>
                <h3
                  style={{
                    margin: 0,
                    color: guide.color,
                    fontSize: "1.3rem",
                    fontWeight: "600",
                  }}
                >
                  {guide.title}
                </h3>
              </div>
              <p
                style={{
                  fontSize: "0.95rem",
                  lineHeight: "1.5",
                  color: "#6b7280",
                  marginBottom: "16px",
                }}
              >
                {guide.description}
              </p>
              <Link
                to={guide.path}
                style={{
                  display: "inline-block",
                  padding: "12px 24px",
                  backgroundColor: guide.color,
                  color: "white",
                  textDecoration: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  fontSize: "0.95rem",
                  transition: "background-color 0.2s",
                  width: "100%",
                  textAlign: "center",
                  boxSizing: "border-box",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.backgroundColor =
                    guide.color + "dd";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = guide.color;
                }}
              >
                {guide.title} Guide →
              </Link>
            </div>
          ))}
        </div>
      </GreyBoarderWhiteBgContainer>

      {/* Custom Lit Action Modal */}
      {showLitActionModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setShowLitActionModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              maxWidth: "900px",
              maxHeight: "90vh",
              width: "100%",
              overflow: "auto",
              position: "relative",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "24px 32px 0 32px",
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: "20px",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    color: "#1f2937",
                    fontSize: "1.5rem",
                    fontWeight: "600",
                  }}
                >
                  📋 Custom Lit Action - Validation Logic
                </h2>
                <button
                  onClick={() => setShowLitActionModal(false)}
                  style={{
                    background: "#f3f4f6",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    padding: "8px 12px",
                    fontSize: "14px",
                    cursor: "pointer",
                    color: "#374151",
                    fontWeight: "500",
                  }}
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div style={{ padding: "0 32px 32px 32px" }}>
              <div style={{ marginBottom: "24px" }}>
                <h3
                  style={{
                    color: "#374151",
                    marginBottom: "12px",
                    fontSize: "1.2rem",
                    fontWeight: "600",
                  }}
                >
                  How the Custom Lit Action Works
                </h3>
                <p
                  style={{
                    color: "#6b7280",
                    lineHeight: "1.6",
                    marginBottom: "20px",
                    fontSize: "1rem",
                  }}
                >
                  This Lit Action is executed by each Lit node to validate
                  whether a PKP should authorize the Session key to act on
                  behalf of the authorized identity.
                </p>

                <div
                  style={{
                    backgroundColor: "#f8fafc",
                    padding: "20px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    marginBottom: "24px",
                  }}
                >
                  <h4
                    style={{
                      color: "#374151",
                      marginBottom: "12px",
                      fontSize: "1rem",
                      fontWeight: "600",
                    }}
                  >
                    🔍 Step-by-Step Breakdown:
                  </h4>
                  <ol
                    style={{
                      color: "#6b7280",
                      paddingLeft: "20px",
                      lineHeight: "1.6",
                      margin: 0,
                    }}
                  >
                    <li style={{ marginBottom: "8px" }}>
                      <strong>Set Auth Method Type:</strong> Defines your app's
                      unique authentication identifier
                    </li>
                    <li style={{ marginBottom: "8px" }}>
                      <strong>Extract Parameters:</strong> Gets user credentials
                      and PKP info from the request
                    </li>
                    <li style={{ marginBottom: "8px" }}>
                      <strong>Validate User:</strong> Checks credentials against
                      your identity provider (simplified here)
                    </li>
                    <li style={{ marginBottom: "8px" }}>
                      <strong>Check PKP Permissions:</strong> Verifies the auth
                      method is permitted for this PKP
                    </li>
                    <li>
                      <strong>Return Result:</strong> Responds with "true" or
                      "false" for final authorization
                    </li>
                  </ol>
                </div>

                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "#fef3c7",
                    borderRadius: "8px",
                    border: "1px solid #fde68a",
                    marginBottom: "24px",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color: "#92400e",
                      fontSize: "0.9rem",
                      lineHeight: "1.5",
                    }}
                  >
                    💡 <strong>Production Note:</strong> In a real application,
                    you would make an HTTP request to your authentication
                    service instead of hardcoding credentials. This Lit Action
                    would validate tokens, check user sessions, or integrate
                    with OAuth providers.
                  </p>
                </div>
              </div>

              <h3
                style={{
                  color: "#374151",
                  marginBottom: "16px",
                  fontSize: "1.2rem",
                  fontWeight: "600",
                }}
              >
                🔧 Custom Lit Action Code
              </h3>
              <DisplayCode
                code={CUSTOM_LIT_ACTION_CODE}
                language="javascript"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatingAuthContext;
