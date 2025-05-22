import {
  createAuthManager as createAuthManagerSingleton,
  storagePlugins as storagePluginsSingleton,
} from "@lit-protocol/auth";
import { createLitClient as createLitClientSingleton } from "@lit-protocol/lit-client";
import { nagaDev } from "@lit-protocol/networks";
import { useEffect, useState } from "react";
import { useWalletClient } from "wagmi";
import { MainLayout } from "../layouts/MainLayout";
import { MintAndUsePkp } from "../tabs";
import EoaAuthTab from "../tabs/EoaAuthTab";
import GoogleAuthTab from "../tabs/GoogleAuthTab";

// --- Singleton instances ---
type LitClient = Awaited<ReturnType<typeof createLitClientSingleton>>;
type AuthManager = Awaited<ReturnType<typeof createAuthManagerSingleton>>;

let litClientInstance: LitClient | null = null;
let authManagerInstance: AuthManager | null = null;

const getLitClient = async (): Promise<LitClient> => {
  if (!litClientInstance) {
    console.log("Creating new LitClient instance (should happen only once)");
    litClientInstance = await createLitClientSingleton({ network: nagaDev });
  }
  return litClientInstance;
};

const getAuthManager = (): AuthManager => {
  if (!authManagerInstance) {
    console.log("Creating new AuthManager instance (should happen only once)");
    authManagerInstance = createAuthManagerSingleton({
      storage: storagePluginsSingleton.localStorage({
        appName: "my-app",
        networkName: "naga-dev",
      }),
    });
  }
  return authManagerInstance;
};

// DependencyStatus component for displaying dependency status with proper alignment
type Dependency = {
  name: string;
  isLoaded: boolean;
  description?: string; // Optional description for each dependency
};

interface DependencyStatusProps {
  dependencies: Dependency[];
  title?: string; // Optional custom title
}

