import React, { useState } from "react";
import { useWalletClient } from "wagmi";
import { useLitServiceSetup } from "../../hooks/useLitServiceSetup";
import AccountMethodSelector, {
  AccountMethod,
} from "../../components/common/AccountMethodSelector";

// Configuration constants

interface AuthenticateEOAProps {
  onBack: () => void;
  onAuthSuccess: (userData: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface AuthUser {
  authContext: any;
  pkpInfo: any;
  method: "eoa";
  timestamp: number;
  authData?: any;
  accountMethod: AccountMethod;
}

const AuthenticateEOA: React.FC<AuthenticateEOAProps> = ({
  onBack,
  onAuthSuccess,
}) => {
  const { data: walletClient } = useWalletClient();

  // Setup Lit Protocol services
  const {
    isInitializing,
    error: setupError,
    isReady: isServicesReady,
  } = useLitServiceSetup({
    appName: "lit-explorer",
    networkName: "naga-dev",
    autoSetup: false, // Don't auto-setup to avoid conflicts with Explorer
  });

  // Authentication state
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Account state
  const [account, setAccount] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [accountMethod, setAccountMethod] =
    useState<AccountMethod>("walletClient");

  // Success feedback state
  const [successActions, setSuccessActions] = useState<Set<string>>(new Set());

  // Function to show success feedback
  const showSuccess = (actionId: string) => {
    setSuccessActions((prev) => new Set([...prev, actionId]));
    // Auto-clear after 3 seconds
    setTimeout(() => {
      setSuccessActions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(actionId);
        return newSet;
      });
    }, 3000);
  };

  const formatError = (prefix: string, error: any): string => {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    if (error?.message) return `${prefix}${error.message}`;
    if (typeof error === "object")
      return `${prefix}${JSON.stringify(error, null, 2)}`;
    return `${prefix}${String(error)}`;
  };

  const showError = (errorMessage: string) => {
    setError(errorMessage);
    // Auto-clear error after 10 seconds
    setTimeout(() => setError(null), 10000);
  };

