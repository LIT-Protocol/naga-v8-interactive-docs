/**
 * Overview.tsx
 *
 * This component details the technical workings of Lit Protocol.
 */

import React from "react";
import { Link } from "react-router-dom";
import GreyBoarderWhiteBgContainer from "../../../components/layout/GreyboardWhiteBgContainer";

const SecurityOverviewTab: React.FC = () => {
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
      <h1 style={pageStyles.h1}>Lit Protocol's Security Model</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Overview</h2>
        <p style={pageStyles.p}>
          The following section provides a highly detailed and technical
          overview of how the Lit network keeps data and assets secure. For an
          introductory overview of how Lit works, check out the{" "}
          <Link
            to="/learning-lit/how-it-works"
            style={{ color: "#3b82f6", textDecoration: "underline" }}
          >
            how it works
          </Link>{" "}
          section.
        </p>
        <p style={pageStyles.p}>
          Lit uses Multi-Party Computation Threshold Signature Schemes (MPC TSS)
          and Trusted Execution Environments (TEEs) to manage secrets, perform
          signing and decryption operations, and execute Lit Actions. Each of
          these is actioned by every node in parallel and requires participation
          from more than two-thirds of the network to be executed.
        </p>
        <p style={pageStyles.p}>
          MPC TSS eliminates the central points of failure associated with key
          management, preventing any single entity from compromising or
          unilaterally accessing the private key material and other secrets
          managed by the network.
        </p>
        <p style={pageStyles.p}>
          The use of TEEs provide hardware-enforced isolation, ensuring that
          even if an adversary gains control of a node's infrastructure,{" "}
          <strong>
            they cannot extract private key shares, manipulate computation
            outputs, or interfere with cryptographic execution.
          </strong>
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Audits</h2>
        <p style={pageStyles.p}>
          All security audit reports can be found{" "}
          <a
            href="https://drive.google.com/drive/folders/1Rrht88iUkzpofwl1CvP9gEjqY60BKyFn"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#3b82f6", textDecoration: "underline" }}
          >
            here
          </a>
          .
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Bug Bounty Program</h2>
        <p style={pageStyles.p}>
          We have a bug bounty program to reward security researchers who find
          and report vulnerabilities in our code. We are committed to keeping
          our code secure and we want to reward those who help us achieve that
          goal.
        </p>
        <p style={pageStyles.p}>
          Our repos can be found here on{" "}
          <a
            href="https://github.com/LIT-Protocol"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#3b82f6", textDecoration: "underline" }}
          >
            Github
          </a>
          .
        </p>
        <p style={pageStyles.p}>
          If you find something and want to report it, email{" "}
          <a
            href="mailto:bugs@litprotocol.com"
            style={{ color: "#3b82f6", textDecoration: "underline" }}
          >
            bugs@litprotocol.com
          </a>{" "}
          with the following information:
        </p>
        <ul style={pageStyles.ul}>
          <li style={pageStyles.li}>A description of the vulnerability</li>
          <li style={pageStyles.li}>Steps to reproduce the vulnerability</li>
          <li style={pageStyles.li}>
            A description of the impact of the vulnerability
          </li>
          <li style={pageStyles.li}>
            Your name, email address, and country of residence
          </li>
        </ul>
        <p style={pageStyles.p}>
          Not all our repos are covered by the bug bounty program. For example,
          our documentation repos and some application repos are not covered. If
          you are unsure if a repo is covered, please email{" "}
          <a
            href="mailto:bugs@litprotocol.com"
            style={{ color: "#3b82f6", textDecoration: "underline" }}
          >
            bugs@litprotocol.com
          </a>{" "}
          to check.
        </p>
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default SecurityOverviewTab;
