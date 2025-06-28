import React, { useState } from "react";
import { createAccBuilder } from "@lit-protocol/access-control-conditions";
import { DisplayCode } from "../../../../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../../../../components/layout/GreyboardWhiteBgContainer";
import { pageStyles } from "../../../../styles/pageStyles";
import { NoteCallout } from "../../../../components/common";
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

const ERC20Balance: React.FC = () => {
  const [selectedExample, setSelectedExample] =
    useState<string>("greater-equal");
  const [selectedChain, setSelectedChain] = useState<string>("ethereum");
  const [selectedChainInfo, setSelectedChainInfo] = useState<EVMChain | null>(
    null
  );
  const [includeWalletOwnership, setIncludeWalletOwnership] =
    useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [tokenAddress, setTokenAddress] = useState<string>(
    "0xA0b86a33E6441c8C4dC2e8B0E4E5D8E6dAeF5E5C"
  );
  const [builtConditions, setBuiltConditions] = useState<
    unknown[] | { error: string } | null
  >(null);

  const handleChainSelect = (chainKey: string, chainInfo: EVMChain) => {
    setSelectedChain(chainKey);
    setSelectedChainInfo(chainInfo);
    // Update default token address based on chain
    if (chainKey === "polygon") {
      setTokenAddress("0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"); // USDC on Polygon
    } else if (chainKey === "ethereum") {
      setTokenAddress("0xA0b86a33E6441c8C4dC2e8B0E4E5D8E6dAeF5E5C"); // USDC on Ethereum
    } else {
      setTokenAddress("0x123..."); // Generic placeholder
    }
  };

  // Example templates for the four comparison operators
  const getExamples = (
    chainKey: string,
    includeWallet: boolean,
    address: string,
    contractAddress: string
  ) => {
    const walletOwnershipSection = includeWallet
      ? `.requireWalletOwnership('${address}')
  .on('${chainKey}')
  .and()
  `
      : "";

    const tokenBalanceDescription = includeWallet
      ? ` AND hold the specified token balance`
      : "";

    const combinedDescription = includeWallet
      ? `Require wallet ownership${tokenBalanceDescription}`
      : `Require users to hold the specified token balance of`;

    return {
      "greater-equal": {
        title: `>= (Greater Than or Equal)`,
        description: `${combinedDescription} at least 1 token`,
        builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  ${walletOwnershipSection}.requireTokenBalance('${contractAddress}', '1000000000000000000', '>=') // At least 1 token
  .on('${chainKey}')
  .build();`,
        amount: "100",
        comparator: ">=" as const,
      },
      "greater-than": {
        title: `> (Greater Than)`,
        description: `${combinedDescription} more than 1 token`,
        builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  ${walletOwnershipSection}.requireTokenBalance('${contractAddress}', '1000000', '>') // More than 1 token
  .on('${chainKey}')
  .build();`,
        amount: "1000",
        comparator: ">" as const,
      },
      "equal-to": {
        title: `= (Equal To)`,
        description: `${combinedDescription} exactly 1 token`,
        builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  ${walletOwnershipSection}.requireTokenBalance('${contractAddress}', '1000000', '=') // Exactly 1 token
  .on('${chainKey}')
  .build();`,
        amount: "500",
        comparator: "=" as const,
      },
      "less-equal": {
        title: `<= (Less Than or Equal)`,
        description: `${combinedDescription} at most 1 token`,
        builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  ${walletOwnershipSection}.requireTokenBalance('${contractAddress}', '1000000', '<=') // Max 1 token
  .on('${chainKey}')
  .build();`,
        amount: "5000",
        comparator: "<=" as const,
      },
    };
  };

  const examples = getExamples(
    selectedChain,
    includeWalletOwnership,
    walletAddress,
    tokenAddress
  );

  const buildConditions = () => {
    try {
      const example = examples[selectedExample as keyof typeof examples];
      if (!example || !("amount" in example) || !("comparator" in example))
        return;

      let builder = createAccBuilder();

      // Add wallet ownership requirement if enabled
      if (includeWalletOwnership) {
        builder = builder
          .requireWalletOwnership(walletAddress)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .on(selectedChain as any)
          .and();
      }

      // Add token balance requirement
      builder = builder
        .requireTokenBalance(tokenAddress, example.amount, example.comparator)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on(selectedChain as any);

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
        ERC20 Token Balance Access Control Conditions
      </h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Introduction</h2>
        <p style={pageStyles.p}>
          The <code>requireTokenBalance</code> control condition lets you
          control access based on how much of a specific ERC20 token a user
          holds on any of the{" "}
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
          <code>requireTokenBalance()</code> method to create balance checks
          using different chains, token contracts, amounts, and comparison
          operators.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Comparison Operators</h2>

        <p style={pageStyles.p}>
          The comparison operator is an optional parameter, if not provided the
          <code>requireTokenBalance</code> control condition will default to{" "}
          <code>=</code>, requiring the address to have exactly the specified
          amount.
        </p>

        {(() => {
          const operators = [
            {
              symbol: ">=",
              title: "Greater Than or Equal",
              description: (
                <>
                  Requires <strong>at least</strong> the specified amount
                </>
              ),
            },
            {
              symbol: ">",
              title: "Greater Than",
              description: (
                <>
                  Requires <strong>more than</strong> the specified amount
                </>
              ),
            },
            {
              symbol: "=",
              title: "Equal To",
              description: (
                <>
                  Requires <strong>exactly</strong> the specified amount
                </>
              ),
            },
            {
              symbol: "<=",
              title: "Less Than or Equal",
              description: (
                <>
                  Requires <strong>at most</strong> the specified amount
                </>
              ),
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
            margin: 0,
            fontSize: "0.9rem",
            color: "#0c4a6e",
          };

          return (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "15px",
                marginBottom: "20px",
              }}
            >
              {operators.map((operator) => (
                <div key={operator.symbol} style={cardStyle}>
                  <h4 style={titleStyle}>
                    {operator.symbol} ({operator.title})
                  </h4>
                  <p style={descriptionStyle}>{operator.description}</p>
                </div>
              ))}
            </div>
          );
        })()}

        <NoteCallout
          title="Token Decimals and Amounts"
          message={
            <>
              <p style={pageStyles.p}>
                When specifying token amounts, use the token’s{" "}
                <strong>base unit adjusted for its decimals</strong>.
              </p>
              <p style={pageStyles.p}>
                For example, a token with 18 decimals requires{" "}
                <code>1000000000000000000</code> to represent 1 full token, but
                a token with 6 decimals requires <code>1000000</code> to
                represent 1 full token.
              </p>
              <p style={pageStyles.p}>
                <DisplayCode
                  style={{ marginTop: "10px" }}
                  code={`// For 18 decimal tokens, 1 token = 1000000000000000000
.requireTokenBalance('0x123...', '1000000000000000000')

// For 6 decimal tokens, 1 token = 1000000
.requireTokenBalance('0x123...', '100000000')`}
                  language="typescript"
                  theme="dracula"
                />
              </p>
            </>
          }
          variant="note"
          style={{ marginBottom: "16px" }}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Interactive Examples</h2>
        <p style={pageStyles.p}>
          Select a chain, provide a token contract address, and choose a
          comparison operator to explore ERC20 token balance conditions:
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

                    {/* ACC Builder Syntax Callout */}
                    {includeWalletOwnership && (
                      <NoteCallout
                        title="Chaining Requires .on(chain)"
                        message={
                          <>
                            <p style={pageStyles.p}>
                              When enabling the wallet ownership requirement,
                              you must include <code>.on(chain)</code> after the
                              wallet ownership check to enable chaining with
                              <code>.and()</code>, however, the chain specified
                              by <code>.on(chain)</code> has no affect on the
                              validation process and should always be set to{" "}
                              <code>ethereum</code>.
                            </p>
                          </>
                        }
                        variant="note"
                        style={{ marginBottom: "20px" }}
                      />
                    )}

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

                    {/* Token Contract Address Input */}
                    <div style={{ marginBottom: "20px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: "500",
                        }}
                      >
                        Token Contract Address:
                      </label>
                      <input
                        type="text"
                        placeholder="Enter ERC20 token contract address (0x...)"
                        value={tokenAddress}
                        onChange={(e) => setTokenAddress(e.target.value)}
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
                        The contract address of the ERC20 token you want to
                        check
                      </p>
                    </div>

                    {/* Comparison Operator Selector */}
                    <div style={{ marginBottom: "20px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: "500",
                        }}
                      >
                        Choose a comparison operator:
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
                        !tokenAddress.trim()
                      }
                      style={{
                        padding: "10px 15px",
                        backgroundColor:
                          (includeWalletOwnership && !walletAddress.trim()) ||
                          !tokenAddress.trim()
                            ? "#6b7280"
                            : "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor:
                          (includeWalletOwnership && !walletAddress.trim()) ||
                          !tokenAddress.trim()
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

export default ERC20Balance;
