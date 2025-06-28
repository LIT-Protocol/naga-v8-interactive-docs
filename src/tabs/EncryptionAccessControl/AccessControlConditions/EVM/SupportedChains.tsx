import React, { useState } from "react";
import { LIT_CHAINS_KEYS, LIT_CHAINS } from "@lit-protocol/constants";
import { DisplayCode } from "../../../../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../../../../components/layout/GreyboardWhiteBgContainer";
import { pageStyles } from "../../../../styles/pageStyles";
import { NoteCallout } from "../../../../components/common";
import EVMChainsSelector from "../../../../components/EVMChainsSelector";

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

const SupportedEVMChains: React.FC = () => {
  const [selectedChain, setSelectedChain] = useState<string>("");
  const [selectedChainInfo, setSelectedChainInfo] = useState<EVMChain | null>(
    null
  );

  const handleChainSelect = (chainKey: string, chainInfo: EVMChain) => {
    setSelectedChain(chainKey);
    setSelectedChainInfo(chainInfo);
  };

  // Get some popular chains for examples
  const popularChainKeys = [
    "yellowstone",
    "ethereum",
    "sepolia",
    "base",
    "polygon",
    "arbitrum",
    "optimism",
    "avalanche",
  ];

  const popularChains = popularChainKeys.map((chainKey) => {
    const chainData = (LIT_CHAINS as unknown as Record<string, any>)[chainKey];
    return {
      key: chainKey,
      name:
        chainData?.name || chainKey.charAt(0).toUpperCase() + chainKey.slice(1),
      symbol: chainData?.symbol || chainData?.nativeCurrency?.symbol || "ETH",
      chainId: chainData?.chainId || "Unknown",
    };
  });

  // Count total EVM chains
  const evmChainCount = Object.entries(LIT_CHAINS_KEYS).filter(
    ([, chainInfo]) => {
      const info = chainInfo as unknown as EVMChain;
      return info.vmType === "EVM" || !info.vmType;
    }
  ).length;

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>Supported EVM Chains</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Intro</h2>
        <p style={pageStyles.p}>
          Lit Protocol supports access control conditions across{" "}
          <strong>{evmChainCount} EVM-compatible blockchains</strong>. This
          means you can create conditions that check balances, token ownership,
          NFT holdings, and smart contract states across multiple networks.
        </p>
        <p style={pageStyles.p}>
          Each supported chain uses its native cryptocurrency for balance checks
          and can be referenced by its unique <strong>Lit Identifier</strong>{" "}
          when building Access Control Conditions.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Popular Chains</h2>
        <p style={pageStyles.p}>
          Here are some of the popular chains used for access control
          conditions:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "15px",
            marginTop: "20px",
          }}
        >
          {popularChains.map((chain) => (
            <div
              key={chain.key}
              style={{
                padding: "15px",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            >
              <h4 style={{ margin: "0 0 8px 0", color: "#1f2937" }}>
                {chain.name}
              </h4>
              <div style={{ fontSize: "0.9rem", color: "#4b5563" }}>
                <p style={{ margin: "4px 0" }}>
                  <strong>Chain ID:</strong> {chain.chainId}
                </p>
                <p style={{ margin: "4px 0" }}>
                  <strong>Native Token:</strong> {chain.symbol}
                </p>
                <p style={{ margin: "4px 0" }}>
                  <strong>Lit Identifier:</strong>{" "}
                  <code
                    style={{
                      fontSize: "0.8rem",
                      backgroundColor: "#f3f4f6",
                      padding: "2px 4px",
                      borderRadius: "3px",
                    }}
                  >
                    {chain.key}
                  </code>
                </p>
              </div>
            </div>
          ))}
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>All Supported Chains</h2>
        <p style={pageStyles.p}>
          Browse the complete list of supported EVM chains below. You can search
          by chain name, native token symbol, or chain ID to find specific
          networks.
        </p>

        <NoteCallout
          title="Lit Identifiers Usage"
          message={
            <>
              <p style={pageStyles.p}>
                When building access control conditions, use the{" "}
                <strong>Lit Identifier</strong> (shown in the code blocks below)
                with the <code>.on()</code> method.
              </p>
              <DisplayCode
                style={{ marginTop: "10px" }}
                code={`// Use the Lit Identifier with .on() method
const condition = createAccBuilder()
  .requireEthBalance('1000000000000000000', '>=')
  .on('chainkey') // Replace 'chainkey' with actual Lit Identifier
  .build();`}
                language="typescript"
                theme="dracula"
              />
            </>
          }
          variant="note"
          style={{ marginBottom: "20px" }}
        />

        <EVMChainsSelector
          variant="detailed"
          showSearch={true}
          onChainSelect={handleChainSelect}
          selectedChain={selectedChain}
        />

        {selectedChainInfo && (
          <div
            style={{
              marginTop: "20px",
              padding: "20px",
              backgroundColor: "#f0f9ff",
              borderRadius: "8px",
              border: "1px solid #007bff",
            }}
          >
            <h3 style={{ margin: "0 0 15px 0", color: "#0c4a6e" }}>
              Selected Chain: {selectedChainInfo.name || selectedChain}
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "15px",
              }}
            >
              <div>
                <h4 style={{ margin: "0 0 8px 0", color: "#1e40af" }}>
                  Basic Info
                </h4>
                <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>
                  <strong>Chain ID:</strong> {selectedChainInfo.chainId}
                </p>
                <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>
                  <strong>Native Token:</strong> {selectedChainInfo.symbol}
                </p>
                <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>
                  <strong>Decimals:</strong> {selectedChainInfo.decimals}
                </p>
              </div>
              <div>
                <h4 style={{ margin: "0 0 8px 0", color: "#1e40af" }}>
                  Usage in Code
                </h4>
                <DisplayCode
                  code={`// Example ETH balance condition
const condition = createAccBuilder()
  .requireEthBalance('1000000000000000000', '>=')
  .on('${selectedChain}')
  .build();`}
                  language="typescript"
                  theme="dracula"
                />
              </div>
            </div>
            {selectedChainInfo.blockExplorerUrls &&
              selectedChainInfo.blockExplorerUrls.length > 0 && (
                <div style={{ marginTop: "15px" }}>
                  <h4 style={{ margin: "0 0 8px 0", color: "#1e40af" }}>
                    Block Explorer
                  </h4>
                  <a
                    href={selectedChainInfo.blockExplorerUrls[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#0ea5e9",
                      textDecoration: "none",
                      fontSize: "0.9rem",
                    }}
                  >
                    {selectedChainInfo.blockExplorerUrls[0]} ↗
                  </a>
                </div>
              )}
          </div>
        )}
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default SupportedEVMChains;
