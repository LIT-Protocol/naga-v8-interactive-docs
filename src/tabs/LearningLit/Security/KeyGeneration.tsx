/**
 * KeyGeneration.tsx
 *
 * This component details the technical workings of Lit Protocol.
 */

import React from "react";
import GreyBoarderWhiteBgContainer from "../../../components/layout/GreyboardWhiteBgContainer";

const KeyGenerationTab: React.FC = () => {
  const pageStyles = {
    container: {
      maxWidth: "1000px",
      margin: "0 auto",
      padding: "20px",
    },
    h1: {
      fontSize: "2.5rem",
      fontWeight: "700",
      color: "#1f2937",
      marginBottom: "24px",
    },
    h2: {
      fontSize: "2rem",
      fontWeight: "600",
      color: "#1f2937",
      marginBottom: "16px",
      borderBottom: "1px solid #e5e7eb",
      paddingBottom: "8px",
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: "600",
      color: "#374151",
      marginTop: "24px",
      marginBottom: "12px",
    },
    p: {
      fontSize: "1rem",
      lineHeight: "1.6",
      color: "#4b5563",
      marginBottom: "16px",
    },
    ul: {
      listStyleType: "disc",
      paddingLeft: "20px",
      marginBottom: "16px",
    },
    li: {
      marginBottom: "8px",
      color: "#4b5563",
    },
  };

  return (
    <div style={pageStyles.container}>
      <h1 style={pageStyles.h1}>Distributed Key Generation</h1>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Intro</h2>
        <p style={pageStyles.p}>
          All Lit Protocol node operators use a{" "}
          <a
            href="https://github.com/LIT-Protocol/whitepaper/blob/main/Lit%20Protocol%20Whitepaper%20(2024).pdf"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#3b82f6", textDecoration: "underline" }}
          >
            Distributed Key Generation (DKG)
          </a>{" "}
          process to collectively generate all of the signing and encryption
          keys managed by the network. DKG ensures that no single node or party
          ever has access to any key in its entirety, as the entire key never
          exists at all. Instead, more than a threshold of the Lit nodes must
          come together (more than two-thirds of the network) to generate these
          keys and perform signing and decryption operations.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Root Keys</h2>
        <p style={pageStyles.p}>
          All signing keys are derived hierarchically from a set of root keys.
          These root keys are periodically refreshed or reshared (see below) and
          are backed up regularly. See the recovery section below for more
          information on the backup process.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Key Refresh and Resharing</h2>
        <p style={pageStyles.p}>
          Periodically, key shares are updated with a refresh scheme. This
          rotates the private key shares among an existing set of participating
          node operators without changing the underlying private key, a process
          known as{" "}
          <a
            href="https://github.com/LIT-Protocol/whitepaper/blob/main/Lit%20Protocol%20Whitepaper%20(2024).pdf"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#3b82f6", textDecoration: "underline" }}
          >
            Proactive Secret Sharing.
          </a>{" "}
          This method helps ensure the integrity of private key material for
          long periods of time while minimizing the risk of key compromise.
        </p>
        <p style={pageStyles.p}>
          The key refresh protocol is performed by first linearizing all of the
          key shares, running the same DKG algorithm with existing participants,
          then checking that the public key doesn't change.
        </p>
        <p style={pageStyles.p}>
          Key resharing includes the additional ability to update the set of
          participating node operators. This scheme allows nodes to leave and
          join without disrupting the service of the network. This process
          involves transitioning from the existing participant set to the new
          participant set, and can be performed as long as there are enough
          existing participants with key shares. The end result is that the new
          node operator who is dealt into the active set holds threshold shares
          of the same private key. This works by having existing participants
          linearize their shares, and new participants set their share to zero
          and run the same DKG while checking that the same public key is
          generated.
        </p>
        <p style={pageStyles.p}>
          Key refresh can be seen as a natural case of key resharing, with the
          participants and threshold potentially changing.
        </p>
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default KeyGenerationTab;
