/**
 * PKPViemAccountTab Component
 *
 * Demonstrates how to use PKP as a Viem account for modern Ethereum interactions.
 * This tab showcases the integration patterns for signing messages and sending transactions.
 */

import { useState } from "react";
import { useWalletClient } from "wagmi";
import { DisplayCode } from "../../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../../components/layout/GreyboardWhiteBgContainer";
import { useAppContext } from "../../router";
import { SUPPORTED_CHAINS } from "../../components/lit-logged-page/protectedApp/utils/chains";
import AccountMethodSelector, {
  AccountMethod,
  CREATE_ACCOUNT_PRIVATE_KEY_CODE,
  CREATE_ACCOUNT_WALLET_CLIENT_CODE,
} from "../../components/common/AccountMethodSelector";
import PkpSelectionComponent from "../../components/common/PkpSelectionComponent";

const AUTH_NAME = "PKP Viem Account Integration";

// Configuration constants
const DEFAULT_MESSAGE = "Hello from PKP Viem Account! 🔐";
const DEFAULT_RECIPIENT = "0x742d35Cc6346C4C32094C5d85F46EEe0B9dd2c25";
const DEFAULT_AMOUNT = "0.001";
const FAUCET_URL = "https://chronicle-yellowstone-faucet.getlit.dev/";

// Code snippets for each functionality
const AUTHENTICATE_PRIVATE_KEY_CODE = `
import { ViemAccountAuthenticator } from '@lit-protocol/auth';

const authData = await ViemAccountAuthenticator.authenticate(myAccount);`;

const AUTHENTICATE_WALLET_CLIENT_CODE = `
import { WalletClientAuthenticator } from '@lit-protocol/auth';

const authData = await WalletClientAuthenticator.authenticate(walletClient);`;

const MINT_PKP_CODE = `
const mintedPkpWithEoaAuth = await litClient.mintWithAuth({
  account: myAccount, // or walletClient depending on method
  authData: authData,
  scopes: ['sign-anything'],
});`;

const CREATE_AUTH_CONTEXT_CODE = `
const authContext = await authManager.createPkpAuthContext({
  authData: authData, // <-- Retrieved earlier
  pkpPublicKey: pkpInfo.pubkey, // <-- Minted earlier
  authConfig: {
    resources: [
      ["pkp-signing", "*"],
      ["lit-action-execution", "*"],
    ],
    capabilityAuthSigs: [],
    expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    statement: "",
    domain: window.location.origin,
  },
  litClient: litClient,
});`;

const GET_PKP_VIEM_ACCOUNT_CODE = `
// Get PKP as a viem account
const pkpViemAccount = await litClient.getPkpViemAccount({
  pkpPublicKey: pkpInfo.pubkey,
  authContext: authContext,
  chainConfig: chainConfig, // viem chain configuration
});

// Now you can use pkpViemAccount like any viem account
console.log("PKP Address:", pkpViemAccount.address);`;

const SIGN_MESSAGE_CODE = `
// Sign a message using PKP Viem Account
const signature = await pkpViemAccount.signMessage({
  message: "Hello from PKP!",
});

console.log("Signature:", signature);`;

const SEND_TRANSACTION_CODE = `
import { createWalletClient, http, parseEther } from "viem";

// Create wallet client with PKP account
const walletClient = createWalletClient({
  account: pkpViemAccount,
  chain: chainConfig,
  transport: http(chainRpcUrl),
});

// Send transaction
const hash = await walletClient.sendTransaction({
  account: pkpViemAccount,
  chain: chainConfig,
  to: recipientAddress,
  value: parseEther(amount),
});

console.log("Transaction hash:", hash);`;

const CHAIN_CONFIG_CODE = `
// Create custom chain config for viem
const chainConfig = {
  id: 175188,
  name: "Chronicle Yellowstone",
  network: "chronicle-yellowstone",
  nativeCurrency: {
    name: "Test LIT",
    symbol: "LIT",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://yellowstone-rpc.litprotocol.com"],
    },
    public: {
      http: ["https://yellowstone-rpc.litprotocol.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Chronicle Yellowstone Explorer",
      url: "https://yellowstone-explorer.litprotocol.com",
    },
  },
};`;

