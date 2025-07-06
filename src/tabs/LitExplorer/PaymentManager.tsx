/**
 * PaymentManager.tsx
 *
 * Payment Manager component for Lit Explorer
 * Provides a clean interface for managing Lit Protocol payments including:
 * - Balance overview with auto-refresh
 * - Deposit funds (self and for others)
 * - Withdrawal requests and execution
 * - Security delay management
 */

import React, { useState, useEffect, useCallback } from "react";
import { useAppContext } from "../../router";
import {
  isValidEthereumAddress,
  validateEthAmount,
} from "../../utils/paymentHelpers";

interface AuthUser {
  authContext: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  pkpInfo: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  method: string;
  timestamp: number;
  authData?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  accountMethod?: string;
}

interface PKPInfo {
  tokenId: string;
  publicKey: string;
  ethAddress: string;
  pubkey?: string;
  balance?: string;
  balanceSymbol?: string;
  isLoadingBalance?: boolean;
}

interface PaymentManagerProps {
  user: AuthUser;
  services: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  selectedPkp: PKPInfo | null;
  isServicesReady: boolean;
  onBalanceChange?: () => Promise<void>;
}

interface BalanceInfo {
  totalBalance: string;
  availableBalance: string;
  raw: {
    totalBalance: bigint;
    availableBalance: bigint;
  };
}

interface WithdrawInfo {
  isPending: boolean;
  amount: string;
  timestamp: string;
  raw: {
    amount: bigint;
    timestamp: bigint;
  };
}

interface WithdrawDelayInfo {
  delaySeconds: string;
  delayHours: string;
  raw: bigint;
}

interface CanExecuteInfo {
  canExecute: boolean;
  timeRemaining: string;
  withdrawRequest: WithdrawInfo;
}

