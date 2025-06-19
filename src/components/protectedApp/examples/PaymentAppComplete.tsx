/**
 * PaymentAppComplete Example
 * 
 * A specialized payment-focused application built on the modular architecture.
 * This demonstrates how to create targeted apps by composing existing components
 * while maintaining all the power and reliability of the full ProtectedApp.
 */

import React, { useState, useEffect } from 'react';
import { useLitAuth } from '../../../contexts/LitAuthProvider';
import {
  PKPPermissionsProvider,
  TransactionToastContainer,
  DashboardLayout,
  DashboardHeader,
  TabNavigation,
  StatusDisplay,
  PaymentOperationsDashboard,
  PkpInfo,
  BalanceInfo,
  TransactionToast,
  TransactionResult,
  SUPPORTED_CHAINS,
  type Tab
} from '../index';

import PkpSelectionForDemo from '../../common/PkpSelectionForDemo';

export default function PaymentAppComplete() {
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
  const [activeTab, setActiveTab] = useState<string>("send");
  
  // Transaction toast state
  const [transactionToasts, setTransactionToasts] = useState<TransactionToast[]>([]);

  // Payment-specific tab configuration
  const tabs: Tab[] = [
    { id: "send", label: "Send Payment", icon: "💸" },
    { id: "history", label: "Payment History", icon: "📋" },
    { id: "settings", label: "Payment Settings", icon: "⚙️" },
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
    console.log("Payment completed:", result);
    addTransactionToast("Payment sent successfully!", result.hash);
    
    // Save payment to history
    savePaymentToHistory(result);
    
    // Refresh balance after payment
    setTimeout(() => {
      loadBalance();
    }, 2000);
  };

  // Save payment to local history
  const savePaymentToHistory = (result: TransactionResult) => {
    const existingHistory = JSON.parse(localStorage.getItem('payment-history') || '[]');
    const paymentRecord = {
      ...result,
      id: Math.random().toString(36).substr(2, 9),
      type: 'sent',
      status: 'completed',
      savedAt: new Date().toISOString(),
    };
    
    const updatedHistory = [paymentRecord, ...existingHistory].slice(0, 100); // Keep last 100
    localStorage.setItem('payment-history', JSON.stringify(updatedHistory));
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

  // Payment History Component
  const PaymentHistory = () => {
    const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

    useEffect(() => {
      const history = JSON.parse(localStorage.getItem('payment-history') || '[]');
      setPaymentHistory(history);
    }, []);

    return (
      <div
        style={{
          padding: "20px",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <h3 style={{ margin: "0 0 16px 0", color: "#1f2937" }}>
          📋 Payment History
        </h3>
        
        {paymentHistory.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
            No payments yet. Send your first payment to see it here!
          </div>
        ) : (
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {paymentHistory.map((payment, index) => (
              <div
                key={payment.id || index}
                style={{
                  padding: "12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  marginBottom: "8px",
                  backgroundColor: "#f9fafb",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontWeight: "500", color: "#374151" }}>
                    {payment.value} {SUPPORTED_CHAINS[selectedChain as keyof typeof SUPPORTED_CHAINS]?.symbol}
                  </span>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>
                    {new Date(payment.savedAt || payment.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280", fontFamily: "monospace" }}>
                  To: {payment.to?.slice(0, 10)}...{payment.to?.slice(-8)}
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280", fontFamily: "monospace" }}>
                  Tx: {payment.hash?.slice(0, 10)}...{payment.hash?.slice(-8)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Payment Settings Component
  const PaymentSettings = () => {
    const [autoSaveRecipients, setAutoSaveRecipients] = useState(true);
    const [showTestnetWarning, setShowTestnetWarning] = useState(true);

    return (
      <div
        style={{
          padding: "20px",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <h3 style={{ margin: "0 0 16px 0", color: "#1f2937" }}>
          ⚙️ Payment Settings
        </h3>
        
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={autoSaveRecipients}
              onChange={(e) => setAutoSaveRecipients(e.target.checked)}
              style={{ width: "16px", height: "16px" }}
            />
            <span style={{ color: "#374151" }}>Automatically save recipients</span>
          </label>
          <p style={{ fontSize: "12px", color: "#6b7280", margin: "4px 0 0 24px" }}>
            Save recipient addresses for quick access in future payments
          </p>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={showTestnetWarning}
              onChange={(e) => setShowTestnetWarning(e.target.checked)}
              style={{ width: "16px", height: "16px" }}
            />
            <span style={{ color: "#374151" }}>Show testnet warnings</span>
          </label>
          <p style={{ fontSize: "12px", color: "#6b7280", margin: "4px 0 0 24px" }}>
            Display warnings when using test networks
          </p>
        </div>

        <div
          style={{
            padding: "16px",
            backgroundColor: "#f0f9ff",
            border: "1px solid #bfdbfe",
            borderRadius: "8px",
            marginBottom: "16px",
          }}
        >
          <h4 style={{ margin: "0 0 8px 0", color: "#1e40af", fontSize: "14px" }}>
            🔐 Security Features
          </h4>
          <ul style={{ margin: "0", paddingLeft: "20px", color: "#1e40af", fontSize: "13px" }}>
            <li>All payments are signed with your PKP wallet</li>
            <li>Private keys never leave the Lit network</li>
            <li>Transactions are cryptographically secure</li>
            <li>No custody of funds - you maintain full control</li>
          </ul>
        </div>

        <button
          onClick={() => {
            localStorage.removeItem('payment-history');
            localStorage.removeItem('payment-recent-recipients');
            localStorage.removeItem('payment-templates');
            setStatus("Payment data cleared successfully");
          }}
          style={{
            padding: "8px 16px",
            backgroundColor: "#dc2626",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Clear Payment Data
        </button>
      </div>
    );
  };

  // Authentication and loading states
  if (!user) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Payment App - Authentication Required</h2>
        <p>Please sign in to access your PKP payment wallet.</p>
        <button
          onClick={initiateAuthentication}
          style={{
            padding: "12px 24px",
            backgroundColor: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            marginTop: "20px",
          }}
        >
          Sign In to Payment App
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
            borderTop: "4px solid #10b981",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            marginBottom: "20px",
          }}
        />
        <h2 style={{ color: "#333", marginBottom: "10px" }}>
          Initializing Payment Wallet
        </h2>
        <p style={{ color: "#666" }}>
          {isInitializingServices
            ? "Setting up your PKP payment wallet..."
            : "Loading your payment capabilities..."}
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

      {/* App Title */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "20px",
          padding: "20px",
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          borderRadius: "12px",
          color: "white",
        }}
      >
        <h1 style={{ margin: "0 0 8px 0", fontSize: "24px", fontWeight: "700" }}>
          💰 PKP Payment App
        </h1>
        <p style={{ margin: "0", fontSize: "16px", opacity: 0.9 }}>
          Secure, decentralized payments powered by Lit Protocol
        </p>
      </div>

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
      {activeTab === "send" && (
        <PaymentOperationsDashboard 
          selectedPkp={selectedPkp}
          selectedChain={selectedChain}
          onTransactionComplete={handleTransactionComplete}
        />
      )}

      {activeTab === "history" && <PaymentHistory />}

      {activeTab === "settings" && <PaymentSettings />}

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
                  🔄 Switch Payment Wallet
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#1e40af",
                    margin: "0",
                    lineHeight: "1.4",
                  }}
                >
                  Select a different PKP wallet for payments.
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