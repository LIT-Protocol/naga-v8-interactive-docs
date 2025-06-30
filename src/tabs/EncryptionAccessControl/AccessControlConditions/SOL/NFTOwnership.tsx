import React, { useState } from "react";
import { createAccBuilder } from "@lit-protocol/access-control-conditions";
import { DisplayCode } from "../../../../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../../../../components/layout/GreyboardWhiteBgContainer";
import { pageStyles } from "../../../../styles/pageStyles";
import { Link } from "react-router-dom";
import { NoteCallout } from "../../../../components/common";

const SOLNFTOwnership: React.FC = () => {
  const [includeWalletOwnership, setIncludeWalletOwnership] =
    useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [collectionAddress, setCollectionAddress] =
    useState<string>("collection123");
  const [builtConditions, setBuiltConditions] = useState<
    unknown[] | { error: string } | null
  >(null);

  // Example templates for different Solana NFT ownership scenarios
  const getExamples = (
    includeWallet: boolean,
    address: string,
    collectionAddr: string
  ) => {
    const walletOwnershipSection = includeWallet
      ? `.requireSolWalletOwnership('${address}')
  .on('solana')
  .and()
  `
      : "";

    const nftOwnershipDescription = includeWallet
      ? ` AND own an NFT from the specified collection`
      : "";

    const combinedDescription = includeWallet
      ? `Require wallet ownership${nftOwnershipDescription}`
      : `Require users to own an NFT from the specified collection`;

    return {
      "collection-ownership": {
        title: `Collection Ownership`,
        description: `${combinedDescription}`,
        builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  ${walletOwnershipSection}.requireSolNftOwnership('${collectionAddr}')
  .on('solana')
  .build();`,
        collectionAddress: collectionAddr,
      },
    };
  };

  const examples = getExamples(
    includeWalletOwnership,
    walletAddress,
    collectionAddress
  );

  const buildConditions = () => {
    try {
      let builder = createAccBuilder();

      // Add wallet ownership requirement if enabled
      if (includeWalletOwnership) {
        builder = builder
          .requireSolWalletOwnership(walletAddress)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .on("solana" as any)
          .and();
      }

      // Add Solana NFT ownership requirement
      builder = builder
        .requireSolNftOwnership(collectionAddress)
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
      <h1 style={pageStyles.h1}>
        Solana NFT Ownership Access Control Conditions
      </h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Introduction</h2>
        <p style={pageStyles.p}>
          The <code>requireSolNftOwnership</code> control condition lets you
          control access based on Solana NFT collection ownership. This is
          useful for creating token-gated experiences where users must own an
          NFT from a specific collection.
        </p>
        <p style={pageStyles.p}>
          In the examples below, you'll see how to use the{" "}
          <code>requireSolNftOwnership()</code> method to create ownership
          checks for Solana NFT collections that can be combined with other
          conditions using{" "}
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
        <h2 style={pageStyles.h2}>Solana NFT Ownership Scenarios</h2>

        <p style={pageStyles.p}>
          Solana NFT ownership conditions can be configured in several ways
          depending on your access control needs:
        </p>

        {(() => {
          const scenarios = [
            {
              title: "Collection Ownership",
              description:
                "Require ownership of any NFT from a specified Solana collection",
              example: ".requireSolNftOwnership('collection123')",
            },
            {
              title: "Multiple Collections (OR Logic)",
              description:
                "Require ownership from one of several NFT collections",
              example: `.requireSolNftOwnership('collection123')
.or()
.requireSolNftOwnership('collection456')`,
            },
            {
              title: "Collection + Wallet Ownership",
              description:
                "Combine NFT collection ownership with specific wallet ownership",
              example: `.requireSolWalletOwnership('0x123...')
.and()
.requireSolNftOwnership('collection123')`,
            },
            {
              title: "Multiple Collections (AND Logic)",
              description: "Require ownership from multiple NFT collections",
              example: `.requireSolNftOwnership('collection123')
.and()
.requireSolNftOwnership('collection456')`,
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

        <NoteCallout
          title="Collection-Only Ownership"
          message={
            <>
              <p style={pageStyles.p}>
                Unlike EVM NFT Access Control Conditions, Solana NFT ownership
                conditions only support collection-level ownership checks. You
                cannot specify individual token IDs, so the condition will pass
                if the user owns any NFT from the specified collection.
              </p>
            </>
          }
          variant="info"
          style={{ marginTop: "15px" }}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Interactive Examples</h2>
        <p style={pageStyles.p}>
          Configure Solana NFT collection ownership requirements and see the
          generated access control conditions:
        </p>

        {/* Example Display */}
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
            {examples["collection-ownership"]?.title || ""}
          </h3>
          <p style={pageStyles.p}>
            {examples["collection-ownership"]?.description || ""}
          </p>

          {/* Builder Code */}
          <DisplayCode
            code={examples["collection-ownership"]?.builderCode || ""}
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
                          When enabling the wallet ownership requirement, you
                          must include <code>.on(chain)</code> after the wallet
                          ownership check to enable chaining with{" "}
                          <code>.and()</code>. For Solana wallet ownership, the
                          chain should be set to <code>solana</code>.
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

                {/* Collection Address Input */}
                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "500",
                    }}
                  >
                    Collection Address:
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Solana NFT collection address"
                    value={collectionAddress}
                    onChange={(e) => setCollectionAddress(e.target.value)}
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
                    The address/identifier of the Solana NFT collection
                  </p>
                </div>

                <button
                  onClick={buildConditions}
                  disabled={
                    (includeWalletOwnership && !walletAddress.trim()) ||
                    !collectionAddress.trim()
                  }
                  style={{
                    padding: "10px 15px",
                    backgroundColor:
                      (includeWalletOwnership && !walletAddress.trim()) ||
                      !collectionAddress.trim()
                        ? "#6b7280"
                        : "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor:
                      (includeWalletOwnership && !walletAddress.trim()) ||
                      !collectionAddress.trim()
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
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default SOLNFTOwnership;
