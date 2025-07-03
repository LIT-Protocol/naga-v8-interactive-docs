import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

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

interface PKPManagementProps {
  user: AuthUser;
  services: any;
  selectedPkp: PKPInfo | null;
  isServicesReady: boolean;
}

interface ExplorerPKPPermissionsContextType {
  // PKP data
  selectedPkp: any;

  // Permissions data
  permissionsContext: any;
  isLoadingPermissions: boolean;
  permissionsError: string;

  // Actions
  loadPermissionsContext: () => Promise<void>;
  refreshPermissions: () => Promise<void>;

  // Permissions manager instance (for direct operations)
  getPermissionsManager: () => Promise<any>;

  // Remove operations tracking
  removingItems: Set<string>;
  setRemovingItems: React.Dispatch<React.SetStateAction<Set<string>>>;

  // Bulk operations
  isRevokingAll: boolean;
  revokeAllPermissions: () => Promise<void>;

  // Add operations
  addPermittedAction: (ipfsId: string, scopes: string[]) => Promise<void>;
  addPermittedAddress: (address: string, scopes: string[]) => Promise<void>;
  removePermittedAction: (ipfsCid: string) => Promise<void>;
  removePermittedAddress: (address: string) => Promise<void>;
  removePermittedAuthMethod: (
    authMethodType: number,
    authMethodId: string
  ) => Promise<void>;

  // Permission checks
  checkPermissions: (actionIpfsId?: string, address?: string) => Promise<any>;

  // Status management
  setStatus: (status: string) => void;
  addTransactionToast: (
    message: string,
    txHash: string,
    type?: "success" | "error"
  ) => void;
}

const ExplorerPKPPermissionsContext = createContext<
  ExplorerPKPPermissionsContextType | undefined
>(undefined);

interface ExplorerPKPPermissionsProviderProps {
  children: React.ReactNode;
  selectedPkp: any;
  user: AuthUser;
  services: any;
  setStatus: (status: string) => void;
  addTransactionToast: (
    message: string,
    txHash: string,
    type?: "success" | "error"
  ) => void;
}

const ExplorerPKPPermissionsProvider: React.FC<
  ExplorerPKPPermissionsProviderProps
