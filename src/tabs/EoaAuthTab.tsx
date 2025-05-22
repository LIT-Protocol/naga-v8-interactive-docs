import { useState } from "react";
import { replacer } from "../helper";
import { useAppContext } from "../router";

export default function EoaAuthTab() {
  const {
    getDependencyStatus,
    areDependenciesLoaded,
    authContext,
    activeMethod,
    setAuthContext,
    setActiveMethod,
    setStatus,
    assertDependenciesLoaded,
    siteAuthConfig,
  } = useAppContext();

  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const eoaAuthenticate = async () => {
    const { walletClient, authManager, litClient } = assertDependenciesLoaded();

    setStatus("Authenticating with EOA...");
    setIsAuthenticating(true);

    try {
      // Create an EOA-based auth context
      const eoaAuthContext = await authManager.createEoaAuthContext({
        config: {
          account: walletClient,
        },
        authConfig: siteAuthConfig,
        litClient: litClient,
      });

      console.log("eoaAuthContext:", eoaAuthContext);

      setAuthContext(eoaAuthContext);
      setActiveMethod("eoa");
      setStatus("EOA Authentication successful!");
    } catch (error: any) {
      console.error("EOA Authentication failed:", error);
      setStatus(
        `EOA Authentication failed: ${error?.message || "Unknown error"}`
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="tab-content">
      <h2>EOA Authentication</h2>
      <p>
        EOA (Externally Owned Account) authentication uses your Ethereum wallet
        to sign messages and authenticate with the Lit Protocol.
      </p>

      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          backgroundColor: "#f9f9f9",
          borderRadius: "6px",
          border: "1px solid #e0e0e0",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Prerequisites</h3>
        <ul>
          <li>
            Wallet Connection:{" "}
            {getDependencyStatus().walletClient ? (
              <span style={{ color: "green" }}>✓ Connected</span>
            ) : (
              <span style={{ color: "red" }}>✗ Not connected</span>
            )}
          </li>
          <li>
            Lit Client:{" "}
            {getDependencyStatus().litClient ? (
              <span style={{ color: "green" }}>✓ Initialised</span>
            ) : (
              <span style={{ color: "red" }}>✗ Not initialised</span>
            )}
          </li>
          <li>
            Auth Manager:{" "}
            {getDependencyStatus().authManager ? (
              <span style={{ color: "green" }}>✓ Initialised</span>
            ) : (
              <span style={{ color: "red" }}>✗ Not initialised</span>
            )}
          </li>
        </ul>

        <button
          onClick={eoaAuthenticate}
          disabled={!areDependenciesLoaded() || isAuthenticating}
          style={{
            marginTop: "15px",
            padding: "12px 20px",
            backgroundColor:
              areDependenciesLoaded() && !isAuthenticating
                ? "#3b82f6"
                : "#cccccc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor:
              areDependenciesLoaded() && !isAuthenticating
                ? "pointer"
                : "not-allowed",
            fontWeight: "500",
          }}
        >
          {!areDependenciesLoaded()
            ? "Waiting for dependencies..."
            : isAuthenticating
            ? "Authenticating..."
            : "Authenticate with EOA"}
        </button>
      </div>

      {/* Authentication Result */}
      {authContext && activeMethod === "eoa" && (
        <div style={{ marginTop: "20px" }}>
          <h3>Authentication Result</h3>
          <div
            style={{
              backgroundColor: "#f5f5f5",
              padding: "15px",
              borderRadius: "6px",
              overflowX: "auto",
            }}
          >
            <pre style={{ margin: 0, fontSize: "13px" }}>
              {JSON.stringify(authContext, replacer, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
