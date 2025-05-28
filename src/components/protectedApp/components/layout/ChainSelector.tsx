/**
 * ChainSelector Component
 * 
 * Reusable chain/network selector component
 */

import React from 'react';
import { SUPPORTED_CHAINS } from '../../utils/chains';

interface ChainSelectorProps {
  selectedChain: string;
  onChainChange: (chain: string) => void;
  disabled?: boolean;
}

export const ChainSelector: React.FC<ChainSelectorProps> = ({
  selectedChain,
  onChainChange,
  disabled = false,
}) => {
  return (
    <div style={{ marginBottom: "12px" }}>
      <label
        style={{
          display: "block",
          marginBottom: "6px",
          fontSize: "11px",
          fontWeight: "600",
          color: "#374151",
        }}
      >
        🔗 Network:
      </label>
      <select
        value={selectedChain}
        onChange={(e) => onChainChange(e.target.value)}
        disabled={disabled}
        style={{
          width: "100%",
          padding: "8px 12px",
          border: "1px solid #d1d5db",
          borderRadius: "6px",
          fontSize: "11px",
          color: disabled ? "#9ca3af" : "black",
          backgroundColor: disabled ? "#f3f4f6" : "white",
          cursor: disabled ? "not-allowed" : "pointer",
          outline: "none",
        }}
      >
        {Object.entries(SUPPORTED_CHAINS).map(([key, chain]) => (
          <option key={key} value={key}>
            {chain.name} ({chain.symbol})
            {chain.testnet ? " - Testnet" : ""}
          </option>
        ))}
      </select>
      <div
        style={{
          fontSize: "10px",
          color: "#6b7280",
          marginTop: "4px",
          lineHeight: "1.3",
        }}
      >
        💡 Switch networks to check balances and send transactions on different chains.
        {SUPPORTED_CHAINS[selectedChain as keyof typeof SUPPORTED_CHAINS]?.testnet && (
          <span style={{ color: "#f59e0b" }}> This is a testnet.</span>
        )}
      </div>
    </div>
  );
}; 