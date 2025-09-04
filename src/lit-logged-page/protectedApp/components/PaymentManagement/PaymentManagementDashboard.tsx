import React, { useState, useEffect, useCallback } from "react";
import { PkpInfo, TransactionResult } from "../../types";
import AccountMethodSelector from "./AccountMethodSelector";
import { useOptionalLitAuth } from "../../../../lit-login-modal/LitAuthProvider";

interface PaymentManagementDashboardProps {
  selectedPkp: PkpInfo | null;
  selectedChain: string;
  disabled?: boolean;
  onTransactionComplete?: (result: TransactionResult) => void;
  services?: any;
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
  amount: string;
  timestamp: string;
  isPending: boolean;
}

interface CanExecuteInfo {
  canExecute: boolean;
  timeRemaining: string;
}

export const PaymentManagementDashboard: React.FC<
  PaymentManagementDashboardProps
> = ({
  selectedPkp,
  selectedChain,
  disabled = false,
  onTransactionComplete,
  services,
}) => {
  // const { data: walletClient } = useWalletClient();
  const optionalAuth = useOptionalLitAuth();
  const user = optionalAuth?.user;
  const litServices = optionalAuth?.services;

  // Account state
  const [account, setAccount] = useState<any>(null);
  const [accountSource, setAccountSource] = useState<"pkp" | "eoa">("pkp");

  // PaymentManager state
  const [paymentManager, setPaymentManager] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Balance state
  const [balanceInfo, setBalanceInfo] = useState<BalanceInfo | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [autoRefreshBalance, setAutoRefreshBalance] = useState(true);

  // Deposit state
  const [depositAmount, setDepositAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositForUserAddress, setDepositForUserAddress] = useState("");
  const [depositForUserAmount, setDepositForUserAmount] = useState("");
  const [isDepositingForUser, setIsDepositingForUser] = useState(false);

  // Withdrawal state
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isRequestingWithdraw, setIsRequestingWithdraw] = useState(false);
  const [withdrawInfo, setWithdrawInfo] = useState<WithdrawInfo | null>(null);
  const [canExecuteInfo, setCanExecuteInfo] = useState<CanExecuteInfo | null>(
    null
  );
  const [isCheckingWithdraw, setIsCheckingWithdraw] = useState(false);
  const [isExecutingWithdraw, setIsExecutingWithdraw] = useState(false);
  const [withdrawDelay, setWithdrawDelay] = useState<{
    delaySeconds: string;
    delayHours: string;
    raw: bigint;
  } | null>(null);

  // Success feedback
  const [successActions, setSuccessActions] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>("");

  // Success feedback helper
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

  // Error handling
  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(""), 5000);
  };

  const clearError = () => setError("");

  // Create a PKP viem account when PKP is selected as the source
  useEffect(() => {
    const hasAuthContext = Boolean(user?.authContext);
    const pkpPublicKey = selectedPkp?.publicKey || user?.pkpInfo?.pubkey;
    const targetServices = services || litServices;
    const canUsePkp = Boolean(
      targetServices?.litClient && hasAuthContext && pkpPublicKey
    );

    if (accountSource !== "pkp") {
      return;
    }

    // Reset current account when switching to PKP
    setAccount(null);

    if (!canUsePkp) {
      return;
    }

    let cancelled = false;
    const derivePkpAccount = async () => {
      try {
        clearError();
        const chainConfig =
          targetServices!.litClient.getChainConfig().viemConfig;
        const pkpViemAccount =
          await targetServices!.litClient.getPkpViemAccount({
            pkpPublicKey,
            authContext: user!.authContext,
            chainConfig,
          });
        if (!cancelled) {
          setAccount(pkpViemAccount);
        }
      } catch (e: any) {
        console.error("Failed to create PKP viem account:", e);
        if (!cancelled) {
          showError(`Failed to create PKP viem account: ${e?.message || e}`);
          setAccount(null);
        }
      }
    };
    derivePkpAccount();
    return () => {
      cancelled = true;
    };
  }, [accountSource, services, litServices, user, selectedPkp]);

  // Initialize PaymentManager when account is available
  const initializePaymentManager = useCallback(async () => {
    const accountAddress = account?.address || account?.account?.address;
    if (!account || !accountAddress || !services?.litClient) {
      setPaymentManager(null);
      return;
    }

    try {
      clearError();
      setLoading(true);

      const pm = await services.litClient.getPaymentManager({ account });
      setPaymentManager(pm);

      // Load withdrawal delay
      try {
        const delay = await pm.getWithdrawDelay();
        setWithdrawDelay(delay);
      } catch (e) {
        console.error("Failed to get withdrawal delay:", e);
      }
    } catch (error: any) {
      console.error("Failed to initialize PaymentManager:", error);
      showError(`Failed to initialize PaymentManager: ${error.message}`);
      setPaymentManager(null);
    } finally {
      setLoading(false);
    }
  }, [account, services?.litClient]);

  // Initialize on mount and when dependencies change
  useEffect(() => {
    initializePaymentManager();
  }, [initializePaymentManager]);

  // Load balance
  const loadBalance = useCallback(async () => {
    const accountAddress = account?.address || account?.account?.address;
    if (!paymentManager || !accountAddress) return;

    try {
      setIsLoadingBalance(true);
      const balance = await paymentManager.getBalance({
        userAddress: accountAddress,
      });
      setBalanceInfo(balance);
    } catch (error: any) {
      console.error("Balance check failed:", error);
      showError(`Balance check failed: ${error.message}`);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [paymentManager, account]);

  // Auto-refresh balance
  useEffect(() => {
    if (autoRefreshBalance && paymentManager && account) {
      loadBalance();
      const interval = setInterval(loadBalance, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefreshBalance, paymentManager, account, loadBalance]);

  // Load withdrawal status
  const loadWithdrawalStatus = useCallback(async () => {
    const accountAddress = account?.address || account?.account?.address;
    if (!paymentManager || !accountAddress) return;

    try {
      setIsCheckingWithdraw(true);
      const withdraw = await paymentManager.getWithdrawRequest({
        userAddress: accountAddress,
      });
      setWithdrawInfo(withdraw);

      if (withdraw.isPending) {
        const canExecute = await paymentManager.canExecuteWithdraw({
          userAddress: accountAddress,
        });
        setCanExecuteInfo(canExecute);
      } else {
        setCanExecuteInfo(null);
      }
    } catch (error: any) {
      console.error("Withdrawal status check failed:", error);
      showError(`Withdrawal status check failed: ${error.message}`);
    } finally {
      setIsCheckingWithdraw(false);
    }
  }, [paymentManager, account]);

  // Load withdrawal status when PaymentManager is ready
  useEffect(() => {
    if (paymentManager && account) {
      loadWithdrawalStatus();
    }
  }, [paymentManager, account, loadWithdrawalStatus]);

  // Format time remaining
  const formatTimeRemaining = (seconds: string) => {
    const secs = parseInt(seconds);
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

  // Deposit handlers
  const handleDeposit = async () => {
    if (!paymentManager || !depositAmount) return;

    try {
      setIsDepositing(true);
      clearError();

      const result = await paymentManager.deposit({
        amountInEth: depositAmount,
      });
      showSuccess("deposit");
      onTransactionComplete?.(result);
      setDepositAmount("");

      // Refresh balance after deposit
      setTimeout(loadBalance, 2000);
    } catch (error: any) {
      console.error("Deposit failed:", error);
      showError(`Deposit failed: ${error.message}`);
    } finally {
      setIsDepositing(false);
    }
  };

  const handleDepositForUser = async () => {
    if (!paymentManager || !depositForUserAmount || !depositForUserAddress)
      return;

    try {
      setIsDepositingForUser(true);
      clearError();

      const result = await paymentManager.depositForUser({
        userAddress: depositForUserAddress,
        amountInEth: depositForUserAmount,
      });
      showSuccess("deposit-for-user");
      onTransactionComplete?.(result);
      setDepositForUserAmount("");
      setDepositForUserAddress("");
    } catch (error: any) {
      console.error("Deposit for user failed:", error);
      showError(`Deposit for user failed: ${error.message}`);
    } finally {
      setIsDepositingForUser(false);
    }
  };

  // Withdrawal handlers
  const handleRequestWithdraw = async () => {
    if (!paymentManager || !withdrawAmount) return;

    try {
      setIsRequestingWithdraw(true);
      clearError();

      const result = await paymentManager.requestWithdraw({
        amountInEth: withdrawAmount,
      });
      showSuccess("request-withdraw");
      onTransactionComplete?.(result);
      setWithdrawAmount("");

      // Refresh withdrawal status
      setTimeout(loadWithdrawalStatus, 2000);
    } catch (error: any) {
      console.error("Withdrawal request failed:", error);
      showError(`Withdrawal request failed: ${error.message}`);
    } finally {
      setIsRequestingWithdraw(false);
    }
  };

  const handleExecuteWithdraw = async () => {
    if (!paymentManager || !withdrawInfo) return;

    try {
      setIsExecutingWithdraw(true);
      clearError();

      const result = await paymentManager.withdraw({
        amountInEth: withdrawInfo.amount,
      });
      showSuccess("execute-withdraw");
      onTransactionComplete?.(result);

      // Clear withdrawal info and refresh balance
      setWithdrawInfo(null);
      setCanExecuteInfo(null);
      setTimeout(loadBalance, 2000);
    } catch (error: any) {
      console.error("Withdrawal execution failed:", error);
      showError(`Withdrawal execution failed: ${error.message}`);
    } finally {
      setIsExecutingWithdraw(false);
    }
  };

  // Quick amount buttons
  const quickAmounts = ["0.001", "0.01", "0.1", "1.0"];

  return (
    <>
      {/* Error Display */}
      {error && (
        <div className="mb-5 px-4 py-3 bg-red-100 border border-red-200 rounded-lg text-red-800 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Account Setup */}
      <div className="mb-8 p-5 bg-white rounded-xl border border-gray-200">
        <h3 style={{ margin: "0 0 15px 0", color: "#1f2937" }}>
          Select a Payment Manager Account
        </h3>

        {/* Account source selector: PKP (default) or EOA */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <button
            onClick={() => {
              setAccountSource("pkp");
            }}
            disabled={disabled}
            style={{
              padding: "8px 15px",
              backgroundColor: accountSource === "pkp" ? "#B7410D" : "#f0f0f0",
              color: accountSource === "pkp" ? "white" : "#333",
              border: "1px solid #ddd",
              borderRadius: "6px",
              cursor: disabled ? "not-allowed" : "pointer",
              fontSize: "14px",
              opacity: disabled ? 0.6 : 1,
            }}
          >
            Current PKP Wallet
          </button>
          <button
            onClick={() => {
              setAccountSource("eoa");
              setAccount(null);
            }}
            disabled={disabled}
            style={{
              padding: "8px 15px",
              backgroundColor: accountSource === "eoa" ? "#B7410D" : "#f0f0f0",
              color: accountSource === "eoa" ? "white" : "#333",
              border: "1px solid #ddd",
              borderRadius: "6px",
              cursor: disabled ? "not-allowed" : "pointer",
              fontSize: "14px",
              opacity: disabled ? 0.6 : 1,
            }}
          >
            Externally Owned Account (EOA)
          </button>
        </div>

        {/* EOA account manual selection */}
        {accountSource === "eoa" && (
          <AccountMethodSelector
            onAccountCreated={setAccount}
            onMethodChange={() => {}}
            setStatus={() => {}}
            showError={showError}
            showSuccess={() => {}}
            successActionIds={{
              createAccount: "pm-create-account",
              getWalletAccount: "pm-get-wallet-account",
            }}
            successActions={successActions}
            disabled={disabled}
          />
        )}

        {account && (
          <div
            style={{
              marginTop: "15px",
              padding: "12px",
              backgroundColor: "#f0f9ff",
              borderRadius: "8px",
              border: "1px solid #bfdbfe",
            }}
          >
            <div style={{ fontSize: "14px", color: "#1e40af" }}>
              <strong>Connected Account:</strong>{" "}
              {account.address || account.account?.address}
            </div>
            <div
              style={{ fontSize: "12px", color: "#3b82f6", marginTop: "4px" }}
            >
              PaymentManager:{" "}
              {paymentManager
                ? "✅ Ready"
                : loading
                ? "⏳ Loading..."
                : "❌ Failed to load"}
            </div>
          </div>
        )}
      </div>

      {/* Balance Section */}
      {paymentManager && (
        <div className="mb-8 p-5 bg-white rounded-xl border border-gray-200">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px",
            }}
          >
            <h3 style={{ margin: 0, color: "#1f2937" }}>
              Lit Ledger Balance Overview
            </h3>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <label style={{ fontSize: "14px", color: "#6b7280" }}>
                <input
                  type="checkbox"
                  checked={autoRefreshBalance}
                  onChange={(e) => setAutoRefreshBalance(e.target.checked)}
                  style={{ marginRight: "5px" }}
                />
                Auto-refresh
              </label>
              <button
                onClick={loadBalance}
                disabled={isLoadingBalance}
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: isLoadingBalance ? "not-allowed" : "pointer",
                }}
              >
                {isLoadingBalance ? "🔄" : "🔄 Refresh"}
              </button>
            </div>
          </div>

          {balanceInfo ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "20px",
              }}
            >
              <div
                style={{
                  padding: "15px",
                  backgroundColor: "#f0f9ff",
                  borderRadius: "8px",
                  border: "1px solid #bfdbfe",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "#3b82f6",
                    marginBottom: "5px",
                  }}
                >
                  TOTAL BALANCE
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#1e40af",
                  }}
                >
                  {balanceInfo.totalBalance} ETH
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#6b7280",
                    fontFamily: "monospace",
                  }}
                >
                  {balanceInfo.raw.totalBalance.toString()} Wei
                </div>
              </div>

              <div
                style={{
                  padding: "15px",
                  backgroundColor: "#f0fdf4",
                  borderRadius: "8px",
                  border: "1px solid #bbf7d0",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "#16a34a",
                    marginBottom: "5px",
                  }}
                >
                  AVAILABLE BALANCE
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#15803d",
                  }}
                >
                  {balanceInfo.availableBalance} ETH
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#6b7280",
                    fontFamily: "monospace",
                  }}
                >
                  {balanceInfo.raw.availableBalance.toString()} Wei
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}
            >
              Click refresh to load your balance
            </div>
          )}
        </div>
      )}

      {/* Operations Grid */}
      {paymentManager && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deposit Section */}
          <div className="p-5 bg-white rounded-xl border border-gray-200">
            <h3 style={{ margin: "0 0 15px 0", color: "#1f2937" }}>
              💰 Deposit Funds
            </h3>

            {/* Quick amounts */}
            <div style={{ marginBottom: "15px" }}>
              <div
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  marginBottom: "8px",
                }}
              >
                Quick amounts:
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setDepositAmount(amount)}
                    style={{
                      padding: "6px 12px",
                      fontSize: "12px",
                      backgroundColor:
                        depositAmount === amount ? "#10b981" : "#f3f4f6",
                      color: depositAmount === amount ? "white" : "#374151",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    {amount} ETH
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <input
                type="number"
                step="0.001"
                min="0"
                placeholder="Amount in ETH"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                disabled={!account}
                className={`w-full px-3 py-2 rounded-lg text-sm border ${
                  !account ? "bg-gray-50" : "bg-white"
                } border-gray-300 text-black`}
              />
            </div>

            <button
              onClick={handleDeposit}
              disabled={
                isDepositing || !paymentManager || !depositAmount || !account
              }
              className={`w-full p-3 rounded-lg text-sm font-medium border-1 border-gray-200 ${
                !account || !paymentManager || isDepositing
                  ? "bg-gray-400 cursor-not-allowed text-white"
                  : "bg-[#B7410D] text-white cursor-pointer"
              }`}
            >
              {isDepositing
                ? "Processing..."
                : successActions.has("deposit")
                ? "✅ Deposited Successfully"
                : "💰 Deposit to My Account"}
            </button>

            {/* Deposit for others */}
            <div
              style={{
                marginTop: "20px",
                paddingTop: "20px",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <h4
                style={{
                  margin: "0 0 10px 0",
                  fontSize: "16px",
                  color: "#374151",
                }}
              >
                👥 Deposit for Others
              </h4>

              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Recipient address (0x...)"
                  value={depositForUserAddress}
                  onChange={(e) => setDepositForUserAddress(e.target.value)}
                  disabled={!account}
                  className={`w-full px-3 py-2 rounded-lg text-sm border ${
                    !account ? "bg-gray-50" : "bg-white"
                  } border-gray-300 text-black`}
                />
              </div>

              <div className="mb-3">
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="Amount in ETH"
                  value={depositForUserAmount}
                  onChange={(e) => setDepositForUserAmount(e.target.value)}
                  disabled={!account}
                  className={`w-full px-3 py-2 rounded-lg text-sm border ${
                    !account ? "bg-gray-50" : "bg-white"
                  } border-gray-300 text-black`}
                />
              </div>

              <button
                onClick={handleDepositForUser}
                disabled={
                  isDepositingForUser ||
                  !paymentManager ||
                  !depositForUserAmount ||
                  !depositForUserAddress ||
                  !account
                }
                className={`w-full p-2.5 rounded-lg text-sm font-medium border-1 border-gray-200 ${
                  !account || !paymentManager || isDepositingForUser
                    ? "bg-gray-400 cursor-not-allowed text-white"
                    : "bg-[#B7410D] text-white cursor-pointer"
                }`}
              >
                {isDepositingForUser
                  ? "Processing..."
                  : successActions.has("deposit-for-user")
                  ? "✅ Deposited for User"
                  : "👥 Deposit for User"}
              </button>
            </div>
          </div>

          {/* Withdrawal Section */}
          <div className="p-5 bg-white rounded-xl border border-gray-200">
            <h3 style={{ margin: "0 0 15px 0", color: "#1f2937" }}>
              🔄 Withdraw Funds
            </h3>

            {withdrawDelay && (
              <div
                style={{
                  marginBottom: "15px",
                  padding: "10px",
                  backgroundColor: "#fffbeb",
                  borderRadius: "6px",
                  border: "1px solid #fde68a",
                }}
              >
                <div style={{ fontSize: "12px", color: "#92400e" }}>
                  <strong>Security Delay:</strong> {withdrawDelay.delayHours}{" "}
                  hours ({withdrawDelay.delaySeconds} seconds)
                </div>
              </div>
            )}

            {/* Withdrawal Status */}
            {withdrawInfo && withdrawInfo.isPending && (
              <div
                style={{
                  marginBottom: "15px",
                  padding: "12px",
                  backgroundColor: "#fef3c7",
                  borderRadius: "8px",
                  border: "1px solid #fbbf24",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    color: "#92400e",
                    marginBottom: "8px",
                  }}
                >
                  <strong>⏳ Pending Withdrawal</strong>
                </div>
                <div style={{ fontSize: "13px", color: "#78350f" }}>
                  Amount: <strong>{withdrawInfo.amount} ETH</strong>
                </div>
                <div style={{ fontSize: "13px", color: "#78350f" }}>
                  Requested:{" "}
                  {new Date(
                    Number(withdrawInfo.timestamp) * 1000
                  ).toLocaleString()}
                </div>
                {canExecuteInfo && (
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#78350f",
                      marginTop: "5px",
                    }}
                  >
                    {canExecuteInfo.canExecute ? (
                      <span style={{ color: "#059669" }}>
                        ✅ Ready to execute!
                      </span>
                    ) : (
                      <span>
                        ⏱️ Time remaining:{" "}
                        {formatTimeRemaining(canExecuteInfo.timeRemaining)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Request Withdrawal */}
            {(!withdrawInfo || !withdrawInfo.isPending) && (
              <>
                <div className="mb-4">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="Amount in ETH"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    disabled={!account}
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${
                      !account ? "bg-gray-50" : "bg-white"
                    } border-gray-300 text-black`}
                  />
                </div>

                <button
                  onClick={handleRequestWithdraw}
                  disabled={
                    isRequestingWithdraw ||
                    !paymentManager ||
                    !withdrawAmount ||
                    !account
                  }
                  className={`w-full p-3 rounded-lg text-sm font-medium border-1 border-gray-200 ${
                    !account || !paymentManager || isRequestingWithdraw
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : "bg-[#B7410D] text-white cursor-pointer"
                  }`}
                >
                  {isRequestingWithdraw
                    ? "Processing..."
                    : successActions.has("request-withdraw")
                    ? "✅ Withdrawal Requested"
                    : "🔄 Request Withdrawal"}
                </button>
              </>
            )}

            {/* Execute Withdrawal */}
            {withdrawInfo &&
              withdrawInfo.isPending &&
              canExecuteInfo?.canExecute && (
                <button
                  onClick={handleExecuteWithdraw}
                  disabled={isExecutingWithdraw}
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: isExecutingWithdraw
                      ? "#d1d5db"
                      : "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: isExecutingWithdraw ? "not-allowed" : "pointer",
                    fontWeight: "500",
                    fontSize: "14px",
                    marginTop: "10px",
                  }}
                >
                  {isExecutingWithdraw
                    ? "Executing..."
                    : successActions.has("execute-withdraw")
                    ? "✅ Withdrawal Executed"
                    : `💸 Execute Withdrawal (${withdrawInfo.amount} ETH)`}
                </button>
              )}

            {/* Refresh Status Button */}
            <button
              onClick={loadWithdrawalStatus}
              disabled={isCheckingWithdraw}
              style={{
                width: "100%",
                padding: "8px",
                backgroundColor: "transparent",
                color: "#6b7280",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                cursor: isCheckingWithdraw ? "not-allowed" : "pointer",
                fontSize: "12px",
                marginTop: "10px",
              }}
            >
              {isCheckingWithdraw ? "🔄 Checking..." : "🔄 Refresh Status"}
            </button>
          </div>
        </div>
      )}

      {/* No PaymentManager state */}
      {!paymentManager && account && !loading && (
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            backgroundColor: "#fee2e2",
            borderRadius: "12px",
            border: "1px solid #fecaca",
            color: "#991b1b",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0" }}>
            ⚠️ PaymentManager Not Available
          </h3>
          <p style={{ margin: 0 }}>
            Unable to initialize PaymentManager. Please check your account setup
            and try again.
          </p>
        </div>
      )}

      {/* No Account state */}
      {!account && (
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            backgroundColor: "#f3f4f6",
            borderRadius: "12px",
            border: "1px solid #d1d5db",
            color: "#374151",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0" }}>🔐 Account Required</h3>
          <p style={{ margin: 0 }}>
            Please create or connect an account above to access PaymentManager
            features.
          </p>
        </div>
      )}
    </>
  );
};
