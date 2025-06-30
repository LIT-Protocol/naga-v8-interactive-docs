/**
 * Fetch.tsx
 *
 * This component provides a comprehensive guide on fetching data from the web
 * within Lit Actions, including examples and important considerations.
 */

import React from "react";
import GreyBoarderWhiteBgContainer from "../../components/layout/GreyboardWhiteBgContainer";
import { NoteCallout } from "../../components/common";
import DisplayCode from "../../components/DisplayCode";
import { Link } from "react-router-dom";
import { pageStyles } from "../../styles/pageStyles";

const LitActionsFetch: React.FC = () => {
  const weatherLitActionExample = `const _litActionCode = async () => {
    try {
        const url = "https://api.weather.gov/gridpoints/TOP/31,80/forecast";
        const resp = await fetch(url).then((response) => response.json());
        const temp = resp.properties.periods[0].temperature;
        console.log("Current temperature from the API:", temp);

        let response = "It's just right!";
        if (temp < jsParams.minTemp) {
            response = "It's too cold!";
        } else if (temp > jsParams.maxTemp) {
            response = "It's too hot!";
        }

        return Lit.Actions.setResponse({ response });
    } catch (error) {
        Lit.Actions.setResponse({ response: error.message });
    }
};

const litActionCode = \`(\${_litActionCode.toString()})();\`;

const result = await litClient.executeJs({
  code: litActionCode,
  authContext: authContext,
  jsParams: {
    minTemp: 60,
    maxTemp: 80,
  },
});

console.log("Result:", result);`;

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>Fetching Data from the Web</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Overview</h2>
        <p style={pageStyles.p}>
          Unlike traditional smart contracts, Lit Actions can natively
          communicate with the external world through HTTP requests. This
          powerful capability enables you to fetch real-time data from APIs,
          create conditional logic based on external data sources, and build
          truly dynamic decentralized applications.
        </p>

        <p style={pageStyles.p}>
          With Lit Actions, you can eliminate the need for traditional oracles
          by incorporating API requests and data processing directly within your
          cryptographic operations. This creates more efficient, trustless, and
          cost-effective solutions for data-driven applications.
        </p>

        <div style={{ marginTop: "24px" }}>
          <h3 style={pageStyles.h3}>Key Benefits</h3>
          <ul style={pageStyles.ul}>
            <li style={pageStyles.li}>
              <strong>No Oracle Dependencies:</strong> Fetch data directly
              without relying on third-party oracle services
            </li>
            <li style={pageStyles.li}>
              <strong>Real-time Processing:</strong> Access up-to-date
              information at execution time
            </li>
            <li style={pageStyles.li}>
              <strong>Conditional Operations:</strong> Make cryptographic
              operations conditional on external data
            </li>
            <li style={pageStyles.li}>
              <strong>Rich API Ecosystem:</strong> Integrate with any HTTP
              accessible API or web service
            </li>
          </ul>
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Basic Fetch Example</h2>

        <NoteCallout
          message={
            <>
              <p>
                For the sake of brevity, this code example excludes the required
                code for setting up the Lit Client and Auth Context. If you're
                unfamiliar with setting up these prerequisites, please refer to
                the{" "}
                <Link
                  to={"/lit-actions/quick-start"}
                  style={{
                    color: "#0ea5e9",
                    textDecoration: "none",
                    fontSize: "0.9rem",
                    fontWeight: "500",
                  }}
                >
                  Lit Actions Quick Start Guide
                </Link>
                .
              </p>
            </>
          }
          variant="note"
          style={{ marginBottom: "16px" }}
        />

        <p style={pageStyles.p}>
          This Lit Action fetches real-time temperature data from the National
          Weather Service API and compares it against minimum and maximum
          thresholds provided via <code>jsParams</code>. It demonstrates how
          external data can drive conditional logic, returning different
          responses based on whether the current temperature falls below,
          within, or above the defined range.
        </p>

        <DisplayCode code={weatherLitActionExample} language="typescript" />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Important Considerations</h2>
        <p style={pageStyles.p}>
          When your Lit Action uses <code>fetch()</code>, it's important to
          understand that the request is made by <strong>every Lit node</strong>{" "}
          processing the action. This distributed execution has important
          implications for how you design both read and write operations.
        </p>

        <h4 style={pageStyles.h4}>Read Operations</h4>
        <p style={pageStyles.p}>
          Fetching data (e.g., weather, prices, public APIs) is generally safe
          as long as you're not causing side effects. However, keep the
          following in mind:
        </p>
        <ul style={pageStyles.ul}>
          <li style={pageStyles.li}>
            <strong>Rate Limiting:</strong> The same HTTP request will be made
            once per node. Be mindful of API limits, per-request billing, or
            throttling.
          </li>
          <li style={pageStyles.li}>
            <strong>Deterministic Responses:</strong> Lit nodes must agree on
            the final result to reach consensus. If your API returns
            inconsistent or non-deterministic data (e.g., timestamps or random
            values), your action will timeout waiting for the nodes to reach
            consensus.
          </li>
        </ul>

        <h4 style={pageStyles.h4}>Write Operations</h4>
        <p style={pageStyles.p}>
          If your Lit Action modifies external data (e.g., using{" "}
          <code>POST</code>, <code>PUT</code>, or <code>DELETE</code>), those
          operations must be <strong>idempotent</strong> — meaning repeated
          execution produces the same effect. Otherwise, you risk duplicate
          entries or unintended side effects.
        </p>

        <h4 style={pageStyles.h4}>
          Using <code>runOnce()</code>
        </h4>
        <p style={pageStyles.p}>
          If you need to perform your read or write operation only once, check
          out the built-in{" "}
          <Link
            to="/lit-actions/run-once"
            style={{
              color: "#0ea5e9",
              textDecoration: "none",
              fontSize: "0.9rem",
              fontWeight: "500",
            }}
          >
            runOnce()
          </Link>{" "}
          function that lets you define logic to be executed only by a single
          Lit node.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Error Handling</h2>
        <p style={pageStyles.p}>
          Robust error handling is crucial when making HTTP requests within Lit
          Actions. Network issues, API rate limits, or service unavailability
          can affect your Lit Action's execution, and explicit error handling
          helps you debug what went wrong.
        </p>

        <div style={{ marginTop: "20px" }}>
          <h3 style={pageStyles.h3}>Best Practices</h3>
          <ul style={pageStyles.ul}>
            <li style={pageStyles.li}>
              <strong>Always use try-catch blocks</strong> around fetch
              operations to handle network errors gracefully
            </li>
            <li style={pageStyles.li}>
              <strong>Check response status codes</strong> and handle HTTP
              errors appropriately
            </li>
            <li style={pageStyles.li}>
              <strong>Provide meaningful error messages</strong> in your
              response to help debug issues
            </li>
            <li style={pageStyles.li}>
              <strong>Consider timeout scenarios</strong> and plan for API
              unavailability
            </li>
            <li style={pageStyles.li}>
              <strong>Use fallback mechanisms</strong> when possible, such as
              alternative APIs or cached data
            </li>
          </ul>
        </div>
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default LitActionsFetch;
