import React, { useState } from "react";
import { createAccBuilder } from "@lit-protocol/access-control-conditions";
import { DisplayCode } from "../../../../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../../../../components/layout/GreyboardWhiteBgContainer";
import { pageStyles } from "../../../../styles/pageStyles";
import { NoteCallout } from "../../../../components/common";
import { Link } from "react-router-dom";

const CosmosBalance: React.FC = () => {
  const [selectedExample, setSelectedExample] =
    useState<string>("greater-equal");
  const [includeWalletOwnership, setIncludeWalletOwnership] =
    useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [builtConditions, setBuiltConditions] = useState<
    unknown[] | { error: string } | null
  >(null);

  // Convert ATOM to uATOM (1 ATOM = 1,000,000 uATOM)
  const atomToUatom = (atom: string): string => {
    const atomNumber = parseFloat(atom);
    if (isNaN(atomNumber)) return "0";
    return Math.floor(atomNumber * 1000000).toString();
  };

  // Example templates for the five comparison operators
  const getExamples = (includeWallet: boolean, address: string) => {
    // Calculate amounts in uATOM
    const pointOneATOM = atomToUatom("0.1"); // 0.1 ATOM
    const oneATOM = atomToUatom("1"); // 1 ATOM
    const fiveATOM = atomToUatom("5"); // 5 ATOM
    const tenATOM = atomToUatom("10"); // 10 ATOM

    const walletOwnershipSection = includeWallet
      ? `.requireCosmosWalletOwnership('${address}')
  .on('cosmos')
  .and()
  `
      : "";

    const cosmosBalanceDescription = includeWallet
      ? ` AND hold the specified ATOM balance`
      : "";

    const combinedDescription = includeWallet
      ? `Require wallet ownership${cosmosBalanceDescription}`
      : `Require users to hold the specified ATOM balance`;

    return {
      "greater-equal": {
        title: `>= (Greater Than or Equal)`,
        description: `${combinedDescription} (at least 0.1 ATOM)`,
        builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  ${walletOwnershipSection}.requireCosmosBalance('${pointOneATOM}', '>=') // 0.1 ATOM in uATOM
  .on('cosmos')
  .build();`,
        amount: pointOneATOM,
        comparator: ">=" as const,
      },
      "greater-than": {
        title: `> (Greater Than)`,
        description: `${combinedDescription} (more than 1 ATOM)`,
        builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  ${walletOwnershipSection}.requireCosmosBalance('${oneATOM}', '>') // More than 1 ATOM in uATOM
  .on('cosmos')
  .build();`,
        amount: oneATOM,
        comparator: ">" as const,
      },
      "equal-to": {
        title: `= (Equal To)`,
        description: `${combinedDescription} (exactly 5 ATOM)`,
        builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  ${walletOwnershipSection}.requireCosmosBalance('${fiveATOM}', '=') // Exactly 5 ATOM in uATOM
  .on('cosmos')
  .build();`,
        amount: fiveATOM,
        comparator: "=" as const,
      },
      "less-equal": {
        title: `<= (Less Than or Equal)`,
        description: `${combinedDescription} (at most 10 ATOM)`,
        builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  ${walletOwnershipSection}.requireCosmosBalance('${tenATOM}', '<=') // Max 10 ATOM in uATOM
  .on('cosmos')
  .build();`,
        amount: tenATOM,
        comparator: "<=" as const,
      },
      "less-than": {
        title: `< (Less Than)`,
        description: `${combinedDescription} (less than 5 ATOM)`,
        builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  ${walletOwnershipSection}.requireCosmosBalance('${fiveATOM}', '<') // Less than 5 ATOM in uATOM
  .on('cosmos')
  .build();`,
        amount: fiveATOM,
        comparator: "<" as const,
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
          .requireCosmosWalletOwnership(walletAddress)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .on("cosmos" as any)
          .and();
      }

      // Add Cosmos balance requirement
      builder = builder
        .requireCosmosBalance(example.amount, example.comparator)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on("cosmos" as any);

      const conditions = builder.build();
      setBuiltConditions(conditions);
    } catch (error) {
      console.error("Error building conditions:", error);
      setBuiltConditions({ error: (error as Error).message });
    }
  };

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>Cosmos Balance Access Control Conditions</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Introduction</h2>
        <p style={pageStyles.p}>
          The <code>requireCosmosBalance</code> control condition lets you
          control access based on the ATOM balance in a user's Cosmos wallet.
          This is useful for creating conditions that require users to hold a
          minimum, maximum, or exact amount of ATOM before they can access
          encrypted content.
        </p>
        <p style={pageStyles.p}>
          In the examples below, you'll see how to use the{" "}
          <code>requireCosmosBalance()</code> method to create ATOM balance
          checks that can be combined with other conditions using{" "}
          <Link
            to="/encryption/access-control/boolean-logic"
            style={{ color: "#007bff", textDecoration: "underline" }}
          >
            Boolean Logic
          </Link>{" "}
          and{" "}
          <Link
            to="/encryption/access-control/comparison-operators"
            style={{ color: "#007bff", textDecoration: "underline" }}
          >
            Comparison Operators
          </Link>
          .
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Cosmos Balance Scenarios</h2>

        <p style={pageStyles.p}>
          Cosmos balance conditions can be configured in several ways depending
          on your access control needs:
        </p>

        {(() => {
          const scenarios = [
            {
              title: "Minimum ATOM Balance",
              description:
                "Require users to hold at least a specific amount of ATOM",
              example: `.requireCosmosBalance(
  '100000',
  '>='
)`,
            },
            {
              title: "Maximum ATOM Balance",
              description:
                "Require users to hold at most a specific amount of ATOM",
              example: `.requireCosmosBalance(
  '10000000',
  '<='
)`,
            },
            {
              title: "Exact ATOM Balance",
              description:
                "Require users to hold exactly a specific amount of ATOM",
              example: `.requireCosmosBalance(
  '5000000',
  '='
)`,
            },
            {
              title: "Exclusive Access",
              description: "Require users to hold less than a specific amount",
              example: `.requireCosmosBalance(
  '1000000',
  '<'
)`,
            },
            {
              title: "Balance Range",
              description:
                "Combine conditions to require a balance within a specific range",
              example: `.requireCosmosBalance('1000000', '>=')
.on('cosmos')
.and()
.requireCosmosBalance('10000000', '<=')`,
            },
            {
              title: "Multiple Balance Tiers",
              description:
                "Use OR logic to create multiple acceptable balance tiers",
              example: `.requireCosmosBalance('1000000', '>=')
.on('cosmos')
.or()
.requireCosmosBalance('100000000', '>=')`,
            },
          ];

          const cardStyle = {
            padding: "20px",
            backgroundColor: "#fff",
            borderRadius: "8px",
            border: "1px solid #007bff",
            marginBottom: "20px",
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box" as const,
            overflow: "hidden",
          };

          const titleStyle = {
            margin: "0 0 12px 0",
            color: "#0c4a6e",
            fontSize: "1.3rem",
            fontWeight: "600",
          };

          const descriptionStyle = {
            margin: "0 0 16px 0",
            fontSize: "1rem",
            color: "#0c4a6e",
          };

          return (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
              }}
            >
              {scenarios.map((scenario, index) => (
                <div key={index} style={cardStyle}>
                  <h3 style={titleStyle}>{scenario.title}</h3>
                  <p style={descriptionStyle}>{scenario.description}</p>

                  <h4 style={{ margin: "16px 0 8px 0", color: "#374151" }}>
                    Example Usage:
                  </h4>
                  <DisplayCode
                    code={scenario.example}
                    language="typescript"
                    theme="dracula"
                    style={{ margin: 0, overflow: "auto" }}
                  />
                </div>
              ))}
            </div>
          );
        })()}

        <NoteCallout
          title="Amount Format"
          message={
            <>
              <p style={pageStyles.p}>
                All amounts must be specified in <strong>uATOM</strong>, the{" "}
                <strong>smallest unit of ATOM</strong>. 1 ATOM = 1,000,000
                uATOM.
              </p>
              <p style={pageStyles.p}>
                Convert ATOM amounts to uATOM before using them:
                <DisplayCode
                  style={{ marginTop: "10px" }}
                  code={`// Convert ATOM to uATOM
const uatom = Math.floor(1.5 * 1000000).toString(); // 1.5 ATOM`}
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
          Select a comparison operator to explore Cosmos balance conditions:
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
                              <code>.and()</code>. For Cosmos wallet ownership,
                              the chain should be set to <code>cosmos</code>.
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
                          placeholder="Enter Cosmos wallet address"
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

export default CosmosBalance;