> = ({
  children,
  selectedPkp,
  user,
  services,
  setStatus,
  addTransactionToast,
}) => {
  // State
  const [permissionsContext, setPermissionsContext] = useState<any>(null);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [permissionsError, setPermissionsError] = useState<string>("");
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  // Cached permissions manager to avoid repeated initialization
  const [cachedPermissionsManager, setCachedPermissionsManager] =
    useState<any>(null);
  const [cacheKey, setCacheKey] = useState<string>("");

  // Helper to get permissions manager (cached)
  const getPermissionsManager = useCallback(async () => {
    if (!selectedPkp || !services?.litClient || !user?.authContext) {
      throw new Error("Missing required data");
    }

    const currentCacheKey = `${selectedPkp.tokenId}-${selectedPkp.publicKey}`;

    // Return cached manager if available and valid
    if (cachedPermissionsManager && cacheKey === currentCacheKey) {
      return cachedPermissionsManager;
    }

    // Create new permissions manager
    const chainConfig = services.litClient.getChainConfig().viemConfig;
    const pkpViemAccount = await services.litClient.getPkpViemAccount({
      pkpPublicKey: selectedPkp.publicKey || selectedPkp.pubkey,
      authContext: user.authContext,
      chainConfig: chainConfig,
    });

    const pkpPermissionsManager =
      await services.litClient.getPKPPermissionsManager({
        pkpIdentifier: {
          tokenId: selectedPkp.tokenId,
        },
        account: pkpViemAccount,
      });

    // Cache the manager
    setCachedPermissionsManager(pkpPermissionsManager);
    setCacheKey(currentCacheKey);

    return pkpPermissionsManager;
  }, [user, selectedPkp, services, cachedPermissionsManager, cacheKey]);

  // Clear cache when PKP changes
  useEffect(() => {
    setCachedPermissionsManager(null);
    setCacheKey("");
  }, [selectedPkp?.tokenId, selectedPkp?.publicKey]);

  const loadPermissionsContext = useCallback(async () => {
    if (!selectedPkp) {
      setPermissionsError("No PKP selected");
      return;
    }

    setIsLoadingPermissions(true);
    setPermissionsError("");

    try {
      const pkpPermissionsManager = await getPermissionsManager();
      const context = await pkpPermissionsManager.getPermissionsContext();
      setPermissionsContext(context);

      console.log("✅ Permissions context loaded successfully");
    } catch (error: any) {
      console.error("Failed to load permissions context:", error);
      setPermissionsError(
        `Failed to load permissions: ${error.message || error}`
      );
    } finally {
      setIsLoadingPermissions(false);
    }
  }, [selectedPkp, getPermissionsManager]);

  const refreshPermissions = useCallback(async () => {
    await loadPermissionsContext();
  }, [loadPermissionsContext]);

  const addPermittedAction = useCallback(
    async (ipfsId: string, scopes: string[]) => {
      const pkpPermissionsManager = await getPermissionsManager();
      const result = await pkpPermissionsManager.addPermittedAction({
        ipfsId,
        scopes,
      });

      const txHash = result?.hash || result?.transactionHash || result;
      if (txHash) {
        addTransactionToast("Permitted action added successfully!", txHash);
      } else {
        setStatus("✅ Permitted action added successfully!");
      }

      setTimeout(refreshPermissions, 5000);
    },
    [getPermissionsManager, addTransactionToast, setStatus, refreshPermissions]
  );

  const addPermittedAddress = useCallback(
    async (address: string, scopes: string[]) => {
      const pkpPermissionsManager = await getPermissionsManager();
      const result = await pkpPermissionsManager.addPermittedAddress({
        address,
        scopes,
      });

      const txHash = result?.hash || result?.transactionHash || result;
      if (txHash) {
        addTransactionToast("Permitted address added successfully!", txHash);
      } else {
        setStatus("✅ Permitted address added successfully!");
      }

      setTimeout(refreshPermissions, 5000);
    },
    [getPermissionsManager, addTransactionToast, setStatus, refreshPermissions]
  );

  const removePermittedAction = useCallback(
    async (actionIpfsCid: string) => {
      const actionKey = `action:${actionIpfsCid}`;
      setRemovingItems((prev) => new Set([...prev, actionKey]));

      try {
        const pkpPermissionsManager = await getPermissionsManager();
        const result = await pkpPermissionsManager.removePermittedAction({
          ipfsId: actionIpfsCid,
        });

        const txHash = result?.hash || result?.transactionHash || result;
        if (txHash) {
          addTransactionToast("Permitted action removed successfully!", txHash);
        } else {
          setStatus("✅ Permitted action removed successfully!");
        }

        await refreshPermissions();
      } catch (error: any) {
        console.error("Failed to remove permitted action:", error);
        if (error.message?.includes("Not PKP NFT owner")) {
          setPermissionsError(
            "❌ You don't own this PKP. Only PKP owners can modify permissions."
          );
        } else {
          setPermissionsError(
            `❌ Failed to remove permitted action: ${error.message || error}`
          );
        }
      } finally {
        setRemovingItems((prev) => {
          const next = new Set(prev);
          next.delete(actionKey);
          return next;
        });
      }
    },
    [getPermissionsManager, addTransactionToast, setStatus, refreshPermissions]
  );

  const removePermittedAddress = useCallback(
    async (address: string) => {
      const addressKey = `address:${address}`;
      setRemovingItems((prev) => new Set([...prev, addressKey]));

      try {
        const pkpPermissionsManager = await getPermissionsManager();
        const result = await pkpPermissionsManager.removePermittedAddress({
          address,
        });

        const txHash = result?.hash || result?.transactionHash || result;
        if (txHash) {
          addTransactionToast(
            "Permitted address removed successfully!",
            txHash
          );
        } else {
          setStatus("✅ Permitted address removed successfully!");
        }

        await refreshPermissions();
      } catch (error: any) {
        console.error("Failed to remove permitted address:", error);
        if (error.message?.includes("Not PKP NFT owner")) {
          setPermissionsError(
            "❌ You don't own this PKP. Only PKP owners can modify permissions."
          );
        } else {
          setPermissionsError(
            `❌ Failed to remove permitted address: ${error.message || error}`
          );
        }
      } finally {
        setRemovingItems((prev) => {
          const next = new Set(prev);
          next.delete(addressKey);
          return next;
        });
      }
    },
    [getPermissionsManager, addTransactionToast, setStatus, refreshPermissions]
  );

  const removePermittedAuthMethod = useCallback(
    async (authMethodType: number, authMethodId: string) => {
      const authKey = `auth:${authMethodType}:${authMethodId}`;
      setRemovingItems((prev) => new Set([...prev, authKey]));

      try {
        const pkpPermissionsManager = await getPermissionsManager();
        const result = await pkpPermissionsManager.removePermittedAuthMethod({
          authMethodType,
          authMethodId,
        });

        const txHash = result?.hash || result?.transactionHash || result;
        if (txHash) {
          addTransactionToast("Auth method removed successfully!", txHash);
        } else {
          setStatus("✅ Auth method removed successfully!");
        }

        await refreshPermissions();
      } catch (error: any) {
        console.error("Failed to remove auth method:", error);
        if (error.message?.includes("Not PKP NFT owner")) {
          setPermissionsError(
            "❌ You don't own this PKP. Only PKP owners can modify permissions."
          );
        } else {
          setPermissionsError(
            `❌ Failed to remove auth method: ${error.message || error}`
          );
        }
      } finally {
        setRemovingItems((prev) => {
          const next = new Set(prev);
          next.delete(authKey);
          return next;
        });
      }
    },
    [getPermissionsManager, addTransactionToast, setStatus, refreshPermissions]
  );

  const revokeAllPermissions = useCallback(async () => {
    if (
      !confirm(
        "Are you sure you want to revoke ALL permissions? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsRevokingAll(true);

    try {
      const pkpPermissionsManager = await getPermissionsManager();
      const result = await pkpPermissionsManager.revokeAllPermissions();

      const txHash = result?.hash || result?.transactionHash || result;
      if (txHash) {
        setStatus(
          `✅ All permissions revoked successfully! Transaction: ${txHash}`
        );
      } else {
        setStatus("✅ All permissions revoked successfully!");
      }

      await refreshPermissions();
    } catch (error: any) {
      console.error("Failed to revoke all permissions:", error);
      if (error.message?.includes("Not PKP NFT owner")) {
        setPermissionsError(
          "❌ You don't own this PKP. Only PKP owners can modify permissions."
        );
      } else {
        setPermissionsError(
          `❌ Failed to revoke all permissions: ${error.message || error}`
        );
      }
    } finally {
      setIsRevokingAll(false);
    }
  }, [getPermissionsManager, setStatus, refreshPermissions]);

  const checkPermissions = useCallback(
    async (actionIpfsId?: string, address?: string) => {
      const pkpPermissionsManager = await getPermissionsManager();

      const actionPermitted = actionIpfsId?.trim()
        ? await pkpPermissionsManager.isPermittedAction({
            ipfsId: actionIpfsId,
          })
        : null;

      const addressPermitted = address?.trim()
        ? await pkpPermissionsManager.isPermittedAddress({ address })
        : null;

      return {
        actionPermitted,
        addressPermitted,
        actionIpfsId: actionIpfsId || "",
        address: address || "",
        timestamp: new Date().toISOString(),
      };
    },
    [getPermissionsManager]
  );

  const contextValue: ExplorerPKPPermissionsContextType = {
    selectedPkp,
    permissionsContext,
    isLoadingPermissions,
    permissionsError,
    loadPermissionsContext,
    refreshPermissions,
    getPermissionsManager,
    removingItems,
    setRemovingItems,
    isRevokingAll,
    revokeAllPermissions,
    addPermittedAction,
    addPermittedAddress,
    removePermittedAction,
    removePermittedAddress,
    removePermittedAuthMethod,
    checkPermissions,
    setStatus,
    addTransactionToast,
  };

  return (
    <ExplorerPKPPermissionsContext.Provider value={contextValue}>
      {children}
    </ExplorerPKPPermissionsContext.Provider>
  );
};

const useExplorerPKPPermissions = () => {
  const context = useContext(ExplorerPKPPermissionsContext);
  if (context === undefined) {
    throw new Error(
      "useExplorerPKPPermissions must be used within a ExplorerPKPPermissionsProvider"
    );
  }
  return context;
};

// Simple permissions dashboard component for Explorer
const ExplorerPermissionsDashboard: React.FC<{ disabled?: boolean }> = ({
  disabled = false,
}) => {
  const {
    permissionsContext,
    isLoadingPermissions,
    permissionsError,
    loadPermissionsContext,
    selectedPkp,
    addPermittedAction,
    addPermittedAddress,
    revokeAllPermissions,
    isRevokingAll,
  } = useExplorerPKPPermissions();

  // Auto-load permissions when component mounts or PKP changes
  useEffect(() => {
    if (selectedPkp && !permissionsContext && !isLoadingPermissions) {
      console.log(
        "🔄 Auto-loading permissions context for PKP:",
        selectedPkp.tokenId
      );
      loadPermissionsContext();
    }
  }, [
    selectedPkp,
    permissionsContext,
    isLoadingPermissions,
    loadPermissionsContext,
  ]);

  // Simple form states
  const [newActionIpfsId, setNewActionIpfsId] = useState(
    "QmSQDKRWEXZ9CGoucSTR11Mv6fhGqaytZ1MqrfHdkuS1Vg"
  );
  const [newAddress, setNewAddress] = useState(
    "0xef3eE1bD838aF5B36482FAe8a6Fc394C68d5Fa9F"
  );
  const [isAddingAction, setIsAddingAction] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  // Toggle state for detailed permissions view
  const [showDetailedPermissions, setShowDetailedPermissions] = useState(false);

  const handleAddAction = async () => {
    if (!newActionIpfsId.trim()) return;
    setIsAddingAction(true);
    try {
      await addPermittedAction(newActionIpfsId, ["sign-anything"]);
      setNewActionIpfsId("");
    } catch (error) {
      console.error("Failed to add action:", error);
    } finally {
      setIsAddingAction(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.trim()) return;
    setIsAddingAddress(true);
    try {
      await addPermittedAddress(newAddress, ["sign-anything"]);
      setNewAddress("");
    } catch (error) {
      console.error("Failed to add address:", error);
    } finally {
      setIsAddingAddress(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div
        style={{
          marginBottom: "20px",
          padding: "16px 20px",
          background: "#3b82f6",
          borderRadius: "12px",
          color: "white",
          textAlign: "center",
        }}
      >
        <h2
          style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "700" }}
        >
          🔐 PKP Permissions Dashboard
        </h2>
        <p
          style={{
            margin: "0",
            fontSize: "14px",
            opacity: 0.9,
            lineHeight: "1.4",
          }}
        >
          Manage what your PKP wallet can do. Add actions, addresses, and
          control permissions.
        </p>
      </div>

      {/* Current Permissions */}
      <div
        style={{
          marginBottom: "30px",
          padding: "20px",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h3 style={{ margin: 0, color: "#1f2937" }}>
            📋 Current Permissions
          </h3>
          <button
            onClick={loadPermissionsContext}
            disabled={isLoadingPermissions || disabled}
            style={{
              padding: "8px 16px",
              backgroundColor:
                isLoadingPermissions || disabled ? "#9ca3af" : "#f8fafc",
              color: "#3b82f6",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "500",
              cursor:
                isLoadingPermissions || disabled ? "not-allowed" : "pointer",
            }}
          >
            {isLoadingPermissions ? "Loading..." : "🔄 Refresh"}
          </button>
        </div>

        {permissionsError && (
          <div
            style={{
              padding: "12px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "6px",
              color: "#dc2626",
              fontSize: "14px",
              marginBottom: "16px",
            }}
          >
            ⚠️ Error: {permissionsError}
          </div>
        )}

        {isLoadingPermissions ? (
          <div
            style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}
          >
            <div
              style={{
                width: "24px",
                height: "24px",
                border: "2px solid #e5e7eb",
                borderTop: "2px solid #3b82f6",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 12px",
              }}
            />
            Loading permissions...
          </div>
        ) : permissionsContext ? (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "16px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#1f2937",
                  }}
                >
                  {permissionsContext.actions?.length || 0}
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  ⚡ Lit Actions
                </div>
              </div>
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#1f2937",
                  }}
                >
                  {permissionsContext.addresses?.length || 0}
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  🏠 Addresses
                </div>
              </div>
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#1f2937",
                  }}
                >
                  {permissionsContext.authMethods?.length || 0}
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  🔑 Auth Methods
                </div>
              </div>
            </div>

            {!permissionsContext.actions?.length &&
              !permissionsContext.addresses?.length &&
              !permissionsContext.authMethods?.length && (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#6b7280",
                    backgroundColor: "#f9fafb",
                    borderRadius: "8px",
                    border: "1px dashed #d1d5db",
                  }}
                >
                  <div style={{ fontSize: "48px", marginBottom: "12px" }}>
                    🔓
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "500",
                      marginBottom: "8px",
                    }}
                  >
                    No Permissions Set
                  </div>
                  <div style={{ fontSize: "14px" }}>
                    This PKP has no specific permissions configured. Use the
                    forms below to add permissions.
                  </div>
                </div>
              )}

            {/* Show detailed permissions toggle if they exist */}
            {(permissionsContext.actions?.length > 0 ||
              permissionsContext.addresses?.length > 0 ||
              permissionsContext.authMethods?.length > 0) && (
              <div>
                <button
                  onClick={() =>
                    setShowDetailedPermissions(!showDetailedPermissions)
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#475569",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.2s",
                  }}
                >
                  {showDetailedPermissions
                    ? "📋 Hide Detailed Permissions"
                    : "📋 Show Detailed Permissions"}
                  <span
                    style={{
                      transform: showDetailedPermissions
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.2s",
                    }}
                  >
                    ▼
                  </span>
                </button>

                {/* Detailed Permissions View */}
                {showDetailedPermissions && (
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "16px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    {/* Actions Details */}
                    {permissionsContext.actions?.length > 0 && (
                      <div style={{ marginBottom: "20px" }}>
                        <h4
                          style={{
                            margin: "0 0 12px 0",
                            color: "#1e293b",
                            fontSize: "16px",
                            fontWeight: "600",
                          }}
                        >
                          ⚡ Permitted Lit Actions (
                          {permissionsContext.actions.length})
                        </h4>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          {permissionsContext.actions.map(
                            (action: any, index: number) => (
                              <div
                                key={index}
                                style={{
                                  padding: "12px",
                                  backgroundColor: "white",
                                  borderRadius: "6px",
                                  border: "1px solid #e5e7eb",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "12px",
                                    fontFamily: "monospace",
                                    color: "#374151",
                                    wordBreak: "break-all",
                                  }}
                                >
                                  <strong>IPFS ID:</strong>{" "}
                                  {action.ipfsCid ||
                                    action.ipfsId ||
                                    action.id ||
                                    "N/A"}
                                </div>
                                {action.scopes && (
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      color: "#6b7280",
                                      marginTop: "4px",
                                    }}
                                  >
                                    <strong>Scopes:</strong>{" "}
                                    {Array.isArray(action.scopes)
                                      ? action.scopes.join(", ")
                                      : action.scopes}
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Addresses Details */}
                    {permissionsContext.addresses?.length > 0 && (
                      <div style={{ marginBottom: "20px" }}>
                        <h4
                          style={{
                            margin: "0 0 12px 0",
                            color: "#1e293b",
                            fontSize: "16px",
                            fontWeight: "600",
                          }}
                        >
                          🏠 Permitted Addresses (
                          {permissionsContext.addresses.length})
                        </h4>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          {permissionsContext.addresses.map(
                            (address: any, index: number) => (
                              <div
                                key={index}
                                style={{
                                  padding: "12px",
                                  backgroundColor: "white",
                                  borderRadius: "6px",
                                  border: "1px solid #e5e7eb",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "12px",
                                    fontFamily: "monospace",
                                    color: "#374151",
                                    wordBreak: "break-all",
                                  }}
                                >
                                  <strong>Address:</strong>{" "}
                                  {address.address ||
                                    address.ethAddress ||
                                    address.id ||
                                    "N/A"}
                                </div>
                                {address.scopes && (
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      color: "#6b7280",
                                      marginTop: "4px",
                                    }}
                                  >
                                    <strong>Scopes:</strong>{" "}
                                    {Array.isArray(address.scopes)
                                      ? address.scopes.join(", ")
                                      : address.scopes}
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Auth Methods Details */}
                    {permissionsContext.authMethods?.length > 0 && (
                      <div>
                        <h4
                          style={{
                            margin: "0 0 12px 0",
                            color: "#1e293b",
                            fontSize: "16px",
                            fontWeight: "600",
                          }}
                        >
                          🔑 Auth Methods (
                          {permissionsContext.authMethods.length})
                        </h4>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          {permissionsContext.authMethods.map(
                            (method: any, index: number) => (
                              <div
                                key={index}
                                style={{
                                  padding: "12px",
                                  backgroundColor: "white",
                                  borderRadius: "6px",
                                  border: "1px solid #e5e7eb",
                                }}
                              >
                                <div
                                  style={{ fontSize: "12px", color: "#374151" }}
                                >
                                  <strong>Type:</strong>{" "}
                                  {method.authMethodType ||
                                    method.type ||
                                    "N/A"}
                                </div>
                                <div
                                  style={{
                                    fontSize: "12px",
                                    fontFamily: "monospace",
                                    color: "#374151",
                                    marginTop: "4px",
                                    wordBreak: "break-all",
                                  }}
                                >
                                  <strong>ID:</strong>{" "}
                                  {method.authMethodId || method.id || "N/A"}
                                </div>
                                {method.scopes && (
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      color: "#6b7280",
                                      marginTop: "4px",
                                    }}
                                  >
                                    <strong>Scopes:</strong>{" "}
                                    {Array.isArray(method.scopes)
                                      ? method.scopes.join(", ")
                                      : method.scopes}
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              padding: "16px",
              backgroundColor: "#f3f4f6",
              borderRadius: "8px",
              textAlign: "center",
              color: "#6b7280",
            }}
          >
            No permissions loaded. Click refresh to load permissions.
          </div>
        )}
      </div>

      {/* Add Permissions Forms */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        {/* Add Action Form */}
        <div
          style={{
            padding: "20px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          }}
        >
          <h3 style={{ margin: "0 0 16px 0", color: "#1f2937" }}>
            ➕ Add Action Permission
          </h3>
          <p
            style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#6b7280" }}
          >
            Allow your PKP to execute a specific Lit Action.
          </p>
          <input
            type="text"
            value={newActionIpfsId}
            onChange={(e) => setNewActionIpfsId(e.target.value)}
            placeholder="IPFS ID (QmSQDKRWEXZ9CGoucSTR11Mv6fhGqaytZ1MqrfHdkuS1Vg)"
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "12px",
              fontFamily: "monospace",
              marginBottom: "12px",
            }}
          />
          <button
            onClick={handleAddAction}
            disabled={isAddingAction || !newActionIpfsId.trim() || disabled}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor:
                isAddingAction || !newActionIpfsId.trim() || disabled
                  ? "#9ca3af"
                  : "#10b981",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500",
              cursor:
                isAddingAction || !newActionIpfsId.trim() || disabled
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {isAddingAction ? "Adding..." : "Add Action Permission"}
          </button>
        </div>

        {/* Add Address Form */}
        <div
          style={{
            padding: "20px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          }}
        >
          <h3 style={{ margin: "0 0 16px 0", color: "#1f2937" }}>
            🏠 Add Address Permission
          </h3>
          <p
            style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#6b7280" }}
          >
            Allow a specific address to use your PKP.
          </p>
          <input
            type="text"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            placeholder="Ethereum Address (0xef3eE1bD838aF5B36482FAe8a6Fc394C68d5Fa9F)"
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "12px",
              fontFamily: "monospace",
              marginBottom: "12px",
            }}
          />
          <button
            onClick={handleAddAddress}
            disabled={isAddingAddress || !newAddress.trim() || disabled}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor:
                isAddingAddress || !newAddress.trim() || disabled
                  ? "#9ca3af"
                  : "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500",
              cursor:
                isAddingAddress || !newAddress.trim() || disabled
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {isAddingAddress ? "Adding..." : "Add Address Permission"}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div
        style={{
          padding: "20px",
          backgroundColor: "#fef2f2",
          borderRadius: "12px",
          border: "1px solid #fecaca",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <h3 style={{ margin: "0 0 16px 0", color: "#dc2626" }}>
          ⚠️ Danger Zone
        </h3>
        <p style={{ margin: "0 0 16px 0", color: "#6b7280", fontSize: "14px" }}>
          <strong>Warning:</strong> This will remove ALL permissions from your
          PKP. This action cannot be undone.
        </p>
        <button
          onClick={revokeAllPermissions}
          disabled={isRevokingAll || disabled}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: isRevokingAll || disabled ? "#9ca3af" : "#dc2626",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: isRevokingAll || disabled ? "not-allowed" : "pointer",
          }}
        >
          {isRevokingAll ? "Revoking All..." : "🚨 Revoke All Permissions"}
        </button>
      </div>
    </>
  );
};

// Main PKP Management Component
const PKPManagement: React.FC<PKPManagementProps> = ({
  user,
  services,
  selectedPkp,
  isServicesReady,
}) => {
  const [status, setStatus] = useState<string>("");

  // Transaction toast state for permissions operations
  const [transactionToasts, setTransactionToasts] = useState<
    Array<{
      id: string;
      message: string;
      txHash: string;
      type: "success" | "error";
      timestamp: number;
    }>
  >([]);

  // Transaction toast management
  const addTransactionToast = (
    message: string,
    txHash: string,
    type: "success" | "error" = "success"
  ) => {
    const toast = {
      id: Date.now().toString(),
      message,
      txHash,
      type,
      timestamp: Date.now(),
    };
    setTransactionToasts((prev) => [...prev, toast]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setTransactionToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 5000);
  };

  // Convert PKPInfo to protectedApp PkpInfo format
  const convertToProtectedAppPkpInfo = (pkp: PKPInfo | null) => {
    if (!pkp) return null;
    return {
      tokenId: pkp.tokenId,
      publicKey: pkp.publicKey,
      ethAddress: pkp.ethAddress,
      pubkey: pkp.pubkey || pkp.publicKey,
    };
  };

  // Since this component is now only rendered when authContext exists,
  // we can simplify the validation
  if (!selectedPkp || !user.authContext) {
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          color: "#dc2626",
          backgroundColor: "#fef2f2",
          borderRadius: "8px",
          border: "1px solid #fecaca",
          marginTop: "2rem",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>❌</div>
        <div
          style={{ fontSize: "16px", fontWeight: "500", marginBottom: "8px" }}
        >
          PKP Permissions Error
        </div>
        <div style={{ fontSize: "14px" }}>
          Missing required data for PKP permissions management.
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <ExplorerPKPPermissionsProvider
        selectedPkp={convertToProtectedAppPkpInfo(selectedPkp)}
        user={user}
        services={services}
        setStatus={setStatus}
        addTransactionToast={addTransactionToast}
      >
        <div
          style={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "2rem",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          }}
        >
          <ExplorerPermissionsDashboard disabled={!isServicesReady} />
        </div>
      </ExplorerPKPPermissionsProvider>

      {/* Status Display */}
      {status && (
        <div
          style={{
            marginTop: "1rem",
            padding: "12px",
            backgroundColor: "#f0f9ff",
            border: "1px solid #bfdbfe",
            borderRadius: "8px",
            color: "#1e40af",
            fontSize: "14px",
          }}
        >
          {status}
        </div>
      )}

      {/* Transaction Toasts */}
      {transactionToasts.length > 0 && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {transactionToasts.map((toast) => (
            <div
              key={toast.id}
              style={{
                padding: "12px 16px",
                backgroundColor:
                  toast.type === "success" ? "#10b981" : "#ef4444",
                color: "white",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                maxWidth: "400px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                animation: "slideIn 0.3s ease-out",
              }}
            >
              <div>{toast.message}</div>
              {toast.txHash && (
                <div
                  style={{ fontSize: "12px", opacity: 0.9, marginTop: "4px" }}
                >
                  TX: {toast.txHash.slice(0, 10)}...{toast.txHash.slice(-8)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default PKPManagement;
