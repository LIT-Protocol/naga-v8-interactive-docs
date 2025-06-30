/**
 * GettingStarted.tsx
 *
 * This component provides an introduction to Programmable Key Pairs (PKPs),
 * explaining what they are, their key concepts, and guiding users through
 * the prerequisites and lifecycle.
 */

import React from "react";
import { Link } from "react-router-dom";
import GreyBoarderWhiteBgContainer from "../../../components/layout/GreyboardWhiteBgContainer";

export default function GettingStartedTab() {
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

  const lifecycleSteps = [
    {
      step: "1",
      title: "Authenticate",
      description: (
        <>
          <p>
            Unlike traditional wallets that rely on a private key for
            determining who has signing authority, PKPs are governed by{" "}
            <strong>Auth Methods</strong> such as Ethereum wallets, OAuth
            providers like Google and Discord, or your own custom logic defined
            by a Lit Action.
          </p>
          <p>
            This step of authentication involves generating a verifiable proof
            of identity (called <code>AuthData</code>) using a selected Auth
            Method.
          </p>
          <p>
            For example, if an Ethereum wallet is the Auth Method, the
            to-be-owner of the PKP will sign a{" "}
            <a
              href="https://eips.ethereum.org/EIPS/eip-4361"
              target="_blank"
              style={{ color: "#3b82f6", textDecoration: "underline" }}
            >
              Sign-In With Ethereum (SIWE)
            </a>{" "}
            message and provide it when submitting a request to mint a new PKP.
            The Lit nodes verify the signed SIWE message and associate the
            signer's address with the PKP.
          </p>
          <p>
            When the PKP owner wants to sign data, they'll provide a signed SIWE
            message with the signing request to the Lit network. Each Lit node
            will independently verify the signer of the SIWE message, and
            confirm they're authorized to use the PKP before authorizing the
            signing request.
          </p>
        </>
      ),
      color: "#3b82f6",
      details: [],
    },
    {
      step: "2",
      title: "Mint",
      description: (
        <>
          <p>
            Use the{" "}
            <Link
              to="/building-with-lit/setup-lit-client"
              style={{
                color: "#007bff",
                textDecoration: "underline",
              }}
            >
              Lit Client
            </Link>{" "}
            to mint a new PKP. This creates a blockchain account whose
            decentralized private key is securely controlled by the identity
            authenticated in Step 1.
          </p>
          <p>
            Behind the scenes, the Lit network runs a{" "}
            <strong>Distributed Key Generation (DKG)</strong> protocol across
            multiple nodes. No single node ever holds the full private key, and
            the private key is never stored on any single machine.
          </p>
          <p>
            The minting transaction includes your authentication proof (like a
            signed SIWE message) and defines what the PKP is allowed to do—such
            as <code>['sign-anything']</code> for general-purpose signing.
          </p>
          <p>
            After minting, you'll receive the PKP's public key ERC-721 token ID,
            and it's Ethereum address which will be used in the next step to
            create an <code>AuthContext</code>.
          </p>
        </>
      ),
      color: "#10b981",
      details: [],
    },
    {
      step: "3",
      title: "Create the PKP Auth Context",
      description: (
        <>
          <p>
            Use the{" "}
            <Link
              to="/building-with-lit/setup-auth-manager"
              style={{
                color: "#007bff",
                textDecoration: "underline",
              }}
            >
              Auth Manager
            </Link>{" "}
            to create a <code>PkpAuthContext</code> tied to your PKP.
          </p>
          <p>
            Before the <code>AuthManager</code> makes the request to the Lit
            network to generate the <code>PkpAuthContext</code>, it generates a{" "}
            <strong>session key pair</strong> on the client where the public key
            will be shared with the Lit nodes, and the private key remains
            securely on-device.
          </p>
          <p>
            As part of the request to create the <code>PkpAuthContext</code>,
            you include the <code>AuthData</code> generated in Step 1, the PKP's
            public key, and a set of capabilities that define what the generated
            session key pair is allowed to do (e.g. sign data using the PKP or
            execute Lit Actions).
          </p>
          <p>
            While processing your request to generate the{" "}
            <code>PkpAuthContext</code>, the Lit nodes will verify the submitted{" "}
            <code>AuthData</code> and validate if it's a registered Auth Method
            for the PKP. If the <code>AuthData</code> is valid, the Lit nodes
            will generate a <strong>Delegation AuthSig</strong> which is a
            signed authorization using the PKP that allows the session key pair
            to perform the requested actions.
          </p>
          <p>
            The <code>AuthContext</code> combines the Delegation AuthSig and
            session key pair, enabling the PKP owner to sign data using the PKP
            without needing to re-authenticate for every request.
          </p>
        </>
      ),
      color: "#8b5cf6",
      details: [],
    },
    {
      step: "4",
      title: "Sign Data",
      description: (
        <>
          <p>
            With your <code>PkpAuthContext</code> ready, you can now sign data
            using the PKP.
          </p>
        </>
      ),
      color: "#f59e0b",
      details: [],
    },
  ];

  const nextSteps = [
    {
      title: "Authentication Methods",
      description: "Checkout the different ways to authenticate and mint PKPs:",
      icon: "🔐",
      links: [
        {
          text: "Ethereum wallet",
          to: "/programmable-keys/pkps/auth-methods/eoa",
        },
        {
          text: "Google OAuth",
          to: "/programmable-keys/pkps/auth-methods/google",
        },
        {
          text: "Discord OAuth",
          to: "/programmable-keys/pkps/auth-methods/discord",
        },
        {
          text: "WebAuthn",
          to: "/programmable-keys/pkps/auth-methods/webauthn",
        },
      ],
    },
    {
      title: "Sign with PKP",
      description: "Use your PKP to sign data and execute actions:",
      icon: "✍️",
      links: [
        {
          text: "Sign Messages & Transactions",
          to: "/programmable-keys/pkps/signing/raw",
        },
        {
          text: "Sign within Lit Actions",
          to: "/lit-actions/pkp-signing",
        },
      ],
    },
    {
      title: "PKP Metadata",
      description: "View PKP metadata and permissions:",
      icon: "📊",
      links: [
        {
          text: "View PKP Permissions",
          to: "/programmable-keys/pkps/view/pkp-permissions",
        },
        {
          text: "View PKPs by Auth Data",
          to: "/programmable-keys/pkps/view/pkps-by-auth",
        },
        {
          text: "View PKPs by Address",
          to: "/programmable-keys/pkps/view/pkps-by-address",
        },
      ],
    },
    {
      title: "Manage Auth Methods",
      description: "Add or remove authentication methods for your PKPs:",
      icon: "⚙️",
      links: [
        {
          text: "Add or Remove Auth Methods",
          to: "/programmable-keys/pkps/auth-methods/add-remove",
        },
      ],
    },
  ];

  return (
    <div style={pageStyles.container}>
      <h1 style={pageStyles.h1}>Getting Started with PKPs</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Intro</h2>
        <p style={pageStyles.p}>
          <strong>Programmable Key Pairs (PKPs)</strong> are blockchain key
          pairs created by the Lit network using a decentralized process called{" "}
          <strong>Distributed Key Generation (DKG)</strong>. Unlike traditional
          keys that are generated and stored in a single location, PKPs are
          constructed across a network of Lit nodes and the full private key is
          never stored on any single machine.
        </p>
        <div
          style={{
            border: "1px solid #3b82f6",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "16px",
          }}
        >
          <p style={{ margin: "0", color: "#1e3a8a", lineHeight: "1.5" }}>
            📖 <strong>Learn More:</strong> PKPs are covered in more detail in
            the{" "}
            <Link
              to="/programmable-keys/overview"
              style={{ color: "#3b82f6", textDecoration: "underline" }}
            >
              Programmable Keys Overview
            </Link>{" "}
            section.
          </p>
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>The PKP Lifecycle</h2>
        <p style={pageStyles.p}>
          There are 4 steps to get started signing data with a PKP:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "24px",
            marginTop: "24px",
          }}
        >
          {lifecycleSteps.map((step, index) => (
            <div
              key={index}
              style={{
                border: `2px solid ${step.color}20`,
                borderRadius: "12px",
                padding: "24px",
                backgroundColor: "white",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: step.color,
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "600",
                    fontSize: "1.1rem",
                  }}
                >
                  {step.step}
                </div>
                <h3
                  style={{
                    margin: 0,
                    color: step.color,
                    fontSize: "1.3rem",
                    fontWeight: "600",
                  }}
                >
                  {step.title}
                </h3>
              </div>
              <p
                style={{
                  color: "#6b7280",
                  marginBottom: "16px",
                  lineHeight: "1.5",
                }}
              >
                {step.description}
              </p>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "0 0 20px 0",
                }}
              >
                {step.details.map((detail, detailIndex) => (
                  <li
                    key={detailIndex}
                    style={{
                      marginBottom: "8px",
                      fontSize: "0.9rem",
                      color: "#4b5563",
                      paddingLeft: "20px",
                      position: "relative",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        color: step.color,
                      }}
                    >
                      •
                    </span>
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </GreyBoarderWhiteBgContainer>

      {/* Next Steps */}
      <GreyBoarderWhiteBgContainer
        style={{
          backgroundColor: "#f0f9ff",
          border: "1px solid #3b82f6",
          borderRadius: "8px",
          padding: "20px",
          marginTop: "20px",
        }}
      >
        <h2 style={pageStyles.h2}>Next Steps</h2>
        <p style={pageStyles.p}>
          Now that you've learned about the PKP lifecycle, explore these
          practical examples and operations:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
            marginTop: "24px",
          }}
        >
          {nextSteps.map((step, index) => (
            <div
              key={index}
              style={{
                padding: "20px",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  marginBottom: "12px",
                }}
              >
                {step.icon}
              </div>
              <h3
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  color: "#1f2937",
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "0.9rem",
                  color: "#6b7280",
                  lineHeight: "1.5",
                }}
              >
                {step.description}
              </p>
              <ul
                style={{
                  margin: "0",
                  paddingLeft: "16px",
                  fontSize: "0.85rem",
                }}
              >
                {step.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link to={link.to} style={{ color: "#3b82f6" }}>
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </GreyBoarderWhiteBgContainer>
    </div>
  );
}
