import React, { useState } from "react";
import { useLitServiceSetup } from "../../hooks/useLitServiceSetup";
import PkpSelectionComponent from "../../components/common/PkpSelectionComponent";
import PKPManagement from "./PKPManagement";
import PaymentManager from "./PaymentManager";
import Search from "./Search";
import { useAppContext } from "../../router";
import { chronicleTestnet } from "../../main";
import { DEFAULT_NETWORK_NAME } from "../../pages";

interface AuthUser {
  authContext: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  pkpInfo: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  method: string;
  timestamp: number;
  authData?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  accountMethod?: string;
}

interface PKPInfo {
  tokenId: string;
  publicKey: string;
  ethAddress: string;
  pubkey?: string;
  balance?: string;
  balanceSymbol?: string;
  isLoadingBalance?: boolean;
}

interface ExplorerProps {
  user: AuthUser;
  onBack: () => void;
  onSignOut: () => void;
}

const Explorer: React.FC<ExplorerProps> = ({ user, onSignOut }) => {
  const [error, setError] = useState<string | null>(null);
  const [selectedPkp, setSelectedPkp] = useState<PKPInfo | null>(null);
  const [showPkpSelection, setShowPkpSelection] = useState<boolean>(true);
  const [isCreatingAuthContext, setIsCreatingAuthContext] =
    useState<boolean>(false);
  const [userWithAuthContext, setUserWithAuthContext] =
    useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<
    "pkp-management" | "payment-manager" | "search"
  >("pkp-management");

  // Setup Lit Protocol services
  const {
    services,
    isReady: isServicesReady,
    error: setupError,
  } = useLitServiceSetup({
    appName: "lit-explorer",
    networkName: DEFAULT_NETWORK_NAME,
    autoSetup: true,
  });

  const { assertDependenciesLoaded, showError } = useAppContext();

  // Load balance function
  const loadBalance = async (pkp: PKPInfo, forceRefresh: boolean = false) => {
    if (!pkp?.ethAddress || !services?.litClient) return pkp;

    // Prevent loading if already has balance (unless forcing refresh)
    if (pkp.balance && !forceRefresh) return pkp;

    try {
      const { createPublicClient, http } = await import("viem");

      const chainConfig = {
        id: chronicleTestnet.id,
        name: chronicleTestnet.name,
        nativeCurrency: {
          name: chronicleTestnet.name,
          symbol: chronicleTestnet.nativeCurrency.symbol,
          decimals: 18,
        },
        rpcUrls: {
          default: { http: [chronicleTestnet.rpcUrls.default.http[0]] },
          public: { http: [chronicleTestnet.rpcUrls.default.http[0]] },
        },
      };

      const client = createPublicClient({
        chain: chainConfig,
        transport: http(chronicleTestnet.rpcUrls.default.http[0]),
      });

      const balance = await client.getBalance({
        address: pkp.ethAddress as `0x${string}`,
      });

      const updatedPkp = {
        ...pkp,
        balance: (Number(balance) / 1e18).toFixed(6),
        balanceSymbol: chronicleTestnet.nativeCurrency.symbol,
        isLoadingBalance: false,
      };

      setSelectedPkp(updatedPkp);
      return updatedPkp;
    } catch (error) {
      console.error("Failed to load balance:", error);
      const updatedPkp = {
        ...pkp,
        balance: "0.000000",
        balanceSymbol: "tLit",
        isLoadingBalance: false,
      };
      setSelectedPkp(updatedPkp);
      return updatedPkp;
    }
  };

  const handlePkpSelected = (pkpInfo: PKPInfo) => {
    // Add loading state and load balance
    const pkpWithLoading = { ...pkpInfo, isLoadingBalance: true };
    setSelectedPkp(pkpWithLoading);
    setShowPkpSelection(false);
    // Load balance after selection
    loadBalance(pkpWithLoading);
  };

  const handleChangePkp = () => {
    setShowPkpSelection(true);
    setSelectedPkp(null);
    setUserWithAuthContext(null); // Reset auth context when changing PKP
  };

  // Function to refresh PKP balance (can be called from PaymentManager)
  const refreshPkpBalance = async () => {
    if (selectedPkp) {
      console.log("🔄 Refreshing PKP balance after payment operation...");
      await loadBalance(selectedPkp, true); // Force refresh
    }
  };

  const createAuthContext = async () => {
    if (
      !selectedPkp ||
      !user.authData ||
      !services?.authManager ||
      !services?.litClient
    ) {
      showError?.("Missing required data to create authentication context");
      return;
    }

    setIsCreatingAuthContext(true);
    setError(null);

    try {
      console.log("🔧 Creating authentication context for PKP permissions...");

      const { authManager, litClient } = assertDependenciesLoaded();

      const authContext = await authManager.createPkpAuthContext({
        authData: user.authData,
        pkpPublicKey: (selectedPkp.publicKey || selectedPkp.pubkey) as string,
        authConfig: {
          capabilityAuthSigs: [],
          expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
          statement: "",
          domain: "",
          resources: [
            ["pkp-signing", "*"],
            ["lit-action-execution", "*"],
            ["access-control-condition-decryption", "*"],
          ],
        },
        litClient: litClient,
      });

      // Create user object with auth context
      const updatedUser: AuthUser = {
        ...user,
        authContext: authContext,
      };

      setUserWithAuthContext(updatedUser);
      console.log("✅ Authentication context created successfully!");
    } catch (error: unknown) {
      console.error("Failed to create authentication context:", error);
      showError?.(
        `Failed to create authentication context: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsCreatingAuthContext(false);
    }
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

  // Helper function to extract account name from auth data
  const getAuthenticatedAccountName = (): string | null => {
    if (!user.authData) return null;

    // For Google OAuth - decode JWT token
    if (user.method === "google") {
      // Google auth returns a JWT token, let's decode it
      if (user.authData.accessToken) {
        try {
          // Decode JWT payload (second part of the token)
          const token = user.authData.accessToken;
          const base64Payload = token.split(".")[1];
          const payload = JSON.parse(atob(base64Payload));

          // Extract user info from JWT payload
          if (payload.name) {
            return payload.name;
          }
          if (payload.given_name && payload.family_name) {
            return `${payload.given_name} ${payload.family_name}`;
          }
          if (payload.given_name) {
            return payload.given_name;
          }
          if (payload.email) {
            return payload.email;
          }
        } catch (error) {
          console.error("Error decoding Google JWT:", error);
        }
      }

      // Fallback to other possible paths in authData
      if (user.authData.userInfo?.name) {
        return user.authData.userInfo.name;
      }
      if (
        user.authData.userInfo?.given_name &&
        user.authData.userInfo?.family_name
      ) {
        return `${user.authData.userInfo.given_name} ${user.authData.userInfo.family_name}`;
      }
      if (user.authData.userInfo?.given_name) {
        return user.authData.userInfo.given_name;
      }
      if (user.authData.userInfo?.email) {
        return user.authData.userInfo.email;
      }
      // Try alternative paths
      if (user.authData.name) {
        return user.authData.name;
      }
      if (user.authData.email) {
        return user.authData.email;
      }
    }

    // For Discord OAuth
    if (user.method === "discord") {
      // Discord auth returns a token in format: user_id_base64.token_signature
      if (user.authData.accessToken) {
        try {
          const token = user.authData.accessToken;
          const parts = token.split(".");

          if (parts.length >= 2) {
            // Decode the first part to get user ID
            const userIdBase64 = parts[0];
            const userId = atob(userIdBase64);

            console.log("Discord user ID:", userId);

            // Look for user info in authData first
            if (user.authData.userInfo) {
              console.log("Discord user info:", user.authData.userInfo);

              if (user.authData.userInfo.username) {
                return `@${user.authData.userInfo.username}`;
              }
              if (user.authData.userInfo.global_name) {
                return user.authData.userInfo.global_name;
              }
              if (user.authData.userInfo.display_name) {
                return user.authData.userInfo.display_name;
              }
            }

            // If no user info found, return the Discord user ID
            return `Discord ID: ${userId}`;
          }
        } catch (error) {
          console.error("Error parsing Discord token:", error);
        }
      }

      // Fallback to other possible paths in authData
      if (user.authData.userInfo?.username) {
        return `@${user.authData.userInfo.username}`;
      }
      if (user.authData.userInfo?.global_name) {
        return user.authData.userInfo.global_name;
      }
      if (user.authData.userInfo?.display_name) {
        return user.authData.userInfo.display_name;
      }
      // Try alternative paths
      if (user.authData.username) {
        return `@${user.authData.username}`;
      }
      if (user.authData.global_name) {
        return user.authData.global_name;
      }
    }

    return null;
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
            <strong>Method:</strong> {user.method}{" "}
            {user.accountMethod ? `(${user.accountMethod})` : ""}
          </div>
          {getAuthenticatedAccountName() ? (
            <div>
              <strong>Account:</strong>{" "}
              <span
                style={{
                  color: "#1e40af",
                  fontWeight: "500",
                }}
              >
                {getAuthenticatedAccountName()}
              </span>
            </div>
          ) : (
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
          )}
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
          {selectedPkp && !showPkpSelection
            ? "Your Selected PKP"
            : "Your Available PKPs"}
        </h2>

        {selectedPkp && !showPkpSelection ? (
          /* Selected PKP Display */
          <div>
            <div
              style={{
                backgroundColor: "#f8f9fa",
                border: "1px solid #e9ecef",
                borderRadius: "8px",
                padding: "1.5rem",
                marginBottom: "1rem",
              }}
            >
              <div style={{ display: "grid", gap: "1rem", fontSize: "14px" }}>
                <div>
                  <strong style={{ color: "#374151" }}>Token ID:</strong>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: "12px",
                      color: "#6b7280",
                      wordBreak: "break-all",
                      marginTop: "4px",
                    }}
                  >
                    {selectedPkp.tokenId}
                  </div>
                </div>

                <div>
                  <strong style={{ color: "#374151" }}>ETH Address:</strong>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: "12px",
                      color: "#6b7280",
                      marginTop: "4px",
                    }}
                  >
                    {selectedPkp.ethAddress}
                  </div>
                </div>

                <div>
                  <strong style={{ color: "#374151" }}>Public Key:</strong>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: "12px",
                      color: "#6b7280",
                      wordBreak: "break-all",
                      marginTop: "4px",
                    }}
                  >
                    {selectedPkp.publicKey}
                  </div>
                </div>

                <div>
                  <strong style={{ color: "#374151" }}>Balance:</strong>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#059669",
                      fontWeight: "600",
                      marginTop: "4px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {selectedPkp.isLoadingBalance ? (
                      <>
                        <div
                          style={{
                            width: "14px",
                            height: "14px",
                            border: "2px solid #e5e7eb",
                            borderTop: "2px solid #059669",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                          }}
                        />
                        Loading balance...
                      </>
                    ) : (
                      <>
                        {selectedPkp.balance || "0.000000"}{" "}
                        {selectedPkp.balanceSymbol || "tLit"}{" "}
                        <span style={{ color: "#6b7280", fontWeight: "400" }}>
                          (Chain ID: 175188)
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <button
                onClick={handleChangePkp}
                style={{
                  padding: "12px 20px",
                  backgroundColor: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Change PKP
              </button>

              {!userWithAuthContext && (
                <button
                  onClick={createAuthContext}
                  disabled={isCreatingAuthContext || !isServicesReady}
                  style={{
                    padding: "12px 20px",
                    backgroundColor:
                      isCreatingAuthContext || !isServicesReady
                        ? "#9ca3af"
                        : "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor:
                      isCreatingAuthContext || !isServicesReady
                        ? "not-allowed"
                        : "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {isCreatingAuthContext && (
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
                  {isCreatingAuthContext
                    ? "Creating..."
                    : "🔑 Generate Auth Context"}
                </button>
              )}

              {userWithAuthContext && (
                <div
                  style={{
                    padding: "12px 20px",
                    backgroundColor: "#dcfce7",
                    color: "#166534",
                    border: "1px solid #bbf7d0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  ✅ Auth Context Ready
                </div>
              )}
            </div>

            {!userWithAuthContext && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  backgroundColor: "#fef3c7",
                  border: "1px solid #f59e0b",
                  borderRadius: "8px",
                  fontSize: "14px",
                  color: "#92400e",
                }}
              >
                <strong>📋 Next Step:</strong> Generate an Auth Context to
                manage PKP permissions and perform operations.
              </div>
            )}
          </div>
        ) : (
          /* PKP Selection Component */
          <div>
            {isServicesReady && services && user.authData ? (
              <PkpSelectionComponent
                authData={user.authData}
                account={user.authData?.account}
                walletClient={user.authData?.walletClient}
                accountMethod={
                  user.accountMethod as "privateKey" | "walletClient"
                }
                onPkpSelected={handlePkpSelected}
                setStatus={() => {}}
                assertDependenciesLoaded={assertDependenciesLoaded}
                showError={showError}
                authMethodName={user.accountMethod!}
                disabled={!isServicesReady}
                showDisplayCode={false}
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
        )}
      </div>

      {/* PKP Management Section - Only show when PKP is selected, not in selection mode, and auth context is ready */}
      {selectedPkp && !showPkpSelection && userWithAuthContext && (
        <div style={{ marginTop: "20px" }}>
          {/* Tab Navigation */}
          <div
            style={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "12px 12px 0 0",
              padding: "0",
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <button
                onClick={() => setActiveTab("pkp-management")}
                style={{
                  flex: 1,
                  padding: "16px 20px",
                  backgroundColor:
                    activeTab === "pkp-management" ? "#3b82f6" : "transparent",
                  color: activeTab === "pkp-management" ? "white" : "#6b7280",
                  border: "none",
                  borderRadius: "12px 0 0 0",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                🔐 PKP Permissions
              </button>
              <button
                onClick={() => setActiveTab("payment-manager")}
                style={{
                  flex: 1,
                  padding: "16px 20px",
                  backgroundColor:
                    activeTab === "payment-manager" ? "#3b82f6" : "transparent",
                  color: activeTab === "payment-manager" ? "white" : "#6b7280",
                  border: "none",
                  borderRadius: "0",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                💰 Payment Manager
              </button>
              <button
                onClick={() => setActiveTab("search")}
                style={{
                  flex: 1,
                  padding: "16px 20px",
                  backgroundColor:
                    activeTab === "search" ? "#3b82f6" : "transparent",
                  color: activeTab === "search" ? "white" : "#6b7280",
                  border: "none",
                  borderRadius: "0 12px 0 0",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                🔍 Search
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div
            style={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderTop: "none",
              borderRadius: "0 0 12px 12px",
              padding: "2rem",
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
            }}
          >
            {activeTab === "pkp-management" ? (
              <PKPManagement
                user={userWithAuthContext}
                services={services}
                selectedPkp={selectedPkp}
                isServicesReady={isServicesReady}
              />
            ) : activeTab === "payment-manager" ? (
              <PaymentManager
                user={userWithAuthContext}
                services={services}
                selectedPkp={selectedPkp}
                isServicesReady={isServicesReady}
                onBalanceChange={refreshPkpBalance}
              />
            ) : (
              <Search user={userWithAuthContext} />
            )}
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
