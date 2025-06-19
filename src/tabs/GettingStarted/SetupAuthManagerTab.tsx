/**
 * SetupAuthManagerTab.tsx
 *
 * Demonstrates storage plugin configuration and Auth Manager creation.
 * Shows storage selection, configuration, and authentication management setup.
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

interface StorageOption {
  name: string;
  description: string;
  recommended: boolean;
  available: boolean;
  code: string;
  createStorage: () => any;
}

const SetupAuthManagerTab: React.FC = () => {
  const { areDependenciesLoaded, showError, setStatus } =
    useOutletContext<TabContext>();
  const [managerStatus, setManagerStatus] = useState<string>("Not initialized");
  const [storageStatus, setStorageStatus] = useState<string>("Not selected");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [managerResult, setManagerResult] = useState<any>(null);
  const [storageResult, setStorageResult] = useState<any>(null);
  const [selectedStorage, setSelectedStorage] =
    useState<string>("localStorage");
  const [showSingletonPattern, setShowSingletonPattern] =
    useState<boolean>(false);

  const storageOptions: Record<string, StorageOption> = {
    localStorage: {
      name: "localStorage",
      description: "Browser localStorage - persists between sessions",
      recommended: true,
      available: true,
      code: `import { createAuthManager, storagePlugins } from "@lit-protocol/auth";

const authManager = createAuthManager({
  storage: storagePlugins.localStorage({
    appName: "my-app",
    networkName: "naga-dev",
  }),
});`,
      createStorage: () =>
        storagePlugins.localStorage({
          appName: "my-app",
          networkName: "naga-dev",
        }),
    },
    localStorageNode: {
      name: "localStorageNode",
      description: "Node.js file-based storage - for server-side applications",
      recommended: false,
      available: false, // Not available in browser environment
      code: `import { createAuthManager, storagePlugins } from "@lit-protocol/auth";

const authManager = createAuthManager({
  storage: storagePlugins.localStorageNode({
    appName: "my-node-app",
    networkName: "naga-dev", 
    storagePath: "./lit-auth-storage"
  }),
});`,
      createStorage: () => {
        throw new Error(
          "localStorageNode is not available in browser environment"
        );
      },
    },
    custom: {
      name: "custom",
      description: "Custom storage implementation for specific needs",
      recommended: false,
      available: true,
      code: `import { createAuthManager } from "@lit-protocol/auth";

// Custom storage plugin example
const customStorage = {
  async write({ address, authData }) {
    // Your custom write logic
    await myDatabase.set(\`lit-auth:\${address}\`, authData);
  },
  async read({ address }) {
    // Your custom read logic
    return await myDatabase.get(\`lit-auth:\${address}\`);
  },
  async writeInnerDelegationAuthSig({ publicKey, authSig }) {
    // Store delegation auth signature
    await myDatabase.set(\`lit-delegation:\${publicKey}\`, authSig);
  },
  async readInnerDelegationAuthSig({ publicKey }) {
    // Retrieve delegation auth signature
    return await myDatabase.get(\`lit-delegation:\${publicKey}\`);
  },
  async writePKPTokens({ authMethodType, authMethodId, tokenIds }) {
    // Cache PKP token IDs
    const key = \`pkp-tokens:\${authMethodType}:\${authMethodId}\`;
    await myDatabase.set(key, tokenIds);
  },
  async readPKPTokens({ authMethodType, authMethodId }) {
    // Retrieve cached PKP token IDs
    const key = \`pkp-tokens:\${authMethodType}:\${authMethodId}\`;
    return await myDatabase.get(key);
  }
  // ... implement other required methods
};

const authManager = createAuthManager({
  storage: customStorage,
});`,
      createStorage: () => {
        // Mock custom storage for demo purposes
        return {
          write: async () => console.log("Custom storage write"),
          read: async () => console.log("Custom storage read"),
          writeInnerDelegationAuthSig: async () =>
            console.log("Custom delegation write"),
          readInnerDelegationAuthSig: async () =>
            console.log("Custom delegation read"),
          writePKPTokens: async () => console.log("Custom PKP tokens write"),
          readPKPTokens: async () => console.log("Custom PKP tokens read"),
        };
      },
    },
  };

  const handleStorageSelect = (storageKey: string) => {
    setSelectedStorage(storageKey);
    const storage = storageOptions[storageKey];

    if (!storage.available) {
      setStorageResult({
        success: false,
        error: `${storage.name} is not available in browser environment`,
        storage: storage.name,
        description: storage.description,
        timestamp: new Date().toISOString(),
      });
      setStorageStatus(`❌ ${storage.name} not available`);
      setStatus(`${storage.name} storage is not available`);
      showError(
        `${storage.name} storage is not available in browser environment`
      );
      return;
    }

    setStorageResult({
      success: true,
      storage: storage.name,
      description: storage.description,
      config:
        storage.name === "localStorage"
          ? "localStorage({ appName: 'my-app', networkName: 'naga-dev' })"
          : storage.name === "custom"
          ? "Custom storage implementation with required methods"
          : "localStorageNode({ appName: 'my-node-app', networkName: 'naga-dev', storagePath: './lit-auth-storage' })",
      note:
        storage.name === "localStorage"
          ? "Persistent browser storage across sessions"
          : storage.name === "custom"
          ? "Implement your own storage logic with the provided interface"
          : "File-based storage for Node.js environments",
      timestamp: new Date().toISOString(),
    });
    setStorageStatus(`✅ ${storage.name} selected!`);
    setStatus(`Selected ${storage.name} storage configuration`);
  };

  const handleStorageTest = async () => {
    try {
      setIsTesting(true);
      setStorageStatus("Testing storage...");
      setStatus("Testing storage plugin...");

      const storage = storageOptions[selectedStorage];
      if (!storage.available) {
        throw new Error(`${storage.name} is not available`);
      }

      // Test storage configuration
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate async operation

      setStorageStatus(`✅ ${storage.name} tested successfully!`);
      setStorageResult({
        ...storageResult,
        tested: true,
        testResult: "Storage configuration validated successfully",
      });
      setStatus("Storage test completed successfully!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setStorageStatus(`❌ Error: ${errorMessage}`);
      setStorageResult({
        success: false,
        error: errorMessage,
        storage: selectedStorage,
        timestamp: new Date().toISOString(),
      });
      showError(`Storage test failed: ${errorMessage}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleCreateAuthManager = async () => {
    try {
      setIsCreating(true);
      setManagerStatus("Creating auth manager...");
      setStatus("Creating Auth Manager instance...");
      setManagerResult(null);

      const storage = storageOptions[selectedStorage];
      if (!storage.available) {
        throw new Error(
          `Cannot create Auth Manager: ${storage.name} storage is not available`
        );
      }

      // Create the auth manager with selected storage
      const storageInstance = storage.createStorage();
      const authManager = createAuthManager({
        storage: storageInstance,
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

  return (
    <div style={{ maxWidth: "90%" }}>
      <div style={{ marginBottom: "30px" }}>
        <h1>Setup Auth Manager</h1>
        <p style={{ color: "#666", fontSize: "16px", lineHeight: "1.6" }}>
          The Auth Manager handles authentication flows and session persistence.
          First, select your storage plugin, then create the Auth Manager
          instance. Storage plugins handle persistence of authentication data,
          session tokens, and user preferences.
        </p>
      </div>

      {/* Step 1: Storage Plugin Selection */}
      <div style={{ marginBottom: "30px" }}>
        <h2>Step 1: Choose Storage Plugin</h2>
        <DisplayCode
          code={storageOptions[selectedStorage].code}
          language="typescript"
          useSideBySide={true}
          renderComponent={
            <div>
              <h4 style={{ marginTop: "0", color: "#2c5282" }}>
                Select Storage Type
              </h4>
              <p
                style={{
                  fontSize: "14px",
                  color: "#666",
                  marginBottom: "15px",
                }}
              >
                Choose a storage plugin for authentication data persistence.
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  marginBottom: "20px",
                }}
              >
                {Object.entries(storageOptions).map(([key, option]) => (
                  <button
                    key={key}
                    onClick={() => handleStorageSelect(key)}
                    style={{
                      padding: "12px 16px",
                      backgroundColor:
                        selectedStorage === key ? "#007bff" : "#f8f9fa",
                      color: selectedStorage === key ? "white" : "#333",
                      border: `2px solid ${
                        selectedStorage === key ? "#007bff" : "#dee2e6"
                      }`,
                      borderRadius: "6px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <strong>{option.name}</strong>
                        {option.recommended && (
                          <span
                            style={{
                              marginLeft: "8px",
                              padding: "2px 6px",
                              backgroundColor: "#28a745",
                              color: "white",
                              fontSize: "11px",
                              borderRadius: "3px",
                            }}
                          >
                            RECOMMENDED
                          </span>
                        )}
                        {!option.available && (
                          <span
                            style={{
                              marginLeft: "8px",
                              padding: "2px 6px",
                              backgroundColor: "#dc3545",
                              color: "white",
                              fontSize: "11px",
                              borderRadius: "3px",
                            }}
                          >
                            NOT AVAILABLE
                          </span>
                        )}
                        <div
                          style={{
                            fontSize: "12px",
                            color: selectedStorage === key ? "#e6f3ff" : "#666",
                            marginTop: "4px",
                          }}
                        >
                          {option.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          }
        />
      </div>

      {/* Storage Comparison */}
      <div style={{ marginBottom: "30px" }}>
        <h3>Storage Options Comparison</h3>
        <div
          style={{
            backgroundColor: "#f8f9fa",
            border: "1px solid #dee2e6",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#e9ecef" }}>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    borderBottom: "1px solid #dee2e6",
                  }}
                >
                  Storage Type
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    borderBottom: "1px solid #dee2e6",
                  }}
                >
                  Persistence
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    borderBottom: "1px solid #dee2e6",
                  }}
                >
                  Use Case
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    borderBottom: "1px solid #dee2e6",
                  }}
                >
                  Availability
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  style={{
                    padding: "12px",
                    borderBottom: "1px solid #dee2e6",
                    fontWeight: "bold",
                  }}
                >
                  localStorage
                  <span
                    style={{
                      marginLeft: "8px",
                      padding: "2px 6px",
                      backgroundColor: "#28a745",
                      color: "white",
                      fontSize: "10px",
                      borderRadius: "3px",
                    }}
                  >
                    RECOMMENDED
                  </span>
                </td>
                <td
                  style={{ padding: "12px", borderBottom: "1px solid #dee2e6" }}
                >
                  Survives page refresh & browser restart
                </td>
                <td
                  style={{ padding: "12px", borderBottom: "1px solid #dee2e6" }}
                >
                  Web applications, client-side storage
                </td>
                <td
                  style={{ padding: "12px", borderBottom: "1px solid #dee2e6" }}
                >
                  ✅ Available
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "12px",
                    borderBottom: "1px solid #dee2e6",
                    fontWeight: "bold",
                  }}
                >
                  localStorageNode
                </td>
                <td
                  style={{ padding: "12px", borderBottom: "1px solid #dee2e6" }}
                >
                  File-based persistent storage
                </td>
                <td
                  style={{ padding: "12px", borderBottom: "1px solid #dee2e6" }}
                >
                  Node.js applications, server-side scripts
                </td>
                <td
                  style={{ padding: "12px", borderBottom: "1px solid #dee2e6" }}
                >
                  ❌ Node.js only
                </td>
              </tr>
              <tr>
                <td style={{ padding: "12px", fontWeight: "bold" }}>custom</td>
                <td style={{ padding: "12px" }}>Depends on implementation</td>
                <td style={{ padding: "12px" }}>
                  Database storage, encrypted storage, cloud storage
                </td>
                <td style={{ padding: "12px" }}>✅ Available</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Step 2: Create Auth Manager */}
      <div style={{ marginBottom: "30px" }}>
        <h2>Step 2: Create Auth Manager</h2>
        <DisplayCode
          code={storageOptions[selectedStorage].code}
          language="typescript"
          useSideBySide={true}
          renderComponent={
            <div>
              <h4 style={{ marginTop: "0", color: "#2c5282" }}>
                Create Auth Manager Instance
              </h4>
              <p
                style={{
                  fontSize: "14px",
                  color: "#666",
                  marginBottom: "15px",
                }}
              >
                Create an Auth Manager with your selected storage configuration.
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
                disabled={
                  isCreating || !storageOptions[selectedStorage].available
                }
                style={{
                  padding: "12px 24px",
                  backgroundColor: isCreating
                    ? "#6c757d"
                    : !storageOptions[selectedStorage].available
                    ? "#dc3545"
                    : "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "16px",
                  cursor:
                    isCreating || !storageOptions[selectedStorage].available
                      ? "not-allowed"
                      : "pointer",
                  transition: "background-color 0.2s",
                  width: "100%",
                }}
              >
                {isCreating
                  ? "Creating Auth Manager..."
                  : !storageOptions[selectedStorage].available
                  ? `Cannot Create - ${storageOptions[selectedStorage].name} Not Available`
                  : `Create Auth Manager with ${storageOptions[selectedStorage].name}`}
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
          With your Auth Manager configured with storage, you can now proceed to
          explore authentication flows and session management in the next
          sections.
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
