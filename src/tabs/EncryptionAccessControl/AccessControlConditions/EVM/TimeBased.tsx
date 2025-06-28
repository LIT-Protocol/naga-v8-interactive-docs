import React, { useState } from "react";
import { createAccBuilder } from "@lit-protocol/access-control-conditions";
import { DisplayCode } from "../../../../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../../../../components/layout/GreyboardWhiteBgContainer";
import { pageStyles } from "../../../../styles/pageStyles";
import { NoteCallout } from "../../../../components/common";
import { Link } from "react-router-dom";
import EVMChainsSelector from "../../../../components/EVMChainsSelector";

interface EVMChain {
  name: string;
  chainId: number | string;
  symbol: string;
  decimals: number;
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  vmType?: string;
  nativeCurrency?: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

const TimeBased: React.FC = () => {
  const [selectedExample, setSelectedExample] = useState<string>("after-date");
  const [selectedChain, setSelectedChain] = useState<string>("ethereum");
  const [selectedChainInfo, setSelectedChainInfo] = useState<EVMChain | null>(
    null
  );
  const [includeWalletOwnership, setIncludeWalletOwnership] =
    useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 16) // Format: YYYY-MM-DDTHH:MM
  );
  const [customTimestamp, setCustomTimestamp] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().slice(0, 16) // Format: YYYY-MM-DDTHH:MM
  );
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16) // Format: YYYY-MM-DDTHH:MM
  );
  const [builtConditions, setBuiltConditions] = useState<
    unknown[] | { error: string } | null
  >(null);

  const handleChainSelect = (chainKey: string, chainInfo: EVMChain) => {
    setSelectedChain(chainKey);
    setSelectedChainInfo(chainInfo);
  };

  // Convert date to Unix timestamp
  const dateToTimestamp = (date: string): string => {
    return Math.floor(new Date(date).getTime() / 1000).toString();
  };

  // Convert timestamp to readable date
  const timestampToDate = (timestamp: string): string => {
    try {
      const date = new Date(parseInt(timestamp) * 1000);
      const localTime = date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      const utcTime = date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "UTC",
      });

      return `${localTime} (${utcTime} UTC)`;
    } catch {
      return "Invalid timestamp";
    }
  };

  // Get timezone info for display (used once per section)
  const getTimezoneInfo = (): string => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezone;
  };

  // Example templates for different time-based scenarios
  const getExamples = (
    chainKey: string,
    includeWallet: boolean,
    address: string,
    date: string,
    customTs: string,
    startDt: string,
    endDt: string
  ) => {
    const walletOwnershipSection = includeWallet
      ? `.requireWalletOwnership('${address}')
  .on('ethereum')
  .and()
  `
      : "";

    const timeOwnershipDescription = includeWallet
      ? ` AND meet the time requirement`
      : "";

    const combinedDescription = includeWallet
      ? `Require wallet ownership${timeOwnershipDescription}`
      : `Meet the time requirement`;

    const timestamp = customTs || dateToTimestamp(date);
    const startTimestamp = dateToTimestamp(startDt);
    const endTimestamp = dateToTimestamp(endDt);

    return {
      "after-date": {
        title: `Access After Specific Date`,
        description: `${combinedDescription}: access granted after ${timestampToDate(
          timestamp
        )}`,
        builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  ${walletOwnershipSection}.requireTimestamp('${timestamp}', '>=')
  .on('${chainKey}')
  .build();`,
        timestamp,
        timeDescription: `Access starts (${getTimezoneInfo()}): ${timestampToDate(
          timestamp
        )}`,
      },
      "before-date": {
        title: `Access Before Specific Date`,
        description: `${combinedDescription}: access expires after ${timestampToDate(
          timestamp
        )}`,
        builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  ${walletOwnershipSection}.requireTimestamp('${timestamp}', '<')
  .on('${chainKey}')
  .build();`,
        timestamp,
        timeDescription: `Access expires (${getTimezoneInfo()}): ${timestampToDate(
          timestamp
        )}`,
      },
      "between-dates": {
        title: `Access Between Dates`,
        description: `${combinedDescription}: access granted between ${timestampToDate(
          startTimestamp
        )} and ${timestampToDate(endTimestamp)}`,
        builderCode: `import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const accs = createAccBuilder()
  ${walletOwnershipSection}.requireTimestamp('${startTimestamp}', '>=')
  .and()
  .requireTimestamp('${endTimestamp}', '<=')
  .on('${chainKey}')
  .build();`,
        startTimestamp,
        endTimestamp,
        timeDescription: `Access window (${getTimezoneInfo()}): ${timestampToDate(
          startTimestamp
        )} → ${timestampToDate(endTimestamp)}`,
      },
    };
  };

  const examples = getExamples(
    selectedChain,
    includeWalletOwnership,
    walletAddress,
    selectedDate,
    customTimestamp,
    startDate,
    endDate
  );

  const buildConditions = () => {
    try {
      const example = examples[selectedExample as keyof typeof examples];
      if (!example) return;

      let builder = createAccBuilder();

      // Add wallet ownership requirement if enabled
      if (includeWalletOwnership) {
        builder = builder
          .requireWalletOwnership(walletAddress)
          .on("ethereum" as any)
          .and();
      }

      // Add timestamp requirement based on selected example
      if (selectedExample === "after-date") {
        const timestamp = customTimestamp || dateToTimestamp(selectedDate);
        builder = builder
          .requireTimestamp(timestamp, ">=")
          .on(selectedChain as any);
      } else if (selectedExample === "before-date") {
        const timestamp = customTimestamp || dateToTimestamp(selectedDate);
        builder = builder
          .requireTimestamp(timestamp, "<")
          .on(selectedChain as any);
      } else if (selectedExample === "between-dates") {
        const startTimestamp = dateToTimestamp(startDate);
        const endTimestamp = dateToTimestamp(endDate);
        builder = builder
          .requireTimestamp(startTimestamp, ">=")
          .on(selectedChain as any)
          .and()
          .requireTimestamp(endTimestamp, "<=")
          .on(selectedChain as any);
      }

      const conditions = builder.build();
      setBuiltConditions(conditions);
    } catch (error) {
      console.error("Error building conditions:", error);
      setBuiltConditions({ error: (error as Error).message });
    }
  };

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>Time-Based Access Control Conditions</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Introduction</h2>
        <p style={pageStyles.p}>
          The <code>requireTimestamp()</code> access control condition lets you
          restrict access based on time. It’s useful for unlocking content after
          a certain date, enforcing expiration deadlines, or limiting access to
          a specific time window. Timestamps must be provided in Unix format
          (seconds since January 1, 1970).
        </p>
        <p style={pageStyles.p}>
          Under the hood, it compares the current block timestamp on any{" "}
          <Link
            to="/encryption/access-control/evm/supported-chains"
            style={{ color: "#007bff", textDecoration: "underline" }}
          >
            supported EVM-based chain
          </Link>{" "}
          against the target timestamp you specify.
        </p>
        <p style={pageStyles.p}>
          In the examples below, you’ll see how to use{" "}
          <code>requireTimestamp()</code> to create flexible time-based rules to
          limit access after a specific date, before a cutoff, or within a
          defined time window using{" "}
          <Link
            to="/encryption/access-control/boolean-logic"
            style={{ color: "#007bff", textDecoration: "underline" }}
          >
            Boolean Logic
          </Link>
          .
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Time-Based Access Scenarios</h2>

        <p style={pageStyles.p}>
          Time-based access conditions can be configured in several ways
          depending on your needs:
        </p>

        {(() => {
          const scenarios = [
            {
              title: "Access After Date",
              description:
                "Grant access only after a specific timestamp (future unlock)",
              example: ".requireTimestamp('1640995200', '>=')",
            },
            {
              title: "Access Before Date",
              description:
                "Grant access only before a specific timestamp (expiring access)",
              example: ".requireTimestamp('1640995200', '<')",
            },
            {
              title: "Access Between Dates",
              description: "Grant access only within a specific time window",
              example:
                ".requireTimestamp('1640995200', '>=')\n// Combined with additional conditions for upper bound",
            },
            {
              title: "Multiple Time Windows",
              description: "Combine multiple time conditions with OR logic",
              example: `.requireTimestamp('1640995200', '>=')
.or()
.requireTimestamp('1672531200', '>=')`,
            },
          ];

          const cardStyle = {
            padding: "15px",
            backgroundColor: "#fff",
            borderRadius: "8px",
            border: "1px solid #007bff",
          };

          const titleStyle = {
            margin: "0 0 8px 0",
            color: "#0c4a6e",
          };

          const descriptionStyle = {
            margin: "0 0 8px 0",
            fontSize: "0.9rem",
            color: "#0c4a6e",
          };

          return (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "15px",
                marginBottom: "20px",
              }}
            >
              {scenarios.map((scenario, index) => (
                <div key={index} style={cardStyle}>
                  <h4 style={titleStyle}>{scenario.title}</h4>
                  <p style={descriptionStyle}>{scenario.description}</p>
                  <DisplayCode
                    code={scenario.example}
                    language="typescript"
                    theme="dracula"
                    style={{ marginTop: "8px" }}
                  />
                </div>
              ))}
            </div>
          );
        })()}
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Interactive Examples</h2>
        <p style={pageStyles.p}>
          Select a chain, configure your date & time requirements, and choose a
          time-based scenario to explore timestamp conditions:
        </p>

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
                {examples[selectedExample as keyof typeof examples]?.title ||
                  ""}
              </h3>
              <p style={pageStyles.p}>
                {examples[selectedExample as keyof typeof examples]
                  ?.description || ""}
              </p>

              {/* Time Description */}
              {examples[selectedExample as keyof typeof examples]
                ?.timeDescription && (
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#e0f2fe",
                    borderRadius: "6px",
                    border: "1px solid #0277bd",
                    marginBottom: "20px",
                    fontSize: "0.9rem",
                    fontWeight: "500",
                    color: "#01579b",
                  }}
                >
                  ⏰{" "}
                  {
                    examples[selectedExample as keyof typeof examples]
                      ?.timeDescription
                  }
                </div>
              )}

              {/* Builder Code */}
              <DisplayCode
                code={
                  examples[selectedExample as keyof typeof examples]
                    ?.builderCode || ""
                }
                language="typescript"
                renderComponent={
                  <>
                    {/* Wallet Ownership Toggle */}
                    <div style={{ marginBottom: "20px" }}>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                          fontWeight: "500",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={includeWalletOwnership}
                          onChange={(e) =>
                            setIncludeWalletOwnership(e.target.checked)
                          }
                          style={{
                            marginRight: "8px",
                            transform: "scale(1.2)",
                          }}
                        />
                        Include Wallet Ownership Requirement
                      </label>
                      <p
                        style={{
                          fontSize: "0.9rem",
                          color: "#6b7280",
                          margin: "5px 0 0 25px",
                        }}
                      >
                        When enabled, adds a wallet ownership check using .and()
                        operator
                      </p>
                    </div>

                    {/* ACC Builder Syntax Callout */}
                    {includeWalletOwnership && (
                      <NoteCallout
                        title="Chaining Requires .on(chain)"
                        message={
                          <>
                            <p style={pageStyles.p}>
                              When enabling the wallet ownership requirement,
                              you must include <code>.on(chain)</code> after the
                              wallet ownership check to enable chaining with
                              <code>.and()</code>, however, the chain specified
                              by <code>.on(chain)</code> has no affect on the
                              validation process and should always be set to{" "}
                              <code>ethereum</code>.
                            </p>
                          </>
                        }
                        variant="note"
                        style={{ marginBottom: "20px" }}
                      />
                    )}

                    {/* Wallet Address Input */}
                    {includeWalletOwnership && (
                      <div style={{ marginBottom: "20px" }}>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "8px",
                            fontWeight: "500",
                          }}
                        >
                          Wallet Address:
                        </label>
                        <input
                          type="text"
                          placeholder="Enter wallet address (0x...)"
                          value={walletAddress}
                          onChange={(e) => setWalletAddress(e.target.value)}
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
                          Required when wallet ownership is enabled
                        </p>
                      </div>
                    )}

                    {/* Time Scenario Selector */}
                    <div style={{ marginBottom: "20px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: "500",
                        }}
                      >
                        Choose a time-based scenario:
                      </label>
                      <select
                        value={selectedExample}
                        onChange={(e) => setSelectedExample(e.target.value)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "4px",
                          border: "1px solid #d1d5db",
                          fontSize: "14px",
                          width: "100%",
                        }}
                      >
                        {Object.entries(examples).map(([key, example]) => (
                          <option key={key} value={key}>
                            {example?.title || ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Date/Timestamp Inputs based on scenario */}
                    {(selectedExample === "after-date" ||
                      selectedExample === "before-date") && (
                      <>
                        <div style={{ marginBottom: "20px" }}>
                          <label
                            style={{
                              display: "block",
                              marginBottom: "8px",
                              fontWeight: "500",
                            }}
                          >
                            Select Date & Time:
                          </label>
                          <input
                            type="datetime-local"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            style={{
                              padding: "8px 12px",
                              borderRadius: "4px",
                              border: "1px solid #d1d5db",
                              fontSize: "14px",
                              width: "100%",
                            }}
                          />
                          <p
                            style={{
                              fontSize: "0.8rem",
                              color: "#6b7280",
                              margin: "5px 0 0 0",
                            }}
                          >
                            Unix Timestamp: {dateToTimestamp(selectedDate)} (
                            {timestampToDate(dateToTimestamp(selectedDate))})
                          </p>
                        </div>

                        <div style={{ marginBottom: "20px" }}>
                          <label
                            style={{
                              display: "block",
                              marginBottom: "8px",
                              fontWeight: "500",
                            }}
                          >
                            Or Enter Custom Timestamp:
                          </label>
                          <input
                            type="text"
                            placeholder="Enter Unix timestamp (optional)"
                            value={customTimestamp}
                            onChange={(e) => setCustomTimestamp(e.target.value)}
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
                            {customTimestamp
                              ? `Date: ${timestampToDate(customTimestamp)}`
                              : "Leave empty to use the selected date above"}
                          </p>
                        </div>
                      </>
                    )}

                    {/* Between Dates Inputs */}
                    {selectedExample === "between-dates" && (
                      <>
                        <div style={{ marginBottom: "20px" }}>
                          <label
                            style={{
                              display: "block",
                              marginBottom: "8px",
                              fontWeight: "500",
                            }}
                          >
                            Start Date & Time:
                          </label>
                          <input
                            type="datetime-local"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={{
                              padding: "8px 12px",
                              borderRadius: "4px",
                              border: "1px solid #d1d5db",
                              fontSize: "14px",
                              width: "100%",
                            }}
                          />
                          <p
                            style={{
                              fontSize: "0.8rem",
                              color: "#6b7280",
                              margin: "5px 0 0 0",
                            }}
                          >
                            Unix Timestamp: {dateToTimestamp(startDate)} (
                            {timestampToDate(dateToTimestamp(startDate))})
                          </p>
                        </div>

                        <div style={{ marginBottom: "20px" }}>
                          <label
                            style={{
                              display: "block",
                              marginBottom: "8px",
                              fontWeight: "500",
                            }}
                          >
                            End Date & Time:
                          </label>
                          <input
                            type="datetime-local"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            style={{
                              padding: "8px 12px",
                              borderRadius: "4px",
                              border: "1px solid #d1d5db",
                              fontSize: "14px",
                              width: "100%",
                            }}
                          />
                          <p
                            style={{
                              fontSize: "0.8rem",
                              color: "#6b7280",
                              margin: "5px 0 0 0",
                            }}
                          >
                            Unix Timestamp: {dateToTimestamp(endDate)} (
                            {timestampToDate(dateToTimestamp(endDate))})
                          </p>
                        </div>
                      </>
                    )}

                    {/* Chain Selector */}
                    <div style={{ marginBottom: "20px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: "500",
                        }}
                      >
                        Select Chain:
                      </label>
                      <EVMChainsSelector
                        variant="compact"
                        showSearch={true}
                        onChainSelect={handleChainSelect}
                        selectedChain={selectedChain}
                      />
                      {selectedChainInfo && (
                        <div
                          style={{
                            marginTop: "10px",
                            padding: "10px",
                            backgroundColor: "#f0f9ff",
                            borderRadius: "6px",
                            border: "1px solid #007bff",
                            fontSize: "0.9rem",
                          }}
                        >
                          <strong>{selectedChainInfo.name}</strong> •{" "}
                          {selectedChainInfo.symbol} • Chain ID:{" "}
                          {selectedChainInfo.chainId}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={buildConditions}
                      disabled={
                        (includeWalletOwnership && !walletAddress.trim()) ||
                        (selectedExample === "between-dates" &&
                          new Date(startDate) >= new Date(endDate))
                      }
                      style={{
                        padding: "10px 15px",
                        backgroundColor:
                          (includeWalletOwnership && !walletAddress.trim()) ||
                          (selectedExample === "between-dates" &&
                            new Date(startDate) >= new Date(endDate))
                            ? "#6b7280"
                            : "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor:
                          (includeWalletOwnership && !walletAddress.trim()) ||
                          (selectedExample === "between-dates" &&
                            new Date(startDate) >= new Date(endDate))
                            ? "not-allowed"
                            : "pointer",
                        fontWeight: "500",
                        width: "100%",
                      }}
                    >
                      Build Conditions
                    </button>

                    {/* Validation Messages */}
                    {selectedExample === "between-dates" &&
                      new Date(startDate) >= new Date(endDate) && (
                        <p
                          style={{
                            color: "#dc2626",
                            fontSize: "0.8rem",
                            marginTop: "5px",
                            fontWeight: "500",
                          }}
                        >
                          ⚠️ Start date & time must be before end date & time
                        </p>
                      )}
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

export default TimeBased;
