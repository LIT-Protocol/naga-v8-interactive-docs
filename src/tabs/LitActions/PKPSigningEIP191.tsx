/**
 * PKPSigningEIP191.tsx
 *
 * This component provides a comprehensive guide on signing EIP-191 messages
 * within Lit Actions using the ethPersonalSignMessageEcdsa function.
 */

import React from "react";
import GreyBoarderWhiteBgContainer from "../../components/layout/GreyboardWhiteBgContainer";
import { NoteCallout } from "../../components/common";
import DisplayCode from "../../components/DisplayCode";
import { Link } from "react-router-dom";
import { pageStyles } from "../../styles/pageStyles";

const LitActionsPKPSigningEIP191: React.FC = () => {
  const eip191SigningExample = `const _litActionCode = async () => {
  try {
    // Sign the message using EIP-191 standard
    const sigShare = await LitActions.ethPersonalSignMessageEcdsa({
      message: jsParams.message,
      publicKey: jsParams.publicKey,
      sigName: "messageSignature",
    });

    // sigShare is a boolean indicating success/failure
    // The actual signature is available under the sigName key
    if (sigShare) {
      LitActions.setResponse({ 
        response: "Message signed successfully",
        success: true
      });
    } else {
      LitActions.setResponse({ 
        response: "Failed to sign message",
        success: false
      });
    }
  } catch (error) {
    LitActions.setResponse({ 
      response: \`Error: \${error.message}\`,
      success: false
    });
  }
};

const litActionCode = \`(\${_litActionCode.toString()})();\`;

const result = await litClient.executeJs({
  code: litActionCode,
  authContext: authContext,
  jsParams: {
    message: "Hello, this is a test message for EIP-191 signing!",
    publicKey: pkpPublicKey,
  },
});

// The complete signature will be available in the result
console.log("Signature:", result.signatures.messageSignature);`;

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>PKP Signing with EIP-191</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Intro</h2>
        <p style={pageStyles.p}>
          The <code>ethPersonalSignMessageEcdsa</code> function allows you to
          sign messages using the{" "}
          <Link
            to="https://eips.ethereum.org/EIPS/eip-191"
            style={{
              color: "#0ea5e9",
              textDecoration: "none",
              fontWeight: "500",
            }}
            target="_blank"
            rel="noopener noreferrer"
          >
            EIP-191 standard
          </Link>{" "}
          directly within a Lit Action. This method automatically prepends{" "}
          <code>"\x19Ethereum Signed Message:\n"</code> and the message length
          to your message before hashing and signing it.
        </p>

        <p style={pageStyles.p}>
          EIP-191 message signing is commonly used for authentication by
          creating a cryptographic proof that a specific account holder authored
          a particular message.
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
                    color: "#0ea5e9",
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
                    color: "#0ea5e9",
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
          This example demonstrates how to sign a message using the EIP-191
          standard within a Lit Action.
        </p>

        <p style={pageStyles.p}>
          The <code>ethPersonalSignMessageEcdsa</code> function returns a{" "}
          <code>boolean</code> value indicating whether the signing was
          successful, while the actual signature is automatically appended to
          the Lit Action result using the specified <code>sigName</code> as the
          object key (<code>messageSignature</code> in this example).
        </p>

        <DisplayCode
          code={eip191SigningExample}
          language="typescript"
          style={{ marginBottom: "16px" }}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Example Use Cases</h2>
        <p style={pageStyles.p}>
          EIP-191 message signing within Lit Actions enables secure
          authentication and verification workflows that require cryptographic
          proof of message authorship:
        </p>

        <div style={{ marginTop: "24px" }}>
          <h3 style={pageStyles.h3}>Authentication & Verification</h3>
          <ul style={pageStyles.ul}>
            <li style={pageStyles.li}>
              <strong>Login Systems:</strong> Create secure login mechanisms
              that verify user identity through message signing
            </li>
            <li style={pageStyles.li}>
              <strong>Message Attestation:</strong> Prove that specific messages
              were authored by the PKP holder
            </li>
            <li style={pageStyles.li}>
              <strong>Data Integrity:</strong> Sign data payloads to ensure they
              haven't been tampered with
            </li>
          </ul>
        </div>

        <div style={{ marginTop: "24px" }}>
          <h3 style={pageStyles.h3}>Decentralized Applications</h3>
          <ul style={pageStyles.ul}>
            <li style={pageStyles.li}>
              <strong>Social Platforms:</strong> Sign posts, comments, or
              messages to verify authenticity
            </li>
            <li style={pageStyles.li}>
              <strong>Voting Systems:</strong> Sign votes or proposals to ensure
              they come from verified identities
            </li>
          </ul>
        </div>

        <div style={{ marginTop: "24px" }}>
          <h3 style={pageStyles.h3}>Oracle & Data Services</h3>
          <ul style={pageStyles.ul}>
            <li style={pageStyles.li}>
              <strong>Data Attestation:</strong> Sign external data feeds to
              verify their source and integrity
            </li>
            <li style={pageStyles.li}>
              <strong>API Response Verification:</strong> Prove that API
              responses haven't been modified in transit
            </li>
            <li style={pageStyles.li}>
              <strong>Timestamp Services:</strong> Create verifiable timestamps
              for events or data points
            </li>
          </ul>
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Important Considerations</h2>
        <p style={pageStyles.p}>
          When using <code>ethPersonalSignMessageEcdsa</code> within Lit
          Actions, there are several important factors to consider:
        </p>

        <h4 style={pageStyles.h4}>EIP-191 Message Format</h4>
        <p style={pageStyles.p}>
          The function automatically formats your message according to EIP-191
          by prepending <code>"\x19Ethereum Signed Message:\n"</code> and the
          message length. You don't need to format the message yourself - just
          provide the raw message content.
        </p>

        <h4 style={pageStyles.h4}>Return Value Structure</h4>
        <p style={pageStyles.p}>
          <code>ethPersonalSignMessageEcdsa</code> returns a boolean indicating
          success or failure. The actual signature is made available in the
          execution result under the <code>sigName</code> you specify when
          calling the function.
        </p>

        <h4 style={pageStyles.h4}>PKP Permissions</h4>
        <p style={pageStyles.p}>
          To allow your Lit Action to sign with a PKP, you must{" "}
          <Link
            to="/programmable-keys/pkps/auth-methods/add-remove"
            style={{
              color: "#0ea5e9",
              textDecoration: "none",
              fontWeight: "500",
            }}
          >
            add the Lit Action's IPFS CID as a permitted Auth Method
          </Link>{" "}
          for the PKP, and grant it either the <code>sign-anything</code>{" "}
          capability to enable general-purpose signing, or restrict access to
          the <code>personal-sign</code> capability to limit the PKP to only
          using <code>ethPersonalSignMessageEcdsa</code>. The latter ensures the
          Lit Action can only sign personal messages, not arbitrary data or
          transactions via <code>signAndCombineEcdsa</code>.
        </p>
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default LitActionsPKPSigningEIP191;
