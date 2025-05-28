/**
 * AuthModal.tsx
 *
 * Unified authentication modal that provides access to all supported authentication methods.
 * Handles the complete authentication flow and PKP management for each method.
 */

import React, { useState } from "react";
import { GoogleAuthenticator, DiscordAuthenticator } from "@lit-protocol/auth";
import { privateKeyToAccount } from "viem/accounts";
import { useWalletClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import PkpSigningComponent from "./common/PkpSigningComponent";

// Import icon assets
import googleIcon from "../assets/google.png";
import discordIcon from "../assets/discord.png";
import web3WalletIcon from "../assets/web3-wallet.svg";
import passkeyIcon from "../assets/passkey.svg";

// Configuration constants
const DEFAULT_PRIVATE_KEY =
  "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const FAUCET_URL = "https://chronicle-yellowstone-faucet.getlit.dev/";

type AuthMethod = "google" | "discord" | "eoa" | "eoa-native" | "custom";
type AuthStep =
  | "select"
  | "authenticate"
  | "mint"
  | "context"
  | "sign"
  | "complete";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: (authContext: any, pkpInfo: any, method: AuthMethod) => void;
  litClient: any;
  authManager: any;
}

interface AuthMethodInfo {
  id: AuthMethod;
  name: string;
  icon: string;
  description: string;
  color: string;
  available: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  litClient,
  authManager,
}) => {
  const { data: walletClient } = useWalletClient();

  // State management
  const [currentStep, setCurrentStep] = useState<AuthStep>("select");
  const [selectedMethod, setSelectedMethod] = useState<AuthMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth data state
  const [authData, setAuthData] = useState<any>(null);
  const [pkpInfo, setPkpInfo] = useState<any>(null);
  const [authContext, setAuthContext] = useState<any>(null);
  const [account, setAccount] = useState<any>(null);

  // EOA specific state
  const [privateKey, setPrivateKey] = useState(DEFAULT_PRIVATE_KEY);
  const [accountMethod, setAccountMethod] = useState<"privateKey" | "wallet">(
    "wallet"
  );

  // Authentication methods configuration
  const authMethods: AuthMethodInfo[] = [
    {
      id: "google",
      name: "Google",
      icon: googleIcon,
      description: "Sign in with your Google account via Lit Login Server",
      color: "#4285F4",
      available: true,
    },
    {
      id: "discord",
      name: "Discord",
      icon: discordIcon,
      description: "Sign in with your Discord account via Lit Login Server",
      color: "#5865F2",
      available: true,
    },
    {
      id: "eoa",
      name: "EOA Auth",
      icon: web3WalletIcon,
      description: "Use your Ethereum wallet with authentication flow",
      color: "#F7931A",
      available: true,
    },
    {
      id: "eoa-native",
      name: "EOA Native",
      icon: passkeyIcon,
      description: "Direct EOA management with manual permissions",
      color: "#FFD700",
      available: true,
    },
    {
      id: "custom",
      name: "Custom Auth",
      icon: passkeyIcon,
      description: "dApp-centric custom authentication (Advanced)",
      color: "#6366F1",
      available: false, // Disabled for now as it requires more setup
    },
  ];

  // Utility functions
  const formatError = (prefix: string, error: any): string => {
    if (error?.message) return `${prefix}${error.message}`;
    if (typeof error === "object")
      return `${prefix}${JSON.stringify(error, null, 2)}`;
    return `${prefix}${String(error)}`;
  };

  const resetState = () => {
    setCurrentStep("select");
    setSelectedMethod(null);
    setIsProcessing(false);
    setError(null);
    setAuthData(null);
    setPkpInfo(null);
    setAuthContext(null);
    setAccount(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleError = (error: any, context: string) => {
    const errorMessage = formatError(`${context}: `, error);
    setError(errorMessage);
    setIsProcessing(false);
    console.error(`❌ ${context}:`, error);
  };

  // ========== AUTHENTICATION FLOWS ==========

  const authenticateGoogle = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      const authData = await GoogleAuthenticator.authenticate(
        "https://login.litgateway.com"
      );
      setAuthData(authData);
      setCurrentStep("mint");
    } catch (error) {
      handleError(error, "Google authentication failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const authenticateDiscord = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      const authData = await DiscordAuthenticator.authenticate(
        "https://login.litgateway.com"
      );
      setAuthData(authData);
      setCurrentStep("mint");
    } catch (error) {
      handleError(error, "Discord authentication failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const authenticateEOA = async () => {
    try {
      setIsProcessing(true);
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

      setAccount(account);
      setAuthData(authData);
      setCurrentStep("mint");
    } catch (error) {
      handleError(error, "EOA authentication failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const authenticateEOANative = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      let account;

      if (accountMethod === "privateKey") {
        if (!privateKey.startsWith("0x") || privateKey.length !== 66) {
          throw new Error("Invalid private key format");
        }
        account = privateKeyToAccount(privateKey as `0x${string}`);
      } else {
        if (!walletClient?.account) {
          throw new Error("No wallet connected");
        }
        account = walletClient;
      }

      setAccount(account);
      setCurrentStep("mint");
    } catch (error) {
      handleError(error, "EOA native setup failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // ========== PKP MINTING ==========

  const mintPKP = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      let result;

      if (selectedMethod === "eoa-native") {
        // EOA Native: Direct minting
        result = await litClient.mintWithEoa({ account });
      } else if (selectedMethod === "eoa") {
        // EOA Auth: Mint with auth data
        if (accountMethod === "privateKey") {
          result = await litClient.mintWithAuth({
            account,
            authData,
            scopes: ["sign-anything"],
          });
        } else {
          result = await litClient.mintWithAuth({
            account: walletClient,
            authData,
            scopes: ["sign-anything"],
          });
        }
      } else {
        // OAuth methods (Google, Discord)
        result = await litClient.authService.mintWithAuth({ authData });
      }

      setPkpInfo(result.data);
      setCurrentStep(selectedMethod === "eoa-native" ? "sign" : "context");
    } catch (error) {
      handleError(error, "PKP minting failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // ========== AUTH CONTEXT CREATION ==========

  const createAuthContext = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      const context = await authManager.createPkpAuthContext({
        authData,
        pkpPublicKey: pkpInfo.pubkey,
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
        litClient,
      });

      setAuthContext(context);
      setCurrentStep("sign");
    } catch (error) {
      handleError(error, "Auth context creation failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // ========== RENDER METHODS ==========

  const renderMethodSelection = () => (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "20px", textAlign: "center" }}>
        Choose Authentication Method
      </h2>
      <div
        style={{
          display: "grid",
          gap: "10px",
          maxWidth: "450px",
          margin: "0 auto",
        }}
      >
        {authMethods.map((method) => (
          <button
            key={method.id}
            onClick={() => {
              if (!method.available) return;
              setSelectedMethod(method.id);
              setCurrentStep("authenticate");
            }}
            disabled={!method.available}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              border: `1px solid ${method.available ? method.color : "#ccc"}`,
              borderRadius: "8px",
              backgroundColor: method.available ? "white" : "#f5f5f5",
              cursor: method.available ? "pointer" : "not-allowed",
              opacity: method.available ? 1 : 0.6,
              transition: "all 0.2s",
              textAlign: "left",
              minHeight: "60px",
            }}
            onMouseEnter={(e) => {
              if (method.available) {
                e.currentTarget.style.backgroundColor = method.color + "10";
                e.currentTarget.style.borderColor = method.color;
              }
            }}
            onMouseLeave={(e) => {
              if (method.available) {
                e.currentTarget.style.backgroundColor = "white";
                e.currentTarget.style.borderColor = method.color;
              }
            }}
          >
            <img
              src={method.icon}
              alt={method.name}
              style={{
                width: "24px",
                height: "24px",
                objectFit: "contain",
                flexShrink: 0,
              }}
            />
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              <h3
                style={{
                  margin: "0 0 4px 0",
                  color: method.available ? method.color : "#999",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                {method.name}
                {!method.available && " (Coming Soon)"}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  color: "#666",
                  lineHeight: "1.3",
                }}
              >
                {method.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderAuthentication = () => {
    const method = authMethods.find((m) => m.id === selectedMethod);
    if (!method) return null;

    return (
      <div style={{ padding: "20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <button
            onClick={() => setCurrentStep("select")}
            style={{
              padding: "8px 12px",
              backgroundColor: "#f0f0f0",
              border: "1px solid #ddd",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
          <h2 style={{ margin: 0, color: method.color }}>
            {method.icon} {method.name} Authentication
          </h2>
        </div>

        {error && (
          <div
            style={{
              padding: "15px",
              backgroundColor: "#fee",
              border: "1px solid #fcc",
              borderRadius: "6px",
              marginBottom: "20px",
              color: "#c00",
            }}
          >
            {error}
          </div>
        )}

        {(selectedMethod === "eoa" || selectedMethod === "eoa-native") && (
          <div style={{ marginBottom: "20px" }}>
            <h4>Choose Account Method:</h4>
            <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
              <button
                onClick={() => setAccountMethod("privateKey")}
                style={{
                  padding: "8px 15px",
                  backgroundColor:
                    accountMethod === "privateKey" ? method.color : "#f0f0f0",
                  color: accountMethod === "privateKey" ? "white" : "#333",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Private Key
              </button>
              <button
                onClick={() => setAccountMethod("wallet")}
                style={{
                  padding: "8px 15px",
                  backgroundColor:
                    accountMethod === "wallet" ? method.color : "#f0f0f0",
                  color: accountMethod === "wallet" ? "white" : "#333",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Connected Wallet
              </button>
            </div>

            {accountMethod === "privateKey" ? (
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  Private Key:
                </label>
                <input
                  type="password"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="0x..."
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontFamily: "monospace",
                  }}
                />
                <small style={{ color: "#666" }}>
                  Default test key provided. Get tokens from{" "}
                  <a
                    href={FAUCET_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Chronicle Yellowstone Faucet
                  </a>
                </small>
              </div>
            ) : (
              <div style={{ marginBottom: "15px" }}>
                <ConnectButton />
                {!walletClient?.account && (
                  <p
                    style={{
                      color: "#666",
                      fontSize: "14px",
                      marginTop: "10px",
                    }}
                  >
                    Please connect your wallet to continue
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => {
            switch (selectedMethod) {
              case "google":
                authenticateGoogle();
                break;
              case "discord":
                authenticateDiscord();
                break;
              case "eoa":
                authenticateEOA();
                break;
              case "eoa-native":
                authenticateEOANative();
                break;
            }
          }}
          disabled={
            isProcessing ||
            (accountMethod === "wallet" && !walletClient?.account)
          }
          style={{
            width: "100%",
            padding: "15px",
            backgroundColor: isProcessing ? "#ccc" : method.color,
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: isProcessing ? "not-allowed" : "pointer",
          }}
        >
          {isProcessing ? "Processing..." : `Authenticate with ${method.name}`}
        </button>
      </div>
    );
  };

  const renderMinting = () => {
    const method = authMethods.find((m) => m.id === selectedMethod);
    if (!method) return null;

    return (
      <div style={{ padding: "20px" }}>
        <h2 style={{ marginBottom: "20px", color: method.color }}>
          {method.icon} Mint PKP with {method.name}
        </h2>

        {error && (
          <div
            style={{
              padding: "15px",
              backgroundColor: "#fee",
              border: "1px solid #fcc",
              borderRadius: "6px",
              marginBottom: "20px",
              color: "#c00",
            }}
          >
            {error}
          </div>
        )}

        <p style={{ marginBottom: "20px" }}>
          Ready to mint your Programmable Key Pair (PKP). This will create a new
          wallet associated with your {method.name} identity.
        </p>

        <button
          onClick={mintPKP}
          disabled={isProcessing}
          style={{
            width: "100%",
            padding: "15px",
            backgroundColor: isProcessing ? "#ccc" : method.color,
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: isProcessing ? "not-allowed" : "pointer",
          }}
        >
          {isProcessing ? "Minting PKP..." : "Mint PKP"}
        </button>
      </div>
    );
  };

  const renderContextCreation = () => {
    const method = authMethods.find((m) => m.id === selectedMethod);
    if (!method) return null;

    return (
      <div style={{ padding: "20px" }}>
        <h2 style={{ marginBottom: "20px", color: method.color }}>
          {method.icon} Create Authentication Context
        </h2>

        {error && (
          <div
            style={{
              padding: "15px",
              backgroundColor: "#fee",
              border: "1px solid #fcc",
              borderRadius: "6px",
              marginBottom: "20px",
              color: "#c00",
            }}
          >
            {error}
          </div>
        )}

        <p style={{ marginBottom: "20px" }}>
          PKP minted successfully! Now creating an authentication context for
          signing operations.
        </p>

        <div
          style={{
            padding: "15px",
            backgroundColor: "#f0f8ff",
            border: "1px solid #b3d9ff",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <strong>PKP Public Key:</strong>
          <br />
          <code style={{ fontSize: "12px", wordBreak: "break-all" }}>
            {pkpInfo?.pubkey}
          </code>
        </div>

        <button
          onClick={createAuthContext}
          disabled={isProcessing}
          style={{
            width: "100%",
            padding: "15px",
            backgroundColor: isProcessing ? "#ccc" : method.color,
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: isProcessing ? "not-allowed" : "pointer",
          }}
        >
          {isProcessing ? "Creating Context..." : "Create Auth Context"}
        </button>
      </div>
    );
  };

  const renderSigning = () => {
    const method = authMethods.find((m) => m.id === selectedMethod);
    if (!method) return null;

    return (
      <div style={{ padding: "20px" }}>
        <h2 style={{ marginBottom: "20px", color: method.color }}>
          {method.icon} Sign with Your PKP
        </h2>

        <div
          style={{
            padding: "15px",
            backgroundColor: "#f0f8ff",
            border: "1px solid #b3d9ff",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <strong>🎉 Authentication Complete!</strong>
          <br />
          Your PKP is ready for signing operations.
        </div>

        <PkpSigningComponent
          authContext={authContext}
          pkpInfo={pkpInfo}
          setStatus={() => {}} // Simplified for modal
          assertDependenciesLoaded={() => ({ litClient, authManager })}
          defaultMessage={`Hello from ${method.name} PKP!`}
          componentTitle="Test Your PKP"
        />

        <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
          <button
            onClick={() => {
              onAuthSuccess?.(authContext, pkpInfo, selectedMethod!);
              handleClose();
            }}
            style={{
              flex: 1,
              padding: "15px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Complete Setup
          </button>
          <button
            onClick={handleClose}
            style={{
              flex: 1,
              padding: "15px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
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
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          maxWidth: "600px",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          position: "relative",
        }}
      >
        <button
          onClick={handleClose}
          style={{
            position: "absolute",
            top: "15px",
            right: "15px",
            background: "none",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
            color: "#666",
            zIndex: 1001,
          }}
        >
          ×
        </button>

        {currentStep === "select" && renderMethodSelection()}
        {currentStep === "authenticate" && renderAuthentication()}
        {currentStep === "mint" && renderMinting()}
        {currentStep === "context" && renderContextCreation()}
        {currentStep === "sign" && renderSigning()}
      </div>
    </div>
  );
};
