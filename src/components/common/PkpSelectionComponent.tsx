/**
 * PkpSelectionComponent.tsx
 * 
 * A reusable component that allows users to either:
 * 1. Mint a new PKP using their authentication data
 * 2. Select from existing PKPs they already have (using viewPKPsByAuthData API)
 * 
 * Features:
 * - Pagination support for large PKP collections
 * - Caching with storage providers for performance
 * - Loading states and error handling
 * - Responsive UI with clear selection indicators
 */

import { useState, useEffect } from "react";
import { DisplayCode } from "../DisplayCode";
// import { storagePlugins } from "@lit-protocol/auth";
import { APP_INFO } from "../../_config";
import { createLitClient } from "@lit-protocol/lit-client";

// Configuration constants
const DEFAULT_PAGE_SIZE = 5;
// const CACHE_STORAGE_PATH = "./lit-pkp-cache";

// Code snippets for documentation
const VIEW_PKPS_CODE = `
const result = await litClient.viewPKPsByAuthData({
  authData: {
    authMethodType: authData.authMethodType,
    authMethodId: authData.authMethodId,
  },
  pagination: {
    limit: 5,
    offset: 0,
  }
});`;

const MINT_PKP_CODE = `
// Mint new PKP with authentication data
const mintResult = await litClient.mintWithAuth({
  account: account, // or walletClient
  authData: authData,
  scopes: ['sign-anything'],
});`;

interface PKPInfo {
  tokenId: string;
  publicKey: string;
  ethAddress: string;
  pubkey?: string; // Alternative naming
}

interface PkpSelectionComponentProps {
  stepNumber: number;
  authData: any;
  account?: any;
  walletClient?: any;
  accountMethod?: "privateKey" | "walletClient";
  onPkpSelected: (pkpInfo: PKPInfo) => void;
  setStatus: (message: string) => void;
  assertDependenciesLoaded: () => { litClient: Awaited<ReturnType<typeof createLitClient>>; authManager: any };
  showError?: (errorMessage: string) => void;
  authMethodName: string; // e.g., "EOA Auth", "Google Auth"
  mintCodeSnippet?: string; // Custom mint code snippet
  disabled?: boolean;
  allowMint?: boolean; // Whether minting a new PKP is allowed in this context
}

