/**
 * Decrypting.tsx
 *
 * This component provides a comprehensive guide on decrypting content
 * within Lit Actions using the decryptAndCombine function.
 */

import React from "react";
import GreyBoarderWhiteBgContainer from "../../components/layout/GreyboardWhiteBgContainer";
import { NoteCallout } from "../../components/common";
import DisplayCode from "../../components/DisplayCode";
import { Link } from "react-router-dom";
import { pageStyles } from "../../styles/pageStyles";

const LitActionsDecrypting: React.FC = () => {
  const encryptionExample = `// First, encrypt your data client-side
const accessControlConditions = createAccBuilder().requireEthBalance(
  '10000000000000000', '>='
).on('ethereum').build();

const encryptedData = await litClient.encrypt({
  dataToEncrypt: 'The answer to life, the universe, and everything is 42',
  unifiedAccessControlConditions: accessControlConditions,
  chain: 'ethereum',
});`;

  const decryptionExample = `// Then, decrypt within your Lit Action
const _litActionCode = async () => {
  try {
      // Decrypt the content using decryptAndCombine
      const decryptedContent = await LitActions.decryptAndCombine({
        accessControlConditions: jsParams.accessControlConditions,
        ciphertext: jsParams.ciphertext,
        dataToEncryptHash: jsParams.dataToEncryptHash,
        // The authenticated identity from the authContext used
        // to make the decryption request is automatically used
        // for the decryption request
        authSig: null,
        chain: 'ethereum',
    });

    // Use the decrypted content for your logic
    LitActions.setResponse({
      response: \`Successfully decrypted: \${decryptedContent}\`,
      success: true
    });
  } catch (error) {
    LitActions.setResponse({
      response: \`Decryption failed: \${error.message}\`,
      success: false
    });
  }
};

const litActionCode = \`(\${_litActionCode.toString()})();\`;

// Execute the Lit Action
const result = await litClient.executeJs({
  code: litActionCode,
  authContext: authContext,
  jsParams: {
      accessControlConditions,
      ciphertext: encryptedData.ciphertext,
      dataToEncryptHash: encryptedData.dataToEncryptHash,
    },
});

console.log("Decrypted content:", result.response);`;

  const ipfsCidExample = `// Restrict decryption to specific Lit Action using IPFS CID
const restrictedAccessControlConditions = [
  {
    contractAddress: '',
    standardContractType: '',
    chain: 'ethereum',
    method: '',
    parameters: [':currentActionIpfsId'],
    returnValueTest: {
      comparator: '=',
      value: 'QmYourLitActionIPFSCID...', // Your specific Lit Action CID
    },
  }
];`;

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>Decrypting within Lit Actions</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Intro</h2>
        <p style={pageStyles.p}>
          The <code>decryptAndCombine</code> function enables you to decrypt
          content directly within a Lit Action. This powerful capability allows
          you to perform operations over sensitive data while keeping the
          decrypted content secure within each Lit node's{" "}
          <Link
            to="/learning-lit/security/node-architecture"
            style={{
              color: "#0ea5e9",
              textDecoration: "none",
              fontWeight: "500",
            }}
          >
            Trusted Execution Environment (TEE)
          </Link>
          .
        </p>

        <p style={pageStyles.p}>
          Unlike traditional client-side decryption, this approach ensures that
          sensitive data never leaves the secure environment of the Lit nodes,
          making it ideal for scenarios involving API keys, private credentials,
          or confidential data processing.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Example Usage</h2>

        <NoteCallout
          message={
            <>
              <p>
                This example assumes you have already set up the Lit Client and
                Auth Context. For setup instructions, refer to the{" "}
                <Link
                  to={"/lit-actions/overview"}
                  style={{
                    color: "#0ea5e9",
                    textDecoration: "none",
                    fontSize: "0.9rem",
                    fontWeight: "500",
                  }}
                >
                  Lit Actions Overview
                </Link>
                .
              </p>
            </>
          }
          variant="note"
          style={{ marginBottom: "16px" }}
        />

        <h3 style={pageStyles.h3}>Step 1: Encrypt Your Data</h3>
        <p style={pageStyles.p}>
          First, encrypt your data client-side using the standard Lit encryption
          process. This generates the <code>ciphertext</code> and{" "}
          <code>dataToEncryptHash</code> needed later for decryption (can you
          learn more about this proccess in the{" "}
          <Link
            to="/encryption-access-control/encrypting"
            style={{
              color: "#0ea5e9",
              textDecoration: "none",
              fontWeight: "500",
            }}
          >
            Encryption & Access Control
          </Link>{" "}
          section):
        </p>

        <DisplayCode
          code={encryptionExample}
          language="typescript"
          style={{ marginBottom: "24px" }}
        />

        <h3 style={pageStyles.h3}>Step 2: Decrypt within Lit Action</h3>
        <p style={pageStyles.p}>
          Use the <code>decryptAndCombine</code> function within your Lit Action
          to decrypt the content. The decrypted data remains secure within the
          TEE environment:
        </p>

        <DisplayCode
          code={decryptionExample}
          language="typescript"
          style={{ marginBottom: "16px" }}
        />

        <NoteCallout
          message={
            <>
              <p>
                As shown in the code example, the <code>decryptAndCombine</code>{" "}
                function will automatically use the identity provided in the{" "}
                <code>authContext</code> for decryption, unless you explicitly
                pass a different <code>authSig</code>.
              </p>
              <p>
                You might explicitly set <code>authSig</code> when the identity
                permitted to decrypt the data is different from the identity
                used to execute the Lit Action. This approach is still secure
                because Lit Actions are immutable, so the executor cannot modify
                the code to extract decrypted data and wouldn't otherwise be
                able to access it unless the action is intentionally returning
                the decrypted data.
              </p>
            </>
          }
          variant="info"
        />

        {/* TODO Need to figure out proper syntax for this */}
        {/* <h3 style={pageStyles.h3}>Restricting Access to Specific Actions</h3>
        <p style={pageStyles.p}>
          For maximum security, you can restrict decryption to only a specific
          Lit Action using its IPFS CID. This ensures only that particular
          Action can decrypt the sensitive data.
        </p>

        <DisplayCode
          code={ipfsCidExample}
          language="typescript"
          style={{ marginBottom: "16px" }}
        /> */}
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default LitActionsDecrypting;
