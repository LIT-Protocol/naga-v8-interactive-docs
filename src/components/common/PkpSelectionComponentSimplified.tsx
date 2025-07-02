import { useState, useEffect } from "react";
import { privateKeyToAccount } from "viem/accounts";

// Configuration constants
const DEFAULT_PAGE_SIZE = 5;

// Site owner private key for minting PKPs (provided for demo)
const SITE_OWNER_PRIVATE_KEY =
  "0x65b80901b185bd7bd9c07178c8e3b2bfae62472feeeb86d3dd834e5b14c2d5f8";

interface PKPInfo {
  tokenId: string;
  publicKey: string;
  ethAddress: string;
  pubkey?: string;
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

  // Load existing PKPs
  const loadExistingPkps = async (
    offset: number = 0,
    append: boolean = false
  ) => {
    if (!authData) {
      setStatus("No authentication data available. Please authenticate first.");
      return;
    }

    try {
      setIsLoadingPkps(true);
      setStatus("Loading your existing PKPs...");

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

      if (append) {
        setExistingPkps((prev) => [...prev, ...pkps]);
      } else {
        setExistingPkps(pkps);
      }

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
          } associated with your account.`
        );
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

  // Load more PKPs (pagination)
  const loadMorePkps = async () => {
    if (!pagination.hasMore || isLoadingPkps) return;
    await loadExistingPkps(pagination.offset + pagination.limit, true);
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
      } else {
        // For other auth methods (like Google), use the standard approach
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
        await loadExistingPkps(0, false);
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
      loadExistingPkps();
    }
  }, [authData, selectionMode]);

  // Reset selection when switching modes
  useEffect(() => {
    setSelectedPkpIndex(null);
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
              onClick={() => loadExistingPkps(0, false)}
              disabled={isLoadingPkps || !authData || disabled}
              style={{
                padding: "8px 12px",
                backgroundColor:
                  isLoadingPkps || !authData || disabled
                    ? "#cccccc"
                    : "#ffffff",
                color: "#3b82f6",
                border: "2px solid #3b82f6",
                borderRadius: "4px",
                cursor:
                  isLoadingPkps || !authData || disabled
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
              Showing {existingPkps.length} of {pagination.total} PKPs
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

              {/* Load More Button */}
              {pagination.hasMore && (
                <button
                  onClick={loadMorePkps}
                  disabled={isLoadingPkps}
                  style={{
                    padding: "8px 15px",
                    backgroundColor: isLoadingPkps ? "#cccccc" : "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: isLoadingPkps ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    marginTop: "10px",
                  }}
                >
                  {isLoadingPkps
                    ? "Loading..."
                    : `Load More (${
                        pagination.total - existingPkps.length
                      } remaining)`}
                </button>
              )}
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
    </div>
  );
}
