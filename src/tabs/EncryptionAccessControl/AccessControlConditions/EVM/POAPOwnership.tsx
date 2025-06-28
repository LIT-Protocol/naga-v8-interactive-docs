import React, { useState } from "react";
import { createAccBuilder } from "@lit-protocol/access-control-conditions";
import { DisplayCode } from "../../../../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../../../../components/layout/GreyboardWhiteBgContainer";
import { pageStyles } from "../../../../styles/pageStyles";
import { Link } from "react-router-dom";
import EVMChainsSelector from "../../../../components/EVMChainsSelector";
import { NoteCallout } from "../../../../components/common";

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

const POAPOwnership: React.FC = () => {
  const selectedExample = "basic-poap"; // Only one example type for now
  const [selectedChain, setSelectedChain] = useState<string>("ethereum");
  const [selectedChainInfo, setSelectedChainInfo] = useState<EVMChain | null>(
    null
  );
  const [includeWalletOwnership, setIncludeWalletOwnership] =
    useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [poapId, setPoapId] = useState<string>("123");
  const [builtConditions, setBuiltConditions] = useState<
    unknown[] | { error: string } | null
  >(null);

  const handleChainSelect = (chainKey: string, chainInfo: EVMChain) => {
    setSelectedChain(chainKey);
    setSelectedChainInfo(chainInfo);
  };

  // Example templates for different POAP ownership scenarios
  const getExamples = (
    chainKey: string,
    includeWallet: boolean,
    address: string,
    poapEventId: string
  ) => {
    const walletOwnershipSection = includeWallet
      ? `.requireWalletOwnership('${address}')
  .on('ethereum')
  .and()
  `
      : "";

    const poapDescription = includeWallet ? ` AND own the specified POAP` : "";

    const combinedDescription = includeWallet
      ? `Require wallet ownership${poapDescription}`
      : `Require POAP ownership`;

    return {
      "basic-poap": {
        title: `POAP Ownership`,
        description: `${combinedDescription} for event ID ${poapEventId}`,
        builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  ${walletOwnershipSection}.requirePOAPOwnership('${poapEventId}')
  .on('${chainKey}')
  .build();`,
        poapId: poapEventId,
      },
    };
  };

  const examples = getExamples(
    selectedChain,
    includeWalletOwnership,
    walletAddress,
    poapId
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

      // Add POAP ownership requirement
      builder = builder.requirePOAPOwnership(poapId).on(selectedChain as any);

      const conditions = builder.build();
      setBuiltConditions(conditions);
    } catch (error) {
      console.error("Error building conditions:", error);
      setBuiltConditions({ error: (error as Error).message });
    }
  };

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>POAP Ownership Access Control Conditions</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Introduction</h2>
        <p style={pageStyles.p}>
          The <code>requirePOAPOwnership</code> control condition lets you
          control access based on POAP (Proof of Attendance Protocol) ownership
          on any of the{" "}
          <Link
            to="/encryption/access-control/evm/supported-chains"
            style={{ color: "#007bff", textDecoration: "underline" }}
          >
            supported EVM-based blockchains
          </Link>
          .
        </p>
        <p style={pageStyles.p}>
          POAPs are digital badges (NFTs) that serve as proof of attendance at
          events. This condition verifies whether a user owns a POAP token for a
          specific event ID. This is useful for creating event-gated content,
          alumni networks, or exclusive access for attendees of conferences,
          workshops, or other gatherings.
        </p>
        <p style={pageStyles.p}>
          In the examples below, you'll see how to use the{" "}
          <code>requirePOAPOwnership()</code>
          method to create attendance-based access checks that can be combined
          with other conditions using{" "}
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
        <h2 style={pageStyles.h2}>POAP Ownership Scenarios</h2>

        <p style={pageStyles.p}>
          POAP ownership conditions can be configured in several ways depending
          on your access control needs:
        </p>

        {(() => {
          const scenarios = [
            {
              title: "Single Event POAP",
              description: "Require ownership of a POAP from a specific event",
              example: ".requirePOAPOwnership('123')",
            },
            {
              title: "Multiple Event POAPs (OR Logic)",
              description:
                "Require ownership of POAPs from one of several events",
              example: `.requirePOAPOwnership('123')
.or()
.requirePOAPOwnership('456')`,
            },
            {
              title: "POAP + Token Balance",
              description: "Require POAP ownership AND minimum token balance",
              example: `.requirePOAPOwnership('123')
.and()
.requireTokenBalance('0x789...', '1000')`,
            },
            {
              title: "Cross-Chain POAP Access",
              description: "Combine POAP requirements from different chains",
              example: `.requirePOAPOwnership('123').on('ethereum')
.or()
.requirePOAPOwnership('456').on('polygon')`,
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
          Select a chain, provide a POAP event ID, and explore POAP ownership
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

                    {/* POAP Event ID Input */}
                    <div style={{ marginBottom: "20px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: "500",
                        }}
                      >
                        POAP Event ID:
                      </label>
                      <input
                        type="text"
                        placeholder="Enter POAP event ID (e.g., 123)"
                        value={poapId}
                        onChange={(e) => setPoapId(e.target.value)}
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
                        The unique identifier for the POAP event (found on
                        POAP.xyz)
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
                        !poapId.trim()
                      }
                      style={{
                        padding: "10px 15px",
                        backgroundColor:
                          (includeWalletOwnership && !walletAddress.trim()) ||
                          !poapId.trim()
                            ? "#6b7280"
                            : "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor:
                          (includeWalletOwnership && !walletAddress.trim()) ||
                          !poapId.trim()
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

export default POAPOwnership;
