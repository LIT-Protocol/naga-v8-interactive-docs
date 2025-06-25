/**
 * NodeArchitectureTab.tsx
 *
 * This component details the technical workings of Lit Protocol.
 */

import React from "react";
import GreyBoarderWhiteBgContainer from "../../../components/layout/GreyboardWhiteBgContainer";
import { ImageModal } from "../../../components/common";
import litNodeArch from "../../../assets/lit-node-arch.png";

const NodeArchitectureTab: React.FC = () => {
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
      <h1 style={pageStyles.h1}>Lit Node Architecture</h1>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <ImageModal
            src={litNodeArch}
            alt="Lit Node Architecture"
            style={{
              maxWidth: "100%",
              height: "auto",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          />
        </div>
        <p style={pageStyles.p}>
          Each Lit Protocol Node starts with a sealed encrypted virtual machine
          (otherwise known as a Trusted Execution Environment (TEE)) running on
          an independently operated server. The use of the TEE guarantees that
          all signing, encryption, and Lit Action execution requests are
          processed securely, without exposing sensitive key material to node
          operators or end users consuming the services provided by Lit
          Protocol. Each time you connect to the Lit network, you do an
          attestation handshake with each of the nodes. The Lit SDK
          automatically checks this attestation against certificates provided by
          AMD (the secure hardware utilized by Lit is AMD’s SEV-SNP), and also
          checks the details of the attestation report to verify that the node
          is genuine and running the correct version of the code.
        </p>
        <p style={pageStyles.p}>
          Within the sealed hardware, each Lit node contains a JavaScript
          execution environment (
          <a
            href="https://deno.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#3b82f6", textDecoration: "underline" }}
          >
            Deno
          </a>
          ) and any given number of key shares. Each key share corresponds to a
          key pair that is generated collectively by all participating nodes
          using a process called distributed key generation (DKG).
        </p>
        <p style={pageStyles.p}>
          The diagram above illustrates the make-up of a single Lit node (left),
          a threshold of Lit nodes cooperating to perform a given operation
          (middle), and a finally collection of Lit networks interoperating
          across a subnet architecture (right).
        </p>
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default NodeArchitectureTab;
