import React, { useState } from "react";
import { DisplayCode } from "../../../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../../../components/layout/GreyboardWhiteBgContainer";
import { pageStyles } from "../../../styles/pageStyles";
import { NoteCallout } from "../../../components/common";
import { Link } from "react-router-dom";

const LitAction: React.FC = () => {
  const [selectedExample, setSelectedExample] = useState<string>("weather");
  const [ipfsCid, setIpfsCid] = useState<string>("QmWeatherBasedCID789456123");
  const [methodName, setMethodName] = useState<string>("go");
  const [parameters, setParameters] = useState<string>('["40"]');
  const [expectedValue, setExpectedValue] = useState<string>("true");
  const [comparator, setComparator] = useState<string>("=");
  const [builtConditions, setBuiltConditions] = useState<
    unknown[] | { error: string } | null
  >(null);

  const getExamples = () => {
    return {
      weather: {
        title: "Weather-Based Access",
        description: "Decrypt content only when temperature is below 40°F",
        ipfsCid: "QmWeatherBasedCID789456123",
        method: "go",
        parameters: ["40"],
        expectedValue: "true",
        comparator: "=",
        litActionCode: `const go = async (maxTemp) => {
  const url = "https://api.weather.gov/gridpoints/LWX/97,71/forecast";
  try {
    const response = await fetch(url).then((res) => res.json());
    const nearestForecast = response.properties.periods[0];
    const temp = nearestForecast.temperature;
    return LitActions.setResponse({ response: temp < parseInt(maxTemp) });
  } catch (e) {
    console.log(e);
    return LitActions.setResponse({ response: "false" });
  }
};`,
        builderCode: `// Traditional Format (JSON)
const accessControlConditions = [
  {
    contractAddress: "ipfs://QmWeatherBasedCID789456123",
    standardContractType: "LitAction",
    chain: "ethereum",
    method: "go",
    parameters: ["40"],
    returnValueTest: {
      comparator: "=",
      value: "true",
    },
  },
];`,
      },
      business: {
        title: "Business Hours Gate",
        description:
          "Restrict access to business documents during work hours only",
        ipfsCid: "QmBusinessHoursCID789456123",
        method: "checkBusinessHours",
        parameters: ["America/New_York", "9", "17"],
        expectedValue: "true",
        comparator: "=",
        litActionCode: `const checkBusinessHours = async (timezone, startHour, endHour) => {
  try {
    // Get current time in specified timezone
    const now = new Date();
    const timeInZone = new Date(now.toLocaleString("en-US", {timeZone: timezone}));
    
    const currentHour = timeInZone.getHours();
    const currentDay = timeInZone.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Check if it's a weekday (Monday-Friday)
    const isWeekday = currentDay >= 1 && currentDay <= 5;
    
    // Check if current hour is within business hours
    const isBusinessHour = currentHour >= parseInt(startHour) && currentHour < parseInt(endHour);
    
    return LitActions.setResponse({ response: isWeekday && isBusinessHour });
  } catch (error) {
    console.log("Business hours check failed:", error);
    return LitActions.setResponse({ response: "false" });
  }
};`,
        builderCode: `// Traditional Format (JSON)
const accessControlConditions = [
  {
    contractAddress: "ipfs://QmBusinessHoursCID789456123",
    standardContractType: "LitAction",
    chain: "ethereum",
    method: "checkBusinessHours",
    parameters: ["America/New_York", "9", "17"],
    returnValueTest: {
      comparator: "=",
      value: "true",
    },
  },
];`,
      },
      subscription: {
        title: "Subscription Validation",
        description:
          "Verify user has active premium subscription via external API",
        ipfsCid: "QmSubscriptionValidatorCID456789",
        method: "validateSubscription",
        parameters: ["user_12345"],
        expectedValue: "premium",
        comparator: "=",
        litActionCode: `const validateSubscription = async (userId) => {
  try {
    // Check user's subscription status with external service
    const response = await fetch(\`https://api.service.com/users/\${userId}\`);
    
    if (!response.ok) {
      return LitActions.setResponse({ response: "invalid" });
    }
    
    const data = await response.json();
    
    // Check if subscription is active and not expired
    const now = new Date();
    const expiryDate = new Date(data.expiresAt);
    
    if (data.status === 'active' && expiryDate > now) {
      return LitActions.setResponse({ response: data.tier }); // Returns: "basic", "premium", "enterprise"
    } else {
      return LitActions.setResponse({ response: "expired" });
    }
  } catch (error) {
    console.log("Subscription validation failed:", error);
    return LitActions.setResponse({ response: "error" });
  }
};`,
        builderCode: `// Traditional Format (JSON)
const accessControlConditions = [
  {
    contractAddress: "ipfs://QmSubscriptionValidatorCID456789",
    standardContractType: "LitAction",
    chain: "ethereum",
    method: "validateSubscription",
    parameters: ["user_12345"],
    returnValueTest: {
      comparator: "=",
      value: "premium",
    },
  },
];`,
      },
      reputation: {
        title: "Reputation Score Gate",
        description:
          "Calculate user reputation from multiple sources and grant access based on score",
        ipfsCid: "QmReputationScoreCID321654987",
        method: "calculateReputation",
        parameters: ["0x742d35Cc6634C0532925a3b8D40Ec6dA2bBe9c5c", "750"],
        expectedValue: "qualified",
        comparator: "=",
        litActionCode: `const calculateReputation = async (userID, threshold) => {
  try {
    // Fetch data from multiple reputation sources
    const [githubData, twitterData, lensData] = await Promise.all([
      fetch(\`https://api.github.com/users/\${userID}\`).then(r => r.json()),
      fetch(\`https://api.twitter.com/2/users/\${userID}\`).then(r => r.json()),
      fetch(\`https://api.lens.dev/profiles/\${userID}\`).then(r => r.json())
    ]);
    
    // Calculate reputation score from various metrics
    const githubScore = githubData.contributions_count || 0;
    const twitterScore = twitterData.followers_count || 0;
    const lensScore = lensData.totalFollowers || 0;
    
    // Weighted total score
    const totalScore = (githubScore * 0.4) + (twitterScore * 0.3) + (lensScore * 0.3);
    
    if (totalScore >= parseInt(threshold)) {
      return LitActions.setResponse({ response: "qualified" });
    } else {
      return LitActions.setResponse({ response: "insufficient" });
    }
  } catch (error) {
    console.log("Reputation calculation failed:", error);
    return LitActions.setResponse({ response: "error" });
  }
};`,
        builderCode: `// Traditional Format (JSON)
const accessControlConditions = [
  {
    contractAddress: "ipfs://QmReputationScoreCID321654987",
    standardContractType: "LitAction",
    chain: "ethereum",
    method: "calculateReputation",
    parameters: ["0x742d35Cc6634C0532925a3b8D40Ec6dA2bBe9c5c", "750"],
    returnValueTest: {
      comparator: "=",
      value: "qualified",
    },
  },
];`,
      },
    };
  };

  const examples = getExamples();

  const buildConditions = () => {
    try {
      let parsedParameters: string[] = [];
      try {
        parsedParameters = JSON.parse(parameters);
        if (!Array.isArray(parsedParameters)) {
          throw new Error("Parameters must be an array");
        }
      } catch (parseError) {
        throw new Error(
          'Invalid JSON in parameters. Must be an array of strings like ["40", "param2"]'
        );
      }

      const conditions = [
        {
          contractAddress: `ipfs://${ipfsCid}`,
          standardContractType: "LitAction",
          chain: "ethereum",
          method: methodName,
          parameters: parsedParameters,
          returnValueTest: {
            comparator: comparator,
            value: expectedValue,
          },
        },
      ];

      setBuiltConditions(conditions);
    } catch (error) {
      console.error("Error building conditions:", error);
      setBuiltConditions({ error: (error as Error).message });
    }
  };

  const loadExample = (exampleKey: string) => {
    const example = examples[exampleKey as keyof typeof examples];
    if (example) {
      setSelectedExample(exampleKey);
      setIpfsCid(example.ipfsCid);
      setMethodName(example.method);
      setParameters(JSON.stringify(example.parameters));
      setExpectedValue(example.expectedValue);
      setComparator(example.comparator);
    }
  };

  // Generate dynamic builder code based on current form values
  const getDynamicBuilderCode = () => {
    let parsedParameters: string[] = [];
    try {
      parsedParameters = JSON.parse(parameters);
    } catch (e) {
      parsedParameters = ["40"]; // fallback
    }

    return `// Traditional Format (JSON)
const accessControlConditions = [
  {
    contractAddress: "ipfs://${ipfsCid}",
    standardContractType: "LitAction",
    chain: "ethereum",
    method: "${methodName}",
    parameters: ${JSON.stringify(parsedParameters, null, 4)},
    returnValueTest: {
      comparator: "${comparator}",
      value: "${expectedValue}",
    },
  },
];`;
  };

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>Lit Action Access Control Conditions</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Introduction</h2>
        <p style={pageStyles.p}>
          Lit Action Conditions allow you to create custom access control logic
          by executing JavaScript code withing a Lit node's Trusted Execution
          Environment (TEE).
        </p>
        <p style={pageStyles.p}>
          You can use Lit Actions to interact with external APIs, perform
          complex calculations, or implement custom validation rules that
          determine whether a user can decrypt content.
        </p>
        <p style={pageStyles.p}>
          The Lit Action returns a value that is compared against your expected
          result to grant or deny access. This enables powerful use cases like
          weather-gated content, time-based access, API validation, and custom
          business logic.
        </p>
        <p style={pageStyles.p}>
          Learn more about combining Lit Actions with other conditions using{" "}
          <Link
            to="/encryption/access-control/boolean-logic"
            style={{ color: "#007bff", textDecoration: "underline" }}
          >
            Boolean Logic
          </Link>{" "}
          and{" "}
          <Link
            to="/encryption/access-control/comparison-operators"
            style={{ color: "#007bff", textDecoration: "underline" }}
          >
            Comparison Operators
          </Link>
          .
        </p>

        <NoteCallout
          title="IPFS Storage Required"
          message={
            <>
              Your Lit Action code must be stored on IPFS before it can be used
              in access control conditions. The IPFS CID is used as the{" "}
              <code>contractAddress</code> property when defining your Access
              Control Conditions.
            </>
          }
          variant="note"
          style={{ marginBottom: "16px" }}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Example Use Cases</h2>

        <p style={pageStyles.p}>
          The following are some pseudo code examples of how you can use Lit
          Actions to create custom control conditions:
        </p>

        {(() => {
          const useCases = [
            {
              title: "Weather-Gated Content",
              description:
                "Decrypt content only when weather conditions are met",
              example: `// Weather API check
const temp = await fetch("https://api.weather.gov/...")
  .then(res => res.json());
const result = temp.temperature < parseInt(maxTemp);
return LitActions.setResponse({ response: result.toString() });`,
            },
            {
              title: "Time-Based Access Control",
              description:
                "Restrict access to business hours with timezone support",
              example: `// Business hours check with timezone
const now = new Date();
const timeInZone = new Date(now.toLocaleString("en-US", { timeZone }));
const currentHour = timeInZone.getHours();
const currentDay = timeInZone.getDay();

const isWeekday = currentDay >= 1 && currentDay <= 5;
const isBusinessHour = currentHour >= 9 && currentHour < 17;

return LitActions.setResponse({ response: isWeekday && isBusinessHour });`,
            },
            {
              title: "Subscription Validation",
              description:
                "Verify premium subscription status via external API",
              example: `// Check subscription status with external service
const response = await fetch(\`https://api.service.com/users/\${userId}\`);
const data = await response.json();

const now = new Date();
const expiryDate = new Date(data.expiresAt);

if (data.status === 'active' && expiryDate > now) {
  return LitActions.setResponse({ response: data.tier }); // "basic", "premium", "enterprise"
} else {
  return LitActions.setResponse({ response: "expired" });
}`,
            },
            {
              title: "Reputation Scoring",
              description:
                "Calculate user reputation from multiple web2 sources",
              example: `// Multi-source reputation calculation
const githubScore = githubData.contributions_count || 0;
const twitterScore = twitterData.followers_count || 0;
const lensScore = lensData.totalFollowers || 0;

const totalScore = (githubScore * 0.4) + (twitterScore * 0.3) + (lensScore * 0.3);

if (totalScore >= threshold) {
  return LitActions.setResponse({ response: "qualified" });
} else {
  return LitActions.setResponse({ response: "insufficient" });
}`,
            },
          ];

          const cardStyle = {
            padding: "20px",
            backgroundColor: "#fff",
            borderRadius: "8px",
            border: "1px solid #007bff",
            marginBottom: "20px",
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box" as const,
            overflow: "hidden",
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
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
              }}
            >
              {useCases.map((useCase, index) => (
                <div key={index} style={cardStyle}>
                  <h3 style={titleStyle}>{useCase.title}</h3>
                  <p style={descriptionStyle}>{useCase.description}</p>

                  <h4 style={{ margin: "16px 0 8px 0", color: "#374151" }}>
                    Example Lit Action Logic:
                  </h4>
                  <DisplayCode
                    code={useCase.example}
                    language="javascript"
                    theme="dracula"
                    style={{ margin: 0, overflow: "auto" }}
                  />
                </div>
              ))}
            </div>
          );
        })()}
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Supported Comparison Operators</h2>

        <p style={pageStyles.p}>
          Lit Action conditions support four string comparison operators for
          evaluating the return value of your Lit Action against your expected
          result:
        </p>

        {(() => {
          const operators = [
            {
              operator: "=",
              title: "Exact String Match",
              description:
                "Returns true when the Lit Action result exactly matches the expected value",
            },
            {
              operator: "!=",
              title: "Not Equal To String",
              description:
                "Returns true when the Lit Action result does NOT match the expected value",
            },
            {
              operator: "contains",
              title: "String Contains Substring",
              description:
                "Returns true when the Lit Action result contains the expected substring",
            },
            {
              operator: "!contains",
              title: "String Does Not Contain Substring",
              description:
                "Returns true when the Lit Action result does NOT contain the expected substring",
            },
          ];

          const cardStyle = {
            padding: "20px",
            backgroundColor: "#fff",
            borderRadius: "8px",
            border: "1px solid #007bff",
            marginBottom: "20px",
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box" as const,
            overflow: "hidden",
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

          const operatorStyle = {
            display: "inline-block",
            padding: "4px 8px",
            backgroundColor: "#f8f9fa",
            border: "1px solid #dee2e6",
            borderRadius: "4px",
            fontFamily: "monospace",
            fontSize: "1.1rem",
            fontWeight: "bold",
            color: "#495057",
            marginRight: "12px",
          };

          return (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
              }}
            >
              {operators.map((op, index) => (
                <div key={index} style={cardStyle}>
                  <h3 style={titleStyle}>
                    <span style={operatorStyle}>{op.operator}</span>
                    {op.title}
                  </h3>
                  <p style={descriptionStyle}>{op.description}</p>
                </div>
              ))}
            </div>
          );
        })()}

        <NoteCallout
          title="String-Only Comparisons"
          message={
            <>
              <p style={pageStyles.p}>
                All Lit Action return values are treated as strings for
                comparison purposes. Even if your Lit Action returns a boolean (
                <code>true</code>) or number (<code>42</code>), it will be
                converted to the strings (<code>"true"</code> or{" "}
                <code>"42"</code>) for comparison against your expected value.
              </p>
            </>
          }
          variant="note"
          style={{ marginBottom: "16px" }}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Interactive Examples</h2>
        <p style={pageStyles.p}>
          Select an example to explore different Lit Action patterns:
        </p>

        {/* Example Selection */}
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}
          >
            Choose an example:
          </label>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {Object.entries(examples).map(([key, example]) => (
              <button
                key={key}
                onClick={() => loadExample(key)}
                style={{
                  padding: "8px 15px",
                  backgroundColor:
                    selectedExample === key ? "#007bff" : "#f8f9fa",
                  color: selectedExample === key ? "white" : "#333",
                  border: "1px solid #dee2e6",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                {example.title}
              </button>
            ))}
          </div>
        </div>

        <NoteCallout
          title="Parameter Format"
          message={
            <>
              All parameters passed to your Lit Action must be strings. If you
              need to work with numbers or objects in your Lit Action, use{" "}
              <code>parseInt()</code>, <code>parseFloat()</code>, and{" "}
              <code>JSON.parse()</code> functions to convert string parameters
              to numbers and objects.
            </>
          }
        />

        <NoteCallout
          title="Static Parameters"
          variant="info"
          message={
            <>
              <p>
                Because the Access Control Conditions are hashed and used in the
                process of creating the encryption metadata used to decrypt, the{" "}
                <code>parameters</code> you define in your Access Control
                Conditions <strong>must be static</strong>.
              </p>
              <p>
                If you require dynamic information, you must fetch it from
                inside the Lit Action whether that be from a web2 API or from a
                web3 source.
              </p>
            </>
          }
        />

        {/* Selected Example Display */}
        {selectedExample &&
          examples[selectedExample as keyof typeof examples] && (
            <div>
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  color: "#374151",
                  marginTop: "24px",
                  marginBottom: "12px",
                }}
              >
                {examples[selectedExample as keyof typeof examples]?.title}
              </h3>
              <p style={pageStyles.p}>
                {
                  examples[selectedExample as keyof typeof examples]
                    ?.description
                }
              </p>

              {/* Lit Action Code */}
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#374151" }}>
                  Lit Action Code (JavaScript):
                </h4>
                <DisplayCode
                  code={
                    examples[selectedExample as keyof typeof examples]
                      ?.litActionCode || ""
                  }
                  language="javascript"
                  theme="dracula"
                  style={{ marginBottom: "16px" }}
                />
                <p
                  style={{
                    fontSize: "14px",
                    color: "#6b7280",
                    margin: "8px 0",
                  }}
                >
                  This code would be stored on IPFS and referenced by its CID in
                  the access control condition.
                </p>
              </div>

              {/* Access Control Condition Builder */}
              <DisplayCode
                code={getDynamicBuilderCode()}
                language="javascript"
                renderComponent={
                  <>
                    {/* IPFS CID Input */}
                    <div style={{ marginBottom: "20px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: "500",
                        }}
                      >
                        IPFS CID:
                      </label>
                      <input
                        type="text"
                        placeholder="QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx"
                        value={ipfsCid}
                        onChange={(e) => setIpfsCid(e.target.value)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "4px",
                          border: "1px solid #d1d5db",
                          fontSize: "14px",
                          width: "100%",
                          fontFamily: "monospace",
                        }}
                      />
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "#6b7280",
                          margin: "5px 0 0 0",
                        }}
                      >
                        The IPFS CID where your Lit Action code is stored
                      </p>
                    </div>

                    {/* Method Name Input */}
                    <div style={{ marginBottom: "20px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: "500",
                        }}
                      >
                        Method Name:
                      </label>
                      <input
                        type="text"
                        placeholder="go"
                        value={methodName}
                        onChange={(e) => setMethodName(e.target.value)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "4px",
                          border: "1px solid #d1d5db",
                          fontSize: "14px",
                          width: "100%",
                          fontFamily: "monospace",
                        }}
                      />
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "#6b7280",
                          margin: "5px 0 0 0",
                        }}
                      >
                        The function name to call in your Lit Action
                      </p>
                    </div>

                    {/* Parameters Input */}
                    <div style={{ marginBottom: "20px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: "500",
                        }}
                      >
                        Parameters (JSON Array):
                      </label>
                      <input
                        type="text"
                        placeholder='["40", "param2"]'
                        value={parameters}
                        onChange={(e) => setParameters(e.target.value)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "4px",
                          border: "1px solid #d1d5db",
                          fontSize: "14px",
                          width: "100%",
                          fontFamily: "monospace",
                        }}
                      />
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "#6b7280",
                          margin: "5px 0 0 0",
                        }}
                      >
                        Parameters to pass to your function (must be valid JSON
                        array)
                      </p>
                    </div>

                    {/* Comparison Operator */}
                    <div style={{ marginBottom: "20px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: "500",
                        }}
                      >
                        Comparison Operator:
                      </label>
                      <select
                        value={comparator}
                        onChange={(e) => setComparator(e.target.value)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "4px",
                          border: "1px solid #d1d5db",
                          fontSize: "14px",
                          width: "100%",
                        }}
                      >
                        <option value="=">=</option>
                        <option value="!=">!=</option>
                        <option value="contains">contains</option>
                        <option value="!contains">!contains</option>
                      </select>
                    </div>

                    {/* Expected Value */}
                    <div style={{ marginBottom: "20px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: "500",
                        }}
                      >
                        Expected Value:
                      </label>
                      <input
                        type="text"
                        placeholder="true"
                        value={expectedValue}
                        onChange={(e) => setExpectedValue(e.target.value)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "4px",
                          border: "1px solid #d1d5db",
                          fontSize: "14px",
                          width: "100%",
                          fontFamily: "monospace",
                        }}
                      />
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "#6b7280",
                          margin: "5px 0 0 0",
                        }}
                      >
                        The value your Lit Action should return to grant access
                      </p>
                    </div>

                    <button
                      onClick={buildConditions}
                      disabled={!ipfsCid.trim() || !methodName.trim()}
                      style={{
                        padding: "10px 15px",
                        backgroundColor:
                          !ipfsCid.trim() || !methodName.trim()
                            ? "#6b7280"
                            : "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor:
                          !ipfsCid.trim() || !methodName.trim()
                            ? "not-allowed"
                            : "pointer",
                        fontWeight: "500",
                        width: "100%",
                      }}
                    >
                      Build Conditions
                    </button>
                  </>
                }
                resultData={builtConditions}
                resultLabel="Built Access Control Conditions"
                useSideBySide={true}
                theme="dracula"
                isSuccess={Boolean(
                  builtConditions && !("error" in builtConditions)
                )}
              />
            </div>
          )}
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default LitAction;
