import React, { useState, useEffect } from "react";
import { APP_INFO } from "../_config";
import { getAddress } from "viem";

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

interface PKPSelectionSectionProps {
  authData: any;
  onPkpSelected: (pkpInfo: PkpInfo) => void;
  authMethodName: string;
  services: any;
  disabled?: boolean;
  authServiceBaseUrl: string;
  singlePkpMessaging?: boolean;
}

const PKPSelectionSection: React.FC<PKPSelectionSectionProps> = ({
  authData,
  onPkpSelected,
  authMethodName,
  services,
  disabled = false,
  authServiceBaseUrl,
  singlePkpMessaging = false,
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
    console.log("PKPSelectionSection mounted with:", {
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
    
    // setStatus(page === 1 ? "Loading PKPs..." : `Loading page ${page}...`);
    
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
    console.log("authServiceBaseUrl:", authServiceBaseUrl);
    try {
      const result = await services.litClient.authService.mintWithAuth({
        authData,
        authServiceBaseUrl: authServiceBaseUrl,
        scopes: ["sign-anything"]
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

  const formatPublicKey = (pubKey: string) => {
    if (!pubKey) return 'N/A';
    return `${pubKey.slice(0, 32)}...${pubKey.slice(-8)}`;
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
      <div className="mb-5">
        <h3 className="text-[18px] font-semibold text-gray-900 m-0 mb-2">🔑 Select Your PKP Wallet</h3>
        <p className="text-[14px] text-gray-500 m-0 leading-snug">
          {singlePkpMessaging ? (
            <>Each WebAuthn auth maps to a single PKP. When using WebAuthn, you won’t need to pick.</>
          ) : (
            <>Choose a PKP for your <strong className="capitalize">{authMethodName}</strong> authentication</>
          )}
        </p>
      </div>

      {/* Mode Selection removed for streamlined UX */}

      {/* Status Display */}
      {status && !((singlePkpMessaging && status.startsWith("Showing")) || status.startsWith("No PKPs found")) && (
        <div
          className={`px-4 py-3 mb-5 rounded-md text-[14px] font-medium border ${
            status.includes("❌")
              ? "bg-red-50 border-red-200 text-red-600"
              : status.includes("✅")
              ? "bg-green-50 border-green-300 text-green-600"
              : "bg-blue-50 border-blue-200 text-blue-700"
          }`}
        >
          {status}
        </div>
      )}

      {/* Content Area */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <div>
            {/* Existing PKPs Header */}
            {!singlePkpMessaging && (
              <div className="p-4 bg-slate-50 border-b border-gray-200">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="m-0 text-[16px] font-semibold text-gray-700">📋 Your Existing PKPs</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadExistingPkps(1, true)}
                      disabled={isLoading || disabled}
                      className={`px-3 py-1.5 ${
                        isLoading || disabled ? "bg-gray-100 text-gray-400" : "bg-indigo-500 text-white"
                      } border border-gray-300 rounded cursor-${
                        isLoading || disabled ? "not-allowed" : "pointer"
                      } text-[12px] font-medium flex items-center gap-1`}
                      title="Force refresh PKP data from server"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Refreshing...
                        </>
                      ) : (
                        <>🔄 Refresh</>
                      )}
                    </button>
                    <button
                      onClick={handleMintNewPkp}
                      disabled={disabled || isMinting}
                      className={`px-3 py-1.5 ${
                        disabled || isMinting ? "bg-gray-100 text-gray-400" : "bg-green-600 text-white"
                      } border border-gray-300 rounded ${
                        disabled || isMinting ? "cursor-not-allowed" : "cursor-pointer"
                      } text-[12px] font-medium flex items-center gap-1`}
                    >
                      {isMinting ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Minting...
                        </>
                      ) : (
                        <>⚡ Mint New PKP</>
                      )}
                    </button>
                  </div>
                </div>
                <p className="m-0 text-[13px] text-gray-500">
                  Select a PKP wallet to continue. Click any address to copy it.
                </p>
              </div>
            )}

            {/* PKP List */}
            <div className="p-4 relative">
              {isLoading || isLoadingPage ? (
                <div className="text-center p-10 text-gray-500">
                  <div className="w-8 h-8 border-[3px] border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
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
                  <div className={`grid gap-3 ${totalPages > 1 ? "mb-5" : "mb-0"}`}>
                    {pkps.map((pkp) => {
                      console.log(`🔑 [PKP_RENDER] Rendering PKP: ${pkp.tokenId?.slice(-8)}, Address: ${pkp.ethAddress?.slice(-6)}, Balance: ${pkp.balance}, Loading: ${pkp.isLoadingBalance}`);
                      return (
                      <div
                        key={pkp.tokenId}
                        onClick={() => !disabled && handlePkpSelect(pkp)}
                        className={`p-4 rounded-lg ${
                          selectedPkp?.tokenId === pkp.tokenId
                            ? "border-2 border-blue-500 bg-blue-50"
                            : "border border-gray-200 bg-white"
                        } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} transition`}
                        onMouseEnter={(e) => {
                          if (!disabled && selectedPkp?.tokenId !== pkp.tokenId) {
                            e.currentTarget.classList.add("bg-gray-50", "border-gray-300");
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!disabled && selectedPkp?.tokenId !== pkp.tokenId) {
                            e.currentTarget.classList.remove("bg-gray-50", "border-gray-300");
                          }
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-[14px] font-semibold text-gray-900">
                            🔑 PKP #{pkp.tokenId?.slice(-8) || 'N/A'}
                          </div>
                          {selectedPkp?.tokenId === pkp.tokenId && (
                            <div className="text-[12px] text-blue-500 font-semibold bg-blue-100 px-2 py-0.5 rounded-full">
                              ✓ Selected
                            </div>
                          )}
                        </div>
                        <div className="text-[13px] text-gray-500 leading-snug grid grid-cols-[88px_1fr] gap-y-1.5">
                          <div className="text-gray-700 font-semibold">Address:</div>
                          <div>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(pkp.ethAddress, `address-${pkp.tokenId}`);
                              }}
                              className={`font-mono cursor-pointer px-1.5 py-0.5 rounded border inline-block ${
                                copiedAddress === `address-${pkp.tokenId}`
                                  ? "bg-green-100 text-green-600 border-green-200"
                                  : "bg-transparent text-gray-700 border-transparent hover:bg-gray-100 hover:border-gray-300"
                              }`}
                              onMouseEnter={(e) => {
                                if (copiedAddress !== `address-${pkp.tokenId}`) {
                                  e.currentTarget.classList.add("bg-gray-100", "border-gray-300");
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (copiedAddress !== `address-${pkp.tokenId}`) {
                                  e.currentTarget.classList.remove("bg-gray-100", "border-gray-300");
                                }
                              }}
                              title="Click to copy full address"
                            >
                              {copiedAddress === `address-${pkp.tokenId}` ? "✅ Copied!" : getAddress(pkp.ethAddress)}
                            </span>
                          </div>

                          <div className="text-gray-700 font-semibold">Public Key:</div>
                          <div>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(pkp.publicKey, `pubkey-${pkp.tokenId}`);
                              }}
                              className={`font-mono cursor-pointer px-1.5 py-0.5 rounded border inline-block ${
                                copiedAddress === `pubkey-${pkp.tokenId}`
                                  ? "bg-green-100 text-green-600 border-green-200"
                                  : "bg-transparent text-gray-700 border-transparent hover:bg-gray-100 hover:border-gray-300"
                              }`}
                              onMouseEnter={(e) => {
                                if (copiedAddress !== `pubkey-${pkp.tokenId}`) {
                                  e.currentTarget.classList.add("bg-gray-100", "border-gray-300");
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (copiedAddress !== `pubkey-${pkp.tokenId}`) {
                                  e.currentTarget.classList.remove("bg-gray-100", "border-gray-300");
                                }
                              }}
                              title="Click to copy public key"
                            >
                              {copiedAddress === `pubkey-${pkp.tokenId}` ? "✅ Copied!" : formatPublicKey(pkp.publicKey)}
                            </span>
                          </div>

                          <div className="text-gray-700 font-semibold">Balance:</div>
                          <div className="flex items-center gap-1.5">
                            {pkp.isLoadingBalance ? (
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                                <span className="text-[12px] text-gray-400">Loading...</span>
                              </div>
                            ) : (
                              <span
                                className={`font-mono font-medium ${
                                  pkp.balance === "N/A"
                                    ? "text-red-500"
                                    : parseFloat(pkp.balance || "0") > 0
                                    ? "text-green-600"
                                    : "text-amber-500"
                                }`}
                              >
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
                    <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                      {/* Pagination Info */}
                      <div className="text-[13px] text-gray-500">
                        Page {currentPage} of {totalPages} ({totalPkps} total PKPs)
                      </div>

                      {/* Pagination Buttons */}
                      <div className="flex gap-2 items-center">
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
                          className={`px-3 py-1.5 border border-gray-300 rounded text-[13px] font-medium transition ${
                            currentPage === 1 || isLoadingPage || disabled
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-white text-gray-700 hover:bg-gray-100 cursor-pointer"
                          }`}
                        >
                          ← Previous
                        </button>

                        {/* Page Numbers */}
                        <div className="flex gap-1">
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
                                className={`px-2.5 py-1 border rounded text-[13px] font-medium min-w-[32px] transition ${
                                  currentPage === pageNumber
                                    ? "bg-blue-500 text-white border-blue-500"
                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                } ${isLoadingPage || disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
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
                          className={`px-3 py-1.5 border border-gray-300 rounded text-[13px] font-medium transition ${
                            currentPage === totalPages || isLoadingPage || disabled
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-white text-gray-700 hover:bg-gray-100 cursor-pointer"
                          }`}
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Loading overlay for page changes */}
                  {isLoadingPage && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                      <div className="flex items-center gap-2 text-gray-500 text-[14px]">
                        <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                        Loading page {currentPage}...
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-10 text-gray-500">
                  <div className="text-[48px] mb-4">🔍</div>
                  <h4 className="m-0 mb-2 text-[16px] font-semibold text-gray-700">
                    No PKPs Found
                  </h4>
                  <p className="m-0 mb-5 text-[14px] leading-snug">
                    No PKPs found for your {authMethodName}.<br />
                    You can mint a new PKP to get started.
                  </p>
                  <button
                    onClick={handleMintNewPkp}
                    disabled={disabled || isMinting}
                    className={`px-5 py-2 ${
                      disabled || isMinting ? "bg-gray-400" : "bg-green-600"
                    } text-white rounded text-[14px] font-medium ${
                      disabled || isMinting ? "cursor-not-allowed" : "cursor-pointer"
                    } flex items-center gap-2 justify-center min-w-[180px] mx-auto`}
                  >
                    {isMinting && (
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    )}
                    {isMinting ? "Minting PKP..." : "⚡ Mint Your First PKP"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      
    </div>
  );
};

export default PKPSelectionSection; 