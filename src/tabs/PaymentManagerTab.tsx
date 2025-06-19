/**
 * PaymentManagerTab.tsx
 *
 * Demonstrates Lit Protocol's PaymentManager functionality for managing deposits,
 * withdrawals, and balance queries on the Ledger Contract.
 *
 * Features:
 * - Account balance checking with real-time updates
 * - Deposit funds (self and for others)
 * - Withdrawal request and execution flow
 * - Withdrawal delay timing and status
 * - Transaction history and status tracking
 */

import { useState, useEffect, useCallback } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { DisplayCode } from "../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../components/layout/GreyboardWhiteBgContainer";
import AccountMethodSelector, {
  AccountMethod,
  CREATE_ACCOUNT_PRIVATE_KEY_CODE,
  CREATE_ACCOUNT_WALLET_CLIENT_CODE
} from "../components/common/AccountMethodSelector";
import { useAppContext } from "../router";

const OPERATION_NAME = "Payment Manager";

// Code snippets for documentation
const SETUP_CODE = `
import { createLitClient } from '@lit-protocol/lit-client';
import { nagaDev } from '@lit-protocol/networks';

// Create lit client
const litClient = await createLitClient({ network: nagaDev });

// Get PaymentManager instance (requires account for transactions)
const paymentManager = await litClient.getPaymentManager({ 
  account: yourAccount // viem account instance
});`;

const DEPOSIT_CODE = `
// Deposit funds to your own account
const result = await paymentManager.deposit({ amountInEth: "0.1" });
console.log(\`Deposit successful: \${result.hash}\`);
// Returns: { hash: string, receipt: object }`;

const DEPOSIT_FOR_USER_CODE = `
// Deposit funds for another user's account
const result = await paymentManager.depositForUser({ 
  userAddress: "0x742d35Cc6638Cb49f4E7c9ce71E02ef18C53E1d5",
  amountInEth: "0.05"
});
// Returns: { hash: string, receipt: object }`;

const BALANCE_CODE = `
// Get complete balance information for a user
const balance = await paymentManager.getBalance({ 
  userAddress: "0x742d35Cc6638Cb49f4E7c9ce71E02ef18C53E1d5" 
});

console.log(\`Total: \${balance.totalBalance} ETH\`);        // "0.1"
console.log(\`Available: \${balance.availableBalance} ETH\`); // "0.08" (excludes pending withdrawals)
console.log(balance.raw.totalBalance);                     // 100000000000000000n (Wei bigint)`;

const WITHDRAWAL_REQUEST_CODE = `
// Request a withdrawal (starts the delay period)
const result = await paymentManager.requestWithdraw({ amountInEth: "0.05" });
console.log(\`Withdrawal requested: \${result.hash}\`);
// Returns: { hash: string, receipt: object }`;

const WITHDRAWAL_STATUS_CODE = `
// Get withdrawal request status and details
const withdrawInfo = await paymentManager.getWithdrawRequest({ 
  userAddress: "0x742d35Cc6638Cb49f4E7c9ce71E02ef18C53E1d5" 
});

if (withdrawInfo.isPending) {
  console.log(\`Pending withdrawal: \${withdrawInfo.amount} ETH\`);
  console.log(\`Requested at: \${new Date(Number(withdrawInfo.timestamp) * 1000)}\`);
}

// Check if withdrawal can be executed
const canExecute = await paymentManager.canExecuteWithdraw({ 
  userAddress: account.address 
});

if (canExecute.canExecute) {
  console.log("✅ Withdrawal can be executed now!");
} else {
  console.log(\`⏱️ Wait \${canExecute.timeRemaining} more seconds\`);
}`;

const WITHDRAWAL_EXECUTE_CODE = `
// Execute withdrawal after delay period has passed
const result = await paymentManager.withdraw({ amountInEth: "0.05" });
console.log(\`Withdrawal executed: \${result.hash}\`);
// Returns: { hash: string, receipt: object }`;

