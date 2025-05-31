import { WebAuthnAuthenticator } from "@lit-protocol/auth";
import { useEffect, useState } from "react";
import EoaAuthSection from "../../components/common/EoaAuthSection";
import PkpSelectionComponent from "../../components/common/PkpSelectionComponent";
import { DisplayCode } from "../../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../../components/layout/GreyboardWhiteBgContainer";
import { useAppContext } from "../../router";
import PkpSigningComponent from "../../components/common/PkpSigningComponent";
import ExecuteJsComponent from "../../components/common/ExecuteJsComponent";

const AUTH_NAME = "WebAuthn Authentication";

// Code snippets for each functionality
const REGISTER_CODE = `
import { WebAuthnAuthenticator } from "@lit-protocol/auth";

const { pkpInfo, webAuthnPublicKey } = await WebAuthnAuthenticator.registerAndMintPKP({
  authServiceBaseUrl: "https://naga-auth-service.onrender.com",
});
`;

const AUTHENTICATE_CODE = `
import { WebAuthnAuthenticator } from "@lit-protocol/auth";

const authData = await WebAuthnAuthenticator.authenticate({
  authServiceBaseUrl: "https://naga-auth-service.onrender.com",
});
`;

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

export default function WebAuthnTab() {
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

  const [isRegistering, setIsRegistering] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isCreatingAuthContext, setIsCreatingAuthContext] = useState(false);

  const [isFido2Available, setIsFido2Available] = useState<boolean | null>(
    null
  );

  const [authData, setAuthData] = useState<any>(null);
  const [pkpInfo, setPkpInfo] = useState<any>();

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

  // Effect to check for FIDO2 compatibility
  useEffect(() => {
    async function checkFido2Availability() {
      if (window.PublicKeyCredential) {
        try {
          const available =
            await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsFido2Available(available);
        } catch (e) {
          console.warn("Error checking FIDO2 availability:", e);
          setIsFido2Available(false); // Assume not available on error
        }
      } else {
        setIsFido2Available(false); // WebAuthn API not supported
      }
    }
    checkFido2Availability();
  }, []);

  // Step 2: Register a WebAuthn credential
  const register = async () => {
    try {
      setIsRegistering(true);
      setStatus("Registering WebAuthn credential...");

      // prompt user for username
      const username = prompt("Enter your username:");

      const { pkpInfo, webAuthnPublicKey } =
        await WebAuthnAuthenticator.registerAndMintPKP({
          authServiceBaseUrl: "https://naga-auth-service.onrender.com",
          username: username || `testuser-${Date.now()}`,
        });
      setPkpInfo(pkpInfo);
      setStatus("Successfully registered WebAuthn credential and minted a PKP");
      showSuccess("webauthn-register");
    } catch (error: any) {
      console.error("Error registering WebAuthn credential:", error);
      const errorMessage = formatErrorMessage("Failed to register WebAuthn credential: ", error);
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };

  // Alternative Step 2: Authenticate with an existing WebAuthn credential
  const authenticate = async () => {
    try {
      setIsAuthenticating(true);
      setStatus("Authenticating with WebAuthn...");

      const authData = await WebAuthnAuthenticator.authenticate();
      setAuthData(authData);
      setStatus("Successfully authenticated with WebAuthn");
      showSuccess("webauthn-authenticate");
    } catch (error: any) {
      console.error("Error authenticating with WebAuthn:", error);
      const errorMessage = formatErrorMessage("Failed to authenticate with WebAuthn: ", error);
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Step 4: Create an auth context with the PKP
  const createAuthContext = async () => {
    try {
      setIsCreatingAuthContext(true);
      setStatus("Creating auth context...");

      const { authManager, litClient } = assertDependenciesLoaded();

      if (!pkpInfo) {
        setStatus("Cannot sign: Missing PKP or Lit Client.");
        return;
      }

      const _authConfig = siteAuthConfig;
      console.log("⭐️ PKPInfo:", pkpInfo);
      console.log("⭐️ Auth Config:", _authConfig);

      const authContext = await authManager.createPkpAuthContext({
        authData: authData,
        pkpPublicKey: pkpInfo.pubkey,
        authConfig: {
          capabilityAuthSigs: [],
          expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
          statement: "This is a test statement",
          domain: "localhost:5173",
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
      showSuccess("webauthn-create-auth-context");
    } catch (error: any) {
      console.error("Error creating auth context:", error);
      const errorMessage = formatErrorMessage("Failed to create auth context: ", error);
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsCreatingAuthContext(false);
    }
  };

  // Component to render WebAuthn Registration button
  const WebAuthnRegisterButton = () => (
    <button
      onClick={register}
      disabled={isRegistering}
      style={{
        padding: "10px 15px",
        backgroundColor: isRegistering ? "#cccccc" : "#4285F4",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: isRegistering ? "not-allowed" : "pointer",
        fontWeight: "500",
      }}
    >
      {isRegistering ? "Registering..." : "Register WebAuthn Credential"}
    </button>
  );

  // Component to render WebAuthn Authentication button
  const WebAuthnAuthenticateButton = () => (
    <div>
      <button
        onClick={authenticate}
        disabled={isAuthenticating}
        style={{
          padding: "10px 15px",
          backgroundColor: isAuthenticating ? "#cccccc" : "#4285F4",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: isAuthenticating ? "not-allowed" : "pointer",
          fontWeight: "500",
        }}
      >
        {isAuthenticating ? "Authenticating..." : "Authenticate with WebAuthn"}
      </button>
    </div>
  );

  // Component to render Create AuthContext button
  const CreateAuthContextButton = () => (
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
        : "Create AuthContext with WebAuthn PKP"}
    </button>
  );

  return (
    <div className="tab-content">
      <h2>{AUTH_NAME}</h2>
      <p>
        {AUTH_NAME} uses your device's secure hardware (such as fingerprint
        sensor, facial recognition, or security key) to authenticate you via the
        FIDO2/WebAuthn standard. This can be used to mint a PKP and then sign
        messages.
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
          <li>
            Lit Auth Server (eg. https://auth.litgateway.com):{" "}
            {true ? (
              <span style={{ color: "green" }}>✓ Initialised</span>
            ) : (
              <span style={{ color: "red" }}>✗ Not initialised</span>
            )}
          </li>
          <li>
            FIDO2-Compatible Device (such as a security key, fingerprint sensor,
            or facial recognition system):{" "}
            {isFido2Available === null ? (
              <span style={{ color: "grey" }}>Checking...</span>
            ) : isFido2Available ? (
              <span style={{ color: "green" }}>✓ Available</span>
            ) : (
              <span style={{ color: "red" }}>
                ✗ Not available / Not supported
              </span>
            )}
          </li>
        </ul>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*          Register WebAuthn Credential            */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>
          Step 1: Register WebAuthn Credential and mint a PKP
        </h3>
        <p>
          Register a new WebAuthn credential using the options obtained from the
          server. This will prompt you to use your device's authentication
          method (fingerprint, face ID, etc.). Then, we immediately mint a PKP
          and associate it with it.
        </p>

        <DisplayCode
          code={REGISTER_CODE}
          language="typescript"
          renderComponent={<WebAuthnRegisterButton />}
          resultData={pkpInfo}
          resultLabel="PKP Info"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("webauthn-register")}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*          Authenticate with WebAuthn               */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>
          Step 2: Authenticate with WebAuthn
        </h3>
        <p>
          If you already have a registered WebAuthn credential, you can
          authenticate with it directly.
        </p>

        <DisplayCode
          code={AUTHENTICATE_CODE}
          language="typescript"
          renderComponent={<WebAuthnAuthenticateButton />}
          resultData={authData}
          resultLabel="WebAuthn Auth Data"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("webauthn-authenticate")}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*               Get or Mint PKP via WebAuthn       */}
        {/* ================================================ */}
        <PkpSelectionComponent
          authData={authData}
          onPkpSelected={setPkpInfo}
          setStatus={setStatus}
          assertDependenciesLoaded={assertDependenciesLoaded}
          showError={showError}
          authMethodName="WebAuthn Auth"
          mintCodeSnippet={MINT_PKP_CODE}
          disabled={!authData}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*               Create AuthContext                  */}
        {/* ================================================ */}
        <h3 style={{ marginTop: 0 }}>
          Step 3: Create AuthContext{" "}
          {!pkpInfo && (
            <span style={{ color: "orange" }}>(Register & Mint PKP first)</span>
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
          isSuccess={successActions.has("webauthn-create-auth-context")}
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
          defaultMessage="Hello from WebAuthn PKP!"
          componentTitle={`Step 4: Sign Message with PKP (${AUTH_NAME})`}
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
          defaultMessage="Hello from WebAuthn Lit Action!"
          componentTitle={`Step 5: Execute Lit Action (${AUTH_NAME})`}
          showError={showError}
        />
      </GreyBoarderWhiteBgContainer>
    </div>
  );
}
