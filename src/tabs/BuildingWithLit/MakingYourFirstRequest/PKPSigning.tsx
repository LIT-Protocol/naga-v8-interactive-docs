/**
 * PKPSigning.tsx
 *
 * A beginner-friendly guide to PKP signing with Lit Protocol.
 * Part of the "Making Your First Request" tutorial series.
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { sepolia } from "viem/chains";
import GreyBoarderWhiteBgContainer from "../../../components/layout/GreyboardWhiteBgContainer";
import { DisplayCode } from "../../../components/DisplayCode";
import { NoteCallout, RequiredPackages } from "../../../components/common";
import AccountMethodSelector, {
  AccountMethod,
  CREATE_ACCOUNT_PRIVATE_KEY_CODE,
  CREATE_ACCOUNT_WALLET_CLIENT_CODE,
} from "../../../components/common/AccountMethodSelector";
import SimplePkpSelection from "../../../components/common/PkpSelectionComponentSimplified";
import { pageStyles } from "../../../styles/pageStyles";
import { useAppContext } from "../../../router";

const PKPSigning: React.FC = () => {
  const { areDependenciesLoaded, assertDependenciesLoaded, showError } =
    useAppContext();

  // State for authentication
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userAccount, setUserAccount] = useState<any>(null);
  const [accountMethod, setAccountMethod] =
    useState<AccountMethod>("walletClient");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [authData, setAuthData] = useState<any>(null);

  // State for PKP
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pkpInfo, setPkpInfo] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pkpAuthContext, setPkpAuthContext] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pkpViemAccount, setPkpViemAccount] = useState<any>(null);

  // State for signing
  const [transactionHash, setTransactionHash] = useState<string>("");

  // State for loading states
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isCreatingAuthContext, setIsCreatingAuthContext] = useState(false);
  const [isCreatingViemAccount, setIsCreatingViemAccount] = useState(false);
  const [isSigningTransaction, setIsSigningTransaction] = useState(false);

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

  interface PKPInfo {
    tokenId: string;
    publicKey: string;
    ethAddress: string;
    pubkey?: string;
  }

  const handlePkpSelected = (pkpInfo: PKPInfo) => {
    setPkpInfo(pkpInfo);
    setCurrentStep(4);
  };

  const createPKPAuthContext = async () => {
    if (!authData || !pkpInfo) {
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

      const authContext = await authManager.createPkpAuthContext({
        authData: authData,
        pkpPublicKey: pkpInfo.pubkey || pkpInfo.publicKey,
        authConfig: {
          resources: [
            ["pkp-signing", "*"],
            ["lit-action-execution", "*"],
          ],
          capabilityAuthSigs: [],
          expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
          statement: "Sign transactions with my PKP",
          domain: window.location.host,
        },
        litClient,
      });

      setPkpAuthContext(authContext);
      setCurrentStep(5);
    } catch (error) {
      showError?.(`Failed to create PKP auth context: ${error}`);
    } finally {
      setIsCreatingAuthContext(false);
    }
  };

  const createPKPViemAccount = async () => {
    if (!pkpAuthContext) {
      showError?.("Please complete previous steps first");
      return;
    }

    if (!areDependenciesLoaded()) {
      showError?.("Please complete the prerequisites first");
      return;
    }

    setIsCreatingViemAccount(true);
    try {
      const { litClient } = assertDependenciesLoaded();

      const viemAccount = await litClient.getPkpViemAccount({
        pkpPublicKey: pkpAuthContext.pkpPublicKey,
        authContext: pkpAuthContext,
        chainConfig: sepolia,
      });

      setPkpViemAccount(viemAccount);
      setCurrentStep(6);
    } catch (error) {
      showError?.(`Failed to create PKP viem account: ${error}`);
    } finally {
      setIsCreatingViemAccount(false);
    }
  };

  const signTransaction = async () => {
    if (!pkpViemAccount) {
      showError?.("Please complete all previous steps first");
      return;
    }

    setIsSigningTransaction(true);
    try {
      const { createWalletClient, http, parseEther } = await import("viem");

      const walletClient = createWalletClient({
        account: pkpViemAccount,
        chain: sepolia,
        transport: http(),
      });

      const hash = await walletClient.sendTransaction({
        account: pkpViemAccount,
        to: pkpViemAccount.address, // Self-transfer
        value: parseEther("0.001"),
      });

      setTransactionHash(hash);
    } catch (error) {
      showError?.(`Failed to sign transaction: ${error}`);
    } finally {
      setIsSigningTransaction(false);
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

  const mintCode = `// PKP Selection Component - can either select existing or mint new
<SimplePkpSelection
  authData={authData}
  onPkpSelected={(pkpInfo) => {
    // Handle selected PKP
    console.log("Selected PKP:", pkpInfo);
  }}
  setStatus={setStatus}
  assertDependenciesLoaded={assertDependenciesLoaded}
  showError={showError}
  authMethodName="EOA Auth"
  disabled={!authData}
/>`;

  const authContextCode = `// Create PKP authentication context
const authContext = await authManager.createPkpAuthContext({
  authData: authData,
  pkpPublicKey: pkpInfo.pubkey,
  authConfig: {
    resources: [
      ['pkp-signing', '*'],
      ['lit-action-execution', '*'],
    ],
    capabilityAuthSigs: [],
    expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    statement: 'Sign transactions with my PKP',
    domain: window.location.host,
  },
  litClient,
});`;

  const viemAccountCode = `import { sepolia } from "viem/chains";

// Create a viem-compatible account from the PKP
const pkpViemAccount = await litClient.getPkpViemAccount({
  pkpPublicKey: authContext.pkpPublicKey,
  authContext: authContext,
  chainConfig: sepolia,
});

console.log("PKP Address:", pkpViemAccount.address);`;

  const transactionCode = `import { createWalletClient, http, parseEther } from "viem";

// Create a wallet client with the PKP account
const walletClient = createWalletClient({
  account: pkpViemAccount,
  chain: sepolia,
  transport: http(),
});

// Send a transaction using the PKP
const hash = await walletClient.sendTransaction({
  account: pkpViemAccount,
  to: pkpViemAccount.address, // Self-transfer
  value: parseEther("0.001"),
});`;

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>PKP Signing</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Intro</h2>
        <p style={pageStyles.p}>
          In this guide, you'll learn how to create and use Programmable Key
          Pairs (PKPs) to sign transactions on Ethereum. PKPs are non-custodial
          blockchain accounts that support social login and can be programmed to
          sign based on custom conditions to support automated or delegated
          workflows.
        </p>

        <p style={pageStyles.p}>
          You can learn more about PKPs in the{" "}
          <Link
            to="/programmable-keys/overview"
            style={{ color: "#3b82f6", textDecoration: "underline" }}
          >
            Programmable Keys
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
              🔑 Non-Custodial Accounts
            </h4>
            <p
              style={{
                margin: "0",
                fontSize: "0.9rem",
                lineHeight: "1.5",
                color: "#4b5563",
              }}
            >
              Programmable Key Pairs (PKPs) are fully functional blockchain
              accounts with addresses and the ability to sign transactions, just
              like traditional wallets. But unlike traditional accounts, they're
              controlled by programmable rules instead of user-held private
              keys.
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
              🤖 Programmable Signing
            </h4>
            <p
              style={{
                margin: "0",
                fontSize: "0.9rem",
                lineHeight: "1.5",
                color: "#4b5563",
              }}
            >
              Define custom logic for when and how transactions should be
              signed. Enable automation, multi-party approval workflows, or
              conditional signing based on on-chain or off-chain data.
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
              🔗 Multi-Chain Support
            </h4>
            <p
              style={{
                margin: "0",
                fontSize: "0.9rem",
                lineHeight: "1.5",
                color: "#4b5563",
              }}
            >
              A single PKP can sign transactions on multiple blockchains,
              providing a unified account across different networks without
              needing separate private keys.
            </p>
          </div>
        </div>

        <p style={pageStyles.p}>
          The result is a flexible and powerful way to manage blockchain
          accounts controlled by your application logic. With PKPs, there's no
          need to manage or expose private keys, and users can even create
          accounts using familiar Web2 login methods like Google or Discord,
          simplifying onboarding and making secure, programmable signing
          accessible to anyone.
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
              "Provides authentication methods and the Auth Manager for creating authentication contexts.",
          },
          {
            name: "@lit-protocol/lit-client",
            description:
              "The Lit Client needed to communicate with the Lit network and manage PKPs.",
          },
          {
            name: "viem",
            description:
              "Modern Ethereum library for building wallets, dApps and other Ethereum powered tools with TypeScript support.",
          },
        ]}
        installationCode="npm install @lit-protocol/auth @lit-protocol/lit-client viem"
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
            ? "Convert your private key to a viem account object that can be used to authenticate and mint a PKP."
            : "Use your connected wallet account to authenticate and mint a PKP."}
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
                createAccount: "pkp-create-account",
                getWalletAccount: "pkp-get-wallet-account",
              }}
              successActions={successActions}
            />
          }
          resultData={userAccount}
          resultLabel="User Account"
          useSideBySide={true}
          theme="dracula"
          isSuccess={
            successActions.has("pkp-create-account") ||
            successActions.has("pkp-get-wallet-account")
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
          Next, we'll authenticate the user account to prove ownership - This
          authentication data will be used to mint and control the PKP.
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

      {/* Step 3: Mint PKP */}
      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>
          Step 3: Mint PKP
          {currentStep >= 4 && (
            <span style={{ color: "green", marginLeft: "10px" }}>✓</span>
          )}
        </h2>
        <p style={pageStyles.p}>
          Now we'll mint a new PKP using the authentication data - The PKP will
          be associated with the user account and only the authenticated user
          will be able to make signing requests using the PKP.
        </p>

        <NoteCallout
          message={
            <>
              <p style={pageStyles.p}>
                PKP minting requires <code>$LITKEY</code> test tokens to pay for
                minting the PKP and gas fees.
              </p>

              <p style={pageStyles.p}>
                For the Naga-dev network, you can get <code>$LITKEY</code> test
                tokens from the{" "}
                <a
                  href="https://chronicle-yellowstone-faucet.getlit.dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#007bff", textDecoration: "underline" }}
                >
                  Yellowstone Faucet
                </a>
                .
              </p>

              {userAccount && (userAccount.account || userAccount.address) && (
                <>
                  <p style={pageStyles.p}>
                    <strong>User Address:</strong>{" "}
                    {userAccount.account?.address || userAccount.address}
                  </p>
                </>
              )}
            </>
          }
          variant="note"
          title="Tip"
          style={{ marginTop: "16px" }}
        />

        <DisplayCode
          code={mintCode}
          language="javascript"
          renderComponent={
            <SimplePkpSelection
              authData={authData}
              onPkpSelected={handlePkpSelected}
              setStatus={() => {}} // Status is handled by the component internally
              assertDependenciesLoaded={assertDependenciesLoaded}
              showError={showError}
              authMethodName="EOA Auth"
              disabled={!authData}
            />
          }
          resultData={pkpInfo}
          resultLabel="PKP Information"
          useSideBySide={true}
          theme="dracula"
          isSuccess={currentStep >= 4}
        />
      </GreyBoarderWhiteBgContainer>

      {/* Step 4: Create PKP Auth Context */}
      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>
          Step 4: Create PKP Auth Context
          {currentStep >= 5 && (
            <span style={{ color: "green", marginLeft: "10px" }}>✓</span>
          )}
        </h2>
        <p style={pageStyles.p}>
          Next, we'll create an Auth Context for the PKP, allowing us to
          interact with the Lit network and making signing requests using the
          PKP.
        </p>

        <DisplayCode
          code={authContextCode}
          language="typescript"
          renderComponent={
            <div>
              <button
                onClick={createPKPAuthContext}
                disabled={isCreatingAuthContext || !pkpInfo}
                style={{
                  padding: "12px 20px",
                  backgroundColor: isCreatingAuthContext
                    ? "#f8fafc"
                    : currentStep >= 5
                    ? "#22c55e"
                    : !pkpInfo
                    ? "#9ca3af"
                    : "#3b82f6",
                  color: isCreatingAuthContext ? "#374151" : "white",
                  border: isCreatingAuthContext ? "1px solid #d1d5db" : "none",
                  borderRadius: "6px",
                  cursor:
                    isCreatingAuthContext || !pkpInfo
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: "500",
                  fontSize: "14px",
                }}
              >
                {isCreatingAuthContext
                  ? "Creating Auth Context..."
                  : currentStep >= 5
                  ? "✓ Auth Context Created"
                  : "Create PKP Auth Context"}
              </button>

              {pkpAuthContext && (
                <div style={{ marginTop: "15px", fontSize: "14px" }}>
                  <strong>✓ PKP auth context created successfully</strong>
                </div>
              )}
            </div>
          }
          resultData={pkpAuthContext}
          resultLabel="PKP Auth Context"
          useSideBySide={true}
          theme="dracula"
          isSuccess={currentStep >= 5}
        />
      </GreyBoarderWhiteBgContainer>

      {/* Step 5: Create PKP Viem Account */}
      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>
          Step 5: Create PKP Viem Account
          {currentStep >= 6 && (
            <span style={{ color: "green", marginLeft: "10px" }}>✓</span>
          )}
        </h2>
        <p style={pageStyles.p}>
          Using the <code>getPkpViemAccount</code> method, we can create a Viem
          compatible account using the PKP as the signer. This account can be
          used with standard Ethereum tooling and libraries like Viem to sign
          transactions like a regular EOA wallet.
        </p>

        <DisplayCode
          code={viemAccountCode}
          language="typescript"
          renderComponent={
            <div>
              <button
                onClick={createPKPViemAccount}
                disabled={isCreatingViemAccount || !pkpAuthContext}
                style={{
                  padding: "12px 20px",
                  backgroundColor: isCreatingViemAccount
                    ? "#f8fafc"
                    : currentStep >= 6
                    ? "#22c55e"
                    : !pkpAuthContext
                    ? "#9ca3af"
                    : "#3b82f6",
                  color: isCreatingViemAccount ? "#374151" : "white",
                  border: isCreatingViemAccount ? "1px solid #d1d5db" : "none",
                  borderRadius: "6px",
                  cursor:
                    isCreatingViemAccount || !pkpAuthContext
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: "500",
                  fontSize: "14px",
                }}
              >
                {isCreatingViemAccount
                  ? "Creating Viem Account..."
                  : currentStep >= 6
                  ? "✓ Viem Account Created"
                  : "Create PKP Viem Account"}
              </button>

              {pkpViemAccount && (
                <div style={{ marginTop: "15px", fontSize: "14px" }}>
                  <div>
                    <strong>PKP Address:</strong> {pkpViemAccount.address}
                  </div>
                  <div>
                    <strong>Account Type:</strong> {pkpViemAccount.type}
                  </div>
                </div>
              )}
            </div>
          }
          resultData={
            pkpViemAccount
              ? {
                  address: pkpViemAccount.address,
                  type: pkpViemAccount.type,
                }
              : null
          }
          resultLabel="PKP Viem Account"
          useSideBySide={true}
          theme="dracula"
          isSuccess={currentStep >= 6}
        />
      </GreyBoarderWhiteBgContainer>

      {/* Step 6: Sign Transaction */}
      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>
          Step 6: Sign Transaction
          {transactionHash && (
            <span style={{ color: "green", marginLeft: "10px" }}>✓</span>
          )}
        </h2>
        <p style={pageStyles.p}>
          Finally, we'll use the Viem PKP account to sign and send a transaction
          on the Ethereum Sepolia testnet.
        </p>

        <NoteCallout
          variant="info"
          message={
            <>
              <p style={pageStyles.p}>
                This example sends a transaction on Sepolia testnet, make sure
                the PKP has enough Sepolia ETH to pay for the transaction before
                signing and sending it.
              </p>
              {pkpViemAccount && pkpViemAccount.address && (
                <>
                  <p style={pageStyles.p}>
                    <strong>PKP Address:</strong> {pkpViemAccount.address}
                  </p>
                </>
              )}
              <p style={pageStyles.p}>
                You can get test ETH from a{" "}
                <a
                  href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#3b82f6", textDecoration: "underline" }}
                >
                  Sepolia faucet
                </a>
                .
              </p>
            </>
          }
        />

        <DisplayCode
          code={transactionCode}
          language="typescript"
          renderComponent={
            <div>
              <button
                onClick={signTransaction}
                disabled={isSigningTransaction || !pkpViemAccount}
                style={{
                  padding: "12px 20px",
                  backgroundColor: isSigningTransaction
                    ? "#f8fafc"
                    : transactionHash
                    ? "#22c55e"
                    : !pkpViemAccount
                    ? "#9ca3af"
                    : "#3b82f6",
                  color: isSigningTransaction ? "#374151" : "white",
                  border: isSigningTransaction ? "1px solid #d1d5db" : "none",
                  borderRadius: "6px",
                  cursor:
                    isSigningTransaction || !pkpViemAccount
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: "500",
                  fontSize: "14px",
                }}
              >
                {isSigningTransaction
                  ? "Signing Transaction..."
                  : transactionHash
                  ? "✓ Transaction Signed"
                  : "Sign & Send Transaction"}
              </button>

              {transactionHash && (
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
                  <div>
                    <strong>🎉 Transaction sent successfully!</strong>
                  </div>
                  <div style={{ marginTop: "8px", wordBreak: "break-all" }}>
                    <strong>Hash:</strong> {transactionHash}
                  </div>
                  <div style={{ marginTop: "8px" }}>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#3b82f6",
                        textDecoration: "underline",
                      }}
                    >
                      View on Etherscan →
                    </a>
                  </div>
                </div>
              )}
            </div>
          }
          resultData={transactionHash || null}
          resultLabel="Transaction Result"
          useSideBySide={true}
          theme="dracula"
          isSuccess={!!transactionHash}
        />
      </GreyBoarderWhiteBgContainer>

      {/* Summary */}
      {transactionHash && (
        <GreyBoarderWhiteBgContainer>
          <h2 style={pageStyles.h2}>🎉 Congratulations!</h2>
          <p style={pageStyles.p}>
            You've successfully completed the full PKP signing flow with Lit
            Protocol!
          </p>
          <p style={pageStyles.p}>Here's what happened:</p>
          <ol style={pageStyles.ol}>
            <li style={pageStyles.li}>
              Created a user account and authenticated with the Lit network
            </li>
            <li style={pageStyles.li}>
              Minted or used an existing PKP controlled by the user account
            </li>
            <li style={pageStyles.li}>
              Created an Auth Context for the PKP with signing permissions
            </li>
            <li style={pageStyles.li}>
              Generated a Viem compatible account from the PKP
            </li>
            <li style={pageStyles.li}>
              Used the Viem account to sign and send a transaction on Ethereum
              Sepolia
            </li>
          </ol>
        </GreyBoarderWhiteBgContainer>
      )}

      {transactionHash && (
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
                title: "Advanced PKP Features",
                description:
                  "Explore advanced PKP capabilities like conditional signing, multi-party approval, and cross-chain operations in the PKP guides.",
                path: "/programmable-keys/pkps/getting-started",
                color: "#8b5cf6",
              },
              {
                title: "Lit Actions",
                description:
                  "Continue learning and checkout the Lit Actions guide to learn how to build serverless functions with access to on-chain and off-chain data",
                path: "/lit-actions/overview",
                color: "#f59e0b",
              },
              {
                title: "Encryption & Access Control",
                description:
                  "Learn to encrypt data and create access control conditions",
                path: "/encryption-access-control/overview",
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

export default PKPSigning;
