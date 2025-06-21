/**
 * WhatIsLitTab.tsx
 *
 * This component displays an overview of Lit Protocol, explaining what it is,
 * its key capabilities, and its various applications. The content is adapted
 * from the documentation.
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

const WhatIsLitTab: React.FC = () => {
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
      <h1 style={pageStyles.h1}>What is Lit Protocol</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Introduction</h2>
        <p style={pageStyles.p}>
          Lit Protocol is a decentralized key management and compute network
          designed to empower builders of applications, wallets, protocols, and
          AI agents in the Web3 ecosystem.
        </p>
        <p style={pageStyles.p}>
          By combining cutting-edge cryptography, sealed confidential hardware,
          and peer-to-peer networking, Lit provides developers with powerful
          tools to enhance security, privacy, and functionality in decentralized
          applications.
        </p>
        <p style={pageStyles.p}>
          Lit offers developers building in web3 with several core functions and
          capabilities:
        </p>
        <ul style={pageStyles.ul}>
          <li style={pageStyles.li}>
            Decentralized key management with enhanced programmability and fault
            tolerance
          </li>
          <li style={pageStyles.li}>
            Privacy-preserving compute and signing operations powered by sealed
            confidential hardware
          </li>
          <li style={pageStyles.li}>
            Flexible access control rules to make managing private data seamless
          </li>
          <li style={pageStyles.li}>
            Chain agnostic and cross-chain compatible to enable advanced Chain
            Abstraction
          </li>
          <li style={pageStyles.li}>
            Read and write to any off-chain endpoint to ensure compatibility
            with legacy systems and the rest of the web2 world
          </li>
          <li style={pageStyles.li}>
            Encrypted execution environments to power the next-generation of
            private AI inference and training
          </li>
        </ul>
        <p style={pageStyles.p}>
          These features enable developers to create innovative solutions that
          address critical challenges in Web3 development, particularly in areas
          requiring high levels of security and privacy.
        </p>
        <p style={pageStyles.p}>
          Explore our{" "}
          <LinkExt href="https://github.com/LIT-Protocol/whitepaper">
            Whitepaper
          </LinkExt>
          , view the open source{" "}
          <LinkExt href="https://github.com/LIT-Protocol/Node">
            Lit Node code
          </LinkExt>
          , and review our{" "}
          <LinkExt href="https://drive.google.com/drive/folders/1Rrht88iUkzpofwl1CvP9gEjqY60BKyFn?ref=spark.litprotocol.com">
            Audit reports
          </LinkExt>
          .
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Key Capabilities</h2>
        <p style={pageStyles.p}>
          Lit Protocol's versatile architecture supports a wide range of
          applications across various domains:
        </p>

        <h3 style={pageStyles.h3}>Secure Key Management and User Onboarding</h3>
        <p style={pageStyles.p}>
          Developers can generate and manage non-custodial keys, enabling
          seamless user onboarding without relying on centralized custodians.
          This capability is utilized in projects like{" "}
          <LinkExt href="https://app.patchwallet.com/">PatchWallet</LinkExt>,{" "}
          <LinkExt href="https://www.silk.sc/">Silk</LinkExt>,{" "}
          <LinkExt href="https://www.collab.land/">Collab.Land</LinkExt>,{" "}
          <LinkExt href="https://www.tria.so/">Tria</LinkExt>, and{" "}
          <LinkExt href="https://index.network/">Index Network</LinkExt> to
          create user-friendly wallet experiences and account abstraction
          solutions.
        </p>

        <h3 style={pageStyles.h3}>Data Encryption and Access Control</h3>
        <p style={pageStyles.p}>
          Lit allows for flexible encryption and access management based on
          blockchain state, token ownership, or other on/off-chain conditions.
          This feature is leveraged by projects such as{" "}
          <LinkExt href="https://docs.verifymedia.com/publishing/access-control/methods/lit-protocol">
            Fox
          </LinkExt>
          , <LinkExt href="https://www.terminal3.io/">Terminal3</LinkExt>,{" "}
          <LinkExt href="https://streamr.network/">Streamr</LinkExt>,{" "}
          <LinkExt href="https://cheqd.io/">Cheqd</LinkExt>,{" "}
          <LinkExt href="https://www.lens.xyz/">Lens Protocol</LinkExt>, and{" "}
          <LinkExt href="https://publicgoods.network/">Gitcoin</LinkExt> for
          secure content sharing and data marketplaces.
        </p>

        <h3 style={pageStyles.h3}>Cross-Chain Interactions and Automation</h3>
        <p style={pageStyles.p}>
          With Lit Actions, developers can create serverless functions that
          interact with multiple blockchains, facilitating cross-chain messaging
          and transaction automation. The{" "}
          <LinkExt href="https://github.com/Yacht-Labs/yacht-lit-sdk">
            Yacht Labs SDK
          </LinkExt>{" "}
          demonstrate practical implementations of this capability.
        </p>

        <h3 style={pageStyles.h3}>Data Oracles and Real-World Integration</h3>
        <p style={pageStyles.p}>
          Lit enables the creation of data oracles that securely fetch off-chain
          data for use in on-chain applications, bridging the gap between smart
          contracts and real-world information.
        </p>

        <h3 style={pageStyles.h3}>
          Environments for Privacy-Preserving AI and Machine Learning
        </h3>
        <p style={pageStyles.p}>
          The secure compute environment provided by Lit allows for the
          execution of AI models in a privacy-preserving and verifiable manner,
          opening up new possibilities for responsible AI development in the
          Web3 space.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Industry Applications</h2>
        <p style={pageStyles.p}>
          Lit Protocol and its ecosystem partners are driving innovation across
          various sectors:
        </p>

        <h3 style={pageStyles.h3}>Developer Tooling</h3>
        <p style={pageStyles.p}>
          Projects like{" "}
          <LinkExt href="https://alchemy.com/?ref=spark.litprotocol.com">
            Alchemy
          </LinkExt>
          ,{" "}
          <LinkExt href="https://www.pimlico.io/?ref=spark.litprotocol.com">
            Pimlico
          </LinkExt>
          ,{" "}
          <LinkExt href="https://www.openfort.xyz/?ref=spark.litprotocol.com">
            Openfort
          </LinkExt>
          ,{" "}
          <LinkExt href="https://www.lens.xyz/?ref=spark.litprotocol.com">
            Lens Protocol
          </LinkExt>
          ,{" "}
          <LinkExt href="https://useorbis.com/?ref=spark.litprotocol.com">
            Orbis
          </LinkExt>
          ,{" "}
          <LinkExt href="https://spheron.network/?ref=spark.litprotocol.com">
            Spheron
          </LinkExt>
          , and{" "}
          <LinkExt href="https://www.snowballtools.xyz/?ref=spark.litprotocol.com">
            Snowball
          </LinkExt>{" "}
          leverage Lit's generalized services to provide developers with SDKs
          that power specific use cases such as account abstraction, private
          data on Web3 social platforms, token-gated chat, and mobile wallet
          tooling.
        </p>

        <h3 style={pageStyles.h3}>Data Marketplaces</h3>
        <p style={pageStyles.p}>
          Protocols like{" "}
          <LinkExt href="https://cheqd.io/?ref=spark.litprotocol.com">
            Cheqd
          </LinkExt>
          ,{" "}
          <LinkExt href="https://karatdao.com/?ref=spark.litprotocol.com">
            KaratDAO
          </LinkExt>
          ,{" "}
          <LinkExt href="https://index.network/?ref=spark.litprotocol.com">
            Index
          </LinkExt>
          , and{" "}
          <LinkExt href="https://streamr.network/?ref=spark.litprotocol.com">
            Streamr
          </LinkExt>{" "}
          use Lit for encryption in the commercialization of data, powering
          trustless marketplaces built on blockchains and the open web.
        </p>

        <h3 style={pageStyles.h3}>Identity Management</h3>
        <p style={pageStyles.p}>
          Projects like{" "}
          <LinkExt href="https://www.oamo.io/?ref=spark.litprotocol.com">
            Oamo
          </LinkExt>
          ,{" "}
          <LinkExt href="https://krebit.id/?ref=spark.litprotocol.com">
            Krebit
          </LinkExt>
          ,{" "}
          <LinkExt href="https://terminal3.io/?ref=spark.litprotocol.com">
            Terminal3
          </LinkExt>
          , and{" "}
          <LinkExt href="https://www.holonym.id/?ref=spark.litprotocol.com">
            Holonym
          </LinkExt>{" "}
          use Lit to power the selective disclosure of encrypted data and
          credentials, giving users control over how their information is
          accessed, managed, and monetized.
        </p>

        <h3 style={pageStyles.h3}>Content Authenticity</h3>
        <p style={pageStyles.p}>
          Blockchain Creative Labs has integrated Lit within their{" "}
          <LinkExt href="https://www.verifymedia.com/?ref=spark.litprotocol.com">
            Verify
          </LinkExt>{" "}
          platform as a secure signing backend, enabling content to be stored
          privately and under proper licensing.
        </p>

        <h3 style={pageStyles.h3}>Digital Product NFTs</h3>
        <p style={pageStyles.p}>
          Teams like{" "}
          <LinkExt href="https://crossmint.io/?ref=spark.litprotocol.com">
            Crossmint
          </LinkExt>
          ,{" "}
          <LinkExt href="https://www.molecule.xyz/?ref=spark.litprotocol.com">
            Molecule
          </LinkExt>
          ,{" "}
          <LinkExt href="https://alexandrialabs.xyz/?ref=spark.litprotocol.com">
            Alexandria
          </LinkExt>
          ,{" "}
          <LinkExt href="https://charmverse.io/?ref=spark.litprotocol.com">
            CharmVerse
          </LinkExt>
          , and{" "}
          <LinkExt href="https://anotherblock.io/drops/the-jackson-5-big-boy-limited-edition?ref=spark.litprotocol.com">
            Anotherblock
          </LinkExt>{" "}
          use Lit to meet consumer demand for more creative utility for digital
          assets, such as unlockable NFTs and selective decryption for managing
          IP rights.
        </p>

        <h3 style={pageStyles.h3}>User Wallets</h3>
        <p style={pageStyles.p}>
          Lit is being used as a decentralized key management solution for
          wallets and onboarding experiences by teams like{" "}
          <LinkExt href="https://www.collab.land/?ref=spark.litprotocol.com">
            Collab.Land
          </LinkExt>
          ,{" "}
          <LinkExt href="https://infinex.xyz/?ref=spark.litprotocol.com">
            Infinex
          </LinkExt>
          ,{" "}
          <LinkExt href="https://app.patchwallet.com/?ref=spark.litprotocol.com">
            PatchWallet
          </LinkExt>
          ,{" "}
          <LinkExt href="https://www.silk.sc/?ref=spark.litprotocol.com">
            Silk
          </LinkExt>
          , and{" "}
          <LinkExt href="https://xion.burnt.com/?ref=spark.litprotocol.com">
            Burnt
          </LinkExt>
          . These products take the form of wallet applications, account
          abstraction signers, and embedded wallets on existing platforms like
          Telegram and Discord.
        </p>
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
          Now that you understand what Lit Protocol is, learn about{" "}
          <Link
            to="/learning-lit/how-it-works"
            style={{ color: "#3b82f6", textDecoration: "underline" }}
          >
            How it Works
          </Link>{" "}
          to dive deeper into the technical concepts and mechanisms that power
          Lit's decentralized capabilities.
        </p>
      </div>
    </div>
  );
};

export default WhatIsLitTab;
