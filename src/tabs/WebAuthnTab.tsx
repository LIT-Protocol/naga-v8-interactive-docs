import { createAuthManager, WebAuthnAuthenticator } from "@lit-protocol/auth";
import { createLitClient } from "@lit-protocol/lit-client";
import { useEffect, useState } from "react";
import { DisplayCode } from "../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../components/layout/GreyboardWhiteBgContainer";

const AUTH_NAME = "WebAuthn Authentication";

// Code snippets for each functionality
const GET_REGISTRATION_OPTIONS_CODE = `
// Get registration options from the server
const options = await fetch('https://auth.litgateway.com/pkp/webauthn/generate-registration-options')
  .then(res => res.json())
  .then(res => res.data);
`;

const REGISTER_CODE = `
import { WebAuthnAuthenticator } from "@lit-protocol/auth";

const data = await WebAuthnAuthenticator.register({
  authServerUrl: "http://localhost:3301",
});
`;

const AUTHENTICATE_CODE = `
import { WebAuthnAuthenticator } from "@lit-protocol/auth";

const authData = await WebAuthnAuthenticator.authenticate({
  authServerUrl: "http://localhost:3301",
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

const SIGN_MESSAGE_CODE = `
const signatures = await litClient.chain.ethereum.pkpSign({
  pubKey: pkpInfo.pubkey,
  authContext: authContext,
  toSign: messageToSign,
});`;

export default function WebAuthnTab({
  getDependencyStatus,
  areDependenciesLoaded,
  authContext,
  activeMethod,
  setAuthContext,
  setActiveMethod,
  setStatus,
  assertDependenciesLoaded,
  siteAuthConfig,
}: {
  getDependencyStatus: () => {
    litClient: boolean;
    authManager: boolean;
  };
  areDependenciesLoaded: () => boolean;
  authContext: any;
  activeMethod: string;
  setAuthContext: (authContext: any) => void;
  setActiveMethod: (method: string) => void;
  setStatus: (status: string) => void;
  assertDependenciesLoaded: () => {
    authManager: Awaited<ReturnType<typeof createAuthManager>>;
    litClient: Awaited<ReturnType<typeof createLitClient>>;
  };
  siteAuthConfig: any;
}) {
  const [isGettingRegistrationOptions, setIsGettingRegistrationOptions] =
    useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [isCreatingAuthContext, setIsCreatingAuthContext] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  const [isFido2Available, setIsFido2Available] = useState<boolean | null>(
    null
  );

  const [registrationOptions, setRegistrationResponse] = useState<any>(null);
  const [authData, setAuthData] = useState<any>(null);
  const [pkpInfo, setPkpInfo] = useState<any>(null);
  const [messageToSign, setMessageToSign] = useState<string>(
    "Hello from WebAuthn PKP!"
  );
  const [signature, setSignature] = useState<any>(null);

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

      const data = await WebAuthnAuthenticator.register({
        authServerUrl: "http://localhost:3301",
        username: username || `testuser-${Date.now()}`,
      });
      setRegistrationResponse(data);
      setStatus("Successfully registered WebAuthn credential");
    } catch (error: any) {
      console.error("Error registering WebAuthn credential:", error);
      setStatus(
        `Failed to register WebAuthn credential: ${
          error?.message || "Unknown error"
        }`
      );
    } finally {
      setIsRegistering(false);
    }
  };

  // Alternative Step 2: Authenticate with an existing WebAuthn credential
  const authenticate = async () => {
    try {
      setIsAuthenticating(true);
      setStatus("Authenticating with WebAuthn...");

      const authData = await WebAuthnAuthenticator.authenticate({
        registrationResponse: registrationOptions,
        authServerUrl: "http://localhost:3301",
      });
      setAuthData(authData);
      setStatus("Successfully authenticated with WebAuthn");
    } catch (error: any) {
      console.error("Error authenticating with WebAuthn:", error);
      setStatus(
        `Failed to authenticate with WebAuthn: ${
          error?.message || "Unknown error"
        }`
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Step 3: Mint PKP with the WebAuthn auth data
  const mintPkp = async () => {
    const { authManager, litClient } = assertDependenciesLoaded();

    if (!authData) {
      throw new Error("No auth data found");
    }

    setStatus("Minting PKP via WebAuthn Auth...");
    setIsMinting(true);
    setPkpInfo(null);
    setSignature(null);

    try {
      const res = await litClient.authService.mintWithAuth({
        authData: authData,
      });

      const mintedPkpInfo = res.data;
      setPkpInfo(mintedPkpInfo);
      console.log("Minted PKP Info:", mintedPkpInfo);
      setStatus("PKP minted successfully via WebAuthn Auth!");
    } catch (error: any) {
      console.error("Error minting PKP with WebAuthn Auth:", error);
      setStatus(
        `Failed to mint PKP with WebAuthn Auth: ${
          error?.message || "Unknown error"
        }`
      );
    } finally {
      setIsMinting(false);
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

      const _toSign = messageToSign;
      const _authConfig = siteAuthConfig;
      console.log("⭐️ PKPInfo:", pkpInfo);
      console.log("⭐️ Message to sign:", _toSign);
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
    } catch (error: any) {
      console.error("Error creating auth context:", error);
      setStatus(
        `Failed to create auth context: ${error?.message || "Unknown error"}`
      );
    } finally {
      setIsCreatingAuthContext(false);
    }
  };

  // Step 5: Sign a message using the PKP
  const signMessage = async () => {
    try {
      setIsSigning(true);
      setStatus("Signing message...");

      const { litClient } = assertDependenciesLoaded();

      if (!authContext || !pkpInfo) {
        setStatus("Cannot sign: Missing AuthContext or PKP.");
        return;
      }

      const signatures = await litClient.chain.ethereum.pkpSign({
        pubKey: pkpInfo.pubkey,
        authContext: authContext,
        toSign: messageToSign,
      });

      console.log("signatures:", signatures);
      setSignature(signatures);
      setStatus("Message signed successfully");
    } catch (error: any) {
      console.error("Error signing message:", error);
      setStatus(`Failed to sign message: ${error?.message || "Unknown error"}`);
    } finally {
      setIsSigning(false);
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

  // Component to render PKP Minting button
  const MintPKPButton = () => (
    <button
      onClick={mintPkp}
      disabled={!areDependenciesLoaded() || isMinting || !authData}
      style={{
        padding: "10px 15px",
        backgroundColor:
          !areDependenciesLoaded() || isMinting || !authData
            ? "#cccccc"
            : "#28a745",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor:
          !areDependenciesLoaded() || isMinting || !authData
            ? "not-allowed"
            : "pointer",
        fontWeight: "500",
        marginBottom: "10px",
      }}
    >
      {isMinting ? "Minting PKP..." : "Mint New PKP with WebAuthn"}
      {!authData && " (Authenticate first)"}
    </button>
  );

  // Component to render Create AuthContext button
  const CreateAuthContextButton = () => (
    <button
      onClick={createAuthContext}
      disabled={isCreatingAuthContext || !messageToSign.trim() || !pkpInfo}
      style={{
        padding: "12px 20px",
        backgroundColor:
          isCreatingAuthContext || !messageToSign.trim() || !pkpInfo
            ? "#cccccc"
            : "#007bff",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor:
          isCreatingAuthContext || !messageToSign.trim() || !pkpInfo
            ? "not-allowed"
            : "pointer",
        fontWeight: "500",
      }}
    >
      {isCreatingAuthContext
        ? "Creating..."
        : "Create AuthContext with WebAuthn PKP"}
    </button>
  );

  // Component to render Sign Message UI
  const SignMessageComponent = () => (
    <div>
      <div style={{ marginBottom: "15px" }}>
        <label
          htmlFor="webauthn-pkp-message-input"
          style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: "500",
          }}
        >
          Message to Sign:
        </label>
        <input
          id="webauthn-pkp-message-input"
          type="text"
          value={messageToSign}
          onChange={(e) => setMessageToSign(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            border: "1px solid #dddddd",
            borderRadius: "4px",
            fontSize: "14px",
            boxSizing: "border-box",
          }}
          placeholder="Enter a message to sign"
          disabled={!(pkpInfo && authContext) || isSigning}
        />
      </div>
      <button
        onClick={signMessage}
        disabled={!(pkpInfo && authContext) || isSigning}
        style={{
          padding: "10px 15px",
          backgroundColor:
            !(pkpInfo && authContext) || isSigning ? "#cccccc" : "#6f42c1",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor:
            !(pkpInfo && authContext) || isSigning ? "not-allowed" : "pointer",
          fontWeight: "500",
        }}
      >
        {isSigning ? "Signing..." : "Sign Message"}
      </button>
    </div>
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

      {/* ================================================ */}
      {/*         Get WebAuthn Registration Options        */}
      {/* ================================================ */}
      {/* <GreyBoarderWhiteBgContainer>
        <h3 style={{ marginTop: "20px" }}>
          Step 1: Get WebAuthn Registration Options
        </h3>
        <p>
          The first step is to get registration options from the server. These
          options will be used to register a WebAuthn credential with your
          device.
        </p>

        <DisplayCode
          code={GET_REGISTRATION_OPTIONS_CODE}
          language="typescript"
          renderComponent={<GetRegistrationOptionsButton />}
          resultData={registrationOptions}
          resultLabel="Registration Options"
          useSideBySide={true}
          theme="dracula"
        />
      </GreyBoarderWhiteBgContainer> */}

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*          Register WebAuthn Credential            */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>
          Step 1: Register WebAuthn Credential
        </h3>
        <p>
          Register a new WebAuthn credential using the options obtained from the
          server. This will prompt you to use your device's authentication
          method (fingerprint, face ID, etc.).
        </p>

        <DisplayCode
          code={REGISTER_CODE}
          language="typescript"
          renderComponent={<WebAuthnRegisterButton />}
          resultData={registrationOptions}
          resultLabel="WebAuthn Registration Data"
          useSideBySide={true}
          theme="dracula"
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*          Authenticate with WebAuthn               */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>
          Alternative Step 2: Authenticate with WebAuthn
        </h3>
        <p>
          If you already have a registered WebAuthn credential, you can
          authenticate with it directly. This is useful for subsequent sessions.
        </p>

        <DisplayCode
          code={AUTHENTICATE_CODE}
          language="typescript"
          renderComponent={<WebAuthnAuthenticateButton />}
          resultData={authData}
          resultLabel="WebAuthn Auth Data"
          useSideBySide={true}
          theme="dracula"
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*               Mint PKP via WebAuthn              */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>Step 3: Mint PKP via WebAuthn</h3>
        <p>
          Mint a new Programmable Key Pair (PKP) using your WebAuthn credential.
          This PKP will be associated with your WebAuthn identity.
        </p>

        <DisplayCode
          code={MINT_PKP_CODE}
          language="typescript"
          renderComponent={<MintPKPButton />}
          resultData={pkpInfo}
          resultLabel="Minted PKP Information"
          useSideBySide={true}
          theme="dracula"
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
          renderComponent={<CreateAuthContextButton />}
          resultData={authContext}
          resultLabel="AuthContext Information"
          useSideBySide={true}
          theme="dracula"
        />
      </GreyBoarderWhiteBgContainer>

      {/* ================================================ */}
      {/*               Sign Message with PKP               */}
      {/* ================================================ */}

      <GreyBoarderWhiteBgContainer>
        <h3>
          Step 5: Sign Message with PKP{" "}
          {!(pkpInfo && authContext) && (
            <span style={{ color: "orange" }}>
              (Requires PKP and AuthContext)
            </span>
          )}
        </h3>
        <p>Use your newly minted PKP to sign a message.</p>

        <DisplayCode
          code={SIGN_MESSAGE_CODE}
          language="typescript"
          renderComponent={
            <div
              style={{
                opacity: pkpInfo && authContext ? 1 : 0.5,
                pointerEvents: pkpInfo && authContext ? "auto" : "none",
              }}
            >
              <SignMessageComponent />
            </div>
          }
          resultData={signature}
          resultLabel="Signature Result"
          useSideBySide={true}
          theme="dracula"
        />
      </GreyBoarderWhiteBgContainer>
    </div>
  );
}
