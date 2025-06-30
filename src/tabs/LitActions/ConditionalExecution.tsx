/**
 * ConditionalExecution.tsx
 *
 * This component provides a comprehensive guide on using access control conditions
 * to implement conditional execution logic within Lit Actions, including but not limited to signing.
 */

import React from "react";
import GreyBoarderWhiteBgContainer from "../../components/layout/GreyboardWhiteBgContainer";
import { NoteCallout } from "../../components/common";
import DisplayCode from "../../components/DisplayCode";
import { Link } from "react-router-dom";
import { pageStyles } from "../../styles/pageStyles";

const LitActionsConditionalExecution: React.FC = () => {
  const basicSigningExample = `
import { createAccBuilder } from "@lit-protocol/access-control-conditions";
import { privateKeyToAccount } from "viem/accounts";
import { ViemAccountAuthenticator } from "@lit-protocol/auth";
import { createSiweMessage } from "@lit-protocol/auth-helpers";

const _litActionCode = async () => {
  try {
    // Check if the authenticated user meets the conditions
    const testResult = await Lit.Actions.checkConditions({
      conditions: jsParams.conditions,
      authSig: jsParams.authSig,
      chain: "ethereum",
    });

    let response = "Access granted";

    if (!testResult) {
      response = "Access denied: insufficient ETH balance";
    }

    return LitActions.setResponse({ response });
  } catch (error) {
    LitActions.setResponse({ response: error.message });
  }
};

const litActionCode = \`(\${_litActionCode.toString()})();\`;

const accessControlConditions = createAccBuilder().requireEthBalance(
  '10000000000000000', '>='
).on('ethereum').build();

const aliceViemAccount = privateKeyToAccount("0xprivateKey");
const aliceAuthSig = await ViemAccountAuthenticator.createAuthSig(
  aliceViemAccount,
  await createSiweMessage({
    walletAddress: aliceViemAccount.address,
    nonce: (await litClient.getContext()).latestBlockhash
  })
);

const result = await litClient.executeJs({
  code: litActionCode,
  authContext: authContext,
  jsParams: {
    conditions: accessControlConditions,
    authSig: aliceAuthSig,
  },
});`;

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>Conditional Execution</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Intro</h2>
        <p style={pageStyles.p}>
          Lit Actions can utilize{" "}
          <Link
            to="/encryption/access-control/boolean-logic"
            style={{
              color: "#007bff",
              textDecoration: "none",
              fontWeight: "500",
            }}
          >
            Access Control Conditions
          </Link>{" "}
          to gate any logic within your Lit Actions, enabling sophisticated
          conditional execution patterns.
        </p>

        <p style={pageStyles.p}>
          This powerful feature allows you to create dynamic, context-aware
          applications that can make decisions based on on-chain or off-chain
          conditions such as token balances, NFT ownership, time constraints,
          smart contract states, and more.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Example Usage</h2>

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
              <p>
                Additionally, this example uses the{" "}
                <code>createAccBuilder</code> functions as shown in the{" "}
                <Link
                  to={"/encryption/quickstart"}
                  style={{
                    color: "#007bff",
                    textDecoration: "none",
                    fontSize: "0.9rem",
                    fontWeight: "500",
                  }}
                >
                  Access Control Conditions Quick Start Guide
                </Link>{" "}
                to build the Access Control Conditions checked within the Lit
                Action.
              </p>
            </>
          }
          variant="note"
          style={{ marginBottom: "16px" }}
        />

        <p style={pageStyles.p}>
          This example demonstrates conditional signing based on ETH balance.
          The Lit Action checks if the authenticated user has at least 1 Wei on
          Ethereum before proceeding with the signature operation. If the
          condition fails, it returns an error message instead of signing.
        </p>

        <DisplayCode
          code={basicSigningExample}
          language="typescript"
          style={{ marginBottom: "16px" }}
        />

        <p style={pageStyles.p}>
          This example demonstrates how to generate a Sign-In With Ethereum
          (SIWE) message using the <code>createSiweMessage</code> function, and
          then sign it using <code>ViemAccountAuthenticator.createAuthSig</code>{" "}
          function. This signed SIWE message (called an <code>authSig</code>)
          serves as cryptographic proof that Alice controls the Ethereum address
          the Access Control Conditions will be checking the balance for. The
          Lit Action derives the address from the signed SIWE message and uses
          it to check the balance.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Example Use Cases</h2>
        <p style={pageStyles.p}>
          Conditional execution in Lit Actions enables a wide range of
          applications where cryptographic operations depend on meeting specific
          criteria:
        </p>

        <div style={{ marginTop: "24px" }}>
          <h3 style={pageStyles.h3}>Access Control Scenarios</h3>
          <ul style={pageStyles.ul}>
            <li style={pageStyles.li}>
              <strong>Token-Gated Signing:</strong> Only sign transactions or
              messages for users holding specific ERC20 tokens, NFTs, or
              specific token balances
            </li>
            <li style={pageStyles.li}>
              <strong>Tiered Data Access:</strong> Provide different API access
              levels, data sets, or functionality based on user credentials or
              membership tiers
            </li>
            <li style={pageStyles.li}>
              <strong>Multi-Chain Requirements:</strong> Gate access based on
              assets or conditions across multiple blockchain networks
            </li>
            <li style={pageStyles.li}>
              <strong>DAO Membership:</strong> Restrict operations to verified
              DAO members or governance token holders
            </li>
          </ul>
        </div>

        <div style={{ marginTop: "24px" }}>
          <h3 style={pageStyles.h3}>Time-Based Logic</h3>
          <ul style={pageStyles.ul}>
            <li style={pageStyles.li}>
              <strong>Business Hours Automation:</strong> Execute different
              logic during business hours vs. after hours
            </li>
            <li style={pageStyles.li}>
              <strong>Time-Locked Execution:</strong> Grant execution only after
              specific timestamps or during scheduled time windows
            </li>
            <li style={pageStyles.li}>
              <strong>Scheduled Operations:</strong> Combine time conditions
              with other criteria for complex scheduling logic
            </li>
          </ul>
        </div>

        <div style={{ marginTop: "24px" }}>
          <h3 style={pageStyles.h3}>Dynamic Applications</h3>
          <ul style={pageStyles.ul}>
            <li style={pageStyles.li}>
              <strong>Conditional Workflows:</strong> Create self-executing
              logic that responds to changing on-chain or off-chain conditions
            </li>
            <li style={pageStyles.li}>
              <strong>Premium Services:</strong> Offer enhanced features, higher
              rate limits, or exclusive content based on user holdings
            </li>
            <li style={pageStyles.li}>
              <strong>Risk Management:</strong> Implement safety checks and
              conditional approvals for high-value operations
            </li>
          </ul>
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Important Considerations</h2>
        <p style={pageStyles.p}>
          When implementing conditional execution in your Lit Actions, it's
          important to understand how access control conditions work and plan
          for potential edge cases.
        </p>

        <h4 style={pageStyles.h4}>Condition Evaluation</h4>
        <p style={pageStyles.p}>
          The <code>checkConditions</code> function returns a boolean value
          indicating whether the authenticated user meets the specified
          conditions. Always handle both true and false cases gracefully in your
          logic flow.
        </p>

        <h4 style={pageStyles.h4}>Authentication Requirements</h4>
        <p style={pageStyles.p}>
          Condition checking requires a valid <code>authSig</code> parameter
          that proves the user's identity the Access Control Conditions will be
          checking against. In our example usage code example, this was handled
          by the code:
        </p>

        <DisplayCode
          code={`
const aliceViemAccount = privateKeyToAccount("0xprivateKey");
const aliceAuthSig = await ViemAccountAuthenticator.createAuthSig(
  aliceViemAccount,
  await createSiweMessage({
    walletAddress: aliceViemAccount.address,
    nonce: (await litClient.getContext()).latestBlockhash
  })
);`}
          language="typescript"
          style={{ marginBottom: "16px" }}
        />

        <div style={{ marginTop: "24px" }}>
          <h3 style={pageStyles.h3}>Available Condition Types</h3>
          <p style={pageStyles.p}>
            For a complete list of supported access control conditions and
            detailed examples, visit the{" "}
            <Link
              to="/encryption/access-control/boolean-logic"
              style={{
                color: "#007bff",
                textDecoration: "none",
                fontWeight: "500",
              }}
            >
              Access Control documentation
            </Link>
            .
          </p>
        </div>
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default LitActionsConditionalExecution;
