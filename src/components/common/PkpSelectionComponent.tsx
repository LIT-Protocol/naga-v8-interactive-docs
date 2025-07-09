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
 * - Optional code display for documentation purposes
 */

import { useState, useEffect } from "react";
import { DisplayCode } from "../DisplayCode";
import { privateKeyToAccount } from "viem/accounts";

// Configuration constants
const DEFAULT_PAGE_SIZE = 5;
// Configuration constants
const FAUCET_URL = "https://chronicle-yellowstone-faucet.getlit.dev/";

// Code snippets for documentation
const VIEW_PKPS_CODE = `
import { storagePlugins } from '@lit-protocol/auth';

// Create storage provider for caching
const storageProvider = storagePlugins.localStorage({
  appName: 'my-app',
  networkName: import.meta.env.VITE_LIT_NETWORK || 'naga-dev',
});

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
  storageProvider, // Optional: enables caching
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
  authData: unknown;
  account?: unknown;
  walletClient?: unknown;
  accountMethod?: "privateKey" | "walletClient";
  onPkpSelected: (pkpInfo: PKPInfo) => void;
  setStatus: (message: string) => void;
  assertDependenciesLoaded: () => { litClient: unknown; authManager: unknown };
  showError?: (errorMessage: string) => void;
  authMethodName: string; // e.g., "EOA Auth", "Google Auth"
  mintCodeSnippet?: string; // Custom mint code snippet
  disabled?: boolean;
  showDisplayCode?: boolean; // Flag to show/hide DisplayCode components
}

export default function PkpSelectionComponent({
  authData,
  account,
  walletClient,
  accountMethod,
  onPkpSelected,
  setStatus,
  assertDependenciesLoaded,
  showError,
  authMethodName,
  mintCodeSnippet = MINT_PKP_CODE,
  disabled = false,
  showDisplayCode = true,
}: PkpSelectionComponentProps) {
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
        pubkey: pkp.publicKey, // Add alternative naming for compatibility
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
        showSuccess("load-pkps");
      }
    } catch (error: unknown) {
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
    setStatus(`Selected PKP: ${selectedPkp.ethAddress}`);
    showSuccess("select-pkp");
  };

  // Mint a new PKP
  const mintNewPkp = async () => {
    if (!authData) {
      setStatus("Missing authentication data. Please authenticate first.");
      return;
    }

    // For EOA methods, we need account or walletClient
    if (accountMethod === "privateKey" && !account) {
      setStatus(
        "Missing account for privateKey method. Please authenticate first."
      );
      return;
    }

    if (accountMethod === "walletClient" && !walletClient) {
      setStatus(
        "Missing walletClient for walletClient method. Please authenticate first."
      );
      return;
    }

    try {
      setIsMinting(true);
      setStatus(`Minting new PKP via ${authMethodName}...`);

      const { litClient } = assertDependenciesLoaded();

      let mintResult;
      if (accountMethod === "privateKey" && account) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mintResult = await (litClient as any).mintWithAuth({
          account: account,
          authData: authData,
          scopes: ["sign-anything"],
        });
      } else if (accountMethod === "walletClient" && walletClient) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mintResult = await (litClient as any).mintWithAuth({
          account: walletClient,
          authData: authData,
          scopes: ["sign-anything"],
        });
      } else {
        // For WebAuthn and other OAuth methods, use authService.mintWithAuth
        const authDataObj = authData as any; // eslint-disable-line @typescript-eslint/no-explicit-any

        if (
          authDataObj &&
          (authDataObj.authMethodType === 8 ||
            authDataObj.authMethodType === 6 || // Stytch Email OTP
            authDataObj.authMethodType === 7 || // Stytch SMS OTP
            authDataObj.authMethodType === 9 || // Stytch WhatsApp OTP
            authDataObj.authMethodType === 10 || // Stytch TOTP 2FA
            (authMethodName &&
              (authMethodName.toLowerCase().includes("webauthn") ||
                authMethodName.toLowerCase().includes("stytch"))))
        ) {
          // WebAuthn and Stytch specific minting
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          mintResult = await (litClient as any).authService.mintWithAuth({
            authData: authData,
          });
        } else {
          // Fallback for other auth methods (like Google, Discord)
          // Site owner private key for minting PKPs (provided for demo)
          const SITE_OWNER_PRIVATE_KEY =
            "0x65b80901b185bd7bd9c07178c8e3b2bfae62472feeeb86d3dd834e5b14c2d5f8";

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          mintResult = await (litClient as any).mintWithAuth({
            account: privateKeyToAccount(SITE_OWNER_PRIVATE_KEY),
            authData: authData,
            scopes: ["sign-anything"],
          });
        }
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
    } catch (error: unknown) {
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

  // Render the PKP list component
  const renderPkpList = () => (
    <div>
      <div style={{ marginBottom: "15px" }}>
        <button
          onClick={() => loadExistingPkps(0, false)}
          disabled={isLoadingPkps || !authData || disabled}
          style={{
            padding: "10px 15px",
            backgroundColor:
              isLoadingPkps || !authData || disabled ? "#cccccc" : "#6f42c1",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor:
              isLoadingPkps || !authData || disabled
                ? "not-allowed"
                : "pointer",
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
            Select an existing PKP:
          </h4>
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
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
                    selectedPkpIndex === index ? "#f0f8ff" : "#f9f9f9",
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
                        fontSize: "12px",
                        color: "#666",
                        marginBottom: "4px",
                      }}
                    >
                      Token ID: {pkp.tokenId.slice(0, 20)}...
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#666",
                        marginBottom: "4px",
                      }}
                    >
                      Public Key: {pkp.publicKey.slice(0, 30)}...
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: "500" }}>
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
  );

  // Render the mint button component
  const renderMintButton = () => (
    <button
      onClick={mintNewPkp}
      disabled={isMinting || !authData || disabled}
      style={{
        padding: "10px 15px",
        backgroundColor:
          isMinting || !authData || disabled ? "#cccccc" : "#28a745",
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
  );

  return (
    <div>
      <h3 style={{ marginTop: "20px" }}>Step 3: Get or Mint PKP</h3>
      <p>
        You can either select an existing PKP associated with your account or
        mint a new one. Existing PKPs are loaded with caching for better
        performance.
      </p>

      {/* Mode Selection */}
      <div style={{ marginBottom: "20px" }}>
        <label
          style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}
        >
          Choose PKP Option:
        </label>
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <button
            onClick={() => setSelectionMode("existing")}
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
        </div>
      </div>

      {/* Existing PKPs Section */}
      {selectionMode === "existing" && (
        <>
          {showDisplayCode ? (
            <DisplayCode
              code={VIEW_PKPS_CODE}
              language="typescript"
              renderComponent={renderPkpList()}
              resultData={
                selectedPkpIndex !== null
                  ? existingPkps[selectedPkpIndex]
                  : null
              }
              resultLabel="Selected PKP Information"
              useSideBySide={true}
              theme="dracula"
              isSuccess={
                successActions.has("load-pkps") ||
                successActions.has("select-pkp")
              }
            />
          ) : (
            renderPkpList()
          )}
        </>
      )}

      {/* Mint New PKP Section */}
      {selectionMode === "mint" && (
        <>
          {/* Faucet Information */}
          <div
            style={{
              marginTop: "15px",
              marginBottom: "15px",
              padding: "10px",
              backgroundColor: "#e8f4fd",
              borderRadius: "4px",
              border: "1px solid #b3d9ff",
            }}
          >
            <strong>💰 Need Test Tokens?</strong> Minting a new PKP requires
            test tokens. Visit the{" "}
            <a
              href={FAUCET_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#0066cc", textDecoration: "underline" }}
            >
              Chronicle Yellowstone Faucet
            </a>{" "}
            to get test tokens for your EOA account.
          </div>
          {showDisplayCode ? (
            <DisplayCode
              code={mintCodeSnippet}
              language="typescript"
              renderComponent={renderMintButton()}
              resultData={null} // Will be handled by parent component
              resultLabel="Minted PKP Information"
              useSideBySide={true}
              theme="dracula"
              isSuccess={successActions.has("mint-pkp")}
            />
          ) : (
            renderMintButton()
          )}
        </>
      )}

      {/* Info Box */}
      <div
        style={{
          marginTop: "15px",
          padding: "12px",
          backgroundColor: "#e8f4fd",
          borderRadius: "4px",
          border: "1px solid #b3d9ff",
          fontSize: "14px",
        }}
      >
        <strong>💡 Performance Note:</strong> When using a{" "}
        <code>storageProvider</code>, loading PKPs uses caching to improve
        performance. The first load may take longer, but subsequent loads will
        be much faster. PKP data is cached locally and respects pagination for
        efficient memory usage.
      </div>
    </div>
  );
}
