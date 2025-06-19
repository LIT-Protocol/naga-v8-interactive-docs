/**
 * PaymentManagerAppComplete Example
 * 
 * A specialized PaymentManager-focused application built on the modular architecture.
 * This demonstrates how to create a production-ready app for Lit Protocol's 
 * PaymentManager functionality with clean, app-like interfaces.
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
  PkpInfo,
  BalanceInfo,
  TransactionToast,
  TransactionResult,
  SUPPORTED_CHAINS,
  type Tab
} from '../index';
import { PaymentManagerOperationsDashboard } from '../components/payment/PaymentManagerOperationsDashboard';

import PkpSelectionForDemo from '../../common/PkpSelectionForDemo';

interface PaymentTransaction {
  id: string;
  type: 'deposit' | 'deposit-for-user' | 'withdrawal-request' | 'withdrawal-execute';
  amount: string;
  recipient?: string;
  hash: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

export default function PaymentManagerAppComplete() {
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
  const [activeTab, setActiveTab] = useState<string>("manage");
  
  // Transaction toast state
  const [transactionToasts, setTransactionToasts] = useState<TransactionToast[]>([]);
  
  // Payment history state
  const [paymentHistory, setPaymentHistory] = useState<PaymentTransaction[]>([]);

  // PaymentManager-focused tab configuration
  const tabs: Tab[] = [
    { id: "manage", label: "Manage Funds", icon: "💰" },
    { id: "history", label: "Transaction History", icon: "📊" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  // Load payment history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('payment-manager-history');
    if (savedHistory) {
      try {
        setPaymentHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse payment history:', e);
      }
    }
  }, []);

  // Save payment history to localStorage
  const savePaymentHistory = (history: PaymentTransaction[]) => {
    localStorage.setItem('payment-manager-history', JSON.stringify(history));
    setPaymentHistory(history);
  };

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
    console.log("PaymentManager transaction completed:", result);
    
    // Determine transaction type based on method or add additional context
    let transactionType: PaymentTransaction['type'] = 'deposit';
    let message = "Transaction completed successfully!";
    
    // You could enhance this by passing additional context from the operations dashboard
    if (result.method?.includes('depositForUser')) {
      transactionType = 'deposit-for-user';
      message = "Deposit for user completed successfully!";
    } else if (result.method?.includes('requestWithdraw')) {
      transactionType = 'withdrawal-request';
      message = "Withdrawal request submitted successfully!";
    } else if (result.method?.includes('withdraw')) {
      transactionType = 'withdrawal-execute';
      message = "Withdrawal executed successfully!";
    } else {
      message = "Deposit completed successfully!";
    }
    
    addTransactionToast(message, result.hash);
    
    // Save to payment history
    const newTransaction: PaymentTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: transactionType,
      amount: result.amount || 'Unknown',
      recipient: result.recipient,
      hash: result.hash,
      timestamp: new Date().toISOString(),
      status: 'completed',
    };
    
    const updatedHistory = [newTransaction, ...paymentHistory].slice(0, 50); // Keep last 50 transactions
    savePaymentHistory(updatedHistory);
    
    // Refresh balance after transaction
    setTimeout(() => {
      loadBalance();
    }, 2000);
  };

  // Load balance function (using PKP address instead of payment manager)
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

  // Clear payment history
  const clearPaymentHistory = () => {
    savePaymentHistory([]);
    addTransactionToast("Payment history cleared", "", "success");
  };

  // Export payment history
  const exportPaymentHistory = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(paymentHistory, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `payment-history-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    addTransactionToast("Payment history exported", "", "success");
  };

  // Authentication and loading states
  if (!user) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Not authenticated</h2>
        <p>Please sign in to access PaymentManager.</p>
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
            borderTop: "4px solid #10b981",
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
      {activeTab === "manage" && (
        <PaymentManagerOperationsDashboard 
          selectedPkp={selectedPkp}
          selectedChain={selectedChain}
          onTransactionComplete={handleTransactionComplete}
          services={services}
        />
      )}

      {activeTab === "history" && (
        <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ margin: 0, color: "#1f2937" }}>Transaction History</h2>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={exportPaymentHistory}
                disabled={paymentHistory.length === 0}
                style={{
                  padding: "8px 16px",
                  backgroundColor: paymentHistory.length === 0 ? "#d1d5db" : "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  cursor: paymentHistory.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                📥 Export
              </button>
              <button
                onClick={clearPaymentHistory}
                disabled={paymentHistory.length === 0}
                style={{
                  padding: "8px 16px",
                  backgroundColor: paymentHistory.length === 0 ? "#d1d5db" : "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  cursor: paymentHistory.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                🗑️ Clear
              </button>
            </div>
          </div>

          {paymentHistory.length === 0 ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                backgroundColor: "#f9fafb",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                color: "#6b7280",
              }}
            >
              <h3 style={{ margin: "0 0 10px 0" }}>📊 No Transactions Yet</h3>
              <p style={{ margin: 0 }}>
                Your PaymentManager transactions will appear here once you start using the Manage Funds tab.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {paymentHistory.map((transaction) => (
                <div
                  key={transaction.id}
                  style={{
                    padding: "16px",
                    backgroundColor: "white",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "18px" }}>
                        {transaction.type === 'deposit' && '💰'}
                        {transaction.type === 'deposit-for-user' && '👥'}
                        {transaction.type === 'withdrawal-request' && '🔄'}
                        {transaction.type === 'withdrawal-execute' && '💸'}
                      </span>
                      <div>
                        <div style={{ fontWeight: "600", color: "#1f2937" }}>
                          {transaction.type === 'deposit' && 'Deposit'}
                          {transaction.type === 'deposit-for-user' && 'Deposit for User'}
                          {transaction.type === 'withdrawal-request' && 'Withdrawal Request'}
                          {transaction.type === 'withdrawal-execute' && 'Withdrawal Executed'}
                        </div>
                        <div style={{ fontSize: "14px", color: "#6b7280" }}>
                          {new Date(transaction.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: "600", color: "#1f2937" }}>
                        {transaction.amount} ETH
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          backgroundColor: transaction.status === 'completed' ? "#dcfce7" : "#fef3c7",
                          color: transaction.status === 'completed' ? "#166534" : "#92400e",
                        }}
                      >
                        {transaction.status}
                      </div>
                    </div>
                  </div>
                  
                  {transaction.recipient && (
                    <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "8px" }}>
                      <strong>Recipient:</strong> {transaction.recipient}
                    </div>
                  )}
                  
                  <div style={{ fontSize: "12px", color: "#9ca3af", fontFamily: "monospace" }}>
                    <strong>Tx:</strong> {transaction.hash}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "settings" && (
        <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
          <h2 style={{ margin: "0 0 20px 0", color: "#1f2937" }}>PaymentManager Settings</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Data Management */}
            <div
              style={{
                padding: "20px",
                backgroundColor: "white",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
              }}
            >
              <h3 style={{ margin: "0 0 15px 0", color: "#1f2937" }}>🗂️ Data Management</h3>
              <p style={{ margin: "0 0 15px 0", color: "#6b7280", fontSize: "14px" }}>
                Manage your local transaction history and app preferences.
              </p>
              
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  onClick={exportPaymentHistory}
                  disabled={paymentHistory.length === 0}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: paymentHistory.length === 0 ? "#f3f4f6" : "#3b82f6",
                    color: paymentHistory.length === 0 ? "#9ca3af" : "white",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    cursor: paymentHistory.length === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  📥 Export History ({paymentHistory.length} transactions)
                </button>
                
                <button
                  onClick={clearPaymentHistory}
                  disabled={paymentHistory.length === 0}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: paymentHistory.length === 0 ? "#f3f4f6" : "#ef4444",
                    color: paymentHistory.length === 0 ? "#9ca3af" : "white",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    cursor: paymentHistory.length === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  🗑️ Clear History
                </button>
              </div>
            </div>

            {/* Account Information */}
            <div
              style={{
                padding: "20px",
                backgroundColor: "white",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
              }}
            >
              <h3 style={{ margin: "0 0 15px 0", color: "#1f2937" }}>👤 Account Information</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <span style={{ fontSize: "14px", color: "#6b7280" }}>Authentication Method:</span>
                  <div style={{ fontWeight: "600", color: "#1f2937" }}>{user.method}</div>
                </div>
                
                {selectedPkp && (
                  <>
                    <div>
                      <span style={{ fontSize: "14px", color: "#6b7280" }}>PKP Address:</span>
                      <div style={{ fontFamily: "monospace", fontSize: "14px", color: "#1f2937" }}>
                        {selectedPkp.ethAddress}
                      </div>
                    </div>
                    
                    <div>
                      <span style={{ fontSize: "14px", color: "#6b7280" }}>PKP Public Key:</span>
                      <div style={{ fontFamily: "monospace", fontSize: "12px", color: "#1f2937", wordBreak: "break-all" }}>
                        {selectedPkp.publicKey}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* PaymentManager Information */}
            <div
              style={{
                padding: "20px",
                backgroundColor: "white",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
              }}
            >
              <h3 style={{ margin: "0 0 15px 0", color: "#1f2937" }}>💰 PaymentManager Info</h3>
              <p style={{ margin: "0 0 15px 0", color: "#6b7280", fontSize: "14px" }}>
                Learn more about how PaymentManager works and manage your payment settings.
              </p>
              
              <div style={{ padding: "12px", backgroundColor: "#f0f9ff", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
                <div style={{ fontSize: "14px", color: "#1e40af", marginBottom: "8px" }}>
                  <strong>Key Features:</strong>
                </div>
                <ul style={{ margin: 0, paddingLeft: "20px", color: "#3b82f6", fontSize: "14px" }}>
                  <li>Secure deposits with automatic balance tracking</li>
                  <li>Withdrawal delays for enhanced security</li>
                  <li>Support for depositing on behalf of others</li>
                  <li>Real-time balance monitoring</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
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
                  Select a different PKP wallet for PaymentManager operations.
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