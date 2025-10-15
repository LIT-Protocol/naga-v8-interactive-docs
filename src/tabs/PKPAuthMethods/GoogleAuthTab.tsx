import { createAuthManager, GoogleAuthenticator } from "@lit-protocol/auth";
import { createLitClient } from "@lit-protocol/lit-client";
import { useState } from "react";
import { DisplayCode } from "../../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../../components/layout/GreyboardWhiteBgContainer";
import EoaAuthSection from "../../components/common/EoaAuthSection";
import { useAppContext } from "../../router";
import PkpSigningComponent from "../../components/common/PkpSigningComponent";
import PkpSelectionComponent from "../../components/common/PkpSelectionComponent";
import ExecuteJsComponent from "../../components/common/ExecuteJsComponent";
import { APP_INFO } from "../../_config";
import PaymentInformation from "../../components/tips/PaymentInformation";
import FundPkpLedgerCheck from "../../components/common/FundPkpLedgerCheck";

const AUTH_NAME = "Google Authentication";

// Code snippets for each functionality
const SIGN_IN_CODE = `
import { GoogleAuthenticator } from "@lit-protocol/auth";

// Use the Login Service URL from config or local settings
const authData = await GoogleAuthenticator.authenticate(APP_INFO.litLoginServer);`;

const MINT_PKP_CODE = `
const res = await litClient.authService.mintWithAuth({
  authData: authData,
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

export default function GoogleAuthTab() {
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

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isCreatingAuthContext, setIsCreatingAuthContext] = useState(false);
  const [authData, setAuthData] = useState<any>();
  const [pkpInfo, setPkpInfo] = useState<any>();
  const [isPkpFunded, setIsPkpFunded] = useState<boolean>(false);

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

  const signIn = async () => {
    try {
      setIsSigningIn(true);
      setStatus("Signing in with Google...");

      const authData = await GoogleAuthenticator.authenticate(APP_INFO.litLoginServer);

      setAuthData(authData);
      setStatus("Successfully signed in with Google");
      showSuccess("google-signin");
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      const errorMessage = formatErrorMessage(
        "Failed to sign in with Google: ",
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsSigningIn(false);
      console.log("Finally auth data:", authData);
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

      // Preflight: ensure PKP ledger funded on current network before session key signing
      try {
        // Use a read-only viem account for checking balance
        const { privateKeyToAccount } = await import("viem/accounts");
        const roAccount = privateKeyToAccount(
          (APP_INFO.defaultPrivateKey as unknown as `0x${string}`)
        );
        const pm = await litClient.getPaymentManager({ account: roAccount });
        const bal = await pm.getBalance({ userAddress: pkpInfo.ethAddress });
        const available = parseFloat(bal?.availableBalance || "0");
        if (available <= 0) {
          throw new Error(
            `PKP Lit Ledger has 0 available balance. Please fund at least 0.1 on ${APP_INFO.network} before creating an AuthContext.`
          );
        }
      } catch (preErr: any) {
        setIsCreatingAuthContext(false);
        const msg = formatErrorMessage("Failed to create auth context: ", preErr);
        setStatus(msg);
        showError?.(msg);
        return;
      }

      const authContext = await authManager.createPkpAuthContext({
        authData: authData,
        pkpPublicKey: pkpInfo.pubkey,
        authConfig: {
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
      showSuccess("google-create-auth-context");
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

  // Component to render Google Sign-In button
  const GoogleSignInButton = () => (
    <button
      onClick={signIn}
      disabled={isSigningIn}
      style={{
        padding: "10px 15px",
        backgroundColor: isSigningIn ? "#cccccc" : "#4285F4",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: isSigningIn ? "not-allowed" : "pointer",
        fontWeight: "500",
      }}
    >
      {isSigningIn ? "Signing in..." : "Sign in with Google"}
    </button>
  );

  // Component to render Create AuthContext button
  const CreateAuthContextButton = () => (
    <button
      onClick={createAuthContext}
      disabled={isCreatingAuthContext || !pkpInfo || !isPkpFunded}
      style={{
        padding: "12px 20px",
        backgroundColor:
          isCreatingAuthContext || !pkpInfo || !isPkpFunded ? "#cccccc" : "#007bff",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: isCreatingAuthContext || !pkpInfo || !isPkpFunded ? "not-allowed" : "pointer",
        fontWeight: "500",
      }}
    >
      {isCreatingAuthContext
        ? "Creating..."
        : !isPkpFunded
        ? "Fund PKP first (naga-test)"
        : "Create AuthContext with Google PKP"}
    </button>
  );

  return (
    <div className="tab-content">
      <h2>{AUTH_NAME}</h2>
      <p>
        {AUTH_NAME} uses your Google account to authenticate via the Lit Login
        Server or your own Login Server. This can be used to mint a PKP and then
        sign messages.
      </p>

      <PaymentInformation />

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
          <li>
            Lit Login Server URL
            <div style={{ marginTop: 6 }}>
              <input
                type="url"
                defaultValue={APP_INFO.litLoginServer}
                onBlur={(e) => {
                  try {
                    if (e.target.value) {
                      window.localStorage.setItem('lit-login-server-url', e.target.value);
                      setStatus('Saved Login Service URL. Reload to take effect.');
                    } else {
                      window.localStorage.removeItem('lit-login-server-url');
                    }
                  } catch {}
                }}
                placeholder="https://login.litgateway.com"
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }}
              />
              <small style={{ color: '#666' }}>Stored locally. Leave blank to use default.</small>
            </div>
          </li>
          <li>
            Auth Service URL (per network)
            <div style={{ marginTop: 6 }}>
              <input
                type="url"
                defaultValue={(APP_INFO as any).authServiceUrls?.[APP_INFO.network]}
                onBlur={(e) => {
                  try {
                    const raw = window.localStorage.getItem('lit-auth-server-url-map');
                    const map = raw ? (JSON.parse(raw) as Record<string,string>) : {};
                    if (e.target.value) {
                      map[APP_INFO.network] = e.target.value;
                    } else {
                      delete map[APP_INFO.network];
                    }
                    window.localStorage.setItem('lit-auth-server-url-map', JSON.stringify(map));
                    setStatus(`Saved Auth Service URL for ${APP_INFO.network}. Reload to take effect.`);
                  } catch {}
                }}
                placeholder={(APP_INFO as any).authServiceUrls?.[APP_INFO.network]}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }}
              />
              <small style={{ color: '#666' }}>Stored locally per network. Leave blank to use default.</small>
            </div>
          </li>
        </ul>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*               Sign in with Google                */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>Step 1: Sign in with Google</h3>
        <p>
          To sign in with Google, you can use the `authenticate` function
          provided by the GoogleAuthenticator.
        </p>

        <DisplayCode
          code={SIGN_IN_CODE}
          language="typescript"
          renderComponent={<GoogleSignInButton />}
          resultData={authData}
          resultLabel="Auth Data"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("google-signin")}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*               Get or Mint PKP via Google         */}
        {/* ================================================ */}
        <PkpSelectionComponent
          authData={authData}
          onPkpSelected={setPkpInfo}
          setStatus={setStatus}
          assertDependenciesLoaded={assertDependenciesLoaded}
          showError={showError}
          authMethodName="Google Auth"
          mintCodeSnippet={MINT_PKP_CODE}
          disabled={!authData}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*               Fund PKP Ledger                    */}
        {/* ================================================ */}
        <h3 style={{ marginTop: 0 }}>
          Step 3: Fund PKP Ledger {(!pkpInfo) && (
            <span style={{ color: "orange" }}>(Select or mint PKP first)</span>
          )}
        </h3>
        <p>
          On naga-test, you must fund your PKP ledger before creating an AuthContext.
          Use the balance check and deposit example below to top up at least 0.1 ETH.
        </p>
        <FundPkpLedgerCheck pkpAddress={pkpInfo?.ethAddress} onStatusChange={setIsPkpFunded} />
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
          renderComponent={<CreateAuthContextButton />}
          resultData={authContext}
          resultLabel="AuthContext Information"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("google-create-auth-context")}
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
          defaultMessage="Hello from Google PKP!"
          componentTitle={`Step 5: Sign Message with PKP (${AUTH_NAME})`}
        />
      </GreyBoarderWhiteBgContainer>

      {/* ================================================ */}
      {/*               Execute Lit Action                  */}
      {/* ================================================ */}

      <GreyBoarderWhiteBgContainer>
        <ExecuteJsComponent
          authContext={authContext}
          pkpInfo={pkpInfo}
          setStatus={setStatus}
          assertDependenciesLoaded={assertDependenciesLoaded}
          defaultMessage="Hello from Google Lit Action!"
          componentTitle={`Step 6: Execute Lit Action (${AUTH_NAME})`}
          showError={showError}
        />
      </GreyBoarderWhiteBgContainer>
    </div>
  );
}
