/**
 * HowItWorksTab.tsx
 *
 * This component details the technical workings of Lit Protocol.
 */

import React from "react";
import GreyBoarderWhiteBgContainer from "../../components/layout/GreyboardWhiteBgContainer";
import { Link } from "react-router-dom";

// A helper component for external links to ensure they open in a new tab.
const LinkExt = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    style={{ color: "#3b82f6", textDecoration: "underline" }}
  >
    {children}
  </a>
);

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
      <h1 style={pageStyles.h1}>How Lit Protocol Works</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Introduction</h2>
        <p style={pageStyles.p}>
          Lit Protocol combines advanced cryptography, confidential hardware,
          and peer-to-peer networking to provide a decentralized platform for
          key management and secure computation. Below, we explore the core
          components and mechanisms that enable these capabilities.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>The Lit Nodes</h2>
        <p style={pageStyles.p}>
          At the heart of Lit Protocol are the <b>Lit Nodes</b>, which are
          independently operated servers that collectively form the Lit Network.
          These nodes perform the computational and cryptographic operations
          necessary for the protocol's functionality.
        </p>

        <h3 style={pageStyles.h3}>Trusted Execution Environments (TEEs)</h3>
        <p style={pageStyles.p}>
          Each Lit Node runs within a <b>Trusted Execution Environment (TEE)</b>{" "}
          provided by{" "}
          <LinkExt href="https://www.amd.com/content/dam/amd/en/documents/epyc-business-docs/solution-briefs/amd-secure-encrypted-virtualization-solution-brief.pdf">
            AMD's SEV-SNP
          </LinkExt>{" "}
          technology. TEEs offer a secure area within a computer's processor,
          ensuring that code and data loaded inside are protected. This allows
          for:
        </p>
        <ul style={pageStyles.ul}>
          <li style={pageStyles.li}>
            <b>Confidentiality:</b> Data processed inside the TEE is encrypted
            and cannot be accessed by the node operator or any external entity.
          </li>
          <li style={pageStyles.li}>
            <b>Integrity:</b> The code running inside the TEE cannot be tampered
            with, ensuring that nodes execute the correct software.
          </li>
          <li style={pageStyles.li}>
            <b>Remote Attestation:</b> TEEs provide mechanisms for verifying
            that the code running within them is genuine and has not been
            altered.
          </li>
        </ul>
        <p style={pageStyles.p}>
          By leveraging TEEs, Lit Protocol ensures that even though nodes are
          operated by independent parties, the computations they perform are
          secure and confidential.
        </p>

        <h3 style={pageStyles.h3}>
          Threshold Cryptography and Distributed Key Generation (DKG)
        </h3>
        <p style={pageStyles.p}>
          Lit Protocol employs <b>Threshold Cryptography</b> to manage
          cryptographic keys in a decentralized manner. Here's how it works:
        </p>
        <ul style={pageStyles.ul}>
          <li style={pageStyles.li}>
            <LinkExt href="https://docs.google.com/document/d/1eaSk6822d4B-bJtMiiGp4n9N4qZPnwWaEZOy-Xs8AK0/edit#heading=h.2q2y8wxw6nj8">
              Distributed Key Generation (DKG)
            </LinkExt>
            : Instead of a single entity generating a private key, the network
            collectively generates key pairs without any single node ever
            knowing the entire private key. Each node only ever has access to a{" "}
            <b>key share</b>, which is essentially a fragment of the overall
            private key.
          </li>
          <li style={pageStyles.li}>
            <b>Threshold Operations:</b> To perform cryptographic operations
            such as signing or decryption, a threshold number of nodes
            (two-thirds of the network) must collaborate. Each node uses its key
            share to produce a partial result which is then combined with the
            results from other nodes to produce the final signature/decryption
            key.
          </li>
        </ul>

        <h3 style={pageStyles.h3}>
          JavaScript Execution Environment with Deno
        </h3>
        <p style={pageStyles.p}>
          Each Lit Node contains a JavaScript execution environment powered by{" "}
          <LinkExt href="https://deno.com/">Deno</LinkExt>, a JavaScript
          runtime. This environment allows developers to write and deploy{" "}
          <b>Lit Actions</b> which enable powerful and secure decentralized
          compute similar to, but more capable than, Ethereum smart contracts.
        </p>
        <p style={pageStyles.p}>
          Coupled with the secure and private execution environment provided by
          TEEs, Lit Actions are immutable and private. Once deployed, Lit
          Actions cannot be tampered with, and their execution and the data they
          consume remain in the confines of the TEE.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>The Lit Network</h2>
        <p style={pageStyles.p}>
          The Lit Network is a decentralized network composed of Lit Nodes
          operated by various participants, including integration partners,
          investors, and professional node operators. The network's design
          ensures robustness, security, and resistance to censorship.
        </p>

        <h3 style={pageStyles.h3}>Node Operators and Staking</h3>
        <p style={pageStyles.p}>
          To maintain the network's integrity and incentivize proper behavior,
          node operators are required to:
        </p>
        <ul style={pageStyles.ul}>
          <li style={pageStyles.li}>
            <b>Stake Tokens:</b> Operators must stake tokens (currently a test
            token while the Lit Protocol is in Mainnet Beta) to join the active
            set of nodes. Staking provides economic security and aligns
            incentives.
          </li>
          <li style={pageStyles.li}>
            <b>Maintain Compliance and Performance:</b> Nodes must run the
            approved software stack and meet hardware requirements, including
            the use of AMD SEV-SNP technology. Operators are expected to
            maintain high uptime and performance.
          </li>
          <li style={pageStyles.li}>
            <b>Follow Protocol Rules:</b> Operators must adhere to the
            protocol's consensus mechanisms and operational guidelines.
          </li>
        </ul>

        <h3 style={pageStyles.h3}>Node Operator List</h3>
        <p style={pageStyles.p}>Current node operators include:</p>
        <ul style={pageStyles.ul}>
          <li style={pageStyles.li}>
            <b>Lit Protocol (our node)</b>
          </li>
          <li style={pageStyles.li}>
            <LinkExt href="https://hypha.coop/">Hypha</LinkExt>
          </li>
          <li style={pageStyles.li}>
            <LinkExt href="https://thunderhead.xyz/">Thunderhead</LinkExt>
          </li>
          <li style={pageStyles.li}>
            <LinkExt href="https://www.terminal3.io/">Terminal3</LinkExt>
          </li>
          <li style={pageStyles.li}>
            <LinkExt href="https://www.imperator.co/">Imperator</LinkExt>
          </li>
          <li style={pageStyles.li}>
            <LinkExt href="https://01node.com/">01node</LinkExt>
          </li>
          <li style={pageStyles.li}>
            <LinkExt href="https://cheqd.io/">Cheqd</LinkExt>
          </li>
        </ul>

        <p style={pageStyles.p}>Operators joining after launch:</p>
        <ul style={pageStyles.ul}>
          <li style={pageStyles.li}>
            <LinkExt href="https://hirenodes.io/">HireNodes</LinkExt>
          </li>
          <li style={pageStyles.li}>
            <LinkExt href="https://ethglobal.com/">ETHGlobal</LinkExt>
          </li>
          <li style={pageStyles.li}>
            <LinkExt href="https://zerion.io/">Zerion</LinkExt>
          </li>
        </ul>

        <h3 style={pageStyles.h3}>The Lit Protocol Token</h3>
        <p style={pageStyles.p}>
          The Lit Protocol Token is the native utility token for the network and
          serves multiple functions:
        </p>
        <ul style={pageStyles.ul}>
          <li style={pageStyles.li}>
            <b>Staking:</b> Node operators stake the token to secure their
            participation and align economic incentives.
          </li>
          <li style={pageStyles.li}>
            <b>Incentives and Rewards:</b> Operators receive the token as
            compensation for providing services and maintaining the network.
          </li>
          <li style={pageStyles.li}>
            <b>Payment for Services:</b> Developers use the token to pay for
            network services, such as executing Lit Actions, decryption
            operations, and signing data with Programmable Key Pairs (PKPs).
          </li>
        </ul>

        <div
          style={{
            backgroundColor: "#f0f9ff",
            border: "1px solid #bee3f8",
            borderRadius: "8px",
            padding: "16px",
            margin: "20px 0",
          }}
        >
          <p style={{ ...pageStyles.p, color: "#0369a1", margin: 0 }}>
            <b>Note:</b> The Lit Protocol token <b>is not yet live</b>.
            Currently, a test token (tstLPX) is used during the Mainnet Beta
            phase. The official token will be released when the v1 network
            launches later this year. Subscribe to updates{" "}
            <LinkExt href="https://spark.litprotocol.com/">here</LinkExt>.
          </p>
          <p
            style={{
              ...pageStyles.p,
              color: "#0369a1",
              marginTop: "10px",
              marginBottom: 0,
            }}
          >
            Developers can claim test tokens from the{" "}
            <LinkExt href="https://chronicle-yellowstone-faucet.getlit.dev/">
              verified faucet
            </LinkExt>
            .
          </p>
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>
          How Lit Protocol Enables Secure and Private Operations
        </h2>

        <h3 style={pageStyles.h3}>Secure Key Management Without Custodians</h3>
        <p style={pageStyles.p}>
          Lit Protocol provides a decentralized alternative to traditional key
          management solutions, which often rely on centralized custodians or
          require users to manage their own private keys.
        </p>
        <ul style={pageStyles.ul}>
          <li style={pageStyles.li}>
            <b>Non-Custodial Key Generation:</b> Users can have keys generated
            and managed securely without any single entity controlling the full
            private key.
          </li>
          <li style={pageStyles.li}>
            <b>Flexible Authentication Methods:</b> Lit allows for key
            generation using traditional Web2 authentication methods like social
            OAuth (e.g. Google, Facebook, X (Twitter)). This enables seamless
            user onboarding by leveraging familiar login mechanisms while
            maintaining decentralized key management.
          </li>
          <li style={pageStyles.li}>
            <b>Threshold Signatures:</b> Operations like signing and decryption
            require collaboration among multiple nodes, enhancing security.
          </li>
          <li style={pageStyles.li}>
            <b>Access Control Policies:</b> Developers can define complex access
            control conditions based on various conditions, enabling
            fine-grained control over who can access certain data or perform
            specific actions.
          </li>
        </ul>

        <h3 style={pageStyles.h3}>Confidential Computing with TEEs</h3>
        <p style={pageStyles.p}>
          The use of TEEs ensures that computations are performed securely and
          privately:
        </p>
        <ul style={pageStyles.ul}>
          <li style={pageStyles.li}>
            <b>Data Privacy:</b> Sensitive data processed within a TEE remains
            confidential, as it cannot be accessed by external parties or the
            node operator.
          </li>
          <li style={pageStyles.li}>
            <b>Code Integrity:</b> The code executing within the TEE is
            protected from tampering, ensuring consistent and trustworthy
            operations.
          </li>
          <li style={pageStyles.li}>
            <b>Verification:</b> Clients can verify that nodes are running the
            correct code within a TEE through remote attestation mechanisms.
          </li>
        </ul>

        <h3 style={pageStyles.h3}>Decentralized Compute with Lit Actions</h3>
        <p style={pageStyles.p}>
          Lit Actions enable powerful decentralized computation capabilities:
        </p>
        <ul style={pageStyles.ul}>
          <li style={pageStyles.li}>
            <b>Serverless Execution:</b> Developers can deploy code without
            managing infrastructure, as the network handles execution.
          </li>
          <li style={pageStyles.li}>
            <b>Scalable and Efficient:</b> Lit Actions are executed across the
            network, providing scalability and redundancy.
          </li>
          <li style={pageStyles.li}>
            <b>Interoperability:</b> Ability to interact with multiple
            blockchains and external data sources, facilitating complex
            workflows.
          </li>
          <li style={pageStyles.li}>
            <b>Privacy-Preserving:</b> Computations are performed within TEEs,
            protecting sensitive logic and data.
          </li>
        </ul>
      </GreyBoarderWhiteBgContainer>

      {/* Next Steps */}
      <div
        style={{
          backgroundColor: "#f0f9ff",
          border: "1px solid #3b82f6",
          borderRadius: "8px",
          padding: "20px",
          marginTop: "20px",
        }}
      >
        <h3
          style={{ margin: "0 0 10px 0", color: "#1e40af", fontSize: "1.2rem" }}
        >
          🚀 Next Steps
        </h3>
        <p style={{ margin: "0", color: "#1e3a8a", lineHeight: "1.5" }}>
          Now that you understand how Lit Protocol works, explore the{" "}
          <Link
            to="/building-with-lit/setup-lit-client"
            style={{ color: "#3b82f6", textDecoration: "underline" }}
          >
            Lit Auth Provider Demo
          </Link>{" "}
          to see these concepts in action and learn how to implement Lit's
          authentication and authorization capabilities in your own
          applications.
        </p>
      </div>
    </div>
  );
};

export default HowItWorksTab;
