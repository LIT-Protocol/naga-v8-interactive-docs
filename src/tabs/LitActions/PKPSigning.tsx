/**
 * PKPSigning.tsx
 *
 * This component provides a comprehensive guide on signing and combining
 * signature shares directly within Lit Actions using the signAndCombineEcdsa function.
 */

import React from "react";
import GreyBoarderWhiteBgContainer from "../../components/layout/GreyboardWhiteBgContainer";
import { NoteCallout } from "../../components/common";
import DisplayCode from "../../components/DisplayCode";
import { Link } from "react-router-dom";
import { pageStyles } from "../../styles/pageStyles";

const LitActionsPKPSigning: React.FC = () => {
  const pkpSigningExample = `const _litActionCode = async () => {
  try {
    // Combine signature shares directly within the Lit Action
    const signature = await Lit.Actions.signAndCombineEcdsa({
      toSign: jsParams.toSign,
      publicKey: jsParams.publicKey,
      sigName: "transactionSignature",
    });

    // Parse and format the signature for use with ethers.js
    const jsonSignature = JSON.parse(signature);
    jsonSignature.r = "0x" + jsonSignature.r.substring(2);
    jsonSignature.s = "0x" + jsonSignature.s;
    const hexSignature = ethers.utils.joinSignature(jsonSignature);

    // Serialize the signed transaction
    const signedTx = ethers.utils.serializeTransaction(
      jsParams.unsignedTransaction,
      hexSignature
    );

    // Verify the signature by recovering the address
    const recoveredAddress = ethers.utils.recoverAddress(jsParams.toSign, hexSignature);
    console.log("Recovered Address:", recoveredAddress);

    // Submit the transaction using runOnce to avoid duplicate submissions
    const response = await Lit.Actions.runOnce(
      { waitForResponse: true, name: "txnSender" },
      async () => {
        try {
          const rpcUrl = await Lit.Actions.getRpcUrl({ chain: jsParams.chain });
          const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
          const transactionReceipt = await provider.sendTransaction(signedTx);

          return \`Transaction sent successfully. Hash: \${transactionReceipt.hash}\`;
        } catch (error) {
          return \`Error sending transaction: \${error.message}\`;
        }
      }
    );

    Lit.Actions.setResponse({ response });
  } catch (error) {
    Lit.Actions.setResponse({ response: \`Error: \${error.message}\` });
  }
};

const litActionCode = \`(\${_litActionCode.toString()})();\`;

const result = await litClient.executeJs({
  code: litActionCode,
  authContext: authContext,
  jsParams: {
    toSign: unsignedExampleTransactionHash,
    publicKey: pkpPublicKey,
    unsignedTransaction: unsignedExampleTransaction,
    chain: "ethereum",
  },
});`;

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>PKP Signing</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Intro</h2>
        <p style={pageStyles.p}>
          The <code>signAndCombineEcdsa</code> function allows you to combine
          PKP signature shares directly within a Lit Action, rather than
          combining them client-side. This powerful capability enables you to
          use the complete signature within your Lit Action for operations like
          submitting signed transactions or creating signed messages.
        </p>

        <p style={pageStyles.p}>
          When using this function, signature shares are collected from each Lit
          node and combined on a single node, all within the secure{" "}
          <Link
            to="/learning-lit/security/node-architecture"
            style={{
              color: "#007bff",
              textDecoration: "none",
              fontWeight: "500",
            }}
          >
            Trusted Execution Environment (TEE)
          </Link>
          . The signature shares will remain within the TEE, never being exposed
          to the outside world, unless you explicitly share them.
        </p>

        <div style={{ marginTop: "24px" }}>
          <h3 style={pageStyles.h3}>Key Benefits</h3>
          <ul style={pageStyles.ul}>
            <li style={pageStyles.li}>
              <strong>Server-Side Signing:</strong> Complete the entire signing
              and transaction submission process within the Lit Action
            </li>
            <li style={pageStyles.li}>
              <strong>Enhanced Security:</strong> Signature shares remain within
              the TEE without exposure to external environments, unless you
              explicitly choose to share them
            </li>
            <li style={pageStyles.li}>
              <strong>Automated Workflows:</strong> Build end-to-end transaction
              flows that don't require client-side intervention
            </li>
            <li style={pageStyles.li}>
              <strong>Conditional Signatures:</strong> Combine with access
              control conditions for sophisticated automated signing logic
            </li>
          </ul>
        </div>
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
                This example requires a PKP (Programmable Key Pair) with
                appropriate permissions. Learn more about{" "}
                <Link
                  to={"/programmable-keys/overview"}
                  style={{
                    color: "#007bff",
                    textDecoration: "none",
                    fontSize: "0.9rem",
                    fontWeight: "500",
                  }}
                >
                  PKPs
                </Link>
                .
              </p>
            </>
          }
          variant="note"
          style={{ marginBottom: "16px" }}
        />

        <p style={pageStyles.p}>
          This example demonstrates how to sign a blockchain transaction and
          submit it entirely within a Lit Action. The process involves combining
          signature shares using <code>signAndCombineEcdsa</code>, formatting
          the signature for use with ethers.js, and then submitting the signed
          transaction to the blockchain.
        </p>

        <DisplayCode
          code={pkpSigningExample}
          language="typescript"
          style={{ marginBottom: "16px" }}
        />

        <NoteCallout
          message={
            <>
              <p>
                This example code uses <code>runOnce()</code> to ensure the
                transaction is only submitted once, however it's required that
                the <code>signAndCombineEcdsa</code> logic exists outside of the{" "}
                <code>runOnce</code> function. This is because 2/3 of the Lit
                nodes are required in order to produce the signature shares to
                form a complete signature for the PKP.
              </p>
            </>
          }
          variant="info"
          title="Signing must be done outside of runOnce"
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Example Use Cases</h2>
        <p style={pageStyles.p}>
          PKP signing within Lit Actions enables powerful automated workflows
          that combine cryptographic operations with programmable logic:
        </p>

        <div style={{ marginTop: "24px" }}>
          <h3 style={pageStyles.h3}>Transaction Automation</h3>
          <ul style={pageStyles.ul}>
            <li style={pageStyles.li}>
              <strong>Conditional Payments:</strong> Automatically execute
              payments when specific on-chain or off-chain conditions are met
            </li>
            <li style={pageStyles.li}>
              <strong>Scheduled Transactions:</strong> Execute transactions at
              predetermined times or intervals without manual intervention
            </li>
            <li style={pageStyles.li}>
              <strong>Cross-Chain Operations:</strong> Coordinate and execute
              transactions across multiple blockchain networks
            </li>
          </ul>
        </div>

        <div style={{ marginTop: "24px" }}>
          <h3 style={pageStyles.h3}>DeFi Automation</h3>
          <ul style={pageStyles.ul}>
            <li style={pageStyles.li}>
              <strong>Automated Trading:</strong> Execute trades based on price
              feeds or market conditions
            </li>
            <li style={pageStyles.li}>
              <strong>Yield Farming:</strong> Automatically compound rewards or
              rebalance positions
            </li>
            <li style={pageStyles.li}>
              <strong>Liquidation Protection:</strong> Monitor positions and
              automatically adjust to prevent liquidations
            </li>
          </ul>
        </div>

        <div style={{ marginTop: "24px" }}>
          <h3 style={pageStyles.h3}>Smart Contract Interactions</h3>
          <ul style={pageStyles.ul}>
            <li style={pageStyles.li}>
              <strong>Governance Participation:</strong> Automatically vote on
              proposals based on predefined criteria
            </li>
            <li style={pageStyles.li}>
              <strong>Contract Upgrades:</strong> Execute contract upgrades or
              parameter changes when conditions are met
            </li>
            <li style={pageStyles.li}>
              <strong>Emergency Responses:</strong> Trigger emergency actions
              like pausing contracts or withdrawing funds
            </li>
          </ul>
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Important Considerations</h2>
        <p style={pageStyles.p}>
          When using <code>signAndCombineEcdsa</code> within Lit Actions, there
          are several important factors to consider for secure and effective
          implementation.
        </p>

        <h4 style={pageStyles.h4}>Signature Share Combination</h4>
        <p style={pageStyles.p}>
          The <code>signAndCombineEcdsa</code> function collects signature
          shares from each Lit node and combines them on a single node. This
          process happens entirely within the TEE, ensuring that individual
          signature shares are never exposed outside the secure environment.
        </p>

        <h4 style={pageStyles.h4}>Transaction Submission</h4>
        <p style={pageStyles.p}>
          When submitting transactions, always use{" "}
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
          to prevent duplicate submissions.
        </p>

        <h4 style={pageStyles.h4}>PKP Permissions</h4>
        <p style={pageStyles.p}>
          Ensure your PKP has the appropriate permissions to sign within the Lit
          Action by{" "}
          <Link
            to="/programmable-keys/pkps/auth-methods/add-remove"
            style={{
              color: "#007bff",
              textDecoration: "none",
              fontWeight: "500",
            }}
          >
            permitting the Lit Action's IPFS CID as a permitted Auth Method
          </Link>{" "}
          with the <code>sign-anything</code> capability.
        </p>

        <h4 style={pageStyles.h4}>
          PKP Signing Must Happen Outside of <code>runOnce</code>
        </h4>
        <p style={pageStyles.p}>
          As mentioned above, the <code>signAndCombineEcdsa</code> function must
          be called outside of the <code>runOnce</code> function. This is
          because 2/3 of the Lit nodes are required in order to produce the
          signature shares to form a complete signature for the PKP. Including
          the <code>signAndCombineEcdsa</code> function within the{" "}
          <code>runOnce</code> function will result in the Lit Action timing
          out.
        </p>
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default LitActionsPKPSigning;
