import React, { useState } from "react";
import { useLitServiceSetup } from "../../hooks/useLitServiceSetup";
import PkpSelectionComponentSimplified from "../../components/common/PkpSelectionComponentSimplified";

interface AuthUser {
  authContext: any;
  pkpInfo: any;
  method: string;
  timestamp: number;
  authData?: any;
  accountMethod?: string;
}

interface PKPInfo {
  tokenId: string;
  publicKey: string;
  ethAddress: string;
  pubkey?: string;
}

interface ExplorerProps {
  user: AuthUser;
  onBack: () => void;
  onSignOut: () => void;
}

const Explorer: React.FC<ExplorerProps> = ({ user, onBack, onSignOut }) => {
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [selectedPkp, setSelectedPkp] = useState<PKPInfo | null>(null);

  // Setup Lit Protocol services
  const {
    services,
    isReady: isServicesReady,
    error: setupError,
  } = useLitServiceSetup({
    appName: "lit-explorer",
    networkName: "naga-dev",
    autoSetup: true,
  });

  const assertDependenciesLoaded = () => {
    if (!isServicesReady || !services) {
      throw new Error(
        "Lit services not ready. Please wait for initialization."
      );
    }
    return {
      litClient: services.litClient,
      authManager: services.authManager,
    };
  };

  const showError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  };

  const handlePkpSelected = (pkpInfo: PKPInfo) => {
    setSelectedPkp(pkpInfo);
    setStatus(`Selected PKP: ${pkpInfo.ethAddress}`);
  };

  const formatUserAddress = () => {
    if (user.authData?.account?.address) {
      return user.authData.account.address;
    }
    if (user.authData?.account?.account?.address) {
      return user.authData.account.account.address;
    }
    if (user.pkpInfo?.ethAddress) {
      return user.pkpInfo.ethAddress;
    }
    return "No address available";
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          padding: "1.5rem",
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <div>
          <h1
            style={{
              margin: "0 0 0.5rem 0",
              fontSize: "1.875rem",
              fontWeight: "700",
              color: "#111827",
            }}
          >
            🔍 Lit Explorer
          </h1>
          <p
            style={{
              margin: "0",
              fontSize: "1rem",
              color: "#6b7280",
            }}
          >
            Explore and manage your PKPs and Lit Protocol assets
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {/* <button
            onClick={onBack}
            style={{
              padding: "8px 16px",
              backgroundColor: "#f3f4f6",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            ← Back
          </button> */}
          <button
            onClick={onSignOut}
            style={{
              padding: "8px 16px",
              backgroundColor: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* User Info */}
      <div
        style={{
          backgroundColor: "#f0f9ff",
          border: "1px solid #bfdbfe",
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <h3
          style={{
            margin: "0 0 1rem 0",
            fontSize: "1.125rem",
            fontWeight: "600",
            color: "#1e40af",
          }}
        >
          🎉 Authenticated Successfully!
        </h3>
        <div style={{ display: "grid", gap: "0.5rem", fontSize: "14px" }}>
          <div>
            <strong>Method:</strong> {user.method} (
            {user.accountMethod || "N/A"})
          </div>
          <div>
            <strong>Address:</strong>{" "}
            <code
              style={{
                backgroundColor: "#e0f2fe",
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              {formatUserAddress()}
            </code>
          </div>
          <div>
            <strong>Authenticated:</strong>{" "}
            {new Date(user.timestamp).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Service Status */}
      {!isServicesReady && (
        <div
          style={{
            backgroundColor: "#fef3c7",
            border: "1px solid #f59e0b",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: "16px",
              height: "16px",
              border: "2px solid #f59e0b",
              borderTop: "2px solid transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <span style={{ color: "#92400e", fontWeight: "500" }}>
            Initializing Lit services...
          </span>
        </div>
      )}

      {setupError && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1.5rem",
            color: "#dc2626",
          }}
        >
          <strong>Setup Error:</strong> {setupError}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1.5rem",
            color: "#dc2626",
          }}
        >
          {error}
        </div>
      )}

      {/* PKP Selection Component */}
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
            margin: "0 0 1rem 0",
            fontSize: "1.25rem",
            fontWeight: "600",
            color: "#111827",
          }}
        >
          Your PKPs
        </h2>
        <p
          style={{
            margin: "0 0 1.5rem 0",
            fontSize: "14px",
            color: "#6b7280",
            lineHeight: "1.5",
          }}
        >
          View and manage PKPs associated with your authentication method. You
          can select an existing PKP or mint a new one.
        </p>

        {isServicesReady && services && user.authData ? (
          <PkpSelectionComponentSimplified
            authData={user.authData}
            onPkpSelected={handlePkpSelected}
            setStatus={setStatus}
            assertDependenciesLoaded={assertDependenciesLoaded}
            showError={showError}
            authMethodName={`${user.method} Auth`}
            disabled={!isServicesReady}
          />
        ) : (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          >
            {!isServicesReady ? (
              <div>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    border: "3px solid #e5e7eb",
                    borderTop: "3px solid #3b82f6",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 16px",
                  }}
                />
                <p style={{ color: "#6b7280", margin: 0 }}>
                  Waiting for Lit services to initialize...
                </p>
              </div>
            ) : (
              <p style={{ color: "#6b7280", margin: 0 }}>
                No authentication data available.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Selected PKP Info */}
      {selectedPkp && (
        <div
          style={{
            backgroundColor: "#f0f9ff",
            border: "1px solid #bfdbfe",
            borderRadius: "12px",
            padding: "1.5rem",
            marginTop: "1.5rem",
          }}
        >
          <h3
            style={{
              margin: "0 0 1rem 0",
              fontSize: "1.125rem",
              fontWeight: "600",
              color: "#1e40af",
            }}
          >
            ✅ Selected PKP
          </h3>
          <div style={{ display: "grid", gap: "0.5rem", fontSize: "14px" }}>
            <div>
              <strong>Token ID:</strong>{" "}
              <code
                style={{
                  backgroundColor: "#e0f2fe",
                  padding: "2px 6px",
                  borderRadius: "4px",
                }}
              >
                {selectedPkp.tokenId}
              </code>
            </div>
            <div>
              <strong>Public Key:</strong>{" "}
              <code
                style={{
                  backgroundColor: "#e0f2fe",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  wordBreak: "break-all",
                }}
              >
                {selectedPkp.publicKey}
              </code>
            </div>
            <div>
              <strong>ETH Address:</strong>{" "}
              <code
                style={{
                  backgroundColor: "#e0f2fe",
                  padding: "2px 6px",
                  borderRadius: "4px",
                }}
              >
                {selectedPkp.ethAddress}
              </code>
            </div>
          </div>

          <div
            style={{
              marginTop: "1rem",
              padding: "12px",
              backgroundColor: "#ecfdf5",
              borderRadius: "6px",
              border: "1px solid #a7f3d0",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                color: "#065f46",
                lineHeight: "1.4",
              }}
            >
              🎉 <strong>PKP Selected!</strong> You can now use this PKP for
              signing transactions, executing Lit Actions, and accessing
              encrypted data. More PKP management features coming soon!
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Explorer;
