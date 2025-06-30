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

  const examples = [
    {
      title: "Wallet Ownership",
      description: "Grant access to specific wallet addresses",
      link: "/encryption/access-control/evm/wallet-ownership",
    },
    {
      title: "Token Balance",
      description: "Require minimum ETH or ERC-20 token balances",
      link: "/encryption/access-control/evm/erc20-balance",
    },
    {
      title: "NFT Ownership",
      description: "Require ownership of specific ERC-721 NFTs",
      link: "/encryption/access-control/evm/erc721-ownership",
    },
    {
      title: "Custom Contract Calls",
      description:
        "Make custom contract calls to any smart contract on a supported EVM chain",
      link: "/encryption/access-control/evm/custom-contract-calls",
    },
    {
      title: "Time-Based Access",
      description: "Control access based on timestamps and time windows",
      link: "/encryption/access-control/evm/time-based",
    },
    {
      title: "DAO Membership",
      description: "Restrict access to members of a particular DAO",
      link: "/encryption/access-control/evm/dao-membership",
    },
    {
      title: "POAP Ownership",
      description: "Grant access to holders of specific event attendance POAPs",
      link: "/encryption/access-control/evm/poap-ownership",
    },
  ];

  const gettingStartedResources = [
    {
      title: "Quick Start Guide",
      description: "Get started with encryption and access control",
      link: "/encryption/quickstart",
    },
    {
      title: "Boolean Logic",
      description: "Learn how to combine conditions with AND/OR logic",
      link: "/encryption/access-control/boolean-logic",
    },
    {
      title: "EVM Based Conditions",
      description: "Explore all supported EVM-based access control conditions",
      link: "/encryption/access-control/evm/supported-chains",
    },
  ];

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>Encryption and Access Control</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Introduction</h2>
        <p style={pageStyles.p}>
          Lit Protocol's encryption and access control system enables developers
          to store data privately while maintaining granular control over who
          can access it. Using an identity-based encryption scheme, the Lit
          network ensures that decryption is only permitted to users who satisfy
          predetermined{" "}
          <Link
            to="/encryption/access-control/boolean-logic"
            style={{ color: "#007bff", textDecoration: "underline" }}
          >
            Access Control Conditions
          </Link>
          .
        </p>
        <p style={pageStyles.p}>
          The system leverages a distributed BLS (Boneh-Lynn-Shacham) key shared
          across all Lit nodes, where each node holds a share of the key. When
          access conditions are met, the network produces signature shares that
          combine to form a decryption key. This approach enables highly
          efficient decryption operations that only require a single round of
          network interactivity, while encryption operations are performed
          entirely client-side.
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
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
            marginTop: "24px",
          }}
        >
          {[
            {
              title: "Distributed Key Management",
              description:
                "The BLS key used for encryption is distributed across the entire Lit network, with each node holding only a share. This eliminates single points of failure and ensures that no individual node can decrypt data without network consensus on the access control conditions.",
              icon: "🌐",
            },
            {
              title: "Client-Side Encryption",
              description:
                "The encryption process occurs entirely client-side, ensuring that your sensitive data never leaves your control during the encryption process. Only the encrypted ciphertext and access conditions are stored publicly, maintaining complete privacy for sensitive information.",
              icon: "🔒",
            },
            {
              title: "Flexible Access Control Conditions",
              description:
                "Create sophisticated access control logic using on-chain and off-chain data sources. Support for boolean operators (AND/OR) allows you to combine multiple conditions, creating complex access policies that can respond to real-world events and blockchain data.",
              icon: "⚙️",
            },
            {
              title: "Storage Agnostic",
              description:
                "Works seamlessly with any storage provider, whether decentralized (IPFS, Arweave, Ceramic) or centralized (AWS, Google Cloud). You maintain full control over where your encrypted data is stored while Lit handles the access control layer.",
              icon: "💾",
            },
            {
              title: "Multi-Chain Support",
              description:
                "Access conditions can reference state from most EVM chains, Cosmos, and Solana networks. Don't see your chain? Submit a chain request form to expand support.",
              icon: "🔗",
            },
          ].map((feature, index) => (
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
        <h2 style={pageStyles.h2}>Use Cases</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
            marginTop: "24px",
          }}
        >
          {[
            {
              title: "Token-Gated Content",
              description:
                "Create exclusive content accessible only to holders of specific NFTs or tokens. Perfect for premium memberships, exclusive communities, and creator monetization strategies.",
              icon: "🎫",
            },
            {
              title: "Private Data Sharing",
              description:
                "Share sensitive information securely with specific individuals or groups based on their on-chain identity or credentials. Ideal for confidential business documents, personal records, and selective information disclosure.",
              icon: "🤝",
            },
            {
              title: "Conditional File Access",
              description:
                "Implement time-based releases, geographic restrictions, or complex multi-factor access requirements for digital content. Enable sophisticated content distribution strategies and regulatory compliance.",
              icon: "⏰",
            },
            {
              title: "DAO Governance Documents",
              description:
                "Secure governance proposals, financial records, and strategic documents with member-only access based on DAO participation, token holdings, or voting power.",
              icon: "🏛️",
            },
          ].map((useCase, index) => (
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
                {useCase.icon}
              </div>
              <h3
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  color: "#1f2937",
                }}
              >
                {useCase.title}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.9rem",
                  color: "#6b7280",
                  lineHeight: "1.5",
                }}
              >
                {useCase.description}
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
