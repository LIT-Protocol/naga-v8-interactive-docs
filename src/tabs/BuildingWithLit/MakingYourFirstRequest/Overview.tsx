import React from "react";
import { Link } from "react-router-dom";
import GreyBoarderWhiteBgContainer from "../../../components/layout/GreyboardWhiteBgContainer";
import { pageStyles } from "../../../styles/pageStyles";

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

const MakingYourFirstRequestOverview: React.FC = () => {
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

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>Making Your First Request</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Welcome to Lit Protocol</h2>

        <p style={pageStyles.p}>
          Lit Protocol is a decentralized network that handles cryptographic
          tasks without relying on centralized servers or requiring you to store
          and manage private keys for yourself or your users. You simply write
          your application logic in TypeScript using the Lit SDK, and the Lit
          Network handles the rest in a secure and trustless way.
        </p>

        <p style={pageStyles.p}>
          The network provides three core capabilities:
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
        <h2 style={pageStyles.h2}>Prerequisites</h2>
        <p style={pageStyles.p}>
          Before you can start using any of Lit's capabilities, it's important
          to understand how to connect to the Lit Network and authenticate with
          it. The guides below will walk you through the essential setup steps
          so you can start building with Lit and utilize its core features in
          your apps.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "20px",
            marginTop: "24px",
          }}
        >
          {[
            {
              title: "Setup Lit Client",
              description:
                "Configure your connection to the Lit network and learn how to initialize the Lit SDK.",
              path: "/building-with-lit/first-request/prerequisites/setup-lit-client",
              icon: "🌐",
              step: "Step 1",
            },
            {
              title: "Setup Auth Manager",
              description:
                "Configure session storage and management to persist authentication across app sessions.",
              path: "/building-with-lit/first-request/prerequisites/setup-auth-manager",
              icon: "🔐",
              step: "Step 2",
            },
            {
              title: "Creating Auth Context",
              description:
                "Create an Auth Context that defines how users prove their identity to the Lit Network - whether through social login, wallets, or custom logic.",
              path: "/building-with-lit/first-request/prerequisites/creating-auth-context",
              icon: "🪪",
              step: "Step 3",
            },
          ].map((prereq, index) => (
            <div
              key={index}
              style={{
                padding: "24px",
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                border: "2px solid #e5e7eb",
                position: "relative",
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
                <div style={{ fontSize: "2rem" }}>{prereq.icon}</div>
                <div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      color: "#3b82f6",
                      marginBottom: "4px",
                    }}
                  >
                    {prereq.step}
                  </div>
                  <h3
                    style={{
                      margin: "0",
                      fontSize: "1.25rem",
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    {prereq.title}
                  </h3>
                </div>
              </div>
              <p
                style={{
                  fontSize: "0.95rem",
                  color: "#6b7280",
                  margin: "0 0 20px 0",
                  lineHeight: "1.5",
                }}
              >
                {prereq.description}
              </p>
              <Link
                to={prereq.path}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  backgroundColor: "#3b82f6",
                  color: "#ffffff",
                  textDecoration: "none",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  transition: "background-color 0.2s",
                }}
              >
                Start Guide →
              </Link>
            </div>
          ))}
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>What's Next?</h2>
        <p style={pageStyles.p}>
          Once you've completed the prerequisites, you'll be ready to explore
          Lit's capabilities through interactive guides:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "16px",
            marginTop: "24px",
          }}
        >
          {[
            {
              title: "Encryption & Access Control",
              description:
                "Learn to encrypt data and create access control conditions",
              path: "/encryption-access-control/overview",
              color: "#3b82f6",
            },
            {
              title: "Programmable Key Pairs (PKPs)",
              description:
                "Create and manage blockchain accounts with programmable conditions",
              path: "/programmable-keys/overview",
              color: "#8b5cf6",
            },
            {
              title: "Lit Actions",
              description:
                "Build serverless functions with access to on-chain and off-chain data",
              path: "/lit-actions/overview",
              color: "#f59e0b",
            },
          ].map((next, index) => (
            <div
              key={index}
              style={{
                padding: "20px",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                border: `1px solid ${next.color}30`,
              }}
            >
              <h4
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  color: next.color,
                }}
              >
                {next.title}
              </h4>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#6b7280",
                  margin: "0 0 12px 0",
                  lineHeight: "1.4",
                }}
              >
                {next.description}
              </p>
              <Link
                to={next.path}
                style={{
                  fontSize: "0.85rem",
                  color: next.color,
                  textDecoration: "underline",
                  fontWeight: "500",
                }}
              >
                Explore →
              </Link>
            </div>
          ))}
        </div>
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default MakingYourFirstRequestOverview;
