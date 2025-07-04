import React, { useState } from "react";
import AuthenticateEOA from "./LitExplorer/AuthenticateEOA";
import Explorer from "./LitExplorer/Explorer";
import Search from "./LitExplorer/Search";

// Import icon assets (same as in LitAuthProvider)
import tfaIcon from "../assets/2fa.svg";
import discordIcon from "../assets/discord.png";
import emailIcon from "../assets/email.svg";
import googleIcon from "../assets/google.png";
import passkeyIcon from "../assets/passkey.svg";
import phoneIcon from "../assets/phone.svg";
import web3WalletIcon from "../assets/web3-wallet.svg";
import whatsappIcon from "../assets/whatsapp.svg";

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

interface AuthMethodInfo {
  id: AuthMethod;
  name: string;
  icon: string;
  description: string;
  available: boolean;
  comingSoon?: boolean;
}

interface AuthUser {
  authContext: any;
  pkpInfo: any;
  method: AuthMethod;
  timestamp: number;
  authData?: any;
  accountMethod?: string;
}

type ViewState = "main" | "authenticate-eoa" | "explorer";

const LitExplorer: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<AuthMethod | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [viewState, setViewState] = useState<ViewState>("main");

  // Available authentication methods
  const authMethods: AuthMethodInfo[] = [
    {
      id: "google",
      name: "Google",
      icon: googleIcon,
      description: "Continue with Google",
      available: false,
      comingSoon: true,
    },
    {
      id: "discord",
      name: "Discord",
      icon: discordIcon,
      description: "Continue with Discord",
      available: false,
      comingSoon: true,
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
      available: false,
      comingSoon: true,
    },
    {
      id: "stytch-email",
      name: "Email OTP",
      icon: emailIcon,
      description: "Email verification code",
      available: false,
      comingSoon: true,
    },
    {
      id: "stytch-sms",
      name: "SMS",
      icon: phoneIcon,
      description: "SMS verification code",
      available: false,
      comingSoon: true,
    },
    {
      id: "stytch-whatsapp",
      name: "WhatsApp",
      icon: whatsappIcon,
      description: "WhatsApp verification code",
      available: false,
      comingSoon: true,
    },
    {
      id: "stytch-totp",
      name: "Authenticator",
      icon: tfaIcon,
      description: "TOTP authenticator app",
      available: false,
      comingSoon: true,
    },
    {
      id: "custom",
      name: "Custom Auth",
      icon: passkeyIcon,
      description: "Test custom authentication",
      available: false,
      comingSoon: true,
    },
  ];

  const handleAuthMethodSelect = async (method: AuthMethod) => {
    if (!authMethods.find((m) => m.id === method)?.available) return;

    setSelectedMethod(method);
    setIsAuthenticating(true);

    try {
      if (method === "eoa") {
        // Navigate to EOA authentication page
        setViewState("authenticate-eoa");
        setIsAuthenticating(false);
        return;
      }

      // TODO: Implement other authentication methods
      console.log(`Authentication method ${method} not yet implemented`);

      // Simulate authentication delay for other methods
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // For now, just set as signed in for non-EOA methods (when implemented)
      // setUser({ /* user data */ });
    } catch (error) {
      console.error(`Authentication failed for ${method}:`, error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleAuthSuccess = (userData: AuthUser) => {
    setUser(userData);
    setViewState("explorer");
  };

  const handleBackToMain = () => {
    setViewState("main");
    setSelectedMethod(null);
    setIsAuthenticating(false);
  };

  const handleSignOut = () => {
    setUser(null);
    setSelectedMethod(null);
    setViewState("main");
  };

  // Show EOA authentication page
  if (viewState === "authenticate-eoa") {
    return (
      <AuthenticateEOA
        onBack={handleBackToMain}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  // Show Explorer page
  if (viewState === "explorer" && user) {
    return (
      <Explorer
        user={user}
        onBack={handleBackToMain}
        onSignOut={handleSignOut}
      />
    );
  }

  // Show success state if user is authenticated but not in explorer view
  if (user && viewState !== "explorer") {
    return (
      <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
        <div
          style={{
            backgroundColor: "#f0f9ff",
            border: "1px solid #bfdbfe",
            borderRadius: "12px",
            padding: "2rem",
            marginBottom: "2rem",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              color: "#1e40af",
              margin: "0 0 1rem 0",
              fontSize: "1.5rem",
            }}
          >
            🎉 Welcome to Lit Explorer!
          </h2>
          <p
            style={{
              color: "#1e40af",
              margin: "0 0 1.5rem 0",
              fontSize: "1rem",
            }}
          >
            You've successfully authenticated with <strong>Web3 Wallet</strong>
          </p>

          {/* User Details */}
          <div
            style={{
              backgroundColor: "white",
              border: "1px solid #bfdbfe",
              borderRadius: "8px",
              padding: "1.5rem",
              marginBottom: "1.5rem",
              textAlign: "left",
            }}
          >
            <h3
              style={{
                margin: "0 0 1rem 0",
                color: "#1e40af",
                fontSize: "1.125rem",
              }}
            >
              Account Details
            </h3>
            <div
              style={{ fontSize: "14px", color: "#374151", lineHeight: "1.6" }}
            >
              <div style={{ marginBottom: "0.5rem" }}>
                <strong>PKP Address:</strong>
                <code
                  style={{
                    backgroundColor: "#f3f4f6",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    marginLeft: "8px",
                    fontSize: "12px",
                  }}
                >
                  {user.pkpInfo?.pubkey?.slice(0, 20)}...
                </code>
              </div>
              <div style={{ marginBottom: "0.5rem" }}>
                <strong>Method:</strong>{" "}
                {user.accountMethod === "privateKey"
                  ? "Private Key"
                  : "Connected Wallet"}
              </div>
              <div>
                <strong>Authenticated:</strong>{" "}
                {new Date(user.timestamp).toLocaleString()}
              </div>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#b91c1c";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#dc2626";
            }}
          >
            Sign Out
          </button>
        </div>

        <div
          style={{
            color: "#6b7280",
            textAlign: "center",
            fontSize: "14px",
            lineHeight: "1.6",
          }}
        >
          <p style={{ margin: "0 0 0.5rem 0" }}>
            🚧 More Lit Explorer features coming in the next steps!
          </p>
          <p style={{ margin: 0 }}>
            You now have a fully authenticated PKP that can sign messages and
            execute Lit Actions.
          </p>
        </div>
      </div>
    );
  }

  // Main authentication method selection page
  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "700",
            color: "#111827",
            marginBottom: "0.5rem",
          }}
        >
          Lit Explorer
        </h1>
        <p
          style={{
            fontSize: "1rem",
            color: "#6b7280",
            margin: "0",
          }}
        >
          Search the Lit Protocol network or sign in to get started.
        </p>
      </div>

      {/* Search Component */}
      <div style={{ marginBottom: "3rem" }}>
        <Search />
      </div>

      {/* Divider */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div
          style={{
            height: "1px",
            backgroundColor: "#e5e7eb",
            margin: "0 auto",
            position: "relative",
          }}
        />
        <div
          style={{
            backgroundColor: "white",
            color: "#6b7280",
            padding: "0 1rem",
            fontSize: "14px",
            position: "relative",
            top: "-10px",
            display: "inline-block",
          }}
        >
          OR
        </div>
      </div>

      {/* Authentication Methods */}
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div
          style={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "2rem",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          }}
        >
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#111827",
              marginBottom: "1.5rem",
              textAlign: "center",
            }}
          >
            Choose Authentication Method
          </h3>

          <div style={{ display: "grid", gap: "0.75rem" }}>
            {authMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => handleAuthMethodSelect(method.id)}
                disabled={!method.available || isAuthenticating}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "1rem",
                  backgroundColor:
                    method.available && !isAuthenticating ? "white" : "#f9fafb",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  cursor:
                    method.available && !isAuthenticating
                      ? "pointer"
                      : "not-allowed",
                  opacity: method.available && !isAuthenticating ? 1 : 0.6,
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  transition: "all 0.2s",
                  textAlign: "left",
                  minHeight: "60px",
                  position: "relative",
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
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

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "600", marginBottom: "2px" }}>
                    {method.name}
                    {method.comingSoon && (
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          fontWeight: "400",
                          marginLeft: "8px",
                        }}
                      >
                        (Coming Soon)
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    {method.description}
                  </div>
                </div>

                {/* Loading indicator */}
                {isAuthenticating && selectedMethod === method.id && (
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      border: "2px solid #e5e7eb",
                      borderTop: "2px solid #3b82f6",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                      flexShrink: 0,
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          {isAuthenticating && (
            <div
              style={{
                textAlign: "center",
                marginTop: "1rem",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              Authenticating with {selectedMethod}...
            </div>
          )}
        </div>

        {/* Keyframe animation for spinner */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default LitExplorer;
