import React, { useState } from "react";
import { createAccBuilder } from "@lit-protocol/access-control-conditions";
import { DisplayCode } from "../../../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../../../components/layout/GreyboardWhiteBgContainer";
import { pageStyles } from "../../../styles/pageStyles";

const BooleanLogic: React.FC = () => {
  const [selectedExample, setSelectedExample] = useState<string>("basic-or");
  const [builtConditions, setBuiltConditions] = useState<
    unknown[] | { error: string } | null
  >(null);

  // Example templates for different boolean logic patterns
  const examples = {
    "basic-or": {
      title: "Basic OR Logic",
      description: "User must be a DAO member OR hold minimum ETH balance",
      builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  .requireDAOMembership('0x50D8EB685a9F262B13F28958aBc9670F06F819d9')
  .on('ethereum')
  .or()
  .requireEthBalance('10000000000000000', '>=') // 0.01 ETH
  .on('ethereum')
  .build();`,
      rawCode: `// Equivalent raw conditions array:
const accessControlConditions = [
  {
    contractAddress: "0x50D8EB685a9F262B13F28958aBc9670F06F819d9",
    standardContractType: "MolochDAOv2.1",
    chain: "ethereum",
    method: "members",
    parameters: [":userAddress"],
    returnValueTest: {
      comparator: "=",
      value: "true",
    },
  },
  { operator: "or" },
  {
    contractAddress: "",
    standardContractType: "",
    chain: "ethereum",
    method: "eth_getBalance",
    parameters: [":userAddress", "latest"],
    returnValueTest: {
      comparator: ">=",
      value: "10000000000000000",
    },
  },
];`,
    },
    "basic-and": {
      title: "Basic AND Logic",
      description: "User must be a DAO member AND hold minimum ETH balance",
      builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  .requireDAOMembership('0x50D8EB685a9F262B13F28958aBc9670F06F819d9')
  .on('ethereum')
  .and()
  .requireEthBalance('1000000000000000000', '>=') // 1 ETH
  .on('ethereum')
  .build();`,
      rawCode: `// Equivalent raw conditions array:
const accessControlConditions = [
  {
    contractAddress: "0x50D8EB685a9F262B13F28958aBc9670F06F819d9",
    standardContractType: "MolochDAOv2.1",
    chain: "ethereum",
    method: "members",
    parameters: [":userAddress"],
    returnValueTest: {
      comparator: "=",
      value: "true",
    },
  },
  { operator: "and" },
  {
    contractAddress: "",
    standardContractType: "",
    chain: "ethereum",
    method: "eth_getBalance",
    parameters: [":userAddress", "latest"],
    returnValueTest: {
      comparator: ">=",
      value: "1000000000000000000",
    },
  },
];`,
    },
    "grouped-logic": {
      title: "Grouped Boolean Logic",
      description:
        "DAO member AND (high ETH balance OR specific token ownership)",
      builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  .requireDAOMembership('0x50D8EB685a9F262B13F28958aBc9670F06F819d9')
  .on('ethereum')
  .and()
  .group((subBuilder) =>
    subBuilder
      .requireEthBalance('10000000000000000', '>=') // 0.01 ETH
      .on('ethereum')
      .or()
      .requireTokenBalance(
        '0xc0ad7861fe8848002a3d9530999dd29f6b6cae75', // Example ERC20
        '10000000000000000000', // 10 tokens
        '>'
      )
      .on('ethereum')
  )
  .build();`,
      rawCode: `// Equivalent raw conditions array:
const accessControlConditions = [
  {
    contractAddress: "0x50D8EB685a9F262B13F28958aBc9670F06F819d9",
    standardContractType: "MolochDAOv2.1",
    chain: "ethereum",
    method: "members",
    parameters: [":userAddress"],
    returnValueTest: {
      comparator: "=",
      value: "true",
    },
  },
  { operator: "and" },
  [
    {
      contractAddress: "",
      standardContractType: "",
      chain: "ethereum",
      method: "eth_getBalance",
      parameters: [":userAddress", "latest"],
      returnValueTest: {
        comparator: ">=",
        value: "10000000000000000",
      },
    },
    { operator: "or" },
    {
      contractAddress: "0xc0ad7861fe8848002a3d9530999dd29f6b6cae75",
      standardContractType: "ERC20",
      chain: "ethereum",
      method: "balanceOf",
      parameters: [":userAddress"],
      returnValueTest: {
        comparator: ">",
        value: "10000000000000000000",
      },
    },
  ],
];`,
    },
  };

  const buildConditions = () => {
    const example = examples[selectedExample as keyof typeof examples];
    if (!example) return;

    try {
      // For demonstration purposes, we'll build the conditions based on the selected example
      let builder = createAccBuilder();

      switch (selectedExample) {
        case "basic-or":
          builder = builder
            .requireDAOMembership("0x50D8EB685a9F262B13F28958aBc9670F06F819d9")
            .on("ethereum")
            .or()
            .requireEthBalance("10000000000000000", ">=")
            .on("ethereum");
          break;
        case "basic-and":
          builder = builder
            .requireDAOMembership("0x50D8EB685a9F262B13F28958aBc9670F06F819d9")
            .on("ethereum")
            .and()
            .requireEthBalance("1000000000000000000", ">=")
            .on("ethereum");
          break;
        case "grouped-logic":
          builder = builder
            .requireDAOMembership("0x50D8EB685a9F262B13F28958aBc9670F06F819d9")
            .on("ethereum")
            .and()
            .group((subBuilder) =>
              subBuilder
                .requireEthBalance("10000000000000000", ">=")
                .on("ethereum")
                .or()
                .requireTokenBalance(
                  "0xc0ad7861fe8848002a3d9530999dd29f6b6cae75",
                  "10000000000000000000",
                  ">"
                )
                .on("ethereum")
            );
          break;
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
      <h1 style={pageStyles.h1}>Boolean Logic in Access Control Conditions</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Introduction</h2>
        <p style={pageStyles.p}>
          Lit's Access Control Conditions support boolean logic when checking
          conditions, allowing you to create sophisticated access control rules
          by combining multiple conditions with <strong>AND</strong> and{" "}
          <strong>OR</strong> operators.
        </p>
        <p style={pageStyles.p}>
          The Access Control Conditions builder (<code>createAccBuilder</code>)
          provides an intuitive API for creating these complex boolean
          expressions, making it easy to construct nested logic without manually
          managing arrays and operator objects.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Boolean Operators</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              padding: "20px",
              backgroundColor: "#f0f9ff",
              borderRadius: "8px",
              border: "1px solid #007bff",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0", color: "#0c4a6e" }}>
              AND Operator
            </h3>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#0c4a6e" }}>
              <strong>All</strong> conditions must be satisfied. Use{" "}
              <code>.and()</code> to require multiple conditions to be true
              simultaneously.
            </p>
          </div>

          <div
            style={{
              padding: "20px",
              backgroundColor: "#f0fdf4",
              borderRadius: "8px",
              border: "1px solid #22c55e",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0", color: "#166534" }}>
              OR Operator
            </h3>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#166534" }}>
              <strong>Any</strong> condition can be satisfied. Use{" "}
              <code>.or()</code> to provide alternative ways to meet the access
              requirements.
            </p>
          </div>
        </div>

        <div
          style={{
            padding: "15px",
            backgroundColor: "#fef3c7",
            borderRadius: "8px",
            border: "1px solid #f59e0b",
            marginTop: "20px",
          }}
        >
          <h4 style={{ margin: "0 0 8px 0", color: "#92400e" }}>💡 Pro Tip</h4>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#92400e" }}>
            Use <code>.group()</code> to create nested boolean expressions with
            parentheses, allowing complex logic like:{" "}
            <code>A AND (B OR C)</code>
          </p>
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Interactive Examples</h2>
        <p style={pageStyles.p}>
          Select an example below to see how different boolean logic patterns
          work with the Access Control Conditions builder:
        </p>

        {/* Selected Example Display */}
        {selectedExample && (
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
              {examples[selectedExample as keyof typeof examples].title}
            </h3>
            <p style={pageStyles.p}>
              {examples[selectedExample as keyof typeof examples].description}
            </p>

            {/* Builder Code */}
            <DisplayCode
              code={
                examples[selectedExample as keyof typeof examples].builderCode
              }
              language="typescript"
              renderComponent={
                <>
                  {/* Example Selector */}
                  <div style={{ marginBottom: "20px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "500",
                      }}
                    >
                      Choose an example:
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
                          {example.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={buildConditions}
                    style={{
                      padding: "10px 15px",
                      backgroundColor: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
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

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Boolean Nesting with Groups</h2>
        <p style={pageStyles.p}>
          For complex logic patterns, you can use the <code>.group()</code>{" "}
          method to create nested boolean expressions. This is equivalent to
          using parentheses in traditional boolean logic.
        </p>

        <div
          style={{
            padding: "20px",
            backgroundColor: "#f8fafc",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            marginBottom: "20px",
          }}
        >
          <h4 style={{ margin: "0 0 15px 0" }}>
            Example: Complex Nested Logic
          </h4>
          <p style={{ margin: "0 0 15px 0", fontSize: "0.9rem" }}>
            <strong>Requirement:</strong> User must be a DAO member AND (hold
            sufficient ETH OR own specific NFT)
          </p>

          <DisplayCode
            code={`import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const complexConditions = createAccBuilder()
  .requireDAOMembership('0x50D8EB685a9F262B13F28958aBc9670F06F819d9')
  .on('ethereum')
  .and()
  .group((subBuilder) =>
    subBuilder
      .requireEthBalance('1000000000000000000', '>=') // 1 ETH
      .on('ethereum')
      .or()
      .requireNftOwnership('0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D') // BAYC
      .on('ethereum')
  )
  .build();

// This creates the logical structure: DAO_MEMBER AND (ETH_BALANCE OR NFT_OWNERSHIP)`}
            language="typescript"
            theme="dracula"
          />
        </div>
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default BooleanLogic;
