/**
 * LitActionExecution.tsx
 *
 * A beginner-friendly guide to executing Lit Actions with Lit Protocol.
 * Part of the "Making Your First Request" tutorial series.
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import GreyBoarderWhiteBgContainer from "../../../components/layout/GreyboardWhiteBgContainer";
import { DisplayCode } from "../../../components/DisplayCode";
import { RequiredPackages } from "../../../components/common";
import AccountMethodSelector, {
  AccountMethod,
  CREATE_ACCOUNT_PRIVATE_KEY_CODE,
  CREATE_ACCOUNT_WALLET_CLIENT_CODE,
} from "../../../components/common/AccountMethodSelector";
import { pageStyles } from "../../../styles/pageStyles";
import { useAppContext } from "../../../router";

const LitActionExecution: React.FC = () => {
  const { areDependenciesLoaded, assertDependenciesLoaded, showError } =
    useAppContext();

  // State for user account
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userAccount, setUserAccount] = useState<any>(null);
  const [accountMethod, setAccountMethod] =
    useState<AccountMethod>("walletClient");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [authData, setAuthData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [authContext, setAuthContext] = useState<any>(null);

  // State for Lit Action execution
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [actionResult, setActionResult] = useState<any>(null);

  // State for loading states
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isCreatingAuthContext, setIsCreatingAuthContext] = useState(false);
  const [isExecutingAction, setIsExecutingAction] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);

  // Success feedback state
  const [successActions, setSuccessActions] = useState<Set<string>>(new Set());

  // Function to show success feedback
  const showSuccess = (actionId: string) => {
    setSuccessActions((prev) => new Set([...prev, actionId]));
    setTimeout(() => {
      setSuccessActions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(actionId);
        return newSet;
      });
    }, 3000);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAccountCreated = (account: any) => {
    setUserAccount(account);
    setCurrentStep(2);
  };

  const authenticateUser = async () => {
    if (!userAccount) {
      showError?.("Please create a user account first");
      return;
    }

    setIsAuthenticating(true);
    try {
      let authData;
      if (accountMethod === "privateKey") {
        // Use ViemAccountAuthenticator for private key accounts
        const { ViemAccountAuthenticator } = await import("@lit-protocol/auth");
        authData = await ViemAccountAuthenticator.authenticate(userAccount);
      } else {
        // Use WalletClientAuthenticator for connected wallet accounts
        const { WalletClientAuthenticator } = await import(
          "@lit-protocol/auth"
        );
        authData = await WalletClientAuthenticator.authenticate(userAccount);
      }

      setAuthData(authData);
      setCurrentStep(3);
    } catch (error) {
      showError?.(`Failed to authenticate: ${error}`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const createAuthContext = async () => {
    if (!userAccount || !authData) {
      showError?.("Please complete previous steps first");
      return;
    }

    if (!areDependenciesLoaded()) {
      showError?.("Please complete the prerequisites first");
      return;
    }

    setIsCreatingAuthContext(true);
    try {
      const { authManager, litClient } = assertDependenciesLoaded();

      const authContext = await authManager.createEoaAuthContext({
        config: {
          account: userAccount,
        },
        authConfig: {
          domain: window.location.host,
          statement: "Execute Lit Action with Lit Protocol",
          expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
          resources: [["lit-action-execution", "*"]],
        },
        litClient,
      });

      setAuthContext(authContext);
      setCurrentStep(4);
    } catch (error) {
      showError?.(`Failed to create authentication context: ${error}`);
    } finally {
      setIsCreatingAuthContext(false);
    }
  };

  const executeLitAction = async () => {
    if (!authContext) {
      showError?.("Please complete all previous steps first");
      return;
    }

    if (!areDependenciesLoaded()) {
      showError?.("Please complete the prerequisites first");
      return;
    }

    setIsExecutingAction(true);
    try {
      const { litClient } = assertDependenciesLoaded();

      // ETH balance check Lit Action
      const { createAccBuilder } = await import(
        "@lit-protocol/access-control-conditions"
      );

      const _litActionCode = async () => {
        try {
          // Check if the user has at least 0.001 ETH
          const testResult = await Lit.Actions.checkConditions({
            conditions: jsParams.conditions,
            authSig: jsParams.authSig,
            chain: "ethereum",
          });

          if (!testResult) {
            return Lit.Actions.setResponse({
              response:
                "❌ Access denied: You need at least 0.001 ETH to proceed",
            });
          }

          return Lit.Actions.setResponse({
            response: "✅ Access granted! You have sufficient ETH balance",
          });
        } catch (error) {
          const err = error as Error;
          Lit.Actions.setResponse({
            response: `Error: ${err.message}`,
          });
        }
      };

      const litActionCode = `(${_litActionCode.toString()})();`;

      const jsParams = {
        conditions: createAccBuilder()
          .requireEthBalance("1000000000000000", ">=") // 0.001 ETH
          .on("sepolia")
          .build(),
        authSig: authContext.authSig,
      };

      console.log("Executing Lit Action:", litActionCode);

      const result = await litClient.executeJs({
        code: litActionCode,
        authContext: authContext,
        jsParams: jsParams,
      });

      setActionResult(result);
    } catch (error) {
      showError?.(`Failed to execute Lit Action: ${error}`);
    } finally {
      setIsExecutingAction(false);
    }
  };

  const accountCode =
    accountMethod === "privateKey"
      ? CREATE_ACCOUNT_PRIVATE_KEY_CODE
      : CREATE_ACCOUNT_WALLET_CLIENT_CODE;

  const authCode =
    accountMethod === "privateKey"
      ? `import { ViemAccountAuthenticator } from "@lit-protocol/auth";

// Authenticate the user account (private key)
const authData = await ViemAccountAuthenticator.authenticate(userAccount);`
      : `import { WalletClientAuthenticator } from "@lit-protocol/auth";

// Authenticate the user account (wallet client)
const authData = await WalletClientAuthenticator.authenticate(walletClient);`;

  const authContextCode = `// Create authentication context for Lit Action execution
const authContext = await authManager.createEoaAuthContext({
  config: {
    account: userAccount,
  },
  authConfig: {
    domain: window.location.host,
    statement: 'Execute Lit Action with Lit Protocol',
    expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    resources: [
      ['lit-action-execution', '*'],
    ],
  },
  litClient,
});`;

  const getActionCode = () => {
    return `import { createAccBuilder } from "@lit-protocol/access-control-conditions";

// Lit Action code for ETH balance check
const _litActionCode = async () => {
  try {
    // Check if user has at least 0.001 ETH
    const testResult = await Lit.Actions.checkConditions({
      conditions: jsParams.conditions,
      authSig: jsParams.authSig,
      chain: "ethereum",
    });

    if (!testResult) {
      return LitActions.setResponse({
        response: "❌ Access denied: You need at least 0.001 ETH"
      });
    }

    return LitActions.setResponse({
      response: "✅ Access granted! Sufficient ETH balance"
    });
  } catch (error) {
    LitActions.setResponse({ response: error.message });
  }
};

const litActionCode = \`(\${_litActionCode.toString()})();\`;

// Execute the Lit Action
const result = await litClient.executeJs({
  code: litActionCode,
  authContext: authContext,
  jsParams: {
    conditions: createAccBuilder()
      .requireEthBalance("1000000000000000", ">=") // 0.001 ETH
      .on("sepolia")
      .build(),
    authSig: authContext.authSig,
  },
});`;
  };

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>Lit Action Execution</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Intro</h2>
        <p style={pageStyles.p}>
          Lit Actions are decentralized JavaScript functions that are executed
          collectively by the nodes in the Lit network. Lit Actions let you
          write custom logic to govern signing and encryption operations,
          interact with on and off-chain data, perform generalized compute, and
          more.
        </p>

        <p style={pageStyles.p}>
          You can learn more about Lit Actions in the{" "}
          <Link
            to="/lit-actions/overview"
            style={{ color: "#3b82f6", textDecoration: "underline" }}
          >
            Lit Actions
          </Link>{" "}
          section, but here's what makes them powerful:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#f8fafc",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              marginBottom: "20px",
            }}
          >
            <h4 style={{ margin: "0 0 12px 0", color: "#1f2937" }}>
              ⚙️ JavaScript-Based
            </h4>
            <p
              style={{
                margin: "0",
                fontSize: "0.9rem",
                lineHeight: "1.5",
                color: "#4b5563",
              }}
            >
              Lit Actions are written in JavaScript and can import third-party
              libraries. They run in a secure Deno environment with access to
              built-in Lit SDK functions for signing, encryption, and external
              API calls.
            </p>
          </div>

          <div
            style={{
              backgroundColor: "#f8fafc",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              marginBottom: "20px",
            }}
          >
            <h4 style={{ margin: "0 0 12px 0", color: "#1f2937" }}>
              🛡️ Confidential Execution
            </h4>
            <p
              style={{
                margin: "0",
                fontSize: "0.9rem",
                lineHeight: "1.5",
                color: "#4b5563",
              }}
            >
              All Lit Actions execute within Trusted Execution Environments
              (TEEs) on each Lit node, ensuring your code and data remain
              confidential and protected from external access, even from node
              operators.
            </p>
          </div>

          <div
            style={{
              backgroundColor: "#f8fafc",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              marginBottom: "20px",
            }}
          >
            <h4 style={{ margin: "0 0 12px 0", color: "#1f2937" }}>
              🌐 Chain & Platform Agnostic
            </h4>
            <p
              style={{
                margin: "0",
                fontSize: "0.9rem",
                lineHeight: "1.5",
                color: "#4b5563",
              }}
            >
              Unlike smart contracts, Lit Actions aren't limited to a single
              chain or environment. They can make HTTP requests, read from
              multiple blockchains, and combine on and off-chain data all within
              a single decentralized execution.
            </p>
          </div>
        </div>

        <p style={pageStyles.p}>
          This results in a powerful compute platform that enables complex
          workflows, cross-chain operations, and programmable access control
          that goes far beyond what traditional smart contracts can achieve.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Prerequisites</h2>
        <p style={pageStyles.p}>
          Before starting with this guide, it's important to understand how to
          connect to the Lit Network and authenticate with it. The guides below
          will walk you through the essential setup steps so you can have a
          solid understanding of the prerequisites for this guide.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "20px",
            marginTop: "24px",
          }}
        >
          {[
            {
              title: "Setup Lit Client",
              description:
                "Configure your connection to the Lit network and learn how to initialize the Lit SDK.",
              path: "/building-with-lit/first-request/prerequisites/setup-lit-client",
              icon: "🌐",
              step: "Step 1",
            },
            {
              title: "Setup Auth Manager",
              description:
                "Configure session storage and management to persist authentication across app sessions.",
              path: "/building-with-lit/first-request/prerequisites/setup-auth-manager",
              icon: "🔐",
              step: "Step 2",
            },
            {
              title: "Creating Auth Context",
              description:
                "Create an Auth Context that defines how users prove their identity to the Lit Network - whether through social login, wallets, or custom logic.",
              path: "/building-with-lit/first-request/prerequisites/creating-auth-context",
              icon: "🪪",
              step: "Step 3",
            },
          ].map((prereq, index) => (
            <div
              key={index}
              style={{
                padding: "24px",
                backgroundColor: "#f8fafc",
                borderRadius: "12px",
                border: "2px solid #e5e7eb",
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <div style={{ fontSize: "2rem" }}>{prereq.icon}</div>
                <div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      color: "#3b82f6",
                      marginBottom: "4px",
                    }}
                  >
                    {prereq.step}
                  </div>
                  <h3
                    style={{
                      margin: "0",
                      fontSize: "1.25rem",
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    {prereq.title}
                  </h3>
                </div>
              </div>
              <p
                style={{
                  fontSize: "0.95rem",
                  color: "#6b7280",
                  margin: "0 0 20px 0",
                  lineHeight: "1.5",
                }}
              >
                {prereq.description}
              </p>
              <Link
                to={prereq.path}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  backgroundColor: "#3b82f6",
                  color: "#ffffff",
                  textDecoration: "none",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  transition: "background-color 0.2s",
                }}
              >
                Start Guide →
              </Link>
            </div>
          ))}
        </div>
      </GreyBoarderWhiteBgContainer>

      <RequiredPackages
        packages={[
          {
            name: "@lit-protocol/auth",
            description:
              "Provides the Auth Manager and authentication methods for creating Auth Contexts.",
          },
          {
            name: "@lit-protocol/lit-client",
            description:
              "The Lit Client needed to communicate with the Lit network and execute Lit Actions.",
          },
          {
            name: "@lit-protocol/access-control-conditions",
            description:
              "Provides utilities for building access control conditions that can be used within Lit Actions.",
          },
          {
            name: "viem",
            description:
              "Modern Ethereum library for building wallets, dApps and other Ethereum powered tools with TypeScript support.",
          },
        ]}
        installationCode="npm install @lit-protocol/auth @lit-protocol/lit-client @lit-protocol/access-control-conditions viem"
      />

      {/* Step 1: Create User Account */}
      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>
          Step 1: Create User Account
          {currentStep >= 2 && (
            <span style={{ color: "green", marginLeft: "10px" }}>✓</span>
          )}
        </h2>
        <p style={pageStyles.p}>
          {accountMethod === "privateKey"
            ? "Convert your private key to a viem account object that can be used to authenticate and execute Lit Actions."
            : "Use your connected wallet account to authenticate and execute Lit Actions."}
        </p>

        <DisplayCode
          code={accountCode}
          language="typescript"
          renderComponent={
            <AccountMethodSelector
              onAccountCreated={handleAccountCreated}
              onMethodChange={setAccountMethod}
              setStatus={() => {}}
              showError={showError}
              showSuccess={showSuccess}
              successActionIds={{
                createAccount: "lit-action-create-account",
                getWalletAccount: "lit-action-get-wallet-account",
              }}
              successActions={successActions}
            />
          }
          resultData={userAccount}
          resultLabel="User Account"
          useSideBySide={true}
          theme="dracula"
          isSuccess={
            successActions.has("lit-action-create-account") ||
            successActions.has("lit-action-get-wallet-account")
          }
        />
      </GreyBoarderWhiteBgContainer>

      {/* Step 2: Authenticate User */}
      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>
          Step 2: Authenticate User
          {currentStep >= 3 && (
            <span style={{ color: "green", marginLeft: "10px" }}>✓</span>
          )}
        </h2>
        <p style={pageStyles.p}>
          Next, we'll authenticate the user account to prove ownership.
        </p>

        <DisplayCode
          code={authCode}
          language="typescript"
          renderComponent={
            <div>
              <button
                onClick={authenticateUser}
                disabled={isAuthenticating || !userAccount}
                style={{
                  padding: "12px 20px",
                  backgroundColor: isAuthenticating
                    ? "#f8fafc"
                    : currentStep >= 3
                    ? "#22c55e"
                    : !userAccount
                    ? "#9ca3af"
                    : "#3b82f6",
                  color: isAuthenticating ? "#374151" : "white",
                  border: isAuthenticating ? "1px solid #d1d5db" : "none",
                  borderRadius: "6px",
                  cursor:
                    isAuthenticating || !userAccount
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: "500",
                  fontSize: "14px",
                }}
              >
                {isAuthenticating
                  ? "Authenticating..."
                  : currentStep >= 3
                  ? "✓ User Authenticated"
                  : "Authenticate User"}
              </button>

              {authData && (
                <div style={{ marginTop: "15px", fontSize: "14px" }}>
                  <strong>✓ Authentication successful</strong>
                </div>
              )}
            </div>
          }
          resultData={authData}
          resultLabel="Authentication Data"
          useSideBySide={true}
          theme="dracula"
          isSuccess={currentStep >= 3}
        />
      </GreyBoarderWhiteBgContainer>

      {/* Step 3: Create Auth Context */}
      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>
          Step 3: Create Auth Context
          {currentStep >= 4 && (
            <span style={{ color: "green", marginLeft: "10px" }}>✓</span>
          )}
        </h2>
        <p style={pageStyles.p}>
          Then we'll create an Auth Context that will be used to execute Lit
          Actions - This context includes the necessary{" "}
          <code>lit-action-execution</code> permissions to permit our Session to
          execute Lit Actions.
        </p>

        <DisplayCode
          code={authContextCode}
          language="typescript"
          renderComponent={
            <div>
              <button
                onClick={createAuthContext}
                disabled={isCreatingAuthContext || !authData}
                style={{
                  padding: "12px 20px",
                  backgroundColor: isCreatingAuthContext
                    ? "#f8fafc"
                    : currentStep >= 4
                    ? "#22c55e"
                    : !authData
                    ? "#9ca3af"
                    : "#3b82f6",
                  color: isCreatingAuthContext ? "#374151" : "white",
                  border: isCreatingAuthContext ? "1px solid #d1d5db" : "none",
                  borderRadius: "6px",
                  cursor:
                    isCreatingAuthContext || !authData
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: "500",
                  fontSize: "14px",
                }}
              >
                {isCreatingAuthContext
                  ? "Creating Auth Context..."
                  : currentStep >= 4
                  ? "✓ Auth Context Created"
                  : "Create Auth Context"}
              </button>

              {authContext && (
                <div style={{ marginTop: "15px", fontSize: "14px" }}>
                  <strong>✓ Auth context created successfully</strong>
                </div>
              )}
            </div>
          }
          resultData={authContext}
          resultLabel="Auth Context"
          useSideBySide={true}
          theme="dracula"
          isSuccess={currentStep >= 4}
        />
      </GreyBoarderWhiteBgContainer>

      {/* Step 4: Execute Lit Action */}
      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>
          Step 4: Execute Lit Action
          {actionResult && (
            <span style={{ color: "green", marginLeft: "10px" }}>✓</span>
          )}
        </h2>
        <p style={pageStyles.p}>
          Now we'll execute a Lit Action that checks if your account has at
          least <code>0.001 ETH</code> on Ethereum Sepolia using Access Control
          Conditions.
        </p>

        <DisplayCode
          code={getActionCode()}
          language="typescript"
          renderComponent={
            <div>
              <button
                onClick={executeLitAction}
                disabled={isExecutingAction || !authContext}
                style={{
                  padding: "12px 20px",
                  backgroundColor: isExecutingAction
                    ? "#f8fafc"
                    : actionResult
                    ? "#22c55e"
                    : !authContext
                    ? "#9ca3af"
                    : "#3b82f6",
                  color: isExecutingAction ? "#374151" : "white",
                  border: isExecutingAction ? "1px solid #d1d5db" : "none",
                  borderRadius: "6px",
                  cursor:
                    isExecutingAction || !authContext
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: "500",
                  fontSize: "14px",
                }}
              >
                {isExecutingAction
                  ? "Executing Lit Action..."
                  : actionResult
                  ? "✓ Lit Action Executed"
                  : "Execute Balance Check Action"}
              </button>

              {actionResult && (
                <div
                  style={{
                    marginTop: "15px",
                    padding: "15px",
                    backgroundColor: "#d1fae5",
                    border: "1px solid #a7f3d0",
                    borderRadius: "5px",
                    fontSize: "14px",
                  }}
                >
                  <strong>🎉 Lit Action Result:</strong>
                  <pre
                    style={{
                      marginTop: "8px",
                      fontSize: "12px",
                      backgroundColor: "#ffffff",
                      padding: "10px",
                      borderRadius: "4px",
                      overflow: "auto",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {typeof actionResult.response === "string"
                      ? actionResult.response
                      : JSON.stringify(actionResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          }
          resultData={actionResult}
          resultLabel="Lit Action Result"
          useSideBySide={true}
          theme="dracula"
          isSuccess={!!actionResult}
        />
      </GreyBoarderWhiteBgContainer>

      {/* Summary */}
      {actionResult && (
        <GreyBoarderWhiteBgContainer>
          <h2 style={pageStyles.h2}>🎉 Congratulations!</h2>
          <p style={pageStyles.p}>
            You've successfully executed a Lit Action on the Lit Network!
          </p>
          <p style={pageStyles.p}>Here's what happened:</p>
          <ol style={pageStyles.ol}>
            <li style={pageStyles.li}>
              Created a user account and authenticated with the Lit network
            </li>
            <li style={pageStyles.li}>
              Created an Auth Context with permissions for Lit Action execution
            </li>
            <li style={pageStyles.li}>
              Executed a Lit Action that checked your ETH balance using access
              control conditions
            </li>
            <li style={pageStyles.li}>
              Received the execution result from the distributed Lit Network
            </li>
          </ol>
        </GreyBoarderWhiteBgContainer>
      )}

      {actionResult && (
        <GreyBoarderWhiteBgContainer>
          <h2 style={pageStyles.h2}>What's Next?</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "16px",
              marginTop: "24px",
            }}
          >
            {[
              {
                title: "Advanced Lit Actions",
                description:
                  "Explore advanced Lit Action capabilities like cross-chain operations, external API calls, and complex workflows in the Lit Actions guides.",
                path: "/lit-actions/overview",
                color: "#f59e0b",
              },
              {
                title: "Programmable Key Pairs (PKPs)",
                description:
                  "Continue learning and explore how to create and manage blockchain accounts with programmable conditions",
                path: "/building-with-lit/first-request/pkp-signing",
                color: "#8b5cf6",
              },
              {
                title: "Encryption & Access Control",
                description:
                  "Learn to encrypt data and create access control conditions that can be used with Lit Actions",
                path: "/building-with-lit/first-request/encryption-and-access-control",
                color: "#3b82f6",
              },
            ].map((next, index) => (
              <div
                key={index}
                style={{
                  padding: "20px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "8px",
                  border: `1px solid ${next.color}30`,
                }}
              >
                <h4
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    color: next.color,
                  }}
                >
                  {next.title}
                </h4>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "#6b7280",
                    margin: "0 0 12px 0",
                    lineHeight: "1.4",
                  }}
                >
                  {next.description}
                </p>
                <Link
                  to={next.path}
                  style={{
                    fontSize: "0.85rem",
                    color: next.color,
                    textDecoration: "underline",
                    fontWeight: "500",
                  }}
                >
                  Explore →
                </Link>
              </div>
            ))}
          </div>
        </GreyBoarderWhiteBgContainer>
      )}
    </div>
  );
};

export default LitActionExecution;
