/**
 * JSS100CustomContractTab.tsx
 *
 * Tests the JSS100 custom contract access conditions for evmContract conditions.
 * Demonstrates encryption and decryption using custom contract balance checks.
 */

import { useState } from "react";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import {
  createAccBuilder,
  UnifiedAccessControlCondition,
} from "@lit-protocol/access-control-conditions";
import { DisplayCode } from "../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../components/layout/GreyboardWhiteBgContainer";
import { useAppContext } from "../router";
import PaymentInformation from "../components/tips/PaymentInformation";
import AccountMethodSelector, {
  AccountMethod,
  CREATE_ACCOUNT_PRIVATE_KEY_CODE,
  CREATE_ACCOUNT_WALLET_CLIENT_CODE,
} from "../components/common/AccountMethodSelector";

const OPERATION_NAME = "JSS100 Custom Contract Access Conditions";

// Configuration constants
const CONTRACT_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const DEFAULT_MESSAGE = "Hello world";

// Contract ABI for balanceOf function
const BALANCE_OF_ABI = [
  {
    constant: true,
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];


// Code snippets
const SETUP_CODE = `
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

// Account will be created using AccountMethodSelector
const client = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});`;

const ACCESS_CONTROL_CODE = `
import { createAccBuilder } from '@lit-protocol/access-control-conditions';

const rawAccs = [{
  conditionType: 'evmContract',
  contractAddress: '${CONTRACT_ADDRESS}',
  functionName: 'balanceOf',
  functionParams: [':userAddress'],
  functionAbi: {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  chain: 'baseSepolia',
  returnValueTest: {
    key: '',
    comparator: '>=',
    value: '0',
  },
}];

const unifiedAccs = createAccBuilder().unifiedAccs(rawAccs).build();`;

const AUTH_CONTEXT_CODE = `
const authContext = await authManager.createEoaAuthContext({
  config: {
    account: myAccount,
  },
  authConfig: {
    statement: 'I authorize the Lit Protocol to execute this Lit Action.',
    domain: 'example.com',
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

const ENCRYPT_CODE = `
const encryptedData = await litClient.encrypt({
  dataToEncrypt: stringData,
  unifiedAccessControlConditions: unifiedAccs,
});`;

const DECRYPT_CODE = `
const decryptedData = await litClient.decrypt({
  data: encryptedData,
  unifiedAccessControlConditions: unifiedAccs,
  authContext: authContext,
});`;

export default function JSS100CustomContractTab() {
  const {
    getDependencyStatus,
    areDependenciesLoaded,
    setStatus,
    assertDependenciesLoaded,
    showError,
  } = useAppContext();

  // Account setup
  const [account, setAccount] = useState<any>(null);
  const [accountMethod, setAccountMethod] = useState<AccountMethod>("walletClient");
  const [balance, setBalance] = useState<string>("");
  const [balanceChecked, setBalanceChecked] = useState(false);

  // Data to encrypt
  const [stringData, setStringData] = useState(DEFAULT_MESSAGE);

  // Access control conditions
  const [unifiedAccessControlConditions, setUnifiedAccessControlConditions] =
    useState<any>(null);

  // Authentication
  const [authContext, setAuthContext] = useState<any>(null);

  // Encryption/decryption results
  const [encryptedData, setEncryptedData] = useState<any>(null);
  const [decryptedResponse, setDecryptedResponse] = useState<any>(null);

  // Loading states
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [isBuildingConditions, setIsBuildingConditions] = useState(false);
  const [isCreatingAuth, setIsCreatingAuth] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Success feedback
  const [successActions, setSuccessActions] = useState<Set<string>>(new Set());

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

  // Check balance for the current account
  const checkAccountBalance = async () => {
    if (!account) {
      setStatus("Please create an account first");
      return;
    }

    setIsCheckingBalance(true);
    try {
      // Create public client
      const client = createPublicClient({
        chain: baseSepolia,
        transport: http(),
      });

      // Check balance
      const tokenBalance = await client.readContract({
        address: CONTRACT_ADDRESS,
        abi: BALANCE_OF_ABI,
        functionName: "balanceOf",
        args: [account.address],
      }) as bigint;

      const balanceString = tokenBalance.toString();
      setBalance(balanceString);
      setBalanceChecked(true);

      if (tokenBalance <= 0n) {
        const errorMessage = `Test account ${account.address} has no balance for token ${CONTRACT_ADDRESS}. Please get some before running the test.`;
        setStatus(errorMessage);
        showError?.(errorMessage);
        return;
      }

      setStatus(`Account balance checked. Balance: ${balanceString}`);
      showSuccess("check-balance");
    } catch (error: any) {
      console.error("Error checking account balance:", error);
      const errorMessage = formatErrorMessage(
        "Failed to check account balance: ",
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsCheckingBalance(false);
    }
  };

  // Build access control conditions
  const buildAccessControlConditions = async () => {
    if (!account) {
      setStatus("Please create an account first");
      return;
    }

    setIsBuildingConditions(true);
    try {
      const rawAccs: UnifiedAccessControlCondition = [
        {
          conditionType: "evmContract",
          contractAddress: CONTRACT_ADDRESS,
          functionName: "balanceOf",
          functionParams: [":userAddress"],
          functionAbi: {
            inputs: [{ internalType: "address", name: "account", type: "address" }],
            name: "balanceOf",
            outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
          chain: "baseSepolia",
          returnValueTest: {
            key: "",
            comparator: ">=",
            value: "0",
          },
        },
      ];

      const unifiedAccs = createAccBuilder().unifiedAccs(rawAccs).build();
      setUnifiedAccessControlConditions(unifiedAccs);

      setStatus("Access control conditions built successfully");
      showSuccess("build-conditions");
    } catch (error: any) {
      console.error("Error building access control conditions:", error);
      const errorMessage = formatErrorMessage(
        "Failed to build conditions: ",
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsBuildingConditions(false);
    }
  };

  // Create auth context
  const createAuthContext = async () => {
    if (!account) {
      setStatus("Please create an account first");
      return;
    }

    if (!areDependenciesLoaded()) {
      setStatus(
        "Lit Protocol not initialised. Please check the Dependencies tab."
      );
      return;
    }

    setIsCreatingAuth(true);
    try {
      const { authManager, litClient } = assertDependenciesLoaded();

      const authCtx = await authManager.createEoaAuthContext({
        config: {
          account,
        },
        authConfig: {
          statement: "I authorize the Lit Protocol to execute this Lit Action.",
          domain: "example.com",
          resources: [
            ["lit-action-execution", "*"],
            ["pkp-signing", "*"],
            ["access-control-condition-decryption", "*"],
          ],
          capabilityAuthSigs: [],
          expiration: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
        },
        litClient,
      });

      setAuthContext(authCtx);
      setStatus(`AuthContext created for ${account.address}`);
      showSuccess("create-auth");
    } catch (error: any) {
      console.error("Error creating AuthContext:", error);
      const errorMessage = formatErrorMessage(
        "Failed to create AuthContext: ",
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsCreatingAuth(false);
    }
  };

  // Encrypt data
  const encryptData = async () => {
    if (!unifiedAccessControlConditions) {
      setStatus("Please build access control conditions first");
      return;
    }

    if (!areDependenciesLoaded()) {
      setStatus(
        "Lit Protocol not initialised. Please check the Dependencies tab."
      );
      return;
    }

    setIsEncrypting(true);
    try {
      const { litClient } = assertDependenciesLoaded();

      console.log(
        "🔧 [TEST] Testing evmContract conditions (rawAccs):",
        JSON.stringify(unifiedAccessControlConditions, null, 2)
      );

      const encrypted = await litClient.encrypt({
        dataToEncrypt: stringData,
        unifiedAccessControlConditions,
      });

      console.log("Encrypted data:", encrypted);
      setEncryptedData(encrypted);
      setStatus("Data encrypted successfully!");
      showSuccess("encrypt-data");
    } catch (error: any) {
      console.error("Error encrypting data:", error);
      const errorMessage = formatErrorMessage("Failed to encrypt data: ", error);
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsEncrypting(false);
    }
  };

  // Decrypt data
  const decryptData = async () => {
    if (!authContext || !encryptedData || !unifiedAccessControlConditions) {
      setStatus(
        "Please create AuthContext, encrypt data, and build conditions first"
      );
      return;
    }

    if (!areDependenciesLoaded()) {
      setStatus(
        "Lit Protocol not initialised. Please check the Dependencies tab."
      );
      return;
    }

    setIsDecrypting(true);
    try {
      const { litClient } = assertDependenciesLoaded();

      const decrypted = await litClient.decrypt({
        data: encryptedData,
        unifiedAccessControlConditions,
        authContext,
      });

      console.log("Decrypted data:", decrypted);
      setDecryptedResponse(decrypted);
      setStatus("Data decrypted successfully!");
      showSuccess("decrypt-data");
    } catch (error: any) {
      console.error("Error decrypting data:", error);
      const errorMessage = formatErrorMessage("Failed to decrypt data: ", error);
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="tab-content">
      <h2>{OPERATION_NAME}</h2>
      <p>
        Tests JSS100 custom contract access conditions using evmContract conditions.
        This demonstrates encryption and decryption with custom token balance checks.
      </p>

      <PaymentInformation />

      <GreyBoarderWhiteBgContainer>
        {/* Prerequisites */}
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
          <li>
            Account:{" "}
            {account ? (
              <span style={{ color: "green" }}>✓ Created ({account.address?.slice(0, 8)}...)</span>
            ) : (
              <span style={{ color: "red" }}>✗ Not created</span>
            )}
          </li>
        </ul>

        <div
          style={{
            marginTop: "15px",
            padding: "15px",
            backgroundColor: "#e8f4fd",
            borderRadius: "8px",
            border: "1px solid #b3d9ff",
          }}
        >
          <h4 style={{ margin: "0 0 10px 0" }}>🧪 Test Overview</h4>
          <p style={{ margin: "0 0 10px 0" }}>
            This test validates that a user can encrypt and decrypt data using custom
            contract access conditions. The test requires the account to have a
            balance of the specified token.
          </p>
          <div style={{ fontSize: "14px" }}>
            <strong>Contract:</strong> {CONTRACT_ADDRESS} (Base Sepolia)
            <br />
            <strong>Function:</strong> balanceOf(address)
            <br />
            <strong>Condition:</strong> Balance ≥ 0
          </div>
        </div>
      </GreyBoarderWhiteBgContainer>

      {/* Step 1: Create Account */}
      <GreyBoarderWhiteBgContainer>
        <h3 style={{ marginTop: 0 }}>Step 1: Create Account</h3>
        <p>
          Create or connect an account that will be used for the test. The account
          should have a balance of the specified token for the access control conditions.
        </p>

        <DisplayCode
          code={accountMethod === "privateKey" ? CREATE_ACCOUNT_PRIVATE_KEY_CODE : CREATE_ACCOUNT_WALLET_CLIENT_CODE}
          language="typescript"
          renderComponent={
            <AccountMethodSelector
              onAccountCreated={setAccount}
              onMethodChange={setAccountMethod}
              setStatus={setStatus}
              showError={showError}
              showSuccess={showSuccess}
              successActionIds={{
                createAccount: "jss100-create-account",
                getWalletAccount: "jss100-get-wallet-account",
              }}
              successActions={successActions}
            />
          }
          resultData={
            account
              ? {
                  address: account.address,
                  type: account.type || accountMethod,
                }
              : null
          }
          resultLabel="Account Information"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("jss100-create-account") || successActions.has("jss100-get-wallet-account")}
        />
      </GreyBoarderWhiteBgContainer>

      {/* Step 2: Check Token Balance */}
      <GreyBoarderWhiteBgContainer>
        <h3 style={{ marginTop: 0 }}>
          Step 2: Check Token Balance
          {!account && (
            <span style={{ color: "orange" }}> (Create account first)</span>
          )}
        </h3>
        <p>
          Verify the account has the required token balance for the access control conditions.
          The test requires a balance ≥ 0 of the specified token.
        </p>

        <DisplayCode
          code={SETUP_CODE}
          language="typescript"
          renderComponent={
            <button
              onClick={checkAccountBalance}
              disabled={!account || isCheckingBalance}
              style={{
                padding: "10px 15px",
                backgroundColor: !account || isCheckingBalance ? "#cccccc" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: !account || isCheckingBalance ? "not-allowed" : "pointer",
                fontWeight: "500",
              }}
            >
              {isCheckingBalance
                ? "Checking..."
                : successActions.has("check-balance")
                ? "✓ Balance Checked"
                : "Check Token Balance"}
            </button>
          }
          resultData={
            account && balanceChecked
              ? {
                  address: account.address,
                  balance: balance,
                  contractAddress: CONTRACT_ADDRESS,
                  hasRequiredBalance: BigInt(balance || "0") > 0n,
                }
              : null
          }
          resultLabel="Balance Information"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("check-balance")}
        />
      </GreyBoarderWhiteBgContainer>

      {/* Step 3: Build Access Control Conditions */}
      <GreyBoarderWhiteBgContainer>
        <h3 style={{ marginTop: 0 }}>
          Step 3: Build Access Control Conditions
          {!account && (
            <span style={{ color: "orange" }}> (Create account first)</span>
          )}
        </h3>
        <p>
          Create the unified access control conditions using the custom contract
          condition. This checks that the user has a balance ≥ 0 of the specified token.
        </p>

        <DisplayCode
          code={ACCESS_CONTROL_CODE}
          language="typescript"
          renderComponent={
            <button
              onClick={buildAccessControlConditions}
              disabled={!account || isBuildingConditions}
              style={{
                padding: "10px 15px",
                backgroundColor:
                  !account || isBuildingConditions
                    ? "#cccccc"
                    : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor:
                  !account || isBuildingConditions
                    ? "not-allowed"
                    : "pointer",
                fontWeight: "500",
              }}
            >
              {isBuildingConditions
                ? "Building..."
                : successActions.has("build-conditions")
                ? "✓ Conditions Built"
                : "Build Access Control Conditions"}
            </button>
          }
          resultData={unifiedAccessControlConditions}
          resultLabel="Built Access Control Conditions"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("build-conditions")}
        />
      </GreyBoarderWhiteBgContainer>

      {/* Step 4: Create Auth Context */}
      <GreyBoarderWhiteBgContainer>
        <h3 style={{ marginTop: 0 }}>
          Step 4: Create Auth Context
          {!account && (
            <span style={{ color: "orange" }}> (Create account first)</span>
          )}
        </h3>
        <p>
          Create the authentication context needed for decryption. This proves the
          user's identity and authorizes decryption.
        </p>

        <DisplayCode
          code={AUTH_CONTEXT_CODE}
          language="typescript"
          renderComponent={
            <button
              onClick={createAuthContext}
              disabled={!account || isCreatingAuth}
              style={{
                padding: "10px 15px",
                backgroundColor:
                  !account || isCreatingAuth ? "#cccccc" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor:
                  !account || isCreatingAuth ? "not-allowed" : "pointer",
                fontWeight: "500",
              }}
            >
              {isCreatingAuth
                ? "Creating..."
                : successActions.has("create-auth")
                ? "✓ AuthContext Created"
                : "Create Auth Context"}
            </button>
          }
          resultData={authContext}
          resultLabel="Auth Context Information"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("create-auth")}
        />
      </GreyBoarderWhiteBgContainer>

      {/* Step 5: Configure Data */}
      <GreyBoarderWhiteBgContainer>
        <h3 style={{ marginTop: 0 }}>Step 5: Configure Data to Encrypt</h3>
        <p>Set the data that will be encrypted using the access control conditions.</p>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "500",
            }}
          >
            String Data:
          </label>
          <input
            type="text"
            value={stringData}
            onChange={(e) => setStringData(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              color: "#495057",
              backgroundColor: "white",
            }}
          />
        </div>
      </GreyBoarderWhiteBgContainer>

      {/* Step 6: Encrypt Data */}
      <GreyBoarderWhiteBgContainer>
        <h3 style={{ marginTop: 0 }}>
          Step 6: Encrypt Data
          {!unifiedAccessControlConditions && (
            <span style={{ color: "orange" }}> (Build conditions first)</span>
          )}
        </h3>
        <p>
          Encrypt the data using the access control conditions. No authentication
          required for encryption.
        </p>

        <DisplayCode
          code={ENCRYPT_CODE}
          language="typescript"
          renderComponent={
            <button
              onClick={encryptData}
              disabled={!unifiedAccessControlConditions || isEncrypting}
              style={{
                padding: "12px 20px",
                backgroundColor:
                  !unifiedAccessControlConditions || isEncrypting
                    ? "#cccccc"
                    : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor:
                  !unifiedAccessControlConditions || isEncrypting
                    ? "not-allowed"
                    : "pointer",
                fontWeight: "500",
              }}
            >
              {isEncrypting
                ? "Encrypting..."
                : successActions.has("encrypt-data")
                ? "✓ Data Encrypted"
                : "🔐 Encrypt Data"}
            </button>
          }
          resultData={encryptedData}
          resultLabel="Encrypted Data"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("encrypt-data")}
        />
      </GreyBoarderWhiteBgContainer>

      {/* Step 7: Decrypt Data */}
      <GreyBoarderWhiteBgContainer>
        <h3 style={{ marginTop: 0 }}>
          Step 7: Decrypt Data
          {(!authContext || !encryptedData) && (
            <span style={{ color: "orange" }}>
              {" "}
              (Create auth context and encrypt data first)
            </span>
          )}
        </h3>
        <p>
          Decrypt the data using the authentication context. The access control
          conditions will be verified during decryption.
        </p>

        <DisplayCode
          code={DECRYPT_CODE}
          language="typescript"
          renderComponent={
            <button
              onClick={decryptData}
              disabled={
                !authContext ||
                !encryptedData ||
                !unifiedAccessControlConditions ||
                isDecrypting
              }
              style={{
                padding: "12px 20px",
                backgroundColor:
                  !authContext ||
                  !encryptedData ||
                  !unifiedAccessControlConditions ||
                  isDecrypting
                    ? "#cccccc"
                    : "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor:
                  !authContext ||
                  !encryptedData ||
                  !unifiedAccessControlConditions ||
                  isDecrypting
                    ? "not-allowed"
                    : "pointer",
                fontWeight: "500",
              }}
            >
              {isDecrypting
                ? "Decrypting..."
                : successActions.has("decrypt-data")
                ? "✓ Data Decrypted"
                : "🔓 Decrypt Data"}
            </button>
          }
          resultData={decryptedResponse}
          resultLabel="Decrypted Data"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("decrypt-data")}
        />

        {/* Decrypted Content Display */}
        {decryptedResponse && (
          <div style={{ marginTop: "20px" }}>
            <h4 style={{ marginBottom: "15px", color: "#28a745" }}>
              🔓 Decrypted Content
            </h4>

            {(() => {
              const actualData =
                decryptedResponse.convertedData ||
                decryptedResponse.plaintext ||
                decryptedResponse.decryptedData ||
                decryptedResponse.data ||
                decryptedResponse;

              return (
                <div>
                  <div style={{ marginBottom: "15px" }}>
                    <h5 style={{ marginBottom: "10px" }}>Decrypted String:</h5>
                    <pre
                      style={{
                        backgroundColor: "#f1f3f4",
                        padding: "15px",
                        borderRadius: "4px",
                        fontSize: "14px",
                        lineHeight: "1.4",
                        overflow: "auto",
                        border: "1px solid #e9ecef",
                      }}
                    >
                      {String(actualData)}
                    </pre>
                  </div>

                  {/* Verification */}
                  <div
                    style={{
                      padding: "15px",
                      backgroundColor:
                        String(actualData) === stringData ? "#e8f5e8" : "#ffe6e6",
                      borderRadius: "4px",
                      border: `1px solid ${
                        String(actualData) === stringData ? "#28a745" : "#dc3545"
                      }`,
                    }}
                  >
                    <h5
                      style={{
                        margin: "0 0 10px 0",
                        color: String(actualData) === stringData ? "#28a745" : "#dc3545",
                      }}
                    >
                      {String(actualData) === stringData ? "✅" : "❌"} Verification
                    </h5>
                    <p style={{ margin: 0 }}>
                      <strong>Original:</strong> "{stringData}"
                      <br />
                      <strong>Decrypted:</strong> "{String(actualData)}"
                      <br />
                      <strong>Match:</strong>{" "}
                      {String(actualData) === stringData ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </GreyBoarderWhiteBgContainer>
    </div>
  );
}