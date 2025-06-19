/**
 * ProtectedAppRefactored Example
 * 
 * This demonstrates how your ProtectedApp.tsx can now be dramatically simplified
 * using the refactored components and contexts.
 */

import React, { useState, useEffect } from 'react';
import { useLitAuth } from '../../../contexts/LitAuthProvider';
import {
  PKPPermissionsProvider,
  PKPInfoCard,
  PermissionsDashboard,
  WalletOperationsDashboard,
  TransactionToastContainer,
  PkpInfo,
  BalanceInfo,
  TransactionToast,
  TransactionResult,
  SUPPORTED_CHAINS
} from '../index';

export default function ProtectedAppRefactored() {
  const {
    user,
    logout,
    services,
    initiateAuthentication,
    isInitializingServices,
    isServicesReady,
  } = useLitAuth();

  // Simplified state management
  const [selectedPkp, setSelectedPkp] = useState<PkpInfo | null>(user?.pkpInfo || null);
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [selectedChain, setSelectedChain] = useState<string>("yellowstone");
  const [status, setStatus] = useState<string>("");
  const [showPkpModal, setShowPkpModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "permissions">("overview");
  
  // Transaction toast state
  const [transactionToasts, setTransactionToasts] = useState<TransactionToast[]>([]);

  // Toast management functions
  const addTransactionToast = (message: string, txHash: string, type: 'success' | 'error' = 'success') => {
    const toast: TransactionToast = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      txHash,
      type,
      timestamp: Date.now(),
    };
    setTransactionToasts(prev => [...prev, toast]);
    
    // Auto-remove after 8 seconds
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
    
    // Reload balance after transaction
    setTimeout(() => {
      if (loadBalance) {
        loadBalance();
      }
    }, 2000);
  };

  // Load balance function (simplified)
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

  // Load balance when PKP changes or chain changes
  useEffect(() => {
    if (selectedPkp) {
      loadBalance();
    }
  }, [selectedPkp, selectedChain]);

  // Sync selectedPkp with user.pkpInfo when user changes
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

  // Handle authentication and loading states
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
      </div>
    );
  }

  return (
    <PKPPermissionsProvider 
      selectedPkp={selectedPkp} 
      setStatus={setStatus} 
      addTransactionToast={addTransactionToast}
    >
      <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        {/* Welcome Banner */}
        <div
          style={{
            marginBottom: "24px",
            padding: "20px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "12px",
            color: "white",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
          <h1
            style={{
              margin: "0 0 8px 0",
              fontSize: "24px",
              fontWeight: "700",
              color: "white",
            }}
          >
            You've successfully authenticated via{" "}
            <strong
              style={{
                fontWeight: "bold",
                textTransform: "uppercase",
                fontSize: "24px",
                borderBottom: "2px solid white",
              }}
            >
              {user.method}
            </strong>{" "}
            and selected your PKP wallet!
          </h1>
        </div>

        {/* Header with PKP info and controls */}
        <div
          style={{
            marginBottom: "30px",
            padding: "24px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "20px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: "0 0 8px 0",
                  color: "#111827",
                  fontSize: "20px",
                  fontWeight: "600",
                }}
              >
                🔐 Your PKP Wallet Dashboard
              </h2>
              <p
                style={{
                  margin: 0,
                  color: "#6b7280",
                  fontSize: "14px",
                  lineHeight: "1.4",
                }}
              >
                Authenticated via{" "}
                <span
                  style={{
                    backgroundColor: "#e0f2fe",
                    color: "#0284c7",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "500",
                  }}
                >
                  {user.method}
                </span>
              </p>
            </div>
            <button
              onClick={logout}
              style={{
                padding: "8px 16px",
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.2s",
              }}
            >
              🚪 Logout
            </button>
          </div>

          {/* Chain Selector */}
          <div style={{ marginBottom: "12px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "11px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              🔗 Network:
            </label>
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "11px",
                color: "black",
                backgroundColor: "white",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {Object.entries(SUPPORTED_CHAINS).map(([key, chain]) => (
                <option key={key} value={key}>
                  {chain.name} ({chain.symbol})
                  {chain.testnet ? " - Testnet" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* PKP Information Card - Now a clean, reusable component */}
          <PKPInfoCard
            selectedPkp={selectedPkp}
            balance={balance}
            isLoadingBalance={isLoadingBalance}
            selectedChain={selectedChain}
            onShowPkpModal={() => setShowPkpModal(true)}
          />
        </div>

        {/* Status Messages */}
        {status && (
          <div
            style={{
              marginBottom: "20px",
              padding: "12px 16px",
              backgroundColor: status.includes("✅") ? "#f0fdf4" : "#eff6ff",
              border: `1px solid ${
                status.includes("✅") ? "#bbf7d0" : "#bfdbfe"
              }`,
              borderRadius: "8px",
              color: status.includes("✅") ? "#15803d" : "#1e40af",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ flex: 1 }}>{status}</div>
            <button
              onClick={() => setStatus("")}
              style={{
                background: "none",
                border: "none",
                color: "inherit",
                fontSize: "16px",
                cursor: "pointer",
                padding: "4px",
                borderRadius: "4px",
                opacity: 0.7,
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{ marginBottom: "30px" }}>
          <div
            style={{
              display: "flex",
              borderBottom: "2px solid #e5e7eb",
              marginBottom: "20px",
            }}
          >
            <button
              onClick={() => setActiveTab("overview")}
              style={{
                padding: "12px 24px",
                border: "none",
                backgroundColor: "transparent",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                borderBottom:
                  activeTab === "overview"
                    ? "2px solid #3b82f6"
                    : "2px solid transparent",
                color: activeTab === "overview" ? "#3b82f6" : "#6b7280",
                transition: "all 0.2s",
              }}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab("permissions")}
              style={{
                padding: "12px 24px",
                border: "none",
                backgroundColor: "transparent",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                borderBottom:
                  activeTab === "permissions"
                    ? "2px solid #3b82f6"
                    : "2px solid transparent",
                color: activeTab === "permissions" ? "#3b82f6" : "#6b7280",
                transition: "all 0.2s",
              }}
            >
              🔐 PKP Permissions 2
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          // The entire overview tab is now just one clean component!
          <WalletOperationsDashboard 
            selectedPkp={selectedPkp}
            selectedChain={selectedChain}
            onTransactionComplete={handleTransactionComplete}
          />
        )}

        {activeTab === "permissions" && (
          // The entire permissions tab is now just one clean component!
          <PermissionsDashboard />
        )}

        {/* Transaction Toast Notifications */}
        <TransactionToastContainer 
          toasts={transactionToasts} 
          onRemoveToast={removeTransactionToast} 
        />

        {/* CSS Animation */}
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
      </div>
    </PKPPermissionsProvider>
  );
} 