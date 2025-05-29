/**
 * SetupAuthManagerTab.tsx
 *
 * Demonstrates how to create and configure an Auth Manager instance.
 * Shows storage plugin configuration and authentication management setup.
 */

import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { createAuthManager, storagePlugins } from "@lit-protocol/auth";
import { DisplayCode } from "../../components/DisplayCode";
import SingletonPattern from "../../components/tips/SingletonPattern";
import { exploreClientStructure } from "../../utils/explore-structure";

interface TabContext {
  areDependenciesLoaded: () => boolean;
  showError: (error: string) => void;
  setStatus: (status: string) => void;
}

const SetupAuthManagerTab: React.FC = () => {
  const { areDependenciesLoaded, showError, setStatus } =
    useOutletContext<TabContext>();
  const [managerStatus, setManagerStatus] = useState<string>("Not initialized");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [managerResult, setManagerResult] = useState<any>(null);
  const [showSingletonPattern, setShowSingletonPattern] =
    useState<boolean>(false);

  const handleCreateAuthManager = async () => {
    try {
      setIsCreating(true);
      setManagerStatus("Creating auth manager...");
      setStatus("Creating Auth Manager instance...");
      setManagerResult(null);

      // Create the auth manager with localStorage plugin
      const authManager = createAuthManager({
        storage: storagePlugins.localStorage({
          appName: "my-app",
          networkName: "naga-dev",
        }),
      });

      const apis = exploreClientStructure(authManager, 3);

      setManagerStatus("✅ Auth Manager created successfully!");
      setStatus("Auth Manager created successfully!");
      setManagerResult(apis);

      console.log("Auth Manager instance:", authManager);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setManagerStatus(`❌ Error: ${errorMessage}`);
      setManagerResult({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
      showError(`Failed to create Auth Manager: ${errorMessage}`);
    } finally {
      setIsCreating(false);
    }
  };

  const authManagerCode = `import { createAuthManager, storagePlugins } from "@lit-protocol/auth";

// Create an Auth Manager instance
const authManager = createAuthManager({
  storage: storagePlugins.localStorage({
    appName: "my-app",
    networkName: "naga-dev",
  }),
});`;

  const storagePluginCode = `storagePlugins.localStorage({
  appName: "my-app",        // Unique app identifier
  networkName: "naga-dev",  // Network-specific storage
})`;

  return (
    <div style={{ maxWidth: "90%" }}>
      <div style={{ marginBottom: "30px" }}>
        <h1>Setup Auth Manager</h1>
        <p style={{ color: "#666", fontSize: "16px", lineHeight: "1.6" }}>
          The Auth Manager handles authentication flows and session persistence.
          It manages authentication tokens, session data, and provides storage
          through configurable plugins.
        </p>
      </div>

      {/* Status Card */}
      <div
        style={{
          padding: "20px",
          backgroundColor: "#f8f9fa",
          border: "1px solid #dee2e6",
          borderRadius: "8px",
          marginBottom: "30px",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0" }}>Current Status</h3>
        <p
          style={{
            margin: "0",
            fontFamily: "monospace",
            padding: "10px",
            backgroundColor: managerStatus.includes("✅")
              ? "#d4edda"
              : managerStatus.includes("❌")
              ? "#f8d7da"
              : "#fff3cd",
            borderRadius: "4px",
            border: `1px solid ${
              managerStatus.includes("✅")
                ? "#c3e6cb"
                : managerStatus.includes("❌")
                ? "#f5c6cb"
                : "#ffeaa7"
            }`,
          }}
        >
          {managerStatus}
        </p>
      </div>

      {/* Interactive Code Demo */}
      <div style={{ marginBottom: "30px" }}>
        <h2>Interactive Demo</h2>
        <DisplayCode
          code={authManagerCode}
          language="typescript"
          useSideBySide={true}
          renderComponent={
            <div>
              <h4 style={{ marginTop: "0", color: "#2c5282" }}>
                Try it yourself
              </h4>
              <p
                style={{
                  fontSize: "14px",
                  color: "#666",
                  marginBottom: "15px",
                }}
              >
                Click the button to create an Auth Manager instance with
                localStorage storage.
              </p>

              {/* Singleton Pattern Button */}
              <button
                onClick={() => setShowSingletonPattern(true)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#f8f9fa",
                  color: "#28a745",
                  border: "2px solid #28a745",
                  borderRadius: "6px",
                  fontSize: "14px",
                  cursor: "pointer",
                  marginBottom: "15px",
                  width: "100%",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#28a745";
                  e.currentTarget.style.color = "white";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "#f8f9fa";
                  e.currentTarget.style.color = "#28a745";
                }}
              >
                📋 View Singleton Pattern Implementation
              </button>

              <button
                onClick={handleCreateAuthManager}
                disabled={isCreating}
                style={{
                  padding: "12px 24px",
                  backgroundColor: isCreating ? "#6c757d" : "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "16px",
                  cursor: isCreating ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s",
                  width: "100%",
                }}
              >
                {isCreating
                  ? "Creating Auth Manager..."
                  : "Create Auth Manager"}
              </button>
            </div>
          }
          resultData={managerResult}
          resultLabel="Auth Manager APIs"
          isSuccess={managerStatus.includes("✅")}
        />
      </div>

      {/* Key Concepts */}
      <div style={{ marginBottom: "30px" }}>
        <h2>Key Concepts</h2>
        <div
          style={{
            backgroundColor: "#e7f3ff",
            border: "1px solid #b3d9ff",
            borderRadius: "6px",
            padding: "20px",
          }}
        >
          <h3 style={{ margin: "0 0 15px 0", color: "#0066cc" }}>
            AuthContext Creation
          </h3>
          <p style={{ marginBottom: "15px", color: "#333", fontSize: "14px" }}>
            This method caches two components:
          </p>
          <ul style={{ marginBottom: "20px", paddingLeft: "20px" }}>
            <li>
              <strong>Session Key Pair:</strong> A temporary cryptographic key
              pair generated on the client side that acts as a temporary
              identity for the client application. It consists of:
              <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
                <li>
                  <strong>Public key</strong> - shared with the Lit nodes
                </li>
                <li>
                  <strong>Secret key (private key)</strong> - kept securely on
                  the client
                </li>
              </ul>
            </li>
            <li style={{ marginTop: "10px" }}>
              <strong>Delegation AuthSig (Inner Auth Sig):</strong> A
              cryptographic attestation from the Lit Protocol nodes that
              authorises your session key to act on behalf of your PKP
            </li>
          </ul>
        </div>
      </div>

      {/* Next Steps */}
      <div
        style={{
          backgroundColor: "#fff3cd",
          border: "1px solid #ffeaa7",
          borderRadius: "6px",
          padding: "20px",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0", color: "#856404" }}>Next Steps</h3>
        <p style={{ margin: "0", color: "#856404" }}>
          With the Auth Manager configured, you can now explore network
          configuration and storage plugins to complete your foundation setup.
        </p>
      </div>

      {/* Singleton Pattern Popup */}
      <SingletonPattern
        isOpen={showSingletonPattern}
        onClose={() => setShowSingletonPattern(false)}
        componentType="authManager"
      />
    </div>
  );
};

export default SetupAuthManagerTab;
