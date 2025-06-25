/**
 * HowItWorksTab.tsx
 *
 * This component details the technical workings of Lit Protocol.
 */

import React from "react";
import { Link } from "react-router-dom";
import GreyBoarderWhiteBgContainer from "../../components/layout/GreyboardWhiteBgContainer";
import { NextSteps } from "../../components/common";

const HowItWorksTab: React.FC = () => {
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
      <h1 style={pageStyles.h1}>How Does Lit Protocol Work</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Overview</h2>
        <p style={pageStyles.p}>
          Lit Protocol is a decentralized and programmable key management
          network for signing and encryption. The network is composed of a
          decentralized set of independent nodes, each running inside of a
          sealed Trusted Execution Environment (TEE). Within the TEE each node
          contains a unique set of key shares alongside a JavaScript execution
          environment. Each individual key share corresponds to a certain
          threshold signing or encryption key, each managed collectively by all
          of the nodes participating in the network.
        </p>
        <p style={pageStyles.p}>
          Developers can write immutable JS functions (called Lit Actions) that
          dictate how the keys managed by the network are used. This includes
          creating transaction automations, spending policies, access control
          rules, and more. These Lit Action functions inherit the same threshold
          and TEE-based security assumptions as the rest of the network as they
          are executed within the JS execution environment present in each node.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Managing Keys and Other Secrets</h2>
        <p style={pageStyles.p}>
          Each Lit Protocol node participates in a Distributed Key Generation
          (DKG) process to create new public/private key pairs where no one
          party ever holds the entire key. Instead, each node holds a key share
          used to perform its portion of signing and decryption operations in
          parallel with the rest of the network. All operations require
          participation from more than two-thirds of the network to be executed.
          At no point during signing or decryption is the underlying private key
          exposed to any single node or requesting client.
        </p>
        <p style={pageStyles.p}>
          The Lit network supports multiple cryptographic curves, signing
          schemes, and key types. Additional curves and schemes can be added as
          desired to enable additional interoperability with a wide variety of
          protocols and standards.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>
          Policy Enforcement and Data Orchestration – Lit Actions
        </h2>
        <p style={pageStyles.p}>
          Each Lit node contains a JavaScript execution environment which allows
          developers to write arbitrary code that dictates how the secrets and
          keys managed by the network are used. These programs are called Lit
          Actions, immutable JS serverless functions that govern signing and
          encryption / decryption operations. Lit Actions can natively fetch and
          process data from any on or off-chain source, be used to create
          complex transaction automations (e.g. dollar-cost-averaging), define
          rules for usage and access, create spending policies, trigger
          signature generation, and more.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Further Reading</h2>
        <p style={pageStyles.p}>
          For an in-depth overview of how Lit keeps keys and assets secure,
          please check out the{" "}
          <Link
            to="/security/introduction"
            style={{ color: "#3b82f6", textDecoration: "underline" }}
          >
            security
          </Link>{" "}
          section.
        </p>
      </GreyBoarderWhiteBgContainer>

      <NextSteps>
        Now that you understand how Lit Protocol works, explore the{" "}
        <Link
          to="/building-with-lit/setup-lit-client"
          style={{ color: "#3b82f6", textDecoration: "underline" }}
        >
          Lit Auth Provider Demo
        </Link>{" "}
        to see these concepts in action and learn how to implement Lit's
        authentication and authorization capabilities in your own applications.
      </NextSteps>
    </div>
  );
};

export default HowItWorksTab;
