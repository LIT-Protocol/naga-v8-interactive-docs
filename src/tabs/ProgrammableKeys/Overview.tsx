/**
 * Overview.tsx
 *
 * This component provides a comprehensive overview of Programmable Key Pairs (PKPs)
 * and Wrapped Keys, explaining their differences, features, and use cases.
 */

import React from "react";
import GreyBoarderWhiteBgContainer from "../../components/layout/GreyboardWhiteBgContainer";
import WarningCallout from "../../components/common/WarningCallout";
import { Link } from "react-router-dom";

interface ComparisonCardProps {
  title: string;
  description: string;
  details: React.ReactNode;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}

const ComparisonCard: React.FC<ComparisonCardProps> = ({
  title,
  description,
  details,
  backgroundColor,
  borderColor,
  textColor,
}) => (
  <div
    style={{
      padding: "20px",
      backgroundColor,
      borderRadius: "8px",
      border: `1px solid ${borderColor}`,
    }}
  >
    <h3
      style={{
        fontSize: "1.5rem",
        fontWeight: "600",
        color: textColor,
        marginTop: "24px",
        marginBottom: "12px",
      }}
    >
      {title}
    </h3>
    <p
      style={{
        fontSize: "1rem",
        lineHeight: "1.6",
        color: "#4b5563",
        marginBottom: "16px",
      }}
    >
      {description}
    </p>
    <p
      style={{
        fontSize: "0.9rem",
        fontStyle: "italic",
        color: "#4b5563",
        marginBottom: "16px",
      }}
    >
      {details}
    </p>
  </div>
);

