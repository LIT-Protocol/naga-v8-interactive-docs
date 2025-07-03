import { useState, useEffect } from "react";
import { privateKeyToAccount } from "viem/accounts";

// Configuration constants
const DEFAULT_PAGE_SIZE = 5;

// Site owner private key for minting PKPs (provided for demo)
const SITE_OWNER_PRIVATE_KEY =
  "0x65b80901b185bd7bd9c07178c8e3b2bfae62472feeeb86d3dd834e5b14c2d5f8";

// Chain configuration for balance fetching
const SUPPORTED_CHAINS = {
  yellowstone: {
    id: 2888,
    name: "Chronicle Yellowstone",
    symbol: "tLit",
    rpcUrl: "https://yellowstone-rpc.litprotocol.com/",
    explorerUrl: "https://yellowstone-explorer.litprotocol.com",
    testnet: true,
  },
};

interface PKPInfo {
  tokenId: string;
  publicKey: string;
  ethAddress: string;
  pubkey?: string;
  balance?: string;
  balanceSymbol?: string;
  isLoadingBalance?: boolean;
}

interface SimplePkpSelectionProps {
  authData: unknown;
  onPkpSelected: (pkpInfo: PKPInfo) => void;
  setStatus: (message: string) => void;
  assertDependenciesLoaded: () => { litClient: unknown; authManager: unknown };
  showError?: (errorMessage: string) => void;
  authMethodName: string;
  disabled?: boolean;
  onSelectionModeChange?: () => void;
}

