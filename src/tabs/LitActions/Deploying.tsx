/**
 * Deploying.tsx
 *
 * This component provides a comprehensive guide on deploying Lit Actions,
 * covering both code string and IPFS deployment methods.
 */

import React from "react";
import GreyBoarderWhiteBgContainer from "../../components/layout/GreyboardWhiteBgContainer";
import { NoteCallout } from "../../components/common";
import { Link } from "react-router-dom";
import DisplayCode from "../../components/DisplayCode";

interface DeploymentMethodProps {
  title: string;
  description: string;
  advantages: string[];
  drawbacks: string[];
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}

const DeploymentMethodCard: React.FC<DeploymentMethodProps> = ({
  title,
  description,
  advantages,
  drawbacks,
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
        fontSize: "1.3rem",
        fontWeight: "600",
        color: textColor,
        marginTop: "0",
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

    <div style={{ marginBottom: "16px" }}>
      <h4
        style={{
          fontSize: "1rem",
          fontWeight: "600",
          color: "#22c55e",
          marginBottom: "8px",
        }}
      >
        ✅ Advantages:
      </h4>
      <ul style={{ paddingLeft: "20px", margin: "0" }}>
        {advantages.map((advantage, index) => (
          <li
            key={index}
            style={{
              fontSize: "0.9rem",
              color: "#4b5563",
              marginBottom: "4px",
              lineHeight: "1.5",
            }}
          >
            {advantage}
          </li>
        ))}
      </ul>
    </div>

    <div>
      <h4
        style={{
          fontSize: "1rem",
          fontWeight: "600",
          color: "#ef4444",
          marginBottom: "8px",
        }}
      >
        ⚠️ Drawbacks:
      </h4>
      <ul style={{ paddingLeft: "20px", margin: "0" }}>
        {drawbacks.map((drawback, index) => (
          <li
            key={index}
            style={{
              fontSize: "0.9rem",
              color: "#4b5563",
              marginBottom: "4px",
              lineHeight: "1.5",
            }}
          >
            {drawback}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const LitActionsDeploying: React.FC = () => {
  const pageStyles = {
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

  const codeStringExample = `
const litActionCode = \`
(async () => {
  // Replace this with your custom code
  console.log("This is my Lit Action!");
})();
\`;

const result = await litClient.executeJs({
  code: litActionCode,
  authContext: authContext,
  jsParams: {},
});`;

  const ipfsExample = `const result = await litClient.executeJs({
  // Replace this with your IPFS CID
  ipfsId: "QmRwN9GKHvCn4Vk7biqtr6adjXMs7PzzYPiw94VAYqd4Gd",
  authContext: authContext,
  jsParams: {},
});`;

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>Deploying Your Lit Action</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Introduction</h2>
        <p style={pageStyles.p}>
          Lit Actions are powerful JavaScript programs that run on a Lit
          network. This guide covers the two approaches to deploying your Lit
          Action, so they can be executed by the Lit network.
        </p>
      </GreyBoarderWhiteBgContainer>

      {/* TODO Update for Naga */}
      {/* <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Lit Action Constraints</h2>
        <p style={pageStyles.p}>
          Before diving into the approaches for deploying a Lit Action, it's
          important to understand the constraints that are in place to prevent
          malicious parties from performing DoS attacks, and the over
          consumption of resources on the Lit nodes.
        </p>

        <WarningCallout
          title="Resource Limits"
          message={
            <>
              <p style={pageStyles.p}>
                The following constraints are imposed on Lit Actions:
              </p>
              <ul style={pageStyles.ul}>
                <li style={pageStyles.li}>
                  <strong>Time Limit:</strong> 30 seconds on Datil and
                  Datil-test networks, 60 seconds on Datil-dev
                </li>
                <li style={pageStyles.li}>
                  <strong>Max Size:</strong> 100MB (code minifiers can help
                  address size issues)
                </li>
                <li style={pageStyles.li}>
                  <strong>Memory Usage:</strong> 256MB RAM
                </li>
              </ul>
            </>
          }
          variant="warning"
          style={{ marginTop: "16px" }}
        />
      </GreyBoarderWhiteBgContainer> */}

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Comparing Deployment Methods</h2>

        <p style={pageStyles.p}>
          In order for the Lit nodes to be able to run your Lit Action, they
          need access to its code. There are two methods of providing your code
          to the Lit network for execution:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
            marginTop: "24px",
          }}
        >
          <DeploymentMethodCard
            title="Providing a Code String"
            description="Generally recommended method where your code is supplied directly to each Lit node."
            advantages={[
              "Direct supply eliminates network latency and availability issues",
              "Removes dependency on IPFS network",
              "Ensures your Lit Action is always available for execution",
              "No additional network calls required",
            ]}
            drawbacks={[
              "Increased network usage due to sending entire code with each request",
              "Users may find it challenging to review and verify the exact code being executed by your Lit Action",
            ]}
            backgroundColor="#f0f9ff"
            borderColor="#0ea5e9"
            textColor="#0c4a6e"
          />

          <DeploymentMethodCard
            title="Uploading to IPFS"
            description="Beneficial for certain scenarios involving large codebases or code reusability."
            advantages={[
              "Better for large or complex Lit Actions",
              "Code reusability across multiple projects",
              "Inherent version control through CIDs",
              "Aligns with decentralized storage philosophy",
              "Easier code verification for users",
            ]}
            drawbacks={[
              "IPFS network latency can delay execution",
              "Propagation time for newly uploaded files",
              "Additional network call required by each node",
              "Potential availability issues with IPFS network",
            ]}
            backgroundColor="#f0fdf4"
            borderColor="#22c55e"
            textColor="#166534"
          />
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Deploying Using a Code String</h2>
        <p style={pageStyles.p}>
          This method is the more straightforward of the two, as we're simply
          providing our Lit Action code as a string when calling the{" "}
          <code>executeJs</code> method.
        </p>

        <DisplayCode code={codeStringExample} language="typescript" />

        <p style={{ ...pageStyles.p, marginTop: "12px" }}>
          First declare the Lit Action as an{" "}
          <a
            href="https://developer.mozilla.org/en-US/docs/Glossary/IIFE"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#0ea5e9", textDecoration: "underline" }}
          >
            Immediately Invoked Function Expression
          </a>
          , i.e. a function that executes itself.
        </p>

        <p style={pageStyles.p}>
          Next, when calling the{" "}
          <code
            style={{
              backgroundColor: "#f3f4f6",
              padding: "2px 4px",
              borderRadius: "4px",
              fontSize: "0.9rem",
            }}
          >
            executeJs
          </code>{" "}
          method to submit a request to the Lit Network, pass your Lit Action
          code string as the <code>code</code> parameter. When the Lit nodes
          receive your request, they will each parse the provided string and
          execute it within their secure TEEs.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Deploying Using IPFS</h2>
        <p style={pageStyles.p}>
          While providing a code string is generally recommended, there are
          scenarios where uploading your Lit Action to IPFS can be beneficial as
          covered above. To implement this, we pass the{" "}
          <a
            href="https://docs.ipfs.tech/quickstart/publish/#cids-explained"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#0ea5e9", textDecoration: "underline" }}
          >
            IPFS Content Identifier (CID)
          </a>{" "}
          when calling the <code>executeJs</code> method.
        </p>

        <DisplayCode code={ipfsExample} language="typescript" />

        <p style={{ ...pageStyles.p, marginTop: "12px" }}>
          When your execution request is received, each Lit node will retrieve
          your Lit Action code from IPFS using the provided CID. You can obtain
          your Lit Action's IPFS CID after uploading and pinning your code to
          IPFS. If you're not familiar with how to do this, you can learn more{" "}
          <a
            href="https://docs.ipfs.tech/quickstart/publish/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#0ea5e9", textDecoration: "underline" }}
          >
            here
          </a>
          .
        </p>

        <NoteCallout
          title="IPFS Pinning Service"
          message={
            <>
              <p>
                <a
                  href="https://www.pinata.cloud/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#0ea5e9", textDecoration: "underline" }}
                >
                  Pinata
                </a>{" "}
                is a popular free to use IPFS pinning service that's easy to
                use.
              </p>
            </>
          }
          variant="info"
          style={{ marginTop: "16px" }}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>A Note on Immutability</h2>
        <p style={pageStyles.p}>
          One of the key features of smart contracts on blockchains is the
          immutability they can offer. For most contracts, you know that the
          code that lives at a specific address can never be changed, and you
          don't have to worry about the underlying code being swapped out for
          some malicious implementation. The same security guarantee can be made
          when using Lit Actions.
        </p>

        <p style={pageStyles.p}>
          If you upload your Lit Action code to IPFS, it's easy to reason about
          how this immutability is achieved. Because IPFS uses content-based
          addressing, i.e. the Content Identifier (CID) of your Lit Action is
          directly derived from its content, any change to the code, no matter
          how small, results in a completely different CID. This means, like
          smart contract addresses, your users can check and verify the IPFS CID
          that's being used when making requests to the Lit network.
        </p>

        <p style={pageStyles.p}>
          However, when passing your Lit Action as a code string, the
          immutability guarantee isn't immediately apparent. What prevents a
          developer from passing malicious code when calling{" "}
          <code>executeJs</code>, compromising the trust users have placed in
          the application? This is where permitted Auth Methods play a crucial
          role in maintaining security.
        </p>

        <p style={pageStyles.p}>
          Programmable Key Pairs (PKPs) allow you to grant specific Lit Actions
          the ability to use the PKP by adding their IPFS CIDs as a permitted
          Auth Method. Users can permit IPFS CIDs corresponding to Lit Actions
          they trust, and only those Lit Actions will be able to use their PKP
          to perform operations like signing data. Using any other Lit Action
          code will result in a unauthorized use error from the Lit nodes.
        </p>

        <p style={pageStyles.p}>
          You can calculate the IPFS CID for any Lit Action code without
          uploading it to IPFS using a package like{" "}
          <a
            href="https://github.com/alanshaw/ipfs-only-hash"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#0ea5e9", textDecoration: "underline" }}
          >
            ipfs-only-hash
          </a>
          . You, or your users, would then permit the IPFS CID for the Lit
          Action you/they trust as an Auth Method for any PKP to be used by the
          Lit Action. Afterwards, when the Lit Action code is submitted to the
          Lit network as a code string, each Lit node will take the code string,
          generate the IPFS CID for it, and check if it's a permitted Auth
          Method for the PKP.
        </p>

        <p style={pageStyles.p}>
          By combining IPFS-based immutability (content-based addressing) and
          Auth Method enforcement, Lit Actions give you the ability to create
          verifiable, tamper-resistant applications just like immutable smart
          contracts.
        </p>
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default LitActionsDeploying;
