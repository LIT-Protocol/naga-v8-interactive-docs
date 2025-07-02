/**
 * Overview.tsx
 *
 * This component provides a comprehensive overview of making your first request with the Lit SDK.
 * It's designed for brand new users who want to understand the entire picture of how Lit Protocol works,
 * covering encryption/decryption, PKP minting/signing, and Lit Action execution.
 */

import React from "react";
import { Link } from "react-router-dom";
import GreyBoarderWhiteBgContainer from "../../../components/layout/GreyboardWhiteBgContainer";

interface LitCapabilityProps {
  title: string;
  description: string;
  icon: string;
}

const LitCapability: React.FC<LitCapabilityProps> = ({
  title,
  description,
  icon,
}) => (
  <div
    style={{
      padding: "20px",
      backgroundColor: "#f8fafc",
      borderRadius: "8px",
      border: "1px solid #e2e8f0",
      textAlign: "center",
    }}
  >
    <div
      style={{
        fontSize: "2rem",
        marginBottom: "12px",
      }}
    >
      {icon}
    </div>
    <h4
      style={{
        fontSize: "1.2rem",
        fontWeight: "600",
        color: "#1f2937",
        marginBottom: "8px",
      }}
    >
      {title}
    </h4>
    <p
      style={{
        fontSize: "0.9rem",
        lineHeight: "1.5",
        color: "#4b5563",
        margin: 0,
      }}
    >
      {description}
    </p>
  </div>
);

interface LearningPathProps {
  title: string;
  description: string;
  features: string[];
  color: string;
  icon: string;
}

const LearningPath: React.FC<LearningPathProps> = ({
  title,
  description,
  features,
  color,
  icon,
}) => (
  <div
    style={{
      padding: "24px",
      backgroundColor: "#ffffff",
      borderRadius: "12px",
      border: `2px solid ${color}20`,
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "16px",
      }}
    >
      <div style={{ fontSize: "2rem" }}>{icon}</div>
      <h3
        style={{
          margin: 0,
          color: color,
          fontSize: "1.3rem",
          fontWeight: "600",
        }}
      >
        {title}
      </h3>
    </div>
    <p
      style={{
        fontSize: "0.95rem",
        lineHeight: "1.5",
        color: "#6b7280",
        marginBottom: "16px",
      }}
    >
      {description}
    </p>
    <ul
      style={{
        listStyle: "none",
        padding: 0,
        margin: 0,
      }}
    >
      {features.map((feature, index) => (
        <li
          key={index}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
            fontSize: "0.9rem",
            color: "#4b5563",
          }}
        >
          <span style={{ color: color, fontWeight: "600" }}>✓</span>
          {feature}
        </li>
      ))}
    </ul>
  </div>
);