const ProgrammableKeysOverview: React.FC = () => {
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

  const comparisonData = {
    pkps: {
      title: "Programmable Key Pairs (PKPs)",
      description:
        "Blockchain key pairs created by the Lit network using Distributed Key Generation (DKG)",
      details: (
        <>
          <p>
            New blockchain key pairs (ECDSA or EdDSA){" "}
            <a
              href="https://docs.google.com/document/d/1eaSk6822d4B-bJtMiiGp4n9N4qZPnwWaEZOy-Xs8AK0/edit?tab=t.0#heading=h.neg7c932dvso"
              target="_blank"
              style={{ color: "#0ea5e9", textDecoration: "underline" }}
            >
              created through DKG
            </a>
            , where multiple Lit nodes collaborate to generate a new private key
            without any single node ever seeing the complete key. When signing
            collectively produce a valid signature without reconstructing the
            full key.
          </p>
          <p>
            This means the private key never exists in its complete form on any
            single machine, making it virtually impossible to steal or
            compromise through attacks on individual Lit nodes.
          </p>
        </>
      ),
      features: [
        <>
          <strong>Decentralized Creation:</strong> Generated across the Lit
          network using DKG—no single node holds the full key
        </>,
        <>
          <strong>High Security:</strong> Uses multiparty computation threshold
          signature schemes (MPC TSS) to keep keys decentralized
        </>,
        <>
          <strong>Blockchain Support:</strong> Works with key types like
          secp256k1 (used by Ethereum) and Ed25519 (used by Solana)
        </>,
        <>
          <strong>Programmable Control:</strong> Pair with Lit Actions to add
          custom rules, like multi-signature approvals
        </>,
      ],
      security: (
        <>
          <p>
            PKPs distribute the private key across multiple Lit nodes using
            Distributed Key Generation (DKG). No single node ever holds the full
            key, and signing requires collaboration from a majority of nodes
            using threshold signature schemes.
          </p>
          <p>
            This ensures that the private key is never fully assembled or stored
            in any one place, offering stronger security guarantees.
          </p>
        </>
      ),
    },
    wrappedKeys: {
      title: "Wrapped Keys",
      description:
        "Private keys encrypted with Lit and stored using the Wrapped Keys backend service",
      details: (
        <>
          <p>
            Existing private keys are either encrypted and imported into the
            Wrapped Keys backend service, or generated and encrypted within a{" "}
            <a
              href="https://docs.google.com/document/d/1eaSk6822d4B-bJtMiiGp4n9N4qZPnwWaEZOy-Xs8AK0/edit?tab=t.0#heading=h.4trh1ft0780l"
              target="_blank"
              style={{ color: "#0ea5e9", textDecoration: "underline" }}
            >
              secure part of a Lit node
            </a>{" "}
            (called a trusted execution environment, or TEE) and then stored in
            the Wrapped Keys backend service.
          </p>
          <p>
            Unlike PKPs, the full key exists briefly in one node's TEE when
            encrypted, and decrypted to be used for signing, offering
            flexibility at a slightly different security tradeoff.
          </p>
        </>
      ),
      features: [
        <>
          <strong>Flexible Setup:</strong> Import an existing key or generate
          one in a Lit node's TEE
        </>,
        <>
          <strong>Secure Storage:</strong> Encrypted by the Lit network and
          stored in a private database
        </>,
        <>
          <strong>Wider Blockchain Support:</strong> Works with any key type,
          connecting to a broader range of blockchains
        </>,
        <>
          <strong>Import/Export Options:</strong> Import existing keys or export
          them to other systems
        </>,
        <>
          <strong>Programmable Control:</strong> Use Lit Actions to program
          custom signing logic, just like with PKPs
        </>,
      ],
      security: (
        <>
          <p>
            Wrapped Keys are encrypted and stored securely, with signing
            operations happening inside a Trusted Execution Environment (TEE) on
            a single node.
          </p>
          <p>
            While the full key briefly exists during use inside of a single Lit
            node's TEE, the TEE provides hardware-based isolation to protect
            against attack vectors—offering a balance between usability and
            security.
          </p>
        </>
      ),
    },
  };

  const useCases = [
    {
      title: "Non-Custodial Wallets",
      description:
        "Build user-friendly wallets that eliminate seed phrases while keeping users in control. Perfect for consumer applications requiring seamless onboarding without sacrificing security.",
      icon: "🔑",
    },
    {
      title: "Asset Vaults",
      description:
        "Create secure, programmable storage solutions for digital assets with sophisticated access controls. Implement multi-signature schemes, time-locked withdrawals, and conditional asset management.",
      icon: "🔒",
    },
    {
      title: "Smart Account Signers",
      description:
        "Use PKPs or Wrapped Keys as signers for smart contract accounts, enabling advanced account abstraction features like gasless transactions and automated execution.",
      icon: "🤖",
    },
    {
      title: "Cross-Chain Orchestration",
      description:
        "Manage assets and execute transactions across multiple blockchain networks from a single programmable interface, simplifying complex multi-chain workflows.",
      icon: "🌐",
    },
  ];

  return (
    <div style={pageStyles.container}>
      <h1 style={pageStyles.h1}>Overview</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Introduction</h2>
        <p style={pageStyles.p}>
          Lit offers two powerful tools for managing private keys:{" "}
          <strong>Programmable Key Pairs (PKPs)</strong> and{" "}
          <strong>Wrapped Keys</strong>.
        </p>
        <p style={pageStyles.p}>
          Both are designed to help users securely interact with web3
          applications without relying on third-party custodians.
        </p>
        <p style={pageStyles.p}>
          Whether you're building a wallet or managing digital assets, these
          tools provide a seamless and non-custodial experience where users
          retain full control over their keys. Onboarding is simplified through
          familiar web2-style logins, such as Google OAuth or Passkeys,
          eliminating the need for users to handle complex seed phrases or worry
          about self-custody risks.
        </p>
        <p style={pageStyles.p}>
          Backed by the decentralized Lit network, PKPs and Wrapped Keys ensure
          that only the user can access and manage their assets, delivering
          strong guarantees around privacy and security while also providing a
          seamless onboarding experience.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>PKPs vs. Wrapped Keys</h2>

        <WarningCallout
          title="Wrapped Keys Not Supported by V8 of the Lit SDKs"
          message={
            <>
              <p>
                Wrapped Keys are not currently supported in version 8 of the Lit
                SDKs, but will be available in a future release.
              </p>
              <p>
                If you'd like to use Wrapped Keys in your application, please
                refer to the{" "}
                <Link
                  to="https://developer.litprotocol.com/user-wallets/wrapped-keys/overview"
                  style={{ color: "#3b82f6", textDecoration: "underline" }}
                >
                  V7 Wrapped Keys documentation.
                </Link>{" "}
              </p>
            </>
          }
          variant="warning"
          style={{ marginBottom: "24px" }}
        />

        <p style={pageStyles.p}>
          PKPs and Wrapped Keys both manage private keys, but they work
          differently and suit different needs:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
            marginTop: "24px",
          }}
        >
          <ComparisonCard
            title={comparisonData.pkps.title}
            description={comparisonData.pkps.description}
            details={comparisonData.pkps.details}
            backgroundColor="#f0f9ff"
            borderColor="#0ea5e9"
            textColor="#0c4a6e"
          />

          <ComparisonCard
            title={comparisonData.wrappedKeys.title}
            description={comparisonData.wrappedKeys.description}
            details={comparisonData.wrappedKeys.details}
            backgroundColor="#f0fdf4"
            borderColor="#22c55e"
            textColor="#166534"
          />
        </div>

        <p
          style={{
            ...pageStyles.p,
            marginTop: "24px",
            fontStyle: "italic",
            backgroundColor: "#f8fafc",
            padding: "16px",
            borderRadius: "8px",
          }}
        >
          In short, PKPs prioritize maximum security for specific blockchains,
          while Wrapped Keys offer broader compatibility and flexibility. Your
          choice depends on your app's needs, the blockchains you're working
          with, and your security goals.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Key Features</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "32px",
            marginTop: "24px",
          }}
        >
          <div>
            <h3 style={{ ...pageStyles.h3, color: "#0c4a6e" }}>
              Programmable Key Pairs (PKPs)
            </h3>
            <ul style={pageStyles.ul}>
              {comparisonData.pkps.features.map((feature, index) => (
                <li key={index} style={pageStyles.li}>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 style={{ ...pageStyles.h3, color: "#166534" }}>Wrapped Keys</h3>
            <ul style={pageStyles.ul}>
              {comparisonData.wrappedKeys.features.map((feature, index) => (
                <li key={index} style={pageStyles.li}>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Security Considerations</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
            marginTop: "24px",
          }}
        >
          <div
            style={{
              padding: "16px",
              backgroundColor: "#f0f9ff",
              borderRadius: "8px",
              border: "1px solid #0ea5e9",
            }}
          >
            <h4
              style={{
                margin: "0 0 8px 0",
                color: "#0c4a6e",
                fontWeight: "600",
              }}
            >
              PKPs
            </h4>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#0c4a6e" }}>
              {comparisonData.pkps.security}
            </p>
          </div>
          <div
            style={{
              padding: "16px",
              backgroundColor: "#f0fdf4",
              borderRadius: "8px",
              border: "1px solid #22c55e",
            }}
          >
            <h4
              style={{
                margin: "0 0 8px 0",
                color: "#166534",
                fontWeight: "600",
              }}
            >
              Wrapped Keys
            </h4>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#166534" }}>
              {comparisonData.wrappedKeys.security}
            </p>
          </div>
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Use Cases</h2>
        <p style={pageStyles.p}>
          PKPs and Wrapped Keys enable a wide range of applications that require
          secure, programmable key management:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
            marginTop: "24px",
          }}
        >
          {useCases.map((useCase, index) => (
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
    </div>
  );
};

export default ProgrammableKeysOverview;