  const authenticate = async () => {
    try {
      setIsAuthenticating(true);
      setStatus("Authenticating with EOA account...");
      setError(null);

      if (!account) {
        throw new Error("No account found. Create account first.");
      }

      let authData;
      if (accountMethod === "privateKey") {
        const { ViemAccountAuthenticator } = await import("@lit-protocol/auth");
        authData = await ViemAccountAuthenticator.authenticate(account);
      } else {
        const { WalletClientAuthenticator } = await import(
          "@lit-protocol/auth"
        );
        if (!walletClient) {
          throw new Error(
            "No wallet client available. Please connect your wallet."
          );
        }
        authData = await WalletClientAuthenticator.authenticate(walletClient);
      }

      setStatus("🎉 Authentication successful! Redirecting to Explorer...");
      showSuccess("eoa-authenticate");

      // Create auth user data with just the authentication info
      const userData: AuthUser = {
        authContext: null, // Will be created in Explorer when PKP is selected
        pkpInfo: null, // Will be set in Explorer when PKP is selected
        method: "eoa",
        timestamp: Date.now(),
        authData: {
          ...authData,
          account: account,
          walletClient: walletClient,
        },
        accountMethod,
      };

      // Navigate to Explorer after a brief delay
      setTimeout(() => {
        onAuthSuccess(userData);
      }, 1000);
    } catch (error: any) {
      const errorMessage = formatError(
        "Failed to authenticate with EOA: ",
        error
      );
      setError(errorMessage);
      setStatus(errorMessage);
      showError(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      {/* Header with back button */}
      <div style={{ marginBottom: "2rem" }}>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: "#6b7280",
            fontSize: "14px",
            cursor: "pointer",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 8px",
            borderRadius: "4px",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f3f4f6";
            e.currentTarget.style.color = "#374151";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "#6b7280";
          }}
        >
          ← Back to Authentication Methods
        </button>
        <h1
          style={{
            fontSize: "1.875rem",
            fontWeight: "700",
            color: "#111827",
            marginBottom: "0.5rem",
          }}
        >
          Web3 Wallet Authentication
        </h1>
        <p style={{ color: "#6b7280", margin: "0", fontSize: "1rem" }}>
          Connect your wallet or use a private key to authenticate with Lit
          Protocol
        </p>
      </div>

      {/* Status and Error Messages */}
      {status && (
        <div
          style={{
            padding: "16px",
            backgroundColor: "#f0f9ff",
            border: "1px solid #bfdbfe",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            color: "#1e40af",
            fontSize: "14px",
            lineHeight: "1.5",
          }}
        >
          {status}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "16px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            color: "#dc2626",
            fontSize: "14px",
            lineHeight: "1.5",
          }}
        >
          {error}
        </div>
      )}

      {setupError && (
        <div
          style={{
            padding: "16px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            color: "#dc2626",
            fontSize: "14px",
            lineHeight: "1.5",
          }}
        >
          <strong>Setup Error:</strong> {setupError}
        </div>
      )}

      {/* Step 1: Create Account */}
      <div
        style={{
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <h3
          style={{
            margin: "0 0 1rem 0",
            fontSize: "1.125rem",
            fontWeight: "600",
          }}
        >
          Step 1: Create Account
        </h3>
        <p
          style={{
            margin: "0 0 1.5rem 0",
            fontSize: "14px",
            color: "#6b7280",
            lineHeight: "1.5",
          }}
        >
          Choose how you want to create your account. You can either connect
          your browser wallet (recommended) or enter a private key directly.
        </p>

        <AccountMethodSelector
          onAccountCreated={setAccount}
          onMethodChange={setAccountMethod}
          setStatus={setStatus}
          showError={showError}
          showSuccess={showSuccess}
          disabled={!isServicesReady}
          successActionIds={{
            createAccount: "eoa-create-account",
            getWalletAccount: "eoa-get-wallet-account",
          }}
          successActions={successActions}
        />
      </div>

      {/* Step 2: Authenticate */}
      <div
        style={{
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <h3
          style={{
            margin: "0 0 1rem 0",
            fontSize: "1.125rem",
            fontWeight: "600",
          }}
        >
          Step 2: Authenticate
          {!account && (
            <span
              style={{
                color: "#f59e0b",
                fontSize: "14px",
                fontWeight: "400",
                marginLeft: "8px",
              }}
            >
              (Create account first)
            </span>
          )}
        </h3>
        <p
          style={{
            margin: "0 0 1.5rem 0",
            fontSize: "14px",
            color: "#6b7280",
            lineHeight: "1.5",
          }}
        >
          Generate authentication data using your{" "}
          {accountMethod === "privateKey" ? "private key" : "connected wallet"}.
          This creates a cryptographic proof of your identity.
        </p>

        <button
          onClick={authenticate}
          disabled={isAuthenticating || !account || !isServicesReady}
          style={{
            padding: "12px 20px",
            backgroundColor:
              isAuthenticating || !account || !isServicesReady
                ? "#d1d5db"
                : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600",
            cursor:
              isAuthenticating || !account || !isServicesReady
                ? "not-allowed"
                : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s",
          }}
        >
          {isAuthenticating && (
            <div
              style={{
                width: "16px",
                height: "16px",
                border: "2px solid #ffffff40",
                borderTop: "2px solid #ffffff",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
          )}
          {isAuthenticating ? "Authenticating..." : "Authenticate with EOA"}
        </button>
      </div>

      {/* Loading Overlay for Service Initialization */}
      {isInitializing && (
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
              padding: "2rem",
              textAlign: "center",
              maxWidth: "400px",
              margin: "20px",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                border: "4px solid #e5e7eb",
                borderTop: "4px solid #3b82f6",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 1.5rem",
              }}
            />
            <h3
              style={{
                margin: "0 0 0.5rem 0",
                fontSize: "1.125rem",
                fontWeight: "600",
              }}
            >
              Initializing Lit Protocol
            </h3>
            <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
              Setting up services and connecting to the network...
            </p>
          </div>
        </div>
      )}

      {/* Spinner Animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AuthenticateEOA;
