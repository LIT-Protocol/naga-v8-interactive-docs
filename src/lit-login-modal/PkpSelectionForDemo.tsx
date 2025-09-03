import React, { useState, useEffect } from "react";
import { APP_INFO } from "../_config";

// Chain configuration for balance fetching
const SUPPORTED_CHAINS = {
  yellowstone: {
    id: 2888,
    name: "Chronicle Yellowstone",
    symbol: "LPX",
    rpcUrl: "https://yellowstone-rpc.litprotocol.com/",
    explorerUrl: "https://yellowstone-explorer.litprotocol.com",
    testnet: true,
  },
  ethereum: {
    id: 1,
    name: "Ethereum",
    symbol: "ETH", 
    rpcUrl: "https://eth.llamarpc.com",
    explorerUrl: "https://etherscan.io",
    testnet: false,
  },
  sepolia: {
    id: 11155111,
    name: "Sepolia",
    symbol: "ETH",
    rpcUrl: "https://rpc.sepolia.org",
    explorerUrl: "https://sepolia.etherscan.io",
    testnet: true,
  },
};

interface PkpInfo {
  tokenId: string;
  publicKey: string;
  ethAddress: string;
  balance?: string;
  balanceSymbol?: string;
  isLoadingBalance?: boolean;
}

interface PkpSelectionForDemoProps {
  authData: any;
  onPkpSelected: (pkpInfo: PkpInfo) => void;
  authMethodName: string;
  services: any;
  disabled?: boolean;
}

