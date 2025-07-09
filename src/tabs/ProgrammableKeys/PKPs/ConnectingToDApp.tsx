import { useState } from "react";
import { useWalletClient } from "wagmi";
import PkpSelectionComponent from "../../../components/common/PkpSelectionComponent";
import AccountMethodSelector, {
  AccountMethod,
  CREATE_ACCOUNT_PRIVATE_KEY_CODE,
  CREATE_ACCOUNT_WALLET_CLIENT_CODE,
} from "../../../components/common/AccountMethodSelector";
import { DisplayCode } from "../../../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../../../components/layout/GreyboardWhiteBgContainer";
import { useAppContext } from "../../../router";
import { pageStyles } from "../../../styles/pageStyles";
import { NoteCallout } from "../../../components/common";
import { sepolia } from "viem/chains";

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
import { sepolia } from "viem/chains"; // or your preferred chain

// Get PKP as a viem account
const pkpViemAccount = await litClient.getPkpViemAccount({
  pkpPublicKey: pkpInfo.pubkey,
  authContext: authContext,
  chainConfig: sepolia,
});

console.log("PKP Address:", pkpViemAccount.address);
console.log("PKP Account Type:", pkpViemAccount.type);`;

const CHECK_BALANCE_CODE = `
import { createPublicClient, http, formatEther } from 'viem';
import { sepolia } from 'viem/chains'; // or your chosen chain

// Create a public client to read blockchain data
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

// Check PKP wallet balance
const balance = await publicClient.getBalance({
  address: pkpViemAccount.address,
});

console.log('Balance (wei):', balance);
console.log('Balance (ETH):', formatEther(balance));`;

const SIGN_MESSAGE_CODE = `
// Sign a message using the PKP Viem account
const message = "Hello from my PKP wallet!";

const signature = await pkpViemAccount.signMessage({
  message: message,
});

console.log("Message:", message);
console.log("Signature:", signature);

// The signature can be verified using standard tools
// since it's generated using the PKP's private key`;

const SEND_TRANSACTION_CODE = `
import { createWalletClient, http, parseEther } from 'viem';
import { sepolia } from 'viem/chains';

// Create a wallet client with the PKP account
const walletClient = createWalletClient({
  account: pkpViemAccount,
  chain: sepolia,
  transport: http(),
});

const hash = await walletClient.sendTransaction({
  account: pkpViemAccount,
  to: pkpViemAccount.address,
  value: parseEther("0.001"),
});

console.log("Transaction hash:", hash);`;

const INTERACT_WITH_CONTRACT_CODE = `
// Interact with an ERC-20 token contract using Viem and a Lit PKP signer
import { parseUnits } from 'viem';

// Define the ERC-20 contract address and ABI
const contractAddress = '0x...'; // Replace with actual token address

const erc20Abi = [
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
] as const;

// === Read Example ===
const tokenName = await publicClient.readContract({
  address: contractAddress,
  abi: erc20Abi,
  functionName: 'name',
});

console.log('Token Name:', tokenName);

// === Write Example (transfer) ===
const recipient = '0x...'; // Replace with recipient address
const amount = parseUnits('10', 18); // 10 tokens (assuming 18 decimals)

const txHash = await walletClient.writeContract({
  account: pkpViemAccount, // Lit PKP Viem-compatible account
  address: contractAddress,
  abi: erc20Abi,
  functionName: 'transfer',
  args: [recipient, amount],
});

console.log('Transaction sent with hash:', txHash);`;

const SIGN_TYPED_DATA_CODE = `
// Sign typed data (EIP-712) for dApp interactions
// This example demonstrates a common dApp authentication pattern
import { sepolia } from 'viem/chains';

const domain = {
  name: 'PKP Demo DApp',
  version: '1',
  chainId: sepolia.id, // 11155111 for Sepolia
  verifyingContract: '0x0000000000000000000000000000000000000000',
} as const;

const types = {
  Person: [
    { name: 'name', type: 'string' },
    { name: 'wallet', type: 'address' },
  ],
} as const;

const message = {
  name: 'PKP User',
  wallet: pkpViemAccount.address, // Uses the PKP's address
};

const signature = await pkpViemAccount.signTypedData({
  domain,
  types,
  primaryType: 'Person',
  message,
});

console.log("Typed data signature:", signature);
console.log("Message signed:", message);
console.log("Domain:", domain);`;

