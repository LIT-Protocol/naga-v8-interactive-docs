/**
 * ProtectedAppComplete Example
 *
 * This demonstrates the complete power of our modular architecture,
 * showing how a 4,700+ line component is now reduced to ~200 lines
 * while maintaining all functionality and improving maintainability.
 */

import { useState, useEffect, useRef } from "react";
import { useLitAuth } from "../../lit-login-modal/LitAuthProvider";
import {
  PKPPermissionsProvider,
  PermissionsDashboard,
  WalletOperationsDashboard,
  PaymentManagerOperationsDashboard,
  TransactionToastContainer,
  DashboardLayout,
  StatusDisplay,
  PkpInfo,
  BalanceInfo,
  TransactionToast,
  TransactionResult,
  getAllChains,
  type Tab,
} from "./protectedApp/index";

import PkpSelectionForDemo from "../../lit-login-modal/PkpSelectionForDemo";

enum LOGIN_STYLE {
  button = "button",
  popup = "popup",
}

const LOGIN_METHOD = LOGIN_STYLE.popup;

export default function LoggedInDashboard() {
  const {
    user,
    services,
    initiateAuthentication,
    isInitializingServices,
    isServicesReady,
    authServiceBaseUrl,
  } = useLitAuth();

  const hasAutoStartedRef = useRef(false);
  const hasInitialBalanceRefetch = useRef(false);
  const blockWatcherCleanupRef = useRef<null | (() => void)>(null);
  const lastBalanceUpdateAtRef = useRef<number>(0);

  useEffect(() => {
    if (
      LOGIN_METHOD === LOGIN_STYLE.popup &&
      !user &&
      !hasAutoStartedRef.current
    ) {
      hasAutoStartedRef.current = true;
      initiateAuthentication();
    }
  }, [user, initiateAuthentication]);

  // Core state
  const [showPkpModal, setShowPkpModal] = useState(false);
  const [selectedPkp, setSelectedPkp] = useState<PkpInfo | null>(
    user?.pkpInfo || null
  );
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [selectedChain, setSelectedChain] = useState<string>("yellowstone");
  const [status, setStatus] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("playground");

  // Transaction toast state
  const [transactionToasts, setTransactionToasts] = useState<
    TransactionToast[]
  >([]);

  // Tab configuration
  const tabs: Tab[] = [
    { id: "playground", label: "Playground" },
    { id: "permissions", label: "PKP Permissions" },
    { id: "payment", label: "Payment Management" },
  ];

  // Toast management
  const addTransactionToast = (
    message: string,
    txHash: string,
    type: "success" | "error" = "success"
  ) => {
    const toast: TransactionToast = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      txHash,
      type,
      timestamp: Date.now(),
    };
    setTransactionToasts((prev) => [...prev, toast]);

    setTimeout(() => {
      setTransactionToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 8000);
  };

  const removeTransactionToast = (id: string) => {
    setTransactionToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Handle transaction completion
  const handleTransactionComplete = (result: TransactionResult) => {
    console.log("Transaction completed:", result);
    addTransactionToast("Transaction sent successfully!", result.hash);

    setTimeout(() => {
      loadBalance({ silent: true });
    }, 2000);
  };

  // Load balance function
  const loadBalance = async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!selectedPkp?.ethAddress || !services?.litClient) return;

    if (!silent) setIsLoadingBalance(true);
    try {
      const { createPublicClient, http } = await import("viem");
      const allChains = getAllChains();
      const chainInfo = allChains[selectedChain as keyof typeof allChains];
      if (!chainInfo) throw new Error(`Unknown chain: ${selectedChain}`);

      const chainConfig = {
        id: chainInfo.id,
        name: chainInfo.name,
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

      const balance = await client.getBalance({
        address: selectedPkp.ethAddress as `0x${string}`,
      });

      setBalance({
        balance: (Number(balance) / 1e18).toFixed(6),
        symbol: chainInfo.symbol,
        chainId: chainInfo.id,
      });
    } catch (error) {
      console.error("Failed to load balance:", error);
      setBalance(null);
    } finally {
      if (!silent) setIsLoadingBalance(false);
    }
  };

  // Load balance when PKP or chain changes
  useEffect(() => {
    if (selectedPkp) {
      loadBalance();
    }
  }, [selectedPkp, selectedChain]);

  // Ensure balance is (re)fetched after hot refresh when services become ready
  useEffect(() => {
    if (hasInitialBalanceRefetch.current) return;
    if (isServicesReady && selectedPkp) {
      hasInitialBalanceRefetch.current = true;
      loadBalance();
    }
  }, [isServicesReady, selectedPkp]);

  // Live balance updates: refetch on new blocks (polling if ws not available)
  useEffect(() => {
    // Clean up any previous watcher
    if (blockWatcherCleanupRef.current) {
      try {
        blockWatcherCleanupRef.current();
      } catch {
        // ignore
      }
      blockWatcherCleanupRef.current = null;
    }

    // Preconditions
    if (!isServicesReady || !selectedPkp?.ethAddress) return;

    let cancelled = false;
    (async () => {
      try {
        const { createPublicClient, http } = await import("viem");
        const allChains = getAllChains();
        const chainInfo = allChains[selectedChain as keyof typeof allChains];
        if (!chainInfo) return;

        const chainConfig = {
          id: chainInfo.id,
          name: chainInfo.name,
          nativeCurrency: {
            name: chainInfo.name,
            symbol: chainInfo.symbol,
            decimals: 18,
          },
          rpcUrls: {
            default: { http: [chainInfo.rpcUrl] },
            public: { http: [chainInfo.rpcUrl] },
          },
        } as const;

        const client = createPublicClient({
          chain: chainConfig,
          transport: http(chainInfo.rpcUrl),
        });

        if (cancelled) return;

        const unwatch = client.watchBlockNumber({
          poll: true,
          pollingInterval: 5_000,
          emitOnBegin: true,
          onBlockNumber: () => {
            const now = Date.now();
            // simple debounce to avoid overlapping calls
            if (now - lastBalanceUpdateAtRef.current < 2_500) return;
            lastBalanceUpdateAtRef.current = now;
            loadBalance({ silent: true });
          },
          onError: (err) => {
            console.error("Block watch error:", err);
          },
        });
        blockWatcherCleanupRef.current = unwatch;
      } catch (err) {
        console.error("Failed to start block watcher:", err);
      }
    })();

    return () => {
      cancelled = true;
      if (blockWatcherCleanupRef.current) {
        try {
          blockWatcherCleanupRef.current();
        } catch {
          // ignore
        }
        blockWatcherCleanupRef.current = null;
      }
    };
  }, [isServicesReady, selectedPkp?.ethAddress, selectedChain]);

  // Sync selectedPkp with user.pkpInfo
  useEffect(() => {
    if (user?.pkpInfo) {
      const mappedPkp = {
        tokenId: user.pkpInfo.tokenId || "unknown",
        publicKey: user.pkpInfo.pubkey || user.pkpInfo.publicKey || "",
        ethAddress: user.pkpInfo.ethAddress || "",
      };
      setSelectedPkp(mappedPkp);
    } else {
      setSelectedPkp(null);
    }
  }, [user?.pkpInfo]);

  // PKP selection handler
  const handlePkpSelected = (pkpInfo: PkpInfo) => {
    console.log("PKP selected:", pkpInfo);
    setSelectedPkp(pkpInfo);
    setStatus(`Selected PKP: ${pkpInfo.ethAddress}`);
  };

  // Authentication and loading states
  if (!user) {
    if (LOGIN_METHOD === LOGIN_STYLE.popup) {
      return (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <h2>Starting sign-in</h2>
          <p>Launching the authentication popup…</p>
        </div>
      );
    }
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Not authenticated</h2>
        <p>Please sign in to continue.</p>
        <button
          onClick={initiateAuthentication}
          style={{
            padding: "12px 24px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            marginTop: "20px",
          }}
        >
          Sign In
        </button>
      </div>
    );
  }

  if (user && !isServicesReady) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div
          style={{
            display: "inline-block",
            width: "40px",
            height: "40px",
            border: "4px solid #e3e3e3",
            borderTop: "4px solid #007bff",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            marginBottom: "20px",
          }}
        />
        <h2 style={{ color: "#333", marginBottom: "10px" }}>
          Initialising Lit Protocol Services
        </h2>
        <p style={{ color: "#666" }}>
          {isInitializingServices
            ? "Setting up your authentication context..."
            : "Loading your PKP wallet..."}
        </p>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <PKPPermissionsProvider
      selectedPkp={selectedPkp}
      setStatus={setStatus}
      addTransactionToast={addTransactionToast}
    >
      <div className="sticky top-16 z-50 bg-white">
        <div id="header-nav" className="text-black max-w-8xl mx-auto">
          <div className="lg:flex px-12 h-12 font-medium text-sm bg-white">
            <div className="nav-tabs h-full flex text-sm gap-x-6">
              {tabs.map((t) => (
                <a
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`cursor-pointer relative h-full gap-2 flex items-center hover:border-b ${activeTab === t.id
                      ? "border-b border-b-[#EA580D] hover:border-b-[#EA580D]"
                      : "text-[#837F7E] hover:border-b-gray-300 hover:text-[#575250] font-medium"
                    }`}
                >
                  {t.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full border-b border-gray-500/5"></div>
      {(() => {
        try {
          const { shouldDisplayNetworkMessage, currentNetworkName } =
            useLitAuth();
          return shouldDisplayNetworkMessage ? (
            <div
              className="w-full bg-[#FFF6E5] text-black text-sm text-yellow-700 p-2 text-center border-b border-[#FFDD8F] border-t font-light sticky top-28 z-50"
              style={{ marginTop: "-1px" }}
            >
              ⚠️ The {currentNetworkName} testnet is a public testnet and is not
              meant for production use as there's no persistency guarantees.
              Please use for testing and development purposes only.
            </div>
          ) : null;
        } catch {
          return null;
        }
      })()}
      <DashboardLayout
        selectedPkp={selectedPkp}
        balance={balance}
        isLoadingBalance={isLoadingBalance}
        selectedChain={selectedChain}
        onShowPkpModal={() => setShowPkpModal(true)}
        onChainChange={setSelectedChain}
        userMethod={user.method}
      >
        {activeTab === "playground" && (
          <WalletOperationsDashboard
            selectedPkp={selectedPkp}
            selectedChain={selectedChain}
            onTransactionComplete={handleTransactionComplete}
          />
        )}

        {activeTab === "permissions" && <PermissionsDashboard />}

        {activeTab === "payment" && (
          <PaymentManagerOperationsDashboard
            selectedPkp={selectedPkp}
            selectedChain={selectedChain}
            onTransactionComplete={handleTransactionComplete}
            services={services}
          />
        )}
      </DashboardLayout>

      {/* Status Display */}
      {/* <StatusDisplay status={status} onDismiss={() => setStatus("")} /> */}

      {/* Tab Navigation moved to top nav bar */}

      {/* Tab Content moved inside DashboardLayout main area */}

      {/* Transaction Toast Notifications */}
      <TransactionToastContainer
        toasts={transactionToasts}
        onRemoveToast={removeTransactionToast}
      />

      {/* PKP Selection Modal */}
      {showPkpModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPkpModal(false);
            }
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              color: "black",
              borderRadius: "12px",
              padding: "28px",
              maxWidth: "48rem",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              border: "1px solid #e5e7eb",
            }}
          >
            {/* Modal Header */}
            <div style={{ marginBottom: "20px" }}>
              <button
                onClick={() => setShowPkpModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6b7280",
                  fontSize: "13px",
                  cursor: "pointer",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                  e.currentTarget.style.color = "#374151";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#6b7280";
                }}
              >
                ← Close
              </button>

              {/* <div
                style={{
                  padding: "16px",
                  backgroundColor: "#f0f9ff",
                  borderRadius: "8px",
                  border: "1px solid #bfdbfe",
                  marginBottom: "16px",
                }}
              >
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#1e40af",
                    margin: "0 0 8px 0",
                  }}
                >
                  🔄 Switch PKP Wallet
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#1e40af",
                    margin: "0",
                    lineHeight: "1.4",
                  }}
                >
                  Select a different PKP wallet from your available options.
                </p>
              </div> */}
            </div>

            {/* PKP Selection Component */}
            <PkpSelectionForDemo
              authData={user.authData}
              onPkpSelected={(pkpInfo) => {
                handlePkpSelected(pkpInfo);
                setShowPkpModal(false);
              }}
              authMethodName={user.method}
              services={services}
              disabled={false}
              authServiceBaseUrl={authServiceBaseUrl}
            />
          </div>
        </div>
      )}

      {/* Global CSS */}
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
    </PKPPermissionsProvider>
  );
}
