/**
 * GettingStartedTab.tsx
 *
 * This component provides an introduction to building with Lit Protocol,
 * explaining the setup process and guiding users through the different
 * components they need to configure.
 */

import React from "react";
import { Link } from "react-router-dom";
import GreyBoarderWhiteBgContainer from "../../components/layout/GreyboardWhiteBgContainer";

const GettingStartedTab: React.FC = () => {
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

  const setupSteps = [
    {
      step: "1",
      title: "Setup Lit Client",
      description: "Create and configure your Lit Protocol client instance",
      path: "/building-with-lit/setup-lit-client",
      color: "#3b82f6",
      details: [],
    },
    {
      step: "2",
      title: "Setup Auth Manager",
      description: "Configure authentication manager with storage plugins",
      path: "/building-with-lit/setup-auth-manager",
      color: "#10b981",
      details: [],
    },
    {
      step: "3",
      title: "Setup Auth Services",
      description: "Configure your own authentication infrastructure",
      path: "/building-with-lit/setup-auth-services",
      color: "#f59e0b",
      details: [],
    },
  ];

  const keyConcepts = [
    {
      title: "Lit Client",
      description:
        "The main interface for interacting with the Lit Protocol network. Handles communication with Lit nodes and manages cryptographic operations.",
      icon: "🔗",
    },
    {
      title: "Auth Manager",
      description:
        "Manages user authentication sessions and provides a unified interface for different authentication methods.",
      icon: "🔐",
    },
    {
      title: "Auth Services",
      description:
        "Backend infrastructure that handles authentication requests, user management, and session validation.",
      icon: "🏗️",
    },
    {
      title: "Storage Plugins",
      description:
        "Configurable storage solutions for persisting authentication state and user preferences.",
      icon: "💾",
    },
  ];

  return (
    <div style={pageStyles.container}>
      <h1 style={pageStyles.h1}>Getting Started with Building</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Introduction</h2>
        <p style={pageStyles.p}>
          This section will guide you through setting up the essential
          components needed to build applications with Lit Protocol. Whether
          you're building a simple authentication system or a complex
          decentralized application, these setup steps will provide you with the
          foundation you need.
        </p>
        <p style={pageStyles.p}>
          The setup process is designed to be modular - you can follow all steps
          for a complete setup, or focus on specific components based on your
          application's requirements.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Key Concepts</h2>
        <p style={pageStyles.p}>
          Before diving into the setup, it's helpful to understand the key
          components and concepts you'll be working with:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
            marginTop: "24px",
          }}
        >
          {keyConcepts.map((concept, index) => (
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
                {concept.icon}
              </div>
              <h3
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  color: "#1f2937",
                }}
              >
                {concept.title}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.9rem",
                  color: "#6b7280",
                  lineHeight: "1.5",
                }}
              >
                {concept.description}
              </p>
            </div>
          ))}
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Setup Overview</h2>
        <p style={pageStyles.p}>
          Building with Lit Protocol involves setting up three main components:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
            marginTop: "24px",
          }}
        >
          {setupSteps.map((step, index) => (
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
              <Link
                to={step.path}
                style={{
                  display: "inline-block",
                  padding: "12px 24px",
                  backgroundColor: step.color,
                  color: "white",
                  textDecoration: "none",
                  borderRadius: "8px",
                  fontWeight: "500",
                  transition: "background-color 0.2s",
                }}
              >
                Get Started →
              </Link>
            </div>
          ))}
        </div>
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default GettingStartedTab;
