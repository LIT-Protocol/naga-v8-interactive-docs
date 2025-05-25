/**
 * SetupAuthManagerTab.tsx
 * 
 * Demonstrates how to create and configure an Auth Manager instance.
 * Shows storage plugin configuration and authentication management setup.
 */

import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { createAuthManager, storagePlugins } from "@lit-protocol/auth";
import { DisplayCode } from "../components/DisplayCode";

interface TabContext {
  areDependenciesLoaded: () => boolean;
  showError: (error: string) => void;
  setStatus: (status: string) => void;
}

const SetupAuthManagerTab: React.FC = () => {
  const { areDependenciesLoaded, showError, setStatus } = useOutletContext<TabContext>();
  const [managerStatus, setManagerStatus] = useState<string>("Not initialized");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [managerResult, setManagerResult] = useState<any>(null);

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
      
      setManagerStatus("✅ Auth Manager created successfully!");
      setStatus("Auth Manager created successfully!");
      setManagerResult({
        success: true,
        message: "Auth Manager instance created successfully",
        storage: "localStorage",
        config: {
          appName: "my-app",
          networkName: "naga-dev"
        },
        timestamp: new Date().toISOString()
      });
      
      console.log("Auth Manager instance:", authManager);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setManagerStatus(`❌ Error: ${errorMessage}`);
      setManagerResult({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
      showError(`Failed to create Auth Manager: ${errorMessage}`);
    } finally {
      setIsCreating(false);
    }
  };

  const authManagerCode = `import { createAuthManager, storagePlugins } from "@lit-protocol/auth";

// Singleton pattern implementation
let authManagerInstance = null;

const getAuthManager = () => {
  if (!authManagerInstance) {
    console.log("Creating new AuthManager instance");
    authManagerInstance = createAuthManager({
      storage: storagePlugins.localStorage({
        appName: "my-app",
        networkName: "naga-dev",
      }),
    });
  }
  return authManagerInstance;
};

// Usage
const authManager = getAuthManager();`;

  const storagePluginCode = `storagePlugins.localStorage({
  appName: "my-app",        // Unique app identifier
  networkName: "naga-dev",  // Network-specific storage
})`;

  return (
    <div style={{ maxWidth: "800px" }}>
      <div style={{ marginBottom: "30px" }}>
        <h1>Setup Auth Manager</h1>
        <p style={{ color: "#666", fontSize: "16px", lineHeight: "1.6" }}>
          The Auth Manager handles authentication flows and session persistence. 
          It manages authentication tokens, session data, and provides storage through configurable plugins.
        </p>
      </div>

      {/* Status Card */}
      <div style={{
        padding: "20px",
        backgroundColor: "#f8f9fa",
        border: "1px solid #dee2e6",
        borderRadius: "8px",
        marginBottom: "30px"
      }}>
        <h3 style={{ margin: "0 0 10px 0" }}>Current Status</h3>
        <p style={{ 
          margin: "0", 
          fontFamily: "monospace",
          padding: "10px",
          backgroundColor: managerStatus.includes("✅") ? "#d4edda" : 
                           managerStatus.includes("❌") ? "#f8d7da" : "#fff3cd",
          borderRadius: "4px",
          border: `1px solid ${managerStatus.includes("✅") ? "#c3e6cb" : 
                                managerStatus.includes("❌") ? "#f5c6cb" : "#ffeaa7"}`
        }}>
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
              <h4 style={{ marginTop: "0", color: "#2c5282" }}>Try it yourself</h4>
              <p style={{ fontSize: "14px", color: "#666", marginBottom: "15px" }}>
                Click the button to create an Auth Manager instance with localStorage storage.
              </p>
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
                  width: "100%"
                }}
              >
                {isCreating ? "Creating Auth Manager..." : "Create Auth Manager"}
              </button>
            </div>
          }
          resultData={managerResult}
          resultLabel="Auth Manager Creation Result"
          isSuccess={managerStatus.includes("✅")}
        />
      </div>

      {/* Storage Plugins Section */}
      <div style={{ marginBottom: "30px" }}>
        <h2>Storage Plugin Configuration</h2>
        <DisplayCode
          code={storagePluginCode}
          language="typescript"
        />
        <div style={{ marginTop: "15px" }}>
          <h4 style={{ color: "#0066cc", margin: "15px 0 10px 0" }}>Configuration Options:</h4>
          <ul style={{ paddingLeft: "20px", margin: "0" }}>
            <li><strong>appName:</strong> Unique identifier for your application</li>
            <li><strong>networkName:</strong> Network-specific storage (e.g., "naga-dev", "mainnet")</li>
          </ul>
        </div>
      </div>

      {/* Key Concepts */}
      <div style={{ marginBottom: "30px" }}>
        <h2>Key Concepts</h2>
        <div style={{
          backgroundColor: "#e7f3ff",
          border: "1px solid #b3d9ff",
          borderRadius: "6px",
          padding: "20px"
        }}>
          <h3 style={{ margin: "0 0 15px 0", color: "#0066cc" }}>Authentication Management</h3>
          <ul style={{ marginBottom: "20px", paddingLeft: "20px" }}>
            <li><strong>Session Persistence:</strong> Automatically saves and restores auth sessions</li>
            <li><strong>Token Management:</strong> Handles authentication tokens and signatures</li>
            <li><strong>Storage Abstraction:</strong> Pluggable storage system for different environments</li>
          </ul>
          
          <h3 style={{ margin: "20px 0 15px 0", color: "#0066cc" }}>Best Practices</h3>
          <ul style={{ paddingLeft: "20px" }}>
            <li>Use singleton pattern to maintain consistent auth state</li>
            <li>Configure storage with unique app and network names</li>
            <li>Handle auth state changes gracefully</li>
            <li>Clear storage when switching networks or apps</li>
          </ul>
        </div>
      </div>

      {/* Next Steps */}
      <div style={{
        backgroundColor: "#fff3cd",
        border: "1px solid #ffeaa7",
        borderRadius: "6px",
        padding: "20px"
      }}>
        <h3 style={{ margin: "0 0 10px 0", color: "#856404" }}>Next Steps</h3>
        <p style={{ margin: "0", color: "#856404" }}>
          With the Auth Manager configured, you can now explore network configuration 
          and storage plugins to complete your foundation setup.
        </p>
      </div>
    </div>
  );
};

export default SetupAuthManagerTab; 