export default function ConnectingToDApp() {
  const { data: walletClient } = useWalletClient();
  const {
    getDependencyStatus,
    authContext,
    setAuthContext,
    setStatus,
    assertDependenciesLoaded,
    showError,
  } = useAppContext();

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isCreatingAuthContext, setIsCreatingAuthContext] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [isSigningMessage, setIsSigningMessage] = useState(false);
  const [isSendingTransaction, setIsSendingTransaction] = useState(false);
  const [isSigningTypedData, setIsSigningTypedData] = useState(false);

  const [accountMethod, setAccountMethod] =
    useState<AccountMethod>("walletClient");
  const [account, setAccount] = useState<unknown>(null);
  const [authData, setAuthData] = useState<unknown>(null);
  const [pkpInfo, setPkpInfo] = useState<unknown>(null);
  const [pkpViemAccount, setPkpViemAccount] = useState<unknown>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [messageSignature, setMessageSignature] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [typedDataSignature, setTypedDataSignature] = useState<string | null>(
    null
  );

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

  // Utility function to format error messages properly
  const formatErrorMessage = (prefix: string, error: unknown): string => {
    let errorMessage = prefix;
    if (error && typeof error === "object" && "message" in error) {
      errorMessage += String(error.message);
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
        const { ViemAccountAuthenticator } = await import("@lit-protocol/auth");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        authData = await ViemAccountAuthenticator.authenticate(account as any);
      } else {
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
    } catch (error: unknown) {
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
        setStatus("Cannot create auth context: Missing PKP info.");
        return;
      }

      const authContext = await authManager.createPkpAuthContext({
        authData: authData,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pkpPublicKey: (pkpInfo as any).pubkey,
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

      console.log("authContext:", authContext);
      setAuthContext(authContext);
      setStatus("Auth context created successfully");
      showSuccess("eoa-create-auth-context");
    } catch (error: unknown) {
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

      if (!authContext) {
        throw new Error(
          "No auth context available. Please complete previous steps first."
        );
      }

      const viemAccount = await litClient.getPkpViemAccount({
        pkpPublicKey: (authContext as any).pkpPublicKey,
        authContext: authContext,
        chainConfig: sepolia,
      });

      setPkpViemAccount(viemAccount);
      setStatus(
        `PKP Viem account created successfully! Address: ${
          (viemAccount as any).address
        }`
      );
      showSuccess("create-pkp-viem-account");
    } catch (error: unknown) {
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

  const checkBalance = async () => {
    try {
      setIsCheckingBalance(true);
      setStatus("Checking PKP wallet balance...");

      if (!pkpViemAccount) {
        throw new Error("No PKP Viem account available.");
      }

      const { createPublicClient, http, formatEther } = await import("viem");
      const { sepolia } = await import("viem/chains");

      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(),
      });

      const balanceWei = await publicClient.getBalance({
        address: (pkpViemAccount as any).address,
      });

      const balanceEth = formatEther(balanceWei);
      setBalance(balanceEth);
      setStatus(`Balance checked: ${balanceEth} SEP`);
      showSuccess("check-balance");
    } catch (error: unknown) {
      console.error("Error checking balance:", error);
      const errorMessage = formatErrorMessage(
        "Failed to check balance: ",
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsCheckingBalance(false);
    }
  };

  const signMessage = async () => {
    try {
      setIsSigningMessage(true);
      setStatus("Signing message with PKP...");

      if (!pkpViemAccount) {
        throw new Error("No PKP Viem account available.");
      }

      const message = "Hello from my PKP wallet!";
      const signature = await (pkpViemAccount as any).signMessage({ message });

      setMessageSignature(signature);
      setStatus("Message signed successfully!");
      showSuccess("sign-message");
    } catch (error: unknown) {
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

      if (!pkpViemAccount) {
        throw new Error("No PKP Viem account available.");
      }

      const { createWalletClient, http, parseEther } = await import("viem");

      const walletClient = createWalletClient({
        account: pkpViemAccount as any,
        chain: sepolia,
        transport: http(),
      });

      const hash = await walletClient.sendTransaction({
        account: pkpViemAccount as any,
        to: (pkpViemAccount as any).address,
        value: parseEther("0.001"),
      });

      setTransactionHash(hash);
      setStatus(`Transaction sent successfully! Hash: ${hash}`);
      showSuccess("send-transaction");
    } catch (error: unknown) {
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

  const signTypedData = async () => {
    try {
      setIsSigningTypedData(true);
      setStatus("Signing typed data...");

      if (!pkpViemAccount) {
        throw new Error("No PKP Viem account available.");
      }

      const domain = {
        name: "PKP Demo DApp",
        version: "1",
        chainId: sepolia.id, // 11155111 for Sepolia
        verifyingContract:
          "0x0000000000000000000000000000000000000000" as `0x${string}`,
      } as const;

      const types = {
        Person: [
          { name: "name", type: "string" },
          { name: "wallet", type: "address" },
        ],
      } as const;

      const message = {
        name: "PKP User",
        wallet: (pkpViemAccount as any).address, // Uses the PKP's address
      };

      const signature = await (pkpViemAccount as any).signTypedData({
        domain,
        types,
        primaryType: "Person",
        message,
      });

      console.log("Typed data signature:", signature);
      console.log("Message signed:", message);
      console.log("Domain:", domain);

      setTypedDataSignature(signature);
      setStatus("Typed data signed successfully!");
      showSuccess("sign-typed-data");
    } catch (error: unknown) {
      console.error("Error signing typed data:", error);
      const errorMessage = formatErrorMessage(
        "Failed to sign typed data: ",
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsSigningTypedData(false);
    }
  };

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>Connecting PKPs to dApps</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Introduction</h2>
        <p style={pageStyles.p}>
          The <code>getPkpViemAccount</code> method allows you to wrap your PKP
          in a{" "}
          <a
            href="https://viem.sh/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#0066cc" }}
          >
            Viem account
          </a>{" "}
          object, making it compatible with any dApp or library that works with
          standard Ethereum accounts. This enables your PKP to perform all the
          same operations as a regular wallet:
        </p>
        <ul style={pageStyles.p}>
          <li style={pageStyles.li}>Sign messages and typed data</li>
          <li style={pageStyles.li}>Send transactions</li>
          <li style={pageStyles.li}>Interact with smart contracts</li>
          <li style={pageStyles.li}>Connect to dApps</li>
          <li style={pageStyles.li}>Work with existing Ethereum tooling</li>
        </ul>
        <p style={pageStyles.p}>
          This guide demonstrates how the returned Viem account object from the{" "}
          <code>getPkpViemAccount</code> method can be used to interact with the
          Ethereum Sepolia testnet.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
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
            account
              ? {
                  address: (account as any).address,
                  type: (account as any).type,
                }
              : null
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
        <h3 style={{ marginTop: 0 }}>
          Step 4: Create AuthContext{" "}
          {!pkpInfo && (
            <span style={{ color: "orange" }}>(Select or mint PKP first)</span>
          )}
        </h3>
        <p>
          Create an AuthContext for your PKP. This establishes the
          authentication session needed to perform operations with your PKP.
        </p>

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
          isSuccess={successActions.has("eoa-create-auth-context")}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h3 style={{ marginTop: "20px" }}>
          Step 5: Create PKP Viem Account{" "}
          {!authContext && (
            <span style={{ color: "orange" }}>
              (Complete previous steps first)
            </span>
          )}
        </h3>
        <p>
          Convert your authenticated PKP into a Viem account object. This
          account can be used with any Ethereum tooling that supports Viem
          accounts, including dApps, wallet libraries, and smart contract
          interactions.
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
                  isCreatingAccount || !authContext ? "#cccccc" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor:
                  isCreatingAccount || !authContext ? "not-allowed" : "pointer",
                fontWeight: "500",
              }}
            >
              {isCreatingAccount ? "Creating..." : "Create PKP Viem Account"}
            </button>
          }
          resultData={
            pkpViemAccount
              ? {
                  address: (pkpViemAccount as any).address,
                  type: (pkpViemAccount as any).type,
                  chain: "Sepolia Testnet",
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
        <h3 style={{ marginTop: "20px" }}>
          Sign Message{" "}
          {!pkpViemAccount && (
            <span style={{ color: "orange" }}>
              (Create PKP Viem Account first)
            </span>
          )}
        </h3>
        <p>Sign a message using your PKP:</p>

        <DisplayCode
          code={SIGN_MESSAGE_CODE}
          language="typescript"
          renderComponent={
            <button
              onClick={signMessage}
              disabled={isSigningMessage || !pkpViemAccount}
              style={{
                padding: "10px 15px",
                backgroundColor:
                  isSigningMessage || !pkpViemAccount ? "#cccccc" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor:
                  isSigningMessage || !pkpViemAccount
                    ? "not-allowed"
                    : "pointer",
                fontWeight: "500",
                width: "100%",
              }}
            >
              {isSigningMessage ? "Signing..." : "Sign Message"}
            </button>
          }
          resultData={
            messageSignature
              ? {
                  message: "Hello from my PKP wallet!",
                  signature: messageSignature,
                }
              : null
          }
          resultLabel="Message Signature"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("sign-message")}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h3 style={{ marginTop: "20px" }}>
          Check Wallet Balance{" "}
          {!pkpViemAccount && (
            <span style={{ color: "orange" }}>
              (Create PKP Viem Account first)
            </span>
          )}
        </h3>
        <p>Check the balance of your PKP wallet on the Sepolia testnet:</p>

        <DisplayCode
          code={CHECK_BALANCE_CODE}
          language="typescript"
          renderComponent={
            <button
              onClick={checkBalance}
              disabled={isCheckingBalance || !pkpViemAccount}
              style={{
                padding: "10px 15px",
                backgroundColor:
                  isCheckingBalance || !pkpViemAccount ? "#cccccc" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor:
                  isCheckingBalance || !pkpViemAccount
                    ? "not-allowed"
                    : "pointer",
                fontWeight: "500",
                width: "100%",
              }}
            >
              {isCheckingBalance ? "Checking..." : "Check Wallet Balance"}
            </button>
          }
          resultData={
            balance ? { balance: `${balance}`, chain: sepolia.name } : null
          }
          resultLabel="Wallet Balance"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("check-balance")}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h3 style={{ marginTop: "20px" }}>
          Send Transaction{" "}
          {!pkpViemAccount && (
            <span style={{ color: "orange" }}>
              (Create PKP Viem Account first)
            </span>
          )}
        </h3>
        <p>Send a transaction transferring native ETH:</p>

        <NoteCallout
          message={
            <>
              <p>
                This will send 0.001 SEP from the PKP you selected, to itself on
                Sepolia testnet. Get testnet ETH from a{" "}
                <a
                  href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
                  target="_blank"
                  style={{ color: "#3b82f6", textDecoration: "underline" }}
                >
                  Sepolia Faucet
                </a>{" "}
                .
              </p>
            </>
          }
          variant="note"
          style={{ marginBottom: "16px" }}
        />

        <DisplayCode
          code={SEND_TRANSACTION_CODE}
          language="typescript"
          renderComponent={
            <button
              onClick={sendTransaction}
              disabled={isSendingTransaction || !pkpViemAccount}
              style={{
                padding: "10px 15px",
                backgroundColor:
                  isSendingTransaction || !pkpViemAccount
                    ? "#cccccc"
                    : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor:
                  isSendingTransaction || !pkpViemAccount
                    ? "not-allowed"
                    : "pointer",
                fontWeight: "500",
                width: "100%",
              }}
            >
              {isSendingTransaction ? "Sending..." : "Send Transaction"}
            </button>
          }
          resultData={
            transactionHash
              ? {
                  hash: transactionHash,
                  amount: "0.001 SEP",
                  chain: "Sepolia",
                }
              : null
          }
          resultLabel="Transaction Result"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("send-transaction")}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h3 style={{ marginTop: "20px" }}>
          Sign Typed Data{" "}
          {!pkpViemAccount && (
            <span style={{ color: "orange" }}>
              (Create PKP Viem Account first)
            </span>
          )}
        </h3>
        <p>Sign structured data (EIP-712):</p>

        <DisplayCode
          code={SIGN_TYPED_DATA_CODE}
          language="typescript"
          renderComponent={
            <button
              onClick={signTypedData}
              disabled={isSigningTypedData || !pkpViemAccount}
              style={{
                padding: "10px 15px",
                backgroundColor:
                  isSigningTypedData || !pkpViemAccount ? "#cccccc" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor:
                  isSigningTypedData || !pkpViemAccount
                    ? "not-allowed"
                    : "pointer",
                fontWeight: "500",
                width: "100%",
              }}
            >
              {isSigningTypedData ? "Signing..." : "Sign Typed Data"}
            </button>
          }
          resultData={
            typedDataSignature
              ? {
                  signature: typedDataSignature,
                  message: {
                    name: "PKP User",
                    wallet: (pkpViemAccount as any)?.address,
                  },
                  domain: {
                    name: "PKP Demo DApp",
                    version: "1",
                    chainId: sepolia.id,
                    verifyingContract:
                      "0x0000000000000000000000000000000000000000",
                  },
                  primaryType: "Person",
                }
              : null
          }
          resultLabel="Typed Data Signature"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("sign-typed-data")}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h3 style={{ marginTop: "20px" }}>Smart Contract Interactions</h3>
        <p>
          Your PKP Viem account can interact with smart contracts just like any
          other account. Here's an example of how to interact with an ERC-20
          token contract:
        </p>

        <DisplayCode
          code={INTERACT_WITH_CONTRACT_CODE}
          language="typescript"
          resultData={null}
          resultLabel=""
          useSideBySide={true}
          theme="dracula"
          isSuccess={false}
        />
      </GreyBoarderWhiteBgContainer>
    </div>
  );
}
