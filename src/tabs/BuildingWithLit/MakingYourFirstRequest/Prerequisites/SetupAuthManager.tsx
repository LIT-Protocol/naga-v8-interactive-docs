/**
 * SetupAuthManager.tsx
 *
 * A beginner-friendly guide to setting up the Auth Manager for new developers.
 * Explains what the Auth Manager is, storage plugins, key Lit concepts, and provides interactive examples.
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createAuthManager, storagePlugins } from "@lit-protocol/auth";
import { DisplayCode } from "../../../../components/DisplayCode";
import { exploreClientStructure } from "../../../../utils/explore-structure";
import SingletonPattern from "../../../../components/tips/SingletonPattern";
import GreyBoarderWhiteBgContainer from "../../../../components/layout/GreyboardWhiteBgContainer";
import { RequiredPackages, NoteCallout } from "../../../../components/common";
import { pageStyles } from "../../../../styles/pageStyles";

interface StorageOption {
  name: string;
  description: string;
  detailedDescription: React.ReactNode;
  recommended: boolean;
  available: boolean;
  code: string;
  icon: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createStorage: () => any;
}

const SetupAuthManager: React.FC = () => {
  const [managerStatus, setManagerStatus] = useState<string>("Not initialized");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [managerResult, setManagerResult] = useState<unknown>(null);
  const [selectedStorage, setSelectedStorage] =
    useState<string>("localStorage");
  const [showSingletonPattern, setShowSingletonPattern] =
    useState<boolean>(false);

  const storageOptions: Record<string, StorageOption> = {
    localStorage: {
      name: "localStorage",
      description: "Browser storage - persists between sessions",
      detailedDescription: (
        <>
          Uses the browser's <code>localStorage</code> API to save the Auth
          Context. This means your authenticated session will persist even if
          you close and reopen your browser. Perfect for web applications where
          users expect to stay logged in.
        </>
      ),
      recommended: true,
      available: true,
      icon: "🌐",
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
      description: "File-based storage for Node.js applications",
      detailedDescription: (
        <>
          Saves the Auth Context to a file on your server's filesystem. This is
          designed for Node.js applications running on servers, not in browsers.
        </>
      ),
      recommended: false,
      available: false, // Not available in browser environment
      icon: "🖥️",
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
      description: "Build your own storage solution",
      detailedDescription:
        "Create your own storage implementation that can save to databases, encrypted storage, cloud storage, or any other system you prefer. You provide the functions to read and write the authentication data.",
      recommended: false,
      available: true,
      icon: "🔧",
      code: `import { createAuthManager } from "@lit-protocol/auth";

// Custom storage plugin example
const customStorage = {
  async write({ address, authData }) {
    // Save authentication data for this address
    await myDatabase.set(\`lit-auth:\${address}\`, authData);
  },
  async read({ address }) {
    // Retrieve authentication data for this address
    return await myDatabase.get(\`lit-auth:\${address}\`);
  },
  async writeInnerDelegationAuthSig({ publicKey, authSig }) {
    // Save delegation signature for session key
    await myDatabase.set(\`lit-delegation:\${publicKey}\`, authSig);
  },
  async readInnerDelegationAuthSig({ publicKey }) {
    // Retrieve delegation signature for session key
    return await myDatabase.get(\`lit-delegation:\${publicKey}\`);
  },
  async writePKPTokens({ authMethodType, authMethodId, tokenIds }) {
    // Cache PKP token IDs for this auth method
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
  };

  const handleCreateAuthManager = async () => {
    try {
      setIsCreating(true);
      setManagerStatus("Creating auth manager...");
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
    } finally {
      setIsCreating(false);
    }
  };

  const installationCode = `npm install @lit-protocol/auth`;

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>Setting Up the Auth Manager</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>What is the Auth Manager?</h2>
        <p style={pageStyles.p}>
          The Auth Manager handles all the complex work of managing user
          sessions, storing authentication data, and keeping track of
          permissions in a secure way.
        </p>
        <p style={pageStyles.p}>
          Just like a physical wallet stores your ID, credit cards, and
          important documents, the Auth Manager safely stores your digital
          identity used to prove who you are to the Lit network.
        </p>
      </GreyBoarderWhiteBgContainer>

      <RequiredPackages
        description="To use the Auth Manager, you'll need to install the authentication package:"
        packages={[
          {
            name: "@lit-protocol/auth",
            description:
              "The authentication library that provides the Auth Manager and storage plugins for managing user sessions and identity.",
          },
        ]}
        installationCode={installationCode}
        style={{ marginTop: "32px" }}
      />

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Understanding Key Concepts</h2>
        <p style={pageStyles.p}>
          Before we set up the Auth Manager, let's understand the key concepts
          that enable Lit's authentication to work:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            marginTop: "24px",
          }}
        >
          {[
            {
              title: "Session Keys",
              description:
                "Temporary cryptographic keys that act as your 'temporary ID' while using Lit Protocol. Think of them like a day pass to a building - they work for a limited time and let you access what you need.",
              icon: "🔑",
              detail:
                "Generated on your device and never shared with anyone else. The public key is shared with Lit nodes, but the private key stays securely on your device.",
            },
            {
              title: "Delegation Signatures",
              description:
                "Special permissions from the Lit network that authorize your session key to act on behalf of your identity. Like getting a signed authorization letter that proves you can act for someone.",
              icon: "📋",
              detail:
                "Created by Lit nodes after verifying your identity. These signatures prove to the network that your session key is authorized to perform the same operations you're authorized to perform.",
            },
            {
              title: "Storage Plugins",
              description:
                "Different ways to save your authentication data so you/your users don't have re-authenticate every time the page is refreshed. Like saving a file instead of creating it from scratch every time.",
              icon: "💾",
              detail:
                "Each storage option has different security and persistence characteristics. Choose based on your application's needs and security requirements.",
            },
            {
              title: "Auth Context",
              description:
                "The complete package of your session keys, permissions, and delegation signatures. This is what proves to Lit Protocol that you are who you say you are.",
              icon: "🪪",
              detail:
                "Combines all the pieces needed for authentication into one secure package that can be reused across multiple operations.",
            },
          ].map((concept, index) => (
            <div
              key={index}
              style={{
                padding: "24px",
                backgroundColor: "#f8fafc",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                <div style={{ fontSize: "2rem" }}>{concept.icon}</div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.3rem",
                    fontWeight: "600",
                    color: "#1f2937",
                  }}
                >
                  {concept.title}
                </h3>
              </div>
              <p
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "1rem",
                  color: "#4b5563",
                  lineHeight: "1.5",
                }}
              >
                {concept.description}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.9rem",
                  color: "#6b7280",
                  lineHeight: "1.4",
                  fontStyle: "italic",
                }}
              >
                {concept.detail}
              </p>
            </div>
          ))}
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Understanding Storage Plugins</h2>
        <p style={pageStyles.p}>
          Storage plugins are different methods of storing your Auth Context.
          Each method has different characteristics for where and how your data
          is stored:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            gap: "20px",
            marginTop: "24px",
            marginBottom: "24px",
          }}
        >
          {Object.entries(storageOptions).map(([key, option]) => (
            <div
              key={key}
              style={{
                padding: "20px",
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                border: `2px solid #e5e7eb`,
                opacity: 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                <div style={{ fontSize: "2rem" }}>{option.icon}</div>
                <div style={{ flex: 1 }}>
                  <h4
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: "1.2rem",
                      fontWeight: "600",
                      color: "#1f2937",
                    }}
                  >
                    {option.name}
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    {option.recommended && (
                      <span
                        style={{
                          padding: "2px 8px",
                          backgroundColor: "#22c55e",
                          color: "white",
                          fontSize: "11px",
                          borderRadius: "12px",
                          fontWeight: "600",
                        }}
                      >
                        RECOMMENDED
                      </span>
                    )}
                    {!option.available && (
                      <span
                        style={{
                          padding: "2px 8px",
                          backgroundColor: "#ef4444",
                          color: "white",
                          fontSize: "11px",
                          borderRadius: "12px",
                          fontWeight: "600",
                        }}
                      >
                        NODE.JS ONLY
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "0.95rem",
                  color: "#374151",
                  fontWeight: "500",
                }}
              >
                {option.description}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.85rem",
                  color: "#6b7280",
                  lineHeight: "1.4",
                }}
              >
                {option.detailedDescription}
              </p>
            </div>
          ))}
        </div>

        <NoteCallout
          variant="tip"
          title="Which Storage Should I Choose?"
          message={
            <>
              Most web applications, will use <code>localStorage</code> to store
              the Auth Context on behalf of the user. Only consider custom
              storage if you have specific security requirements or need to
              integrate with existing systems. For Node.js applications, use{" "}
              <code>localStorageNode</code>.
            </>
          }
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Create Your Auth Manager</h2>
        <p style={pageStyles.p}>
          Now let's create an Auth Manager with your chosen storage plugin:
        </p>

        <DisplayCode
          code={storageOptions[selectedStorage].code}
          language="typescript"
          useSideBySide={true}
          renderComponent={
            <div>
              <h4
                style={{
                  marginTop: "0",
                  color: "#2c5282",
                  marginBottom: "16px",
                }}
              >
                🔧 Choose Your Storage Plugin
              </h4>
              <p
                style={{
                  fontSize: "14px",
                  color: "#666",
                  marginBottom: "20px",
                }}
              >
                Select a storage plugin to see how it works and create an Auth
                Manager with it.
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  marginBottom: "24px",
                }}
              >
                {Object.entries(storageOptions).map(([key, option]) => (
                  <button
                    key={key}
                    onClick={() => handleStorageSelect(key)}
                    style={{
                      padding: "16px",
                      backgroundColor:
                        selectedStorage === key ? "#3b82f6" : "#ffffff",
                      color: selectedStorage === key ? "white" : "#374151",
                      border: `2px solid ${
                        selectedStorage === key ? "#3b82f6" : "#d1d5db"
                      }`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                      }}
                    >
                      <div style={{ fontSize: "1.5rem" }}>{option.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "4px",
                          }}
                        >
                          <strong style={{ fontSize: "1rem" }}>
                            {option.name}
                          </strong>
                          {option.recommended && (
                            <span
                              style={{
                                padding: "2px 8px",
                                backgroundColor: "#22c55e",
                                color: "white",
                                fontSize: "11px",
                                borderRadius: "12px",
                                fontWeight: "600",
                              }}
                            >
                              RECOMMENDED
                            </span>
                          )}
                          {!option.available && (
                            <span
                              style={{
                                padding: "2px 8px",
                                backgroundColor: "#ef4444",
                                color: "white",
                                fontSize: "11px",
                                borderRadius: "12px",
                                fontWeight: "600",
                              }}
                            >
                              NOT AVAILABLE
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color:
                              selectedStorage === key ? "#e6f3ff" : "#6b7280",
                            marginBottom: "8px",
                            fontWeight: "500",
                          }}
                        >
                          {option.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Auth Manager Status */}
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  marginBottom: "20px",
                }}
              >
                <h5
                  style={{
                    margin: "0 0 8px 0",
                    color: "#374151",
                    fontSize: "0.9rem",
                  }}
                >
                  🔧 Auth Manager Status
                </h5>
                <p
                  style={{
                    margin: "0",
                    fontFamily: "monospace",
                    fontSize: "13px",
                    padding: "8px 12px",
                    backgroundColor: managerStatus.includes("✅")
                      ? "#dcfce7"
                      : managerStatus.includes("❌")
                      ? "#fee2e2"
                      : "#fef3c7",
                    borderRadius: "6px",
                    border: `1px solid ${
                      managerStatus.includes("✅")
                        ? "#bbf7d0"
                        : managerStatus.includes("❌")
                        ? "#fecaca"
                        : "#fde68a"
                    }`,
                    color: managerStatus.includes("✅")
                      ? "#166534"
                      : managerStatus.includes("❌")
                      ? "#991b1b"
                      : "#92400e",
                  }}
                >
                  {managerStatus}
                </p>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <button
                  onClick={handleCreateAuthManager}
                  disabled={
                    isCreating || !storageOptions[selectedStorage].available
                  }
                  style={{
                    padding: "14px 24px",
                    backgroundColor: isCreating
                      ? "#6b7280"
                      : !storageOptions[selectedStorage].available
                      ? "#ef4444"
                      : "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontWeight: "600",
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
                    ? selectedStorage === "localStorageNode"
                      ? "localStorageNode only works in Node.js environments"
                      : `${storageOptions[selectedStorage].name} Not Available`
                    : `Create Auth Manager with ${storageOptions[selectedStorage].name}`}
                </button>

                <button
                  onClick={() => setShowSingletonPattern(true)}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "#ffffff",
                    color: "#3b82f6",
                    border: "2px solid #3b82f6",
                    borderRadius: "8px",
                    fontSize: "0.9rem",
                    fontWeight: "500",
                    cursor: "pointer",
                    width: "100%",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#3b82f6";
                    e.currentTarget.style.color = "white";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "#ffffff";
                    e.currentTarget.style.color = "#3b82f6";
                  }}
                >
                  📋 View Singleton Pattern (Advanced)
                </button>
              </div>
            </div>
          }
          resultData={managerResult}
          resultLabel={managerResult ? "Auth Manager" : undefined}
          isSuccess={Boolean(managerResult && managerStatus.includes("✅"))}
          isError={Boolean(managerResult && managerStatus.includes("❌"))}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Understanding the Result</h2>
        <p style={pageStyles.p}>
          When you successfully create an Auth Manager, you get an object with
          methods for handling the three methods of authentication:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
            marginTop: "20px",
          }}
        >
          {[
            {
              method: "createEoaAuthContext()",
              description:
                "Creates authentication context using an Ethereum wallet (EOA). This is for users who want to authenticate with MetaMask or other wallet apps.",
              icon: "🦊",
            },
            {
              method: "createPkpAuthContext()",
              description:
                "Creates authentication context using a Programmable Key Pair (PKP). This is for when you want to use Lit's programmable wallets.",
              icon: "🔑",
            },
            {
              method: "createCustomAuthContext()",
              description:
                "Creates a custom authentication context for your own use case. This is for when you want to use Lit's authentication for your own use case.",
              icon: "🔧",
            },
          ].map((item, index) => (
            <div
              key={index}
              style={{
                padding: "16px",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>{item.icon}</span>
                <code>{item.method}</code>
              </div>
              <p
                style={{
                  margin: "0",
                  fontSize: "0.85rem",
                  color: "#4b5563",
                  lineHeight: "1.4",
                }}
              >
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </GreyBoarderWhiteBgContainer>

      {/* Next Steps */}
      <div
        style={{
          backgroundColor: "#f0f9ff",
          border: "2px solid #3b82f6",
          borderRadius: "12px",
          padding: "24px",
          marginTop: "32px",
        }}
      >
        <h3
          style={{
            margin: "0 0 12px 0",
            color: "#1e40af",
            fontSize: "1.3rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          🚀 What's Next?
        </h3>
        <p
          style={{
            margin: "0 0 16px 0",
            color: "#1e3a8a",
            lineHeight: "1.6",
          }}
        >
          Excellent! You now have an Auth Manager configured with storage. This
          is your authentication control center. Your next step is to start
          using it to perform actual Lit Protocol operations like encryption,
          PKP creation, or Lit Actions.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Link
            to="/building-with-lit/making-your-first-request/overview"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              backgroundColor: "#3b82f6",
              color: "white",
              textDecoration: "none",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "1rem",
              transition: "background-color 0.2s",
            }}
          >
            Continue to Making Your First Request →
          </Link>
        </div>
      </div>

      {/* Singleton Pattern Modal */}
      <SingletonPattern
        isOpen={showSingletonPattern}
        onClose={() => setShowSingletonPattern(false)}
        componentType="authManager"
      />
    </div>
  );
};

export default SetupAuthManager;
