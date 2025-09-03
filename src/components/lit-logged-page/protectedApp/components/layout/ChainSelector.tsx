/**
 * ChainSelector Component
 *
 * Reusable chain/network selector component
 */

import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown } from "lucide-react";
import { SUPPORTED_CHAINS } from "../../utils/chains";

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
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild disabled={disabled}>
        <button
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 10px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            background: disabled ? "#f3f4f6" : "white",
            color: disabled ? "#9ca3af" : "#374151",
            cursor: disabled ? "not-allowed" : "pointer",
            fontSize: "12px",
            fontWeight: 600,
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          {(() => {
            const chain =
              SUPPORTED_CHAINS[selectedChain as keyof typeof SUPPORTED_CHAINS];
            return chain
              ? `${chain.name} (${chain.symbol})${
                  chain.testnet ? " - Testnet" : ""
                }`
              : selectedChain;
          })()}
          <ChevronDown size={14} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={6}
          align="start"
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "6px",
            boxShadow:
              "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
            minWidth: 260,
            zIndex: 9999,
          }}
        >
          <DropdownMenu.RadioGroup
            value={selectedChain}
            onValueChange={(value) => onChainChange(value)}
          >
            {Object.entries(SUPPORTED_CHAINS).map(([key, chain]) => (
              <DropdownMenu.RadioItem
                key={key}
                value={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  cursor: "pointer",
                  color: "#111827",
                }}
              >
                {`${chain.name} (${chain.symbol})${
                  chain.testnet ? " - Testnet" : ""
                }`}
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
