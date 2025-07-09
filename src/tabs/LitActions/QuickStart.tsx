import { useState } from "react";
import { useWalletClient } from "wagmi";
import AccountMethodSelector, {
  AccountMethod,
  CREATE_ACCOUNT_PRIVATE_KEY_CODE,
  CREATE_ACCOUNT_WALLET_CLIENT_CODE,
} from "../../components/common/AccountMethodSelector";
import { DisplayCode } from "../../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../../components/layout/GreyboardWhiteBgContainer";
import { useAppContext } from "../../router";
import { Link } from "react-router-dom";

// Code snippets for each functionality
const AUTHENTICATE_PRIVATE_KEY_CODE = `
import { ViemAccountAuthenticator } from '@lit-protocol/auth';

const authData = await ViemAccountAuthenticator.authenticate(myAccount);`;

const AUTHENTICATE_WALLET_CLIENT_CODE = `
import { WalletClientAuthenticator } from '@lit-protocol/auth';

const authData = await WalletClientAuthenticator.authenticate(walletClient);`;

const CREATE_LIT_CLIENT_CODE = `
import { createLitClient } from "@lit-protocol/lit-client";
import { nagaDev } from "@lit-protocol/networks";

const litClient = await createLitClient({
  network: nagaDev,
});`;

const CREATE_AUTH_MANAGER_CODE = `
import { createAuthManager, storagePlugins } from "@lit-protocol/auth";

const authManager = createAuthManager({
  storage: storagePlugins.localStorageNode({
    appName: "my-app",
    networkName: import.meta.env.VITE_LIT_NETWORK || "naga-dev",
    storagePath: "./lit-auth-storage",
  }),
});`;

const CREATE_EOA_AUTH_CONTEXT_CODE = `
const eoaAuthContext = await authManager.createEoaAuthContext({
  config: {
    account: myAccount, // Your viem account
  },
  authConfig: {
    statement: 'I authorize the Lit Protocol to execute this Lit Action.',
    resources: [
      ['lit-action-execution', '*'],
      ['pkp-signing', '*'],
      ['access-control-condition-decryption', '*'],
    ],
    capabilityAuthSigs: [],
    expiration: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
  },
  litClient: litClient,
});`;

const getExecuteLitActionCode = (operator: "<" | ">=") => `
import { createAccBuilder } from "@lit-protocol/access-control-conditions";

const _litActionCode = async () => {
  try {
    // Check if the authenticated user meets the conditions
    const testResult = await Lit.Actions.checkConditions({
      conditions: jsParams.conditions,
      authSig: jsParams.authSig,
      chain: "ethereum",
    });

    if (!testResult) {
      return LitActions.setResponse({
        response: "Access denied: ${
          operator === "<" ? "too much" : "insufficient"
        } ETH balance"
      });
    }

    return LitActions.setResponse({
      response: "Access granted"
    });
  } catch (error) {
    LitActions.setResponse({ response: error.message });
  }
};

const litActionCode = \`(\${_litActionCode.toString()})();\`;

const result = await litClient.executeJs({
  code: litActionCode,
  authContext: eoaAuthContext,
  jsParams: {
    conditions: createAccBuilder()
      .requireEthBalance('10000000000000000', '${operator}')
      .on('ethereum')
      .build(),
  },
});

console.log('result:', result);`;

// Operator examples for ETH balance checking
const getOperatorExamples = () => ({
  "less-than": {
    title: "< (Less Than)",
    description: "Check if user has less than 0.01 ETH",
    operator: "<" as const,
  },
  "greater-equal": {
    title: ">= (Greater Than or Equal)",
    description: "Check if user has at least 0.01 ETH",
    operator: ">=" as const,
  },
});

