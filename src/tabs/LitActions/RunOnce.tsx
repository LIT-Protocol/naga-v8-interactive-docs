/**
 * RunOnce.tsx
 *
 * This component provides a comprehensive guide on using the runOnce function
 * within Lit Actions to execute code on a single node instead of all nodes.
 */

import React from "react";
import GreyBoarderWhiteBgContainer from "../../components/layout/GreyboardWhiteBgContainer";
import { NoteCallout } from "../../components/common";
import DisplayCode from "../../components/DisplayCode";
import { Link } from "react-router-dom";
import { pageStyles } from "../../styles/pageStyles";

const LitActionsRunOnce: React.FC = () => {
  const basicRunOnceExample = `const _litActionCode = async () => {
  // Code before the runOnce runs on all nodes
  console.log("This runs on every node in the network");
  
  const result = await Lit.Actions.runOnce(
    { waitForResponse: true, name: "singleNodeOperation" }, 
    async () => {
      // Code within this async function runs only on the selected node
      const timestamp = Date.now();
      const randomValue = Math.random();
      console.log("This only runs on one node:", timestamp);
      
      return { timestamp, randomValue };
    }
  );
  
  // Outside of the runOnce, all the nodes run this code and have access
  // to the result of the runOnce
  console.log("Result from single node:", result);
  Lit.Actions.setResponse({ response: result });
};

const litActionCode = \`(\${_litActionCode.toString()})();\`;

const result = await litClient.executeJs({
  code: litActionCode,
  authContext: authContext,
  jsParams: {},
});

console.log("Result:", result);`;

  const responseStrategyExample = `// Configure response strategy when executing
const result = await litClient.executeJs({
  code: litActionCode,
  authContext: authContext,
  jsParams: {},
  
  // Response strategy options:
  responseStrategy: "mostCommon", // or "leastCommon", "custom"
  
  // For custom strategy, provide a filter function
  customFilter: (responses) => {
    // Return the response you want to use
    return responses.find(r => r.success === true);
  }
});`;

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>Running Code on a Single Node</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Intro</h2>
        <p style={pageStyles.p}>
          By default, Lit Actions execute across every node in the Lit Network
          simultaneously. While this provides security and consensus, there are
          scenarios where you want certain operations to run on only one node to
          avoid duplication, reduce costs, or prevent side effects.
        </p>

        <p style={pageStyles.p}>
          The <code>runOnce()</code> function allows you to specify code that
          should execute on a single, deterministically selected node. The
          chosen node runs the function and broadcasts the result to all other
          nodes, ensuring consistency across the network.
        </p>

        <div style={{ marginTop: "24px" }}>
          <h4 style={pageStyles.h4}>
            Examples of When to Use <code>runOnce()</code>
          </h4>
          <ul style={pageStyles.ul}>
            <li style={pageStyles.li}>
              <strong>Transaction Broadcasting:</strong> Send blockchain
              transactions without every node broadcasting the same transaction
            </li>
            <li style={pageStyles.li}>
              <strong>External API Calls:</strong> Make HTTP requests that
              shouldn't be repeated across all nodes
            </li>
            <li style={pageStyles.li}>
              <strong>Resource-Intensive Operations:</strong> Perform
              computations that would be wasteful to repeat
            </li>
            <li style={pageStyles.li}>
              <strong>Non-Deterministic Operations:</strong> Generate
              timestamps, random values, or other unique data
            </li>
          </ul>
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Basic Usage</h2>

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
                    color: "#007bff",
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
          Here's a simple example showing how <code>runOnce()</code> works. The
          function takes a configuration object and an async function to execute
          on a single node.
        </p>

        <DisplayCode code={basicRunOnceExample} language="typescript" />

        <p style={{ ...pageStyles.p, marginTop: "16px" }}>
          In this example, the timestamp and random value are generated on only
          one node, but all nodes receive the same result. This ensures
          deterministic behavior across the nodes even when executing
          un-deterministic code.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Configuration Options</h2>
        <p style={pageStyles.p}>
          The <code>runOnce()</code> function accepts a configuration object
          with the following properties:
        </p>

        <div style={{ marginTop: "24px", display: "grid", gap: "24px" }}>
          <div
            style={{
              padding: "16px",
              backgroundColor: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          >
            <h4 style={{ ...pageStyles.h4, marginTop: "0" }}>
              <code>waitForResponse</code>
            </h4>
            <p style={pageStyles.p}>
              <strong>Type:</strong> <code>boolean</code>
              <br />
              <strong>Default:</strong> <code>true</code>
              <br />
              <strong>Description:</strong> Determines whether the Lit Action
              should wait for the selected node to complete execution before
              continuing. Set to <code>false</code> for fire-and-forget behavior
              where there is no need to wait for the result.
            </p>
          </div>

          <div
            style={{
              padding: "16px",
              backgroundColor: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          >
            <h4 style={{ ...pageStyles.h4, marginTop: "0" }}>
              <code>name</code>
            </h4>
            <p style={pageStyles.p}>
              <strong>Type:</strong> <code>string</code>
              <br />
              <strong>Required:</strong> Yes
              <br />
              <strong>Description:</strong> A unique identifier for the
              operation. This is especially helpful when using multiple{" "}
              <code>runOnce()</code> calls within the same Lit Action to
              distinguish between them.
            </p>
          </div>
        </div>

        <NoteCallout
          title="Return Value Requirements"
          variant="info"
          message={
            <>
              <p>
                The function passed to <code>runOnce()</code> must return a
                value that can be serialized with <code>toString()</code>.
                Complex objects should be converted to JSON strings or simple
                primitives. If serialization fails, the response will default to{" "}
                <code>[ERROR]</code>.
              </p>
            </>
          }
          style={{ marginTop: "28px" }}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Important Considerations</h2>
        <p style={pageStyles.p}>
          While <code>runOnce()</code> is powerful, there are several important
          considerations to keep in mind when using it in your Lit Actions.
        </p>

        <h4 style={pageStyles.h4}>Node Selection</h4>
        <p style={pageStyles.p}>
          The node selection process is deterministic but not predictable. You
          cannot control which specific node will be chosen to execute your
          function. The selection is based on cryptographic algorithms that
          ensure fairness and security.
        </p>

        <h4 style={pageStyles.h4}>Error Handling</h4>
        <p style={pageStyles.p}>
          If the selected node fails to execute the function (due to network
          issues, errors, etc.), the operation may fail entirely. Implement
          proper error handling within your <code>runOnce()</code> function to
          gracefully handle potential failures.
        </p>

        <h4 style={pageStyles.h4}>Consensus and Security</h4>
        <p style={pageStyles.p}>
          Operations within <code>runOnce()</code> don't benefit from the same
          consensus mechanisms as regular Lit Action code. Only one node
          validates the execution, so ensure your operations are secure and
          don't rely on consensus for correctness.
        </p>

        <h4 style={pageStyles.h4}>Network Latency</h4>
        <p style={pageStyles.p}>
          When <code>waitForResponse</code> is set to <code>true</code>, all
          nodes wait for the selected node to complete execution. This can
          introduce latency, especially for time-consuming operations.
        </p>
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default LitActionsRunOnce;
