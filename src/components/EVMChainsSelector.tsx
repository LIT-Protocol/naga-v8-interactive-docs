import React, { useState, useMemo } from "react";
import { LIT_CHAINS_KEYS, LIT_CHAINS } from "@lit-protocol/constants";
import { pageStyles } from "../styles/pageStyles";

interface EVMChain {
  name: string;
  chainId: number | string;
  symbol: string;
  decimals: number;
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  vmType?: string;
  nativeCurrency?: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

interface EVMChainsSelectorProps {
  onChainSelect?: (chainKey: string, chainInfo: EVMChain) => void;
  selectedChain?: string;
  variant?: "compact" | "detailed";
  showSearch?: boolean;
}

const EVMChainsSelector: React.FC<EVMChainsSelectorProps> = ({
  onChainSelect,
  selectedChain,
  variant = "detailed",
  showSearch = true,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Get all supported EVM chains - use LIT_CHAINS_KEYS as base and get metadata when available
  const evmChains = useMemo(() => {
    // Use LIT_CHAINS as the primary source since it has the metadata

    return LIT_CHAINS_KEYS.map((chainKey) => {
      // Get metadata from LIT_CHAINS for this chain key
      const chainData = (LIT_CHAINS as Record<string, unknown>)[chainKey] as
        | Partial<EVMChain>
        | undefined;

      // Create chain info with metadata from LIT_CHAINS
      const chainInfo: EVMChain = {
        name:
          chainData?.name ||
          chainKey.charAt(0).toUpperCase() + chainKey.slice(1),
        chainId: chainData?.chainId || 0,
        symbol: chainData?.symbol || "ETH",
        decimals: chainData?.decimals || 18,
        rpcUrls: chainData?.rpcUrls || [],
        blockExplorerUrls: chainData?.blockExplorerUrls || [],
        vmType: chainData?.vmType || "EVM",
        nativeCurrency: chainData?.nativeCurrency,
      };

      return [chainKey, chainInfo] as [string, EVMChain];
    })
      .filter(([, chainInfo]) => {
        // Filter for EVM chains only
        return chainInfo.vmType === "EVM" || !chainInfo.vmType;
      })
      .sort(([a], [b]) => a.localeCompare(b)); // Sort alphabetically by chain key
  }, []);

  // Filter chains based on search term
  const filteredChains = useMemo(() => {
    if (!searchTerm.trim()) return evmChains;

    const term = searchTerm.toLowerCase();
    return evmChains.filter(([chainKey, chainInfo]) => {
      const info = chainInfo as EVMChain;
      const chainIdStr =
        typeof info.chainId === "number"
          ? info.chainId.toString()
          : info.chainId || "";
      return (
        chainKey.toLowerCase().includes(term) ||
        (info.name && info.name.toLowerCase().includes(term)) ||
        (info.symbol && info.symbol.toLowerCase().includes(term)) ||
        chainIdStr.includes(term)
      );
    });
  }, [evmChains, searchTerm]);

  const handleChainClick = (chainKey: string, chainInfo: EVMChain) => {
    if (onChainSelect) {
      onChainSelect(chainKey, chainInfo);
    }
  };

  // Get display name for chain
  const getDisplayName = (chainKey: string, chainInfo: EVMChain) => {
    // Use the chain name from LIT_CHAINS metadata
    if (
      chainInfo?.name &&
      typeof chainInfo.name === "string" &&
      chainInfo.name.trim() !== ""
    ) {
      return chainInfo.name;
    }
    // Fallback: Convert chain key to title case (e.g., "ethereum" -> "Ethereum")
    return chainKey.charAt(0).toUpperCase() + chainKey.slice(1);
  };

  // Get native currency symbol
  const getNativeCurrency = (chainInfo: EVMChain) => {
    // Try to get the symbol from chain metadata
    if (chainInfo.symbol && chainInfo.symbol.trim() !== "") {
      return chainInfo.symbol;
    }
    // For chains without symbol info, try to use the currency symbol
    if (chainInfo.nativeCurrency?.symbol) {
      return chainInfo.nativeCurrency.symbol;
    }
    return "ETH"; // Default fallback
  };

  // Get chain ID properly
  const getChainId = (chainInfo: EVMChain) => {
    if (
      chainInfo?.chainId &&
      typeof chainInfo.chainId === "number" &&
      chainInfo.chainId > 0
    ) {
      return chainInfo.chainId.toString();
    }
    if (
      chainInfo?.chainId &&
      typeof chainInfo.chainId === "string" &&
      chainInfo.chainId.trim() !== ""
    ) {
      return chainInfo.chainId;
    }
    return "Unknown";
  };

  if (variant === "compact") {
    return (
      <div>
        {showSearch && (
          <div style={{ marginBottom: "15px" }}>
            <input
              type="text"
              placeholder="Search chains..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                ...pageStyles.input,
                marginBottom: "0",
                fontSize: "14px",
              }}
            />
          </div>
        )}

        <div
          style={{
            maxHeight: "300px",
            overflowY: "auto",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
          }}
        >
          {filteredChains.map(([chainKey, chainInfo]) => {
            const info = chainInfo as unknown as EVMChain;
            const isSelected = selectedChain === chainKey;

            return (
              <div
                key={chainKey}
                onClick={() => handleChainClick(chainKey, info)}
                style={{
                  padding: "10px 15px",
                  borderBottom: "1px solid #f1f5f9",
                  cursor: onChainSelect ? "pointer" : "default",
                  backgroundColor: isSelected ? "#e0f2fe" : "white",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected && onChainSelect) {
                    e.currentTarget.style.backgroundColor = "#f8fafc";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "white";
                  }
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontWeight: "500", color: "#1f2937" }}>
                    {getDisplayName(chainKey, info)}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                    {getNativeCurrency(info)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredChains.length === 0 && (
          <div
            style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}
          >
            No chains found matching "{searchTerm}"
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {showSearch && (
        <div style={{ marginBottom: "20px" }}>
          <label style={{ ...pageStyles.label, marginBottom: "8px" }}>
            Search EVM Chains
          </label>
          <input
            type="text"
            placeholder="Search by name, symbol, or chain ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              ...pageStyles.input,
              marginBottom: "0",
            }}
          />
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "15px",
          maxHeight: "500px",
          overflowY: "auto",
          padding: "5px",
        }}
      >
        {filteredChains.map(([chainKey, chainInfo]) => {
          const info = chainInfo as unknown as EVMChain;
          const isSelected = selectedChain === chainKey;

          return (
            <div
              key={chainKey}
              onClick={() => handleChainClick(chainKey, info)}
              style={{
                padding: "15px",
                backgroundColor: isSelected ? "#e0f2fe" : "#f8fafc",
                borderRadius: "8px",
                border: `1px solid ${isSelected ? "#0ea5e9" : "#e2e8f0"}`,
                cursor: onChainSelect ? "pointer" : "default",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (onChainSelect) {
                  e.currentTarget.style.borderColor = "#0ea5e9";
                  e.currentTarget.style.backgroundColor = "#f0f9ff";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                }
              }}
            >
              <h4
                style={{
                  margin: "0 0 8px 0",
                  color: "#1f2937",
                  fontSize: "1rem",
                }}
              >
                {getDisplayName(chainKey, info)}
              </h4>

              <div
                style={{
                  fontSize: "0.9rem",
                  color: "#4b5563",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "4px",
                  }}
                >
                  <span>
                    <strong>Chain ID:</strong>
                  </span>
                  <span>{getChainId(info)}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "4px",
                  }}
                >
                  <span>
                    <strong>Native Token:</strong>
                  </span>
                  <span>{getNativeCurrency(info)}</span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>
                    <strong>Lit Identifier:</strong>
                  </span>
                  <code
                    style={{
                      fontSize: "0.8rem",
                      backgroundColor: "#f3f4f6",
                      padding: "2px 4px",
                      borderRadius: "3px",
                    }}
                  >
                    {chainKey}
                  </code>
                </div>
              </div>

              {info.blockExplorerUrls && info.blockExplorerUrls.length > 0 && (
                <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                  <a
                    href={info.blockExplorerUrls[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#0ea5e9",
                      textDecoration: "none",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Block Explorer ↗
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredChains.length === 0 && (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "#6b7280",
            backgroundColor: "#f8fafc",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
          }}
        >
          <h4 style={{ margin: "0 0 8px 0", color: "#374151" }}>
            No chains found
          </h4>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>
            No EVM chains match your search for "{searchTerm}"
          </p>
        </div>
      )}

      <div style={{ marginTop: "15px", fontSize: "0.9rem", color: "#6b7280" }}>
        Showing {filteredChains.length} of {evmChains.length} supported EVM
        chains
      </div>
    </div>
  );
};

export default EVMChainsSelector;
