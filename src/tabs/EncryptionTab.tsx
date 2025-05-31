/**
 * EncryptionTab.tsx
 *
 * Demonstrates Lit Protocol's encryption and decryption capabilities using the official
 * access control conditions builder and new encrypt/decrypt API.
 *
 * Usage: Alice encrypts data, Bob decrypts it using access control conditions.
 */

import { useState } from "react";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  createAccBuilder,
  humanizeUnifiedAccessControlConditions,
  validateAccessControlConditions,
} from "@lit-protocol/access-control-conditions";
import { DisplayCode } from "../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../components/layout/GreyboardWhiteBgContainer";
import { useAppContext } from "../router";

const OPERATION_NAME = "Encrypt & Decrypt";

// Configuration constants
const DEFAULT_CHAIN = "ethereum";
const DEFAULT_MESSAGE = "Hello, my love! 🔐";
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB limit

// Data types supported by the encrypt API
type DataType = "string" | "json" | "uint8array" | "image" | "video" | "file";

// Template options for access control conditions
const TEMPLATE_OPTIONS = [
  { value: "wallet-owner", label: "Wallet Ownership" },
  { value: "eth-balance", label: "ETH Balance" },
  { value: "multi-chain", label: "Multi-chain Governance" },
  { value: "nft-owner", label: "NFT Ownership" },
  { value: "time-locked", label: "Time-locked Access" },
];

// Code snippets
const ALICE_SETUP_CODE = `
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

// Alice's account (sender)
const AliceAccount = privateKeyToAccount(generatePrivateKey());
console.log('🙋‍♀️ AliceAccount:', AliceAccount.address);`;

const BOB_SETUP_CODE = `
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

// Bob's account (recipient)
const BobsAccount = privateKeyToAccount(generatePrivateKey());
console.log('🙋‍♂️ BobsAccount:', BobsAccount.address);`;

const ACCESS_CONTROL_CODE = `
import { createAccBuilder } from '@lit-protocol/access-control-conditions';

// Build access control conditions
const builder = createAccBuilder();

const accs = builder
  .requireWalletOwnership(BobsAccount.address)
  .on('ethereum')
  .and()
  .requireEthBalance('0', '=')
  .on('yellowstone')
  .build();`;

const BOB_AUTH_CODE = `
// Bob needs AuthContext for decryption
const authContext = await authManager.createEoaAuthContext({
  config: {
    account: BobsAccount,
  },
  authConfig: {
    domain: 'localhost',
    statement: 'Decrypt test data',
    expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    resources: [
      ['access-control-condition-decryption', '*'],
      ['lit-action-execution', '*'],
    ],
  },
  litClient,
});`;

const ENCRYPT_CODE = `
// Alice encrypts data (no AuthContext needed)
const encryptedData = await litClient.encrypt({
  dataToEncrypt: stringData,
  unifiedAccessControlConditions: accs,
  chain: 'ethereum',
  // metadata: { dataType: 'string' }, // auto-inferred
});`;

const DECRYPT_CODE = `
// Bob decrypts data (requires AuthContext)
const decryptedResponse = await litClient.decrypt({
  data: encryptedData,
  unifiedAccessControlConditions: accs,
  authContext: bobAuthContext,
  chain: 'ethereum',
});`;

