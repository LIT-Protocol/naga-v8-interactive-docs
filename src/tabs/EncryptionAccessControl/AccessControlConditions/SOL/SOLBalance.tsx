import React, { useState } from "react";
import { createAccBuilder } from "@lit-protocol/access-control-conditions";
import { DisplayCode } from "../../../../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../../../../components/layout/GreyboardWhiteBgContainer";
import { pageStyles } from "../../../../styles/pageStyles";
import { NoteCallout } from "../../../../components/common";
import { Link } from "react-router-dom";

const SOLBalance: React.FC = () => {
  const [selectedExample, setSelectedExample] =
    useState<string>("greater-equal");
  const [includeWalletOwnership, setIncludeWalletOwnership] =
    useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [builtConditions, setBuiltConditions] = useState<
    unknown[] | { error: string } | null
  >(null);

  // Convert SOL to lamports (1 SOL = 1,000,000,000 lamports)
  const solToLamports = (sol: string): string => {
    const solNumber = parseFloat(sol);
    if (isNaN(solNumber)) return "0";
    return Math.floor(solNumber * 1000000000).toString();
  };

  // Example templates for the four comparison operators
  const getExamples = (includeWallet: boolean, address: string) => {
    // Calculate amounts in lamports
    const pointOneSOL = solToLamports("0.1"); // 0.1 SOL
    const oneSOL = solToLamports("1"); // 1 SOL
    const fiveSOL = solToLamports("5"); // 5 SOL
    const tenSOL = solToLamports("10"); // 10 SOL

    const walletOwnershipSection = includeWallet
      ? `.requireSolWalletOwnership('${address}')
  .on('solana')
  .and()
  `
      : "";

    const solBalanceDescription = includeWallet
      ? ` AND hold the specified SOL balance`
      : "";

    const combinedDescription = includeWallet
      ? `Require wallet ownership${solBalanceDescription}`
      : `Require users to hold the specified SOL balance`;

    return {
      "greater-equal": {
        title: `>= (Greater Than or Equal)`,
        description: `${combinedDescription} (at least 0.1 SOL)`,
        builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  ${walletOwnershipSection}.requireSolBalance('${pointOneSOL}', '>=') // 0.1 SOL in lamports
  .on('solana')
  .build();`,
        amount: pointOneSOL,
        comparator: ">=" as const,
      },
      "greater-than": {
        title: `> (Greater Than)`,
        description: `${combinedDescription} (more than 1 SOL)`,
        builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  ${walletOwnershipSection}.requireSolBalance('${oneSOL}', '>') // More than 1 SOL in lamports
  .on('solana')
  .build();`,
        amount: oneSOL,
        comparator: ">" as const,
      },
      "equal-to": {
        title: `= (Equal To)`,
        description: `${combinedDescription} (exactly 5 SOL)`,
        builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  ${walletOwnershipSection}.requireSolBalance('${fiveSOL}', '=') // Exactly 5 SOL in lamports
  .on('solana')
  .build();`,
        amount: fiveSOL,
        comparator: "=" as const,
      },
      "less-equal": {
        title: `<= (Less Than or Equal)`,
        description: `${combinedDescription} (at most 10 SOL)`,
        builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  ${walletOwnershipSection}.requireSolBalance('${tenSOL}', '<=') // Max 10 SOL in lamports
  .on('solana')
  .build();`,
        amount: tenSOL,
        comparator: "<=" as const,
      },
    };
  };

  const examples = getExamples(includeWalletOwnership, walletAddress);

  const buildConditions = () => {
    try {
      const example = examples[selectedExample as keyof typeof examples];
      if (!example || !("amount" in example) || !("comparator" in example))
        return;

      let builder = createAccBuilder();

      // Add wallet ownership requirement if enabled
      if (includeWalletOwnership) {
        builder = builder
          .requireSolWalletOwnership(walletAddress)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .on("solana" as any)
          .and();
      }

      // Add SOL balance requirement
      builder = builder
        .requireSolBalance(example.amount, example.comparator)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on("solana" as any);

      const conditions = builder.build();
      setBuiltConditions(conditions);
    } catch (error) {
      console.error("Error building conditions:", error);
      setBuiltConditions({ error: (error as Error).message });
    }
  };

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>SOL Balance Access Control Conditions</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Introduction</h2>
        <p style={pageStyles.p}>
          The <code>requireSolBalance</code> control condition lets you control
          access based on the SOL balance in a user's Solana wallet. This is
          useful for creating conditions that require users to hold a minimum,
          maximum, or exact amount of SOL before they can access encrypted
          content.
        </p>
        <p style={pageStyles.p}>
          In the examples below, you'll see how to use the{" "}
          <code>requireSolBalance()</code> method to create SOL balance checks
          that can be combined with other conditions using{" "}
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
        <h2 style={pageStyles.h2}>Comparison Operators</h2>

        <p style={pageStyles.p}>
          The comparison operator is an optional parameter, if not provided the
          <code>requireSolBalance</code> control condition will default to{" "}
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
          title="Lamports vs SOL"
          message={
            <>
              <p style={pageStyles.p}>
                All amounts must be specified in <strong>lamports</strong> (the
                smallest unit of SOL). 1 SOL = 1,000,000,000 lamports.
              </p>
              <p style={pageStyles.p}>
                Convert SOL amounts to lamports before using them:
                <DisplayCode
                  style={{ marginTop: "10px" }}
                  code={`// Convert SOL to lamports
const lamports = Math.floor(1.5 * 1000000000).toString(); // 1.5 SOL`}
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
          Select a comparison operator to explore SOL balance conditions:
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
                              wallet ownership check to enable chaining with{" "}
                              <code>.and()</code>. For Solana wallet ownership,
                              the chain should be set to <code>solana</code>.
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
                          placeholder="Enter Solana wallet address"
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

export default SOLBalance;
