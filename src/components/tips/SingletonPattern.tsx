/**
 * SingletonPattern.tsx
 *
 * A popup component that demonstrates the singleton pattern implementation
 * for Lit Protocol components like LitClient and AuthManager.
 */

import React, { useState } from "react";
import { DisplayCode } from "../DisplayCode";

interface SingletonPatternProps {
  isOpen: boolean;
  onClose: () => void;
  componentType?: "litClient" | "authManager";
  selectedNetwork?: string;
}

const SingletonPattern: React.FC<SingletonPatternProps> = ({
  isOpen,
  onClose,
  componentType = "litClient",
  selectedNetwork = "nagaDev",
}) => {
  const [activeTab, setActiveTab] = useState<"litClient" | "authManager">(
    componentType
  );

  if (!isOpen) return null;

  const getLitClientSingletonCode = () => {
    const networkImport =
      selectedNetwork === "nagaTest"
        ? "nagaTest"
        : selectedNetwork === "naga"
        ? "naga"
        : "nagaDev";
    const networkVar =
      selectedNetwork === "nagaTest"
        ? "nagaTest"
        : selectedNetwork === "naga"
        ? "naga"
        : "nagaDev";

    return `import { createLitClient } from "@lit-protocol/lit-client";
import { ${networkImport} } from "@lit-protocol/networks";

// Singleton pattern implementation
let litClientInstance = null;

const getLitClient = async () => {
  if (!litClientInstance) {
    console.log("Creating new LitClient instance");
    litClientInstance = await createLitClient({ 
      network: ${networkVar} 
    });
  }
  return litClientInstance;
};

// Usage examples
const client1 = await getLitClient(); // Creates new instance
const client2 = await getLitClient(); // Returns existing instance
console.log(client1 === client2); // true - same instance

// Reset singleton (useful for testing)
const resetLitClient = () => {
  litClientInstance = null;
};`;
  };

  const getAuthManagerSingletonCode = () => {
    return `import { createAuthManager, storagePlugins } from "@lit-protocol/auth";

// Singleton pattern implementation
let authManagerInstance = null;

const getAuthManager = () => {
  if (!authManagerInstance) {
    console.log("Creating new AuthManager instance");
    authManagerInstance = createAuthManager({
      storage: storagePlugins.localStorage({
        appName: "my-app",
        networkName: "${selectedNetwork}",
      }),
    });
  }
  return authManagerInstance;
};

// Usage examples
const manager1 = getAuthManager(); // Creates new instance
const manager2 = getAuthManager(); // Returns existing instance
console.log(manager1 === manager2); // true - same instance

// Reset singleton (useful for testing)
const resetAuthManager = () => {
  authManagerInstance = null;
};`;
  };

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
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          width: "90%",
          maxWidth: "800px",
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid #dee2e6",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, color: "#2c5282" }}>
            Singleton Pattern Implementation
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#6c757d",
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "20px" }}>
          {/* Description */}
          <div style={{ marginBottom: "20px" }}>
            <p style={{ color: "#666", fontSize: "14px", lineHeight: "1.6" }}>
              The singleton pattern ensures that only one instance of a
              component exists throughout your application, preventing memory
              leaks and maintaining consistent state.
            </p>
          </div>

          {/* Tabs */}
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                display: "flex",
                gap: "10px",
                borderBottom: "1px solid #dee2e6",
              }}
            >
              <button
                onClick={() => setActiveTab("litClient")}
                style={{
                  padding: "10px 16px",
                  border: "none",
                  background: "none",
                  borderBottom:
                    activeTab === "litClient"
                      ? "2px solid #007bff"
                      : "2px solid transparent",
                  color: activeTab === "litClient" ? "#007bff" : "#6c757d",
                  cursor: "pointer",
                  fontWeight: activeTab === "litClient" ? "bold" : "normal",
                }}
              >
                Lit Client
              </button>
              <button
                onClick={() => setActiveTab("authManager")}
                style={{
                  padding: "10px 16px",
                  border: "none",
                  background: "none",
                  borderBottom:
                    activeTab === "authManager"
                      ? "2px solid #007bff"
                      : "2px solid transparent",
                  color: activeTab === "authManager" ? "#007bff" : "#6c757d",
                  cursor: "pointer",
                  fontWeight: activeTab === "authManager" ? "bold" : "normal",
                }}
              >
                Auth Manager
              </button>
            </div>
          </div>

          {/* Code Display */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <h4 style={{ margin: 0, color: "#2c5282" }}>
                {activeTab === "litClient"
                  ? "Lit Client Singleton"
                  : "Auth Manager Singleton"}
              </h4>
            </div>

            <DisplayCode
              code={
                activeTab === "litClient"
                  ? getLitClientSingletonCode()
                  : getAuthManagerSingletonCode()
              }
            />
          </div>

          {/* Benefits */}
          <div style={{ marginTop: "20px" }}>
            <h4 style={{ color: "#0066cc", margin: "0 0 10px 0" }}>
              Benefits of Singleton Pattern:
            </h4>
            <ul style={{ paddingLeft: "20px", margin: 0, color: "#666" }}>
              <li>Prevents multiple instances and potential memory leaks</li>
              <li>
                Maintains consistent configuration across your application
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingletonPattern;