export default function PkpSelectionComponent({
  stepNumber,
  authData,
  account,
  walletClient,
  accountMethod = "privateKey",
  onPkpSelected,
  setStatus,
  assertDependenciesLoaded,
  showError,
  authMethodName,
  mintCodeSnippet = MINT_PKP_CODE,
  disabled = false,
  allowMint = true,
}: PkpSelectionComponentProps) {
  // Selection mode state
  const [selectionMode, setSelectionMode] = useState<"mint" | "existing">("existing");

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

  // Success feedback state
  const [successActions, setSuccessActions] = useState<Set<string>>(new Set());

  // Function to show success feedback
  const showSuccess = (actionId: string) => {
    setSuccessActions((prev) => new Set([...prev, actionId]));
    setTimeout(() => {
      setSuccessActions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(actionId);
        return newSet;
      });
    }, 3000);
  };

  // Utility function to format error messages
  const formatErrorMessage = (prefix: string, error: any): string => {
    let errorMessage = prefix;
    if (error?.message) {
      errorMessage += error.message;
    } else if (typeof error === "object") {
      errorMessage += JSON.stringify(error, null, 2);
    } else {
      errorMessage += String(error);
    }
    return errorMessage;
  };

  // Load existing PKPs
  const loadExistingPkps = async (offset: number = 0, append: boolean = false) => {
    if (!authData) {
      setStatus("No authentication data available. Please authenticate first.");
      return;
    }

    try {
      setIsLoadingPkps(true);
      setStatus("Loading your existing PKPs...");

      const { litClient } = assertDependenciesLoaded();

      const result = await litClient.viewPKPsByAuthData({
        authData: {
          authMethodType: authData.authMethodType,
          authMethodId: authData.authMethodId,
        },
        pagination: {
          limit: pagination.limit,
          offset: offset,
        }
      });

      console.log("result:", result);

      const pkps = result.pkps.map((pkp: { tokenId: string; publicKey: string; ethAddress: string; pubkey: string }) => ({
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
        setStatus(`Found ${result.pagination.total} PKP${result.pagination.total === 1 ? '' : 's'} associated with your account.`);
        showSuccess("load-pkps");
      }
    } catch (error: any) {
      console.error("Error loading existing PKPs:", error);
      const errorMessage = formatErrorMessage("Failed to load existing PKPs: ", error);
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
    setStatus(`Selected PKP: ${selectedPkp.ethAddress}`);
    showSuccess("select-pkp");
  };

  // Mint a new PKP
  const mintNewPkp = async () => {

    if (!authData && (!account && !walletClient)) {
      const _msg = "Missing authentication data or account. Please authenticate first."
      setStatus(_msg);
      showError?.(_msg);
      return;
    }

    try {
      setIsMinting(true);
      setStatus(`Minting new PKP via ${authMethodName}...`);

      const { litClient } = assertDependenciesLoaded();

      let mintResult;
      if (accountMethod === "privateKey" && account) {
        console.log("1. Using private key")
        mintResult = await litClient.mintWithAuth({
          account: account,
          authData: authData,
          scopes: ["sign-anything"],
        });
      } else if (accountMethod === "walletClient" && walletClient) {
        console.log("2. Using wallet client")
        mintResult = await litClient.mintWithAuth({
          account: walletClient,
          authData: authData,
          scopes: ["sign-anything"],
        });
      } else {
        console.log("3. Using auth service");
        console.log("authData:", authData);
        // Fallback for other auth methods (like Google)
        mintResult = await litClient.authService.mintWithAuth({
          authData: authData,
          authServiceBaseUrl: APP_INFO.litAuthServer,
          scopes: ["sign-anything"]
        });
      }

      const mintedPkpInfo: PKPInfo = {
        tokenId: mintResult.data.tokenId,
        publicKey: mintResult.data.pubkey,
        ethAddress: mintResult.data.ethAddress,
        pubkey: mintResult.data.pubkey,
      };

      onPkpSelected(mintedPkpInfo);
      setStatus(`PKP minted successfully via ${authMethodName}!`);
      showSuccess("mint-pkp");

      // Refresh the existing PKPs list to include the new one
      if (selectionMode === "existing") {
        await loadExistingPkps(0, false);
      }
    } catch (error: any) {
      console.error("Error minting PKP:", error);
      const errorMessage = formatErrorMessage(`Failed to mint PKP with ${authMethodName}: `, error);
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

  // Enforce existing-only mode when minting is not allowed
  useEffect(() => {
    if (!allowMint && selectionMode === "mint") {
      setSelectionMode("existing");
    }
  }, [allowMint, selectionMode]);

  return (
    <div>
      <h3 style={{ marginTop: "20px" }}>
        Step {stepNumber || 3}: Get or Mint PKP
      </h3>
      <p>
        You can select an existing PKP associated with your account{allowMint ? " or mint a new one" : ""}.
        Existing PKPs are loaded with caching for better performance.
      </p>

      {/* Mode Selection */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
          Choose PKP Option:
        </label>
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <button
            onClick={() => setSelectionMode("existing")}
            disabled={disabled}
            style={{
              padding: "8px 15px",
              backgroundColor: selectionMode === "existing" ? "#4285F4" : "#f0f0f0",
              color: selectionMode === "existing" ? "white" : "#333",
              border: "1px solid #ddd",
              borderRadius: "4px",
              cursor: disabled ? "not-allowed" : "pointer",
              fontSize: "14px",
            }}
          >
            Use Existing PKP
          </button>
          {allowMint && (
            <button
              onClick={() => setSelectionMode("mint")}
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
          )}
        </div>
      </div>

      {/* Existing PKPs Section */}
      {selectionMode === "existing" && (
        <DisplayCode
          code={VIEW_PKPS_CODE}
          language="typescript"
          renderComponent={
            <div>
              <div style={{ marginBottom: "15px" }}>
                <button
                  onClick={() => loadExistingPkps(0, false)}
                  disabled={isLoadingPkps || !authData || disabled}
                  style={{
                    padding: "10px 15px",
                    backgroundColor: isLoadingPkps || !authData || disabled ? "#cccccc" : "#6f42c1",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: isLoadingPkps || !authData || disabled ? "not-allowed" : "pointer",
                    fontWeight: "500",
                    marginRight: "10px",
                  }}
                >
                  {isLoadingPkps ? "Loading..." : "Load My PKPs"}
                  {!authData && " (Authenticate first)"}
                </button>

                {pagination.total > 0 && (
                  <span style={{ fontSize: "14px", color: "#666" }}>
                    Showing {existingPkps.length} of {pagination.total} PKPs
                  </span>
                )}
              </div>

              {/* PKP List */}
              {existingPkps.length > 0 && (
                <div style={{ marginBottom: "15px" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
                    Your PKPs:
                  </h4>
                  <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                    {existingPkps.map((pkp, index) => (
                      <div
                        key={pkp.tokenId}
                        onClick={() => selectExistingPkp(index)}
                        style={{
                          padding: "12px",
                          border: selectedPkpIndex === index ? "2px solid #4285F4" : "1px solid #ddd",
                          borderRadius: "6px",
                          marginBottom: "8px",
                          cursor: "pointer",
                          backgroundColor: selectedPkpIndex === index ? "#f0f8ff" : "#f9f9f9",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
                              Token ID: {pkp.tokenId.slice(0, 20)}...
                            </div>
                            <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
                              Public Key: {pkp.publicKey.slice(0, 30)}...
                            </div>
                            <div style={{ fontSize: "14px", fontWeight: "500" }}>
                              ETH Address: {pkp.ethAddress}
                            </div>
                          </div>
                          {selectedPkpIndex === index && (
                            <div style={{ color: "#4285F4", fontWeight: "bold", fontSize: "14px" }}>
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
                      {isLoadingPkps ? "Loading..." : `Load More (${pagination.total - existingPkps.length} remaining)`}
                    </button>
                  )}
                </div>
              )}
            </div>
          }
          resultData={selectedPkpIndex !== null ? existingPkps[selectedPkpIndex] : null}
          resultLabel="Selected PKP Information"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("load-pkps") || successActions.has("select-pkp")}
        />
      )}

      {/* Mint New PKP Section */}
      {allowMint && selectionMode === "mint" && (
        <DisplayCode
          code={mintCodeSnippet}
          language="typescript"
          renderComponent={
            <button
              onClick={mintNewPkp}
              disabled={isMinting || !authData || disabled}
              style={{
                padding: "10px 15px",
                backgroundColor: isMinting || !authData || disabled ? "#cccccc" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isMinting || !authData || disabled ? "not-allowed" : "pointer",
                fontWeight: "500",
              }}
            >
              {isMinting ? "Minting PKP..." : `Mint New PKP with ${authMethodName}`}
              {!authData && " (Authenticate first)"}
            </button>
          }
          resultData={null} // Will be handled by parent component
          resultLabel="Minted PKP Information"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("mint-pkp")}
        />
      )}

      {/* Info Box */}
      {/* <div
        style={{
          marginTop: "15px",
          padding: "12px",
          backgroundColor: "#e8f4fd",
          borderRadius: "4px",
          border: "1px solid #b3d9ff",
          fontSize: "14px",
        }}
      >
        <strong>💡 Performance Note:</strong> Loading existing PKPs uses caching to improve performance.
        The first load may take longer, but subsequent loads will be much faster.
        PKP data is cached locally and respects pagination for efficient memory usage.
      </div> */}
    </div>
  );
} 