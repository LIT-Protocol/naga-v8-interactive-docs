/**
 * CommunicatingWithNodes.tsx
 *
 * This component details the technical workings of Lit Protocol.
 */

import React from "react";
import GreyBoarderWhiteBgContainer from "../../../components/layout/GreyboardWhiteBgContainer";

const CommunicatingWithNodes: React.FC = () => {
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
      <h1 style={pageStyles.h1}>Communicating with Lit Nodes</h1>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Intro</h2>
        <p style={pageStyles.p}>
          This section explains how communications with Lit nodes are secured
          when performing signing, encryption, and private compute operations
          within Lit Actions.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Secure Communication Channels</h2>
        <p style={pageStyles.p}>
          All interactions between users and Lit nodes are encrypted using
          SSL/TLS. This ensures that data sent to the nodes — whether for
          signing, decryption, or executing a Lit Actions — is protected from
          interception or tampering during transmission. Each node's SSL
          certificate is stored within its Trusted Execution Environment (TEE),
          making it computationally infeasible for node operators or external
          parties to access or manipulate them.
        </p>
        <p style={pageStyles.p}>
          When you send a request — either performing signing, decryption, or
          executing a Lit Action — it is:
        </p>
        <ul style={pageStyles.ul}>
          <li style={pageStyles.li}>
            <strong>Encrypted in transit:</strong> Secured by SSL/TLS until it
            reaches the node.
          </li>
          <li style={pageStyles.li}>
            <strong>Decrypted only inside the TEE:</strong> Processed in its
            clear form within the TEE, where hardware-enforced security prevents
            access by node operators or others.
          </li>
        </ul>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Node-to-Node Communication</h2>
        <p style={pageStyles.p}>
          When Lit nodes communicate with one another to execute user requests,
          these node-to-node communications are also secured using SSL.
        </p>
        <p style={pageStyles.p}>
          Before communicating with one another, the nodes perform a handshake
          process to verify:
        </p>
        <ul style={pageStyles.ul}>
          <li style={pageStyles.li}>
            <strong>Staking verification:</strong> Confirms the node is staking
            the requisite protocol tokens.
          </li>
          <li style={pageStyles.li}>
            <strong>Attestation check:</strong> Ensures the node is running
            untampered, correct code within its TEE.
          </li>
          <li style={pageStyles.li}>
            <strong>Network membership:</strong> Validates the node is part of
            the active node operator set.
          </li>
        </ul>
        <p style={pageStyles.p}>
          Only after successful verification do nodes transmit data, ensuring
          sensitive information is never exposed to untrusted or compromised
          nodes.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Are Requests Publicly Visible?</h2>
        <p style={pageStyles.p}>
          A common question is whether requests sent to the Lit network,
          including sensitive data, are publicly visible or retrievable. The
          answer is <strong>no</strong>:
        </p>
        <ul style={pageStyles.ul}>
          <li style={pageStyles.li}>
            <strong>Encrypted transmission:</strong> All requests are encrypted
            via SSL/TLS, preventing interception.
          </li>
          <li style={pageStyles.li}>
            <strong>Secure processing:</strong> Data is only decrypted and
            processed inside the TEE, never stored or logged in clear text
            outside it.
          </li>
          <li style={pageStyles.li}>
            <strong>No public broadcast:</strong> Requests are not broadcast in
            a way that makes them fetchable by anyone. Nodes only share data
            with other verified nodes via secure channels.
          </li>
        </ul>
        {/* TODO Link to Lit Actions */}
        <p style={pageStyles.p}>
          This holds true for all network operations, including signing,
          decryption, and Lit Action execution. It means that neither node
          operators nor any external parties can see or access the contents of
          any request. This includes any sensitive data passed into the
          <code>jsParams</code> of Lit Actions, such as environment variables
          like API or private keys.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Complete Request Lifecycle</h2>
        <p style={pageStyles.p}>
          The following is the complete request lifecycle when communicating
          with the Lit nodes:
        </p>
        <ol style={pageStyles.ol}>
          <li style={pageStyles.li}>
            A user sends a request to N nodes, where N must be at or above the
            threshold ({">"} two-thirds of the network), with their associated
            authentication material.
          </li>
          <li style={pageStyles.li}>
            Each node independently verifies the user's auth material, ensuring
            they are authorized to perform a given operation. After the
            verification check is complete, they each run the requested
            operation (signing, decryption, or Lit Action execution.)
          </li>
          {/* TODO Link to PKPs */}
          <li style={pageStyles.li}>
            In the case of interactive requests — such as ECDSA signing with
            Programmable Key Pairs — the nodes communicate with one another to
            complete those operations as needed.
          </li>
          <li style={pageStyles.li}>
            All operations are driven by the user - a node can not ask another
            node to sign or participate unless the user has also asked the other
            node to perform the same operation. This means that a matching
            "pending request" from the requesting user must be present on{" "}
            <strong>all</strong> nodes participating in interactive operations.
          </li>
        </ol>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Active Nodes</h2>
        <p style={pageStyles.p}>
          The Naga node operator set will be selected via a staking contest
          following the Lit TGE. Any party interested in running a node will be
          able to participate and the top 10 node operators based on "
          <a
            href="https://github.com/LIT-Protocol/LITKEY-Token-Paper-v1/blob/main/%24LITKEY%20Whitepaper%20-%20v1.pdf"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#3b82f6", textDecoration: "underline" }}
          >
            stake weight
          </a>
          " will make up the initial operator set. More information will be
          shared ahead of the launch.
        </p>
        <p style={pageStyles.p}>
          Interested in running a node?{" "}
          <a
            href="https://forms.gle/n4WKtsyxaduEz8dDA"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#3b82f6", textDecoration: "underline" }}
          >
            Reach out.
          </a>
        </p>
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default CommunicatingWithNodes;
