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

interface PKPInfo {
  tokenId: string;
  publicKey: string;
  ethAddress: string;
  pubkey?: string; // Alternative naming
}

interface AuthData {
  authMethodType: number;
  authMethodId: string;
}

interface PkpsByAuthComponentProps {
  authData: AuthData | null;
  setStatus: (message: string) => void;
  assertDependenciesLoaded: () => { litClient: unknown; authManager: unknown };
  showError?: (errorMessage: string) => void;
  disabled?: boolean;
}

export default function PkpsByAuthComponent({
  authData,
  setStatus,
  assertDependenciesLoaded,
  showError,
  disabled = false,
}: PkpsByAuthComponentProps) {
  // PKPs state
  const [pkps, setPkps] = useState<PKPInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [limit, setLimit] = useState<string>("5");
  const [offset, setOffset] = useState<string>("0");
  const [pagination, setPagination] = useState({
    total: 0,
    hasMore: false,
  });
  const [success, setSuccess] = useState(false);

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
    if (error && typeof error === "object" && "message" in error) {
      errorMessage += (error as { message: string }).message;
    } else if (typeof error === "object") {
      errorMessage += JSON.stringify(error, null, 2);
    } else {
      errorMessage += String(error);
    }
    return errorMessage;
  };

  // Load PKPs by auth data
  const loadPkpsByAuth = async () => {
    if (!authData) {
      setStatus("No authentication data available. Please authenticate first.");
      return;
    }

    try {
      setIsLoading(true);
      setStatus("Loading PKPs by auth data...");
      setSuccess(false);
      setPkps([]);

      const { litClient } = assertDependenciesLoaded();

      const result = await (
        litClient as {
          viewPKPsByAuthData: (params: unknown) => Promise<unknown>;
        }
      ).viewPKPsByAuthData({
        authData: {
          authMethodType: authData.authMethodType,
          authMethodId: authData.authMethodId,
        },
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
        },
      });

      const resultData = result as {
        pkps: Array<{ tokenId: string; publicKey: string; ethAddress: string }>;
        pagination: { total: number; hasMore: boolean };
      };

      const pkpsList = resultData.pkps.map((pkp) => ({
        tokenId: pkp.tokenId,
        publicKey: pkp.publicKey,
        ethAddress: pkp.ethAddress,
        pubkey: pkp.publicKey, // Add alternative naming for compatibility
      }));

      setPkps(pkpsList);
      setPagination({
        total: resultData.pagination.total,
        hasMore: resultData.pagination.hasMore,
      });

      if (resultData.pagination.total === 0) {
        setStatus("No PKPs found for this auth data.");
      } else {
        setStatus(
          `Found ${resultData.pagination.total} PKP${
            resultData.pagination.total === 1 ? "" : "s"
          } associated with your auth data.`
        );
        setSuccess(true);
        showSuccess("load-pkps");
      }
    } catch (error: unknown) {
      console.error("Error loading PKPs by auth data:", error);
      const errorMessage = formatErrorMessage(
        "Failed to load PKPs by auth data: ",
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset state when auth data changes
  useEffect(() => {
    setPkps([]);
    setPagination({ total: 0, hasMore: false });
    setSuccess(false);
  }, [authData]);

  // Dynamically generate the code example based on current input
  const codeExample = `import { storagePlugins } from '@lit-protocol/auth';

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
    limit: ${limit},
    offset: ${offset},
  },
  storageProvider, // Optional: enables caching
});

console.log(result);`;

  return (
    <div>
      <h3 style={{ marginTop: "20px" }}>Get PKPs By Auth Data</h3>
      <p>
        Use the <code>viewPKPsByAuthData</code> method to fetch PKPs associated
        with your authentication data. You can control pagination with the limit
        and offset parameters.
      </p>

      {/* Info Box */}
      <div
        style={{
          marginTop: "15px",
          marginBottom: "15px",
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

      <DisplayCode
        code={codeExample}
        language="typescript"
        renderComponent={
          <div>
            <div style={{ marginBottom: "15px" }}>
              <div
                style={{ display: "flex", gap: "12px", marginBottom: "12px" }}
              >
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontWeight: 500,
                      marginBottom: 4,
                      display: "block",
                    }}
                    htmlFor="limit"
                  >
                    Limit
                  </label>
                  <input
                    id="limit"
                    type="number"
                    min={1}
                    max={100}
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "1rem",
                      width: "100%",
                      boxSizing: "border-box" as const,
                    }}
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontWeight: 500,
                      marginBottom: 4,
                      display: "block",
                    }}
                    htmlFor="offset"
                  >
                    Offset
                  </label>
                  <input
                    id="offset"
                    type="number"
                    min={0}
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "1rem",
                      width: "100%",
                      boxSizing: "border-box" as const,
                    }}
                    value={offset}
                    onChange={(e) => setOffset(e.target.value)}
                  />
                </div>
              </div>

              <button
                onClick={loadPkpsByAuth}
                disabled={isLoading || !authData || disabled}
                style={{
                  padding: "10px 15px",
                  backgroundColor:
                    isLoading || !authData || disabled ? "#cccccc" : "#4285F4",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor:
                    isLoading || !authData || disabled
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: "500",
                  marginRight: "10px",
                  width: "100%",
                }}
              >
                {isLoading ? "Loading..." : "Get PKPs By Auth Data"}
                {!authData && " (Authenticate first)"}
              </button>
            </div>
          </div>
        }
        resultData={pkps.length > 0 ? { pkps, pagination } : null}
        resultLabel="PKPs by Auth Data Result"
        useSideBySide={true}
        theme="dracula"
        isSuccess={success}
      />
    </div>
  );
}