export default function EncryptionTab() {
  const {
    getDependencyStatus,
    areDependenciesLoaded,
    setStatus,
    assertDependenciesLoaded,
    showError,
    clearError,
  } = useAppContext();

  // Alice's setup (sender)
  const [aliceAccount, setAliceAccount] = useState<any>(null);
  const [alicePrivateKey, setAlicePrivateKey] = useState("");

  // Bob's setup (recipient)
  const [bobAccount, setBobAccount] = useState<any>(null);
  const [bobPrivateKey, setBobPrivateKey] = useState("");
  const [bobAuthContext, setBobAuthContext] = useState<any>(null);

  // Data to encrypt
  const [dataType, setDataType] = useState<DataType>("string");
  const [stringData, setStringData] = useState(DEFAULT_MESSAGE);
  const [jsonData, setJsonData] = useState(`{
  "message": "Hello, my love!",
  "timestamp": ${Date.now()}
}`);
  const [fileData, setFileData] = useState<File | null>(null);
  const [customMetadata, setCustomMetadata] = useState(`{
  "description": "Demo content",
  "category": "test"
}`);

  // Access control conditions
  const [selectedTemplate, setSelectedTemplate] = useState("wallet-owner");
  const [unifiedAccessControlConditions, setUnifiedAccessControlConditions] =
    useState<any>(null);
  const [humanizedConditions, setHumanizedConditions] = useState("");
  const [conditionsValid, setConditionsValid] = useState(false);

  // Encryption/decryption results
  const [encryptedData, setEncryptedData] = useState<any>(null);
  const [decryptedResponse, setDecryptedResponse] = useState<any>(null);

  // Loading states
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isCreatingAuth, setIsCreatingAuth] = useState(false);
  const [isBuildingConditions, setIsBuildingConditions] = useState(false);

  // Success feedback
  const [successActions, setSuccessActions] = useState<Set<string>>(new Set());

  // File upload error state
  const [fileUploadError, setFileUploadError] = useState<string>("");

  // Helper function to format file sizes
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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

  // Alice account creation
  const createAliceAccount = () => {
    try {
      const privateKey = generatePrivateKey();
      setAlicePrivateKey(privateKey);
      const account = privateKeyToAccount(privateKey);
      setAliceAccount(account);
      setStatus(`Alice's account created: ${account.address}`);
      showSuccess("alice-account");
    } catch (error: any) {
      console.error("Error creating Alice's account:", error);
      const errorMessage = formatErrorMessage(
        "Failed to create Alice's account: ",
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    }
  };

  // Bob account creation
  const createBobAccount = () => {
    try {
      const privateKey = generatePrivateKey();
      setBobPrivateKey(privateKey);
      const account = privateKeyToAccount(privateKey);
      setBobAccount(account);
      setStatus(`Bob's account created: ${account.address}`);
      showSuccess("bob-account");
    } catch (error: any) {
      console.error("Error creating Bob's account:", error);
      const errorMessage = formatErrorMessage(
        "Failed to create Bob's account: ",
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    }
  };

  // Build access control conditions based on template
  const buildAccessControlConditions = async () => {
    if (!bobAccount) {
      setStatus("Please create Bob's account first");
      return;
    }

    setIsBuildingConditions(true);
    try {
      const builder = createAccBuilder();

      let accs;
      switch (selectedTemplate) {
        case "wallet-owner":
          accs = builder
            .requireWalletOwnership(bobAccount.address)
            .on("ethereum")
            .build();
          break;
        case "eth-balance":
          accs = builder
            .requireWalletOwnership(bobAccount.address)
            .on("ethereum")
            // .and()
            // .requireEthBalance("0", ">=")
            // .on("yellowstone")
            .build();
          break;
        case "multi-chain":
          accs = builder
            .requireWalletOwnership(bobAccount.address)
            .on("ethereum")
            .and()
            .requireEthBalance("1", ">=")
            .on("polygon")
            .build();
          break;
        case "nft-owner":
          accs = builder
            .requireWalletOwnership(bobAccount.address)
            .on("ethereum")
            .and()
            .requireNftOwnership(
              "0x1234567890123456789012345678901234567890",
              "1"
            )
            .on("ethereum")
            .build();
          break;
        case "time-locked":
          const futureTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
          accs = builder
            .requireWalletOwnership(bobAccount.address)
            .on("ethereum")
            .and()
            .requireTimestamp(futureTimestamp.toString(), ">=")
            .on("ethereum")
            .build();
          break;
        default:
          accs = builder
            .requireWalletOwnership(bobAccount.address)
            .on("ethereum")
            .build();
      }

      setUnifiedAccessControlConditions(accs);

      // Humanize and validate conditions
      const humanized = await humanizeUnifiedAccessControlConditions({
        unifiedAccessControlConditions: accs,
      });
      setHumanizedConditions(humanized);

      const validated = await validateAccessControlConditions({
        unifiedAccessControlConditions: accs,
      });
      setConditionsValid(validated);

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

  // Create Bob's auth context for decryption
  const createBobAuthContext = async () => {
    if (!bobAccount) {
      setStatus("Please create Bob's account first");
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

      const authContext = await authManager.createEoaAuthContext({
        config: {
          account: bobAccount,
        },
        authConfig: {
          domain: "localhost",
          statement: "Decrypt test data",
          expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
          resources: [
            ["access-control-condition-decryption", "*"],
            ["lit-action-execution", "*"],
          ],
        },
        litClient,
      });

      setBobAuthContext(authContext);
      setStatus(`Bob's AuthContext created for ${bobAccount.address}`);
      showSuccess("bob-auth");
    } catch (error: any) {
      console.error("Error creating Bob's AuthContext:", error);
      const errorMessage = formatErrorMessage(
        "Failed to create Bob's AuthContext: ",
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsCreatingAuth(false);
    }
  };

  // Prepare data for encryption based on type
  const prepareDataForEncryption = async () => {
    switch (dataType) {
      case "string":
        return stringData;
      case "json":
        try {
          return JSON.parse(jsonData);
        } catch {
          throw new Error("Invalid JSON data");
        }
      case "uint8array":
        return new TextEncoder().encode(stringData);
      case "image":
      case "video":
      case "file":
        if (!fileData) {
          throw new Error(`No ${dataType} file selected`);
        }
        // Read file data as ArrayBuffer for proper encryption
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const arrayBuffer = reader.result as ArrayBuffer;
            console.log(
              `📁 File read for encryption: ${fileData.name}, size: ${arrayBuffer.byteLength} bytes`
            );
            resolve(new Uint8Array(arrayBuffer));
          };
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsArrayBuffer(fileData);
        });
      default:
        return stringData;
    }
  };

  // Prepare metadata for encryption
  const prepareMetadata = () => {
    try {
      const customMeta = customMetadata ? JSON.parse(customMetadata) : {};
      return {
        dataType,
        ...customMeta,
        timestamp: Date.now(),
      };
    } catch {
      throw new Error("Invalid custom metadata JSON");
    }
  };

  // Encrypt data using Alice's setup
  const encryptData = async () => {
    if (!aliceAccount || !unifiedAccessControlConditions) {
      setStatus(
        "Please create Alice's account and build access control conditions first"
      );
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

      const dataToEncrypt = await prepareDataForEncryption();
      const metadata = prepareMetadata();

      console.log("🔐 Encrypting data:", {
        dataType,
        dataSize:
          dataToEncrypt?.length || dataToEncrypt?.byteLength || "unknown",
        dataToEncrypt:
          dataType === "string" ? dataToEncrypt : `[${typeof dataToEncrypt}]`,
        metadata,
      });

      const encrypted = await litClient.encrypt({
        dataToEncrypt,
        unifiedAccessControlConditions,
        chain: DEFAULT_CHAIN,
        metadata,
      });

      console.log("🔐 Encrypted result:", encrypted);

      setEncryptedData(encrypted);
      setStatus("Data encrypted successfully!");
      showSuccess("encrypt-data");
    } catch (error: any) {
      console.error("Error encrypting data:", error);
      const errorMessage = formatErrorMessage(
        "Failed to encrypt data: ",
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsEncrypting(false);
    }
  };

  // Decrypt data using Bob's auth context
  const decryptData = async () => {
    if (!bobAuthContext || !encryptedData || !unifiedAccessControlConditions) {
      setStatus(
        "Please create Bob's AuthContext, encrypt data, and build conditions first"
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

      console.log("🔓 Starting decryption with:", {
        hasAuthContext: !!bobAuthContext,
        hasEncryptedData: !!encryptedData,
        hasConditions: !!unifiedAccessControlConditions,
        encryptedDataKeys: Object.keys(encryptedData),
        authContextKeys: Object.keys(bobAuthContext),
        conditionsCount: unifiedAccessControlConditions?.length,
      });

      const decrypted = await litClient.decrypt({
        data: encryptedData,
        unifiedAccessControlConditions,
        authContext: bobAuthContext,
        chain: DEFAULT_CHAIN,
      });

      console.log("🔓 Decrypted successfully:", decrypted);

      setDecryptedResponse(decrypted);
      setStatus("Data decrypted successfully!");
      showSuccess("decrypt-data");
    } catch (error: any) {
      console.error("❌ Decryption error details:", {
        error,
        errorMessage: error?.message,
        errorCode: error?.code,
        errorInfo: error?.info,
        errorCause: error?.cause,
      });

      let errorMessage = "Failed to decrypt data: ";
      if (error?.code === "network_error") {
        errorMessage += "Network connectivity issue with Lit Protocol nodes. ";
        if (error?.info?.fullPath) {
          errorMessage += `Failed endpoint: ${error.info.fullPath}. `;
        }
        errorMessage += "Please check your internet connection and try again.";
      } else {
        errorMessage += error?.message || String(error);
      }

      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsDecrypting(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileUploadError(""); // Clear any previous errors

    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        const errorMessage = `File size too large: ${formatFileSize(
          file.size
        )}. Maximum allowed size is ${formatFileSize(MAX_FILE_SIZE)}.`;
        setFileUploadError(errorMessage);
        setStatus(errorMessage);
        showError?.(errorMessage);

        // Clear the file input
        event.target.value = "";
        setFileData(null);
        return;
      }

      setFileData(file);
      setStatus(`File selected: ${file.name} (${formatFileSize(file.size)})`);
    } else {
      setFileData(null);
    }
  };

  return (
    <div className="tab-content">
      <h2>{OPERATION_NAME}</h2>
      <p>
        Demonstrates the complete encrypt/decrypt flow using official access
        control conditions builder. Alice encrypts data, Bob decrypts it using
        properly configured access control conditions.
      </p>

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
        </ul>

        {/* Information box about the flow */}
        <div
          style={{
            marginTop: "15px",
            padding: "15px",
            backgroundColor: "#e8f4fd",
            borderRadius: "8px",
            border: "1px solid #b3d9ff",
          }}
        >
          <h4 style={{ margin: "0 0 10px 0" }}>🔐 Encrypt & Decrypt Flow</h4>
          <p style={{ margin: "0 0 10px 0" }}>
            This demonstrates the asymmetric nature of Lit Protocol encryption:
            <strong> Alice</strong> can encrypt without authentication,
            <strong> Bob</strong> must authenticate to decrypt.
          </p>
          <div style={{ display: "flex", gap: "20px", fontSize: "14px" }}>
            <div style={{ color: "#007bff" }}>
              <strong>Alice:</strong> Encrypts → No AuthContext needed
            </div>
            <div style={{ color: "#28a745" }}>
              <strong>Bob:</strong> Decrypts → Requires AuthContext
            </div>
          </div>
        </div>
      </GreyBoarderWhiteBgContainer>

      {/* Alice Section */}
      <div
        style={{
          border: "2px solid #007bff",
          borderRadius: "8px",
          marginBottom: "30px",
          backgroundColor: "#f8fbff",
        }}
      >
        <div
          style={{
            backgroundColor: "#007bff",
            color: "white",
            padding: "15px",
            borderRadius: "6px 6px 0 0",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ margin: 0 }}>👩‍💻 Alice (Sender)</h2>
          <p style={{ margin: "5px 0 0 0", fontSize: "14px" }}>
            Alice encrypts data without needing authentication
          </p>
        </div>

        <div style={{ padding: "0 20px 20px 20px" }}>
          <GreyBoarderWhiteBgContainer>
            <h3 style={{ marginTop: 0 }}>Step 1: Create Alice's Account</h3>
            <p>
              Generate Alice's account using a random private key. Alice only
              needs an account for encryption - no authentication required.
            </p>

            <DisplayCode
              code={ALICE_SETUP_CODE}
              language="typescript"
              renderComponent={
                <button
                  onClick={createAliceAccount}
                  style={{
                    padding: "10px 15px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                >
                  {successActions.has("alice-account")
                    ? "✓ Alice's Account Created"
                    : "Create Alice's Account"}
                </button>
              }
              resultData={
                aliceAccount ? { address: aliceAccount.address } : null
              }
              resultLabel="Alice's Account Information"
              useSideBySide={true}
              theme="dracula"
              isSuccess={successActions.has("alice-account")}
            />
          </GreyBoarderWhiteBgContainer>
        </div>
      </div>

      {/* Bob Section */}
      <div
        style={{
          border: "2px solid #28a745",
          borderRadius: "8px",
          marginBottom: "30px",
          backgroundColor: "#f8fff9",
        }}
      >
        <div
          style={{
            backgroundColor: "#28a745",
            color: "white",
            padding: "15px",
            borderRadius: "6px 6px 0 0",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ margin: 0 }}>👨‍💻 Bob (Recipient)</h2>
          <p style={{ margin: "5px 0 0 0", fontSize: "14px" }}>
            Bob needs authentication to decrypt data
          </p>
        </div>

        <div style={{ padding: "0 20px 20px 20px" }}>
          <GreyBoarderWhiteBgContainer>
            <h3 style={{ marginTop: 0 }}>Step 2: Create Bob's Account</h3>
            <p>
              Generate Bob's account using a random private key. Bob will need
              this account for authentication to decrypt data.
            </p>

            <DisplayCode
              code={BOB_SETUP_CODE}
              language="typescript"
              renderComponent={
                <button
                  onClick={createBobAccount}
                  style={{
                    padding: "10px 15px",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                >
                  {successActions.has("bob-account")
                    ? "✓ Bob's Account Created"
                    : "Create Bob's Account"}
                </button>
              }
              resultData={bobAccount ? { address: bobAccount.address } : null}
              resultLabel="Bob's Account Information"
              useSideBySide={true}
              theme="dracula"
              isSuccess={successActions.has("bob-account")}
            />
          </GreyBoarderWhiteBgContainer>
        </div>
      </div>

      {/* Alice's Access Control Conditions - Separate section with Alice's styling */}
      <div
        style={{
          border: "2px solid #007bff",
          borderRadius: "8px",
          marginBottom: "30px",
          backgroundColor: "#f8fbff",
        }}
      >
        <div
          style={{
            backgroundColor: "#007bff",
            color: "white",
            padding: "15px",
            borderRadius: "6px 6px 0 0",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ margin: 0 }}>🔐 Alice Defines Access Rules</h2>
          <p style={{ margin: "5px 0 0 0", fontSize: "14px" }}>
            Alice decides who can decrypt her encrypted data
          </p>
        </div>

        <div style={{ padding: "0 20px 20px 20px" }}>
          <GreyBoarderWhiteBgContainer>
            <h3 style={{ marginTop: 0 }}>
              Step 3: Build Access Control Conditions
              {!bobAccount && (
                <span style={{ color: "orange" }}>
                  {" "}
                  (Create Bob's account first)
                </span>
              )}
            </h3>
            <p>
              Alice defines who can decrypt the encrypted data using official access
              control conditions builder. These conditions reference Bob's wallet address
              and will be checked during decryption.
            </p>

            <DisplayCode
              code={ACCESS_CONTROL_CODE}
              language="typescript"
              renderComponent={
                <div style={{ marginBottom: "10px" }}>
                  <div style={{ marginBottom: "15px" }}>
                    <label
                      htmlFor="templateSelect"
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        fontWeight: "500",
                      }}
                    >
                      Access Control Template:
                    </label>
                    <select
                      id="templateSelect"
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        fontSize: "14px",
                        marginBottom: "10px",
                      }}
                    >
                      {TEMPLATE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <small style={{ color: "#666", fontSize: "12px" }}>
                      Select a template to generate different access control
                      patterns
                    </small>
                  </div>

                  <button
                    onClick={buildAccessControlConditions}
                    disabled={!bobAccount || isBuildingConditions}
                    style={{
                      padding: "10px 15px",
                      backgroundColor:
                        !bobAccount || isBuildingConditions
                          ? "#cccccc"
                          : "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor:
                        !bobAccount || isBuildingConditions
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

                  {humanizedConditions && (
                    <div
                      style={{
                        marginTop: "15px",
                        padding: "10px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "4px",
                        border: "1px solid #e9ecef",
                      }}
                    >
                      <strong>Conditions:</strong> {humanizedConditions}
                      <br />
                      <strong>Valid:</strong>{" "}
                      {conditionsValid ? "✅ Yes" : "❌ No"}
                    </div>
                  )}
                </div>
              }
              resultData={unifiedAccessControlConditions}
              resultLabel="Built Access Control Conditions"
              useSideBySide={true}
              theme="dracula"
              isSuccess={successActions.has("build-conditions")}
            />
          </GreyBoarderWhiteBgContainer>
        </div>
      </div>

      {/* Bob's AuthContext Section */}
      <div
        style={{
          border: "2px solid #28a745",
          borderRadius: "8px",
          marginBottom: "30px",
          backgroundColor: "#f8fff9",
        }}
      >
        <div
          style={{
            backgroundColor: "#28a745",
            color: "white",
            padding: "15px",
            borderRadius: "6px 6px 0 0",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ margin: 0 }}>🔑 Bob Prepares for Decryption</h2>
          <p style={{ margin: "5px 0 0 0", fontSize: "14px" }}>
            Bob creates authentication context to prove he meets access conditions
          </p>
        </div>

        <div style={{ padding: "0 20px 20px 20px" }}>
          <GreyBoarderWhiteBgContainer>
            <h3 style={{ marginTop: 0 }}>
              Step 4: Create Bob's AuthContext
              {!bobAccount && (
                <span style={{ color: "orange" }}>
                  {" "}
                  (Create Bob's account first)
                </span>
              )}
            </h3>
            <p>
              Bob requires an AuthContext for decryption. This proves Bob's
              identity and authorizes him to decrypt data that meets the access
              control conditions.
            </p>

            <DisplayCode
              code={BOB_AUTH_CODE}
              language="typescript"
              renderComponent={
                <button
                  onClick={createBobAuthContext}
                  disabled={!bobAccount || isCreatingAuth}
                  style={{
                    padding: "10px 15px",
                    backgroundColor:
                      !bobAccount || isCreatingAuth ? "#cccccc" : "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor:
                      !bobAccount || isCreatingAuth ? "not-allowed" : "pointer",
                    fontWeight: "500",
                  }}
                >
                  {isCreatingAuth
                    ? "Creating..."
                    : successActions.has("bob-auth")
                    ? "✓ Bob's AuthContext Created"
                    : "Create Bob's AuthContext"}
                </button>
              }
              resultData={bobAuthContext}
              resultLabel="Bob's AuthContext Information"
              useSideBySide={true}
              theme="dracula"
              isSuccess={successActions.has("bob-auth")}
            />
          </GreyBoarderWhiteBgContainer>
        </div>
      </div>

      {/* Data Configuration */}
      <div
        style={{
          border: "2px solid #007bff",
          borderRadius: "8px",
          marginBottom: "30px",
          backgroundColor: "#f8fbff",
        }}
      >
        <div
          style={{
            backgroundColor: "#007bff",
            color: "white",
            padding: "15px",
            borderRadius: "6px 6px 0 0",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ margin: 0 }}>📝 Alice Prepares Data</h2>
          <p style={{ margin: "5px 0 0 0", fontSize: "14px" }}>
            Alice configures and encrypts the data with access control conditions
          </p>
        </div>

        <div style={{ padding: "0 20px 20px 20px" }}>
          <GreyBoarderWhiteBgContainer>
            <h3 style={{ marginTop: 0 }}>Step 5: Configure Data to Encrypt</h3>
            <p>
              Choose the type of data to encrypt and configure it. The new encrypt
              API supports multiple data types with automatic type inference and
              metadata.
            </p>

            <div style={{ marginBottom: "20px" }}>
              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
                >
                  Data Type:
                </label>
                <select
                  value={dataType}
                  onChange={(e) => setDataType(e.target.value as DataType)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                >
                  <option value="string">String</option>
                  <option value="json">JSON Object</option>
                  <option value="uint8array">Uint8Array</option>
                  <option value="image">Image File</option>
                  <option value="video">Video File</option>
                  <option value="file">Any File</option>
                </select>
              </div>

              {dataType === "string" && (
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
              )}

              {dataType === "json" && (
                <div style={{ marginBottom: "15px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "500",
                    }}
                  >
                    JSON Data:
                  </label>
                  <textarea
                    value={jsonData}
                    onChange={(e) => setJsonData(e.target.value)}
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "14px",
                      fontFamily: "monospace",
                      color: "#495057",
                      backgroundColor: "white",
                    }}
                  />
                </div>
              )}

              {(dataType === "image" ||
                dataType === "video" ||
                dataType === "file") && (
                <div style={{ marginBottom: "15px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "500",
                    }}
                  >
                    Upload {dataType}:
                  </label>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept={
                      dataType === "image"
                        ? "image/*"
                        : dataType === "video"
                        ? "video/*"
                        : "*"
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "14px",
                    }}
                  />
                  {fileUploadError && (
                    <div
                      style={{
                        marginTop: "10px",
                        padding: "12px",
                        backgroundColor: "#ffe6e6",
                        borderRadius: "4px",
                        border: "1px solid #ff9999",
                        fontSize: "14px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span style={{ color: "#cc0000", fontSize: "16px" }}>
                          ⚠️
                        </span>
                        <span style={{ color: "#cc0000", fontWeight: "500" }}>
                          File Upload Error
                        </span>
                      </div>
                      <div style={{ marginTop: "5px", color: "#cc0000" }}>
                        {fileUploadError}
                      </div>
                    </div>
                  )}
                  {fileData && (
                    <div
                      style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}
                    >
                      Selected: {fileData.name} ({formatFileSize(fileData.size)})
                    </div>
                  )}
                  <small
                    style={{
                      color: "#666",
                      fontSize: "12px",
                      display: "block",
                      marginTop: "5px",
                    }}
                  >
                    Maximum file size: {formatFileSize(MAX_FILE_SIZE)}
                  </small>
                </div>
              )}

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
                >
                  Custom Metadata (JSON):
                </label>
                <textarea
                  value={customMetadata}
                  onChange={(e) => setCustomMetadata(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontFamily: "monospace",
                    color: "#495057",
                    backgroundColor: "white",
                  }}
                />
                <small style={{ color: "#666", fontSize: "12px" }}>
                  Additional metadata to include with the encrypted data
                </small>
              </div>
            </div>
          </GreyBoarderWhiteBgContainer>

          {/* Encryption */}
          <GreyBoarderWhiteBgContainer>
            <h3 style={{ marginTop: 0 }}>
              Step 6: Encrypt Data (Alice)
              {(!aliceAccount || !unifiedAccessControlConditions) && (
                <span style={{ color: "orange" }}> (Complete previous steps)</span>
              )}
            </h3>
            <p>
              Alice encrypts the configured data using the access control
              conditions. No authentication required for encryption.
            </p>

            <DisplayCode
              code={ENCRYPT_CODE}
              language="typescript"
              renderComponent={
                <button
                  onClick={encryptData}
                  disabled={
                    !aliceAccount || !unifiedAccessControlConditions || isEncrypting
                  }
                  style={{
                    padding: "12px 20px",
                    backgroundColor:
                      !aliceAccount ||
                      !unifiedAccessControlConditions ||
                      isEncrypting
                        ? "#cccccc"
                        : "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor:
                      !aliceAccount ||
                      !unifiedAccessControlConditions ||
                      isEncrypting
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
        </div>
      </div>

      {/* Decryption */}
      <div
        style={{
          border: "2px solid #28a745",
          borderRadius: "8px",
          marginBottom: "30px",
          backgroundColor: "#f8fff9",
        }}
      >
        <div
          style={{
            backgroundColor: "#28a745",
            color: "white",
            padding: "15px",
            borderRadius: "6px 6px 0 0",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ margin: 0 }}>🔓 Bob Decrypts Data</h2>
          <p style={{ margin: "5px 0 0 0", fontSize: "14px" }}>
            Bob uses his authentication context to decrypt Alice's data
          </p>
        </div>

        <div style={{ padding: "0 20px 20px 20px" }}>
          <GreyBoarderWhiteBgContainer>
            <h3 style={{ marginTop: 0 }}>
              Step 7: Decrypt Data (Bob)
              {(!bobAuthContext || !encryptedData) && (
                <span style={{ color: "orange" }}>
                  {" "}
                  (Encrypt data and create Bob's AuthContext first)
                </span>
              )}
            </h3>
            <p>
              Bob decrypts the data using his AuthContext. The access control
              conditions will be verified during decryption.
            </p>

            <DisplayCode
              code={DECRYPT_CODE}
              language="typescript"
              renderComponent={
                <button
                  onClick={decryptData}
                  disabled={
                    !bobAuthContext ||
                    !encryptedData ||
                    !unifiedAccessControlConditions ||
                    isDecrypting
                  }
                  style={{
                    padding: "12px 20px",
                    backgroundColor:
                      !bobAuthContext ||
                      !encryptedData ||
                      !unifiedAccessControlConditions ||
                      isDecrypting
                        ? "#cccccc"
                        : "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor:
                      !bobAuthContext ||
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

            {/* Custom Decrypted Content Display */}
            {decryptedResponse && (
              <div style={{ marginTop: "20px" }}>
                <h4 style={{ marginBottom: "15px", color: "#28a745" }}>
                  🔓 Decrypted Content
                </h4>

                {/* Helper function to get actual decrypted data */}
                {(() => {
                  // Try different possible property names for the decrypted data
                  const actualData =
                    decryptedResponse.convertedData ||
                    decryptedResponse.plaintext ||
                    decryptedResponse.decryptedData ||
                    decryptedResponse.data ||
                    decryptedResponse;

                  console.log(
                    "🔍 Decrypted Response Structure:",
                    decryptedResponse
                  );
                  console.log("🔍 Actual Data:", actualData);
                  console.log("🔍 Data Type:", dataType);

                  // Debug info
                  const debugInfo = (
                    <div
                      style={{
                        marginBottom: "15px",
                        padding: "10px",
                        backgroundColor: "#f0f8ff",
                        borderRadius: "4px",
                        fontSize: "12px",
                        border: "1px solid #b3d9ff",
                      }}
                    >
                      <strong>Debug Info:</strong>
                      <br />
                      Response keys: {Object.keys(decryptedResponse).join(", ")}
                      <br />
                      Data type: {typeof actualData}
                      <br />
                      Data: {String(actualData)?.substring(0, 100)}
                      {String(actualData)?.length > 100 ? "..." : ""}
                    </div>
                  );

                  return (
                    <>
                      {debugInfo}

                      {/* Render content based on data type */}
                      {dataType === "image" && actualData && (
                        <div style={{ marginBottom: "15px" }}>
                          <h5 style={{ marginBottom: "10px" }}>Decrypted Image:</h5>
                          {(() => {
                            console.log("🖼️ Image data debug:", {
                              dataType: typeof actualData,
                              isString: typeof actualData === "string",
                              isUint8Array: actualData instanceof Uint8Array,
                              isArrayBuffer: actualData instanceof ArrayBuffer,
                              length: actualData?.length || actualData?.byteLength,
                              first20Bytes:
                                actualData instanceof Uint8Array
                                  ? Array.from(actualData.slice(0, 20))
                                  : "N/A",
                              fileType: fileData?.type,
                              fileName: fileData?.name,
                            });

                            let imageSrc: string = "";
                            let mimeType = fileData?.type || "image/jpeg"; // fallback to jpeg

                            try {
                              if (typeof actualData === "string") {
                                // If string, assume it's base64
                                imageSrc = `data:${mimeType};base64,${actualData}`;
                              } else if (actualData instanceof Blob) {
                                // If already a Blob (Lit Protocol returns this), use it directly
                                imageSrc = URL.createObjectURL(actualData);
                                mimeType = actualData.type || mimeType; // Use blob's type if available

                                console.log("🖼️ Using existing blob:", {
                                  size: actualData.size,
                                  type: actualData.type,
                                  url: imageSrc,
                                });
                              } else if (
                                actualData instanceof Uint8Array ||
                                actualData instanceof ArrayBuffer
                              ) {
                                // Create blob with proper MIME type
                                const blobData =
                                  actualData instanceof Uint8Array
                                    ? actualData
                                    : new Uint8Array(actualData);
                                const blob = new Blob([blobData], {
                                  type: mimeType,
                                });
                                imageSrc = URL.createObjectURL(blob);

                                console.log("🖼️ Created blob:", {
                                  size: blob.size,
                                  type: blob.type,
                                  url: imageSrc,
                                });
                              } else {
                                // Fallback: try to convert to Uint8Array
                                const uint8Data = new Uint8Array(actualData);
                                const blob = new Blob([uint8Data], {
                                  type: mimeType,
                                });
                                imageSrc = URL.createObjectURL(blob);
                              }

                              return (
                                <div>
                                  <img
                                    src={imageSrc}
                                    alt="Decrypted content"
                                    style={{
                                      maxWidth: "100%",
                                      maxHeight: "400px",
                                      border: "1px solid #ddd",
                                      borderRadius: "4px",
                                    }}
                                    onLoad={() => {
                                      console.log("✅ Image loaded successfully");
                                    }}
                                    onError={(e) => {
                                      console.error("❌ Image load error:", e);
                                      console.error(
                                        "❌ Failed image src:",
                                        imageSrc
                                      );
                                      console.error("❌ Image data details:", {
                                        dataType: typeof actualData,
                                        length:
                                          actualData?.length ||
                                          actualData?.byteLength,
                                        mimeType,
                                        fileName: fileData?.name,
                                      });
                                    }}
                                  />
                                  <div
                                    style={{
                                      marginTop: "10px",
                                      fontSize: "12px",
                                      color: "#666",
                                      fontFamily: "monospace",
                                    }}
                                  >
                                    <strong>Debug Info:</strong>
                                    <br />
                                    Type: {mimeType}
                                    <br />
                                    Size:{" "}
                                    {actualData?.length ||
                                      actualData?.byteLength}{" "}
                                    bytes
                                    <br />
                                    Source: {imageSrc.substring(0, 50)}...
                                  </div>
                                </div>
                              );
                            } catch (error) {
                              console.error(
                                "❌ Error creating image source:",
                                error
                              );
                              return (
                                <div
                                  style={{
                                    padding: "15px",
                                    backgroundColor: "#ffe6e6",
                                    borderRadius: "4px",
                                    border: "1px solid #ff9999",
                                  }}
                                >
                                  <h6 style={{ color: "#cc0000" }}>
                                    Image Rendering Error
                                  </h6>
                                  <p>
                                    Failed to create image source: {String(error)}
                                  </p>
                                  <p>Data type: {typeof actualData}</p>
                                  <p>
                                    Data size:{" "}
                                    {actualData?.length ||
                                      actualData?.byteLength ||
                                      "unknown"}
                                  </p>
                                </div>
                              );
                            }
                          })()}
                        </div>
                      )}

                      {dataType === "video" && actualData && (
                        <div style={{ marginBottom: "15px" }}>
                          <h5 style={{ marginBottom: "10px" }}>Decrypted Video:</h5>
                          {(() => {
                            console.log("🎥 Video data debug:", {
                              dataType: typeof actualData,
                              isBlob: actualData instanceof Blob,
                              size:
                                actualData?.size ||
                                actualData?.length ||
                                actualData?.byteLength,
                              type: actualData?.type,
                              fileName: fileData?.name,
                            });

                            let videoSrc: string = "";
                            let mimeType = fileData?.type || "video/mp4"; // fallback to mp4

                            try {
                              if (typeof actualData === "string") {
                                // If string, assume it's base64
                                videoSrc = `data:${mimeType};base64,${actualData}`;
                              } else if (actualData instanceof Blob) {
                                // If already a Blob (Lit Protocol returns this), use it directly
                                videoSrc = URL.createObjectURL(actualData);
                                mimeType = actualData.type || mimeType; // Use blob's type if available

                                console.log("🎥 Using existing blob:", {
                                  size: actualData.size,
                                  type: actualData.type,
                                  url: videoSrc,
                                });
                              } else if (
                                actualData instanceof Uint8Array ||
                                actualData instanceof ArrayBuffer
                              ) {
                                // Create blob with proper MIME type
                                const blobData =
                                  actualData instanceof Uint8Array
                                    ? actualData
                                    : new Uint8Array(actualData);
                                const blob = new Blob([blobData], {
                                  type: mimeType,
                                });
                                videoSrc = URL.createObjectURL(blob);

                                console.log("🎥 Created blob:", {
                                  size: blob.size,
                                  type: blob.type,
                                  url: videoSrc,
                                });
                              } else {
                                // Fallback: try to convert to Uint8Array
                                const uint8Data = new Uint8Array(actualData);
                                const blob = new Blob([uint8Data], {
                                  type: mimeType,
                                });
                                videoSrc = URL.createObjectURL(blob);
                              }

                              return (
                                <div>
                                  <video
                                    controls
                                    style={{
                                      maxWidth: "100%",
                                      maxHeight: "400px",
                                      border: "1px solid #ddd",
                                      borderRadius: "4px",
                                    }}
                                    onLoadedData={() => {
                                      console.log("✅ Video loaded successfully");
                                    }}
                                    onError={(e) => {
                                      console.error("❌ Video load error:", e);
                                      console.error(
                                        "❌ Failed video src:",
                                        videoSrc
                                      );
                                      console.error("❌ Video data details:", {
                                        dataType: typeof actualData,
                                        size:
                                          actualData?.size ||
                                          actualData?.length ||
                                          actualData?.byteLength,
                                        mimeType,
                                        fileName: fileData?.name,
                                      });
                                    }}
                                  >
                                    <source src={videoSrc} type={mimeType} />
                                    Your browser does not support the video tag.
                                  </video>
                                  <div
                                    style={{
                                      marginTop: "10px",
                                      fontSize: "12px",
                                      color: "#666",
                                      fontFamily: "monospace",
                                    }}
                                  >
                                    <strong>Video Debug Info:</strong>
                                    <br />
                                    Type: {mimeType}
                                    <br />
                                    Size:{" "}
                                    {actualData?.size ||
                                      actualData?.length ||
                                      actualData?.byteLength}{" "}
                                    bytes
                                    <br />
                                    Source: {videoSrc.substring(0, 50)}...
                                  </div>
                                </div>
                              );
                            } catch (error) {
                              console.error(
                                "❌ Error creating video source:",
                                error
                              );
                              return (
                                <div
                                  style={{
                                    padding: "15px",
                                    backgroundColor: "#ffe6e6",
                                    borderRadius: "4px",
                                    border: "1px solid #ff9999",
                                  }}
                                >
                                  <h6 style={{ color: "#cc0000" }}>
                                    Video Rendering Error
                                  </h6>
                                  <p>
                                    Failed to create video source: {String(error)}
                                  </p>
                                  <p>Data type: {typeof actualData}</p>
                                  <p>
                                    Data size:{" "}
                                    {actualData?.size ||
                                      actualData?.length ||
                                      actualData?.byteLength ||
                                      "unknown"}
                                  </p>
                                </div>
                              );
                            }
                          })()}
                        </div>
                      )}

                      {dataType === "file" && actualData && (
                        <div style={{ marginBottom: "15px" }}>
                          <h5 style={{ marginBottom: "10px" }}>Decrypted File:</h5>
                          <div
                            style={{
                              padding: "10px",
                              backgroundColor: "#f8f9fa",
                              borderRadius: "4px",
                              border: "1px solid #e9ecef",
                            }}
                          >
                            <p>
                              <strong>File Type:</strong>{" "}
                              {fileData?.type || "Unknown"}
                            </p>
                            <p>
                              <strong>Original Name:</strong>{" "}
                              {fileData?.name || "Unknown"}
                            </p>
                            <p>
                              <strong>Size:</strong>{" "}
                              {actualData?.byteLength ||
                                actualData?.length ||
                                "Unknown"}{" "}
                              bytes
                            </p>
                            {fileData?.type?.startsWith("text/") && actualData && (
                              <div style={{ marginTop: "10px" }}>
                                <h6>Content Preview:</h6>
                                <pre
                                  style={{
                                    backgroundColor: "#f1f3f4",
                                    padding: "10px",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                    overflow: "auto",
                                    maxHeight: "200px",
                                  }}
                                >
                                  {typeof actualData === "string"
                                    ? actualData.substring(0, 500)
                                    : new TextDecoder().decode(
                                        new Uint8Array(actualData).slice(0, 500)
                                      )}
                                  {(actualData?.length || 0) > 500 ? "..." : ""}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {(dataType === "string" ||
                        dataType === "json" ||
                        dataType === "uint8array") &&
                        actualData !== undefined && (
                          <div style={{ marginBottom: "15px" }}>
                            <h5 style={{ marginBottom: "10px" }}>
                              Decrypted Content:
                            </h5>
                            <pre
                              style={{
                                backgroundColor: "#f1f3f4",
                                padding: "15px",
                                borderRadius: "4px",
                                fontSize: "14px",
                                lineHeight: "1.4",
                                overflow: "auto",
                                maxHeight: "300px",
                                border: "1px solid #e9ecef",
                              }}
                            >
                              {dataType === "json"
                                ? typeof actualData === "object"
                                  ? JSON.stringify(actualData, null, 2)
                                  : typeof actualData === "string"
                                  ? actualData
                                  : JSON.stringify(actualData, null, 2)
                                : dataType === "uint8array"
                                ? actualData?.length !== undefined
                                  ? `Uint8Array(${
                                      actualData.length
                                    }) [\n  ${Array.from(actualData)
                                      .slice(0, 20)
                                      .join(", ")}${
                                      actualData.length > 20 ? ",\n  ..." : ""
                                    }\n]`
                                  : String(actualData)
                                : String(actualData)}
                            </pre>
                          </div>
                        )}

                      {/* Show message if no data found */}
                      {actualData === undefined && (
                        <div
                          style={{
                            marginBottom: "15px",
                            padding: "15px",
                            backgroundColor: "#ffe6e6",
                            borderRadius: "4px",
                            border: "1px solid #ff9999",
                          }}
                        >
                          <h5 style={{ marginBottom: "10px", color: "#cc0000" }}>
                            ⚠️ No Decrypted Data Found
                          </h5>
                          <p>
                            The decryption response doesn't contain recognizable
                            data properties.
                          </p>
                          <p>
                            Expected properties: convertedData, plaintext,
                            decryptedData, data
                          </p>
                          <p>
                            Available properties:{" "}
                            {Object.keys(decryptedResponse).join(", ")}
                          </p>
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* Metadata display */}
                {decryptedResponse.metadata && (
                  <div style={{ marginBottom: "15px" }}>
                    <h5 style={{ marginBottom: "10px" }}>Metadata:</h5>
                    <pre
                      style={{
                        backgroundColor: "#fff3cd",
                        padding: "10px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        border: "1px solid #ffeaa7",
                        overflow: "auto",
                        maxHeight: "150px",
                      }}
                    >
                      {JSON.stringify(decryptedResponse.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Raw response for debugging */}
                <details style={{ marginTop: "15px" }}>
                  <summary
                    style={{ cursor: "pointer", fontWeight: "500", color: "#666" }}
                  >
                    🔍 Raw Decryption Response (for debugging)
                  </summary>
                  <pre
                    style={{
                      backgroundColor: "#f8f9fa",
                      padding: "10px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      marginTop: "10px",
                      overflow: "auto",
                      maxHeight: "200px",
                      border: "1px solid #e9ecef",
                    }}
                  >
                    {JSON.stringify(decryptedResponse, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </GreyBoarderWhiteBgContainer>
        </div>
      </div>
    </div>
  );
}