export default function LitActionsQuickStart() {
  const { data: walletClient } = useWalletClient();
  const { getDependencyStatus, setStatus, showError } = useAppContext();

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isCreatingLitClient, setIsCreatingLitClient] = useState(false);
  const [isCreatingAuthManager, setIsCreatingAuthManager] = useState(false);
  const [isCreatingEoaAuthContext, setIsCreatingEoaAuthContext] =
    useState(false);
  const [isExecutingAction, setIsExecutingAction] = useState(false);

  const [accountMethod, setAccountMethod] =
    useState<AccountMethod>("walletClient"); // Default to wallet client
  const [account, setAccount] = useState<any>(null);
  const [authData, setAuthData] = useState<any>(null);
  const [litClient, setLitClient] = useState<unknown>(null);
  const [authManager, setAuthManager] = useState<unknown>(null);
  const [eoaAuthContext, setEoaAuthContext] = useState<unknown>(null);
  const [actionResult, setActionResult] = useState<unknown>(null);
  const [selectedOperator, setSelectedOperator] = useState<
    "less-than" | "greater-equal"
  >("less-than");

  // Success feedback state
  const [successActions, setSuccessActions] = useState<Set<string>>(new Set());

  // Function to show success feedback
  const showSuccess = (actionId: string) => {
    setSuccessActions((prev) => new Set([...prev, actionId]));
    // Auto-clear after 3 seconds
    setTimeout(() => {
      setSuccessActions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(actionId);
        return newSet;
      });
    }, 3000);
  };

  // Utility function to format error messages properly
  const formatErrorMessage = (prefix: string, error: any): string => {
    let errorMessage = prefix;
    if (error?.message) {
      errorMessage += error.message;
    } else if (typeof error === "object") {
      errorMessage += JSON.stringify(error, null, 2);
    } else {
      errorMessage += String(error);
    }
    return errorMessage;
  };

  const authenticate = async () => {
    try {
      setIsAuthenticating(true);
      setStatus("Authenticating with EOA account...");

      if (!account) {
        throw new Error("No account found. Create account first.");
      }

      let authData;
      if (accountMethod === "privateKey") {
        // Use ViemAccountAuthenticator for private key accounts
        const { ViemAccountAuthenticator } = await import("@lit-protocol/auth");
        authData = await ViemAccountAuthenticator.authenticate(account);
      } else {
        // Use WalletClientAuthenticator for connected wallet accounts
        const { WalletClientAuthenticator } = await import(
          "@lit-protocol/auth"
        );
        if (!walletClient) {
          throw new Error(
            "No wallet client available. Please connect your wallet."
          );
        }
        authData = await WalletClientAuthenticator.authenticate(walletClient);
      }

      setAuthData(authData);
      setStatus(
        `Successfully authenticated with EOA account using ${
          accountMethod === "privateKey" ? "private key" : "wallet client"
        }`
      );
      showSuccess("eoa-authenticate");
    } catch (error: any) {
      console.error("Error authenticating with EOA:", error);
      const errorMessage = formatErrorMessage(
        "Failed to authenticate with EOA: ",
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const createLitClient = async () => {
    try {
      setIsCreatingLitClient(true);
      setStatus("Creating Lit Client...");

      const { createLitClient } = await import("@lit-protocol/lit-client");
      const { nagaDev } = await import("@lit-protocol/networks");

      const client = await createLitClient({
        network: nagaDev,
      });

      setLitClient(client);
      setStatus("Lit Client created successfully");
      showSuccess("create-lit-client");
    } catch (error: any) {
      console.error("Error creating Lit Client:", error);
      const errorMessage = formatErrorMessage(
        "Failed to create Lit Client: ",
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsCreatingLitClient(false);
    }
  };

  const createAuthManager = async () => {
    try {
      setIsCreatingAuthManager(true);
      setStatus("Creating Auth Manager...");

      const { createAuthManager, storagePlugins } = await import(
        "@lit-protocol/auth"
      );

      const manager = createAuthManager({
        storage: storagePlugins.localStorageNode({
          appName: "my-app",
          networkName: import.meta.env.VITE_LIT_NETWORK || "naga-dev",
          storagePath: "./lit-auth-storage",
        }),
      });

      setAuthManager(manager);
      setStatus("Auth Manager created successfully");
      showSuccess("create-auth-manager");
    } catch (error: any) {
      console.error("Error creating Auth Manager:", error);
      const errorMessage = formatErrorMessage(
        "Failed to create Auth Manager: ",
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsCreatingAuthManager(false);
    }
  };

  const createEoaAuthContext = async () => {
    try {
      setIsCreatingEoaAuthContext(true);
      setStatus("Creating EOA Auth Context...");

      if (!account || !litClient || !authManager) {
        throw new Error("Missing required dependencies");
      }

      const eoaAuthContext = await authManager.createEoaAuthContext({
        config: {
          account: account,
        },
        authConfig: {
          statement: "I authorize the Lit Protocol to execute this Lit Action.",
          resources: [
            ["lit-action-execution", "*"],
            ["pkp-signing", "*"],
            ["access-control-condition-decryption", "*"],
          ],
          capabilityAuthSigs: [],
          expiration: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
        },
        litClient: litClient,
      });

      setEoaAuthContext(eoaAuthContext);
      setStatus("EOA Auth Context created successfully");
      showSuccess("create-eoa-auth-context");
    } catch (error: any) {
      console.error("Error creating EOA Auth Context:", error);
      const errorMessage = formatErrorMessage(
        "Failed to create EOA Auth Context: ",
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsCreatingEoaAuthContext(false);
    }
  };

  const executeLitAction = async () => {
    try {
      setIsExecutingAction(true);
      setStatus("Executing Lit Action...");

      if (!litClient || !eoaAuthContext) {
        throw new Error("Missing required dependencies");
      }

      const { createAccBuilder } = await import(
        "@lit-protocol/access-control-conditions"
      );

      const _litActionCode = async () => {
        try {
          // Check if the authenticated user meets the conditions
          const testResult = await Lit.Actions.checkConditions({
            conditions: jsParams.conditions,
            authSig: jsParams.authSig,
            chain: "ethereum",
          });

          if (!testResult) {
            return LitActions.setResponse({
              response: "Access denied: insufficient ETH balance",
            });
          }

          return LitActions.setResponse({
            response: "Access granted",
          });
        } catch (error) {
          LitActions.setResponse({ response: error.message });
        }
      };

      const litActionCode = `(${_litActionCode.toString()})();`;

      const operatorExamples = getOperatorExamples();
      const selectedExample = operatorExamples[selectedOperator];

      const result = await (litClient as any).executeJs({
        code: litActionCode,
        authContext: eoaAuthContext,
        jsParams: {
          conditions: createAccBuilder()
            .requireEthBalance("10000000000000000", selectedExample.operator)
            .on("ethereum")
            .build(),
        },
      });

      setActionResult(result);
      setStatus("Lit Action executed successfully");
      showSuccess("execute-lit-action");
      console.log("Lit Action result:", result);
    } catch (error: any) {
      console.error("Error executing Lit Action:", error);
      const errorMessage = formatErrorMessage(
        "Failed to execute Lit Action: ",
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsExecutingAction(false);
    }
  };

  return (
    <div className="tab-content">
      <h2>Lit Actions Quick Start</h2>
      <p>
        This quick start guide demonstrates how to execute a Lit Action using an
        authenticated EOA account. You'll learn to create a Lit Client, Auth
        Manager, and execute a simple access control check within a Lit Action.
      </p>

      <div
        style={{
          padding: "12px",
          backgroundColor: "#e8f4fd",
          borderRadius: "4px",
          border: "1px solid #b3d9ff",
          marginBottom: "15px",
          fontSize: "14px",
        }}
      >
        <strong>💰 Payment Information:</strong> Lit Action execution requires
        payment. Visit the{" "}
        <Link
          to="/payment-manager"
          style={{ color: "#007bff", textDecoration: "underline" }}
        >
          Payment Manager
        </Link>{" "}
        page to understand pricing, deposit funds, and manage your payment
        balance.
      </div>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*                  Prerequisites                   */}
        {/* ================================================ */}
        <h3 style={{ marginTop: 0 }}>Prerequisites</h3>
        <ul>
          <li>
            Lit Client:{" "}
            {getDependencyStatus().litClient ? (
              <span style={{ color: "green" }}>✓ Initialised</span>
            ) : (
              <span style={{ color: "red" }}>✗ Not initialised</span>
            )}
          </li>
          <li>
            Auth Manager:{" "}
            {getDependencyStatus().authManager ? (
              <span style={{ color: "green" }}>✓ Initialised</span>
            ) : (
              <span style={{ color: "red" }}>✗ Not initialised</span>
            )}
          </li>
          {accountMethod === "privateKey" ? (
            <li>
              Private Key:{" "}
              {account ? (
                <span style={{ color: "green" }}>✓ Provided</span>
              ) : (
                <span style={{ color: "red" }}>✗ Not provided</span>
              )}
            </li>
          ) : (
            <li>
              Wallet Client:{" "}
              {walletClient ? (
                <span style={{ color: "green" }}>✓ Connected</span>
              ) : (
                <span style={{ color: "red" }}>✗ Not connected</span>
              )}
            </li>
          )}
        </ul>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*            Create Account from Private Key       */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>Step 1: Create Account</h3>
        <p>
          {accountMethod === "privateKey"
            ? "Convert your private key to a viem account object that can be used for authentication."
            : "Use your connected wallet account for authentication."}
        </p>

        <DisplayCode
          code={
            accountMethod === "privateKey"
              ? CREATE_ACCOUNT_PRIVATE_KEY_CODE
              : CREATE_ACCOUNT_WALLET_CLIENT_CODE
          }
          language="typescript"
          renderComponent={
            <AccountMethodSelector
              onAccountCreated={setAccount}
              onMethodChange={setAccountMethod}
              setStatus={setStatus}
              showError={showError}
              showSuccess={showSuccess}
              successActionIds={{
                createAccount: "eoa-create-account",
                getWalletAccount: "eoa-get-wallet-account",
              }}
              successActions={successActions}
            />
          }
          resultData={
            account ? { address: account.address, type: account.type } : null
          }
          resultLabel="Account Information"
          useSideBySide={true}
          theme="dracula"
          isSuccess={
            successActions.has("eoa-create-account") ||
            successActions.has("eoa-get-wallet-account")
          }
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*              Authenticate with EOA               */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>Step 2: Authenticate with EOA</h3>
        <p>
          {accountMethod === "privateKey"
            ? "Use the ViemAccountAuthenticator to authenticate your private key account and generate auth data."
            : "Use the WalletClientAuthenticator to authenticate your connected wallet and generate auth data."}
        </p>

        <DisplayCode
          code={
            accountMethod === "privateKey"
              ? AUTHENTICATE_PRIVATE_KEY_CODE
              : AUTHENTICATE_WALLET_CLIENT_CODE
          }
          language="typescript"
          renderComponent={
            <button
              onClick={authenticate}
              disabled={isAuthenticating || !account}
              style={{
                padding: "10px 15px",
                backgroundColor:
                  isAuthenticating || !account ? "#cccccc" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor:
                  isAuthenticating || !account ? "not-allowed" : "pointer",
                fontWeight: "500",
              }}
            >
              {isAuthenticating ? "Authenticating..." : "Authenticate with EOA"}
              {!account && " (Create account first)"}
            </button>
          }
          resultData={authData}
          resultLabel="Auth Data"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("eoa-authenticate")}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*               Create Lit Client                   */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>Step 3: Create Lit Client</h3>
        <p>
          Initialize a Lit Client connected to the Naga Dev network. This client
          will handle communication with the Lit Protocol nodes.
        </p>

        <DisplayCode
          code={CREATE_LIT_CLIENT_CODE}
          language="typescript"
          renderComponent={
            <button
              onClick={createLitClient}
              disabled={isCreatingLitClient || !authData}
              style={{
                padding: "10px 15px",
                backgroundColor:
                  isCreatingLitClient || !authData ? "#cccccc" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor:
                  isCreatingLitClient || !authData ? "not-allowed" : "pointer",
                fontWeight: "500",
              }}
            >
              {isCreatingLitClient ? "Creating..." : "Create Lit Client"}
              {!authData && " (Authenticate first)"}
            </button>
          }
          resultData={
            litClient ? { network: import.meta.env.VITE_LIT_NETWORK || "naga-dev", status: "connected" } : null
          }
          resultLabel="Lit Client"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("create-lit-client")}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*               Create Auth Manager                 */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>Step 4: Create Auth Manager</h3>
        <p>
          Create an Auth Manager with local storage configuration. This manages
          authentication contexts and session storage.
        </p>

        <DisplayCode
          code={CREATE_AUTH_MANAGER_CODE}
          language="typescript"
          renderComponent={
            <button
              onClick={createAuthManager}
              disabled={isCreatingAuthManager || !litClient}
              style={{
                padding: "10px 15px",
                backgroundColor:
                  isCreatingAuthManager || !litClient ? "#cccccc" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor:
                  isCreatingAuthManager || !litClient
                    ? "not-allowed"
                    : "pointer",
                fontWeight: "500",
              }}
            >
              {isCreatingAuthManager ? "Creating..." : "Create Auth Manager"}
              {!litClient && " (Create Lit Client first)"}
            </button>
          }
          resultData={
            authManager
              ? { storage: "localStorageNode", appName: "my-app" }
              : null
          }
          resultLabel="Auth Manager"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("create-auth-manager")}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*               Create EOA Auth Context             */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>Step 5: Create EOA Auth Context</h3>
        <p>
          Create an EOA authentication context using your account. This context
          will be used to authenticate Lit Action execution requests.
        </p>

        <DisplayCode
          code={CREATE_EOA_AUTH_CONTEXT_CODE}
          language="typescript"
          renderComponent={
            <button
              onClick={createEoaAuthContext}
              disabled={
                isCreatingEoaAuthContext ||
                !authManager ||
                !litClient ||
                !account
              }
              style={{
                padding: "10px 15px",
                backgroundColor:
                  isCreatingEoaAuthContext ||
                  !authManager ||
                  !litClient ||
                  !account
                    ? "#cccccc"
                    : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor:
                  isCreatingEoaAuthContext ||
                  !authManager ||
                  !litClient ||
                  !account
                    ? "not-allowed"
                    : "pointer",
                fontWeight: "500",
              }}
            >
              {isCreatingEoaAuthContext
                ? "Creating..."
                : "Create EOA Auth Context"}
              {(!authManager || !litClient || !account) &&
                " (Complete previous steps)"}
            </button>
          }
          resultData={
            eoaAuthContext
              ? {
                  account: eoaAuthContext.account?.address,
                  resources: [
                    "lit-action-execution",
                    "pkp-signing",
                    "access-control-condition-decryption",
                  ],
                }
              : null
          }
          resultLabel="EOA Auth Context"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("create-eoa-auth-context")}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*               Execute Lit Action                  */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>Step 6: Execute Lit Action</h3>
        <p>
          Execute a Lit Action that checks if the authenticated user has less
          than 0.01 ETH. The action demonstrates access control condition
          checking within a Lit Action.
        </p>

        <DisplayCode
          code={getExecuteLitActionCode(
            getOperatorExamples()[selectedOperator].operator
          )}
          language="typescript"
          renderComponent={
            <>
              {/* Operator Selection */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                  }}
                >
                  Choose ETH Balance Comparison:
                </label>
                <select
                  value={selectedOperator}
                  onChange={(e) =>
                    setSelectedOperator(
                      e.target.value as "less-than" | "greater-equal"
                    )
                  }
                  style={{
                    padding: "8px 12px",
                    borderRadius: "4px",
                    border: "1px solid #d1d5db",
                    fontSize: "14px",
                    width: "100%",
                    marginBottom: "8px",
                  }}
                >
                  {Object.entries(getOperatorExamples()).map(
                    ([key, example]) => (
                      <option key={key} value={key}>
                        {example.title}
                      </option>
                    )
                  )}
                </select>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "#6b7280",
                    margin: "5px 0 0 0",
                  }}
                >
                  {getOperatorExamples()[selectedOperator].description}
                </p>
              </div>

              <button
                onClick={executeLitAction}
                disabled={isExecutingAction || !eoaAuthContext || !litClient}
                style={{
                  padding: "12px 20px",
                  backgroundColor:
                    isExecutingAction || !eoaAuthContext || !litClient
                      ? "#cccccc"
                      : "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor:
                    isExecutingAction || !eoaAuthContext || !litClient
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: "500",
                }}
              >
                {isExecutingAction ? "Executing..." : "Execute Lit Action"}
                {(!eoaAuthContext || !litClient) &&
                  " (Complete previous steps)"}
              </button>
            </>
          }
          resultData={actionResult}
          resultLabel="Action Result"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("execute-lit-action")}
        />
      </GreyBoarderWhiteBgContainer>
    </div>
  );
}