export default function PKPViemAccountTab() {
  const { data: walletClient } = useWalletClient();
  const {
    getDependencyStatus,
    areDependenciesLoaded,
    authContext,
    setAuthContext,
    setStatus,
    assertDependenciesLoaded,
    showError,
  } = useAppContext();

  // Auth flow state
  const [accountMethod, setAccountMethod] =
    useState<AccountMethod>("walletClient");
  const [account, setAccount] = useState<any>(null);
  const [authData, setAuthData] = useState<any>(null);
  const [pkpInfo, setPkpInfo] = useState<any>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isCreatingAuthContext, setIsCreatingAuthContext] = useState(false);

  // PKP Viem Account state
  const [selectedChain, setSelectedChain] = useState<string>(
    "chronicle-yellowstone"
  );
  const [pkpViemAccount, setPkpViemAccount] = useState<any>(null);
  const [messageToSign, setMessageToSign] = useState(DEFAULT_MESSAGE);
  const [recipientAddress, setRecipientAddress] = useState(DEFAULT_RECIPIENT);
  const [sendAmount, setSendAmount] = useState(DEFAULT_AMOUNT);

  // Loading states
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isSigningMessage, setIsSigningMessage] = useState(false);
  const [isSendingTransaction, setIsSendingTransaction] = useState(false);

  // Results
  const [signedMessage, setSignedMessage] = useState<any>(null);
  const [transactionResult, setTransactionResult] = useState<any>(null);

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

  // Utility function to format error messages
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

      let authDataResult;
      if (accountMethod === "privateKey") {
        const { ViemAccountAuthenticator } = await import("@lit-protocol/auth");
        authDataResult = await ViemAccountAuthenticator.authenticate(account);
      } else {
        const { WalletClientAuthenticator } = await import(
          "@lit-protocol/auth"
        );
        if (!walletClient) {
          throw new Error(
            "No wallet client available. Please connect your wallet."
          );
        }
        authDataResult = await WalletClientAuthenticator.authenticate(
          walletClient
        );
      }

      setAuthData(authDataResult);
      setStatus(
        `Successfully authenticated with EOA account using ${
          accountMethod === "privateKey" ? "private key" : "wallet client"
        }`
      );
      showSuccess("authenticate");
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

  const createAuthContext = async () => {
    try {
      setIsCreatingAuthContext(true);
      setStatus("Creating auth context...");

      const { authManager, litClient } = assertDependenciesLoaded();

      if (!pkpInfo) {
        setStatus("Cannot create auth context: Missing PKP.");
        return;
      }

      const authContextResult = await authManager.createPkpAuthContext({
        authData: authData,
        pkpPublicKey: pkpInfo.pubkey,
        authConfig: {
          capabilityAuthSigs: [],
          expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
          statement: "",
          domain: "",
          resources: [
            ["pkp-signing", "*"],
            ["lit-action-execution", "*"],
          ],
        },
        litClient: litClient,
      });

      console.log("authContext:", authContextResult);
      setAuthContext(authContextResult);
      setStatus("Auth context created successfully");
      showSuccess("create-auth-context");
    } catch (error: any) {
      console.error("Error creating auth context:", error);
      const errorMessage = formatErrorMessage(
        "Failed to create auth context: ",
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsCreatingAuthContext(false);
    }
  };

  const createPkpViemAccount = async () => {
    try {
      setIsCreatingAccount(true);
      setStatus("Creating PKP Viem account...");

      const { litClient } = assertDependenciesLoaded();

      if (!authContext?.authContext) {
        throw new Error(
          "No auth context available. Please complete steps 1-4 first."
        );
      }

      // Get the selected chain configuration
      const chainInfo =
        SUPPORTED_CHAINS[selectedChain as keyof typeof SUPPORTED_CHAINS];

      // Create chain config for viem
      const chainConfig = {
        id: chainInfo.id,
        name: chainInfo.name,
        network: chainInfo.litIdentifier,
        nativeCurrency: {
          name: chainInfo.name,
          symbol: chainInfo.symbol,
          decimals: 18,
        },
        rpcUrls: {
          default: {
            http: [chainInfo.rpcUrl],
          },
          public: {
            http: [chainInfo.rpcUrl],
          },
        },
        blockExplorers: {
          default: {
            name: `${chainInfo.name} Explorer`,
            url: chainInfo.explorerUrl,
          },
        },
      };

      // Get PKP as a viem account
      const viemAccount = await litClient.getPkpViemAccount({
        pkpPublicKey: authContext.pkpPublicKey,
        authContext: authContext.authContext,
        chainConfig: chainConfig,
      });

      setPkpViemAccount(viemAccount);
      setRecipientAddress(viemAccount.address); // Default to self
      setStatus(
        `PKP Viem account created successfully! Address: ${viemAccount.address}`
      );
      showSuccess("create-pkp-viem-account");
    } catch (error: any) {
      console.error("Error creating PKP Viem account:", error);
      const errorMessage = formatErrorMessage(
        "Failed to create PKP Viem account: ",
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const signMessage = async () => {
    try {
      setIsSigningMessage(true);
      setStatus("Signing message...");

      if (!pkpViemAccount || !messageToSign.trim()) {
        throw new Error("No PKP Viem account or message to sign");
      }

      const signature = await pkpViemAccount.signMessage({
        message: messageToSign,
      });

      setSignedMessage({
        message: messageToSign,
        signature,
        address: pkpViemAccount.address,
        timestamp: new Date().toISOString(),
      });

      setStatus("Message signed successfully!");
      showSuccess("sign-message");
    } catch (error: any) {
      console.error("Error signing message:", error);
      const errorMessage = formatErrorMessage(
        "Failed to sign message: ",
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsSigningMessage(false);
    }
  };

  const sendTransaction = async () => {
    try {
      setIsSendingTransaction(true);
      setStatus("Sending transaction...");

      if (!pkpViemAccount || !recipientAddress || !sendAmount) {
        throw new Error("Missing PKP account, recipient address, or amount");
      }

      // Get the selected chain configuration
      const chainInfo =
        SUPPORTED_CHAINS[selectedChain as keyof typeof SUPPORTED_CHAINS];

      // Create chain config for viem
      const chainConfig = {
        id: chainInfo.id,
        name: chainInfo.name,
        network: chainInfo.litIdentifier,
        nativeCurrency: {
          name: chainInfo.name,
          symbol: chainInfo.symbol,
          decimals: 18,
        },
        rpcUrls: {
          default: {
            http: [chainInfo.rpcUrl],
          },
          public: {
            http: [chainInfo.rpcUrl],
          },
        },
        blockExplorers: {
          default: {
            name: `${chainInfo.name} Explorer`,
            url: chainInfo.explorerUrl,
          },
        },
      };

      // Create wallet client with PKP account
      const { createWalletClient, http, parseEther } = await import("viem");

      const walletClient = createWalletClient({
        account: pkpViemAccount,
        chain: chainConfig,
        transport: http(chainInfo.rpcUrl),
      });

      // Send the transaction
      const hash = await walletClient.sendTransaction({
        account: pkpViemAccount,
        chain: chainConfig,
        to: recipientAddress as `0x${string}`,
        value: parseEther(sendAmount),
      });

      setTransactionResult({
        hash,
        to: recipientAddress,
        value: sendAmount,
        from: pkpViemAccount.address,
        timestamp: new Date().toISOString(),
        chainId: chainInfo.id,
        chainName: chainInfo.name,
        explorerUrl: chainInfo.explorerUrl,
      });

      setStatus("Transaction sent successfully!");
      showSuccess("send-transaction");
    } catch (error: any) {
      console.error("Error sending transaction:", error);
      const errorMessage = formatErrorMessage(
        "Failed to send transaction: ",
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsSendingTransaction(false);
    }
  };

  const chainInfo =
    SUPPORTED_CHAINS[selectedChain as keyof typeof SUPPORTED_CHAINS];

  return (
    <div className="tab-content">
      <h2>{AUTH_NAME}</h2>
      <p>
        The PKP Viem Account integration allows you to use your PKP
        (Programmable Key Pair) as a standard Viem account for modern Ethereum
        interactions. This provides a seamless way to integrate PKPs with the
        popular Viem library for signing messages and sending transactions.
      </p>
      <p>
        <strong>Complete Flow:</strong> This tab demonstrates the complete flow
        from authentication to PKP usage, including account creation,
        authentication, PKP minting, auth context creation, and finally using
        the PKP as a Viem account.
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

        {/* Faucet Information */}
        <div
          style={{
            marginTop: "15px",
            padding: "10px",
            backgroundColor: "#e8f4fd",
            borderRadius: "4px",
            border: "1px solid #b3d9ff",
          }}
        >
          <strong>💰 Need Test Tokens?</strong> Visit the{" "}
          <a
            href={FAUCET_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#0066cc", textDecoration: "underline" }}
          >
            Chronicle Yellowstone Faucet
          </a>{" "}
          to get test tokens for your EOA account.
        </div>

        {/* Chain Selection */}
        <div style={{ marginTop: "15px" }}>
          <label
            htmlFor="chain-select"
            style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}
          >
            Select Chain:
          </label>
          <select
            id="chain-select"
            value={selectedChain}
            onChange={(e) => setSelectedChain(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              fontSize: "14px",
            }}
          >
            {Object.entries(SUPPORTED_CHAINS).map(([key, chain]) => (
              <option key={key} value={key}>
                {chain.name} ({chain.symbol}) {chain.testnet ? "- Testnet" : ""}
              </option>
            ))}
          </select>
        </div>
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
                createAccount: "create-account",
                getWalletAccount: "get-wallet-account",
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
            successActions.has("create-account") ||
            successActions.has("get-wallet-account")
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
                  isAuthenticating || !account ? "#cccccc" : "#4285F4",
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
          isSuccess={successActions.has("authenticate")}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*               Mint PKP via EOA Auth              */}
        {/* ================================================ */}
        <PkpSelectionComponent
          authData={authData}
          account={account}
          walletClient={walletClient}
          accountMethod={accountMethod}
          onPkpSelected={setPkpInfo}
          setStatus={setStatus}
          assertDependenciesLoaded={assertDependenciesLoaded}
          showError={showError}
          authMethodName="EOA Auth"
          mintCodeSnippet={MINT_PKP_CODE}
          disabled={!authData || !account}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*               Create AuthContext                  */}
        {/* ================================================ */}
        <h3 style={{ marginTop: 0 }}>
          Step 4: Create AuthContext{" "}
          {!pkpInfo && (
            <span style={{ color: "orange" }}>(Select or mint PKP first)</span>
          )}
        </h3>
        <p>
          Use your newly minted PKP to create an AuthContext. This method will
          cache two things:
        </p>
        <ul>
          <li>
            session key pair - a temporary cryptographic key pair generated on
            the client side that acts as a temporary identity for the client
            application. It consists of:
            <ul>
              <li>A public key - shared with the Lit nodes</li>
              <li>A secret key (private key) - kept securely on the client</li>
            </ul>
          </li>
          <li>
            Delegation AuthSig aka. the inner auth sig - a cryptographic
            attestation from the Lit Protocol nodes that authorises your session
            key to act on behalf of your PKP.
          </li>
        </ul>

        <DisplayCode
          code={CREATE_AUTH_CONTEXT_CODE}
          language="typescript"
          renderComponent={
            <button
              onClick={createAuthContext}
              disabled={isCreatingAuthContext || !pkpInfo}
              style={{
                padding: "12px 20px",
                backgroundColor:
                  isCreatingAuthContext || !pkpInfo ? "#cccccc" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor:
                  isCreatingAuthContext || !pkpInfo ? "not-allowed" : "pointer",
                fontWeight: "500",
              }}
            >
              {isCreatingAuthContext
                ? "Creating..."
                : "Create AuthContext with EOA PKP"}
            </button>
          }
          resultData={authContext}
          resultLabel="AuthContext Information"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("create-auth-context")}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*            Create PKP Viem Account               */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>Step 5: Create PKP Viem Account</h3>
        <p>
          Convert your authenticated PKP into a Viem account object that can be
          used with the Viem library for signing and transactions.
        </p>

        <DisplayCode
          code={GET_PKP_VIEM_ACCOUNT_CODE}
          language="typescript"
          renderComponent={
            <button
              onClick={createPkpViemAccount}
              disabled={isCreatingAccount || !authContext}
              style={{
                padding: "10px 15px",
                backgroundColor:
                  isCreatingAccount || !authContext ? "#cccccc" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor:
                  isCreatingAccount || !authContext ? "not-allowed" : "pointer",
                fontWeight: "500",
              }}
            >
              {isCreatingAccount ? "Creating..." : "Create PKP Viem Account"}
              {!authContext && " (Complete steps 1-4 first)"}
            </button>
          }
          resultData={
            pkpViemAccount
              ? {
                  address: pkpViemAccount.address,
                  type: pkpViemAccount.type,
                  chain: chainInfo?.name,
                }
              : null
          }
          resultLabel="PKP Viem Account"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("create-pkp-viem-account")}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*               Sign Message                       */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>
          Step 6: Sign Message with PKP Viem Account
        </h3>
        <p>
          Use the PKP Viem account to sign messages, just like you would with
          any other Viem account.
        </p>

        <DisplayCode
          code={SIGN_MESSAGE_CODE}
          language="typescript"
          renderComponent={
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "500",
                }}
              >
                Message to Sign:
              </label>
              <textarea
                value={messageToSign}
                onChange={(e) => setMessageToSign(e.target.value)}
                placeholder="Enter message to sign..."
                disabled={!pkpViemAccount || isSigningMessage}
                style={{
                  width: "100%",
                  height: "80px",
                  padding: "8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "14px",
                  marginBottom: "12px",
                  resize: "vertical",
                }}
              />
              <button
                onClick={signMessage}
                disabled={
                  isSigningMessage || !pkpViemAccount || !messageToSign.trim()
                }
                style={{
                  padding: "10px 15px",
                  backgroundColor:
                    isSigningMessage || !pkpViemAccount || !messageToSign.trim()
                      ? "#cccccc"
                      : "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor:
                    isSigningMessage || !pkpViemAccount || !messageToSign.trim()
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: "500",
                }}
              >
                {isSigningMessage ? "Signing..." : "Sign Message"}
                {!pkpViemAccount && " (Create PKP Viem account first)"}
              </button>
            </div>
          }
          resultData={signedMessage}
          resultLabel="Signed Message Result"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("sign-message")}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*               Send Transaction                   */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>
          Step 7: Send Transaction with PKP Viem Account
        </h3>
        <p>
          Use the PKP Viem account with a Viem wallet client to send
          transactions on the blockchain.
        </p>

        <DisplayCode
          code={SEND_TRANSACTION_CODE}
          language="typescript"
          renderComponent={
            <div style={{ marginBottom: "16px" }}>
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                  }}
                >
                  Recipient Address:
                </label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="Recipient address (0x...)"
                  disabled={!pkpViemAccount || isSendingTransaction}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontFamily: "monospace",
                  }}
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                  }}
                >
                  Amount ({chainInfo?.symbol || "ETH"}):
                </label>
                <input
                  type="number"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder={`Amount in ${chainInfo?.symbol || "ETH"}`}
                  step="0.001"
                  min="0"
                  disabled={!pkpViemAccount || isSendingTransaction}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                />
              </div>

              <button
                onClick={sendTransaction}
                disabled={
                  isSendingTransaction ||
                  !pkpViemAccount ||
                  !recipientAddress ||
                  !sendAmount ||
                  parseFloat(sendAmount) <= 0
                }
                style={{
                  padding: "10px 15px",
                  backgroundColor:
                    isSendingTransaction ||
                    !pkpViemAccount ||
                    !recipientAddress ||
                    !sendAmount ||
                    parseFloat(sendAmount) <= 0
                      ? "#cccccc"
                      : "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor:
                    isSendingTransaction ||
                    !pkpViemAccount ||
                    !recipientAddress ||
                    !sendAmount ||
                    parseFloat(sendAmount) <= 0
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: "500",
                }}
              >
                {isSendingTransaction ? "Sending..." : "Send Transaction"}
                {!pkpViemAccount && " (Create PKP Viem account first)"}
              </button>
            </div>
          }
          resultData={transactionResult}
          resultLabel="Transaction Result"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("send-transaction")}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*               Chain Configuration                */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>Chain Configuration Example</h3>
        <p>
          Here's how to configure a custom chain for use with PKP Viem accounts.
          This example shows the Chronicle Yellowstone testnet configuration.
        </p>

        <DisplayCode
          code={CHAIN_CONFIG_CODE}
          language="typescript"
          renderComponent={
            <div
              style={{
                padding: "12px",
                backgroundColor: "#f3f4f6",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                color: "#374151",
              }}
            >
              <strong>Current Chain:</strong> {chainInfo?.name} (
              {chainInfo?.symbol})
              <br />
              <strong>Chain ID:</strong> {chainInfo?.id}
              <br />
              <strong>RPC URL:</strong> {chainInfo?.rpcUrl}
              <br />
              <strong>Explorer:</strong>{" "}
              <a
                href={chainInfo?.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#3b82f6", textDecoration: "underline" }}
              >
                {chainInfo?.explorerUrl}
              </a>
            </div>
          }
          resultData={null}
          useSideBySide={true}
          theme="dracula"
        />
      </GreyBoarderWhiteBgContainer>
    </div>
  );
}
