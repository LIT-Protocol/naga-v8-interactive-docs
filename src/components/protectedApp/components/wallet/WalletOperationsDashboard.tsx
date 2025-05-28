/**
 * WalletOperationsDashboard Component
 * 
 * Comprehensive dashboard for all PKP wallet operations
 */

import React from 'react';
import { PkpInfo, TransactionResult } from '../../types';
import { SignMessageForm } from './SignMessageForm';
import { EncryptDecryptForm } from './EncryptDecryptForm';
import { LitActionForm } from './LitActionForm';
import { ViemAccountForm } from './ViemAccountForm';
import { SendTransactionForm } from './SendTransactionForm';

interface WalletOperationsDashboardProps {
  selectedPkp: PkpInfo | null;
  selectedChain: string;
  disabled?: boolean;
  onTransactionComplete?: (result: TransactionResult) => void;
}

export const WalletOperationsDashboard: React.FC<WalletOperationsDashboardProps> = ({ 
  selectedPkp,
  selectedChain,
  disabled = false,
  onTransactionComplete,
}) => {
  return (
    <>
      {/* Header */}
      <div
        style={{
          marginBottom: "20px",
          padding: "16px 20px",
          background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          borderRadius: "12px",
          color: "white",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            margin: "0 0 8px 0",
            fontSize: "20px",
            fontWeight: "700",
          }}
        >
          🔧 PKP Wallet Operations
        </h2>
        <p
          style={{
            margin: "0",
            fontSize: "14px",
            opacity: 0.9,
            lineHeight: "1.4",
          }}
        >
          Explore the full capabilities of your PKP wallet - signing, encryption, Lit Actions, and transactions.
        </p>
      </div>

      {/* Message Signing */}
      <SignMessageForm selectedPkp={selectedPkp} disabled={disabled} />

      {/* Encryption/Decryption */}
      <EncryptDecryptForm selectedPkp={selectedPkp} disabled={disabled} />

      {/* Lit Action Execution */}
      <LitActionForm selectedPkp={selectedPkp} disabled={disabled} />

      {/* Viem Integrations Section */}
      <div style={{ marginBottom: "30px" }}>
        <div
          style={{
            marginBottom: "20px",
            padding: "16px 20px",
            background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
            borderRadius: "12px",
            color: "white",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              margin: "0 0 8px 0",
              fontSize: "20px",
              fontWeight: "700",
            }}
          >
            🚀 Viem Integrations
          </h2>
          <p
            style={{
              margin: "0",
              fontSize: "14px",
              opacity: 0.9,
              lineHeight: "1.4",
            }}
          >
            Explore how PKPs integrate with popular web3 libraries like Viem for enhanced functionality.
          </p>
        </div>

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
    </>
  );
}; 