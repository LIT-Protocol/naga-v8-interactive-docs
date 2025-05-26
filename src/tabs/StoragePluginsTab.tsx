/**
 * StoragePluginsTab.tsx
 *
 * Demonstrates storage plugin configuration for Lit Protocol authentication.
 * Shows localStorage, memory, and custom storage options with interactive testing.
 */

import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { DisplayCode } from "../components/DisplayCode";

interface TabContext {
  areDependenciesLoaded: () => boolean;
  showError: (error: string) => void;
  setStatus: (status: string) => void;
}

const StoragePluginsTab: React.FC = () => {
  const { areDependenciesLoaded, showError, setStatus } =
    useOutletContext<TabContext>();
  const [storageStatus, setStorageStatus] = useState<string>("Not tested");
  const [selectedStorage, setSelectedStorage] =
    useState<string>("localStorage");
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  const storageOptions = {
    localStorage: {
      name: "localStorage",
      description: "Browser localStorage - persists between sessions",
      recommended: true,
      code: `import { localStorage } from "@lit-protocol/auth/storage";

const storage = localStorage({
  appName: "my-app",
  networkName: "naga-dev",
});`,
    },
    localStorageNode: {
      name: "localStorageNode",
      description: "Node.js file-based storage - for server-side applications",
      recommended: false,
      code: `import { localStorageNode } from "@lit-protocol/auth/storage";

const storage = localStorageNode({
  appName: "my-node-app",
  networkName: "naga-dev", 
  storagePath: "./lit-auth-storage"
});`,
    },
    custom: {
      name: "custom",
      description: "Custom storage implementation for specific needs",
      recommended: false,
      code: `// Custom storage plugin example
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
};`,
    },
  };

  const handleStorageTest = async () => {
    try {
      setIsTesting(true);
      setStorageStatus("Testing storage...");
      setTestResult(null);
      setStatus("Testing storage plugin...");

      if (selectedStorage === "localStorage") {
        // Show localStorage configuration
        setStorageStatus("✅ localStorage configuration shown!");
        setTestResult({
          success: true,
          storage: "localStorage",
          operation: "configuration example",
          config:
            "localStorage({ appName: 'my-app', networkName: 'naga-dev' })",
          note: "Persistent browser storage across sessions",
          timestamp: new Date().toISOString(),
        });
      } else if (selectedStorage === "localStorageNode") {
        setStorageStatus("✅ Node.js storage configuration shown!");
        setTestResult({
          success: true,
          storage: "localStorageNode",
          operation: "configuration example",
          config:
            "localStorageNode({ appName: 'my-node-app', networkName: 'naga-dev', storagePath: './lit-auth-storage' })",
          note: "File-based storage for Node.js environments",
          timestamp: new Date().toISOString(),
        });
      } else {
        setStorageStatus("✅ Custom storage pattern shown!");
        setTestResult({
          success: true,
          storage: "custom",
          operation: "code example provided",
          note: "Implement your own storage logic with the provided interface",
          timestamp: new Date().toISOString(),
        });
      }

      setStatus("Storage configuration completed!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setStorageStatus(`❌ Error: ${errorMessage}`);
      setTestResult({
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

  const completeIntegrationCode = `import { createAuthManager } from "@lit-protocol/auth";
import { localStorage } from "@lit-protocol/auth/storage";
import { createLitClient } from "@lit-protocol/lit-client";
import { nagaDev } from "@lit-protocol/networks";

// Complete setup with browser storage
const setupLitProtocol = async () => {
  // 1. Create Lit Client
  const litClient = await createLitClient({ 
    network: nagaDev 
  });

  // 2. Create Auth Manager with localStorage
  const authManager = createAuthManager({
    storage: localStorage({
      appName: "my-app",
      networkName: "naga-dev",
    }),
  });

  return { litClient, authManager };
};

// For Node.js environments
import { localStorageNode } from "@lit-protocol/auth/storage";

const setupLitProtocolNode = async () => {
  const litClient = await createLitClient({ 
    network: nagaDev 
  });

  const authManager = createAuthManager({
    storage: localStorageNode({
      appName: "my-node-app", 
      networkName: "naga-dev",
      storagePath: "./lit-auth-storage"
    }),
  });

  return { litClient, authManager };
};`;

  return (
    <div style={{ maxWidth: "90%" }}>
      <div style={{ marginBottom: "30px" }}>
        <h1>Storage Plugins</h1>
        <p style={{ color: "#666", fontSize: "16px", lineHeight: "1.6" }}>
          Storage plugins handle persistence of authentication data, session
          tokens, and user preferences. Choose the right storage solution based
          on your application's requirements.
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
        <h3 style={{ margin: "0 0 10px 0" }}>Storage Test Status</h3>
        <p
          style={{
            margin: "0",
            fontFamily: "monospace",
            padding: "10px",
            backgroundColor: storageStatus.includes("✅")
              ? "#d4edda"
              : storageStatus.includes("❌")
              ? "#f8d7da"
              : "#fff3cd",
            borderRadius: "4px",
            border: `1px solid ${
              storageStatus.includes("✅")
                ? "#c3e6cb"
                : storageStatus.includes("❌")
                ? "#f5c6cb"
                : "#ffeaa7"
            }`,
          }}
        >
          {storageStatus}
        </p>
      </div>

      {/* Interactive Storage Testing */}
      <div style={{ marginBottom: "30px" }}>
        <h2>Interactive Storage Testing</h2>
        <DisplayCode
          code={
            storageOptions[selectedStorage as keyof typeof storageOptions].code
          }
          language="typescript"
          useSideBySide={true}
          renderComponent={
            <div>
              <h4 style={{ marginTop: "0", color: "#2c5282" }}>
                Test Storage Plugin
              </h4>
              <p
                style={{
                  fontSize: "14px",
                  color: "#666",
                  marginBottom: "15px",
                }}
              >
                Select a storage type and test its functionality.
              </p>

              <div style={{ marginBottom: "15px" }}>
                {Object.entries(storageOptions).map(([key, option]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedStorage(key)}
                    style={{
                      padding: "8px 16px",
                      margin: "4px",
                      backgroundColor:
                        selectedStorage === key ? "#007bff" : "#f8f9fa",
                      color: selectedStorage === key ? "white" : "#333",
                      border: `1px solid ${
                        selectedStorage === key ? "#007bff" : "#dee2e6"
                      }`,
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "14px",
                      transition: "all 0.2s",
                    }}
                  >
                    {option.name}
                    {option.recommended && (
                      <span
                        style={{
                          marginLeft: "6px",
                          padding: "1px 4px",
                          backgroundColor: "#28a745",
                          color: "white",
                          fontSize: "9px",
                          borderRadius: "2px",
                        }}
                      >
                        REC
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div
                style={{
                  fontSize: "12px",
                  color: "#666",
                  marginBottom: "15px",
                  padding: "8px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "4px",
                }}
              >
                {
                  storageOptions[selectedStorage as keyof typeof storageOptions]
                    .description
                }
              </div>

              <button
                onClick={handleStorageTest}
                disabled={isTesting}
                style={{
                  padding: "12px 24px",
                  backgroundColor: isTesting ? "#6c757d" : "#17a2b8",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "16px",
                  cursor: isTesting ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s",
                  width: "100%",
                }}
              >
                {isTesting
                  ? "Testing..."
                  : `Test ${
                      storageOptions[
                        selectedStorage as keyof typeof storageOptions
                      ].name
                    } Storage`}
              </button>
            </div>
          }
          resultData={testResult}
          resultLabel="Storage Test Result"
          isSuccess={storageStatus.includes("✅")}
        />
      </div>

      {/* Complete Integration Example */}
      <div style={{ marginBottom: "30px" }}>
        <h2>Complete Integration Example</h2>
        <DisplayCode code={completeIntegrationCode} language="typescript" />
      </div>

      {/* Storage Comparison */}
      <div style={{ marginBottom: "30px" }}>
        <h2>Storage Options Comparison</h2>
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
              </tr>
              <tr>
                <td style={{ padding: "12px", fontWeight: "bold" }}>custom</td>
                <td style={{ padding: "12px" }}>Depends on implementation</td>
                <td style={{ padding: "12px" }}>
                  Database storage, encrypted storage, cloud storage
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Considerations */}
      <div style={{ marginBottom: "30px" }}>
        <h2>Security Considerations</h2>
        <div
          style={{
            backgroundColor: "#fff3cd",
            border: "1px solid #ffeaa7",
            borderRadius: "6px",
            padding: "20px",
          }}
        >
          <h3 style={{ margin: "0 0 15px 0", color: "#856404" }}>
            Important Security Notes
          </h3>
          <ul
            style={{
              marginBottom: "20px",
              paddingLeft: "20px",
              color: "#856404",
            }}
          >
            <li>
              <strong>localStorage:</strong> Data is stored unencrypted in the
              browser. Never store sensitive information without encryption.
            </li>
            <li>
              <strong>localStorageNode:</strong> Files are stored unencrypted on
              the server. Ensure proper file permissions and consider encryption
              for sensitive data.
            </li>
            <li>
              <strong>Network separation:</strong> Always use different
              networkName values for different environments (dev, staging,
              prod).
            </li>
            <li>
              <strong>App isolation:</strong> Use unique appName values to
              prevent conflicts between applications.
            </li>
            <li>
              <strong>Data cleanup:</strong> Implement proper logout flows that
              clear stored authentication data.
            </li>
          </ul>

          <h4 style={{ margin: "15px 0 10px 0", color: "#856404" }}>
            Best Practices:
          </h4>
          <ul style={{ paddingLeft: "20px", margin: "0", color: "#856404" }}>
            <li>
              Use environment variables for appName and networkName
              configuration
            </li>
            <li>Implement error handling for storage operations</li>
            <li>
              Consider implementing data encryption for sensitive information
            </li>
            <li>
              Test storage functionality across different browsers and
              environments
            </li>
            <li>
              For Node.js: Set appropriate file permissions for the storage
              directory
            </li>
          </ul>
        </div>
      </div>

      {/* Next Steps */}
      <div
        style={{
          backgroundColor: "#d4edda",
          border: "1px solid #c3e6cb",
          borderRadius: "6px",
          padding: "20px",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0", color: "#155724" }}>
          🎉 Foundation Complete!
        </h3>
        <p style={{ margin: "0", color: "#155724" }}>
          You've now configured all the foundational components: Lit Client,
          Auth Manager, Network Configuration, and Storage Plugins. You're ready
          to explore authentication methods like Google, Discord, WebAuthn, and
          more!
        </p>
      </div>
    </div>
  );
};

export default StoragePluginsTab;
