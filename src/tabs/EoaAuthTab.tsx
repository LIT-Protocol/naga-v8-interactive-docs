import { useState } from "react";
import { privateKeyToAccount } from "viem/accounts";
import { useWalletClient } from "wagmi";
import PkpSigningComponent from "../components/common/PkpSigningComponent";
import { DisplayCode } from "../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../components/layout/GreyboardWhiteBgContainer";
import { useAppContext } from "../router";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FEATURES } from "../_config";
import EoaAuthSection from "../components/common/EoaAuthSection";

const AUTH_NAME = "EOA Authentication";

// Configuration constants
const DEFAULT_PRIVATE_KEY =
  "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const FAUCET_URL = "https://chronicle-yellowstone-faucet.getlit.dev/";

// Code snippets for each functionality
const CREATE_ACCOUNT_PRIVATE_KEY_CODE = `
import { privateKeyToAccount } from 'viem/accounts';

const myAccount = privateKeyToAccount(
  process.env.PRIVATE_KEY as \`0x\${string}\`
);`;

const CREATE_ACCOUNT_WALLET_CLIENT_CODE = `
import { useWalletClient } from 'wagmi';

// Use your connected wallet as the account
const { data: myAccount } = useWalletClient();`;

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

export default function EoaAuthTab() {
  const { data: walletClient } = useWalletClient();
  const {
    getDependencyStatus,
    areDependenciesLoaded,
    authContext,
    activeMethod,
    setAuthContext,
    setActiveMethod,
    setStatus,
    assertDependenciesLoaded,
    siteAuthConfig,
    showError,
    clearError,
  } = useAppContext();

  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [isCreatingAuthContext, setIsCreatingAuthContext] = useState(false);

  const [accountMethod, setAccountMethod] = useState<
    "privateKey" | "walletClient"
  >("privateKey");
  const [privateKey, setPrivateKey] = useState<string>(DEFAULT_PRIVATE_KEY);
  const [account, setAccount] = useState<any>(null);
  const [authData, setAuthData] = useState<any>(null);
  const [pkpInfo, setPkpInfo] = useState<any>(null);

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

  const createAccountFromPrivateKey = async () => {
    try {
      setIsCreatingAccount(true);
      setStatus("Creating viem account from private key...");

      if (!privateKey.startsWith("0x") || privateKey.length !== 66) {
        throw new Error(
          "Invalid private key format. Must be a hex string starting with 0x and 66 characters long."
        );
      }

      const myAccount = privateKeyToAccount(privateKey as `0x${string}`);
      setAccount(myAccount);
      setStatus(`Successfully created account: ${myAccount.address}`);
      showSuccess("eoa-create-account");
    } catch (error: any) {
      console.error("Error creating account:", error);
      const errorMessage = formatErrorMessage("Failed to create account: ", error);
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const createAccountFromWalletClient = async () => {
    try {
      setIsCreatingAccount(true);
      setStatus("Getting account from connected wallet...");

      if (!walletClient || !walletClient.account) {
        throw new Error(
          "No wallet connected. Please connect your wallet first."
        );
      }

      setAccount(walletClient);
      setStatus(
        `Successfully got account from wallet: ${walletClient.account.address}`
      );
      showSuccess("eoa-get-wallet-account");
    } catch (error: any) {
      console.error("Error getting wallet account:", error);
      const errorMessage = formatErrorMessage("Failed to get wallet account: ", error);
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const createAccount = async () => {
    if (accountMethod === "privateKey") {
      return createAccountFromPrivateKey();
    } else {
      return createAccountFromWalletClient();
    }
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
      const errorMessage = formatErrorMessage("Failed to authenticate with EOA: ", error);
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const mintPkp = async () => {
    const { authManager, litClient } = assertDependenciesLoaded();

    if (!authData || !account) {
      throw new Error("No auth data or account found");
    }

    setStatus("Minting PKP via EOA Auth...");
    setIsMinting(true);
    setPkpInfo(null);

    try {
      let mintResult;
      if (accountMethod === "privateKey") {
        // For private key accounts, use the account directly
        mintResult = await litClient.mintWithAuth({
          account: account,
          authData: authData,
          scopes: ["sign-anything"],
        });
      } else {
        // For wallet client accounts, use the wallet client
        if (!walletClient) {
          throw new Error(
            "No wallet client available. Please connect your wallet."
          );
        }
        mintResult = await litClient.mintWithAuth({
          account: walletClient,
          authData: authData,
          scopes: ["sign-anything"],
        });
      }

      const mintedPkpInfo = mintResult.data;
      setPkpInfo(mintedPkpInfo);
      console.log("Minted PKP Info:", mintedPkpInfo);
      setStatus(
        `PKP minted successfully via EOA Auth using ${
          accountMethod === "privateKey" ? "private key" : "wallet client"
        }!`
      );
      showSuccess("eoa-mint-pkp");
    } catch (error: any) {
      console.error("Error minting PKP with EOA Auth:", error);
      const errorMessage = formatErrorMessage("Failed to mint PKP with EOA Auth: ", error);
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsMinting(false);
    }
  };

  const createAuthContext = async () => {
    try {
      setIsCreatingAuthContext(true);
      setStatus("Creating auth context...");

      const { authManager, litClient } = assertDependenciesLoaded();

      if (!pkpInfo) {
        setStatus("Cannot sign: Missing PKP or Lit Client.");
        return;
      }

      const authContext = await authManager.createPkpAuthContext({
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

      console.log("authContext:", authContext);
      setAuthContext(authContext);
      setStatus("Auth context created successfully");
      showSuccess("eoa-create-auth-context");
    } catch (error: any) {
      console.error("Error creating auth context:", error);
      const errorMessage = formatErrorMessage("Failed to create auth context: ", error);
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsCreatingAuthContext(false);
    }
  };

  return (
    <div className="tab-content">
      <h2>{AUTH_NAME}</h2>
      <p>
        Externally Owned Account (EOA) authentication uses your existing
        Ethereum account to authenticate and mint PKPs. You can either use a
        private key or connect your wallet.
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
              {privateKey ? (
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
            <div style={{ marginBottom: "10px" }}>
              {/* Account Method Selector */}
              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}
                >
                  Choose Account Method:
                </label>
                <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                  <button
                    onClick={() => setAccountMethod("privateKey")}
                    style={{
                      padding: "8px 15px",
                      backgroundColor:
                        accountMethod === "privateKey" ? "#4285F4" : "#f0f0f0",
                      color: accountMethod === "privateKey" ? "white" : "#333",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                  >
                    Private Key
                  </button>
                  <button
                    onClick={() => setAccountMethod("walletClient")}
                    style={{
                      padding: "8px 15px",
                      backgroundColor:
                        accountMethod === "walletClient" ? "#4285F4" : "#f0f0f0",
                      color: accountMethod === "walletClient" ? "white" : "#333",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                  >
                    Connected Wallet
                  </button>
                </div>
              </div>

              {/* Private Key Input (only show when private key method is selected) */}
              {accountMethod === "privateKey" && (
                <div style={{ marginBottom: "10px" }}>
                  <label
                    htmlFor="privateKey"
                    style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}
                  >
                    Private Key:
                  </label>
                  <input
                    id="privateKey"
                    type="password"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    placeholder="0x..."
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontFamily: "monospace",
                      fontSize: "14px",
                    }}
                  />
                  <small style={{ color: "#666", fontSize: "12px" }}>
                    Default test private key is provided. Replace with your own for
                    production use.
                  </small>
                </div>
              )}

              {/* Wallet Client Info (only show when wallet client method is selected) */}
              {accountMethod === "walletClient" && (
                <div
                  style={{
                    marginBottom: "10px",
                    padding: "10px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "4px",
                    border: "1px solid #e9ecef",
                  }}
                >
                  <p style={{ margin: "0 0 8px 0", fontSize: "14px" }}>
                    <strong>Using Connected Wallet:</strong> This will use your
                    currently connected wallet account (e.g., MetaMask).
                  </p>
                  <p style={{ margin: "0", fontSize: "12px", color: "#666" }}>
                    Make sure your wallet is connected and you have test tokens. Need
                    tokens? Visit the{" "}
                    <a
                      href={FAUCET_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#4285F4", textDecoration: "underline" }}
                    >
                      Chronicle Yellowstone Faucet
                    </a>
                    <div style={{ marginTop: "10px" }}>
                      <ConnectButton showBalance={FEATURES.showWalletBalance} />
                    </div>
                  </p>
                </div>
              )}

              <button
                onClick={createAccount}
                disabled={isCreatingAccount}
                style={{
                  padding: "10px 15px",
                  backgroundColor: isCreatingAccount ? "#cccccc" : "#4285F4",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: isCreatingAccount ? "not-allowed" : "pointer",
                  fontWeight: "500",
                }}
              >
                {isCreatingAccount
                  ? "Creating..."
                  : accountMethod === "privateKey"
                  ? "Create Account from Private Key"
                  : "Use Connected Wallet Account"}
              </button>
            </div>
          }
          resultData={
            account ? { address: account.address, type: account.type } : null
          }
          resultLabel="Account Information"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("eoa-create-account") || successActions.has("eoa-get-wallet-account")}
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
                backgroundColor: isAuthenticating || !account ? "#cccccc" : "#4285F4",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isAuthenticating || !account ? "not-allowed" : "pointer",
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
        {/*               Mint PKP via EOA Auth              */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>Step 3: Mint PKP via EOA Auth</h3>
        <p>
          Mint a new Programmable Key Pair (PKP) using your EOA authentication
          data. This PKP will be associated with your{" "}
          {accountMethod === "privateKey"
            ? "private key account"
            : "connected wallet"}{" "}
          identity.
        </p>

        <DisplayCode
          code={MINT_PKP_CODE}
          language="typescript"
          renderComponent={
            <button
              onClick={mintPkp}
              disabled={!areDependenciesLoaded() || isMinting || !authData || !account}
              style={{
                padding: "10px 15px",
                backgroundColor:
                  !areDependenciesLoaded() || isMinting || !authData || !account
                    ? "#cccccc"
                    : "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor:
                  !areDependenciesLoaded() || isMinting || !authData || !account
                    ? "not-allowed"
                    : "pointer",
                fontWeight: "500",
                marginBottom: "10px",
              }}
            >
              {isMinting ? "Minting PKP..." : "Mint New PKP with EOA Auth"}
              {(!authData || !account) && " (Authenticate first)"}
            </button>
          }
          resultData={pkpInfo}
          resultLabel="Minted PKP Information"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("eoa-mint-pkp")}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*               Create AuthContext                  */}
        {/* ================================================ */}
        <h3 style={{ marginTop: 0 }}>
          Step 4: Create AuthContext{" "}
          {!pkpInfo && (
            <span style={{ color: "orange" }}>(Mint PKP first)</span>
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
                cursor: isCreatingAuthContext || !pkpInfo ? "not-allowed" : "pointer",
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

      {/* ================================================ */}
      {/*               Sign Message with PKP               */}
      {/* ================================================ */}

      <GreyBoarderWhiteBgContainer>
        <PkpSigningComponent
          authContext={authContext}
          pkpInfo={pkpInfo}
          setStatus={setStatus}
          assertDependenciesLoaded={assertDependenciesLoaded}
          defaultMessage="Hello from EOA Auth PKP!"
          componentTitle={`Step 5: Sign Message with PKP (${AUTH_NAME})`}
        />
      </GreyBoarderWhiteBgContainer>

      {/* Add EOA Auth Section */}
      <EoaAuthSection tabName={AUTH_NAME} />
    </div>
  );
}
