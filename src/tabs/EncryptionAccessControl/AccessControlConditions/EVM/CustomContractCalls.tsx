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

const CustomContractCalls: React.FC = () => {
  const [selectedExample, setSelectedExample] =
    useState<string>("aave-collateral");
  const [selectedChain, setSelectedChain] = useState<string>("ethereum");
  const [selectedChainInfo, setSelectedChainInfo] = useState<EVMChain | null>(
    null
  );
  const [includeWalletOwnership, setIncludeWalletOwnership] =
    useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [contractAddress, setContractAddress] = useState<string>(
    "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9"
  );
  const [builtConditions, setBuiltConditions] = useState<
    unknown[] | { error: string } | null
  >(null);

  const handleChainSelect = (chainKey: string, chainInfo: EVMChain) => {
    setSelectedChain(chainKey);
    setSelectedChainInfo(chainInfo);
  };

  // Pre-defined examples for different contract call scenarios
  const getExamples = (
    chainKey: string,
    includeWallet: boolean,
    address: string
  ) => {
    const walletOwnershipSection = includeWallet
      ? `.requireWalletOwnership('${address}')
  .on('ethereum')
  .and()
  `
      : "";

    const contractDescription = includeWallet
      ? ` AND meet the contract condition`
      : "";

    const combinedDescription = includeWallet
      ? `Require wallet ownership${contractDescription}`
      : `Require custom contract condition`;

    return {
      "aave-collateral": {
        title: "Aave Collateral Position",
        description: `${combinedDescription}: Check user's collateral deposited in Aave`,
        contractAddress: "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9", // Aave v2 LendingPool
        functionName: "getUserAccountData",
        functionParams: '[":userAddress"]',
        functionAbi: {
          name: "getUserAccountData",
          inputs: [{ name: "user", type: "address" }],
          outputs: [
            { name: "totalCollateralETH", type: "uint256" },
            { name: "totalDebtETH", type: "uint256" },
            { name: "availableBorrowsETH", type: "uint256" },
            { name: "currentLiquidationThreshold", type: "uint256" },
            { name: "ltv", type: "uint256" },
            { name: "healthFactor", type: "uint256" },
          ],
          stateMutability: "view",
        },
        returnValueTest: {
          key: "totalCollateralETH",
          comparator: ">",
          value: "1000000000000000000", // 1 ETH in wei
        },
        builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const customCondition = {
  conditionType: 'evmContract',
  contractAddress: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9',
  functionName: 'getUserAccountData',
  functionParams: [':userAddress'],
  functionAbi: {
    name: 'getUserAccountData',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'totalCollateralETH', type: 'uint256' },
      { name: 'totalDebtETH', type: 'uint256' },
      { name: 'availableBorrowsETH', type: 'uint256' },
      { name: 'currentLiquidationThreshold', type: 'uint256' },
      { name: 'ltv', type: 'uint256' },
      { name: 'healthFactor', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  chain: '${chainKey}',
  returnValueTest: {
    key: 'totalCollateralETH',
    comparator: '>',
    value: '1000000000000000000',
  },
};

const accs = createAccBuilder()
  ${walletOwnershipSection}.custom(customCondition)
  .build();`,
      },
      "gnosis-safe": {
        title: "Gnosis Safe Signer Check",
        description: `${combinedDescription}: Check if user is an owner of a Gnosis Safe multisig wallet`,
        contractAddress: "0xYourSafeAddress",
        functionName: "isOwner",
        functionParams: '[":userAddress"]',
        functionAbi: {
          name: "isOwner",
          inputs: [{ name: "owner", type: "address" }],
          outputs: [{ name: "", type: "bool" }],
          stateMutability: "view",
        },
        returnValueTest: {
          key: "0", // Accessing the first (and only) return value
          comparator: "=",
          value: "true",
        },
        builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const customCondition = {
  conditionType: 'evmContract',
  contractAddress: '0xYourSafeAddress',
  functionName: 'isOwner',
  functionParams: [':userAddress'],
  functionAbi: {
    name: 'isOwner',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  chain: 'ethereum',
  returnValueTest: {
    key: '0',
    comparator: '=',
    value: 'true',
  },
};

const accs = createAccBuilder()
  ${walletOwnershipSection}.custom(customCondition)
  .build();`,
      },
      "compound-governance": {
        title: "Compound Governance Vote Check",
        description: `${combinedDescription}: Validate whether user has voted on Proposal ID 12`,
        contractAddress: "0xc0Da02939E1441F497fd74F78cE7Decb17B66529", // Governor Bravo on Ethereum
        functionName: "hasVoted",
        functionParams: '["12", ":userAddress"]',
        functionAbi: {
          name: "hasVoted",
          inputs: [
            { name: "proposalId", type: "uint256" },
            { name: "account", type: "address" },
          ],
          outputs: [{ name: "", type: "bool" }],
          stateMutability: "view",
        },
        returnValueTest: {
          key: "0",
          comparator: "=",
          value: "true",
        },
        builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const customCondition = {
  conditionType: 'evmContract',
  contractAddress: '0xc0Da02939E1441F497fd74F78cE7Decb17B66529',
  functionName: 'hasVoted',
  functionParams: ['12', ':userAddress'],
  functionAbi: {
    name: 'hasVoted',
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'account', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  chain: 'ethereum',
  returnValueTest: {
    key: '0',
    comparator: '=',
    value: 'true',
  },
};

const accs = createAccBuilder()
  ${walletOwnershipSection}.custom(customCondition)
  .build();`,
      },
      "ens-ownership": {
        title: "ENS Name Ownership Check",
        description: `${combinedDescription}: Check if user owns a specific ENS name using the reverse resolver`,
        contractAddress: "0x084b1c3C81545d370f3634392De611CaaBFf8148", // ENS Default Reverse Resolver
        functionName: "addr",
        functionParams: '["0x1c5b760f133220855340003B43cC9113EC494823"]', // Example node (namehash of reverse ENS name)
        functionAbi: {
          name: "addr",
          inputs: [{ name: "node", type: "bytes32" }],
          outputs: [{ name: "", type: "address" }],
          stateMutability: "view",
        },
        returnValueTest: {
          key: "0",
          comparator: "=",
          value: ":userAddress", // Should resolve to the user's wallet address
        },
        builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const customCondition = {
  conditionType: 'evmContract',
  contractAddress: '0x084b1c3C81545d370f3634392De611CaaBFf8148',
  functionName: 'addr',
  functionParams: ['0x1c5b760f133220855340003B43cC9113EC494823'], // Example namehash
  functionAbi: {
    name: 'addr',
    inputs: [{ name: 'node', type: 'bytes32' }],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  chain: 'ethereum',
  returnValueTest: {
    key: '0',
    comparator: '=',
    value: ':userAddress',
  },
};

const accs = createAccBuilder()
  ${walletOwnershipSection}.custom(customCondition)
  .build();`,
      },
      "chainlink-price": {
        title: "Chainlink Price Feed Check",
        description: `${combinedDescription}: Check if current ETH/USD price from Chainlink is above $2,000`,
        contractAddress: "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419", // ETH/USD price feed on Ethereum
        functionName: "latestRoundData",
        functionParams: "[]",
        functionAbi: {
          name: "latestRoundData",
          inputs: [],
          outputs: [
            { name: "roundId", type: "uint80" },
            { name: "answer", type: "int256" },
            { name: "startedAt", type: "uint256" },
            { name: "updatedAt", type: "uint256" },
            { name: "answeredInRound", type: "uint80" },
          ],
          stateMutability: "view",
        },
        returnValueTest: {
          key: "answer",
          comparator: ">=",
          value: "200000000000", // $2,000 * 1e8
        },
        builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const customCondition = {
  conditionType: 'evmContract',
  contractAddress: '0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419', // ETH/USD Chainlink price feed
  functionName: 'latestRoundData',
  functionParams: [],
  functionAbi: {
    name: 'latestRoundData',
    inputs: [],
    outputs: [
      { name: 'roundId', type: 'uint80' },
      { name: 'answer', type: 'int256' },
      { name: 'startedAt', type: 'uint256' },
      { name: 'updatedAt', type: 'uint256' },
      { name: 'answeredInRound', type: 'uint80' },
    ],
    stateMutability: 'view',
  },
  chain: 'ethereum',
  returnValueTest: {
    key: 'answer',
    comparator: '>=',
    value: '200000000000',
  },
};

const accs = createAccBuilder()
  ${walletOwnershipSection}.custom(customCondition)
  .build();`,
      },
    };
  };

  const examples = getExamples(
    selectedChain,
    includeWalletOwnership,
    walletAddress
  );

  const buildConditions = () => {
    try {
      const selectedExampleData =
        examples[selectedExample as keyof typeof examples];
      if (!selectedExampleData) {
        throw new Error("No example selected");
      }

      let parsedParams;
      try {
        parsedParams = JSON.parse(selectedExampleData.functionParams);
      } catch {
        throw new Error("Function params must be valid JSON array");
      }

      const customCondition = {
        conditionType: "evmContract",
        contractAddress: contractAddress,
        functionName: selectedExampleData.functionName,
        functionParams: parsedParams,
        functionAbi: selectedExampleData.functionAbi,
        chain: selectedChain,
        returnValueTest: selectedExampleData.returnValueTest,
      };

      let builder = createAccBuilder();

      // Add wallet ownership requirement if enabled
      if (includeWalletOwnership) {
        builder = builder
          .requireWalletOwnership(walletAddress)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .on("ethereum" as any)
          .and();
      }

      // Add custom condition
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      builder = builder.custom(customCondition as any);

      const conditions = builder.build();
      setBuiltConditions(conditions);
    } catch (error) {
      console.error("Error building conditions:", error);
      setBuiltConditions({ error: (error as Error).message });
    }
  };

  // Generate dynamic code based on current state
  const generateDynamicCode = () => {
    const selectedExampleData =
      examples[selectedExample as keyof typeof examples];
    if (!selectedExampleData) return "";

    const walletOwnershipSection = includeWalletOwnership
      ? `.requireWalletOwnership('${walletAddress}')
  .on('ethereum')
  .and()
  `
      : "";

    return `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const customCondition = {
  conditionType: 'evmContract',
  contractAddress: '${contractAddress}',
  functionName: '${selectedExampleData.functionName}',
  functionParams: ${selectedExampleData.functionParams},
  functionAbi: ${JSON.stringify(selectedExampleData.functionAbi)},
  chain: '${selectedChain}',
  returnValueTest: ${JSON.stringify(
    selectedExampleData.returnValueTest,
    null,
    2
  )},
};

const accs = createAccBuilder()
  ${walletOwnershipSection}.custom(customCondition)
  .build();`;
  };

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>
        Custom Contract Calls Access Control Conditions
      </h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Introduction</h2>
        <p style={pageStyles.p}>
          Custom contract calls let you define Access Control Conditions based
          on the result of any smart contract function on any{" "}
          <Link
            to="/encryption/access-control/evm/supported-chains"
            style={{ color: "#007bff", textDecoration: "underline" }}
          >
            supported EVM chain
          </Link>
          . This gives you complete flexibility to gate access using any
          on-chain data.
        </p>
        <p style={pageStyles.p}>
          You can specify the function ABI, pass custom parameters, and test the
          return values to determine whether access should be granted. This is
          ideal for conditions that go beyond the Lit SDK's built-in Access
          Control Conditions.
        </p>
        <p style={pageStyles.p}>
          In the examples below, you'll see how to use custom contract calls to
          enforce conditions like DeFi collateral positions, multisig wallet
          ownership, governance participation, ENS name ownership, and oracle
          price feeds. These conditions can be combined using{" "}
          <Link
            to="/encryption/access-control/boolean-logic"
            style={{ color: "#007bff", textDecoration: "underline" }}
          >
            Boolean logic
          </Link>{" "}
          to support even more complex rules.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Custom Contract Call Scenarios</h2>

        <p style={pageStyles.p}>
          Custom contract calls can be configured for virtually any smart
          contract interaction:
        </p>

        {(() => {
          const scenarios = [
            {
              title: "Aave Collateral Position",
              description: "Check user's collateral deposited in Aave",
              example: `.custom({
  contractAddress: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9',
  functionName: 'getUserAccountData',
  functionParams: [':userAddress']
})`,
            },
            {
              title: "Gnosis Safe Signer Check",
              description:
                "Check if user is an owner of a Gnosis Safe multisig wallet",
              example: `.custom({
  contractAddress: '0x123...gnosisSafe',
  functionName: 'isOwner',
  functionParams: [':userAddress']
})`,
            },
            {
              title: "Compound Governance Vote Check",
              description:
                "Validate whether user has voted on governance proposals",
              example: `.custom({
  contractAddress: '0x5e4e65926ba27467555eb562121fac00d24e9dd2',
  functionName: 'hasVoted',
  functionParams: ['12', ':userAddress']
})`,
            },
            {
              title: "Chainlink Price Feed Check",
              description:
                "Check if current ETH/USD price from Chainlink is above a certain price",
              example: `.custom({
  contractAddress: '0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419',
  functionName: 'latestRoundData',
  functionParams: []
})`,
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
          title="Function Parameters"
          message={
            <>
              <p style={pageStyles.p}>
                Use <code>":userAddress"</code> as a parameter to automatically
                substitute the user's wallet address. You can also pass literal
                values like strings, numbers, or arrays as needed by your
                contract function.
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
          Select a chain, choose a predefined example or create your own custom
          contract call:
        </p>

        {/* Example Selector */}
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "500",
            }}
          >
            Choose a Predefined Example:
          </label>
          <select
            value={selectedExample}
            onChange={(e) => {
              setSelectedExample(e.target.value);
              const example = examples[e.target.value as keyof typeof examples];
              if (example) {
                setContractAddress(example.contractAddress);
              }
            }}
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
                code={generateDynamicCode()}
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

                    {/* Contract Address Input */}
                    <div style={{ marginBottom: "20px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: "500",
                        }}
                      >
                        Contract Address:
                      </label>
                      <input
                        type="text"
                        placeholder="Enter contract address (0x...)"
                        value={contractAddress}
                        onChange={(e) => setContractAddress(e.target.value)}
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
                        The smart contract address to call
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
                        !contractAddress.trim()
                      }
                      style={{
                        padding: "10px 15px",
                        backgroundColor:
                          (includeWalletOwnership && !walletAddress.trim()) ||
                          !contractAddress.trim()
                            ? "#6b7280"
                            : "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor:
                          (includeWalletOwnership && !walletAddress.trim()) ||
                          !contractAddress.trim()
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

export default CustomContractCalls;
