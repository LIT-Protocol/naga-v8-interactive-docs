import React, { useState } from "react";
import { createAccBuilder } from "@lit-protocol/access-control-conditions";
import { DisplayCode } from "../../../../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../../../../components/layout/GreyboardWhiteBgContainer";
import { pageStyles } from "../../../../styles/pageStyles";

import { Link } from "react-router-dom";
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

const ERC721Ownership: React.FC = () => {
  const [selectedExample, setSelectedExample] =
    useState<string>("specific-nft");
  const [selectedChain, setSelectedChain] = useState<string>("ethereum");
  const [selectedChainInfo, setSelectedChainInfo] = useState<EVMChain | null>(
    null
  );
  const [includeWalletOwnership, setIncludeWalletOwnership] =
    useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [nftContractAddress, setNftContractAddress] =
    useState<string>("0x123...");
  const [tokenId, setTokenId] = useState<string>("42");
  const [builtConditions, setBuiltConditions] = useState<
    unknown[] | { error: string } | null
  >(null);

  const handleChainSelect = (chainKey: string, chainInfo: EVMChain) => {
    setSelectedChain(chainKey);
    setSelectedChainInfo(chainInfo);
    setNftContractAddress("0x123...");
  };

  // Example templates for different NFT ownership scenarios
  const getExamples = (
    chainKey: string,
    includeWallet: boolean,
    address: string,
    contractAddress: string,
    nftTokenId: string
  ) => {
    const walletOwnershipSection = includeWallet
      ? `.requireWalletOwnership('${address}')
  .on('${chainKey}')
  .and()
  `
      : "";

    const nftOwnershipDescription = includeWallet
      ? ` AND own the specified NFT`
      : "";

    const combinedDescription = includeWallet
      ? `Require wallet ownership${nftOwnershipDescription}`
      : `Require users to own the specified NFT`;

    return {
      "specific-nft": {
        title: `Specific NFT Ownership`,
        description: `${combinedDescription} (specific token ID #${nftTokenId})`,
        builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  ${walletOwnershipSection}.requireNftOwnership('${contractAddress}', '${nftTokenId}')
  .on('${chainKey}')
  .build();`,
        contractAddress,
        tokenId: nftTokenId,
      },
      "any-nft": {
        title: `Any NFT from Collection`,
        description: `${combinedDescription.replace(
          "the specified NFT",
          "any NFT from the collection"
        )}`,
        builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  ${walletOwnershipSection}.requireNftOwnership('${contractAddress}')
  .on('${chainKey}')
  .build();`,
        contractAddress,
        tokenId: null,
      },
    };
  };

  const examples = getExamples(
    selectedChain,
    includeWalletOwnership,
    walletAddress,
    nftContractAddress,
    tokenId
  );

  const buildConditions = () => {
    try {
      const example = examples[selectedExample as keyof typeof examples];
      if (!example) return;

      let builder = createAccBuilder();

      // Add wallet ownership requirement if enabled
      if (includeWalletOwnership) {
        builder = builder
          .requireWalletOwnership(walletAddress)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .on(selectedChain as any)
          .and();
      }

      // Add NFT ownership requirement based on selected example
      if (selectedExample === "specific-nft") {
        builder = builder
          .requireNftOwnership(nftContractAddress, tokenId)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .on(selectedChain as any);
      } else if (selectedExample === "any-nft") {
        builder = builder
          .requireNftOwnership(nftContractAddress)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .on(selectedChain as any);
      }

      const conditions = builder.build();
      setBuiltConditions(conditions);
    } catch (error) {
      console.error("Error building conditions:", error);
      setBuiltConditions({ error: (error as Error).message });
    }
  };

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>
        ERC721 NFT Ownership Access Control Conditions
      </h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Introduction</h2>
        <p style={pageStyles.p}>
          The <code>requireNftOwnership</code> control condition lets you
          control access based on ERC-721 NFT ownership on any of the{" "}
          <Link
            to="/encryption/access-control/evm/supported-chains"
            style={{ color: "#007bff", textDecoration: "underline" }}
          >
            supported EVM-based blockchains
          </Link>
          .
        </p>
        <p style={pageStyles.p}>
          In the examples below, you'll see how to use the{" "}
          <code>requireNftOwnership()</code> method to create ownership checks
          for specific NFTs, any NFT from a collection, or multiple NFTs using{" "}
          <Link
            to="/encryption/access-control/boolean-logic"
            style={{ color: "#007bff", textDecoration: "underline" }}
          >
            Boolean Logic
          </Link>
          .
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>NFT Ownership Scenarios</h2>

        <p style={pageStyles.p}>
          NFT ownership conditions can be configured in several ways depending
          on your access control needs:
        </p>

        {(() => {
          const scenarios = [
            {
              title: "Specific NFT",
              description:
                "Require ownership of a specific token ID within a collection",
              example: ".requireNftOwnership('0x123...', '42')",
            },
            {
              title: "Any NFT from Collection",
              description:
                "Require ownership of any NFT from the specified collection",
              example: ".requireNftOwnership('0x123...')",
            },
            {
              title: "Multiple NFTs (OR Logic)",
              description: "Require ownership of one of several specific NFTs",
              example: `.requireNftOwnership('0x123...', '42')
.or()
.requireNftOwnership('0x123...', '43')`,
            },
            {
              title: "Multiple Collections",
              description: "Require ownership from different NFT collections",
              example: `.requireNftOwnership('0x123...')
.or()
.requireNftOwnership('0x456...')`,
            },
          ];

          const cardStyle = {
            padding: "15px",
            backgroundColor: "#fff",
            borderRadius: "8px",
            border: "1px solid #007bff",
          };

          const titleStyle = {
            margin: "0 0 8px 0",
            color: "#0c4a6e",
          };

          const descriptionStyle = {
            margin: "0 0 8px 0",
            fontSize: "0.9rem",
            color: "#0c4a6e",
          };

          return (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "15px",
                marginBottom: "20px",
              }}
            >
              {scenarios.map((scenario, index) => (
                <div key={index} style={cardStyle}>
                  <h4 style={titleStyle}>{scenario.title}</h4>
                  <p style={descriptionStyle}>{scenario.description}</p>
                  <DisplayCode
                    code={scenario.example}
                    language="typescript"
                    theme="dracula"
                    style={{ marginTop: "8px" }}
                  />
                </div>
              ))}
            </div>
          );
        })()}
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Interactive Examples</h2>
        <p style={pageStyles.p}>
          Select a chain, provide an NFT contract address, and choose an
          ownership scenario to explore ERC721 NFT ownership conditions:
        </p>

        {/* Selected Example Display */}
        {selectedExample &&
          examples[selectedExample as keyof typeof examples] && (
            <div>
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  color: "#374151",
                  marginTop: "24px",
                  marginBottom: "12px",
                }}
              >
                {examples[selectedExample as keyof typeof examples]?.title ||
                  ""}
              </h3>
              <p style={pageStyles.p}>
                {examples[selectedExample as keyof typeof examples]
                  ?.description || ""}
              </p>

              {/* Builder Code */}
              <DisplayCode
                code={
                  examples[selectedExample as keyof typeof examples]
                    ?.builderCode || ""
                }
                language="typescript"
                renderComponent={
                  <>
                    {/* Wallet Ownership Toggle */}
                    <div style={{ marginBottom: "20px" }}>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                          fontWeight: "500",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={includeWalletOwnership}
                          onChange={(e) =>
                            setIncludeWalletOwnership(e.target.checked)
                          }
                          style={{
                            marginRight: "8px",
                            transform: "scale(1.2)",
                          }}
                        />
                        Include Wallet Ownership Requirement
                      </label>
                      <p
                        style={{
                          fontSize: "0.9rem",
                          color: "#6b7280",
                          margin: "5px 0 0 25px",
                        }}
                      >
                        When enabled, adds a wallet ownership check using .and()
                        operator
                      </p>
                    </div>

                    {/* Wallet Address Input */}
                    {includeWalletOwnership && (
                      <div style={{ marginBottom: "20px" }}>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "8px",
                            fontWeight: "500",
                          }}
                        >
                          Wallet Address:
                        </label>
                        <input
                          type="text"
                          placeholder="Enter wallet address (0x...)"
                          value={walletAddress}
                          onChange={(e) => setWalletAddress(e.target.value)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "4px",
                            border: "1px solid #d1d5db",
                            fontSize: "14px",
                            width: "100%",
                            fontFamily: "monospace",
                          }}
                        />
                        <p
                          style={{
                            fontSize: "0.8rem",
                            color: "#6b7280",
                            margin: "5px 0 0 0",
                          }}
                        >
                          Required when wallet ownership is enabled
                        </p>
                      </div>
                    )}

                    {/* NFT Contract Address Input */}
                    <div style={{ marginBottom: "20px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: "500",
                        }}
                      >
                        NFT Contract Address:
                      </label>
                      <input
                        type="text"
                        placeholder="Enter ERC721 NFT contract address (0x...)"
                        value={nftContractAddress}
                        onChange={(e) => setNftContractAddress(e.target.value)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "4px",
                          border: "1px solid #d1d5db",
                          fontSize: "14px",
                          width: "100%",
                          fontFamily: "monospace",
                        }}
                      />
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "#6b7280",
                          margin: "5px 0 0 0",
                        }}
                      >
                        The contract address of the ERC721 NFT collection
                      </p>
                    </div>

                    {/* Token ID Input - only show for specific NFT scenarios */}
                    {selectedExample === "specific-nft" && (
                      <div style={{ marginBottom: "20px" }}>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "8px",
                            fontWeight: "500",
                          }}
                        >
                          Token ID:
                        </label>
                        <input
                          type="text"
                          placeholder="Enter NFT token ID (e.g., 42)"
                          value={tokenId}
                          onChange={(e) => setTokenId(e.target.value)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "4px",
                            border: "1px solid #d1d5db",
                            fontSize: "14px",
                            width: "100%",
                            fontFamily: "monospace",
                          }}
                        />
                        <p
                          style={{
                            fontSize: "0.8rem",
                            color: "#6b7280",
                            margin: "5px 0 0 0",
                          }}
                        >
                          The specific NFT token ID to check ownership for
                        </p>
                      </div>
                    )}

                    {/* Ownership Scenario Selector */}
                    <div style={{ marginBottom: "20px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: "500",
                        }}
                      >
                        Choose an ownership scenario:
                      </label>
                      <select
                        value={selectedExample}
                        onChange={(e) => setSelectedExample(e.target.value)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "4px",
                          border: "1px solid #d1d5db",
                          fontSize: "14px",
                          width: "100%",
                        }}
                      >
                        {Object.entries(examples).map(([key, example]) => (
                          <option key={key} value={key}>
                            {example?.title || ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Chain Selector */}
                    <div style={{ marginBottom: "20px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: "500",
                        }}
                      >
                        Select Chain:
                      </label>
                      <EVMChainsSelector
                        variant="compact"
                        showSearch={true}
                        onChainSelect={handleChainSelect}
                        selectedChain={selectedChain}
                      />
                      {selectedChainInfo && (
                        <div
                          style={{
                            marginTop: "10px",
                            padding: "10px",
                            backgroundColor: "#f0f9ff",
                            borderRadius: "6px",
                            border: "1px solid #007bff",
                            fontSize: "0.9rem",
                          }}
                        >
                          <strong>{selectedChainInfo.name}</strong> •{" "}
                          {selectedChainInfo.symbol} • Chain ID:{" "}
                          {selectedChainInfo.chainId}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={buildConditions}
                      disabled={
                        (includeWalletOwnership && !walletAddress.trim()) ||
                        !nftContractAddress.trim() ||
                        (selectedExample === "specific-nft" && !tokenId.trim())
                      }
                      style={{
                        padding: "10px 15px",
                        backgroundColor:
                          (includeWalletOwnership && !walletAddress.trim()) ||
                          !nftContractAddress.trim() ||
                          (selectedExample === "specific-nft" &&
                            !tokenId.trim())
                            ? "#6b7280"
                            : "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor:
                          (includeWalletOwnership && !walletAddress.trim()) ||
                          !nftContractAddress.trim() ||
                          (selectedExample === "specific-nft" &&
                            !tokenId.trim())
                            ? "not-allowed"
                            : "pointer",
                        fontWeight: "500",
                        width: "100%",
                      }}
                    >
                      Build Conditions
                    </button>
                  </>
                }
                resultData={builtConditions}
                resultLabel="Built Access Control Conditions"
                useSideBySide={true}
                theme="dracula"
                isSuccess={Boolean(
                  builtConditions && !("error" in builtConditions)
                )}
              />
            </div>
          )}
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default ERC721Ownership;
