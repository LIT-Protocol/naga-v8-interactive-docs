/**
 * FundPkpLedgerCheck.tsx
 *
 * Lightweight funding checkpoint for demo flows. On naga-test, requires the PKP ledger
 * to be funded before creating an AuthContext (session key signing requires funds).
 * Provides a simple balance check and a link to the Payment Manager tab for funding.
 *
 * Usage:
 * <FundPkpLedgerCheck pkpAddress={pkpInfo?.ethAddress} onStatusChange={setIsPkpFunded} />
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAppContext } from "../../router";
import { APP_INFO } from "../../_config";
import { DisplayCode } from "../DisplayCode";
import AccountMethodSelector, { AccountMethod as SelectorMethod } from "./AccountMethodSelector";

interface FundPkpLedgerCheckProps {
  pkpAddress?: string;
  minEth?: string; // default 0.1
  onStatusChange?: (isFunded: boolean) => void;
}

type AccountMethod = "walletClient" | "privateKey";

export const FundPkpLedgerCheck: React.FC<FundPkpLedgerCheckProps> = ({
  pkpAddress,
  minEth = "0.1",
  onStatusChange,
}) => {
  const app = useAppContext();

  // Selected funding account and method (via shared selector)
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [accountMethod, setAccountMethod] = useState<AccountMethod>("walletClient");

  const [isChecking, setIsChecking] = useState(false);
  const [available, setAvailable] = useState<string | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);
  const [isDepositing, setIsDepositing] = useState(false);
  const [amount, setAmount] = useState<string>(minEth);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  const isTestNetwork = APP_INFO.network === "naga-test";

  useEffect(() => {
    // On non-test networks, consider funding not required
    if (!isTestNetwork) {
      onStatusChange?.(true);
    }
  }, [isTestNetwork, onStatusChange]);

  const getPaymentManager = useCallback(async () => {
    const { litClient } = app.assertDependenciesLoaded();
    if (!selectedAccount) {
      throw new Error("No account selected. Please create/select an account above.");
    }
    return await litClient.getPaymentManager({ account: selectedAccount });
  }, [app, selectedAccount]);

  const checkBalance = useCallback(async () => {
    if (!pkpAddress) return;
    try {
      setIsChecking(true);
      app.clearError?.();
      const pm = await getPaymentManager();
      const balance = await pm.getBalance({ userAddress: pkpAddress });
      setAvailable(balance.availableBalance);
      setLastCheckedAt(Date.now());
      const ok = parseFloat(balance.availableBalance || "0") >= parseFloat(minEth);
      onStatusChange?.(ok);
    } catch (err: any) {
      app.showError?.(err?.message || String(err));
      onStatusChange?.(false);
    } finally {
      setIsChecking(false);
    }
  }, [app, getPaymentManager, pkpAddress, minEth, onStatusChange]);

  const depositForPkp = useCallback(async () => {
    if (!pkpAddress) return;
    try {
      setIsDepositing(true);
      app.clearError?.();
      const pm = await getPaymentManager();
      const result = await pm.depositForUser({ userAddress: pkpAddress, amountInEth: amount });
      setLastTxHash(result.hash);
      await checkBalance();
    } catch (err: any) {
      app.showError?.(err?.message || String(err));
    } finally {
      setIsDepositing(false);
    }
  }, [amount, app, checkBalance, getPaymentManager, pkpAddress]);

  const CHECK_BALANCE_CODE = useMemo(() => {
    if (accountMethod === "walletClient") {
      return `// Using connected wallet (wagmi)
const pm = await litClient.getPaymentManager({ account: walletClient });
const balance = await pm.getBalance({ userAddress: "${pkpAddress || "0x..."}" });
console.log(balance.availableBalance, 'ETH available');`;
    }
    return `// Using private key (viem)
import { privateKeyToAccount } from 'viem/accounts';
const account = privateKeyToAccount('0xYOUR_PRIVATE_KEY');
const pm = await litClient.getPaymentManager({ account });
const balance = await pm.getBalance({ userAddress: "${pkpAddress || "0x..."}" });
console.log(balance.availableBalance, 'ETH available');`;
  }, [accountMethod, pkpAddress]);

  const DEPOSIT_FOR_PKP_CODE = useMemo(() => {
    if (accountMethod === "walletClient") {
      return `// Using connected wallet (wagmi)
const pm = await litClient.getPaymentManager({ account: walletClient });
const result = await pm.depositForUser({ userAddress: "${pkpAddress || "0x..."}", amountInEth: "${amount}" });
console.log('tx hash', result.hash);`;
    }
    return `// Using private key (viem)
import { privateKeyToAccount } from 'viem/accounts';
const account = privateKeyToAccount('0xYOUR_PRIVATE_KEY');
const pm = await litClient.getPaymentManager({ account });
const result = await pm.depositForUser({ userAddress: "${pkpAddress || "0x..."}", amountInEth: "${amount}" });
console.log('tx hash', result.hash);`;
  }, [accountMethod, pkpAddress, amount]);

  if (!isTestNetwork || !pkpAddress) return null;

  return (
    <div style={{
      marginTop: "12px",
      padding: "12px",
      backgroundColor: "#fff7ed",
      border: "1px solid #ffedd5",
      borderRadius: 6,
    }}>
      <div style={{ fontSize: 14, color: "#7c2d12", marginBottom: 8 }}>
        On naga-test, fund the PKP ledger before creating an AuthContext.
      </div>

      {/* Account Method Selector (wagmi/viem) */}
      <AccountMethodSelector
        onAccountCreated={(acc) => setSelectedAccount(acc)}
        onMethodChange={(m: SelectorMethod) => setAccountMethod(m)}
        setStatus={app.setStatus || (() => {})}
        showError={app.showError}
        disabled={false}
      />

      {/* PKP Address */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
        <span style={{ fontSize: 12, color: "#7c2d12" }}>PKP Address:</span>
        <code style={{ fontSize: 12 }}>{pkpAddress}</code>
      </div>

      {/* Balance Check */}
      <div style={{ marginTop: 10 }}>
        <DisplayCode
          code={CHECK_BALANCE_CODE}
          language="typescript"
          renderComponent={
            <button
              onClick={checkBalance}
              disabled={isChecking || !selectedAccount}
              style={{ padding: "6px 10px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: 4, cursor: isChecking || !selectedAccount ? "not-allowed" : "pointer" }}
            >
              {isChecking ? "Checking..." : "Check Balance"}
            </button>
          }
          resultData={available !== null ? { available } : null}
          resultLabel="Available Balance (ETH)"
          useSideBySide={true}
          theme="dracula"
        />
        {available !== null && (
          <div style={{ fontSize: 12, marginTop: 6, color: parseFloat(available) >= parseFloat(minEth) ? "#065f46" : "#92400e" }}>
            Available: {available} ETH {lastCheckedAt ? `(as of ${new Date(lastCheckedAt).toLocaleTimeString()})` : ""}
          </div>
        )}
      </div>

      {/* Deposit for PKP */}
      <div style={{ marginTop: 12 }}>
        <DisplayCode
          code={DEPOSIT_FOR_PKP_CODE}
          language="typescript"
          renderComponent={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ fontSize: 12 }}>Amount (ETH):</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ padding: '6px 8px', border: '1px solid #ddd', borderRadius: 4 }}
              />
              <button
                onClick={depositForPkp}
                disabled={isDepositing || !selectedAccount}
                style={{ padding: '8px 12px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: 4, cursor: isDepositing || !selectedAccount ? 'not-allowed' : 'pointer' }}
              >
                {isDepositing ? 'Funding…' : 'Fund Now'}
              </button>
            </div>
          }
          resultData={lastTxHash ? { transactionHash: lastTxHash } : null}
          resultLabel="Funding Transaction"
          useSideBySide={true}
          theme="dracula"
        />
      </div>
    </div>
  );
};

export default FundPkpLedgerCheck;