export default function SimplePkpSelection({
  authData,
  onPkpSelected,
  setStatus,
  assertDependenciesLoaded,
  showError,
  authMethodName,
  disabled = false,
  onSelectionModeChange,
}: SimplePkpSelectionProps) {
  // Selection mode state
  const [selectionMode, setSelectionMode] = useState<"mint" | "existing">(
    "existing"
  );

  // Existing PKPs state
  const [existingPkps, setExistingPkps] = useState<PKPInfo[]>([]);
  const [isLoadingPkps, setIsLoadingPkps] = useState(false);
  const [selectedPkpIndex, setSelectedPkpIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    hasMore: false,
  });

  // Minting state
  const [isMinting, setIsMinting] = useState(false);

  // Utility function to format error messages
  const formatErrorMessage = (prefix: string, error: unknown): string => {
    let errorMessage = prefix;
    if (error instanceof Error) {
      errorMessage += error.message;
    } else if (typeof error === "object" && error !== null) {
      errorMessage += JSON.stringify(error, null, 2);
    } else {
      errorMessage += String(error);
    }
    return errorMessage;
  };

  // Balance fetching function
  const fetchPkpBalance = async (
    pkp: PKPInfo,
    chainKey: string = "yellowstone"
  ): Promise<{ balance: string; symbol: string } | null> => {
    console.log(
      `💰 [BALANCE] Fetching balance for PKP ${pkp.tokenId?.slice(
        -8
      )} at address ${pkp.ethAddress}`
    );
    try {
      const chainInfo =
        SUPPORTED_CHAINS[chainKey as keyof typeof SUPPORTED_CHAINS];
      if (!chainInfo || !pkp.ethAddress) {
        console.warn(
          `💰 [BALANCE] Missing chain info or address for PKP ${pkp.tokenId?.slice(
            -8
          )}`
        );
        return null;
      }

      console.log(
        `💰 [BALANCE] Using chain: ${chainInfo.name} (${chainInfo.symbol}) RPC: ${chainInfo.rpcUrl}`
      );

      // Import viem for balance fetching
      const { createPublicClient, http } = await import("viem");

      // Create chain config for viem
      const chainConfig = {
        id: chainInfo.id,
        name: chainInfo.name,
        network: chainInfo.name.toLowerCase().replace(/\s+/g, "-"),
        nativeCurrency: {
          name: chainInfo.name,
          symbol: chainInfo.symbol,
          decimals: 18,
        },
        rpcUrls: {
          default: { http: [chainInfo.rpcUrl] },
          public: { http: [chainInfo.rpcUrl] },
        },
      };

      const client = createPublicClient({
        chain: chainConfig,
        transport: http(chainInfo.rpcUrl),
      });

      console.log(
        `💰 [BALANCE] Making balance request for ${pkp.ethAddress}...`
      );
      const balance = await client.getBalance({
        address: pkp.ethAddress as `0x${string}`,
      });

      const formattedBalance = (Number(balance) / 1e18).toFixed(6);
      console.log(
        `💰 [BALANCE] ✅ Success! PKP ${pkp.tokenId?.slice(
          -8
        )} balance: ${formattedBalance} ${chainInfo.symbol}`
      );

      return {
        balance: formattedBalance,
        symbol: chainInfo.symbol,
      };
    } catch (error) {
      console.error(
        `💰 [BALANCE] ❌ Failed to fetch balance for PKP ${pkp.tokenId?.slice(
          -8
        )}:`,
        error
      );
      return null;
    }
  };

  // Load balances for all PKPs
  const loadBalancesForPkps = async (pkpsToLoad: PKPInfo[]) => {
    console.log(
      `💰 [BALANCE_BATCH] Starting balance loading for ${pkpsToLoad.length} PKPs:`,
      pkpsToLoad.map((p) => p.tokenId?.slice(-8))
    );
    const updatedPkps = [...pkpsToLoad];

    // Set loading state for all PKPs
    updatedPkps.forEach((pkp) => {
      pkp.isLoadingBalance = true;
    });
    console.log(`💰 [BALANCE_BATCH] Set loading state for all PKPs`);
    setExistingPkps([...updatedPkps]);

    // Fetch balances in parallel
    const balancePromises = pkpsToLoad.map(async (pkp, index) => {
      const balanceInfo = await fetchPkpBalance(pkp);
      return { index, balanceInfo };
    });

    console.log(
      `💰 [BALANCE_BATCH] Waiting for ${balancePromises.length} balance requests...`
    );
    const results = await Promise.allSettled(balancePromises);

    // Update PKPs with balance results
    results.forEach((result, idx) => {
      if (result.status === "fulfilled" && result.value.balanceInfo) {
        const { balance, symbol } = result.value.balanceInfo;
        updatedPkps[idx].balance = balance;
        updatedPkps[idx].balanceSymbol = symbol;
        console.log(
          `💰 [BALANCE_BATCH] ✅ PKP ${updatedPkps[idx].tokenId?.slice(
            -8
          )} balance updated: ${balance} ${symbol}`
        );
      } else {
        updatedPkps[idx].balance = "N/A";
        updatedPkps[idx].balanceSymbol = "tLit";
        console.log(
          `💰 [BALANCE_BATCH] ❌ PKP ${updatedPkps[idx].tokenId?.slice(
            -8
          )} balance failed, set to N/A`
        );
      }
      updatedPkps[idx].isLoadingBalance = false;
    });

    console.log(
      `💰 [BALANCE_BATCH] Updating PKP state with balance results...`
    );
    setExistingPkps([...updatedPkps]);
    console.log(`💰 [BALANCE_BATCH] ✅ Balance loading complete!`);
  };

  // Load existing PKPs
  const loadExistingPkps = async (page: number = 1) => {
    const offset = (page - 1) * DEFAULT_PAGE_SIZE;
    if (!authData) {
      setStatus("No authentication data available. Please authenticate first.");
      return;
    }

    try {
      setIsLoadingPkps(true);
      setStatus(`Loading PKPs (page ${page})...`);

      const { litClient } = assertDependenciesLoaded();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (litClient as any).viewPKPsByAuthData({
        authData: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          authMethodType: (authData as any).authMethodType,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          authMethodId: (authData as any).authMethodId,
        },
        pagination: {
          limit: pagination.limit,
          offset: offset,
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pkps = result.pkps.map((pkp: any) => ({
        tokenId: pkp.tokenId,
        publicKey: pkp.publicKey,
        ethAddress: pkp.ethAddress,
        pubkey: pkp.publicKey,
      }));

      setExistingPkps(pkps);
      setCurrentPage(page);

      setPagination({
        offset: offset,
        limit: pagination.limit,
        total: result.pagination.total,
        hasMore: result.pagination.hasMore,
      });

      if (result.pagination.total === 0) {
        setStatus("No existing PKPs found. You can mint a new one.");
      } else {
        setStatus(
          `Found ${result.pagination.total} PKP${
            result.pagination.total === 1 ? "" : "s"
          } associated with your account. Loading balances...`
        );

        // Load balances for all PKPs
        setTimeout(() => {
          loadBalancesForPkps(pkps).then(() => {
            setStatus(
              `Found ${result.pagination.total} PKP${
                result.pagination.total === 1 ? "" : "s"
              } associated with your account. (Page ${page} of ${Math.ceil(
                result.pagination.total / DEFAULT_PAGE_SIZE
              )})`
            );
          });
        }, 100); // Small delay to let UI update first
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error loading existing PKPs:", error);
      const errorMessage = formatErrorMessage(
        "Failed to load existing PKPs: ",
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsLoadingPkps(false);
    }
  };

  // Navigate to next page
  const goToNextPage = async () => {
    if (!pagination.hasMore || isLoadingPkps) return;
    const nextPage = currentPage + 1;
    await loadExistingPkps(nextPage);
  };

  // Navigate to previous page
  const goToPreviousPage = async () => {
    if (currentPage <= 1 || isLoadingPkps) return;
    const prevPage = currentPage - 1;
    await loadExistingPkps(prevPage);
  };

  // Select an existing PKP
  const selectExistingPkp = (index: number) => {
    const selectedPkp = existingPkps[index];
    setSelectedPkpIndex(index);
    onPkpSelected(selectedPkp);
    setStatus(`✅ Selected PKP: ${selectedPkp.ethAddress}`);
  };

  // Mint a new PKP
  const mintNewPkp = async () => {
    if (!authData) {
      setStatus("Missing authentication data. Please authenticate first.");
      return;
    }

    try {
      setIsMinting(true);
      setStatus(`Minting new PKP via ${authMethodName}...`);

      const { litClient } = assertDependenciesLoaded();

      // Check if this is custom auth (based on authMethodName or authMethodType)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const authDataObj = authData as any;
      const isCustomAuth =
        authMethodName === "Custom Auth" ||
        (authDataObj.authMethodType &&
          typeof authDataObj.authMethodType === "bigint");

      let mintResult;

      console.log("authMethodName", authMethodName);
      console.log("authDataObj", authDataObj);
      console.log("authData", authData);

      if (isCustomAuth) {
        // For custom auth, we need to use account-based minting with site owner account
        const siteOwnerAccount = privateKeyToAccount(
          SITE_OWNER_PRIVATE_KEY as `0x${string}`
        );

        // For custom auth, keep authMethodType as bigint (don't serialize to string)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mintResult = await (litClient as any).mintWithCustomAuth({
          account: siteOwnerAccount,
          authData: authDataObj, // Pass authData directly with bigint
          scope: "sign-anything",
          validationIpfsCid: "QmYLeVmwJPVs7Uebk85YdVPivMyrvoeKR6X37kyVRZUXW4", // Default validation CID
        });
      } else if (
        authMethodName === "eoa Auth" ||
        authDataObj.authMethodType === 1
      ) {
        // For EOA auth, we need to handle different account methods
        const account = authDataObj.account;
        const accountMethod = authDataObj.accountMethod || "privateKey"; // Default to privateKey for backward compatibility

        if (accountMethod === "privateKey" && account) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          mintResult = await (litClient as any).mintWithAuth({
            account: account,
            authData: authDataObj,
            scopes: ["sign-anything"],
          });
        } else if (accountMethod === "walletClient" && account) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          mintResult = await (litClient as any).mintWithAuth({
            account: account,
            authData: authDataObj,
            scopes: ["sign-anything"],
          });
        } else {
          throw new Error(
            "EOA authentication requires valid account information"
          );
        }
      } else {
        // Fallback for other auth methods (like Google)
        const serializedAuthData = {
          ...authDataObj,
          authMethodType:
            typeof authDataObj.authMethodType === "bigint"
              ? authDataObj.authMethodType.toString()
              : authDataObj.authMethodType,
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mintResult = await (litClient as any).authService.mintWithAuth({
          authData: serializedAuthData,
        });
      }

      // Handle different result structures for different auth types
      const pkpData = isCustomAuth ? mintResult.pkpData : mintResult;

      const mintedPkpInfo: PKPInfo = {
        tokenId: pkpData.data.tokenId,
        publicKey: pkpData.data.pubkey,
        ethAddress: pkpData.data.ethAddress,
        pubkey: pkpData.data.pubkey,
      };

      onPkpSelected(mintedPkpInfo);
      setStatus(`✅ PKP minted successfully via ${authMethodName}!`);

      if (selectionMode === "existing") {
        await loadExistingPkps(1);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error minting PKP:", error);
      const errorMessage = formatErrorMessage(
        `Failed to mint PKP with ${authMethodName}: `,
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsMinting(false);
    }
  };

  // Load existing PKPs when component mounts or auth data changes
  useEffect(() => {
    if (authData && selectionMode === "existing") {
      setCurrentPage(1);
      loadExistingPkps(1);
    }
  }, [authData, selectionMode]);

  // Reset selection when switching modes
  useEffect(() => {
    setSelectedPkpIndex(null);
    if (selectionMode === "existing") {
      setCurrentPage(1);
    }
  }, [selectionMode]);

  return (
    <div>
      {/* Mode Selection */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <button
            onClick={() => {
              setSelectionMode("existing");
              onSelectionModeChange?.();
            }}
            disabled={disabled}
            style={{
              padding: "8px 15px",
              backgroundColor:
                selectionMode === "existing" ? "#4285F4" : "#f0f0f0",
              color: selectionMode === "existing" ? "white" : "#333",
              border: "1px solid #ddd",
              borderRadius: "4px",
              cursor: disabled ? "not-allowed" : "pointer",
              fontSize: "14px",
            }}
          >
            Use Existing PKP
          </button>
          <button
            onClick={() => {
              setSelectionMode("mint");
              onSelectionModeChange?.();
            }}
            disabled={disabled}
            style={{
              padding: "8px 15px",
              backgroundColor: selectionMode === "mint" ? "#4285F4" : "#f0f0f0",
              color: selectionMode === "mint" ? "white" : "#333",
              border: "1px solid #ddd",
              borderRadius: "4px",
              cursor: disabled ? "not-allowed" : "pointer",
              fontSize: "14px",
            }}
          >
            Mint New PKP
          </button>
        </div>
      </div>

      {/* Existing PKPs Section */}
      {selectionMode === "existing" && (
        <div>
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "15px",
              alignItems: "center",
            }}
          >
            <button
              onClick={() => loadExistingPkps(1)}
              disabled={
                isLoadingPkps ||
                !authData ||
                disabled ||
                (pagination.total === 0 &&
                  existingPkps.length === 0 &&
                  !isLoadingPkps)
              }
              style={{
                padding: "8px 12px",
                backgroundColor:
                  isLoadingPkps ||
                  !authData ||
                  disabled ||
                  (pagination.total === 0 &&
                    existingPkps.length === 0 &&
                    !isLoadingPkps)
                    ? "#cccccc"
                    : "#ffffff",
                color: "#3b82f6",
                border: "2px solid #3b82f6",
                borderRadius: "4px",
                cursor:
                  isLoadingPkps ||
                  !authData ||
                  disabled ||
                  (pagination.total === 0 &&
                    existingPkps.length === 0 &&
                    !isLoadingPkps)
                    ? "not-allowed"
                    : "pointer",
                fontWeight: "500",
              }}
            >
              {isLoadingPkps ? "Loading..." : "Load My PKPs"}
              {!authData && " (Authenticate first)"}
            </button>
          </div>

          {pagination.total > 0 && (
            <div
              style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}
            >
              Showing {existingPkps.length} PKPs on page {currentPage} of{" "}
              {Math.ceil(pagination.total / DEFAULT_PAGE_SIZE)} (Total:{" "}
              {pagination.total} PKPs)
            </div>
          )}

          {/* PKP List */}
          {existingPkps.length > 0 && (
            <div style={{ marginBottom: "15px" }}>
              <h5
                style={{
                  margin: "0 0 10px 0",
                  fontSize: "14px",
                  color: "#374151",
                }}
              >
                Select an existing PKP:
              </h5>
              <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                {existingPkps.map((pkp, index) => (
                  <div
                    key={pkp.tokenId}
                    onClick={() => selectExistingPkp(index)}
                    style={{
                      padding: "12px",
                      border:
                        selectedPkpIndex === index
                          ? "2px solid #4285F4"
                          : "1px solid #ddd",
                      borderRadius: "6px",
                      marginBottom: "8px",
                      cursor: "pointer",
                      backgroundColor:
                        selectedPkpIndex === index ? "#f0f8ff" : "#ffffff",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#666",
                            marginBottom: "2px",
                          }}
                        >
                          Token ID: {pkp.tokenId.slice(0, 20)}...
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#666",
                            marginBottom: "4px",
                          }}
                        >
                          Public Key: {pkp.publicKey.slice(0, 30)}...
                        </div>
                        <div style={{ fontSize: "13px", fontWeight: "500" }}>
                          ETH Address: {pkp.ethAddress}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#059669",
                            fontWeight: "500",
                            marginTop: "4px",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          {pkp.isLoadingBalance ? (
                            <>
                              <div
                                style={{
                                  width: "12px",
                                  height: "12px",
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
                              Balance: {pkp.balance || "N/A"}{" "}
                              {pkp.balanceSymbol || "tLit"}
                            </>
                          )}
                        </div>
                      </div>
                      {selectedPkpIndex === index && (
                        <div
                          style={{
                            color: "#4285F4",
                            fontWeight: "bold",
                            fontSize: "14px",
                          }}
                        >
                          ✓ Selected
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Page Navigation */}
              {pagination.total > DEFAULT_PAGE_SIZE && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "15px",
                    padding: "10px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "6px",
                    border: "1px solid #e9ecef",
                  }}
                >
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage <= 1 || isLoadingPkps}
                    style={{
                      padding: "8px 15px",
                      backgroundColor:
                        currentPage <= 1 || isLoadingPkps
                          ? "#cccccc"
                          : "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor:
                        currentPage <= 1 || isLoadingPkps
                          ? "not-allowed"
                          : "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    ← Previous
                  </button>

                  <span
                    style={{
                      fontSize: "14px",
                      color: "#495057",
                      fontWeight: "500",
                    }}
                  >
                    Page {currentPage} of{" "}
                    {Math.ceil(pagination.total / DEFAULT_PAGE_SIZE)}
                  </span>

                  <button
                    onClick={goToNextPage}
                    disabled={!pagination.hasMore || isLoadingPkps}
                    style={{
                      padding: "8px 15px",
                      backgroundColor:
                        !pagination.hasMore || isLoadingPkps
                          ? "#cccccc"
                          : "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor:
                        !pagination.hasMore || isLoadingPkps
                          ? "not-allowed"
                          : "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* No PKPs Message */}
          {pagination.total === 0 &&
            existingPkps.length === 0 &&
            !isLoadingPkps &&
            authData && (
              <div
                style={{
                  padding: "20px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                  border: "1px solid #e9ecef",
                  marginBottom: "15px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "16px",
                    color: "#6c757d",
                    marginBottom: "8px",
                  }}
                >
                  No PKPs Found
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#495057",
                    marginBottom: "12px",
                  }}
                >
                  {`You don't have any PKPs associated with your ${authMethodName} account.`}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#6c757d",
                  }}
                >
                  Switch to "Mint New PKP" mode to create your first PKP wallet.
                </div>
              </div>
            )}
        </div>
      )}

      {/* Mint New PKP Section */}
      {selectionMode === "mint" && (
        <div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              onClick={mintNewPkp}
              disabled={isMinting || !authData || disabled}
              style={{
                padding: "8px 12px",
                backgroundColor:
                  isMinting || !authData || disabled ? "#cccccc" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor:
                  isMinting || !authData || disabled
                    ? "not-allowed"
                    : "pointer",
                fontWeight: "500",
              }}
            >
              {isMinting
                ? "Minting PKP..."
                : `Mint New PKP with ${authMethodName}`}
              {!authData && " (Authenticate first)"}
            </button>
          </div>
        </div>
      )}

      {/* CSS Animation for loading spinners */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
