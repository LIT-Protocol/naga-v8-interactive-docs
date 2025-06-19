/**
 * PaymentManagerComponents.tsx
 *
 * Reusable components for the PaymentManager functionality.
 * Includes balance display, transaction status, withdrawal timing, and payment forms.
 */

import React from "react";

// Type definitions
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

// Balance Display Component
interface BalanceDisplayProps {
  balanceInfo: BalanceInfo | null;
  loading?: boolean;
}

export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ balanceInfo, loading }) => {
  if (loading) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px" }}>
        <div>
          <strong>Total Balance:</strong>
          <div style={{ fontSize: "16px", color: "#6c757d" }}>Loading...</div>
        </div>
        <div>
          <strong>Available Balance:</strong>
          <div style={{ fontSize: "16px", color: "#6c757d" }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!balanceInfo) {
    return (
      <div style={{ color: "#6c757d", fontStyle: "italic" }}>
        Balance information not available
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px" }}>
      <div>
        <strong>Total Balance:</strong>
        <div style={{ fontSize: "16px", fontWeight: "bold", color: "#007bff" }}>
          {balanceInfo.totalBalance} ETH
        </div>
        <div style={{ fontSize: "12px", color: "#6c757d", fontFamily: "monospace" }}>
          {balanceInfo.raw.totalBalance.toString()} Wei
        </div>
      </div>
      
      <div>
        <strong>Available Balance:</strong>
        <div style={{ fontSize: "16px", fontWeight: "bold", color: "#28a745" }}>
          {balanceInfo.availableBalance} ETH
        </div>
        <div style={{ fontSize: "12px", color: "#6c757d", fontFamily: "monospace" }}>
          {balanceInfo.raw.availableBalance.toString()} Wei
        </div>
      </div>
    </div>
  );
};

// Transaction Status Component
interface TransactionStatusProps {
  txHash: string | null;
  label?: string;
}

export const TransactionStatus: React.FC<TransactionStatusProps> = ({ txHash, label = "Last Transaction" }) => {
  if (!txHash) return null;

  return (
    <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#d1ecf1", borderRadius: "4px", border: "1px solid #bee5eb" }}>
      <strong>🔗 {label}:</strong>
      <div style={{ fontFamily: "monospace", fontSize: "12px", wordBreak: "break-all" }}>
        {txHash}
      </div>
    </div>
  );
};

// Withdrawal Status Component
interface WithdrawalStatusProps {
  withdrawInfo: WithdrawInfo | null;
  canExecuteInfo: CanExecuteInfo | null;
  onExecuteWithdraw: () => void;
  isExecutingWithdraw: boolean;
}

export const WithdrawalStatus: React.FC<WithdrawalStatusProps> = ({
  withdrawInfo,
  canExecuteInfo,
  onExecuteWithdraw,
  isExecutingWithdraw
}) => {
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

  if (!withdrawInfo?.isPending) {
    return null;
  }

  return (
    <div style={{ 
      marginBottom: "30px", 
      padding: "15px", 
      backgroundColor: "#fff3cd", 
      borderRadius: "8px", 
      border: "1px solid #ffeaa7" 
    }}>
      <h3 style={{ margin: "0 0 10px 0" }}>🕐 Pending Withdrawal</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px" }}>
        <div>
          <strong>Amount:</strong> {withdrawInfo.amount} ETH
        </div>
        <div>
          <strong>Requested:</strong> {new Date(Number(withdrawInfo.timestamp) * 1000).toLocaleString()}
        </div>
        {canExecuteInfo && (
          <>
            <div>
              <strong>Status:</strong> 
              <span style={{ color: canExecuteInfo.canExecute ? "green" : "orange", marginLeft: "5px" }}>
                {canExecuteInfo.canExecute ? "✅ Ready to execute" : `⏱️ ${formatTimeRemaining(canExecuteInfo.timeRemaining)} remaining`}
              </span>
            </div>
            {canExecuteInfo.canExecute && (
              <div>
                <button
                  onClick={onExecuteWithdraw}
                  disabled={isExecutingWithdraw}
                  style={{
                    padding: "8px 16px",
                    border: "1px solid #28a745",
                    backgroundColor: "#28a745",
                    color: "white",
                    borderRadius: "4px",
                    cursor: isExecutingWithdraw ? "not-allowed" : "pointer"
                  }}
                >
                  {isExecutingWithdraw ? "Executing..." : "💸 Execute Withdrawal"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Deposit Form Component
interface DepositFormProps {
  amount: string;
  onAmountChange: (amount: string) => void;
  onDeposit: () => void;
  isDepositing: boolean;
  disabled?: boolean;
}

export const DepositForm: React.FC<DepositFormProps> = ({
  amount,
  onAmountChange,
  onDeposit,
  isDepositing,
  disabled
}) => {
  return (
    <div style={{ padding: "15px", border: "1px solid #ddd", borderRadius: "8px" }}>
      <h4>💰 Deposit Funds</h4>
      <div style={{ marginBottom: "10px" }}>
        <label style={{ display: "block", marginBottom: "5px" }}>Amount (ETH):</label>
        <input
          type="number"
          step="0.001"
          min="0"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          disabled={disabled}
          style={{ 
            width: "100%", 
            padding: "8px", 
            border: "1px solid #ccc", 
            borderRadius: "4px",
            backgroundColor: disabled ? "#f8f9fa" : "white"
          }}
        />
      </div>
      <button
        onClick={onDeposit}
        disabled={isDepositing || disabled || !amount}
        style={{
          width: "100%",
          padding: "10px",
          border: "1px solid #007bff",
          backgroundColor: disabled ? "#6c757d" : "#007bff",
          color: "white",
          borderRadius: "4px",
          cursor: isDepositing || disabled ? "not-allowed" : "pointer"
        }}
      >
        {isDepositing ? "Depositing..." : "💰 Deposit"}
      </button>
    </div>
  );
};

// Deposit for User Form Component
interface DepositForUserFormProps {
  userAddress: string;
  amount: string;
  onUserAddressChange: (address: string) => void;
  onAmountChange: (amount: string) => void;
  onDeposit: () => void;
  isDepositing: boolean;
  disabled?: boolean;
}

export const DepositForUserForm: React.FC<DepositForUserFormProps> = ({
  userAddress,
  amount,
  onUserAddressChange,
  onAmountChange,
  onDeposit,
  isDepositing,
  disabled
}) => {
  return (
    <div style={{ padding: "15px", border: "1px solid #ddd", borderRadius: "8px" }}>
      <h4>👥 Deposit for User</h4>
      <div style={{ marginBottom: "10px" }}>
        <label style={{ display: "block", marginBottom: "5px" }}>User Address:</label>
        <input
          type="text"
          placeholder="0x..."
          value={userAddress}
          onChange={(e) => onUserAddressChange(e.target.value)}
          disabled={disabled}
          style={{ 
            width: "100%", 
            padding: "8px", 
            border: "1px solid #ccc", 
            borderRadius: "4px", 
            marginBottom: "10px",
            backgroundColor: disabled ? "#f8f9fa" : "white"
          }}
        />
        <label style={{ display: "block", marginBottom: "5px" }}>Amount (ETH):</label>
        <input
          type="number"
          step="0.001"
          min="0"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          disabled={disabled}
          style={{ 
            width: "100%", 
            padding: "8px", 
            border: "1px solid #ccc", 
            borderRadius: "4px",
            backgroundColor: disabled ? "#f8f9fa" : "white"
          }}
        />
      </div>
      <button
        onClick={onDeposit}
        disabled={isDepositing || disabled || !amount || !userAddress}
        style={{
          width: "100%",
          padding: "10px",
          border: "1px solid #17a2b8",
          backgroundColor: disabled ? "#6c757d" : "#17a2b8",
          color: "white",
          borderRadius: "4px",
          cursor: isDepositing || disabled ? "not-allowed" : "pointer"
        }}
      >
        {isDepositing ? "Depositing..." : "👥 Deposit for User"}
      </button>
    </div>
  );
};

// Withdrawal Request Form Component
interface WithdrawRequestFormProps {
  amount: string;
  onAmountChange: (amount: string) => void;
  onRequestWithdraw: () => void;
  isRequesting: boolean;
  disabled?: boolean;
  hasPendingWithdraw?: boolean;
}

export const WithdrawRequestForm: React.FC<WithdrawRequestFormProps> = ({
  amount,
  onAmountChange,
  onRequestWithdraw,
  isRequesting,
  disabled,
  hasPendingWithdraw
}) => {
  return (
    <div style={{ padding: "15px", border: "1px solid #ddd", borderRadius: "8px" }}>
      <h4>💸 Request Withdrawal</h4>
      <div style={{ marginBottom: "10px" }}>
        <label style={{ display: "block", marginBottom: "5px" }}>Amount (ETH):</label>
        <input
          type="number"
          step="0.001"
          min="0"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          disabled={disabled || hasPendingWithdraw}
          style={{ 
            width: "100%", 
            padding: "8px", 
            border: "1px solid #ccc", 
            borderRadius: "4px",
            backgroundColor: disabled || hasPendingWithdraw ? "#f8f9fa" : "white"
          }}
        />
      </div>
      <button
        onClick={onRequestWithdraw}
        disabled={isRequesting || disabled || !amount || hasPendingWithdraw}
        style={{
          width: "100%",
          padding: "10px",
          border: "1px solid #ffc107",
          backgroundColor: hasPendingWithdraw ? "#6c757d" : (disabled ? "#6c757d" : "#ffc107"),
          color: hasPendingWithdraw || disabled ? "white" : "black",
          borderRadius: "4px",
          cursor: isRequesting || disabled || hasPendingWithdraw ? "not-allowed" : "pointer"
        }}
      >
        {isRequesting ? "Requesting..." : hasPendingWithdraw ? "Withdrawal Pending" : "🔄 Request Withdrawal"}
      </button>
      {hasPendingWithdraw && (
        <div style={{ fontSize: "12px", color: "#6c757d", marginTop: "5px" }}>
          You already have a pending withdrawal. Execute it first.
        </div>
      )}
    </div>
  );
};

// Withdrawal Delay Info Component
interface WithdrawDelayInfoProps {
  withdrawDelay: WithdrawDelayInfo | null;
}

export const WithdrawDelayInfo: React.FC<WithdrawDelayInfoProps> = ({ withdrawDelay }) => {
  if (!withdrawDelay) return null;

  return (
    <div style={{ 
      marginTop: "15px", 
      padding: "10px", 
      backgroundColor: "#fff3cd", 
      borderRadius: "4px", 
      border: "1px solid #ffeaa7" 
    }}>
      <strong>⏳ Withdrawal Delay:</strong> {withdrawDelay.delayHours} hours ({withdrawDelay.delaySeconds} seconds)
    </div>
  );
};

// Payment Manager Status Component
interface PaymentManagerStatusProps {
  address: string | undefined;
  paymentManager: any;
  autoRefresh: boolean;
  onAutoRefreshChange: (enabled: boolean) => void;
  onRefresh: () => void;
  loading: boolean;
}

export const PaymentManagerStatus: React.FC<PaymentManagerStatusProps> = ({
  address,
  paymentManager,
  autoRefresh,
  onAutoRefreshChange,
  onRefresh,
  loading
}) => {
  return (
    <div style={{ marginBottom: "30px", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <h3 style={{ margin: 0 }}>📊 Account Status</h3>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "14px" }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => onAutoRefreshChange(e.target.checked)}
            />
            Auto-refresh
          </label>
          <button
            onClick={onRefresh}
            disabled={loading}
            style={{
              padding: "5px 10px",
              border: "1px solid #007bff",
              backgroundColor: "#007bff",
              color: "white",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "12px"
            }}
          >
            {loading ? "⟳" : "🔄"} Refresh
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
        <div>
          <strong>Connected Account:</strong>
          <div style={{ fontFamily: "monospace", fontSize: "12px", wordBreak: "break-all" }}>
            {address || "Not connected"}
          </div>
        </div>
        
        <div>
          <strong>PaymentManager:</strong>
          <div style={{ color: paymentManager ? "green" : "red" }}>
            {paymentManager ? "✅ Initialized" : "❌ Not initialized"}
          </div>
        </div>
      </div>
    </div>
  );
};