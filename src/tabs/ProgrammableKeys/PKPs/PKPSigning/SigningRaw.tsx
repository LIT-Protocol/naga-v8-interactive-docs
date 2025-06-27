import { useState } from "react";
import { useWalletClient } from "wagmi";
import PkpSigningComponent from "../../../../components/common/PkpSigningComponent";
import PkpSelectionComponent from "../../../../components/common/PkpSelectionComponent";
import AccountMethodSelector, {
  AccountMethod,
  CREATE_ACCOUNT_PRIVATE_KEY_CODE,
  CREATE_ACCOUNT_WALLET_CLIENT_CODE,
} from "../../../../components/common/AccountMethodSelector";
import { DisplayCode } from "../../../../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../../../../components/layout/GreyboardWhiteBgContainer";
import { useAppContext } from "../../../../router";
import { pageStyles } from "../../../../styles/pageStyles";

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

export default function PkpSignRaw() {
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

  const [accountMethod, setAccountMethod] =
    useState<AccountMethod>("walletClient"); // Default to wallet client
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

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>PKP Raw Signing</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Intro</h2>
        <p style={pageStyles.p}>
          The Lit Client offers a low-level interface for signing using PKPs
          across a wide range of blockchains and cryptographic signing schemes.
        </p>
        <p style={pageStyles.p}>
          You can use raw PKP signing on the following networks:
        </p>
        <ul style={pageStyles.ul}>
          <li style={pageStyles.li}>Ethereum</li>
          <li style={pageStyles.li}>Bitcoin</li>
          <li style={pageStyles.li}>Cosmos</li>
          <li style={pageStyles.li}>Solana</li>
        </ul>
        <p style={pageStyles.p}>
          Supported Signing Schemes Lit supports an extensive set of ECDSA and
          Schnorr-based signature schemes, including:
        </p>
        <ul style={pageStyles.ul}>
          <li style={pageStyles.li}>EcdsaK256Sha256 (Ethereum-compatible)</li>
          <li style={pageStyles.li}>SchnorrK256Taproot (Bitcoin Taproot)</li>
          <li style={pageStyles.li}>SchnorrEd25519Sha512 (Cosmos/Solana)</li>
          <li style={pageStyles.li}>SchnorrRistretto25519Sha512</li>
          <li style={pageStyles.li}>SchnorrRedJubjubBlake2b512</li>
          <li style={pageStyles.li}>
            …and many more as shown in Step 5 of this guide
          </li>
        </ul>

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
          <strong>💰 Payment Information:</strong> PKP signing requires payment.
          Visit the{" "}
          <a
            href="/payment-manager"
            style={{ color: "#0066cc", textDecoration: "underline" }}
          >
            Payment Manager
          </a>{" "}
          page to understand pricing, deposit funds, and manage your payment
          balance.
        </div>
      </GreyBoarderWhiteBgContainer>

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
          isSuccess={successActions.has("eoa-authenticate")}
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
          defaultMessage="Hello from PKP Raw Signing!"
          componentTitle={`Step 5: Sign Message with PKP (Raw Signing)`}
        />
      </GreyBoarderWhiteBgContainer>
    </div>
  );
}