const PaymentManager: React.FC<PaymentManagerProps> = ({
  user,
  services,
  selectedPkp,
  isServicesReady,
  onBalanceChange,
}) => {
  const { showError } = useAppContext();

  // Payment Manager state
  const [paymentManager, setPaymentManager] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [balanceInfo, setBalanceInfo] = useState<BalanceInfo | null>(null);
  const [withdrawInfo, setWithdrawInfo] = useState<WithdrawInfo | null>(null);
  const [withdrawDelay, setWithdrawDelay] = useState<WithdrawDelayInfo | null>(
    null
  );
  const [canExecuteInfo, setCanExecuteInfo] = useState<CanExecuteInfo | null>(
    null
  );

  // Loading states
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isDepositingForUser, setIsDepositingForUser] = useState(false);
  const [isRequestingWithdraw, setIsRequestingWithdraw] = useState(false);
  const [isExecutingWithdraw, setIsExecutingWithdraw] = useState(false);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);

  // Form states
  const [depositAmount, setDepositAmount] = useState("0.01");
  const [depositForUserAmount, setDepositForUserAmount] = useState("0.01");
  const [depositForUserAddress, setDepositForUserAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("0.01");

  // Transaction toasts state
  const [transactionToasts, setTransactionToasts] = useState<
    Array<{
      id: string;
      message: string;
      txHash: string;
      type: "success" | "error";
      timestamp: number;
    }>
  >([]);

  // Transaction toast management
  const addTransactionToast = (
    message: string,
    txHash: string,
    type: "success" | "error" = "success"
  ) => {
    const toast = {
      id: Date.now().toString(),
      message,
      txHash,
      type,
      timestamp: Date.now(),
    };
    setTransactionToasts((prev) => [...prev, toast]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setTransactionToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 5000);
  };

  // Initialize Payment Manager
  const initializePaymentManager = useCallback(async () => {
    if (!selectedPkp || !services?.litClient || !user?.authContext) {
      return;
    }

    try {
      console.log("🔧 Initializing Payment Manager...");

      const chainConfig = services.litClient.getChainConfig().viemConfig;
      const pkpViemAccount = await services.litClient.getPkpViemAccount({
        pkpPublicKey: selectedPkp.publicKey || selectedPkp.pubkey,
        authContext: user.authContext,
        chainConfig: chainConfig,
      });

      const manager = await services.litClient.getPaymentManager({
        account: pkpViemAccount,
      });

      setPaymentManager(manager);
      console.log("✅ Payment Manager initialized successfully");

      // Load initial data with the newly created manager
      await loadBalanceWithManager(manager);
      await loadWithdrawStatusWithManager(manager);
      await loadWithdrawDelayWithManager(manager);
    } catch (error: unknown) {
      console.error("❌ Failed to initialize Payment Manager:", error);
      showError?.(
        `Failed to initialize Payment Manager: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }, [selectedPkp, services, user, showError]);

  // Load balance information with manager parameter (for initial load)
  const loadBalanceWithManager = useCallback(
    async (manager: unknown) => {
      if (!manager || !selectedPkp) return;

      try {
        setIsLoadingBalance(true);
        const balance = await (manager as any).getBalance({
          userAddress: selectedPkp.ethAddress,
        });
        setBalanceInfo(balance);
      } catch (error: unknown) {
        console.error("Failed to load balance:", error);
      } finally {
        setIsLoadingBalance(false);
      }
    },
    [selectedPkp]
  );

  // Load balance information (uses state)
  const loadBalance = useCallback(async () => {
    if (!paymentManager || !selectedPkp) return;

    try {
      setIsLoadingBalance(true);
      const balance = await paymentManager.getBalance({
        userAddress: selectedPkp.ethAddress,
      });
      setBalanceInfo(balance);
    } catch (error: unknown) {
      console.error("Failed to load balance:", error);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [paymentManager, selectedPkp]);

  // Load withdrawal status with manager parameter (for initial load)
  const loadWithdrawStatusWithManager = useCallback(
    async (manager: unknown) => {
      if (!manager || !selectedPkp) return;

      try {
        const withdrawStatus = await (manager as any).getWithdrawRequest({
          userAddress: selectedPkp.ethAddress,
        });
        setWithdrawInfo(withdrawStatus);

        if (withdrawStatus.isPending) {
          const canExecute = await (manager as any).canExecuteWithdraw({
            userAddress: selectedPkp.ethAddress,
          });
          setCanExecuteInfo(canExecute);
        }
      } catch (error: unknown) {
        console.error("Failed to load withdraw status:", error);
      }
    },
    [selectedPkp]
  );

  // Load withdrawal status (uses state)
  const loadWithdrawStatus = useCallback(async () => {
    if (!paymentManager || !selectedPkp) return;

    try {
      const withdrawStatus = await paymentManager.getWithdrawRequest({
        userAddress: selectedPkp.ethAddress,
      });
      setWithdrawInfo(withdrawStatus);

      if (withdrawStatus.isPending) {
        const canExecute = await paymentManager.canExecuteWithdraw({
          userAddress: selectedPkp.ethAddress,
        });
        setCanExecuteInfo(canExecute);
      }
    } catch (error: unknown) {
      console.error("Failed to load withdraw status:", error);
    }
  }, [paymentManager, selectedPkp]);

  // Load withdrawal delay info with manager parameter (for initial load)
  const loadWithdrawDelayWithManager = useCallback(async (manager: unknown) => {
    if (!manager) return;

    try {
      const delay = await (manager as any).getWithdrawDelay();
      setWithdrawDelay(delay);
    } catch (error: unknown) {
      console.error("Failed to load withdraw delay:", error);
    }
  }, []);

  // Load withdrawal delay info (uses state)
  const loadWithdrawDelay = useCallback(async () => {
    if (!paymentManager) return;

    try {
      const delay = await paymentManager.getWithdrawDelay();
      setWithdrawDelay(delay);
    } catch (error: unknown) {
      console.error("Failed to load withdraw delay:", error);
    }
  }, [paymentManager]);

  // Clear state when PKP changes
  useEffect(() => {
    // Clear all payment manager state when PKP changes
    setPaymentManager(null);
    setBalanceInfo(null);
    setWithdrawInfo(null);
    setWithdrawDelay(null);
    setCanExecuteInfo(null);
  }, [selectedPkp?.tokenId]);

  // Initialize when dependencies are ready
  useEffect(() => {
    if (isServicesReady && selectedPkp && user?.authContext) {
      initializePaymentManager();
    }
  }, [
    isServicesReady,
    selectedPkp,
    user?.authContext,
    initializePaymentManager,
  ]);

  // Handle deposit to own account
  const handleDeposit = async () => {
    if (!paymentManager || !depositAmount) return;

    const amountValidation = validateEthAmount(depositAmount);
    if (!amountValidation.isValid) {
      showError?.(amountValidation.error || "Invalid amount");
      return;
    }

    try {
      setIsDepositing(true);
      const result = await paymentManager.deposit({
        amountInEth: depositAmount,
      });
      addTransactionToast("Deposit successful!", result.hash);
      setDepositAmount("0.01");
      setTimeout(() => {
        loadBalance();
        onBalanceChange?.(); // Refresh PKP balance in Explorer
      }, 3000); // Refresh balance after 3 seconds
    } catch (error: unknown) {
      console.error("Deposit failed:", error);
      addTransactionToast("Deposit failed", "", "error");
      showError?.(
        `Deposit failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsDepositing(false);
    }
  };

  // Handle deposit for user
  const handleDepositForUser = async () => {
    if (!paymentManager || !depositForUserAmount || !depositForUserAddress)
      return;

    if (!isValidEthereumAddress(depositForUserAddress.trim())) {
      showError?.("Invalid Ethereum address");
      return;
    }

    const amountValidation = validateEthAmount(depositForUserAmount);
    if (!amountValidation.isValid) {
      showError?.(amountValidation.error || "Invalid amount");
      return;
    }

    try {
      setIsDepositingForUser(true);
      const result = await paymentManager.depositForUser({
        userAddress: depositForUserAddress.trim(),
        amountInEth: depositForUserAmount,
      });
      addTransactionToast("Deposit for user successful!", result.hash);
      setDepositForUserAmount("0.01");
      setDepositForUserAddress("");
    } catch (error: unknown) {
      console.error("Deposit for user failed:", error);
      addTransactionToast("Deposit for user failed", "", "error");
      showError?.(
        `Deposit for user failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsDepositingForUser(false);
    }
  };

  // Handle withdrawal request
  const handleRequestWithdraw = async () => {
    if (!paymentManager || !withdrawAmount) return;

    const amountValidation = validateEthAmount(withdrawAmount);
    if (!amountValidation.isValid) {
      showError?.(amountValidation.error || "Invalid amount");
      return;
    }

    try {
      setIsRequestingWithdraw(true);
      const result = await paymentManager.requestWithdraw({
        amountInEth: withdrawAmount,
      });
      addTransactionToast("Withdrawal request submitted!", result.hash);
      setTimeout(() => {
        loadWithdrawStatus();
        loadBalance();
      }, 3000);
    } catch (error: unknown) {
      console.error("Withdrawal request failed:", error);
      addTransactionToast("Withdrawal request failed", "", "error");
      showError?.(
        `Withdrawal request failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsRequestingWithdraw(false);
    }
  };

  // Handle withdrawal execution
  const handleExecuteWithdraw = async () => {
    if (!paymentManager || !withdrawInfo) return;

    try {
      setIsExecutingWithdraw(true);
      const result = await paymentManager.withdraw({
        amountInEth: withdrawInfo.amount,
      });
      addTransactionToast("Withdrawal executed successfully!", result.hash);
      setWithdrawInfo(null);
      setCanExecuteInfo(null);
      setTimeout(() => {
        loadBalance();
        loadWithdrawStatus();
        onBalanceChange?.(); // Refresh PKP balance in Explorer
      }, 3000);
    } catch (error: unknown) {
      console.error("Withdrawal execution failed:", error);
      addTransactionToast("Withdrawal execution failed", "", "error");
      showError?.(
        `Withdrawal execution failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsExecutingWithdraw(false);
    }
  };

  // Refresh status manually
  const handleRefreshStatus = async () => {
    setIsRefreshingStatus(true);
    try {
      await Promise.all([
        loadBalance(),
        loadWithdrawStatus(),
        loadWithdrawDelay(),
      ]);
    } finally {
      setIsRefreshingStatus(false);
    }
  };

  // Format time remaining for withdrawal
  const formatTimeRemaining = (seconds: string) => {
    const secs = parseInt(seconds);
    if (secs <= 0) return "Ready to execute";

    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const remainingSeconds = secs % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  if (!isServicesReady) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div style={{ fontSize: "16px", marginBottom: "10px" }}>
          🔄 Initializing Lit services...
        </div>
      </div>
    );
  }

  if (!selectedPkp) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div style={{ fontSize: "16px", marginBottom: "10px" }}>
          📝 Please select a PKP first
        </div>
      </div>
    );
  }

  if (!user?.authContext) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div style={{ fontSize: "16px", marginBottom: "10px" }}>
          🔑 Please generate an auth context first
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Header */}
      <div
        style={{
          marginBottom: "30px",
          padding: "20px",
          borderRadius: "12px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            margin: "0 0 8px 0",
            fontSize: "24px",
            fontWeight: "700",
          }}
        >
          💰 Payment Manager
        </h2>
        <p
          style={{
            margin: "0",
            fontSize: "14px",
            opacity: 0.9,
            lineHeight: "1.4",
          }}
        >
          Manage your Lit Protocol payments and withdrawals
        </p>
      </div>

      {/* Balance Overview */}
      <div
        style={{
          marginBottom: "30px",
          padding: "20px",
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
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
            Balance Overview
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={handleRefreshStatus}
              disabled={isRefreshingStatus}
              style={{
                padding: "8px 16px",
                backgroundColor: isRefreshingStatus ? "#9ca3af" : "#10b981",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: isRefreshingStatus ? "not-allowed" : "pointer",
              }}
            >
              {isRefreshingStatus ? "Refreshing..." : "🔄 Refresh"}
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
          }}
        >
          {/* Total Balance */}
          <div
            style={{
              padding: "20px",
              backgroundColor: "#eff6ff",
              borderRadius: "8px",
              border: "1px solid #bfdbfe",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                color: "#60a5fa",
                marginBottom: "8px",
                fontWeight: "500",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Total Balance
            </div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#1d4ed8",
                marginBottom: "4px",
              }}
            >
              {isLoadingBalance
                ? "Loading..."
                : balanceInfo
                ? `${balanceInfo.totalBalance} ETH`
                : "0.000 ETH"}
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              {balanceInfo
                ? `${balanceInfo.raw.totalBalance.toString()} Wei`
                : ""}
            </div>
          </div>

          {/* Available Balance */}
          <div
            style={{
              padding: "20px",
              backgroundColor: "#f0fdf4",
              borderRadius: "8px",
              border: "1px solid #bbf7d0",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                color: "#22c55e",
                marginBottom: "8px",
                fontWeight: "500",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Available Balance
            </div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#15803d",
                marginBottom: "4px",
              }}
            >
              {isLoadingBalance
                ? "Loading..."
                : balanceInfo
                ? `${balanceInfo.availableBalance} ETH`
                : "0.000 ETH"}
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              {balanceInfo
                ? `${balanceInfo.raw.availableBalance.toString()} Wei`
                : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Deposit and Withdraw Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        {/* Deposit Funds */}
        <div
          style={{
            padding: "20px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          }}
        >
          <h3
            style={{
              margin: "0 0 16px 0",
              fontSize: "18px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            💰 Deposit Funds
          </h3>

          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                fontSize: "14px",
                marginBottom: "8px",
                color: "#374151",
              }}
            >
              Quick amounts:
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {["0.001", "0.01", "0.1", "1.0"].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setDepositAmount(amount)}
                  style={{
                    padding: "6px 12px",
                    backgroundColor:
                      depositAmount === amount ? "#3b82f6" : "#f3f4f6",
                    color: depositAmount === amount ? "white" : "#374151",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  {amount} ETH
                </button>
              ))}
            </div>
          </div>

          <input
            type="number"
            step="0.001"
            min="0"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="Amount in ETH"
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              marginBottom: "16px",
            }}
          />

          <button
            onClick={handleDeposit}
            disabled={isDepositing || !paymentManager || !depositAmount}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor:
                isDepositing || !paymentManager ? "#9ca3af" : "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor:
                isDepositing || !paymentManager ? "not-allowed" : "pointer",
            }}
          >
            {isDepositing ? "Depositing..." : "💰 Deposit to My Account"}
          </button>
        </div>

        {/* Withdraw Funds */}
        <div
          style={{
            padding: "20px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          }}
        >
          <h3
            style={{
              margin: "0 0 16px 0",
              fontSize: "18px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            💸 Withdraw Funds
          </h3>

          {withdrawDelay && (
            <div
              style={{
                padding: "12px",
                backgroundColor: "#fef3c7",
                border: "1px solid #f59e0b",
                borderRadius: "6px",
                fontSize: "12px",
                marginBottom: "16px",
              }}
            >
              <strong>Security Delay:</strong> {withdrawDelay.delayHours} hours
              ({withdrawDelay.delaySeconds} seconds)
            </div>
          )}

          {withdrawInfo?.isPending ? (
            <div
              style={{
                padding: "16px",
                backgroundColor: "#fef3c7",
                borderRadius: "8px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <span style={{ fontSize: "16px" }}>⏱️</span>
                <strong>Pending Withdrawal</strong>
              </div>
              <div style={{ fontSize: "14px", marginBottom: "4px" }}>
                <strong>Amount:</strong> {withdrawInfo.amount} ETH
              </div>
              <div style={{ fontSize: "14px", marginBottom: "12px" }}>
                <strong>Requested:</strong>{" "}
                {new Date(
                  Number(withdrawInfo.timestamp) * 1000
                ).toLocaleString()}
              </div>

              {canExecuteInfo?.canExecute ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <span style={{ color: "#16a34a", fontWeight: "500" }}>
                    ✅ Ready to execute!
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <span style={{ color: "#dc2626" }}>
                    ⏰ Time remaining:{" "}
                    {canExecuteInfo
                      ? formatTimeRemaining(canExecuteInfo.timeRemaining)
                      : "Loading..."}
                  </span>
                </div>
              )}

              <button
                onClick={handleExecuteWithdraw}
                disabled={isExecutingWithdraw || !canExecuteInfo?.canExecute}
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor:
                    isExecutingWithdraw || !canExecuteInfo?.canExecute
                      ? "#9ca3af"
                      : "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor:
                    isExecutingWithdraw || !canExecuteInfo?.canExecute
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {isExecutingWithdraw
                  ? "Executing..."
                  : `💸 Execute Withdrawal (${withdrawInfo.amount} ETH)`}
              </button>

              <button
                onClick={handleRefreshStatus}
                disabled={isRefreshingStatus}
                style={{
                  width: "100%",
                  padding: "8px",
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "12px",
                  marginTop: "8px",
                  cursor: isRefreshingStatus ? "not-allowed" : "pointer",
                }}
              >
                🔄 Refresh Status
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    fontSize: "14px",
                    marginBottom: "8px",
                    color: "#374151",
                  }}
                >
                  Quick amounts:
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {["0.001", "0.01", "0.1", "1.0"].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setWithdrawAmount(amount)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor:
                          withdrawAmount === amount ? "#3b82f6" : "#f3f4f6",
                        color: withdrawAmount === amount ? "white" : "#374151",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      {amount} ETH
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="number"
                step="0.001"
                min="0"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Amount in ETH"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  marginBottom: "16px",
                }}
              />

              <button
                onClick={handleRequestWithdraw}
                disabled={
                  isRequestingWithdraw || !paymentManager || !withdrawAmount
                }
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor:
                    isRequestingWithdraw || !paymentManager
                      ? "#9ca3af"
                      : "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor:
                    isRequestingWithdraw || !paymentManager
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {isRequestingWithdraw
                  ? "Requesting..."
                  : "💸 Request Withdrawal"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Deposit for Others */}
      <div
        style={{
          padding: "20px",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          marginBottom: "30px",
        }}
      >
        <h3
          style={{
            margin: "0 0 16px 0",
            fontSize: "18px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          👥 Deposit for Others
        </h3>

        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              fontSize: "14px",
              marginBottom: "8px",
              color: "#374151",
            }}
          >
            Quick amounts:
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["0.001", "0.01", "0.1", "1.0"].map((amount) => (
              <button
                key={amount}
                onClick={() => setDepositForUserAmount(amount)}
                style={{
                  padding: "6px 12px",
                  backgroundColor:
                    depositForUserAmount === amount ? "#3b82f6" : "#f3f4f6",
                  color: depositForUserAmount === amount ? "white" : "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                {amount} ETH
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <input
            type="text"
            value={depositForUserAddress}
            onChange={(e) => setDepositForUserAddress(e.target.value)}
            placeholder="Recipient address (0x...)"
            style={{
              padding: "12px",
              border: `1px solid ${
                depositForUserAddress &&
                !isValidEthereumAddress(depositForUserAddress.trim())
                  ? "#dc2626"
                  : "#d1d5db"
              }`,
              borderRadius: "8px",
              fontSize: "14px",
            }}
          />
          <input
            type="number"
            step="0.001"
            min="0"
            value={depositForUserAmount}
            onChange={(e) => setDepositForUserAmount(e.target.value)}
            placeholder="Amount in ETH"
            style={{
              padding: "12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          />
        </div>

        <button
          onClick={handleDepositForUser}
          disabled={
            isDepositingForUser ||
            !paymentManager ||
            !depositForUserAmount ||
            !depositForUserAddress ||
            !isValidEthereumAddress(depositForUserAddress.trim())
          }
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor:
              isDepositingForUser ||
              !paymentManager ||
              (depositForUserAddress &&
                !isValidEthereumAddress(depositForUserAddress.trim()))
                ? "#9ca3af"
                : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            cursor:
              isDepositingForUser ||
              !paymentManager ||
              (depositForUserAddress &&
                !isValidEthereumAddress(depositForUserAddress.trim()))
                ? "not-allowed"
                : "pointer",
          }}
        >
          {isDepositingForUser
            ? "Depositing..."
            : depositForUserAddress &&
              !isValidEthereumAddress(depositForUserAddress.trim())
            ? "❌ Invalid Address"
            : "👥 Deposit for User"}
        </button>
      </div>

      {/* Transaction Toasts */}
      {transactionToasts.length > 0 && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {transactionToasts.map((toast) => (
            <div
              key={toast.id}
              style={{
                padding: "12px 16px",
                backgroundColor:
                  toast.type === "success" ? "#10b981" : "#ef4444",
                color: "white",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                maxWidth: "400px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                animation: "slideIn 0.3s ease-out",
              }}
            >
              <div>{toast.message}</div>
              {toast.txHash && (
                <div
                  style={{ fontSize: "12px", opacity: 0.9, marginTop: "4px" }}
                >
                  TX: {toast.txHash.slice(0, 10)}...{toast.txHash.slice(-8)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default PaymentManager;
