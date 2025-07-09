import React, { useState } from "react";
import { WebAuthnAuthenticator } from "@lit-protocol/auth";

interface AuthenticateWebAuthnProps {
  onBack: () => void;
  onAuthSuccess: (userData: any) => void;
}

interface AuthUser {
  authContext: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  pkpInfo: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  method: "webauthn";
  timestamp: number;
  authData?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  accountMethod: string;
}

type WebAuthnMode = "register" | "existing";

const AuthenticateWebAuthn: React.FC<AuthenticateWebAuthnProps> = ({
  onBack,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<WebAuthnMode>("register");
  const [username, setUsername] = useState<string>("");
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  const handleConnect = async () => {
    try {
      setIsAuthenticating(true);
      setError(null);

      if (mode === "register") {
        setStatus("Registering new WebAuthn credential...");

        const usernameToUse = username.trim() || `user-${Date.now()}`;

        const { pkpInfo } = await WebAuthnAuthenticator.registerAndMintPKP({
          authServiceBaseUrl: import.meta.env.VITE_AUTH_SERVICE_BASE_URL || "https://naga-auth-service.onrender.com",
          username: usernameToUse,
        });

        setStatus("✅ WebAuthn credential registered successfully!");

        // Create user data for WebAuthn registration
        const userData: AuthUser = {
          authContext: null,
          pkpInfo: pkpInfo,
          method: "webauthn",
          timestamp: Date.now(),
          authData: null, // Will be set when needed for operations
          accountMethod: "webauthn",
        };

        // Brief delay to show success message
        setTimeout(() => {
          onAuthSuccess(userData);
        }, 1000);
      } else {
        setStatus("Authenticating with existing WebAuthn credential...");

        const webAuthnAuthData = await WebAuthnAuthenticator.authenticate();

        setStatus("✅ WebAuthn authentication successful!");

        // Create user data for WebAuthn authentication
        const userData: AuthUser = {
          authContext: null,
          pkpInfo: null,
          method: "webauthn",
          timestamp: Date.now(),
          authData: webAuthnAuthData,
          accountMethod: "webauthn",
        };

        // Brief delay to show success message
        setTimeout(() => {
          onAuthSuccess(userData);
        }, 1000);
      }
    } catch (error: any) {
      // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error("WebAuthn operation failed:", error);
      const errorMessage = `${
        mode === "register" ? "Registration" : "Authentication"
      } failed: ${error.message || error}`;
      setError(errorMessage);
      setStatus(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      {/* Back Button */}
      <button
        onClick={onBack}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          backgroundColor: "transparent",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "14px",
          color: "#6b7280",
          marginBottom: "2rem",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#f9fafb";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        ← Back
      </button>

      {/* Main Content */}
      <div
        style={{
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "2rem",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: "600",
            color: "#111827",
            marginBottom: "2rem",
            textAlign: "center",
          }}
        >
          WebAuthn
        </h2>

        {/* Mode Selection */}
        <div style={{ marginBottom: "2rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "16px",
              fontWeight: "600",
              color: "#374151",
              marginBottom: "1rem",
            }}
          >
            Mode:
          </label>

          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={() => setMode("register")}
              style={{
                flex: 1,
                padding: "12px 20px",
                backgroundColor: mode === "register" ? "#3b82f6" : "#f3f4f6",
                color: mode === "register" ? "white" : "#6b7280",
                border: "1px solid",
                borderColor: mode === "register" ? "#3b82f6" : "#d1d5db",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.2s",
              }}
            >
              Register New
            </button>

            <button
              onClick={() => setMode("existing")}
              style={{
                flex: 1,
                padding: "12px 20px",
                backgroundColor: mode === "existing" ? "#3b82f6" : "#f3f4f6",
                color: mode === "existing" ? "white" : "#6b7280",
                border: "1px solid",
                borderColor: mode === "existing" ? "#3b82f6" : "#d1d5db",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.2s",
              }}
            >
              Use Existing
            </button>
          </div>
        </div>

        {/* Username Field - Only show for registration */}
        {mode === "register" && (
          <div style={{ marginBottom: "2rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "16px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "0.5rem",
              }}
            >
              Username (optional):
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="user@example.com"
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                backgroundColor: "#374151",
                color: "#9ca3af",
                outline: "none",
                transition: "all 0.2s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#3b82f6";
                e.currentTarget.style.backgroundColor = "#1f2937";
                e.currentTarget.style.color = "#f9fafb";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#d1d5db";
                e.currentTarget.style.backgroundColor = "#374151";
                e.currentTarget.style.color = "#9ca3af";
              }}
            />
          </div>
        )}

        {/* Connect Button */}
        <button
          onClick={handleConnect}
          disabled={isAuthenticating}
          style={{
            width: "100%",
            padding: "16px",
            backgroundColor: isAuthenticating ? "#9ca3af" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: isAuthenticating ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
          onMouseEnter={(e) => {
            if (!isAuthenticating) {
              e.currentTarget.style.backgroundColor = "#2563eb";
            }
          }}
          onMouseLeave={(e) => {
            if (!isAuthenticating) {
              e.currentTarget.style.backgroundColor = "#3b82f6";
            }
          }}
        >
          {isAuthenticating && (
            <div
              style={{
                width: "16px",
                height: "16px",
                border: "2px solid transparent",
                borderTop: "2px solid #ffffff",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
          )}
          {isAuthenticating ? "Connecting..." : "Connect"}
        </button>

        {/* Status Message */}
        {status && (
          <div
            style={{
              marginTop: "1rem",
              padding: "12px",
              backgroundColor: error ? "#fef2f2" : "#f0f9ff",
              border: "1px solid",
              borderColor: error ? "#fecaca" : "#bfdbfe",
              borderRadius: "8px",
              fontSize: "14px",
              color: error ? "#dc2626" : "#1e40af",
            }}
          >
            {status}
          </div>
        )}

        {/* Info Message */}
        <div
          style={{
            marginTop: "1.5rem",
            padding: "12px",
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          <p style={{ margin: "0 0 8px 0" }}>
            <strong>
              {mode === "register" ? "Register New:" : "Use Existing:"}
            </strong>
          </p>
          <p style={{ margin: 0 }}>
            {mode === "register"
              ? "Create a new WebAuthn credential and mint a PKP. You'll use your device's biometric authentication (Face ID, Touch ID, Windows Hello, etc.) or a hardware security key."
              : "Authenticate with an existing WebAuthn credential. You'll need to use the same device and authentication method you used when you first registered."}
          </p>
        </div>
      </div>

      {/* Keyframe animation for spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AuthenticateWebAuthn;
