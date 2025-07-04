import React, { useState, useCallback } from "react";
import { chronicleTestnet } from "../../main";
import { useAppContext } from "../../router";
import { DEFAULT_NETWORK_NAME } from "../../pages";
import { DisplayCode } from "../../components/DisplayCode";

interface SearchProps {
  user?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface SearchResult {
  type: "address" | "publicKey" | "ipfsId" | "pkpTokenId" | "unknown";
  query: string;
  data: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  error?: string;
}

const Search: React.FC<SearchProps> = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [currentView, setCurrentView] = useState<"search" | "results">(
    "search"
  );

  // Pagination state for PKPs
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [pkpPagination, setPkpPagination] = useState({
    offset: 0,
    limit: 5,
    total: 0,
    hasMore: false,
  });

  // State for showing detailed permissions
  const [showDetailedPermissions, setShowDetailedPermissions] = useState(false);

  const { assertDependenciesLoaded } = useAppContext();

  // Auto-detect search type based on input format
  const detectSearchType = (
    query: string
  ): "address" | "publicKey" | "ipfsId" | "pkpTokenId" | "unknown" => {
    const trimmedQuery = query.trim();

    if (/^\d+$/.test(trimmedQuery) && trimmedQuery.length > 50) {
      return "pkpTokenId";
    }

    // Ethereum address (0x + 40 hex chars)
    if (/^0x[a-fA-F0-9]{40}$/.test(trimmedQuery)) {
      return "address";
    }

    // Public key (0x + 128 hex chars or 66 hex chars or 130 hex chars)
    if (
      /^0x[a-fA-F0-9]{128}$/.test(trimmedQuery) ||
      /^0x[a-fA-F0-9]{66}$/.test(trimmedQuery) ||
      /^0x[a-fA-F0-9]{130}$/.test(trimmedQuery)
    ) {
      return "publicKey";
    }

    // IPFS hash (starts with Qm or other IPFS prefixes)
    if (
      /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{58}|z[1-9A-HJ-NP-Za-km-z]{58})$/.test(
        trimmedQuery
      )
    ) {
      return "ipfsId";
    }

