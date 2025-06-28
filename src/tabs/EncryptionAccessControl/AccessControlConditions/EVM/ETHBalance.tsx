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

const ETHBalance: React.FC = () => {
  const [selectedExample, setSelectedExample] =
    useState<string>("greater-equal");
  const [selectedChain, setSelectedChain] = useState<string>("ethereum");
  const [selectedChainInfo, setSelectedChainInfo] = useState<EVMChain | null>(
    null
  );
  const [includeWalletOwnership, setIncludeWalletOwnership] =
    useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [builtConditions, setBuiltConditions] = useState<
    unknown[] | { error: string } | null
  >(null);

  const handleChainSelect = (chainKey: string, chainInfo: EVMChain) => {
    setSelectedChain(chainKey);
    setSelectedChainInfo(chainInfo);
  };

  // Example templates for the four comparison operators
  const getExamples = (
    chainKey: string,
    chainSymbol: string,
    includeWallet: boolean,
    address: string
  ) => {
    const walletOwnershipSection = includeWallet
      ? `.requireWalletOwnership('${address}')
  .on('${chainKey}')
  .and()
  `
      : "";

    const ethBalanceDescription = includeWallet
      ? ` AND hold the specified ${chainSymbol} balance`
      : "";

    const combinedDescription = includeWallet
      ? `Require wallet ownership${ethBalanceDescription}`
      : `Require users to hold the specified ${chainSymbol} balance`;

    return {
      "greater-equal": {
        title: `>= (Greater Than or Equal)`,
        description: `${combinedDescription} (at least 0.1 ${chainSymbol})`,
        builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  ${walletOwnershipSection}.requireEthBalance('100000000000000000', '>=') // 0.1 ${chainSymbol} in wei
  .on('${chainKey}')
  .build();`,
        amount: "100000000000000000",
        comparator: ">=" as const,
      },
      "greater-than": {
        title: `> (Greater Than)`,
        description: `${combinedDescription} (more than 1 ${chainSymbol})`,
        builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  ${walletOwnershipSection}.requireEthBalance('1000000000000000000', '>') // More than 1 ${chainSymbol}
  .on('${chainKey}')
  .build();`,
        amount: "1000000000000000000",
        comparator: ">" as const,
      },
      "equal-to": {
        title: `= (Equal To)`,
        description: `${combinedDescription} (exactly 5 ${chainSymbol})`,
        builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  ${walletOwnershipSection}.requireEthBalance('5000000000000000000', '=') // Exactly 5 ${chainSymbol}
  .on('${chainKey}')
  .build();`,
        amount: "5000000000000000000",
        comparator: "=" as const,
      },
      "less-equal": {
        title: `<= (Less Than or Equal)`,
        description: `${combinedDescription} (at most 10 ${chainSymbol})`,
        builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  ${walletOwnershipSection}.requireEthBalance('10000000000000000000', '<=') // Max 10 ${chainSymbol}
  .on('${chainKey}')
  .build();`,
        amount: "10000000000000000000",
        comparator: "<=" as const,
      },
    };
  };

  const examples = getExamples(
    selectedChain,
    selectedChainInfo?.symbol || "ETH",
    includeWalletOwnership,
    walletAddress
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

      // Add ETH balance requirement
      builder = builder
        .requireEthBalance(example.amount, example.comparator)
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
      <h1 style={pageStyles.h1}>ETH Balance Access Control Conditions</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Introduction</h2>
        <p style={pageStyles.p}>
          The <code>requireEthBalance</code> control condition lets you control
          access based on how much of a native token a user holds on any of the{" "}
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
          <code>requireEthBalance()</code> method to create balance checks using
          different chains, amounts, and comparison operators.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Comparison Operators</h2>

        <p style={pageStyles.p}>
          The comparison operator is an optional parameter, if not provided the
          <code>requireEthBalance</code> control condition will default to{" "}
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
          title="Make sure to specify units of ETH in Wei"
          message={
            <>
              <p style={pageStyles.p}>
                All amounts of ETH must be specified in{" "}
                <strong>wei (smallest unit)</strong>. 1 ETH =
                1,000,000,000,000,000,000 wei (10^18).
              </p>
              <p style={pageStyles.p}>
                Make sure to convert ETH to wei before using it in the
                condition:
                <DisplayCode
                  style={{ marginTop: "10px" }}
                  code={`import { parseEther } from 'viem';
const weiAmount = parseEther("1.5").toString(); // Converts 1.5 ETH to wei representation`}
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
          Select a chain and comparison operator to explore ETH balance
          conditions:
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
                      disabled={includeWalletOwnership && !walletAddress.trim()}
                      style={{
                        padding: "10px 15px",
                        backgroundColor:
                          includeWalletOwnership && !walletAddress.trim()
                            ? "#6b7280"
                            : "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor:
                          includeWalletOwnership && !walletAddress.trim()
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

export default ETHBalance;
