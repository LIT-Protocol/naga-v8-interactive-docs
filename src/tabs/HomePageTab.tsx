/**
 * HomePageTab.tsx
 *
 * Landing page for the Lit Protocol Interactive Documentation.
 * Provides an overview of the documentation sections and quick navigation.
 */

import React from "react";
import { Link } from "react-router-dom";
import GreyBoarderWhiteBgContainer from "../components/layout/GreyboardWhiteBgContainer";

const HomePageTab: React.FC = () => {
  const learningOverview = [
    {
      title: "🔑 Key Concepts",
      description: "Learn the core concepts of Lit Protocol",
      path: "/demo",
      color: "#3b82f6",
      items: ["What is Lit Protocol?", "How it works", "What is a Lit Client?"],
    },
    {
      title: "🔐 Authentication",
      description: "Learn how to authenticate users with Lit Protocol",
      path: "/demo",
      color: "#3b82f6",
      items: [
        "OAuth methods",
        "WebAuthn/Passkeys",
        "OTP verification",
        "Custom auth",
      ],
    },
  ];

  const buildingOverview = [
    {
      title: "🔐 Authentication",
      description:
        "Multiple authentication methods including OAuth, WebAuthn, and custom solutions",
      path: "/demo",
      color: "#3b82f6",
      items: [
        "Google, Discord OAuth",
        "WebAuthn/Passkeys",
        "Email/SMS OTP",
        "Custom authentication",
        "EOA wallet integration",
      ],
    },
    {
      title: "🔒 Encryption & Access Control",
      description: "Encrypt data with granular access control conditions",
      path: "/encryption",
      color: "#10b981",
      items: [
        "Conditional encryption",
        "Multi-chain access control",
        "NFT-based permissions",
        "Time-locked content",
        "Custom validation logic",
      ],
    },
    {
      title: "💰 Payment Management",
      description: "Manage deposits, withdrawals, and balance queries",
      path: "/payment-manager",
      color: "#f59e0b",
      items: [
        "Ledger contract integration",
        "Balance queries",
        "Deposit management",
        "Withdrawal operations",
        "Transaction history",
      ],
    },
    {
      title: "🚀 Getting Started",
      description: "Step-by-step setup guides for Lit Protocol integration",
      path: "/setup-lit-client",
      color: "#8b5cf6",
      items: [
        "Lit Client setup",
        "Auth Manager configuration",
        "Auth services setup",
        "Storage plugins",
        "Network configuration",
      ],
    },
  ];

  const learningSteps = [
    {
      step: "1",
      title: "Understand Lit Protocol",
      description:
        "Learn what Lit Protocol is, and explore the key features and capabilities",
      path: "/learning-lit/what-is-lit",
    },
    {
      step: "2",
      title: "Learn How Lit Works",
      description:
        "Dive deep into the technical architecture and mechanisms behind Lit Protocol",
      path: "/learning-lit/how-it-works",
    },
    {
      step: "3",
      title: "Understand the Security Model",
      description: "Learn about the security model of Lit Protocol",
      path: "/learning-lit/security",
    },
    {
      step: "4",
      title: "Try Out the Demo",
      description: "See Lit in action with our interactive demo",
      path: "/learning-lit/demo",
    },
  ];

  const buildingSteps = [
    {
      step: "1",
      title: "Review the Getting Started Guide",
      description: "Learn how to get started with Lit Protocol",
      path: "/building-with-lit/getting-started",
    },
    {
      step: "2",
      title: "Setup the Lit Client",
      description: "Create and configure your Lit Protocol client instance",
      path: "/building-with-lit/setup-lit-client",
    },
    {
      step: "3",
      title: "Setup the Auth Manager",
      description: "Configure authentication manager with storage plugins",
      path: "/building-with-lit/setup-auth-manager",
    },
    {
      step: "4",
      title: "Learn About Setting Up Auth Services",
      description: "Configure your own auth infrastructure (servers & worker)",
      path: "/building-with-lit/setup-auth-services",
    },
  ];

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

  return (
    <div className="tab-content" style={{ marginTop: "-20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        {/* Hero Section */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "700",
              color: "#1f2937",
              marginBottom: "16px",
            }}
          >
            🔥 Lit Protocol Interactive Documentation
          </h1>
        </div>

        {/* Welcome Section */}
        <GreyBoarderWhiteBgContainer style={{ textAlign: "center" }}>
          <h2
            style={{
              marginBottom: "16px",
              color: "#1f2937",
            }}
          >
            👋 Welcome
          </h2>
          <p>
            This documentation provides a comprehensive guide to Lit Protocol's
            JavaScript/TypeScript SDK. Along with overviews of key Lit concepts,
            the SDK's features, and interactive code examples, this
            documentation provides a comprehensive guide to help you get started
            using Lit Protocol.
          </p>
        </GreyBoarderWhiteBgContainer>

        {/* Getting Started Steps - Side by Side */}
        <div style={{ marginTop: "40px" }}>
          <h2
            style={{
              textAlign: "center",
              marginBottom: "32px",
              color: "#1f2937",
              fontSize: "2rem",
            }}
          >
            📋 Getting Started
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
              gap: "32px",
            }}
          >
            {/* Learning Section */}
            <GreyBoarderWhiteBgContainer>
              <h3
                style={{
                  marginBottom: "24px",
                  color: "#3b82f6",
                  fontSize: "1.5rem",
                  textAlign: "center",
                }}
              >
                🧠 Learning Lit
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {learningSteps.map((step, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      padding: "16px",
                      backgroundColor: "#f0f9ff",
                      borderRadius: "8px",
                      border: "1px solid #bae6fd",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        backgroundColor: "#3b82f6",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "600",
                        fontSize: "0.9rem",
                      }}
                    >
                      {step.step}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: "0 0 4px 0", color: "#1f2937" }}>
                        {step.title}
                      </h4>
                      <p
                        style={{
                          margin: 0,
                          color: "#6b7280",
                          fontSize: "0.9rem",
                        }}
                      >
                        {step.description}
                      </p>
                    </div>
                    <Link
                      to={step.path}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#3b82f6",
                        color: "white",
                        textDecoration: "none",
                        borderRadius: "6px",
                        fontSize: "0.9rem",
                        fontWeight: "500",
                        transition: "background-color 0.2s",
                      }}
                    >
                      Learn →
                    </Link>
                  </div>
                ))}
              </div>
            </GreyBoarderWhiteBgContainer>

            {/* Building Section */}
            <GreyBoarderWhiteBgContainer>
              <h3
                style={{
                  marginBottom: "24px",
                  color: "#10b981",
                  fontSize: "1.5rem",
                  textAlign: "center",
                }}
              >
                🛠️ Building with Lit
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {buildingSteps.map((step, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      padding: "16px",
                      backgroundColor: "#f0fdf4",
                      borderRadius: "8px",
                      border: "1px solid #bbf7d0",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        backgroundColor: "#10b981",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "600",
                        fontSize: "0.9rem",
                      }}
                    >
                      {step.step}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: "0 0 4px 0", color: "#1f2937" }}>
                        {step.title}
                      </h4>
                      <p
                        style={{
                          margin: 0,
                          color: "#6b7280",
                          fontSize: "0.9rem",
                        }}
                      >
                        {step.description}
                      </p>
                    </div>
                    <Link
                      to={step.path}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#10b981",
                        color: "white",
                        textDecoration: "none",
                        borderRadius: "6px",
                        fontSize: "0.9rem",
                        fontWeight: "500",
                        transition: "background-color 0.2s",
                      }}
                    >
                      Build →
                    </Link>
                  </div>
                ))}
              </div>
            </GreyBoarderWhiteBgContainer>
          </div>
        </div>

        <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
          <h2
            style={{
              marginBottom: "16px",
              color: "#1f2937",
            }}
          >
            Join the Community
          </h2>
          <p
            style={{
              marginBottom: "16px",
              color: "#4b5563",
            }}
          >
            Join the Lit developer community on{" "}
            <LinkExt href="https://litgateway.com/discord">Discord</LinkExt> and{" "}
            <LinkExt href="https://t.me/+aa73FAF9Vp82ZjJh">Telegram</LinkExt> to
            stay up to date on the latest developments, troubleshoot errors, get
            technical support, and engage with fellow builders.
          </p>
          <p
            style={{
              marginBottom: "16px",
              color: "#4b5563",
            }}
          >
            Have an idea for a project or currently building one? Check out
            Lit's{" "}
            <LinkExt href="https://github.com/LIT-Protocol/Ecosystem-Ideas">
              Ecosystem RFPs
            </LinkExt>{" "}
            and{" "}
            <LinkExt href="https://github.com/LIT-Protocol/LitGrants">
              Grant program
            </LinkExt>
            .
          </p>
          <p
            style={{
              marginBottom: "16px",
              color: "#4b5563",
            }}
          >
            Stay informed by following Lit on{" "}
            <LinkExt href="https://x.com/LitProtocol">X</LinkExt>, and by
            reading the Lit{" "}
            <LinkExt href="https://spark.litprotocol.com/">blog</LinkExt> for
            new product announcements, integrations, ecosystem updates, and
            insights into cryptography and Web3.
          </p>
          <p
            style={{
              marginBottom: "16px",
              color: "#4b5563",
            }}
          >
            Subscribe to Lit's{" "}
            <LinkExt href="https://calendar.google.com/calendar/u/5?cid=Y19hMnVxZDNjaHVqZ2Q0a3FqbGlvcDdxY2JhMEBncm91cC5jYWxlbmRhci5nb29nbGUuY29t">
              community calendar
            </LinkExt>{" "}
            to stay updated on sponsored events, hackathons, office hours, and
            other opportunities to engage with the Lit development team.
          </p>
        </GreyBoarderWhiteBgContainer>
      </div>
    </div>
  );
};

export default HomePageTab;
