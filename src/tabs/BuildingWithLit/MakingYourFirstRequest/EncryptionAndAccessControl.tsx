/**
 * EncryptionAndAccessControl.tsx
 *
 * A beginner-friendly guide to encryption and access control with Lit Protocol.
 * Part of the "Making Your First Request" tutorial series.
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  generatePrivateKey,
  privateKeyToAccount,
  type PrivateKeyAccount,
} from "viem/accounts";
import {
  createAccBuilder,
  humanizeUnifiedAccessControlConditions,
  type UnifiedAccessControlCondition,
} from "@lit-protocol/access-control-conditions";
import type { EncryptResponse } from "@lit-protocol/types";
import GreyBoarderWhiteBgContainer from "../../../components/layout/GreyboardWhiteBgContainer";
import { DisplayCode } from "../../../components/DisplayCode";
import { NoteCallout, RequiredPackages } from "../../../components/common";
import { pageStyles } from "../../../styles/pageStyles";
import { useAppContext } from "../../../router";

const EncryptionAndAccessControl: React.FC = () => {
  const { areDependenciesLoaded, assertDependenciesLoaded, showError } =
    useAppContext();

  // State for accounts
  const [aliceAccount, setAliceAccount] = useState<PrivateKeyAccount | null>(
    null
  );
  const [bobAccount, setBobAccount] = useState<PrivateKeyAccount | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [bobAuthContext, setBobAuthContext] = useState<any>(null);

  // State for encryption flow
  const [messageToEncrypt, setMessageToEncrypt] = useState(
    "Hello, Lit Protocol! 🔐"
  );
  const [accessControlConditions, setAccessControlConditions] = useState<
    UnifiedAccessControlCondition[] | null
  >(null);
  const [humanizedConditions, setHumanizedConditions] = useState("");
  const [encryptedData, setEncryptedData] = useState<EncryptResponse | null>(
    null
  );
  const [decryptedData, setDecryptedData] = useState<string>("");

  // State for loading states
  const [isCreatingAccounts, setIsCreatingAccounts] = useState(false);
  const [isCreatingConditions, setIsCreatingConditions] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isCreatingAuth, setIsCreatingAuth] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);

  const createAccounts = async () => {
    setIsCreatingAccounts(true);
    try {
      // Create Alice (sender) account
      const alicePrivateKey = generatePrivateKey();
      const alice = privateKeyToAccount(alicePrivateKey);
      setAliceAccount(alice);

      // Create Bob (recipient) account
      const bobPrivateKey = generatePrivateKey();
      const bob = privateKeyToAccount(bobPrivateKey);
      setBobAccount(bob);

      setCurrentStep(2);
    } catch (error) {
      showError?.(`Failed to create accounts: ${error}`);
    } finally {
      setIsCreatingAccounts(false);
    }
  };

  const createAccessControlConditions = async () => {
    if (!bobAccount) {
      showError?.("Please create accounts first");
      return;
    }

    setIsCreatingConditions(true);
    try {
      // Create simple wallet ownership condition for Bob
      const builder = createAccBuilder();
      const conditions = builder
        .requireWalletOwnership(bobAccount.address)
        .on("ethereum")
        .build();

      setAccessControlConditions(conditions);

      // Create human-readable description
      const humanized = await humanizeUnifiedAccessControlConditions({
        unifiedAccessControlConditions: conditions,
      });
      setHumanizedConditions(humanized);

      setCurrentStep(3);
    } catch (error) {
      showError?.(`Failed to create access control conditions: ${error}`);
    } finally {
      setIsCreatingConditions(false);
    }
  };

  const encryptMessage = async () => {
    if (!aliceAccount || !accessControlConditions) {
      showError?.("Please complete previous steps first");
      return;
    }

    if (!areDependenciesLoaded()) {
      showError?.("Please complete the prerequisites first");
      return;
    }

    setIsEncrypting(true);
    try {
      const { litClient } = assertDependenciesLoaded();

      console.log("Encrypting message:", messageToEncrypt);

      const encrypted = await litClient.encrypt({
        dataToEncrypt: messageToEncrypt,
        unifiedAccessControlConditions: accessControlConditions,
        chain: "ethereum",
      });

      setEncryptedData(encrypted);
      setCurrentStep(4);
    } catch (error) {
      showError?.(`Failed to encrypt message: ${error}`);
    } finally {
      setIsEncrypting(false);
    }
  };

  const createBobAuth = async () => {
    if (!bobAccount) {
      showError?.("Please create accounts first");
      return;
    }

    if (!areDependenciesLoaded()) {
      showError?.("Please complete the prerequisites first");
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
          domain: window.location.host,
          statement: "Decrypt test data with Lit Protocol",
          expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
          resources: [["access-control-condition-decryption", "*"]],
        },
        litClient,
      });

      setBobAuthContext(authContext);
      setCurrentStep(5);
    } catch (error) {
      showError?.(`Failed to create authentication: ${error}`);
    } finally {
      setIsCreatingAuth(false);
    }
  };

  const decryptMessage = async () => {
    if (!bobAuthContext || !encryptedData || !accessControlConditions) {
      showError?.("Please complete all previous steps first");
      return;
    }

    if (!areDependenciesLoaded()) {
      showError?.("Please complete the prerequisites first");
      return;
    }

    setIsDecrypting(true);
    try {
      const { litClient } = assertDependenciesLoaded();

      const decrypted = await litClient.decrypt({
        data: encryptedData,
        unifiedAccessControlConditions: accessControlConditions,
        authContext: bobAuthContext,
        chain: "ethereum",
      });

      // Extract the actual decrypted data from the response
      let decryptedString: string;
      if (typeof decrypted === "string") {
        decryptedString = decrypted;
      } else if (decrypted && typeof decrypted === "object") {
        // Handle different possible response structures
        if ("decryptedData" in decrypted) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data = (decrypted as any).decryptedData;
          if (typeof data === "string") {
            decryptedString = data;
          } else if (data instanceof Uint8Array) {
            decryptedString = new TextDecoder().decode(data);
          } else {
            decryptedString = String(data);
          }
        } else if ("data" in decrypted) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data = (decrypted as any).data;
          if (typeof data === "string") {
            decryptedString = data;
          } else if (data instanceof Uint8Array) {
            decryptedString = new TextDecoder().decode(data);
          } else {
            decryptedString = String(data);
          }
        } else {
          // Fallback - try to find string properties
          const stringProps = Object.values(decrypted).find(
            (val) => typeof val === "string"
          );
          decryptedString = stringProps || JSON.stringify(decrypted);
        }
      } else {
        decryptedString = String(decrypted);
      }

      setDecryptedData(decryptedString);
    } catch (error) {
      showError?.(`Failed to decrypt message: ${error}`);
    } finally {
      setIsDecrypting(false);
    }
  };

  const accountsCode = `import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

// Create Alice's account (sender)
const alicePrivateKey = generatePrivateKey();
const alice = privateKeyToAccount(alicePrivateKey);

// Create Bob's account (recipient)
const bobPrivateKey = generatePrivateKey();
const bob = privateKeyToAccount(bobPrivateKey);`;

  const accessControlCode = `import { createAccBuilder } from "@lit-protocol/access-control-conditions";

// Create access control conditions
const builder = createAccBuilder();
const conditions = builder
  .requireWalletOwnership("${bobAccount?.address || "0x..."}")
  .on('ethereum')
  .build();`;

  const encryptCode = `// Alice encrypts the message (no authentication needed)
const encrypted = await litClient.encrypt({
  dataToEncrypt: "${messageToEncrypt}",
  unifiedAccessControlConditions: conditions,
  chain: 'ethereum',
});`;

  const authCode = `// Bob creates authentication context
const authContext = await authManager.createEoaAuthContext({
  config: {
    account: bob,
  },
  authConfig: {
    domain: window.location.host,
    statement: 'Decrypt test data with Lit Protocol',
    expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    resources: [['access-control-condition-decryption', '*']],
  },
  litClient,
});`;

  const decryptCode = `// Bob decrypts the message (requires authentication)
const decrypted = await litClient.decrypt({
  data: encrypted,
  unifiedAccessControlConditions: conditions,
  authContext: authContext,
  chain: 'ethereum',
});`;

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>Encryption & Access Control</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Intro</h2>
        <p style={pageStyles.p}>
          In this guide, you'll learn how to encrypt data, set access control
          conditions, and decrypt data using Lit Protocol. This is one of Lit's
          core capabilities that enables you to create secure, condition-based
          access to encrypted information.
        </p>

        <p style={pageStyles.p}>
          You can learn more about how encryption works with Lit in the{" "}
          <Link
            to="/encryption/overview"
            style={{ color: "#3b82f6", textDecoration: "underline" }}
          >
            Encryption & Access Control
          </Link>{" "}
          section, but here's what makes it powerful:
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
              🔐 Client-Side Privacy
            </h4>
            <p
              style={{
                margin: "0",
                fontSize: "0.9rem",
                lineHeight: "1.5",
                color: "#4b5563",
              }}
            >
              Both encryption and decryption happen entirely on your device.
              Your sensitive data never leaves your control during the
              encryption process. Only the encrypted ciphertext and access
              control conditions are shared publicly, ensuring complete privacy.
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
              🛡️ Access Control Conditions
            </h4>
            <p
              style={{
                margin: "0",
                fontSize: "0.9rem",
                lineHeight: "1.5",
                color: "#4b5563",
              }}
            >
              Programmable rules that define who can decrypt your data. They can
              check wallet ownership, token balances, NFT ownership, DAO
              membership, time conditions, or even custom smart contract calls.
              The Lit network validates these conditions before allowing
              decryption.
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
              🔓 Distributed Decryption
            </h4>
            <p
              style={{
                margin: "0",
                fontSize: "0.9rem",
                lineHeight: "1.5",
                color: "#4b5563",
              }}
            >
              When conditions are met, Lit nodes produce signature shares that
              combine to form a unique decryption key. This key is bound to both
              your specific access policy and encrypted content, preventing
              reuse across different data.
            </p>
          </div>
        </div>

        <p style={pageStyles.p}>
          The results in a trustless system where no one can decrypt your data
          without satisfying the exact conditions you specified.
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
              "The Lit Client needed to communicate with the Lit network during authentication.",
          },
          {
            name: "@lit-protocol/access-control-conditions",
            description:
              "Provides utilities for building and managing access control conditions that define who can decrypt encrypted data.",
          },
          {
            name: "viem",
            description:
              "Modern Ethereum library for building wallets, dApps and other Ethereum powered tools with TypeScript support.",
          },
        ]}
        installationCode="npm install @lit-protocol/auth @lit-protocol/lit-client @lit-protocol/access-control-conditions viem"
      />

      {/* Step 1: Create Accounts */}
      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>
          Step 1: Create Test Accounts
          {currentStep >= 2 && (
            <span style={{ color: "green", marginLeft: "10px" }}>✓</span>
          )}
        </h2>
        <p style={pageStyles.p}>
          First, we'll create two test accounts: Alice (who will encrypt) and
          Bob (who will decrypt).
        </p>

        <DisplayCode
          code={accountsCode}
          language="typescript"
          renderComponent={
            <div>
              <button
                onClick={createAccounts}
                disabled={isCreatingAccounts}
                style={{
                  padding: "12px 20px",
                  backgroundColor: isCreatingAccounts
                    ? "#f8fafc"
                    : currentStep >= 2
                    ? "#22c55e"
                    : "#3b82f6",
                  color: isCreatingAccounts ? "#374151" : "white",
                  border: isCreatingAccounts ? "1px solid #d1d5db" : "none",
                  borderRadius: "6px",
                  cursor: isCreatingAccounts ? "not-allowed" : "pointer",
                  fontWeight: "500",
                  fontSize: "14px",
                }}
              >
                {isCreatingAccounts
                  ? "Creating Accounts..."
                  : currentStep >= 2
                  ? "✓ Accounts Created"
                  : "Create Test Accounts"}
              </button>

              {aliceAccount && bobAccount && (
                <div style={{ marginTop: "15px", fontSize: "14px" }}>
                  <div>
                    <strong>Alice:</strong> {aliceAccount.address}
                  </div>
                  <div>
                    <strong>Bob:</strong> {bobAccount.address}
                  </div>
                </div>
              )}
            </div>
          }
          resultData={
            aliceAccount && bobAccount
              ? { alice: aliceAccount.address, bob: bobAccount.address }
              : null
          }
          resultLabel="Account Addresses"
          useSideBySide={true}
          theme="dracula"
          isSuccess={currentStep >= 2}
        />
      </GreyBoarderWhiteBgContainer>

      {/* Step 2: Create Access Control Conditions */}
      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>
          Step 2: Set Access Control Conditions
          {currentStep >= 3 && (
            <span style={{ color: "green", marginLeft: "10px" }}>✓</span>
          )}
        </h2>
        <p style={pageStyles.p}>
          Access control conditions define who can decrypt your data. In this
          example, we'll create a simple condition that only allows Bob's wallet
          to decrypt the message.
        </p>

        <p style={pageStyles.p}>
          You can explore the different types of access control conditions in
          the{" "}
          <Link
            to="/encryption/overview"
            style={{ color: "#3b82f6", textDecoration: "underline" }}
          >
            Access Control Conditions
          </Link>{" "}
          section.
        </p>

        <DisplayCode
          code={accessControlCode}
          language="typescript"
          renderComponent={
            <div>
              <button
                onClick={createAccessControlConditions}
                disabled={isCreatingConditions || !aliceAccount}
                style={{
                  padding: "12px 20px",
                  backgroundColor: isCreatingConditions
                    ? "#f8fafc"
                    : currentStep >= 3
                    ? "#22c55e"
                    : !aliceAccount
                    ? "#9ca3af"
                    : "#3b82f6",
                  color: isCreatingConditions ? "#374151" : "white",
                  border: isCreatingConditions ? "1px solid #d1d5db" : "none",
                  borderRadius: "6px",
                  cursor:
                    isCreatingConditions || !aliceAccount
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: "500",
                  fontSize: "14px",
                }}
              >
                {isCreatingConditions
                  ? "Creating Conditions..."
                  : currentStep >= 3
                  ? "✓ Conditions Created"
                  : "Create Access Control Conditions"}
              </button>

              {humanizedConditions && (
                <div
                  style={{
                    marginTop: "15px",
                    padding: "10px",
                    backgroundColor: "#f3f4f6",
                    borderRadius: "5px",
                    fontSize: "14px",
                  }}
                >
                  <strong>Condition:</strong> {humanizedConditions}
                </div>
              )}
            </div>
          }
          resultData={accessControlConditions}
          resultLabel="Access Control Conditions"
          useSideBySide={true}
          theme="dracula"
          isSuccess={currentStep >= 3}
        />
      </GreyBoarderWhiteBgContainer>

      {/* Step 3: Encrypt Message */}
      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>
          Step 3: Encrypt the Message
          {currentStep >= 4 && (
            <span style={{ color: "green", marginLeft: "10px" }}>✓</span>
          )}
        </h2>
        <p style={pageStyles.p}>
          Now Alice will encrypt a message using the access control conditions.
        </p>

        <NoteCallout
          variant="info"
          message={
            <>
              Notice how Alice doesn't need to authenticate with the Lit network
              to encrypt data. This is because encryption is done entirely
              client-side using the Lit networks public BLS key made available
              through the Lit Client.
            </>
          }
        />

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}
          >
            Message to encrypt:
          </label>
          <input
            type="text"
            value={messageToEncrypt}
            onChange={(e) => setMessageToEncrypt(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #d1d5db",
              borderRadius: "5px",
              fontSize: "14px",
            }}
            placeholder="Enter your message"
          />
        </div>

        <DisplayCode
          code={encryptCode}
          language="typescript"
          renderComponent={
            <div>
              <button
                onClick={encryptMessage}
                disabled={isEncrypting || !accessControlConditions}
                style={{
                  padding: "12px 20px",
                  backgroundColor: isEncrypting
                    ? "#f8fafc"
                    : currentStep >= 4
                    ? "#22c55e"
                    : !accessControlConditions
                    ? "#9ca3af"
                    : "#3b82f6",
                  color: isEncrypting ? "#374151" : "white",
                  border: isEncrypting ? "1px solid #d1d5db" : "none",
                  borderRadius: "6px",
                  cursor:
                    isEncrypting || !accessControlConditions
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: "500",
                  fontSize: "14px",
                }}
              >
                {isEncrypting
                  ? "Encrypting..."
                  : currentStep >= 4
                  ? "✓ Message Encrypted"
                  : "Encrypt Message"}
              </button>

              {encryptedData && (
                <div style={{ marginTop: "15px", fontSize: "14px" }}>
                  <strong>Encrypted data size:</strong>{" "}
                  {JSON.stringify(encryptedData).length} characters
                </div>
              )}
            </div>
          }
          resultData={encryptedData}
          resultLabel="Encryption Result"
          useSideBySide={true}
          theme="dracula"
          isSuccess={currentStep >= 4}
        />
      </GreyBoarderWhiteBgContainer>

      {/* Step 4: Create Bob's Authentication */}
      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>
          Step 4: Create Authentication Context
          {currentStep >= 5 && (
            <span style={{ color: "green", marginLeft: "10px" }}>✓</span>
          )}
        </h2>
        <p style={pageStyles.p}>
          Before Bob can decrypt the message, he needs to authenticate with the
          Lit network, proving he controls the wallet address specified in the
          access control conditions.
        </p>

        <DisplayCode
          code={authCode}
          language="typescript"
          renderComponent={
            <div>
              <button
                onClick={createBobAuth}
                disabled={isCreatingAuth || !encryptedData}
                style={{
                  padding: "12px 20px",
                  backgroundColor: isCreatingAuth
                    ? "#f8fafc"
                    : currentStep >= 5
                    ? "#22c55e"
                    : !encryptedData
                    ? "#9ca3af"
                    : "#3b82f6",
                  color: isCreatingAuth ? "#374151" : "white",
                  border: isCreatingAuth ? "1px solid #d1d5db" : "none",
                  borderRadius: "6px",
                  cursor:
                    isCreatingAuth || !encryptedData
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: "500",
                  fontSize: "14px",
                }}
              >
                {isCreatingAuth
                  ? "Creating Authentication..."
                  : currentStep >= 5
                  ? "✓ Authentication Created"
                  : "Create Bob's Authentication"}
              </button>

              {bobAuthContext && (
                <div style={{ marginTop: "15px", fontSize: "14px" }}>
                  <strong>✓ Bob is now authenticated and can decrypt</strong>
                </div>
              )}
            </div>
          }
          resultData={bobAuthContext}
          resultLabel="Authentication Result"
          useSideBySide={true}
          theme="dracula"
          isSuccess={currentStep >= 5}
        />
      </GreyBoarderWhiteBgContainer>

      {/* Step 5: Decrypt Message */}
      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>
          Step 5: Decrypt the Message
          {decryptedData && (
            <span style={{ color: "green", marginLeft: "10px" }}>✓</span>
          )}
        </h2>
        <p style={pageStyles.p}>
          Bob can decrypt the message. The Lit network will verify that Bob's
          authentication satisfies the access control conditions before allowing
          decryption before returning the decryption shares which are combined
          locally and used to decrypt the message.
        </p>

        <DisplayCode
          code={decryptCode}
          language="typescript"
          renderComponent={
            <div>
              <button
                onClick={decryptMessage}
                disabled={isDecrypting || !bobAuthContext}
                style={{
                  padding: "12px 20px",
                  backgroundColor: isDecrypting
                    ? "#f8fafc"
                    : decryptedData
                    ? "#22c55e"
                    : !bobAuthContext
                    ? "#9ca3af"
                    : "#3b82f6",
                  color: isDecrypting ? "#374151" : "white",
                  border: isDecrypting ? "1px solid #d1d5db" : "none",
                  borderRadius: "6px",
                  cursor:
                    isDecrypting || !bobAuthContext ? "not-allowed" : "pointer",
                  fontWeight: "500",
                  fontSize: "14px",
                }}
              >
                {isDecrypting
                  ? "Decrypting..."
                  : decryptedData
                  ? "✓ Message Decrypted"
                  : "Decrypt Message"}
              </button>

              {decryptedData && (
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
                  <strong>🎉 Decrypted message:</strong> "{decryptedData}"
                </div>
              )}
            </div>
          }
          resultData={decryptedData || null}
          resultLabel="Decryption Result"
          useSideBySide={true}
          theme="dracula"
          isSuccess={!!decryptedData}
        />
      </GreyBoarderWhiteBgContainer>

      {/* Summary */}
      {decryptedData && (
        <GreyBoarderWhiteBgContainer>
          <h2 style={pageStyles.h2}>🎉 Congratulations!</h2>
          <p style={pageStyles.p}>
            You've successfully completed the full encryption and decryption
            flow with Lit Protocol!
          </p>
          <p style={pageStyles.p}>Here's what happened:</p>
          <ol style={pageStyles.ol}>
            <li style={pageStyles.li}>
              Alice created Access Control Conditions specifying only Bob's
              address can decrypt the message
            </li>
            <li style={pageStyles.li}>
              Alice encrypted her message using the Lit networks' public BLS key
            </li>
            <li style={pageStyles.li}>
              Bob authenticated with the Lit network using his wallet and the{" "}
              <code>createEoaAuthContext</code> method
            </li>
            <li style={pageStyles.li}>
              Bob's Auth Context successfully fulfilled the Access Control
              Conditions, and each Lit node returned a key share for the
              decryption key which was combined locally to decrypt the message
            </li>
          </ol>
        </GreyBoarderWhiteBgContainer>
      )}

      {decryptedData && (
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
                title: "Access Control Conditions",
                description:
                  "Now that you've seen the basics of encryption and access control, you can learn more about how to create more complex access control conditions in the Access Control Conditions section",
                path: "/encryption/overview",
                color: "#3b82f6",
              },
              {
                title: "Programmable Key Pairs (PKPs)",
                description:
                  "Continue learning and checkout the Programmable Key Pairs guide to learn how to create and manage blockchain accounts with programmable conditions",
                path: "/building-with-lit/first-request/pkp-signing",
                color: "#8b5cf6",
              },
              {
                title: "Lit Actions",
                description:
                  "Continue learning and checkout the Lit Actions guide to learn how to build serverless functions with access to on-chain and off-chain data",
                path: "/building-with-lit/first-request/lit-action-execution",
                color: "#f59e0b",
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

export default EncryptionAndAccessControl;
