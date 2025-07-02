/**
 * SimplePkpSelection.tsx
 *
 * A simplified PKP selection component for the CreatingAuthContext page.
 * Allows users to either select existing PKPs or mint new ones, with
 * code examples shown in modals instead of embedded.
 */

import { useState, useEffect } from "react";

// Configuration constants
const DEFAULT_PAGE_SIZE = 5;

// Code snippets for modals
const VIEW_PKPS_CODE = `import { storagePlugins } from '@lit-protocol/auth';

// Get PKPs with pagination and caching
const result = await litClient.viewPKPsByAuthData({
  authData: {
    authMethodType: authData.authMethodType,
    authMethodId: authData.authMethodId,
  },
  pagination: {
    limit: 5,
    offset: 0,
  },
});`;

const MINT_PKP_CODE = `// Mint new PKP with Google authentication data
const mintResult = await litClient.authService.mintWithAuth({
  authData: authData,
});

console.log('PKP Info:', mintResult.pkpInfo);`;

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

  // Modal state
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [modalCode, setModalCode] = useState("");
  const [modalTitle, setModalTitle] = useState("");

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mintResult = await (litClient as any).authService.mintWithAuth({
        authData: authData,
      });

      const mintedPkpInfo: PKPInfo = {
        tokenId: mintResult.data.tokenId,
        publicKey: mintResult.data.pubkey,
        ethAddress: mintResult.data.ethAddress,
        pubkey: mintResult.data.pubkey,
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

  // Show code modal
  const showCodeExample = (code: string, title: string) => {
    setModalCode(code);
    setModalTitle(title);
    setShowCodeModal(true);
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

            <button
              onClick={() =>
                showCodeExample(VIEW_PKPS_CODE, "View PKPs by Auth Data")
              }
              style={{
                padding: "8px 12px",
                backgroundColor: "#ffffff",
                color: "#3b82f6",
                border: "2px solid #3b82f6",
                borderRadius: "4px",
                fontSize: "0.85rem",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              📋 View Code
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

            <button
              onClick={() =>
                showCodeExample(MINT_PKP_CODE, "Mint PKP with Google Auth")
              }
              style={{
                padding: "8px 12px",
                backgroundColor: "#ffffff",
                color: "#3b82f6",
                border: "2px solid #3b82f6",
                borderRadius: "4px",
                fontSize: "0.85rem",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              📋 View Code
            </button>
          </div>
        </div>
      )}

      {/* Code Modal */}
      {showCodeModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setShowCodeModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              maxWidth: "800px",
              maxHeight: "80vh",
              width: "100%",
              overflow: "auto",
              padding: "24px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: "#1f2937",
                  fontSize: "1.2rem",
                }}
              >
                {modalTitle}
              </h3>
              <button
                onClick={() => setShowCodeModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "#6b7280",
                }}
              >
                ✕
              </button>
            </div>
            <pre
              style={{
                backgroundColor: "#f8fafc",
                padding: "16px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontSize: "14px",
                lineHeight: "1.5",
                overflow: "auto",
                color: "#374151",
              }}
            >
              <code>{modalCode}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
