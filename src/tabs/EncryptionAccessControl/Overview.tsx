/**
 * Overview.tsx
 *
 * This component provides a comprehensive overview of Lit's Encryption and Access Control
 * capabilities, explaining how identity-based encryption works and its key features.
 */

import React from "react";
import GreyBoarderWhiteBgContainer from "../../components/layout/GreyboardWhiteBgContainer";
import { Link } from "react-router-dom";

interface ProcessStepProps {
  title: string;
  description: string;
  stepNumber: number;
  backgroundColor: string;
  borderColor: string;
}

const ProcessStep: React.FC<ProcessStepProps> = ({
  title,
  description,
  stepNumber,
  backgroundColor,
  borderColor,
}) => (
  <div
    style={{
      padding: "24px",
      backgroundColor,
      borderRadius: "12px",
      border: `2px solid ${borderColor}20`,
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
          backgroundColor: borderColor,
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "600",
          fontSize: "1.1rem",
        }}
      >
        {stepNumber}
      </div>
      <h4
        style={{
          margin: 0,
          color: borderColor,
          fontSize: "1.3rem",
          fontWeight: "600",
        }}
      >
        {title}
      </h4>
    </div>
    <p
      style={{
        fontSize: "0.9rem",
        lineHeight: "1.6",
        color: "#4b5563",
        marginBottom: "0",
      }}
    >
      {description}
    </p>
  </div>
);

