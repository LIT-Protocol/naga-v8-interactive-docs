/**
 * WalletOperationsDashboard Component
 *
 * Comprehensive dashboard for all PKP wallet operations
 */

import React from "react";
import { PkpInfo, TransactionResult } from "../../types";
import { EncryptDecryptForm } from "./EncryptDecryptForm";
import { LitActionForm } from "./LitActionForm";
import { ViemAccountForm } from "./ViemAccountForm";
import { SendTransactionForm } from "./SendTransactionForm";

interface WalletOperationsDashboardProps {
  selectedPkp: PkpInfo | null;
  selectedChain: string;
  disabled?: boolean;
  onTransactionComplete?: (result: TransactionResult) => void;
}

export const WalletOperationsDashboard: React.FC<
  WalletOperationsDashboardProps
> = ({
  selectedPkp,
  selectedChain,
  disabled = false,
  onTransactionComplete,
}) => {
  return (
    <>
      {/* Message Signing */}
      {/* <SignMessageForm selectedPkp={selectedPkp} disabled={disabled} /> */}

      {/* Viem Integrations Section */}
      <div style={{ marginBottom: "30px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: "20px",
          }}
        >
          {/* PKP Viem Account Signing */}
          <ViemAccountForm selectedPkp={selectedPkp} disabled={disabled} />

          {/* Send Transaction */}
          <SendTransactionForm
            selectedPkp={selectedPkp}
            selectedChain={selectedChain}
            disabled={disabled}
            onTransactionComplete={onTransactionComplete}
          />
        </div>
      </div>

      {/* Encryption/Decryption */}
      <EncryptDecryptForm selectedPkp={selectedPkp} disabled={disabled} />

      {/* Lit Action Execution */}
      <LitActionForm selectedPkp={selectedPkp} disabled={disabled} />
    </>
  );
};
