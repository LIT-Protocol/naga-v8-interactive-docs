/**
 * CryptoeconomicSecurity.tsx
 *
 * This component details the technical workings of Lit Protocol.
 */

import React from "react";
import GreyBoarderWhiteBgContainer from "../../../components/layout/GreyboardWhiteBgContainer";
import { NoteCallout } from "../../../components/common";

const CryptoeconomicSecurity: React.FC = () => {
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
    ol: {
      listStyleType: "decimal",
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
      <h1 style={pageStyles.h1}>Cryptoeconomic Security</h1>

      <NoteCallout
        message={
          <>
            <p>
              The $LITKEY token and v1 Mainnet are <strong>NOT YET LIVE</strong>
              , but are coming soon.
            </p>
            <p>
              <a
                href="https://x.com/LitProtocol"
                target="_blank"
                style={{ color: "#3b82f6", textDecoration: "underline" }}
              >
                Follow Lit Protocol on X
              </a>{" "}
              to stay up to date.
            </p>
          </>
        }
        variant="note"
        style={{ marginBottom: "16px" }}
      />

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <p style={pageStyles.p}>
          While threshold cryptography and TEEs provide technical security
          guarantees, the $LITKEY token introduces cryptoeconomic security that
          adds another layer of <strong>defense in depth</strong>.
        </p>
        <p style={pageStyles.p}>
          <strong>$LITKEY ensures liveness</strong> by requiring node operators
          to stake tokens in order to participate in the signing, encryption,
          and compute operations provided by the network. Slashing has been
          implemented to ensure that node operators keep their machines online
          and responsive at all times, preventing any downtime that could
          disrupt the network. Unlike some other protocols where slashing may
          also enforce computational 'correctness,' Lit Protocol relies on
          Trusted Execution Environments (TEEs) and threshold consensus
          mechanisms to guarantee the accuracy and integrity of operations. As a
          result, slashing in Lit Protocol is{" "}
          <strong>
            specifically designed to enforce availability and liveness rather
            than correctness.
          </strong>
        </p>
        <p style={pageStyles.p}>
          Additionally, token holders who aren't node operators themselves will
          be able to delegate their $LITKEY tokens to a node operator(s) of
          their choice, curating the set of active node operators and helping
          distribute cryptographic security across a broader set of
          participants.
        </p>
        <p style={pageStyles.p}>
          You can learn more about the role and utility of the $LITKEY token by
          checking out the{" "}
          <a
            href="https://github.com/LIT-Protocol/LITKEY-Token-Paper-v1/blob/main/%24LITKEY%20Whitepaper%20-%20v1.pdf"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#3b82f6", textDecoration: "underline" }}
          >
            token whitepaper
          </a>
          .
        </p>
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default CryptoeconomicSecurity;