const EncryptionAccessControlOverview: React.FC = () => {
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

  const encryptionSteps = [
    {
      title: "Create Access Control Conditions",
      description:
        "Alice creates Access Control Conditions and combines them with her private data to construct the identity parameter.",
      stepNumber: 1,
      backgroundColor: "#f0f9ff",
      borderColor: "#0ea5e9",
    },
    {
      title: "Encrypt Data",
      description:
        "Alice encrypts the private data and identity parameter using the public key of the shared Lit BLS key to get a ciphertext.",
      stepNumber: 2,
      backgroundColor: "#f0f9ff",
      borderColor: "#0ea5e9",
    },
    {
      title: "Store Encrypted Data",
      description:
        "Alice stores the encryption metadata (Access Control Conditions, hash of private data, etc.) and ciphertext wherever she wants (IPFS, Ceramic, etc.).",
      stepNumber: 3,
      backgroundColor: "#f0f9ff",
      borderColor: "#0ea5e9",
    },
  ];

  const decryptionSteps = [
    {
      title: "Fetch Encrypted Data",
      description:
        "Bob fetches the ciphertext and corresponding encryption metadata from the public data store.",
      stepNumber: 1,
      backgroundColor: "#f0fdf4",
      borderColor: "#22c55e",
    },
    {
      title: "Request Signature Shares",
      description:
        "Bob presents the encryption metadata to the Lit network and requests signature shares over the identity parameter.",
      stepNumber: 2,
      backgroundColor: "#f0fdf4",
      borderColor: "#22c55e",
    },
    {
      title: "Verify Conditions",
      description:
        "The Lit nodes check whether the user satisfies the Access Control Conditions before signing the constructed identity parameter.",
      stepNumber: 3,
      backgroundColor: "#f0fdf4",
      borderColor: "#22c55e",
    },
    {
      title: "Decrypt Data",
      description:
        "Bob assembles the signature shares into a decryption key and successfully decrypts the ciphertext.",
      stepNumber: 4,
      backgroundColor: "#f0fdf4",
      borderColor: "#22c55e",
    },
  ];

  const features = [
    {
      title: "Multi-Chain Support",
      description:
        "Define access conditions using blockchain state from major networks like EVM chains, Cosmos, and Solana.",
      icon: "🌐",
    },
    {
      title: "Boolean Logic",
      description:
        "Build complex access rules with AND and OR operators to combine multiple conditions.",
      icon: "🔗",
    },
    {
      title: "Lit Action Conditions",
      description:
        "Use dynamic, real-world inputs as conditions including smart contract results, API responses, or off-chain data.",
      icon: "⚙️",
    },
    {
      title: "Storage Flexibility",
      description:
        "Encrypt once, store anywhere. Because encrypted data is just text, you can store it wherever you prefer, whether that's decentralized platforms like IPFS, Arweave, and Ceramic, or traditional providers like AWS.",
      icon: "💾",
    },
    {
      title: "Client-Side Encryption",
      description:
        "Encryption is entirely a client-side operation, with only one round of network interactivity required for decryption.",
      icon: "🔒",
    },
  ];

  const examples = [
    {
      title: "DAO Membership",
      description: "Restrict access to members of a particular DAO",
      link: "/encryption/evm/dao-membership",
    },
    {
      title: "ERC-721 NFT Ownership",
      description: "Require ownership of specific ERC-721 NFTs",
      link: "/encryption/evm/token-ownership",
    },
    {
      title: "Smart Contract Calls",
      description: "Use the result of any smart contract call as a condition",
      link: "/encryption/evm/smart-contract-calls",
    },
    // {
    //   title: "API Calls",
    //   description:
    //     "Use the result of any API call, such as a follow on Twitter",
    //   link: "/access-control/lit-action-conditions",
    // },
  ];

  const gettingStartedResources = [
    {
      title: "Quick Start Guide",
      description: "Get started with encryption and access control",
      link: "/encryption/quickstart",
    },
    {
      title: "EVM Based Conditions",
      description: "Examples of basic EVM-based access control conditions",
      link: "/access-control/evm/basic-examples",
    },
  ];

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>Encryption and Access Control</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Introduction</h2>
        <p style={pageStyles.p}>
          Lit enables secure encryption of private data for storage on the open
          web. At the core of Lit’s encryption model is an{" "}
          <strong>identity-based encryption scheme</strong>, which restricts
          decryption to users who meet specific, pre-defined identity
          conditions.
        </p>
        <p style={pageStyles.p}>
          The Lit Network is powered by a distributed set of nodes, each holding
          a share of a shared BLS key. When a user requests decryption, the
          network produces a collective BLS signature that serves as the
          decryption key. Signature shares are only returned if the user can
          prove they satisfy the associated{" "}
          <strong>Access Control Conditions</strong> the encrypted data was
          created with.
        </p>
        <p style={pageStyles.p}>
          Encryption is performed entirely on the client side, keeping private
          data off the network. Decryption requires just one round of
          interaction with the Lit nodes to collect signature shares and
          reconstruct the decryption key, making the process both efficient and
          secure.
        </p>
        <p style={pageStyles.p}>
          To prevent decryption keys from being reused across different pieces
          of data, Lit constructs a unique identity parameter for each
          encryption. This parameter is a combination of the hash of the Access
          Control Conditions and the hash of the encrypted content. The BLS
          signature is generated over this identity parameter, binding the
          decryption key to both the access policy and the ciphertext.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>How It Works</h2>
        <p style={pageStyles.p}>
          Here is a high-level, step-by-step breakdown of the encryption and
          decryption process with Lit:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "32px",
            marginTop: "24px",
          }}
        >
          {/* Encryption Column */}
          <div>
            <h3
              style={{
                ...pageStyles.h3,
                color: "#0ea5e9",
                textAlign: "center",
              }}
            >
              🔒 Encryption
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {encryptionSteps.map((step, index) => (
                <ProcessStep key={index} {...step} />
              ))}
            </div>
          </div>

          {/* Decryption Column */}
          <div>
            <h3
              style={{
                ...pageStyles.h3,
                color: "#22c55e",
                textAlign: "center",
              }}
            >
              🔓 Decryption
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {decryptionSteps.map((step, index) => (
                <ProcessStep key={index} {...step} />
              ))}
            </div>
          </div>
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Key Features</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
            marginTop: "24px",
          }}
        >
          {features.map((feature, index) => (
            <div
              key={index}
              style={{
                padding: "20px",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "12px" }}>
                {feature.icon}
              </div>
              <h3
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  color: "#1f2937",
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.9rem",
                  color: "#6b7280",
                  lineHeight: "1.5",
                }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Access Control Examples</h2>
        <p style={pageStyles.p}>
          Lit supports the use of both on and off-chain data when creating
          Access Control Conditions. Some examples include:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "16px",
            marginTop: "24px",
          }}
        >
          {examples.map((example, index) => (
            <div
              key={index}
              style={{
                padding: "16px",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            >
              <h4
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "1rem",
                  fontWeight: "600",
                  color: "#1f2937",
                }}
              >
                {example.title}
              </h4>
              <p
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "0.9rem",
                  color: "#6b7280",
                  lineHeight: "1.4",
                }}
              >
                {example.description}
              </p>
              <Link
                to={example.link}
                style={{
                  color: "#0ea5e9",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                }}
              >
                Learn more →
              </Link>
            </div>
          ))}
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Getting Started</h2>
        <p style={pageStyles.p}>
          Ready to start using Lit for encryption and access control? Here are
          some resources to help you get started:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
            marginTop: "24px",
          }}
        >
          {gettingStartedResources.map((resource, index) => (
            <div
              key={index}
              style={{
                padding: "20px",
                backgroundColor: "#f0f9ff",
                borderRadius: "8px",
                border: "1px solid #0ea5e9",
              }}
            >
              <h4
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  color: "#0c4a6e",
                }}
              >
                {resource.title}
              </h4>
              <p
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "0.9rem",
                  color: "#0c4a6e",
                  lineHeight: "1.4",
                }}
              >
                {resource.description}
              </p>
              <Link
                to={resource.link}
                style={{
                  color: "#0ea5e9",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                }}
              >
                View Guide →
              </Link>
            </div>
          ))}
        </div>
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default EncryptionAccessControlOverview;