    // Return unknown if no pattern matches
    return "unknown";
  };

  // Search for address - get balance and owned PKPs
  const searchAddress = useCallback(
    async (
      address: string,
      resetPagination: boolean = true,
      customOffset?: number
    ) => {
      try {
        const { litClient } = assertDependenciesLoaded();

        const { createPublicClient, http } = await import("viem");

        const client = createPublicClient({
          chain: chronicleTestnet,
          transport: http(chronicleTestnet.rpcUrls.default.http[0]),
        });

        // Get balance
        const balance = await client.getBalance({
          address: address as `0x${string}`,
        });

        let ownedPkps: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
        let pagination = {
          offset: 0,
          limit: 5,
          total: 0,
          hasMore: false,
        };

        try {
          const offsetToUse = resetPagination
            ? 0
            : customOffset ?? pkpPagination.offset;
          const response = await litClient.viewPKPsByAddress({
            ownerAddress: address,
            pagination: {
              limit: pkpPagination.limit,
              offset: offsetToUse,
            },
          });
          console.log(
            "pkps response for address",
            address,
            "offset:",
            offsetToUse,
            response
          );
          ownedPkps = response?.pkps || [];
          pagination = response?.pagination || pagination;
        } catch (error) {
          console.warn("Could not fetch owned PKPs:", error);
          ownedPkps = [];
        }

        // Update pagination state
        if (resetPagination) {
          setPkpPagination(pagination);
        }

        return {
          address,
          balance: (Number(balance) / 1e18).toFixed(6),
          balanceSymbol: chronicleTestnet.nativeCurrency.symbol,
          ownedPkps,
          pagination,
          chainId: chronicleTestnet.id,
        };
      } catch (error) {
        console.error("Failed to search address:", error);
        throw new Error(
          `Failed to search address: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    },
    [
      assertDependenciesLoaded,
      pkpPagination.limit,
      pkpPagination.offset,
      setPkpPagination,
    ]
  );

  // Navigate to next page of PKPs
  const nextPage = useCallback(async () => {
    if (
      !searchResult ||
      searchResult.type !== "address" ||
      !pkpPagination.hasMore ||
      isLoadingPage
    ) {
      return;
    }

    setIsLoadingPage(true);
    try {
      const nextOffset = pkpPagination.offset + pkpPagination.limit;

      const nextResults = await searchAddress(
        searchResult.query,
        false,
        nextOffset
      );

      // Replace current PKPs with new page
      setSearchResult((prev) => {
        if (!prev || prev.type !== "address") return prev;

        return {
          ...prev,
          data: {
            ...prev.data,
            ownedPkps: nextResults.ownedPkps,
            pagination: nextResults.pagination,
          },
        };
      });

      // Update pagination state with response
      setPkpPagination(nextResults.pagination);
    } catch (error) {
      console.error("Failed to load next page:", error);
    } finally {
      setIsLoadingPage(false);
    }
  }, [
    searchResult,
    pkpPagination.hasMore,
    pkpPagination.offset,
    pkpPagination.limit,
    isLoadingPage,
    searchAddress,
  ]);

  // Navigate to previous page of PKPs
  const prevPage = useCallback(async () => {
    if (
      !searchResult ||
      searchResult.type !== "address" ||
      pkpPagination.offset === 0 ||
      isLoadingPage
    ) {
      return;
    }

    setIsLoadingPage(true);
    try {
      const prevOffset = Math.max(
        0,
        pkpPagination.offset - pkpPagination.limit
      );

      const prevResults = await searchAddress(
        searchResult.query,
        false,
        prevOffset
      );

      // Replace current PKPs with previous page
      setSearchResult((prev) => {
        if (!prev || prev.type !== "address") return prev;

        return {
          ...prev,
          data: {
            ...prev.data,
            ownedPkps: prevResults.ownedPkps,
            pagination: prevResults.pagination,
          },
        };
      });

      // Update pagination state with response
      setPkpPagination(prevResults.pagination);
    } catch (error) {
      console.error("Failed to load previous page:", error);
    } finally {
      setIsLoadingPage(false);
    }
  }, [
    searchResult,
    pkpPagination.offset,
    pkpPagination.limit,
    isLoadingPage,
    searchAddress,
  ]);

  // Search for public key - get PKP permissions by public key
  const searchPublicKey = useCallback(
    async (publicKey: string) => {
      try {
        const { litClient } = assertDependenciesLoaded();

        // Try to get PKP permissions directly by public key
        let pkpPermissions = null;
        let pkpInfo = null;
        let ethAddress = null;

        try {
          // First try to get PKP permissions using the public key directly
          const permissions = await litClient.viewPKPPermissions({
            pubkey: publicKey,
          });
          pkpPermissions = permissions;

          console.log("PKP permissions for public key:", permissions);

          // Note: We can't easily get the ETH address from just a public key
          // without additional crypto utilities, so we'll leave it as null
          ethAddress = null;

          // Create PKP info based on the public key
          pkpInfo = {
            publicKey,
            pubkey: publicKey,
            // Token ID is not available from viewPKPPermissions response
            tokenId: null,
            ethAddress: null,
          };
        } catch (error) {
          console.warn("Could not fetch PKP permissions by public key:", error);
          // Public key might not be associated with a PKP
          throw new Error(
            "This public key is not associated with a PKP or permissions could not be retrieved"
          );
        }

        return {
          publicKey,
          ethAddress,
          pkpInfo,
          pkpPermissions,
          chainId: chronicleTestnet.id,
        };
      } catch (error) {
        console.error("Failed to search public key:", error);
        throw new Error(
          `Failed to search public key: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    },
    [assertDependenciesLoaded]
  );

  // Search for PKP Token ID - get PKP info and permissions
  const searchPkpTokenId = useCallback(
    async (tokenId: string) => {
      try {
        assertDependenciesLoaded();

        const contractAddress =
          (DEFAULT_NETWORK_NAME as string) === "naga-dev"
            ? "0x0300c7333ed43f0E4A9DD314a74A7757c4Ac3943"
            : "0x7B7b7B477b6Ea0a3685449f3a4E51185FAB646d4";

        // Contract ABI for getPubkey function
        const getPubkeyAbi = [
          {
            inputs: [
              {
                internalType: "uint256",
                name: "tokenId",
                type: "uint256",
              },
            ],
            name: "getPubkey",
            outputs: [
              {
                internalType: "bytes",
                name: "",
                type: "bytes",
              },
            ],
            stateMutability: "view",
            type: "function",
          },
        ];

        // Import viem utilities for contract calls
        const { createPublicClient, http } = await import("viem");

        const client = createPublicClient({
          chain: chronicleTestnet,
          transport: http(chronicleTestnet.rpcUrls.default.http[0]),
        });

        // Call contract to get public key from token ID
        const publicKeyBytes = await client.readContract({
          address: contractAddress as `0x${string}`,
          abi: getPubkeyAbi,
          functionName: "getPubkey",
          args: [BigInt(tokenId)],
        });

        // Convert bytes to hex string (public key)
        const publicKey = publicKeyBytes as `0x${string}`;

        console.log("Retrieved public key from token ID:", publicKey);

        // Use the existing searchPublicKey function with the retrieved public key
        const publicKeyResult = await searchPublicKey(publicKey);

        // Return combined data with token ID info
        return {
          ...publicKeyResult,
          tokenId,
          originalQuery: tokenId,
          retrievedFromContract: true,
        };
      } catch (error) {
        console.error("Failed to search PKP token ID:", error);
        throw new Error(
          `Failed to search PKP token ID: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    },
    [assertDependenciesLoaded, searchPublicKey]
  );

  // Search for IPFS ID - fetch content
  const searchIpfsId = useCallback(async (ipfsId: string) => {
    try {
      const response = await fetch(`https://dweb.link/ipfs/${ipfsId}`);

      if (!response.ok) {
        throw new Error(
          `IPFS fetch failed: ${response.status} ${response.statusText}`
        );
      }

      const contentType = response.headers.get("content-type") || "";
      let content;
      let calculatedSize = 0;

      if (contentType.includes("application/json")) {
        content = await response.json();
        // Calculate size based on stringified JSON
        const jsonString = JSON.stringify(content);
        calculatedSize = new TextEncoder().encode(jsonString).length;
      } else if (contentType.includes("text/")) {
        content = await response.text();
        // Calculate size based on text content
        calculatedSize = new TextEncoder().encode(content).length;
      } else {
        // For other content types, try to get as text first
        try {
          content = await response.text();
          calculatedSize = new TextEncoder().encode(content).length;
        } catch {
          content = "Binary content (cannot display)";
          calculatedSize = new TextEncoder().encode(content).length;
        }
      }

      return {
        ipfsId,
        contentType,
        content,
        size: calculatedSize,
      };
    } catch (error) {
      console.error("Failed to search IPFS ID:", error);
      throw new Error(
        `Failed to fetch IPFS content: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }, []);

  // Main search function
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResult(null);
    setShowDetailedPermissions(false);

    try {
      const query = searchQuery.trim();
      const searchType = detectSearchType(query);

      // Handle unknown search type
      if (searchType === "unknown") {
        throw new Error(
          "Input format not recognized. Please enter a valid Ethereum address (0x...), public key (0x...), PKP token ID (large number), or IPFS hash (Qm...)."
        );
      }

      let data;

      switch (searchType) {
        case "address":
          data = await searchAddress(query);
          break;
        case "publicKey":
          data = await searchPublicKey(query);
          break;
        case "pkpTokenId":
          data = await searchPkpTokenId(query);
          break;
        case "ipfsId":
          data = await searchIpfsId(query);
          break;
        default:
          throw new Error("Unknown search type");
      }

      setSearchResult({
        type: searchType,
        query,
        data,
      });
      setCurrentView("results");
    } catch (error) {
      setSearchResult({
        type: detectSearchType(searchQuery.trim()),
        query: searchQuery.trim(),
        data: null,
        error: error instanceof Error ? error.message : String(error),
      });
      setCurrentView("results");
    } finally {
      setIsSearching(false);
    }
  }, [
    searchQuery,
    searchAddress,
    searchPublicKey,
    searchPkpTokenId,
    searchIpfsId,
  ]);

  // Handle back button
  const handleBack = () => {
    setCurrentView("search");
    setSearchResult(null);
    setShowDetailedPermissions(false);
    // Reset pagination state
    setPkpPagination({
      offset: 0,
      limit: 5,
      total: 0,
      hasMore: false,
    });
  };

  // Handle enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Render search results
  const renderSearchResults = () => {
    if (!searchResult) return null;

    const { type, query, data, error } = searchResult;

    if (error) {
      return (
        <div
          style={{
            padding: "20px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            color: "#dc2626",
          }}
        >
          <h3 style={{ margin: "0 0 12px 0" }}>❌ Search Error</h3>
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      );
    }

    switch (type) {
      case "address":
        return (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {/* Address Info */}
            <div
              style={{
                padding: "20px",
                backgroundColor: "#f0f9ff",
                border: "1px solid #bfdbfe",
                borderRadius: "8px",
              }}
            >
              <h3 style={{ margin: "0 0 16px 0", color: "#1e40af" }}>
                📍 Address Information
              </h3>
              <div style={{ display: "grid", gap: "12px", fontSize: "14px" }}>
                <div>
                  <strong>Address:</strong>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: "12px",
                      color: "#6b7280",
                      marginTop: "4px",
                      wordBreak: "break-all",
                    }}
                  >
                    {query}
                  </div>
                </div>
                <div>
                  <strong>Balance:</strong>
                  <div
                    style={{
                      fontSize: "16px",
                      color: "#059669",
                      fontWeight: "600",
                      marginTop: "4px",
                    }}
                  >
                    {data.balance} {data.balanceSymbol}
                  </div>
                </div>
                <div>
                  <strong>Chain:</strong> {data.chainId} (Chronicle Testnet)
                </div>
              </div>
            </div>

            {/* Owned PKPs */}
            <div
              style={{
                padding: "20px",
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            >
              <h3 style={{ margin: "0 0 16px 0", color: "#1f2937" }}>
                🔑 Owned PKPs
                {data.pagination?.total
                  ? ` (${data.pagination.total} total)`
                  : ` (${data.ownedPkps.length})`}
              </h3>
              {data.ownedPkps.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {data.ownedPkps.map((pkp: unknown, index: number) => {
                    const typedPkp = pkp as {
                      tokenId?: string;
                      publicKey?: string;
                      pubkey?: string;
                    };
                    return (
                      <div
                        key={index}
                        style={{
                          padding: "12px",
                          backgroundColor: "#f9fafb",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                        }}
                      >
                        <div style={{ fontSize: "12px", color: "#374151" }}>
                          <strong>Token ID:</strong> {typedPkp.tokenId}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            fontFamily: "monospace",
                            color: "#6b7280",
                            marginTop: "4px",
                            wordBreak: "break-all",
                          }}
                        >
                          <strong>Public Key:</strong>{" "}
                          {typedPkp.publicKey || typedPkp.pubkey}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#6b7280",
                    backgroundColor: "#f9fafb",
                    borderRadius: "6px",
                    border: "1px dashed #d1d5db",
                  }}
                >
                  No PKPs owned by this address
                </div>
              )}

              {/* Pagination Controls */}
              {data.ownedPkps.length > 0 &&
                data.pagination?.total > data.pagination?.limit && (
                  <div style={{ marginTop: "15px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "10px",
                      }}
                    >
                      <span style={{ fontSize: "14px", color: "#6b7280" }}>
                        Showing {data.pagination.offset + 1} -{" "}
                        {Math.min(
                          data.pagination.offset + data.pagination.limit,
                          data.pagination.total
                        )}{" "}
                        of {data.pagination.total} PKPs
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        onClick={prevPage}
                        disabled={isLoadingPage || data.pagination.offset === 0}
                        style={{
                          padding: "8px 15px",
                          backgroundColor:
                            isLoadingPage || data.pagination.offset === 0
                              ? "#cccccc"
                              : "#6b7280",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor:
                            isLoadingPage || data.pagination.offset === 0
                              ? "not-allowed"
                              : "pointer",
                          fontSize: "14px",
                          flex: 1,
                        }}
                      >
                        {isLoadingPage ? "Loading..." : "← Previous"}
                      </button>
                      <button
                        onClick={nextPage}
                        disabled={isLoadingPage || !data.pagination.hasMore}
                        style={{
                          padding: "8px 15px",
                          backgroundColor:
                            isLoadingPage || !data.pagination.hasMore
                              ? "#cccccc"
                              : "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor:
                            isLoadingPage || !data.pagination.hasMore
                              ? "not-allowed"
                              : "pointer",
                          fontSize: "14px",
                          flex: 1,
                        }}
                      >
                        {isLoadingPage ? "Loading..." : "Next →"}
                      </button>
                    </div>
                  </div>
                )}
            </div>
          </div>
        );

      case "publicKey":
        return (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {/* Public Key Info */}
            <div
              style={{
                padding: "20px",
                backgroundColor: "#f0f9ff",
                border: "1px solid #bfdbfe",
                borderRadius: "8px",
              }}
            >
              <h3 style={{ margin: "0 0 16px 0", color: "#1e40af" }}>
                🔑 Public Key Information
              </h3>
              <div style={{ display: "grid", gap: "12px", fontSize: "14px" }}>
                <div>
                  <strong>Public Key:</strong>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: "12px",
                      color: "#6b7280",
                      marginTop: "4px",
                      wordBreak: "break-all",
                    }}
                  >
                    {query}
                  </div>
                </div>
                <div>
                  <strong>ETH Address:</strong>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: "12px",
                      color: "#6b7280",
                      marginTop: "4px",
                    }}
                  >
                    {data.ethAddress}
                  </div>
                </div>
                <div>
                  <strong>Chain:</strong> {data.chainId} (Chronicle Testnet)
                </div>
              </div>
            </div>

            {/* PKP Permissions */}
            {data.pkpPermissions && (
              <div
                style={{
                  padding: "20px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              >
                <h3 style={{ margin: "0 0 16px 0", color: "#1f2937" }}>
                  🔐 PKP Permissions
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "16px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#f9fafb",
                      borderRadius: "6px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "20px", fontWeight: "700" }}>
                      {data.pkpPermissions?.actions?.length || 0}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                      Lit Actions
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#f9fafb",
                      borderRadius: "6px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "20px", fontWeight: "700" }}>
                      {data.pkpPermissions?.addresses?.length || 0}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                      Addresses
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#f9fafb",
                      borderRadius: "6px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "20px", fontWeight: "700" }}>
                      {data.pkpPermissions?.authMethods?.length || 0}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                      Auth Methods
                    </div>
                  </div>
                </div>

                {/* Show detailed permissions toggle if they exist */}
                {(data.pkpPermissions?.actions?.length > 0 ||
                  data.pkpPermissions?.addresses?.length > 0 ||
                  data.pkpPermissions?.authMethods?.length > 0) && (
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
                        {data.pkpPermissions?.actions?.length > 0 && (
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
                              {data.pkpPermissions.actions.length})
                            </h4>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                              }}
                            >
                              {data.pkpPermissions.actions.map(
                                (action: string, index: number) => (
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
                                      {action || "N/A"}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {/* Addresses Details */}
                        {data.pkpPermissions?.addresses?.length > 0 && (
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
                              {data.pkpPermissions.addresses.length})
                            </h4>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                              }}
                            >
                              {data.pkpPermissions.addresses.map(
                                (address: string, index: number) => (
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
                                      {address || "N/A"}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {/* Auth Methods Details */}
                        {data.pkpPermissions?.authMethods?.length > 0 && (
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
                              {data.pkpPermissions.authMethods.length})
                            </h4>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                              }}
                            >
                              {data.pkpPermissions.authMethods.map(
                                (method: unknown, index: number) => {
                                  // Type guard for method object
                                  const isValidMethod = (
                                    obj: unknown
                                  ): obj is {
                                    authMethodType: number;
                                    id: string;
                                    scopes?: string[];
                                  } => {
                                    return (
                                      typeof obj === "object" &&
                                      obj !== null &&
                                      "authMethodType" in obj &&
                                      "id" in obj
                                    );
                                  };

                                  if (!isValidMethod(method)) return null;

                                  return (
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
                                          color: "#374151",
                                        }}
                                      >
                                        <strong>Type:</strong>{" "}
                                        {method.authMethodType
                                          ? method.authMethodType.toString()
                                          : "N/A"}
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
                                        {method.id || "N/A"}
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
                                            ? method.scopes.length > 0
                                              ? method.scopes.join(", ")
                                              : "no signing scopes permitted"
                                            : method.scopes ||
                                              "no signing scopes permitted"}
                                        </div>
                                      )}
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {!data.pkpPermissions?.actions?.length &&
                  !data.pkpPermissions?.addresses?.length &&
                  !data.pkpPermissions?.authMethods?.length && (
                    <div
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        color: "#6b7280",
                        backgroundColor: "#f9fafb",
                        borderRadius: "6px",
                        border: "1px dashed #d1d5db",
                      }}
                    >
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
                        This PKP has no specific permissions configured.
                      </div>
                    </div>
                  )}
              </div>
            )}

            {!data.pkpPermissions && (
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
                This public key is not associated with a PKP or permissions
                could not be retrieved
              </div>
            )}
          </div>
        );

      case "pkpTokenId":
        return (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {/* PKP Token ID Info */}
            <div
              style={{
                padding: "20px",
                backgroundColor: "#f0f9ff",
                border: "1px solid #bfdbfe",
                borderRadius: "8px",
              }}
            >
              <h3 style={{ margin: "0 0 16px 0", color: "#1e40af" }}>
                🏷️ PKP Token Information
              </h3>
              <div style={{ display: "grid", gap: "12px", fontSize: "14px" }}>
                <div>
                  <strong>Token ID:</strong>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: "12px",
                      color: "#6b7280",
                      marginTop: "4px",
                      wordBreak: "break-all",
                    }}
                  >
                    {query}
                  </div>
                </div>
                {data.publicKey && (
                  <div>
                    <strong>Public Key:</strong>
                    <div
                      style={{
                        fontFamily: "monospace",
                        fontSize: "12px",
                        color: "#6b7280",
                        marginTop: "4px",
                        wordBreak: "break-all",
                      }}
                    >
                      {data.publicKey}
                    </div>
                  </div>
                )}
                {data.ethAddress && (
                  <div>
                    <strong>ETH Address:</strong>
                    <div
                      style={{
                        fontFamily: "monospace",
                        fontSize: "12px",
                        color: "#6b7280",
                        marginTop: "4px",
                      }}
                    >
                      {data.ethAddress}
                    </div>
                  </div>
                )}
                <div>
                  <strong>Chain:</strong> {data.chainId} (Chronicle Testnet)
                </div>
              </div>
            </div>

            {/* PKP Permissions */}
            <div
              style={{
                padding: "20px",
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            >
              <h3 style={{ margin: "0 0 16px 0", color: "#1f2937" }}>
                🔐 PKP Permissions
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "6px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "20px", fontWeight: "700" }}>
                    {data.pkpPermissions?.actions?.length || 0}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    Lit Actions
                  </div>
                </div>
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "6px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "20px", fontWeight: "700" }}>
                    {data.pkpPermissions?.addresses?.length || 0}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    Addresses
                  </div>
                </div>
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "6px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "20px", fontWeight: "700" }}>
                    {data.pkpPermissions?.authMethods?.length || 0}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    Auth Methods
                  </div>
                </div>
              </div>

              {/* Token ID info */}
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "6px",
                  fontSize: "12px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <strong>Token ID:</strong> {query}
              </div>

              {/* Show detailed permissions toggle if they exist */}
              {(data.pkpPermissions?.actions?.length > 0 ||
                data.pkpPermissions?.addresses?.length > 0 ||
                data.pkpPermissions?.authMethods?.length > 0) && (
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
                      marginTop: "12px",
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
                      {data.pkpPermissions?.actions?.length > 0 && (
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
                            {data.pkpPermissions.actions.length})
                          </h4>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                            }}
                          >
                            {data.pkpPermissions.actions.map(
                              (action: string, index: number) => (
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
                                    <strong>IPFS ID:</strong> {action || "N/A"}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {/* Addresses Details */}
                      {data.pkpPermissions?.addresses?.length > 0 && (
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
                            {data.pkpPermissions.addresses.length})
                          </h4>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                            }}
                          >
                            {data.pkpPermissions.addresses.map(
                              (address: string, index: number) => (
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
                                    <strong>Address:</strong> {address || "N/A"}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {/* Auth Methods Details */}
                      {data.pkpPermissions?.authMethods?.length > 0 && (
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
                            {data.pkpPermissions.authMethods.length})
                          </h4>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                            }}
                          >
                            {data.pkpPermissions.authMethods.map(
                              (method: unknown, index: number) => {
                                // Type guard for method object
                                const isValidMethod = (
                                  obj: unknown
                                ): obj is {
                                  authMethodType: number;
                                  id: string;
                                  scopes?: string[];
                                } => {
                                  return (
                                    typeof obj === "object" &&
                                    obj !== null &&
                                    "authMethodType" in obj &&
                                    "id" in obj
                                  );
                                };

                                if (!isValidMethod(method)) return null;

                                return (
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
                                        color: "#374151",
                                      }}
                                    >
                                      <strong>Type:</strong>{" "}
                                      {method.authMethodType
                                        ? method.authMethodType.toString()
                                        : "N/A"}
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
                                      <strong>ID:</strong> {method.id || "N/A"}
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
                                          ? method.scopes.length > 0
                                            ? method.scopes.join(", ")
                                            : "no signing scopes permitted"
                                          : method.scopes ||
                                            "no signing scopes permitted"}
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* No permissions message */}
              {!data.pkpPermissions?.actions?.length &&
                !data.pkpPermissions?.addresses?.length &&
                !data.pkpPermissions?.authMethods?.length && (
                  <div
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      color: "#6b7280",
                      backgroundColor: "#f9fafb",
                      borderRadius: "6px",
                      border: "1px dashed #d1d5db",
                      marginTop: "12px",
                    }}
                  >
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
                      This PKP has no specific permissions configured.
                    </div>
                  </div>
                )}
            </div>
          </div>
        );

      case "ipfsId": {
        // Format content for display
        const formattedContent =
          typeof data.content === "string"
            ? data.content
            : JSON.stringify(data.content, null, 2);

        // Metadata for result display
        const metadata = {
          ipfsId: query,
          contentType: data.contentType,
          size: `${data.size} bytes`,
        };

        return (
          <div
            style={{
              padding: "20px",
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ margin: "0 0 16px 0", color: "#1f2937" }}>
              📄 IPFS Content
            </h3>
            <DisplayCode
              code={formattedContent}
              language="javascript"
              renderComponent={null}
              resultData={metadata}
              resultLabel="IPFS Content Metadata"
              useSideBySide={false}
              theme="dracula"
              isSuccess={false}
            />
          </div>
        );
      }

      default:
        return null;
    }
  };

  if (currentView === "results") {
    return (
      <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        {/* Back Button */}
        <button
          onClick={handleBack}
          style={{
            padding: "8px 16px",
            backgroundColor: "#f3f4f6",
            color: "#374151",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          ← Back to Search
        </button>

        {/* Search Results */}
        {renderSearchResults()}
      </div>
    );
  }

  return (
    <div>
      {/* Search Box */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "500",
              color: "#374151",
              marginBottom: "8px",
            }}
          >
            Search Query
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter address (0x...), public key, PKP token ID, or IPFS ID (Qm...)"
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              fontFamily: "monospace",
            }}
          />
        </div>

        <button
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
          style={{
            width: "100%",
            padding: "12px 16px",
            backgroundColor:
              isSearching || !searchQuery.trim() ? "#9ca3af" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor:
              isSearching || !searchQuery.trim() ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {isSearching && (
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
          {isSearching ? "Searching..." : "🔍 Search"}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Search;
