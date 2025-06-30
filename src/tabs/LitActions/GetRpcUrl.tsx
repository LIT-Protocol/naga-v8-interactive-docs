/**
 * GetRpcUrl.tsx
 *
 * This component provides a comprehensive guide on using the getRpcUrl function
 * within Lit Actions to interact with blockchain networks.
 */

import React from "react";
import GreyBoarderWhiteBgContainer from "../../components/layout/GreyboardWhiteBgContainer";
import { NoteCallout } from "../../components/common";
import DisplayCode from "../../components/DisplayCode";
import { Link } from "react-router-dom";
import { pageStyles } from "../../styles/pageStyles";

const LitActionsGetRpcUrl: React.FC = () => {
  const basicExample = `const _litActionCode = async () => {
  // Get the RPC URL for Ethereum mainnet
  const rpcUrl = await Lit.Actions.getRpcUrl({ chain: "ethereum" });
  
  // Create a provider using the RPC URL
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  
  // Fetch the latest block information
  const latestBlock = await provider.getBlock("latest");
  
  // Return block information
  const blockInfo = {
    blockNumber: latestBlock.number,
    blockHash: latestBlock.hash,
    timestamp: latestBlock.timestamp,
    transactionCount: latestBlock.transactions.length
  };
  
  Lit.Actions.setResponse({ response: blockInfo });
};

const litActionCode = \`(\${_litActionCode.toString()})();\`;

const result = await litClient.executeJs({
  code: litActionCode,
  authContext: authContext,
  jsParams: {},
});

console.log("Block info from all nodes:", result);`;

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>Getting Chain RPC URLs</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Intro</h2>
        <p style={pageStyles.p}>
          The <code>getRpcUrl()</code> function allows your Lit Actions to
          interact with blockchain networks by providing access to RPC endpoints
          for various chains. This enables you to read blockchain data, call
          contract methods, fetch transaction information, and perform other
          blockchain operations directly within your Lit Actions.
        </p>

        <p style={pageStyles.p}>
          Each Lit node maintains connections to multiple blockchain networks
          and provides RPC access without requiring you to manage your own
          infrastructure or API keys. This simplifies blockchain integration and
          ensures consistent access across the network.
        </p>

        <div style={{ marginTop: "24px" }}>
          <h4 style={pageStyles.h4}>
            Common Use Cases for <code>getRpcUrl()</code>
          </h4>
          <ul style={pageStyles.ul}>
            <li style={pageStyles.li}>
              <strong>Reading Blockchain Data:</strong> Fetch block information,
              transaction details, or account balances
            </li>
            <li style={pageStyles.li}>
              <strong>Contract Interactions:</strong> Call smart contract
              methods to retrieve data or validate conditions
            </li>
            <li style={pageStyles.li}>
              <strong>Transaction Broadcasting:</strong> Send signed
              transactions to the blockchain network
            </li>
            <li style={pageStyles.li}>
              <strong>Cross-Chain Operations:</strong> Gather data from multiple
              blockchains within a single Lit Action
            </li>
          </ul>
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Basic Usage</h2>

        <NoteCallout
          message={
            <>
              <p>
                For the sake of brevity, this code example excludes the required
                code for setting up the Lit Client and Auth Context. If you're
                unfamiliar with setting up these prerequisites, please refer to
                the{" "}
                <Link
                  to={"/lit-actions/quick-start"}
                  style={{
                    color: "#007bff",
                    textDecoration: "none",
                    fontSize: "0.9rem",
                    fontWeight: "500",
                  }}
                >
                  Lit Actions Quick Start Guide
                </Link>
                .
              </p>
            </>
          }
          variant="note"
          style={{ marginBottom: "16px" }}
        />

        <p style={pageStyles.p}>
          Here's a simple example of using <code>getRpcUrl()</code> to fetch
          blockchain data. By default, all nodes will execute this code in
          parallel and should return consistent results.
        </p>

        <DisplayCode code={basicExample} language="typescript" />

        <p style={{ ...pageStyles.p, marginTop: "16px" }}>
          In this example, each Lit node gets its RPC URL for Ethereum, creates
          a provider, and fetches the latest block information. Since all nodes
          are querying the same blockchain, they should return the same results,
          however the returned block number might still differ due to timing.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Important Considerations</h2>
        <p style={pageStyles.p}>
          When using <code>getRpcUrl()</code> in your Lit Actions, keep these
          important factors in mind:
        </p>

        <h4 style={pageStyles.h4}>Supported Chains</h4>
        <p style={pageStyles.p}>
          The <code>getRpcUrl()</code> function only supports the listed{" "}
          <Link
            to="/encryption/access-control/evm/supported-chains"
            style={{ color: "#007bff", textDecoration: "underline" }}
          >
            supported EVM chains
          </Link>{" "}
          . The returned RPC URLs are public RPC endpoints that can be subject
          to throttling and rate limiting, so consider using your own RPC
          provider for more reliable access.
        </p>

        <h4 style={pageStyles.h4}>Single Node Execution</h4>
        <p style={pageStyles.p}>
          For operations that don't require consensus or when you want to reduce
          the number of RPC calls, you can combine <code>getRpcUrl()</code> with{" "}
          <Link
            to="/lit-actions/run-once"
            style={{
              color: "#007bff",
              textDecoration: "none",
              fontWeight: "500",
            }}
          >
            runOnce()
          </Link>{" "}
          to execute blockchain queries on only one node.
        </p>

        <h4 style={pageStyles.h4}>Network Latency and Reliability</h4>
        <p style={pageStyles.p}>
          RPC calls are subject to network conditions and blockchain congestion.
          Always implement proper error handling and consider timeout scenarios,
          especially when making multiple sequential calls.
        </p>

        <p style={pageStyles.p}>
          Additionally, since Lit Actions have a maximum execution time, waiting
          for a transaction to be confirmed on-chain may not be feasible,
          especially on blockchains with long block times.
        </p>

        <h4 style={pageStyles.h4}>Consensus and Consistency</h4>
        <p style={pageStyles.p}>
          When all nodes execute RPC calls simultaneously, they might receive
          slightly different results due to timing differences (e.g., different
          latest block numbers). Because the lack of consensus on the returned
          data, consider using <code>runOnce()</code> for non-deterministic
          operations.
        </p>
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default LitActionsGetRpcUrl;
