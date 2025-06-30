/**
 * BroadcastAndCollect.tsx
 *
 * This component provides a comprehensive guide on using the broadcastAndCollect function
 * within Lit Actions to aggregate responses from all nodes in the network.
 */

import React from "react";
import GreyBoarderWhiteBgContainer from "../../components/layout/GreyboardWhiteBgContainer";
import { NoteCallout } from "../../components/common";
import DisplayCode from "../../components/DisplayCode";
import { Link } from "react-router-dom";
import { pageStyles } from "../../styles/pageStyles";

const LitActionsBroadcastAndCollect: React.FC = () => {
  const basicExample = `const _litActionCode = async () => {
  // Fetch weather data on each node
  const url = "https://api.weather.gov/gridpoints/TOP/31,80/forecast";
  const resp = await fetch(url).then((response) => response.json());
  const temp = resp.properties.periods[0].temperature;

  // Collect responses from all nodes and aggregate them into an array
  const temperatures = await Lit.Actions.broadcastAndCollect({
    name: "temperature",
    value: temp,
  });

  // Calculate median from all node responses
  const median = temperatures.sort()[Math.floor(temperatures.length / 2)];
  
  Lit.Actions.setResponse({ response: median });
};

const litActionCode = \`(\${_litActionCode.toString()})();\`;

const result = await litClient.executeJs({
  code: litActionCode,
  authContext: authContext,
  jsParams: {},
});

console.log("Median temperature from all nodes:", result);`;

  const aggregationExample = `const _litActionCode = async () => {
  // Each node fetches a different data point
  const apiUrl = "https://api.coindesk.com/v1/bpi/currentprice.json";
  const response = await fetch(apiUrl);
  const data = await response.json();
  const price = parseFloat(data.bpi.USD.rate.replace(',', ''));

  // Collect all price responses
  const prices = await Lit.Actions.broadcastAndCollect({
    name: "btcPrice",
    value: price,
  });

  // Calculate statistics
  const average = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const variance = prices.reduce((sum, p) => sum + Math.pow(p - average, 2), 0) / prices.length;

  Lit.Actions.setResponse({
    response: {
      prices: prices,
      statistics: {
        average: average.toFixed(2),
        min: min.toFixed(2),
        max: max.toFixed(2),
        variance: variance.toFixed(2),
        nodeCount: prices.length
      }
    }
  });
};

const litActionCode = \`(\${_litActionCode.toString()})();\`;

const result = await litClient.executeJs({
  code: litActionCode,
  authContext: authContext,
  jsParams: {},
});`;

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>Broadcast and Collect</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Intro</h2>
        <p style={pageStyles.p}>
          The <code>broadcastAndCollect()</code> function allows you to run an
          operation on every node in the Lit network, collect their responses,
          and aggregate them into a single dataset. This enables you to perform
          additional operations over the collected responses, such as
          calculating medians, averages, or other statistical operations.
        </p>

        <p style={pageStyles.p}>
          When you call this function, each node executes the same operation
          independently, and their responses are collected and grouped together
          before being returned to each node for further processing. This
          pattern is particularly useful for scenarios where you need consensus
          or statistical analysis across multiple data sources.
        </p>

        <div style={{ marginTop: "24px" }}>
          <h4 style={pageStyles.h4}>
            When to use <code>broadcastAndCollect()</code>
          </h4>
          <ul style={pageStyles.ul}>
            <li style={pageStyles.li}>
              <strong>Data Aggregation:</strong> Collect multiple API responses
              to calculate averages, medians, or other statistics
            </li>
            <li style={pageStyles.li}>
              <strong>Consensus Building:</strong> Gather responses from
              multiple sources to determine the most reliable data point
            </li>
            <li style={pageStyles.li}>
              <strong>Outlier Detection:</strong> Identify and filter out
              anomalous responses in your dataset
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

        <DisplayCode code={basicExample} language="typescript" />

        <p style={{ ...pageStyles.p, marginTop: "16px" }}>
          In this example, each node fetches weather data independently, then
          all responses are collected and the median temperature is calculated.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Important Considerations</h2>
        <p style={pageStyles.p}>
          When using <code>broadcastAndCollect()</code> in your Lit Actions,
          keep these important factors in mind:
        </p>

        <h4 style={pageStyles.h4}>Network Calls and Timing</h4>
        <p style={pageStyles.p}>
          Each node makes independent network calls, which may return slightly
          different results due to timing or API rate limits. Design your
          aggregation logic to handle these variations gracefully.
        </p>

        <h4 style={pageStyles.h4}>Execution Time</h4>
        <p style={pageStyles.p}>
          Since Lit Actions have execution time limits, ensure data retrieval
          operations complete quickly. Consider using{" "}
          <Link
            to="/lit-actions/run-once"
            style={{
              color: "#0ea5e9",
              textDecoration: "none",
              fontWeight: "500",
            }}
          >
            runOnce()
          </Link>{" "}
          for operations that don't require collection from all nodes.
        </p>
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default LitActionsBroadcastAndCollect;