const WITHDRAWAL_DELAY_CODE = `
// Get the withdrawal delay period
const delay = await paymentManager.getWithdrawDelay();
console.log(\`Withdrawal delay: \${delay.delayHours} hours\`); // "1"
console.log(\`Delay seconds: \${delay.delaySeconds}\`);        // "3600"
// Returns: { delaySeconds: string, delayHours: string, raw: bigint }`;

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

export default function PaymentManagerTab() {
  const { assertDependenciesLoaded, showError, clearError } = useAppContext();

  const { data: walletClient } = useWalletClient();

  // State management
  const [paymentManager, setPaymentManager] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [balanceInfo, setBalanceInfo] = useState<BalanceInfo | null>(null);
  const [withdrawInfo, setWithdrawInfo] = useState<WithdrawInfo | null>(null);
  const [withdrawDelay, setWithdrawDelay] = useState<WithdrawDelayInfo | null>(null);
  const [canExecuteInfo, setCanExecuteInfo] = useState<CanExecuteInfo | null>(null);
  
  // Account management
  const [accountMethod, setAccountMethod] = useState<AccountMethod>("walletClient");
  const [account, setAccount] = useState<any>(null);
  
  // Form states
  const [depositAmount, setDepositAmount] = useState("0.01");
  const [depositForUserAmount, setDepositForUserAmount] = useState("0.01");
  const [depositForUserAddress, setDepositForUserAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("0.01");
  
  // Transaction states
  const [isDepositing, setIsDepositing] = useState(false);
  const [isDepositingForUser, setIsDepositingForUser] = useState(false);
  const [isRequestingWithdraw, setIsRequestingWithdraw] = useState(false);
  const [isExecutingWithdraw, setIsExecutingWithdraw] = useState(false);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [isCheckingWithdraw, setIsCheckingWithdraw] = useState(false);
  const [isCheckingDelay, setIsCheckingDelay] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string>("");

  // Success feedback state
  const [successActions, setSuccessActions] = useState<Set<string>>(new Set());

  // Function to show success feedback
  const showSuccess = (actionId: string) => {
    setSuccessActions((prev) => new Set([...prev, actionId]));
    // Auto-clear after 3 seconds
    setTimeout(() => {
      setSuccessActions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(actionId);
        return newSet;
      });
    }, 3000);
  };

  // Initialize PaymentManager when account is available
  const initializePaymentManager = useCallback(async () => {
    // Handle both wallet client and private key account structures
    const accountAddress = account?.address || account?.account?.address;
    if (!account || !accountAddress) {
      setPaymentManager(null);
      return;
    }

    try {
      clearError?.();
      setLoading(true);
      
      const { litClient } = assertDependenciesLoaded();
      
      const pm = await litClient.getPaymentManager({ account });
      setPaymentManager(pm);
      
    } catch (error: any) {
      console.error("Failed to initialize PaymentManager:", error);
      showError?.(`Failed to initialize PaymentManager: ${error.message}`);
      setPaymentManager(null);
    } finally {
      setLoading(false);
    }
  }, [account, assertDependenciesLoaded, showError, clearError]);

  // Initialize on mount and when wallet changes
  useEffect(() => {
    initializePaymentManager();
  }, [initializePaymentManager]);

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

  // Handle deposit
  const handleDeposit = async () => {
    if (!paymentManager || !depositAmount) return;

    try {
      setIsDepositing(true);
      clearError?.();

      const result = await paymentManager.deposit({ amountInEth: depositAmount });
      setLastTxHash(result.hash);
      showSuccess("deposit");
      
    } catch (error: any) {
      console.error("Deposit failed:", error);
      showError?.(`Deposit failed: ${error.message}`);
    } finally {
      setIsDepositing(false);
    }
  };

  // Handle deposit for user
  const handleDepositForUser = async () => {
    if (!paymentManager || !depositForUserAmount || !depositForUserAddress) return;

    try {
      setIsDepositingForUser(true);
      clearError?.();

      const result = await paymentManager.depositForUser({
        userAddress: depositForUserAddress,
        amountInEth: depositForUserAmount
      });
      setLastTxHash(result.hash);
      showSuccess("deposit-for-user");
      
    } catch (error: any) {
      console.error("Deposit for user failed:", error);
      showError?.(`Deposit for user failed: ${error.message}`);
    } finally {
      setIsDepositingForUser(false);
    }
  };

  // Handle balance check
  const handleCheckBalance = async () => {
    const accountAddress = account?.address || account?.account?.address;
    if (!paymentManager || !accountAddress) return;

    try {
      setIsCheckingBalance(true);
      clearError?.();

      const balance = await paymentManager.getBalance({ userAddress: accountAddress });
      setBalanceInfo(balance);
      showSuccess("check-balance");
      
    } catch (error: any) {
      console.error("Balance check failed:", error);
      showError?.(`Balance check failed: ${error.message}`);
    } finally {
      setIsCheckingBalance(false);
    }
  };

  // Handle withdrawal request
  const handleRequestWithdraw = async () => {
    if (!paymentManager || !withdrawAmount) return;

    try {
      setIsRequestingWithdraw(true);
      clearError?.();

      const result = await paymentManager.requestWithdraw({ amountInEth: withdrawAmount });
      setLastTxHash(result.hash);
      showSuccess("request-withdraw");
      
    } catch (error: any) {
      console.error("Withdrawal request failed:", error);
      showError?.(`Withdrawal request failed: ${error.message}`);
    } finally {
      setIsRequestingWithdraw(false);
    }
  };

  // Handle withdrawal status check
  const handleCheckWithdrawStatus = async () => {
    const accountAddress = account?.address || account?.account?.address;
    if (!paymentManager || !accountAddress) return;

    try {
      setIsCheckingWithdraw(true);
      clearError?.();

      const withdraw = await paymentManager.getWithdrawRequest({ userAddress: accountAddress });
      setWithdrawInfo(withdraw);

      if (withdraw.isPending) {
        const canExecute = await paymentManager.canExecuteWithdraw({ userAddress: accountAddress });
        setCanExecuteInfo(canExecute);
      } else {
        setCanExecuteInfo(null);
      }
      
      showSuccess("check-withdraw-status");
      
    } catch (error: any) {
      console.error("Withdrawal status check failed:", error);
      showError?.(`Withdrawal status check failed: ${error.message}`);
    } finally {
      setIsCheckingWithdraw(false);
    }
  };

  // Handle withdrawal execution
  const handleExecuteWithdraw = async () => {
    if (!paymentManager || !withdrawInfo) return;

    try {
      setIsExecutingWithdraw(true);
      clearError?.();

      const result = await paymentManager.withdraw({ amountInEth: withdrawInfo.amount });
      setLastTxHash(result.hash);
      showSuccess("execute-withdraw");
      
      // Clear withdraw info after successful execution
      setWithdrawInfo(null);
      setCanExecuteInfo(null);
      
    } catch (error: any) {
      console.error("Withdrawal execution failed:", error);
      showError?.(`Withdrawal execution failed: ${error.message}`);
    } finally {
      setIsExecutingWithdraw(false);
    }
  };

  // Handle withdrawal delay check
  const handleCheckWithdrawDelay = async () => {
    if (!paymentManager) return;

    try {
      setIsCheckingDelay(true);
      clearError?.();

      const delay = await paymentManager.getWithdrawDelay();
      setWithdrawDelay(delay);
      showSuccess("check-withdraw-delay");
      
    } catch (error: any) {
      console.error("Withdrawal delay check failed:", error);
      showError?.(`Withdrawal delay check failed: ${error.message}`);
    } finally {
      setIsCheckingDelay(false);
    }
  };

  return (
    <div className="tab-content">
      <h2>{OPERATION_NAME}</h2>
      <p>
        The Payment Manager demonstrates Lit Protocol's payment system - a billing system for decentralised 
        cryptographic services. Users pay for compute resources on the Lit network to access core services like:
      </p>
      <ul style={{ marginLeft: "20px", marginBottom: "15px", color: "#495057" }}>
        <li><strong>Encryption/Decryption</strong> - Secure data with programmable access control</li>
        <li><strong>PKP Signing</strong> - Cryptographic keys that can sign transactions based on conditions</li>
        <li><strong>Lit Actions</strong> - Serverless functions with cryptographic capabilities</li>
      </ul>
      <p>
        Similar to how you pay AWS for cloud computing, this system ensures the decentralised network can 
        sustain itself and pay node operators. You can deposit funds, request withdrawals with security delays, 
        and manage balances for yourself or other users (enabling applications to sponsor their users' costs for better UX).
      </p>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*                  Prerequisites                   */}
        {/* ================================================ */}
        <h3 style={{ marginTop: 0 }}>Prerequisites</h3>
        <ul>
          <li>
            Lit Client:{" "}
            {(() => {
              try {
                assertDependenciesLoaded();
                return <span style={{ color: "green" }}>✓ Initialised</span>;
              } catch {
                return <span style={{ color: "red" }}>✗ Not initialised</span>;
              }
            })()}
          </li>
          {accountMethod === "privateKey" ? (
            <li>
              Private Key:{" "}
              {account ? (
                <span style={{ color: "green" }}>✓ Provided</span>
              ) : (
                <span style={{ color: "red" }}>✗ Not provided</span>
              )}
            </li>
          ) : (
            <li>
              Wallet Client:{" "}
              {walletClient ? (
                <span style={{ color: "green" }}>✓ Connected</span>
              ) : (
                <span style={{ color: "red" }}>✗ Not connected</span>
              )}
            </li>
          )}
        </ul>

        {/* Faucet Information */}
        <div
          style={{
            marginTop: "15px",
            padding: "10px",
            backgroundColor: "#e8f4fd",
            borderRadius: "4px",
            border: "1px solid #b3d9ff",
          }}
        >
          <strong>💰 Need Test Tokens?</strong> Visit the{" "}
          <a
            href="https://chronicle-yellowstone-faucet.getlit.dev/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#0066cc", textDecoration: "underline" }}
          >
            Chronicle Yellowstone Faucet
          </a>{" "}
          to get test tokens for payment operations.
        </div>

        {/* Setup Instructions */}
        <div style={{ marginTop: "20px" }}>
          <h4>💰 Payment Manager Setup</h4>
          <DisplayCode
            code={SETUP_CODE}
            language="typescript"
          />
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*            Create Account from Private Key       */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>Step 1: Create Account</h3>
        <p>
          {accountMethod === "privateKey"
            ? "Convert your private key to a viem account object that can be used for payment operations."
            : "Use your connected wallet account for payment operations."}
        </p>

        <DisplayCode
          code={
            accountMethod === "privateKey"
              ? CREATE_ACCOUNT_PRIVATE_KEY_CODE
              : CREATE_ACCOUNT_WALLET_CLIENT_CODE
          }
          language="typescript"
          renderComponent={
            <AccountMethodSelector
              onAccountCreated={setAccount}
              onMethodChange={setAccountMethod}
              setStatus={() => {}}
              showError={showError}
              showSuccess={showSuccess}
              successActionIds={{
                createAccount: "payment-manager-create-account",
                getWalletAccount: "payment-manager-get-wallet-account",
              }}
              successActions={successActions}
            />
          }
          resultData={
            account ? { address: account.address, type: account.type } : null
          }
          resultLabel="Account Information"
          useSideBySide={true}
          theme="dracula"
          isSuccess={
            successActions.has("payment-manager-create-account") ||
            successActions.has("payment-manager-get-wallet-account")
          }
        />
      </GreyBoarderWhiteBgContainer>

      {/* Deposit Section */}
      <GreyBoarderWhiteBgContainer>
        <h3 style={{ marginTop: 0 }}>
          Step 2: Deposit Funds
          {!account && (
            <span style={{ color: "orange" }}> (Create account first)</span>
          )}
        </h3>
        <p>
          Deposit funds to your own account. This adds ETH to your balance in the Ledger Contract.
        </p>

        <DisplayCode
          code={DEPOSIT_CODE}
          language="typescript"
          renderComponent={
            <div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                  Amount (ETH):
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  disabled={!account}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                    backgroundColor: !account ? "#f8f9fa" : "white",
                    color: "black"
                  }}
                />
              </div>
              <button
                onClick={handleDeposit}
                disabled={isDepositing || !paymentManager || !depositAmount || !account}
                style={{
                  padding: "10px 15px",
                  backgroundColor: (!account || !paymentManager || isDepositing) ? "#cccccc" : "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: (!account || !paymentManager || isDepositing) ? "not-allowed" : "pointer",
                  fontWeight: "500",
                }}
              >
                {isDepositing 
                  ? "Depositing..." 
                  : successActions.has("deposit") 
                  ? "✓ Deposited" 
                  : !account 
                  ? "💰 Create Account First"
                  : !paymentManager
                  ? "💰 PaymentManager Loading..."
                  : !depositAmount
                  ? "💰 Enter Amount"
                  : "💰 Deposit Funds"
                }
              </button>
              
              {/* Debug info */}
              {(!account || !paymentManager) && (
                <div style={{ marginTop: "10px", padding: "8px", backgroundColor: "#fff3cd", border: "1px solid #ffeaa7", borderRadius: "4px", fontSize: "12px" }}>
                  <strong>Debug Info:</strong>
                  <div>Account: {account ? `✓ ${account.address || account.account?.address || 'No address'}` : '✗ Missing'}</div>
                  <div>PaymentManager: {paymentManager ? '✓ Ready' : loading ? '⏳ Loading...' : '✗ Failed to load'}</div>
                </div>
              )}
            </div>
          }
          resultData={lastTxHash && successActions.has("deposit") ? { transactionHash: lastTxHash } : null}
          resultLabel="Deposit Transaction"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("deposit")}
        />
      </GreyBoarderWhiteBgContainer>

      {/* Deposit for User Section */}
      <GreyBoarderWhiteBgContainer>
        <h3 style={{ marginTop: 0 }}>
          Step 3: Deposit for Another User
          {!account && (
            <span style={{ color: "orange" }}> (Create account first)</span>
          )}
        </h3>
        <p>
          Deposit funds for another user's account. This allows you to fund someone else's balance.
        </p>

        <DisplayCode
          code={DEPOSIT_FOR_USER_CODE}
          language="typescript"
          renderComponent={
            <div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                  User Address:
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={depositForUserAddress}
                  onChange={(e) => setDepositForUserAddress(e.target.value)}
                  disabled={!account}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                    marginBottom: "10px",
                    backgroundColor: !account ? "#f8f9fa" : "white",
                    color: "black"
                  }}
                />
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                  Amount (ETH):
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={depositForUserAmount}
                  onChange={(e) => setDepositForUserAmount(e.target.value)}
                  disabled={!account}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                    backgroundColor: !account ? "#f8f9fa" : "white",
                    color: "black"
                  }}
                />
              </div>
              <button
                onClick={handleDepositForUser}
                disabled={isDepositingForUser || !paymentManager || !depositForUserAmount || !depositForUserAddress || !account}
                style={{
                  padding: "10px 15px",
                  backgroundColor: (!account || !paymentManager || isDepositingForUser) ? "#cccccc" : "#17a2b8",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: (!account || !paymentManager || isDepositingForUser) ? "not-allowed" : "pointer",
                  fontWeight: "500",
                }}
              >
                {isDepositingForUser 
                  ? "Depositing..." 
                  : successActions.has("deposit-for-user") 
                  ? "✓ Deposited for User" 
                  : !account 
                  ? "👥 Create Account First"
                  : !paymentManager
                  ? "👥 PaymentManager Loading..."
                  : !depositForUserAddress
                  ? "👥 Enter User Address"
                  : !depositForUserAmount
                  ? "👥 Enter Amount"
                  : "👥 Deposit for User"
                }
              </button>
              
              {/* Debug info */}
              {(!account || !paymentManager) && (
                <div style={{ marginTop: "10px", padding: "8px", backgroundColor: "#fff3cd", border: "1px solid #ffeaa7", borderRadius: "4px", fontSize: "12px" }}>
                  <strong>Debug Info:</strong>
                  <div>Account: {account ? `✓ ${account.address || account.account?.address || 'No address'}` : '✗ Missing'}</div>
                  <div>PaymentManager: {paymentManager ? '✓ Ready' : loading ? '⏳ Loading...' : '✗ Failed to load'}</div>
                </div>
              )}
            </div>
          }
          resultData={lastTxHash && successActions.has("deposit-for-user") ? { transactionHash: lastTxHash, userAddress: depositForUserAddress } : null}
          resultLabel="Deposit for User Transaction"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("deposit-for-user")}
        />
      </GreyBoarderWhiteBgContainer>

      {/* Balance Check Section */}
      <GreyBoarderWhiteBgContainer>
        <h3 style={{ marginTop: 0 }}>
          Step 4: Check Balance
          {!account && (
            <span style={{ color: "orange" }}> (Create account first)</span>
          )}
        </h3>
        <p>
          Get complete balance information for your account, including total balance and available balance (excludes pending withdrawals).
        </p>

        <DisplayCode
          code={BALANCE_CODE}
          language="typescript"
          renderComponent={
            <div>
              <button
                onClick={handleCheckBalance}
                disabled={isCheckingBalance || !paymentManager || !account}
                style={{
                  padding: "10px 15px",
                  backgroundColor: (!account || !paymentManager || isCheckingBalance) ? "#cccccc" : "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: (!account || !paymentManager || isCheckingBalance) ? "not-allowed" : "pointer",
                  fontWeight: "500",
                  marginBottom: "15px"
                }}
              >
                {isCheckingBalance ? "Checking..." : successActions.has("check-balance") ? "✓ Balance Checked" : "📊 Check Balance"}
              </button>

              {balanceInfo && (
                <div style={{ padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "4px", border: "1px solid #e9ecef" }}>
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
                </div>
              )}
            </div>
          }
          resultData={balanceInfo}
          resultLabel="Balance Information"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("check-balance")}
        />
      </GreyBoarderWhiteBgContainer>

      {/* Withdrawal Request Section */}
      <GreyBoarderWhiteBgContainer>
        <h3 style={{ marginTop: 0 }}>
          Step 5: Request Withdrawal
          {!account && (
            <span style={{ color: "orange" }}> (Create account first)</span>
          )}
        </h3>
        <p>
          Request a withdrawal from your account. This starts the security delay period before the withdrawal can be executed.
        </p>

        <DisplayCode
          code={WITHDRAWAL_REQUEST_CODE}
          language="typescript"
          renderComponent={
            <div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                  Amount (ETH):
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  disabled={!account}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                    backgroundColor: !account ? "#f8f9fa" : "white",
                    color: "black"
                  }}
                />
              </div>
              <button
                onClick={handleRequestWithdraw}
                disabled={isRequestingWithdraw || !paymentManager || !withdrawAmount || !account}
                style={{
                  padding: "10px 15px",
                  backgroundColor: (!account || !paymentManager || isRequestingWithdraw) ? "#cccccc" : "#ffc107",
                  color: (!account || !paymentManager || isRequestingWithdraw) ? "white" : "black",
                  border: "none",
                  borderRadius: "4px",
                  cursor: (!account || !paymentManager || isRequestingWithdraw) ? "not-allowed" : "pointer",
                  fontWeight: "500",
                }}
              >
                {isRequestingWithdraw ? "Requesting..." : successActions.has("request-withdraw") ? "✓ Withdrawal Requested" : "🔄 Request Withdrawal"}
              </button>
            </div>
          }
          resultData={lastTxHash && successActions.has("request-withdraw") ? { transactionHash: lastTxHash, amount: withdrawAmount } : null}
          resultLabel="Withdrawal Request Transaction"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("request-withdraw")}
        />
      </GreyBoarderWhiteBgContainer>

      {/* Withdrawal Status Section */}
      <GreyBoarderWhiteBgContainer>
        <h3 style={{ marginTop: 0 }}>
          Step 6: Check Withdrawal Status
          {!account && (
            <span style={{ color: "orange" }}> (Create account first)</span>
          )}
        </h3>
        <p>
          Check the status of your withdrawal request and see if it can be executed.
        </p>

        <DisplayCode
          code={WITHDRAWAL_STATUS_CODE}
          language="typescript"
          renderComponent={
            <div>
              <button
                onClick={handleCheckWithdrawStatus}
                disabled={isCheckingWithdraw || !paymentManager || !account}
                style={{
                  padding: "10px 15px",
                  backgroundColor: (!account || !paymentManager || isCheckingWithdraw) ? "#cccccc" : "#6f42c1",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: (!account || !paymentManager || isCheckingWithdraw) ? "not-allowed" : "pointer",
                  fontWeight: "500",
                  marginBottom: "15px"
                }}
              >
                {isCheckingWithdraw ? "Checking..." : successActions.has("check-withdraw-status") ? "✓ Status Checked" : "🔍 Check Withdrawal Status"}
              </button>

              {withdrawInfo && (
                <div style={{ padding: "15px", backgroundColor: withdrawInfo.isPending ? "#fff3cd" : "#d4edda", borderRadius: "4px", border: `1px solid ${withdrawInfo.isPending ? "#ffeaa7" : "#c3e6cb"}` }}>
                  <h4 style={{ margin: "0 0 10px 0" }}>
                    {withdrawInfo.isPending ? "🕐 Pending Withdrawal" : "✅ No Pending Withdrawal"}
                  </h4>
                  
                  {withdrawInfo.isPending && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px", marginBottom: "15px" }}>
                      <div>
                        <strong>Amount:</strong> {withdrawInfo.amount} ETH
                      </div>
                      <div>
                        <strong>Requested:</strong> {new Date(Number(withdrawInfo.timestamp) * 1000).toLocaleString()}
                      </div>
                      {canExecuteInfo && (
                        <div>
                          <strong>Status:</strong> 
                          <span style={{ color: canExecuteInfo.canExecute ? "green" : "orange", marginLeft: "5px" }}>
                            {canExecuteInfo.canExecute ? "✅ Ready to execute" : `⏱️ ${formatTimeRemaining(canExecuteInfo.timeRemaining)} remaining`}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {canExecuteInfo?.canExecute && (
                    <button
                      onClick={handleExecuteWithdraw}
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
                  )}
                </div>
              )}
            </div>
          }
          resultData={withdrawInfo}
          resultLabel="Withdrawal Status"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("check-withdraw-status")}
        />
      </GreyBoarderWhiteBgContainer>

      {/* Withdrawal Delay Section */}
      <GreyBoarderWhiteBgContainer>
        <h3 style={{ marginTop: 0 }}>
          Step 7: Check Withdrawal Delay
          {!account && (
            <span style={{ color: "orange" }}> (Create account first)</span>
          )}
        </h3>
        <p>
          Get information about the withdrawal delay period for security.
        </p>

        <DisplayCode
          code={WITHDRAWAL_DELAY_CODE}
          language="typescript"
          renderComponent={
            <div>
              <button
                onClick={handleCheckWithdrawDelay}
                disabled={isCheckingDelay || !paymentManager}
                style={{
                  padding: "10px 15px",
                  backgroundColor: (!paymentManager || isCheckingDelay) ? "#cccccc" : "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: (!paymentManager || isCheckingDelay) ? "not-allowed" : "pointer",
                  fontWeight: "500",
                  marginBottom: "15px"
                }}
              >
                {isCheckingDelay ? "Checking..." : successActions.has("check-withdraw-delay") ? "✓ Delay Checked" : "⏳ Check Withdrawal Delay"}
              </button>

              {withdrawDelay && (
                <div style={{ padding: "15px", backgroundColor: "#fff3cd", borderRadius: "4px", border: "1px solid #ffeaa7" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px" }}>
                    <div>
                      <strong>Delay Hours:</strong>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#856404" }}>
                        {withdrawDelay.delayHours} hours
                      </div>
                    </div>
                    
                    <div>
                      <strong>Delay Seconds:</strong>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#856404" }}>
                        {withdrawDelay.delaySeconds} seconds
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: "10px", fontSize: "14px", color: "#856404" }}>
                    All withdrawals have a {withdrawDelay.delayHours}-hour security delay before they can be executed.
                  </div>
                </div>
              )}
            </div>
          }
          resultData={withdrawDelay}
          resultLabel="Withdrawal Delay Information"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("check-withdraw-delay")}
        />
      </GreyBoarderWhiteBgContainer>

      {/* Execute Withdrawal Section */}
      <GreyBoarderWhiteBgContainer>
        <h3 style={{ marginTop: 0 }}>
          Step 8: Execute Withdrawal
          {!withdrawInfo?.isPending && (
            <span style={{ color: "orange" }}> (Request withdrawal first)</span>
          )}
        </h3>
        <p>
          Execute a withdrawal after the delay period has passed. This completes the withdrawal process.
        </p>

        <DisplayCode
          code={WITHDRAWAL_EXECUTE_CODE}
          language="typescript"
          renderComponent={
            <div>
              <button
                onClick={handleExecuteWithdraw}
                disabled={isExecutingWithdraw || !paymentManager || !withdrawInfo?.isPending || !canExecuteInfo?.canExecute}
                style={{
                  padding: "10px 15px",
                  backgroundColor: (!paymentManager || isExecutingWithdraw || !withdrawInfo?.isPending || !canExecuteInfo?.canExecute) ? "#cccccc" : "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: (!paymentManager || isExecutingWithdraw || !withdrawInfo?.isPending || !canExecuteInfo?.canExecute) ? "not-allowed" : "pointer",
                  fontWeight: "500",
                  marginBottom: "15px"
                }}
              >
                {isExecutingWithdraw ? "Executing..." : successActions.has("execute-withdraw") ? "✓ Withdrawal Executed" : "💸 Execute Withdrawal"}
              </button>

              {!withdrawInfo?.isPending && (
                <div style={{ padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "4px", border: "1px solid #e9ecef", fontSize: "14px", color: "#6c757d" }}>
                  No pending withdrawal to execute. Request a withdrawal first and wait for the delay period.
                </div>
              )}

              {withdrawInfo?.isPending && !canExecuteInfo?.canExecute && canExecuteInfo && (
                <div style={{ padding: "10px", backgroundColor: "#fff3cd", borderRadius: "4px", border: "1px solid #ffeaa7", fontSize: "14px", color: "#856404" }}>
                  Withdrawal cannot be executed yet. Wait {formatTimeRemaining(canExecuteInfo.timeRemaining)} more.
                </div>
              )}
            </div>
          }
          resultData={lastTxHash && successActions.has("execute-withdraw") ? { transactionHash: lastTxHash } : null}
          resultLabel="Withdrawal Execution Transaction"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("execute-withdraw")}
        />
      </GreyBoarderWhiteBgContainer>
    </div>
  );
}