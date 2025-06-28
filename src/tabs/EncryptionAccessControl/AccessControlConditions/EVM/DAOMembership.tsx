import React, { useState } from "react";
import { createAccBuilder } from "@lit-protocol/access-control-conditions";
import { DisplayCode } from "../../../../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../../../../components/layout/GreyboardWhiteBgContainer";
import { pageStyles } from "../../../../styles/pageStyles";
import { Link } from "react-router-dom";
import EVMChainsSelector from "../../../../components/EVMChainsSelector";
import { NoteCallout } from "../../../../components/common";
import WarningCallout from "../../../../components/common/WarningCallout";

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

const DAOMembership: React.FC = () => {
  const selectedExample = "basic-membership"; // Only one example type for now
  const [selectedChain, setSelectedChain] = useState<string>("ethereum");
  const [selectedChainInfo, setSelectedChainInfo] = useState<EVMChain | null>(
    null
  );
  const [includeWalletOwnership, setIncludeWalletOwnership] =
    useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [daoContractAddress, setDaoContractAddress] =
    useState<string>("0x123...");
  const [builtConditions, setBuiltConditions] = useState<
    unknown[] | { error: string } | null
  >(null);

  const handleChainSelect = (chainKey: string, chainInfo: EVMChain) => {
    setSelectedChain(chainKey);
    setSelectedChainInfo(chainInfo);
    setDaoContractAddress("0x123...");
  };

  // Example templates for different DAO membership scenarios
  const getExamples = (
    chainKey: string,
    includeWallet: boolean,
    address: string,
    contractAddress: string
  ) => {
    const walletOwnershipSection = includeWallet
      ? `.requireWalletOwnership('${address}')
  .on('ethereum')
  .and()
  `
      : "";

    const membershipDescription = includeWallet ? ` AND be a DAO member` : "";

    const combinedDescription = includeWallet
      ? `Require wallet ownership${membershipDescription}`
      : `Require DAO membership`;

    return {
      "basic-membership": {
        title: `Basic DAO Membership`,
        description: `${combinedDescription} in the specified DAO`,
        builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  ${walletOwnershipSection}.requireDAOMembership('${contractAddress}')
  .on('${chainKey}')
  .build();`,
        contractAddress,
      },
    };
  };

  const examples = getExamples(
    selectedChain,
    includeWalletOwnership,
    walletAddress,
    daoContractAddress
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
          .on("ethereum" as any)
          .and();
      }

      // Add DAO membership requirement
      builder = builder
        .requireDAOMembership(daoContractAddress)
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
      <h1 style={pageStyles.h1}>DAO Membership Access Control Conditions</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Introduction</h2>
        <p style={pageStyles.p}>
          The <code>requireDAOMembership</code> control condition lets you
          control access based on DAO (Decentralized Autonomous Organization)
          membership on any of the{" "}
          <Link
            to="/encryption/access-control/evm/supported-chains"
            style={{ color: "#007bff", textDecoration: "underline" }}
          >
            supported EVM-based blockchains
          </Link>
          .
        </p>
        <p style={pageStyles.p}>
          This condition verifies whether a user is a member of a specific DAO
          by checking their membership status in the DAO's smart contract. This
          is useful for creating governance-gated content, member-exclusive
          features, or community-specific access controls.
        </p>
        <p style={pageStyles.p}>
          In the examples below, you'll see how to use the{" "}
          <code>requireDAOMembership()</code>
          method to create membership checks that can be combined with other
          conditions using{" "}
          <Link
            to="/encryption/access-control/boolean-logic"
            style={{ color: "#007bff", textDecoration: "underline" }}
          >
            Boolean Logic
          </Link>
          .
        </p>

        <WarningCallout
          title="DAO Contract Standard Requirement"
          message={
            <>
              <p style={pageStyles.p}>
                The DAO contract must follow the <strong>MolochDAOv2.1</strong>{" "}
                standard in order for the access control condition to work
                correctly. This ensures the contract has the necessary
                membership verification functions that Lit Protocol can query.
              </p>
              <p style={pageStyles.p}>
                If you are using a DAO contract that does not follow the
                MolochDAOv2.1 standard, you can use Lit Action based Access
                Control Conditions to call the DAO contract and check for
                membership.
              </p>
            </>
          }
          variant="warning"
          style={{ marginTop: "15px" }}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>DAO Membership Scenarios</h2>

        <p style={pageStyles.p}>
          DAO membership conditions can be configured in several ways depending
          on your access control needs:
        </p>

        {(() => {
          const scenarios = [
            {
              title: "Single DAO Membership",
              description: "Require membership in a specific DAO",
              example: ".requireDAOMembership('0x123...')",
            },
            {
              title: "Multiple DAO Membership (OR Logic)",
              description: "Require membership in one of several DAOs",
              example: `.requireDAOMembership('0x123...')
.or()
.requireDAOMembership('0x456...')`,
            },
            {
              title: "DAO + Token Balance",
              description: "Require DAO membership AND minimum token balance",
              example: `.requireDAOMembership('0x123...')
.and()
.requireTokenBalance('0x789...', '1000')`,
            },
            {
              title: "Cross-Chain DAO Access",
              description: "Combine DAO memberships from different chains",
              example: `.requireDAOMembership('0x123...').on('ethereum')
.or()
.requireDAOMembership('0x456...').on('polygon')`,
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
          Select a chain, provide a DAO contract address, and explore DAO
          membership conditions:
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

                    {/* DAO Contract Address Input */}
                    <div style={{ marginBottom: "20px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: "500",
                        }}
                      >
                        DAO Contract Address:
                      </label>
                      <input
                        type="text"
                        placeholder="Enter DAO contract address (0x...)"
                        value={daoContractAddress}
                        onChange={(e) => setDaoContractAddress(e.target.value)}
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
                        The contract address of the DAO to check membership for
                      </p>
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
                        !daoContractAddress.trim()
                      }
                      style={{
                        padding: "10px 15px",
                        backgroundColor:
                          (includeWalletOwnership && !walletAddress.trim()) ||
                          !daoContractAddress.trim()
                            ? "#6b7280"
                            : "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor:
                          (includeWalletOwnership && !walletAddress.trim()) ||
                          !daoContractAddress.trim()
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

export default DAOMembership;