const PkpSelectionForDemo: React.FC<PkpSelectionForDemoProps> = ({
  authData,
  onPkpSelected,
  authMethodName,
  services,
  disabled = false,
}) => {
  const [mode, setMode] = useState<"existing" | "mint">("existing");
  const [pkps, setPkps] = useState<PkpInfo[]>([]);
  const [selectedPkp, setSelectedPkp] = useState<PkpInfo | null>(null);
  const [status, setStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinting, setIsMinting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPkps, setTotalPkps] = useState(0);
  const [pageSize] = useState(5);
  const [isLoadingPage, setIsLoadingPage] = useState(false);

  // Copy functionality
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Debug logging
  useEffect(() => {
    console.log("PkpSelectionForDemo mounted with:", {
      authData,
      authMethodName,
      services: !!services,
      hasLitClient: !!services?.litClient,
    });
  }, []);

  // Add logging for pkps state changes to track re-renders
  useEffect(() => {
    console.log(`🎨 [RENDER] PKPs state changed - count: ${pkps.length}, tokenIds:`, pkps.map((p: any) => p.tokenId?.slice(-8)));
    console.log(`🎨 [RENDER] Current page: ${currentPage}, should show PKPs for page ${currentPage}`);
  }, [pkps, currentPage]);

  // Load PKPs when page changes
  useEffect(() => {
    console.log(`🔄 [USEEFFECT] Page change detected - currentPage: ${currentPage}, mode: ${mode}`);
    if (mode === "existing" && services && authData) {
      console.log(`📄 [PAGE_NAVIGATION] Loading page ${currentPage} due to useEffect`);
      // Clear current PKPs to prevent showing stale data during page transition
      setPkps([]);
      loadExistingPkps(currentPage);
    }
  }, [currentPage, mode, services, authData]);

  // Reset to page 1 when switching to existing mode
  useEffect(() => {
    if (mode === "existing") {
      console.log(`🔄 [MODE_CHANGE] Switching to existing mode, resetting to page 1`);
      setCurrentPage(1);
    }
  }, [mode]);

  // Balance fetching function
  const fetchPkpBalance = async (pkp: PkpInfo, chainKey: string = "yellowstone"): Promise<{ balance: string; symbol: string } | null> => {
    console.log(`💰 [BALANCE] Fetching balance for PKP ${pkp.tokenId?.slice(-8)} at address ${pkp.ethAddress}`);
    try {
      const chainInfo = SUPPORTED_CHAINS[chainKey as keyof typeof SUPPORTED_CHAINS];
      if (!chainInfo || !pkp.ethAddress) {
        console.warn(`💰 [BALANCE] Missing chain info or address for PKP ${pkp.tokenId?.slice(-8)}`);
        return null;
      }

      console.log(`💰 [BALANCE] Using chain: ${chainInfo.name} (${chainInfo.symbol}) RPC: ${chainInfo.rpcUrl}`);

      // Import viem for balance fetching
      const { createPublicClient, http } = await import("viem");

      // Create chain config for viem
      const chainConfig = {
        id: chainInfo.id,
        name: chainInfo.name,
        network: chainInfo.name.toLowerCase().replace(/\s+/g, '-'),
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

      console.log(`💰 [BALANCE] Making balance request for ${pkp.ethAddress}...`);
      const balance = await client.getBalance({
        address: pkp.ethAddress as `0x${string}`,
      });

      const formattedBalance = (Number(balance) / 1e18).toFixed(6);
      console.log(`💰 [BALANCE] ✅ Success! PKP ${pkp.tokenId?.slice(-8)} balance: ${formattedBalance} ${chainInfo.symbol}`);

      return {
        balance: formattedBalance,
        symbol: chainInfo.symbol,
      };
    } catch (error) {
      console.error(`💰 [BALANCE] ❌ Failed to fetch balance for PKP ${pkp.tokenId?.slice(-8)}:`, error);
      return null;
    }
  };

  // Load balances for all PKPs
  const loadBalancesForPkps = async (pkpsToLoad: PkpInfo[]) => {
    console.log(`💰 [BALANCE_BATCH] Starting balance loading for ${pkpsToLoad.length} PKPs:`, pkpsToLoad.map(p => p.tokenId?.slice(-8)));
    const updatedPkps = [...pkpsToLoad];
    
    // Set loading state for all PKPs
    updatedPkps.forEach(pkp => {
      pkp.isLoadingBalance = true;
    });
    console.log(`💰 [BALANCE_BATCH] Set loading state for all PKPs`);
    setPkps([...updatedPkps]);

    // Fetch balances in parallel
    const balancePromises = pkpsToLoad.map(async (pkp, index) => {
      const balanceInfo = await fetchPkpBalance(pkp);
      return { index, balanceInfo };
    });

    console.log(`💰 [BALANCE_BATCH] Waiting for ${balancePromises.length} balance requests...`);
    const results = await Promise.allSettled(balancePromises);
    
    // Update PKPs with balance results
    results.forEach((result, idx) => {
      if (result.status === 'fulfilled' && result.value.balanceInfo) {
        const { balance, symbol } = result.value.balanceInfo;
        updatedPkps[idx].balance = balance;
        updatedPkps[idx].balanceSymbol = symbol;
        console.log(`💰 [BALANCE_BATCH] ✅ PKP ${updatedPkps[idx].tokenId?.slice(-8)} balance updated: ${balance} ${symbol}`);
      } else {
        updatedPkps[idx].balance = "N/A";
        updatedPkps[idx].balanceSymbol = "LPX";
        console.log(`💰 [BALANCE_BATCH] ❌ PKP ${updatedPkps[idx].tokenId?.slice(-8)} balance failed, set to N/A`);
      }
      updatedPkps[idx].isLoadingBalance = false;
    });

    console.log(`💰 [BALANCE_BATCH] Updating PKP state with balance results...`);
    setPkps([...updatedPkps]);
    console.log(`💰 [BALANCE_BATCH] ✅ Balance loading complete!`);
  };

  const loadExistingPkps = async (page: number, forceRefresh: boolean = false) => {
    console.log(`🔄 [PAGINATION] loadExistingPkps called - Page: ${page}, forceRefresh: ${forceRefresh}`);
    console.log(`🔄 [PAGINATION] Current state - currentPage: ${currentPage}, pkps.length: ${pkps.length}`);
    console.log(`🔄 [PAGINATION] Current PKP tokenIds in state:`, pkps.map(p => p.tokenId?.slice(-8)));
    
    const isPageChange = page > 1;
    
    if (isPageChange) {
      console.log(`📄 [PAGE_CHANGE] Setting loading state for page change to page ${page}`);
      setIsLoadingPage(true);
    } else {
      console.log(`📄 [PAGE_LOAD] Setting loading state for initial page load`);
      setIsLoading(true);
    }
    
    setStatus(page === 1 ? "Loading PKPs..." : `Loading page ${page}...`);
    
    try {
      console.log(`Loading PKPs page ${page} with authData:`, authData);
      console.log("Services object:", services);
      console.log("Has litClient:", !!services?.litClient);
      console.log(`Pagination: offset=${(page - 1) * pageSize}, limit=${pageSize}`);
      console.log(`Cache enabled: ${!forceRefresh} (granular PKP caching by tokenId)`);
      
      console.log(`🌐 [API_CALL] About to call viewPKPsByAuthData with:`, {
        authMethodType: authData.authMethodType,
        authMethodId: authData.authMethodId,
        pagination: { 
          limit: pageSize, 
          offset: (page - 1) * pageSize 
        },
        cacheEnabled: !forceRefresh
      });
      
      // Import storage plugins for caching
      const { storagePlugins } = await import("@lit-protocol/auth");
      
      // Create storage provider for caching
      const storageProvider = storagePlugins.localStorage({
        appName: 'lit-auth-demo',
        networkName: APP_INFO.network,
      });

      // Get PKPs with pagination and granular caching
      // Each PKP is cached individually by tokenId, so pagination should work fine
      const result = await services.litClient.viewPKPsByAuthData({
        authData: {
          authMethodType: authData.authMethodType,
          authMethodId: authData.authMethodId,
        },
        pagination: { 
          limit: pageSize, 
          offset: (page - 1) * pageSize 
        },
        // Use cache unless forcing refresh
        storageProvider: forceRefresh ? undefined : storageProvider,
      });

      console.log(`PKP API result for page ${page}:`, result);
      console.log(`Expected offset: ${(page - 1) * pageSize}, limit: ${pageSize}`);
      console.log(`Actual PKPs returned:`, result?.pkps?.length || 0);
      console.log(`From cache:`, result?.fromCache || false);
      console.log(`Token IDs on this page:`, result?.pkps?.map((pkp: any) => pkp.tokenId?.slice(-8)) || []);

      console.log(`📊 [API_RESPONSE] Detailed response analysis:`, {
        pageRequested: page,
        pkpsReceived: result?.pkps?.length || 0,
        fromCache: result?.fromCache || false,
        totalFromAPI: result?.pagination?.total,
        offsetUsed: (page - 1) * pageSize,
        limitUsed: pageSize,
        firstTokenId: result?.pkps?.[0]?.tokenId?.slice(-8),
        lastTokenId: result?.pkps?.[result?.pkps?.length - 1]?.tokenId?.slice(-8)
      });

      if (result?.pkps && result.pkps.length > 0) {
        const formattedPkps = result.pkps.map((pkp: any) => ({
          tokenId: pkp.tokenId || 'unknown',
          publicKey: pkp.pubkey || pkp.publicKey || '', // Handle both field names and missing data
          ethAddress: pkp.ethAddress || '',
        }));
        
        console.log(`🔄 [STATE_UPDATE] About to update state with formatted PKPs:`, {
          pageRequested: page,
          formattedPkpsCount: formattedPkps.length,
          formattedTokenIds: formattedPkps.map((p: any) => p.tokenId?.slice(-8)),
          previousPkpsInState: pkps.map((p: any) => p.tokenId?.slice(-8))
        });
        
        setPkps(formattedPkps);
        
        console.log(`✅ [STATE_UPDATED] State should now contain PKPs for page ${page}`);
        
        // Update pagination info
        const total = result.pagination?.total || formattedPkps.length;
        setTotalPkps(total);
        setTotalPages(Math.ceil(total / pageSize));
        
        setStatus(`Showing ${formattedPkps.length} of ${total} PKPs (Page ${page} of ${Math.ceil(total / pageSize)}) ${result.fromCache ? '📦 (cached)' : ''} - Loading balances...`);
        console.log("Formatted PKPs:", formattedPkps);
        console.log("Page state updated - PKPs should be different from previous page");
        
        // Load balances for all PKPs
        setTimeout(() => {
          loadBalancesForPkps(formattedPkps).then(() => {
            setStatus(`Showing ${formattedPkps.length} of ${total} PKPs (Page ${page} of ${Math.ceil(total / pageSize)}) ${result.fromCache ? '📦 (cached)' : ''}`);
          });
        }, 100); // Small delay to let UI update first
      } else {
        setPkps([]);
        setTotalPkps(0);
        setTotalPages(1);
        setStatus(`No PKPs found for your ${authMethodName}`);
        console.log("No PKPs found in result:", result);
      }
    } catch (error) {
      console.error("Error loading PKPs:", error);
      setStatus(`Failed to load PKPs: ${error}`);
      setPkps([]);
      setTotalPkps(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
      setIsLoadingPage(false);
    }
  };

  const handlePkpSelect = (pkp: PkpInfo) => {
    setSelectedPkp(pkp);
    setStatus(`✅ Selected PKP: ${pkp.ethAddress.slice(0, 10)}...`);
    onPkpSelected(pkp);
  };

  const handleMintNewPkp = async () => {
    setIsMinting(true);
    setStatus("Minting new PKP...");
    
    try {
      const result = await services.litClient.authService.mintWithAuth({
        authData,
      });

      if (result?.data) {
        const newPkp: PkpInfo = {
          tokenId: result.data.tokenId || 'new-pkp',
          publicKey: result.data.pubkey || result.data.publicKey || '',
          ethAddress: result.data.ethAddress || '',
        };
        
        setSelectedPkp(newPkp);
        setStatus(`✅ Minted new PKP: ${newPkp.ethAddress.slice(0, 10) || 'N/A'}...`);
        onPkpSelected(newPkp);
        setMode("existing");
      }
    } catch (error) {
      setStatus("❌ Failed to mint PKP");
    } finally {
      setIsMinting(false);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const formatPublicKey = (pubKey: string) => {
    if (!pubKey) return 'N/A';
    return `${pubKey.slice(0, 12)}...${pubKey.slice(-8)}`;
  };

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        textarea.style.top = '-999999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      
      setCopiedAddress(fieldId);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ 
          fontSize: "18px", 
          fontWeight: "600", 
          color: "#111827",
          margin: "0 0 8px 0" 
        }}>
          🔑 Select Your PKP Wallet
        </h3>
        <p style={{ 
          fontSize: "14px", 
          color: "#6b7280", 
          margin: "0",
          lineHeight: "1.4"
        }}>
          Choose a PKP for your <strong className="capitalize">{authMethodName}</strong> authentication
        </p>
      </div>

      {/* Mode Selection */}
      <div style={{
        padding: "16px",
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
        border: "1px solid #e9ecef",
        marginBottom: "20px",
      }}>
        <h4 style={{ 
          margin: "0 0 12px 0", 
          fontSize: "14px", 
          fontWeight: "600", 
          color: "#495057" 
        }}>
          PKP Options
        </h4>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setMode("existing")}
            disabled={disabled}
            style={{
              padding: "10px 16px",
              backgroundColor: mode === "existing" ? "#007bff" : "white",
              color: mode === "existing" ? "white" : "#495057",
              border: mode === "existing" ? "1px solid #007bff" : "1px solid #dee2e6",
              borderRadius: "6px",
              cursor: disabled ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s",
              opacity: disabled ? 0.6 : 1,
            }}
          >
            📋 Use Existing PKP
          </button>
          <button
            onClick={() => setMode("mint")}
            disabled={disabled}
            style={{
              padding: "10px 16px",
              backgroundColor: mode === "mint" ? "#28a745" : "white",
              color: mode === "mint" ? "white" : "#495057",
              border: mode === "mint" ? "1px solid #28a745" : "1px solid #dee2e6",
              borderRadius: "6px",
              cursor: disabled ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s",
              opacity: disabled ? 0.6 : 1,
            }}
          >
            ⚡ Mint New PKP
          </button>
        </div>
      </div>

      {/* Status Display */}
      {status && (
        <div style={{
          padding: "12px 16px",
          marginBottom: "20px",
          backgroundColor: status.includes("❌") ? "#fff5f5" : 
                           status.includes("✅") ? "#f0fff4" : "#e7f3ff",
          border: `1px solid ${status.includes("❌") ? "#fecaca" : 
                                status.includes("✅") ? "#9ae6b4" : "#b3d9ff"}`,
          borderRadius: "6px",
          fontSize: "14px",
          color: status.includes("❌") ? "#dc2626" : 
                 status.includes("✅") ? "#16a34a" : "#1d4ed8",
          fontWeight: "500",
        }}>
          {status}
        </div>
      )}

      {/* Content Area */}
      <div style={{
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        overflow: "hidden",
        backgroundColor: "white",
      }}>
        {mode === "existing" ? (
          <div>
            {/* Existing PKPs Header */}
            <div style={{
              padding: "16px",
              backgroundColor: "#f8fafc",
              borderBottom: "1px solid #e5e7eb",
            }}>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                marginBottom: "4px" 
              }}>
                <h4 style={{ 
                  margin: "0", 
                  fontSize: "16px", 
                  fontWeight: "600", 
                  color: "#374151" 
                }}>
                  📋 Your Existing PKPs
                </h4>
                <button
                  onClick={() => loadExistingPkps(1, true)}
                  disabled={isLoading || disabled}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: isLoading || disabled ? "#f3f4f6" : "#6366f1",
                    color: isLoading || disabled ? "#9ca3af" : "white",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    cursor: isLoading || disabled ? "not-allowed" : "pointer",
                    fontSize: "12px",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  title="Force refresh PKP data from server"
                >
                  {isLoading ? (
                    <>
                      <div style={{
                        width: "12px",
                        height: "12px",
                        border: "2px solid #ffffff40",
                        borderTop: "2px solid #ffffff",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                      }} />
                      Refreshing...
                    </>
                  ) : (
                    <>🔄 Refresh</>
                  )}
                </button>
              </div>
              <p style={{ 
                margin: "0", 
                fontSize: "13px", 
                color: "#6b7280" 
              }}>
                Select a PKP wallet to continue. Click any address to copy it.
              </p>
            </div>

            {/* PKP List */}
            <div style={{ padding: "16px", position: "relative" }}>
              {isLoading || isLoadingPage ? (
                <div style={{ 
                  textAlign: "center", 
                  padding: "40px",
                  color: "#6b7280",
                }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    border: "3px solid #e5e7eb",
                    borderTop: "3px solid #3b82f6",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 16px",
                  }} />
                  {isLoading ? "Loading your PKPs..." : `Loading page ${currentPage}...`}
                </div>
              ) : pkps.length > 0 ? (
                <div>
                  {/* Debug logging for UI render */}
                  {(() => {
                    console.log(`🎨 [UI_RENDER] About to render ${pkps.length} PKPs for page ${currentPage}:`, pkps.map((p: any) => p.tokenId?.slice(-8)));
                    return null;
                  })()}
                  {/* PKP Grid */}
                  <div style={{ display: "grid", gap: "12px", marginBottom: totalPages > 1 ? "20px" : "0" }}>
                    {pkps.map((pkp) => {
                      console.log(`🔑 [PKP_RENDER] Rendering PKP: ${pkp.tokenId?.slice(-8)}, Address: ${pkp.ethAddress?.slice(-6)}, Balance: ${pkp.balance}, Loading: ${pkp.isLoadingBalance}`);
                      return (
                      <div
                        key={pkp.tokenId}
                        onClick={() => !disabled && handlePkpSelect(pkp)}
                        style={{
                          padding: "16px",
                          border: selectedPkp?.tokenId === pkp.tokenId 
                            ? "2px solid #3b82f6" 
                            : "1px solid #e5e7eb",
                          borderRadius: "8px",
                          backgroundColor: selectedPkp?.tokenId === pkp.tokenId 
                            ? "#eff6ff" 
                            : "white",
                          cursor: disabled ? "not-allowed" : "pointer",
                          transition: "all 0.2s",
                          opacity: disabled ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (!disabled && selectedPkp?.tokenId !== pkp.tokenId) {
                            e.currentTarget.style.backgroundColor = "#f8fafc";
                            e.currentTarget.style.borderColor = "#d1d5db";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!disabled && selectedPkp?.tokenId !== pkp.tokenId) {
                            e.currentTarget.style.backgroundColor = "white";
                            e.currentTarget.style.borderColor = "#e5e7eb";
                          }
                        }}
                      >
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "8px",
                        }}>
                          <div style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#111827",
                          }}>
                            🔑 PKP #{pkp.tokenId?.slice(-8) || 'N/A'}
                          </div>
                          {selectedPkp?.tokenId === pkp.tokenId && (
                            <div style={{
                              fontSize: "12px",
                              color: "#3b82f6",
                              fontWeight: "600",
                              backgroundColor: "#dbeafe",
                              padding: "2px 8px",
                              borderRadius: "12px",
                            }}>
                              ✓ Selected
                            </div>
                          )}
                        </div>
                        
                        <div style={{ fontSize: "13px", color: "#6b7280", lineHeight: "1.4" }}>
                          <div style={{ marginBottom: "4px" }}>
                            <strong style={{ color: "#374151" }}>Address:</strong>{" "}
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(pkp.ethAddress, `address-${pkp.tokenId}`);
                              }}
                              style={{ 
                                fontFamily: "monospace",
                                cursor: "pointer",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                backgroundColor: copiedAddress === `address-${pkp.tokenId}` ? "#dcfce7" : "transparent",
                                color: copiedAddress === `address-${pkp.tokenId}` ? "#16a34a" : "#374151",
                                border: "1px solid transparent",
                                transition: "all 0.2s",
                                display: "inline-block",
                              }}
                              onMouseEnter={(e) => {
                                if (copiedAddress !== `address-${pkp.tokenId}`) {
                                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                                  e.currentTarget.style.borderColor = "#d1d5db";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (copiedAddress !== `address-${pkp.tokenId}`) {
                                  e.currentTarget.style.backgroundColor = "transparent";
                                  e.currentTarget.style.borderColor = "transparent";
                                }
                              }}
                              title="Click to copy full address"
                            >
                              {copiedAddress === `address-${pkp.tokenId}` ? "✅ Copied!" : formatAddress(pkp.ethAddress)}
                            </span>
                          </div>
                          <div style={{ marginBottom: "4px" }}>
                            <strong style={{ color: "#374151" }}>Public Key:</strong>{" "}
                            <span style={{ fontFamily: "monospace" }}>
                              {formatPublicKey(pkp.publicKey)}
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <strong style={{ color: "#374151" }}>Balance:</strong>{" "}
                            {pkp.isLoadingBalance ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <div style={{
                                  width: "12px",
                                  height: "12px",
                                  border: "2px solid #e5e7eb",
                                  borderTop: "2px solid #3b82f6",
                                  borderRadius: "50%",
                                  animation: "spin 1s linear infinite",
                                }} />
                                <span style={{ fontSize: "12px", color: "#9ca3af" }}>Loading...</span>
                              </div>
                            ) : (
                              <span style={{ 
                                fontFamily: "monospace",
                                fontWeight: "500",
                                color: pkp.balance === "N/A" ? "#ef4444" : 
                                       (parseFloat(pkp.balance || "0") > 0 ? "#16a34a" : "#f59e0b")
                              }}>
                                {pkp.balance || "N/A"} {pkp.balanceSymbol || "LPX"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div style={{
                      borderTop: "1px solid #e5e7eb",
                      paddingTop: "16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}>
                      {/* Pagination Info */}
                      <div style={{
                        fontSize: "13px",
                        color: "#6b7280",
                      }}>
                        Page {currentPage} of {totalPages} ({totalPkps} total PKPs)
                      </div>

                      {/* Pagination Buttons */}
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <button
                          onClick={() => {
                            const newPage = Math.max(1, currentPage - 1);
                            console.log(`🔙 [PAGINATION_CLICK] Previous button clicked - from page ${currentPage} to page ${newPage}`);
                            // Clear PKPs and set loading immediately to prevent "No PKPs Found" flash
                            setPkps([]);
                            setIsLoadingPage(true);
                            setCurrentPage(newPage);
                          }}
                          disabled={currentPage === 1 || isLoadingPage || disabled}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: currentPage === 1 || isLoadingPage || disabled ? "#f3f4f6" : "#ffffff",
                            color: currentPage === 1 || isLoadingPage || disabled ? "#9ca3af" : "#374151",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            cursor: currentPage === 1 || isLoadingPage || disabled ? "not-allowed" : "pointer",
                            fontSize: "13px",
                            fontWeight: "500",
                            transition: "all 0.2s",
                          }}
                        >
                          ← Previous
                        </button>

                        {/* Page Numbers */}
                        <div style={{ display: "flex", gap: "4px" }}>
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNumber;
                            if (totalPages <= 5) {
                              pageNumber = i + 1;
                            } else if (currentPage <= 3) {
                              pageNumber = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNumber = totalPages - 4 + i;
                            } else {
                              pageNumber = currentPage - 2 + i;
                            }
                            
                            return (
                              <button
                                key={pageNumber}
                                onClick={() => {
                                  console.log(`🔢 [PAGINATION_CLICK] Page number ${pageNumber} clicked - from page ${currentPage} to page ${pageNumber}`);
                                  // Clear PKPs and set loading immediately to prevent "No PKPs Found" flash
                                  setPkps([]);
                                  setIsLoadingPage(true);
                                  setCurrentPage(pageNumber);
                                }}
                                disabled={isLoadingPage || disabled}
                                style={{
                                  padding: "6px 10px",
                                  backgroundColor: currentPage === pageNumber ? "#3b82f6" : "#ffffff",
                                  color: currentPage === pageNumber ? "#ffffff" : "#374151",
                                  border: currentPage === pageNumber ? "1px solid #3b82f6" : "1px solid #d1d5db",
                                  borderRadius: "6px",
                                  cursor: isLoadingPage || disabled ? "not-allowed" : "pointer",
                                  fontSize: "13px",
                                  fontWeight: "500",
                                  minWidth: "32px",
                                  transition: "all 0.2s",
                                  opacity: isLoadingPage || disabled ? 0.6 : 1,
                                }}
                              >
                                {pageNumber}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => {
                            const newPage = Math.min(totalPages, currentPage + 1);
                            console.log(`🔜 [PAGINATION_CLICK] Next button clicked - from page ${currentPage} to page ${newPage}`);
                            // Clear PKPs and set loading immediately to prevent "No PKPs Found" flash
                            setPkps([]);
                            setIsLoadingPage(true);
                            setCurrentPage(newPage);
                          }}
                          disabled={currentPage === totalPages || isLoadingPage || disabled}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: currentPage === totalPages || isLoadingPage || disabled ? "#f3f4f6" : "#ffffff",
                            color: currentPage === totalPages || isLoadingPage || disabled ? "#9ca3af" : "#374151",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            cursor: currentPage === totalPages || isLoadingPage || disabled ? "not-allowed" : "pointer",
                            fontSize: "13px",
                            fontWeight: "500",
                            transition: "all 0.2s",
                          }}
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Loading overlay for page changes */}
                  {isLoadingPage && (
                    <div style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: "rgba(255, 255, 255, 0.8)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "8px",
                    }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "#6b7280",
                        fontSize: "14px",
                      }}>
                        <div style={{
                          width: "16px",
                          height: "16px",
                          border: "2px solid #e5e7eb",
                          borderTop: "2px solid #3b82f6",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite",
                        }} />
                        Loading page {currentPage}...
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ 
                  textAlign: "center", 
                  padding: "40px",
                  color: "#6b7280",
                }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
                  <h4 style={{ 
                    margin: "0 0 8px 0", 
                    fontSize: "16px", 
                    fontWeight: "600",
                    color: "#374151"
                  }}>
                    No PKPs Found
                  </h4>
                  <p style={{ 
                    margin: "0 0 20px 0", 
                    fontSize: "14px",
                    lineHeight: "1.4"
                  }}>
                    No PKPs found for your {authMethodName}.<br />
                    You can mint a new PKP to get started.
                  </p>
                  <button
                    onClick={() => setMode("mint")}
                    disabled={disabled}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: disabled ? "not-allowed" : "pointer",
                      opacity: disabled ? 0.6 : 1,
                    }}
                  >
                    ⚡ Mint Your First PKP
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Mint New PKP */
          <div>
            {/* Mint Header */}
            <div style={{
              padding: "16px",
              backgroundColor: "#f0fdf4",
              borderBottom: "1px solid #e5e7eb",
            }}>
              <h4 style={{ 
                margin: "0", 
                fontSize: "16px", 
                fontWeight: "600", 
                color: "#374151" 
              }}>
                ⚡ Mint New PKP
              </h4>
              <p style={{ 
                margin: "4px 0 0 0", 
                fontSize: "13px", 
                color: "#6b7280" 
              }}>
                Create a new PKP wallet for your authentication
              </p>
            </div>

            {/* Mint Content */}
            <div style={{ padding: "24px", textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚡</div>
              <h4 style={{ 
                margin: "0 0 12px 0", 
                fontSize: "18px", 
                fontWeight: "600",
                color: "#374151"
              }}>
                Create New PKP Wallet
              </h4>
              <p style={{ 
                margin: "0 0 24px 0", 
                fontSize: "14px",
                color: "#6b7280",
                lineHeight: "1.4",
                maxWidth: "300px",
                marginLeft: "auto",
                marginRight: "auto",
              }}>
                This will create a new PKP wallet specifically for your {authMethodName}. 
                The process takes a few seconds.
              </p>
              
              <button
                onClick={handleMintNewPkp}
                disabled={disabled || isMinting}
                style={{
                  padding: "12px 24px",
                  backgroundColor: disabled || isMinting ? "#9ca3af" : "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: disabled || isMinting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  margin: "0 auto",
                  minWidth: "180px",
                }}
              >
                {isMinting && (
                  <div style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid #ffffff40",
                    borderTop: "2px solid #ffffff",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }} />
                )}
                {isMinting ? "Minting PKP..." : "⚡ Mint New PKP"}
              </button>

              {!isMinting && (
                <button
                  onClick={() => setMode("existing")}
                  disabled={disabled}
                  style={{
                    marginTop: "12px",
                    padding: "8px 16px",
                    backgroundColor: "transparent",
                    color: "#6b7280",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    cursor: disabled ? "not-allowed" : "pointer",
                    textDecoration: "underline",
                  }}
                >
                  ← Back to existing PKPs
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cache Information */}
      {/* <div style={{
        marginTop: "16px",
        padding: "12px 16px",
        backgroundColor: "#f0f9ff",
        border: "1px solid #bfdbfe",
        borderRadius: "8px",
        fontSize: "13px",
        color: "#1e40af",
      }}>
        <div style={{ fontWeight: "600", marginBottom: "4px" }}>
          📦 Smart PKP Caching + 💰 Live Balance Data
        </div>
        <div style={{ lineHeight: "1.4" }}>
          PKP data is cached for lightning-fast performance! Each PKP is stored individually by tokenId, 
          so pagination works seamlessly. Balances are fetched fresh from the Chronicle Yellowstone network 
          for real-time accuracy. You'll see 📦 (cached) or  indicators in the status. Use "🔄 Refresh" to bypass cache when needed.
        </div>
      </div> */}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PkpSelectionForDemo; 