const DependencyStatus = ({
  dependencies,
  title = "Dependencies Status:",
}: DependencyStatusProps) => {
  return (
    <div
      style={{
        padding: "12px",
        marginBottom: "20px",
        backgroundColor: "#f0f9ff",
        borderRadius: "4px",
        fontSize: "14px",
        border: "1px solid #bee3f8",
      }}
    >
      <h3 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>{title}</h3>
      <table
        style={{
          width: "100%",
          borderCollapse: "separate",
          borderSpacing: "0 4px",
        }}
      >
        <tbody>
          {dependencies.map((dep, index) => (
            <tr key={index}>
              <td
                style={{
                  textAlign: "left",
                  paddingRight: "10px",
                  fontWeight: "500",
                  minWidth: "120px",
                }}
              >
                {dep.name}:
              </td>
              <td
                style={{
                  textAlign: "left",
                  whiteSpace: "nowrap",
                }}
              >
                {dep.isLoaded ? (
                  <span style={{ color: "green", fontWeight: "bold" }}>
                    ✓ Loaded
                  </span>
                ) : (
                  <span style={{ color: "orange", fontWeight: "bold" }}>
                    ⟳ Loading...
                  </span>
                )}
              </td>
              {dep.description && (
                <td
                  style={{
                    textAlign: "left",
                    paddingLeft: "15px",
                    color: "#666",
                    fontSize: "13px",
                    fontStyle: "italic",
                  }}
                >
                  {dep.description}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add a hint for developers */}
      {/* <div
        style={{
          marginTop: "10px",
          fontSize: "12px",
          color: "#666",
          borderTop: "1px dashed #ccc",
          paddingTop: "8px",
        }}
      >
        <b>Dev Note:</b> To add new dependencies, update the{" "}
        <code>getDependencies()</code> function.
      </div> */}
    </div>
  );
};

// Authentication methods configuration
const ACTIONS = [
  {
    id: "eoa",
    name: "Auth with EOA",
    description: "Authenticate using your Ethereum wallet's EOA",
    category: "EOA Auth",
  },
  {
    id: "pkp",
    name: "Mint & Use PKP",
    description: "Mint and use a Programmable Key Pair",
    category: "EOA Auth",
  },
  {
    id: "google-auth",
    name: "Auth with Google",
    description: "Authenticate using your Google account",
    category: "PKP Auth Methods",
  },
  // More authentication methods will be added here
];

export const HomePage = () => {
  const { data: walletClient } = useWalletClient();

  const [status, setStatus] = useState<string>("");
  const [signature, setSignature] = useState<any>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [pkpInfo, setPkpInfo] = useState<any>(null);
  const [litClient, setLitClient] = useState<LitClient | null>(null);
  const [authManager, setAuthManager] = useState<AuthManager | null>(null);
  const [authContext, setAuthContext] = useState<any>(null);
  const [activeMethod, setActiveMethod] = useState<string>("eoa");
  const [messageToSign, setMessageToSign] = useState<string>(
    "Hello, Lit Protocol!"
  );
  const [isSigning, setIsSigning] = useState<boolean>(false);
  const [siteAuthConfig, setSiteAuthConfig] = useState<any>({
    domain: window.location.host,
    statement: "🫵 YOU AGREED TO THE TERMS AND CONDITIONS",
    resources: [
      ["pkp-signing", "*"],
      ["lit-action-execution", "*"],
    ],
    capabilityAuthSigs: [],
    expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  });

  // Load active tab from URL query parameter when component mounts
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get("tab");
    if (tab && ACTIONS.some((action) => action.id === tab)) {
      setActiveMethod(tab);
    } else if (urlParams.has("tab")) {
      // If tab parameter exists but is invalid, remove it
      urlParams.delete("tab");
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${
          urlParams.toString() ? "?" + urlParams.toString() : ""
        }`
      );
    }
  }, []);

  // Effect to initialize LitClient and AuthManager state using singletons
  useEffect(() => {
    const initClients = async () => {
      if (!litClient) {
        // Only set if not already in state
        const client = await getLitClient();
        // Check again in case of rapid re-renders or if state was set by another means
        // This check is against the current closure's `litClient` value.
        // A more robust check for multiple calls to set state might involve a ref for this effect's completion.
        // However, for setting from a singleton, simply calling set once is usually fine.
        setLitClient(client);
      }
      if (!authManager) {
        // Only set if not already in state
        const manager = getAuthManager();
        setAuthManager(manager);
      }
    };
    initClients();
  }, []); // Empty dependency array ensures this runs once on mount

  // Effect to update loading and status messages based on client availability
  useEffect(() => {
    if (walletClient && litClient && authManager) {
      setLoading(false);
      setStatus("All dependencies loaded successfully!");
    } else {
      setLoading(true);
      const missingDeps = [];
      if (!walletClient) missingDeps.push("Wallet Client");
      if (!litClient) missingDeps.push("Lit Client");
      if (!authManager) missingDeps.push("Auth Manager");
      setStatus(
        missingDeps.length > 0
          ? `Waiting for: ${missingDeps.join(", ")}...`
          : "Initializing..."
      );
    }
  }, [walletClient, litClient, authManager]);

  function assertDependenciesLoaded() {
    if (!walletClient || !authManager || !litClient) {
      throw new Error(
        `Missing dependencies: ${walletClient ? "" : "walletClient"} ${
          authManager ? "" : "authManager"
        } ${litClient ? "" : "litClient"}`
      );
    }

    return {
      walletClient,
      authManager,
      litClient,
    };
  }

  // Handle tab selection (navigation only, no action execution)
  const handleTabSelect = (actionId: string) => {
    setActiveMethod(actionId);
    // Update URL query parameter to reflect active tab
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set("tab", actionId);
    window.history.pushState(
      null,
      "",
      `${window.location.pathname}?${urlParams.toString()}`
    );
  };

  // Check if all dependencies are loaded
  const areDependenciesLoaded = () => {
    return !!(walletClient && authManager && litClient);
  };

  // Get dependency status for display
  const getDependencyStatus = () => {
    return {
      walletClient: !!walletClient,
      authManager: !!authManager,
      litClient: !!litClient,
    };
  };

  // Get dependencies for the DependencyStatus component
  const getDependencies = (): Dependency[] => {
    return [
      {
        name: "Wallet Client",
        isLoaded: !!walletClient,
      },
      {
        name: "Auth Manager",
        isLoaded: !!authManager,
      },
      {
        name: "Lit Client",
        isLoaded: !!litClient,
      },
      // Add new dependencies here by adding a new object with name, isLoaded, and optional description
    ];
  };

  // Check if we can mint PKP (requires auth context)
  const canMintPkp = () => {
    return areDependenciesLoaded() && !!authContext;
  };

  return (
    <MainLayout>
      <div
        className="doc-layout"
        style={{
          display: "flex",
          height: "100vh",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* Sidebar with tabs */}
        <div
          className="sidebar"
          style={{
            width: "280px",
            borderRight: "1px solid #eaeaea",
            padding: "20px",
            backgroundColor: "#f9f9f9",
            height: "100%",
            overflowY: "auto",
          }}
        >
          <h2 style={{ marginBottom: "20px" }}>Documentation</h2>

          <DependencyStatus dependencies={getDependencies()} />

          <div className="nav-tabs">
            {(() => {
              const groupedActions: { [key: string]: typeof ACTIONS } = {};
              ACTIONS.forEach((action) => {
                if (!groupedActions[action.category]) {
                  groupedActions[action.category] = [];
                }
                groupedActions[action.category].push(action);
              });

              return Object.entries(groupedActions).map(
                ([category, actionsInCategory], categoryIndex) => (
                  <div key={category}>
                    {categoryIndex > 0 && (
                      <hr
                        style={{ margin: "15px 0", borderColor: "#dddddd" }}
                      />
                    )}
                    <h3
                      style={{
                        fontSize: "1rem",
                        color: "#555",
                        marginBottom: "10px",
                        marginTop: "10px",
                      }}
                    >
                      {category}
                    </h3>
                    {actionsInCategory.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleTabSelect(action.id)}
                        style={{
                          padding: "10px 15px",
                          marginBottom: "10px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          backgroundColor:
                            activeMethod === action.id ? "#3b82f6" : "#ffffff",
                          color:
                            activeMethod === action.id ? "#ffffff" : "#333333",
                          border: `1px solid ${
                            activeMethod === action.id ? "#3b82f6" : "#dddddd"
                          }`,
                          transition: "all 0.2s",
                          width: "100%",
                          textAlign: "left",
                          fontWeight: "500",
                        }}
                      >
                        {action.name}
                      </button>
                    ))}
                  </div>
                )
              );
            })()}
          </div>
        </div>

        {/* Content area */}
        <div
          className="content"
          style={{
            flex: 1,
            padding: "20px",
            overflowY: "auto",
          }}
        >
          {/* <h1>Demo</h1> */}

          {/* Status messages */}
          {status && (
            <div
              style={{
                marginTop: "10px",
                marginBottom: "20px",
                padding: "15px",
                backgroundColor: loading ? "#fffbeb" : "#f0f9ff",
                borderRadius: "4px",
                borderLeft: `4px solid ${loading ? "#facc15" : "#3b82f6"}`,
              }}
            >
              <h3 style={{ margin: "0 0 5px 0" }}>Status:</h3>
              <p style={{ margin: 0 }}>{status}</p>
            </div>
          )}

          {/* EOA Authentication Tab */}
          {activeMethod === "eoa" && (
            <EoaAuthTab
              getDependencyStatus={getDependencyStatus}
              areDependenciesLoaded={areDependenciesLoaded}
              authContext={authContext}
              activeMethod={activeMethod}
              setAuthContext={setAuthContext}
              setActiveMethod={setActiveMethod}
              setStatus={setStatus}
              assertDependenciesLoaded={assertDependenciesLoaded}
              siteAuthConfig={siteAuthConfig}
            />
          )}

          {activeMethod === "google-auth" && (
            <GoogleAuthTab
              getDependencyStatus={getDependencyStatus}
              areDependenciesLoaded={areDependenciesLoaded}
              authContext={authContext}
              activeMethod={activeMethod}
              setAuthContext={setAuthContext}
              setActiveMethod={setActiveMethod}
              setStatus={setStatus}
              assertDependenciesLoaded={assertDependenciesLoaded}
              siteAuthConfig={siteAuthConfig}
            />
          )}

          {/* PKP Tab */}
          {activeMethod === "pkp" && (
            <MintAndUsePkp
              getDependencyStatus={getDependencyStatus}
              canMintPkp={canMintPkp}
              loading={loading}
              authContext={authContext}
              pkpInfo={pkpInfo}
              signature={signature}
              assertDependenciesLoaded={assertDependenciesLoaded}
              setStatus={setStatus}
              setPkpInfo={setPkpInfo}
              setSignature={setSignature}
              setLoading={setLoading}
            />
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default HomePage;
