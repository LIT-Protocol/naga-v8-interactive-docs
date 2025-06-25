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
import NoteCallout from "../../components/common/NoteCallout";

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
          Lit Protocol is a decentralized key management network that solves the
          fundamental Web3 security dilemma: how to manage secrets without
          compromising security, user experience, or decentralization. The
          network empowers developers to create secure, decentralized
          applications that manage crypto assets, private data, and user
          authority seamlessly across any blockchain or distributed system.
        </p>
        <p style={pageStyles.p}>
          Traditional approaches force an impossible choice. Giving private keys
          or credentials to centralized servers creates massive security
          responsibilities and single points of failure. Putting the burden
          entirely on end users requires them to navigate complex key management
          and opens up avenues for compromise. Lit Protocol eliminates this
          tradeoff.
        </p>
        <p style={pageStyles.p}>
          Lit's distributed architecture ensures secrets remain verifiably
          secure—encrypted at the hardware level and fragmented across a
          decentralized network with no single point of failure. Using threshold
          signature schemes (MPC TSS) as a foundation means that for the first
          time, universal accounts can be programmed and automated without
          trusting centralized custodians.
        </p>
        <p style={pageStyles.p}>
          This underlying security architecture enables powerful developer
          capabilities. Using Lit's SDK, builders can easily:
        </p>
        <ul style={pageStyles.ul}>
          <li style={pageStyles.li}>Encrypt and decrypt private data</li>
          <li style={pageStyles.li}>
            Create and manage Web3 wallets, accounts, and signers
          </li>
          <li style={pageStyles.li}>
            Sign transactions and messages on virtually any blockchain
          </li>
          <li style={pageStyles.li}>
            Execute automated signing and/or decryption operations based on
            programmable conditions
          </li>
          <li style={pageStyles.li}>
            Read and write to any off-chain endpoint to ensure compatibility
            with legacy systems and the rest of the web2 world
          </li>
        </ul>
        <p style={pageStyles.p}>
          These capabilities enable builders to create immutable, interoperable,
          and user-owned applications, AI agents, and protocols.
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

        <h3 style={pageStyles.h3}>Web3 Wallets and User Onboarding</h3>
        <p style={pageStyles.p}>
          Developers can use Lit to generate and manage non-custodial keys using
          a variety of flexible authentication flows (ex. oAuth and Passkeys)
          with support for programmable transaction automation. This
          functionality enables seamless onboarding experiences that don't
          sacrifice UX while keeping users in control.{" "}
          <LinkExt href="https://www.collab.land/">Collab.Land</LinkExt>,{" "}
          <LinkExt href="https://plurality.network/">Plurality Network</LinkExt>
          ,{" "}
          <LinkExt href="https://www.tradegenius.com/">Genius Protocol</LinkExt>
          , to create user-friendly wallet experiences and account abstraction
          solutions.
        </p>

        <h3 style={pageStyles.h3}>Digital Identity</h3>
        <p style={pageStyles.p}>
          Lit allows for flexible encryption and access management based on
          blockchain state, token ownership, or other on/off-chain conditions.
          This can be used for digital identity and IP rights management,
          verifiable data marketplaces, DWeb storage solutions, and more.{" "}
          <LinkExt href="https://streamr.network/">Streamr</LinkExt>,{" "}
          <LinkExt href="https://bonny.so/">Bonny</LinkExt>,{" "}
          <LinkExt href="https://cheqd.io/">Cheqd</LinkExt>,{" "}
          <LinkExt href="https://beaconprotocol.com/">Beacon Protocol</LinkExt>,{" "}
          <LinkExt href="https://www.lens.xyz/">Lens Protocol</LinkExt>,{" "}
          <LinkExt href="https://irys.xyz/">Irys</LinkExt>,{" "}
          <LinkExt href="https://docs.verifymedia.com/publishing/access-control/methods/lit-protocol">
            Verify (Fox Corp)
          </LinkExt>
          , and{" "}
          <LinkExt href="https://www.alexandriabooks.com/">
            Alexandria Labs
          </LinkExt>{" "}
          to secure content sharing and data marketplaces.
        </p>

        <h3 style={pageStyles.h3}>Chain Abstraction and DeFi</h3>
        <p style={pageStyles.p}>
          Developers can utilize Lit's programmable and chain-agnostic signing
          capabilities to facilitate cross-chain interoperability and
          generalized message passing to create a more unified and capital
          efficient Web3 ecosystem.
          <LinkExt href="https://www.tradegenius.com/">Genius Protocol</LinkExt>
          , <LinkExt href="https://www.tria.so/">Tria</LinkExt>,{" "}
          <LinkExt href="https://emblem.vision/">Emblem Vault</LinkExt>,{" "}
          <LinkExt href="https://eco.com/">Eco</LinkExt>,{" "}
          <LinkExt href="https://polaris.app/">Polaris</LinkExt>,{" "}
          <LinkExt href="https://vaultlayer.xyz/">VaultLayer</LinkExt>, and{" "}
          <LinkExt href="https://gvnr.xyz/">GVNR</LinkExt>.
        </p>

        <h3 style={pageStyles.h3}>Data Oracles and Real-World Integration</h3>
        <p style={pageStyles.p}>
          Lit enables the creation of data oracles that securely fetch off-chain
          data for use in on-chain applications, bridging the gap between smart
          contracts and real-world information.
        </p>

        <NoteCallout
          title="Data Oracle Kit"
          message={
            <>
              <p>
                The{" "}
                <a
                  href="https://github.com/LIT-Protocol/lit-oracle-kit"
                  target="_blank"
                  style={{ color: "#3b82f6", textDecoration: "underline" }}
                >
                  Lit Oracle Kit
                </a>{" "}
                demonstrates how the Lit Network can be used to sign data pulled
                from the web (or another blockchain) and write it to chain.
              </p>
              <p style={{ marginTop: "8px", fontWeight: "500" }}>
                <strong>Note:</strong> This kit is currently built for V7 of the
                Lit SDK. A V8 version is coming soon!
              </p>
            </>
          }
          variant="note"
          style={{ marginBottom: "16px" }}
        />

        <h3 style={pageStyles.h3}>AI Agents and Infrastructure</h3>
        <p style={pageStyles.p}>
          Agent devs can use Lit's signing and compute capabilities to build
          autonomous, verifiable, and unruggable agents and infra solutions. If
          you're focused on building in this category, check out Lit's Vincent
          product to get started. Example implementations include:
        </p>

        <h3 style={pageStyles.h3}>Web3 Infrastructure</h3>
        <p style={pageStyles.p}>
          Projects in this category are focused on delivering essential
          infrastructure critical to Web3 application development. This includes
          payment infrastructure, smart contract tooling, grants management,
          video streaming, and more. The following projects leverage Lit's
          signing, encryption, and compute capabilities in a multitude of ways
          to deliver value to end consumers.
          <LinkExt href="https://request.network/">
            Request Network
          </LinkExt>,{" "}
          <LinkExt href="https://request.network/">Request Network</LinkExt>,{" "}
          <LinkExt href="https://www.crossmint.com/">Crossmint</LinkExt>,{" "}
          <LinkExt href="https://www.gitcoin.co/">Gitcoin</LinkExt>,{" "}
          <LinkExt href="https://www.livepeer.org/">Livepeer</LinkExt>,{" "}
          <LinkExt href="https://www.hatsprotocol.xyz/">Hats Protocol</LinkExt>,{" "}
          <LinkExt href="https://opencampus.xyz/">Open Campus</LinkExt>,{" "}
          <LinkExt href="https://charmverse.io/">CharmVerse</LinkExt>,{" "}
          <LinkExt href="https://www.spheron.network/">Spheron Network</LinkExt>
          , and <LinkExt href="https://sign.global/">Sign Protocol</LinkExt>.
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