const MakingYourFirstRequestOverview: React.FC = () => {
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
  };

  const litCapabilities = [
    {
      title: "Encryption & Access Control",
      description:
        "Encrypt sensitive data and control who can decrypt it using flexible access control conditions based on wallet ownership, token balances, NFTs, and more.",
      icon: "🔒",
    },
    {
      title: "Programmable Key Pairs (PKPs)",
      description:
        "Create non-custodial blockchain accounts with social authentication, and programmability for condition based and automated signing.",
      icon: "🔑",
    },
    {
      title: "Lit Actions",
      description:
        "Execute decentralized serverless JavaScript functions that can access both on-chain and off-chain data for automated and confidential workflows.",
      icon: "⚙️",
    },
  ];

  const learningPaths = [
    {
      title: "Encryption & Access Control",
      description:
        "Learn how to encrypt sensitive data and control who can decrypt it using flexible access control conditions.",
      features: [
        "Encrypt data with identity-based encryption",
        "Create access control conditions",
        "Support for wallet, token, NFT, and custom conditions",
        "Cross-chain compatibility",
      ],
      color: "#3b82f6",
      icon: "🔒",
    },
    {
      title: "Programmable Key Pairs (PKPs)",
      description:
        "Discover how to create and use blockchain accounts controlled by programmable conditions instead of private keys.",
      features: [
        "Mint PKPs with various auth methods",
        "Sign transactions and messages",
        "Multi-chain signing capabilities",
        "Social authentication integration",
      ],
      color: "#8b5cf6",
      icon: "🔑",
    },
    {
      title: "Lit Actions",
      description:
        "Explore serverless JavaScript functions that can access both on-chain and off-chain data for automated workflows.",
      features: [
        "Write JavaScript code for blockchain operations",
        "Access external APIs and data sources",
        "Conditional execution based on any criteria",
        "Combine with PKPs for autonomous signing",
      ],
      color: "#f59e0b",
      icon: "⚙️",
    },
  ];

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>Making Your First Request</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Welcome to Lit Protocol</h2>

        <p style={pageStyles.p}>
          Lit Protocol is a decentralized network that handles cryptographic
          tasks such as:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
            marginTop: "24px",
            marginBottom: "24px",
          }}
        >
          {litCapabilities.map((capability, index) => (
            <LitCapability key={index} {...capability} />
          ))}
        </div>

        <p style={pageStyles.p}>
          All available to you without relying on centralized servers or
          requiring you to store and manage private keys for yourself or your
          users. You simply write your application logic in TypeScript using the
          Lit SDK, and the Lit Network handles the rest in a secure and
          trustless way.
        </p>

        <p style={pageStyles.p}>
          If you want a deeper dive into how Lit works under the hood, check out
          the{" "}
          <Link
            to="/learning-lit/what-is-lit"
            style={{ color: "#3b82f6", textDecoration: "underline" }}
          >
            Learning Lit
          </Link>{" "}
          section.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>What You'll Build</h2>
        <p style={pageStyles.p}>
          This section takes you through three hands-on learning paths, each
          focusing on one of Lit Protocol's core capabilities and includes
          practical examples you can run right in your browser.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
            marginTop: "24px",
          }}
        >
          {learningPaths.map((path, index) => (
            <LearningPath key={index} {...path} />
          ))}
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Ready to Start?</h2>
        <p style={pageStyles.p}>
          Before jumping into any of the three learning paths, complete the
          prerequisite setup to get an understanding of how to install the Lit
          SDK, connect to, and authenticate with the Lit Network.
        </p>

        {/* Prerequisites Section */}
        <div
          style={{
            marginTop: "24px",
            padding: "24px",
            backgroundColor: "#fff7ed",
            borderRadius: "12px",
            border: "2px solid #fed7aa",
          }}
        >
          <h3
            style={{
              margin: "0 0 16px 0",
              color: "#c2410c",
              fontSize: "1.2rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            📚 Prerequisites
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            {[
              {
                title: "Setup Lit Client",
                description: "Configure your connection to the Lit network",
                path: "/building-with-lit/setup-lit-client",
                required: true,
              },
              {
                title: "Setup Auth Manager",
                description: "Set up authentication and session management",
                path: "/building-with-lit/setup-auth-manager",
                required: true,
              },
            ].map((prereq, index) => (
              <div
                key={index}
                style={{
                  padding: "16px",
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  border: "1px solid #fed7aa",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      color: "#dc2626",
                      backgroundColor: "#fef2f2",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      border: "1px solid #fca5a5",
                    }}
                  >
                    Required
                  </span>
                </div>
                <h4
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  {prereq.title}
                </h4>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "#6b7280",
                    margin: "0 0 12px 0",
                    lineHeight: "1.4",
                  }}
                >
                  {prereq.description}
                </p>
                <Link
                  to={prereq.path}
                  style={{
                    display: "inline-block",
                    fontSize: "0.85rem",
                    color: "#c2410c",
                    textDecoration: "underline",
                    fontWeight: "500",
                  }}
                >
                  View Guide →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default MakingYourFirstRequestOverview;
