/**
 * PKPInfoCard Component
 * 
 * Displays PKP wallet information including balance and addresses
 */

import React, { useState } from 'react';
import { PkpInfo, BalanceInfo } from '../../types';
import { formatPublicKey, copyToClipboard } from '../../utils';

interface PKPInfoCardProps {
  selectedPkp: PkpInfo | null;
  balance: BalanceInfo | null;
  isLoadingBalance: boolean;
  selectedChain: string;
  onShowPkpModal: () => void;
}

export const PKPInfoCard: React.FC<PKPInfoCardProps> = ({
  selectedPkp,
  balance,
  isLoadingBalance,
  selectedChain,
  onShowPkpModal,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (text: string, fieldName: string) => {
    await copyToClipboard(text, setCopiedField, fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!selectedPkp) {
    return (
      <div
        style={{
          padding: "16px",
          backgroundColor: "#fff3cd",
          border: "1px solid #ffeaa7",
          borderRadius: "6px",
          marginBottom: "16px",
        }}
      >
        <div style={{ color: "#856404", fontSize: "14px" }}>
          No PKP selected. Click below to select a PKP wallet.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: "white",
        borderRadius: "6px",
        border: "1px solid #dee2e6",
        marginBottom: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <h4 style={{ margin: 0, color: "#495057", fontSize: "14px" }}>
          Selected PKP Wallet
        </h4>
        <button
          onClick={onShowPkpModal}
          style={{
            padding: "6px 12px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "11px",
          }}
        >
          Change PKP
        </button>
      </div>

      <div style={{ display: "grid", gap: "8px", fontSize: "11px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "90px 1fr",
            gap: "8px",
            alignItems: "center",
          }}
        >
          <strong>Token ID:</strong>
          <span
            style={{
              fontFamily: "monospace",
              cursor: "pointer",
              padding: "2px 6px",
              borderRadius: "4px",
              backgroundColor: copiedField === "tokenId" ? "#dcfce7" : "#f8f9fa",
              border: "1px solid " + (copiedField === "tokenId" ? "#bbf7d0" : "#e9ecef"),
              transition: "all 0.2s",
              display: "inline-block",
            }}
            onClick={() => handleCopy(selectedPkp.tokenId || "", "tokenId")}
            title="Click to copy Token ID"
          >
            {copiedField === "tokenId" ? "✅ Copied!" : selectedPkp.tokenId || "N/A"}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "90px 1fr",
            gap: "8px",
            alignItems: "center",
          }}
        >
          <strong>ETH Address:</strong>
          <span
            style={{
              fontFamily: "monospace",
              cursor: "pointer",
              padding: "2px 6px",
              borderRadius: "4px",
              backgroundColor: copiedField === "ethAddress" ? "#dcfce7" : "#f8f9fa",
              border: "1px solid " + (copiedField === "ethAddress" ? "#bbf7d0" : "#e9ecef"),
              transition: "all 0.2s",
              display: "inline-block",
            }}
            onClick={() => handleCopy(selectedPkp.ethAddress || "", "ethAddress")}
            title="Click to copy ETH Address"
          >
            {copiedField === "ethAddress" ? "✅ Copied!" : selectedPkp.ethAddress || "N/A"}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "90px 1fr",
            gap: "8px",
            alignItems: "center",
          }}
        >
          <strong>Public Key:</strong>
          <span
            style={{
              fontFamily: "monospace",
              cursor: "pointer",
              padding: "2px 6px",
              borderRadius: "4px",
              backgroundColor: copiedField === "publicKey" ? "#dcfce7" : "#f8f9fa",
              border: "1px solid " + (copiedField === "publicKey" ? "#bbf7d0" : "#e9ecef"),
              transition: "all 0.2s",
              display: "inline-block",
            }}
            onClick={() => handleCopy(selectedPkp.publicKey || selectedPkp.pubkey || "", "publicKey")}
            title="Click to copy Public Key (full value)"
          >
            {copiedField === "publicKey"
              ? "✅ Copied!"
              : formatPublicKey(selectedPkp.publicKey || selectedPkp.pubkey || "")}
          </span>
        </div>

        {balance && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "90px 1fr",
              gap: "8px",
              alignItems: "center",
            }}
          >
            <strong>Balance:</strong>
            <div>
              <span style={{ fontFamily: "monospace", color: "#28a745" }}>
                {balance.balance} {balance.symbol}
              </span>{" "}
              <span style={{ color: "#6c757d" }}>
                (Chain ID: {balance.chainId})
              </span>
            </div>
          </div>
        )}

        {isLoadingBalance && (
          <div style={{ color: "#6c757d" }}>Loading balance...</div>
        )}
      </div>
    </div>
  );
}; 