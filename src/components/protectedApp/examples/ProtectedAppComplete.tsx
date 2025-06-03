/**
 * ProtectedAppComplete Example
 * 
 * This demonstrates the complete power of our modular architecture,
 * showing how a 4,700+ line component is now reduced to ~200 lines
 * while maintaining all functionality and improving maintainability.
 */

import React, { useState, useEffect } from 'react';
import { useLitAuth } from '../../../contexts/LitAuthProvider';
import {
  PKPPermissionsProvider,
  PermissionsDashboard,
  WalletOperationsDashboard,
  TransactionToastContainer,
  DashboardLayout,
  DashboardHeader,
  TabNavigation,
  StatusDisplay,
  PkpInfo,
  BalanceInfo,
  TransactionToast,
  TransactionResult,
  SUPPORTED_CHAINS,
  type Tab
} from '../index';

import PkpSelectionForDemo from '../../common/PkpSelectionForDemo';

export default function ProtectedAppComplete() {
  const {
    user,
    logout,
    services,
    initiateAuthentication,
    isInitializingServices,
    isServicesReady,
  } = useLitAuth();

  // Core state
  const [showPkpModal, setShowPkpModal] = useState(false);
  const [selectedPkp, setSelectedPkp] = useState<PkpInfo | null>(user?.pkpInfo || null);
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [selectedChain, setSelectedChain] = useState<string>("yellowstone");
  const [status, setStatus] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  // Transaction toast state
  const [transactionToasts, setTransactionToasts] = useState<TransactionToast[]>([]);

  // Tab configuration
  const tabs: Tab[] = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "permissions", label: "PKP Permissions", icon: "🔐" },
  ];

  // Toast management
  const addTransactionToast = (message: string, txHash: string, type: 'success' | 'error' = 'success') => {
    const toast: TransactionToast = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      txHash,
      type,
      timestamp: Date.now(),
    };
    setTransactionToasts(prev => [...prev, toast]);
    
    setTimeout(() => {
      setTransactionToasts(prev => prev.filter(t => t.id !== toast.id));
    }, 8000);
  };

  const removeTransactionToast = (id: string) => {
    setTransactionToasts(prev => prev.filter(t => t.id !== id));
  };

  // Handle transaction completion
  const handleTransactionComplete = (result: TransactionResult) => {
    console.log("Transaction completed:", result);
    addTransactionToast("Transaction sent successfully!", result.hash);
    
    setTimeout(() => {
      loadBalance();
    }, 2000);
  };

  // Load balance function
  const loadBalance = async () => {
    if (!selectedPkp?.ethAddress || !services?.litClient) return;

    setIsLoadingBalance(true);
    try {
      const { createPublicClient, http } = await import("viem");
      const chainInfo = SUPPORTED_CHAINS[selectedChain as keyof typeof SUPPORTED_CHAINS];

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
      setIsLoadingBalance(false);
    }
  };

  // Load balance when PKP or chain changes
  useEffect(() => {
    if (selectedPkp) {
      loadBalance();
    }
  }, [selectedPkp, selectedChain]);

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
      <DashboardLayout
        selectedPkp={selectedPkp}
        balance={balance}
        isLoadingBalance={isLoadingBalance}
        selectedChain={selectedChain}
        onShowPkpModal={() => setShowPkpModal(true)}
        onChainChange={setSelectedChain}
        onLogout={logout}
        userMethod={user.method}
      >
        {/* Dashboard Header combines PKP info and chain selector */}
        <DashboardHeader
          selectedPkp={selectedPkp}
          balance={balance}
          isLoadingBalance={isLoadingBalance}
          selectedChain={selectedChain}
          onShowPkpModal={() => setShowPkpModal(true)}
          onChainChange={setSelectedChain}
        />
      </DashboardLayout>

      {/* Status Display */}
      <StatusDisplay 
        status={status}
        onDismiss={() => setStatus("")}
      />

      {/* Tab Navigation */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      {activeTab === "overview" && (
        <WalletOperationsDashboard 
          selectedPkp={selectedPkp}
          selectedChain={selectedChain}
          onTransactionComplete={handleTransactionComplete}
        />
      )}

      {activeTab === "permissions" && (
        <PermissionsDashboard />
      )}

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

              <div
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
              </div>
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