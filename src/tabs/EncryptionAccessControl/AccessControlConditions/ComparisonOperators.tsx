import React from "react";
import GreyBoarderWhiteBgContainer from "../../../components/layout/GreyboardWhiteBgContainer";
import { pageStyles } from "../../../styles/pageStyles";
import { DisplayCode } from "../../../components/DisplayCode";
import { NoteCallout } from "../../../components/common";
import { Link } from "react-router-dom";

const ComparisonOperators: React.FC = () => {
  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>Comparison Operators</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Overview</h2>
        <p style={pageStyles.p}>
          Comparison operators are used in Access Control Conditions to define
          how values should be compared. They are essential for creating
          flexible access rules for token balances, timestamps, and other
          numeric conditions.
        </p>
        <p style={pageStyles.p}>
          When working with access control conditions, you can specify a
          comparison operator as the last parameter in methods like{" "}
          <Link
            to="/encryption/access-control/evm/erc20-balance"
            style={{ color: "#3b82f6", textDecoration: "none" }}
          >
            <code>requireTokenBalance()</code>
          </Link>
          and{" "}
          <Link
            to="/encryption/access-control/evm/time-based"
            style={{ color: "#3b82f6", textDecoration: "none" }}
          >
            <code>requireTimestamp()</code>
          </Link>
          .
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Available Operators</h2>
        <p style={pageStyles.p}>
          The following comparison operators are supported:
        </p>

        {(() => {
          const operators = [
            {
              symbol: ">=",
              title: "Greater Than or Equal",
              description: (
                <>
                  Requires <strong>at least</strong> the specified amount
                </>
              ),
              example: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  .requireTokenBalance(
      contractAddress,
      '1000000000000000000',
      '>='
  )
  .on('ethereum')
  .build();`,
            },
            {
              symbol: ">",
              title: "Greater Than",
              description: (
                <>
                  Requires <strong>more than</strong> the specified amount
                </>
              ),
              example: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  .requireTokenBalance(
    contractAddress,
    '1000000000000000000',
    '>'
  )
  .on('ethereum')
  .build();`,
            },
            {
              symbol: "=",
              title: "Equal To",
              description: (
                <>
                  Requires <strong>exactly</strong> the specified amount
                </>
              ),
              example: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  .requireTokenBalance(
    contractAddress,
    '1000000000000000000',
    '='
  )
  .on('ethereum')
  .build();`,
            },
            {
              symbol: "<=",
              title: "Less Than or Equal",
              description: (
                <>
                  Requires <strong>at most</strong> the specified amount
                </>
              ),
              example: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  .requireTokenBalance(
    contractAddress,
    '1000000000000000000',
    '<='
  )
  .on('ethereum')
  .build();`,
            },
            {
              symbol: "<",
              title: "Less Than",
              description: (
                <>
                  Requires <strong>less than</strong> the specified amount
                </>
              ),
              example: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  .requireTokenBalance(
    contractAddress,
    '1000000000000000000',
    '<'
  )
  .on('ethereum')
  .build();`,
            },
          ];

          const cardStyle = {
            padding: "20px",
            backgroundColor: "#fff",
            borderRadius: "8px",
            border: "1px solid #007bff",
            marginBottom: "20px",
          };

          const titleStyle = {
            margin: "0 0 12px 0",
            color: "#0c4a6e",
            fontSize: "1.3rem",
            fontWeight: "600",
          };

          const descriptionStyle = {
            margin: "0 0 16px 0",
            fontSize: "1rem",
            color: "#0c4a6e",
          };

          return (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "20px",
              }}
            >
              {operators.map((operator) => (
                <div key={operator.symbol} style={cardStyle}>
                  <h3 style={titleStyle}>
                    {operator.symbol} ({operator.title})
                  </h3>
                  <p style={descriptionStyle}>{operator.description}</p>

                  <h4 style={{ margin: "16px 0 8px 0", color: "#374151" }}>
                    Usage Example:
                  </h4>
                  <DisplayCode
                    code={operator.example}
                    language="typescript"
                    theme="dracula"
                    style={{ margin: 0 }}
                  />
                </div>
              ))}
            </div>
          );
        })()}

        <NoteCallout
          title="Important Note"
          message={
            <>
              For Access Control Conditions that support operators, the default
              behavior is to use the <code>=</code> (equals) operator, which
              checks for an exact match. If no operator is specified,{" "}
              <code>=</code> will be used by default.
            </>
          }
        />
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default ComparisonOperators;
