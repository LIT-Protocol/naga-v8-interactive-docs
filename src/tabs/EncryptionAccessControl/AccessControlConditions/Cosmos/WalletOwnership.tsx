import React, { useState } from "react";
import { createAccBuilder } from "@lit-protocol/access-control-conditions";
import { DisplayCode } from "../../../../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../../../../components/layout/GreyboardWhiteBgContainer";
import { pageStyles } from "../../../../styles/pageStyles";
import { Link } from "react-router-dom";

const CosmosWalletOwnership: React.FC = () => {
  const [selectedExample, setSelectedExample] =
    useState<string>("specific-wallet");
  const [walletAddress, setWalletAddress] = useState<string>("cosmos1...");
  const [builtConditions, setBuiltConditions] = useState<
    unknown[] | { error: string } | null
  >(null);

  // Example templates for different wallet ownership scenarios
  const getExamples = (address: string) => {
    return {
      "specific-wallet": {
        title: `Specific Wallet Ownership`,
        description: `Require ownership of a specific Cosmos wallet address`,
        builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  .requireCosmosWalletOwnership('${address}')
  .on('cosmos')
  .build();`,
        walletAddress: address,
      },
      "multiple-wallets": {
        title: `Multiple Wallets (OR Logic)`,
        description: `Require ownership of one of several specific Cosmos wallet addresses`,
        builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  .requireCosmosWalletOwnership('${address}')
  .on('cosmos')
  .or()
  .requireCosmosWalletOwnership('cosmos1456...')
  .on('cosmos')
  .build();`,
        walletAddress: address,
      },
    };
  };

  const examples = getExamples(walletAddress);

  const buildConditions = () => {
    try {
      const example = examples[selectedExample as keyof typeof examples];
      if (!example) return;

      let builder = createAccBuilder();

      // Add wallet ownership requirement based on selected example
      if (selectedExample === "specific-wallet") {
        builder = builder
          .requireCosmosWalletOwnership(walletAddress)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .on("cosmos" as any);
      } else if (selectedExample === "multiple-wallets") {
        builder = builder
          .requireCosmosWalletOwnership(walletAddress)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .on("cosmos" as any)
          .or()
          .requireCosmosWalletOwnership("cosmos1456...")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .on("cosmos" as any);
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
        Cosmos Wallet Ownership Access Control Conditions
      </h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Introduction</h2>
        <p style={pageStyles.p}>
          The <code>requireCosmosWalletOwnership</code> control condition lets
          you control access based on Cosmos wallet ownership.
        </p>
        <p style={pageStyles.p}>
          In the examples below, you'll see how to use the{" "}
          <code>requireCosmosWalletOwnership()</code> method to create access
          controls for specific Cosmos wallet addresses or multiple wallets
          using{" "}
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
        <h2 style={pageStyles.h2}>Cosmos Wallet Ownership Scenarios</h2>

        <p style={pageStyles.p}>
          Cosmos wallet ownership conditions can be configured in several ways
          depending on your access control needs:
        </p>

        {(() => {
          const scenarios = [
            {
              title: "Specific Cosmos Wallet",
              description:
                "Require ownership of a specific Cosmos wallet address",
              example: `.requireCosmosWalletOwnership(
  'cosmos1...'
).on('cosmos')`,
            },
            {
              title: "Multiple Wallets (OR Logic)",
              description:
                "Require ownership of one of several specific Cosmos wallet addresses",
              example: `.requireCosmosWalletOwnership(
  'cosmos1...'
).on('cosmos')
.or()
.requireCosmosWalletOwnership(
  'cosmos1456...'
).on('cosmos')`,
            },
            {
              title: "Combining with Other Conditions",
              description:
                "Combine wallet ownership with other access control conditions",
              example: `.requireCosmosWalletOwnership(
  'cosmos1...'
)
.on('cosmos')
.and()
.requireCosmosBalance(
  '1000'
).on('ethereum')`,
            },
          ];

          const cardStyle = {
            padding: "15px",
            backgroundColor: "#fff",
            borderRadius: "8px",
            border: "1px solid #007bff",
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box" as const,
            overflow: "hidden",
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
                width: "100%",
                maxWidth: "100%",
                boxSizing: "border-box",
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
                    style={{
                      marginTop: "8px",
                      maxWidth: "100%",
                      overflow: "auto",
                    }}
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
          Provide a Cosmos wallet address and choose an ownership scenario to
          explore wallet ownership conditions:
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
                    {/* Wallet Address Input */}
                    <div style={{ marginBottom: "20px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: "500",
                        }}
                      >
                        Cosmos Wallet Address:
                      </label>
                      <input
                        type="text"
                        placeholder="Enter Cosmos wallet address (cosmos1...)"
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
                        Bech32-encoded Cosmos address starting with "cosmos1"
                      </p>
                    </div>

                    {/* Scenario Selector */}
                    <div style={{ marginBottom: "20px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: "500",
                        }}
                      >
                        Choose a wallet ownership scenario:
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
                      disabled={!walletAddress.trim()}
                      style={{
                        padding: "10px 15px",
                        backgroundColor: !walletAddress.trim()
                          ? "#6b7280"
                          : "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: !walletAddress.trim()
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

export default CosmosWalletOwnership;
