import { createAuthManager, GoogleAuthenticator } from "@lit-protocol/auth";
import { createLitClient } from "@lit-protocol/lit-client";
import { useState } from "react";
import { replacer } from "../helper";

const AUTH_NAME = "Google Authentication";

export default function GoogleAuthTab({
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
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authMethod, setAuthMethod] = useState<any>(null);
  const [pkpInfo, setPkpInfo] = useState<any>(null);
  const [messageToSign, setMessageToSign] = useState<string>(
    "Hello from Google PKP!"
  );
  const [isSigning, setIsSigning] = useState<boolean>(false);
  const [signature, setSignature] = useState<any>(null);

  const googleAuth = async () => {
    const { authManager, litClient } = assertDependenciesLoaded();

    setStatus(`Authenticating with ${AUTH_NAME}...`);
    setIsAuthenticating(true);
    setPkpInfo(null);
    setSignature(null);

    try {
      const newAuthContext = await authManager.createPkpAuthContext({
        authMethod: authMethod,
        pkpPublicKey: "",
        authConfig: siteAuthConfig,
        litClient: litClient,
      });

      setAuthContext(newAuthContext);
      setActiveMethod("google-auth");
      setStatus(`${AUTH_NAME} successful! AuthContext prepared.`);
    } catch (error: any) {
      console.error(`${AUTH_NAME} failed:`, error);
      setStatus(`${AUTH_NAME} failed: ${error?.message || "Unknown error"}`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signIn = async () => {
    const authMethod = await GoogleAuthenticator.authenticate(
      "https://login.litgateway.com"
    );

    setAuthMethod(authMethod);
  };

  const mintPkp = async () => {
    const { authManager, litClient } = assertDependenciesLoaded();
    if (!authMethod) {
      throw new Error("No auth method found");
    }

    setStatus("Minting PKP via Google Auth...");
    setIsAuthenticating(true);
    setPkpInfo(null);
    setSignature(null);

    try {
      // Maybe this should be done inside authManager instead of LitClient?
      const res = await litClient.mintWithAuth({
        authMethod: authMethod,
        authServerBaseUrl: "http://localhost:3301",
      });

      const mintedPkpInfo = res.data;
      setPkpInfo(mintedPkpInfo);
      console.log("Minted PKP Info:", mintedPkpInfo);
      setStatus("PKP minted successfully via Google Auth!");
    } catch (error: any) {
      console.error("Error minting PKP with Google Auth:", error);
      setStatus(
        `Failed to mint PKP with Google Auth: ${
          error?.message || "Unknown error"
        }`
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signWithPkpFromGoogleAuth = async () => {
    const { authManager, litClient } = assertDependenciesLoaded();

    if (!pkpInfo) {
      setStatus("Cannot sign: Missing PKP or Lit Client.");
      return;
    }

    const message = messageToSign;
    console.log("Message to sign:", message);

    const authContext = await authManager.createPkpAuthContext({
      authMethod: authMethod,
      pkpPublicKey: pkpInfo.pubkey,
      authConfig: siteAuthConfig,
      litClient: litClient,
    });

    console.log("authContext:", authContext);

    // setStatus("Signing message with PKP from Google Auth...");
    // setIsSigning(true);
    // setSignature(null);

    // try {
    //   console.log("Signing with PKP:", pkpInfo.pubkey);
    //   console.log("Message to sign:", messageToSign);
    //   await new Promise((resolve) => setTimeout(resolve, 1000));
    //   setStatus("Placeholder: Message signing function called.");
    // } catch (error: any) {
    //   console.error("Error signing with PKP from Google Auth:", error);
    //   setStatus(`Failed to sign message: ${error?.message || "Unknown error"}`);
    // } finally {
    //   setIsSigning(false);
    // }
  };

  return (
    <div className="tab-content">
      <h2>{AUTH_NAME}</h2>
      <p>
        {AUTH_NAME} uses your Google account to authenticate via the Lit Login
        Server or your own Login Server. This can be used to mint a PKP and then
        sign messages.
      </p>

      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          backgroundColor: "#f9f9f9",
          borderRadius: "6px",
          border: "1px solid #e0e0e0",
        }}
      >
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
            Lit Login Server (eg. https://login.litgateway.com):{" "}
            {true ? (
              <span style={{ color: "green" }}>✓ Initialised</span>
            ) : (
              <span style={{ color: "red" }}>✗ Not initialised</span>
            )}
          </li>
          <li>
            Lit Auth Server (eg. https://naga-dev-auth-service.getlit.dev):{" "}
            {true ? (
              <span style={{ color: "green" }}>✓ Initialised</span>
            ) : (
              <span style={{ color: "red" }}>✗ Not initialised</span>
            )}
          </li>
        </ul>

        {/* ================================================ */}
        {/*               Sign in with Google                */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>Sign in with Google</h3>
        <p>
          To sign in with Google, you can use the `authenticate` function
          provided by the GoogleAuthenticator.
        </p>
        <button onClick={signIn}>Sign in with Google</button>

        {authMethod && (
          <div style={{ marginTop: "20px" }}>
            <h3>Auth Method</h3>
            <pre style={{ margin: 0, fontSize: "13px" }}>
              {JSON.stringify(authMethod, replacer, 2)}
            </pre>
          </div>
        )}

        <h3 style={{ marginTop: "20px" }}>Step 1a: Mint PKP via Google</h3>
        <p>
          Mint a new Programmable Key Pair (PKP) using your Google account. This
          PKP will be associated with your Google identity.
        </p>
        <button
          onClick={mintPkp}
          disabled={!areDependenciesLoaded() || isAuthenticating}
          style={{
            padding: "10px 15px",
            backgroundColor:
              !areDependenciesLoaded() || isAuthenticating
                ? "#cccccc"
                : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor:
              !areDependenciesLoaded() || isAuthenticating
                ? "not-allowed"
                : "pointer",
            fontWeight: "500",
            marginBottom: "10px",
          }}
        >
          {isAuthenticating ? "Processing..." : "Mint New PKP with Google"}
        </button>

        {/* <h3 style={{ marginTop: "20px" }}>
          Step 1b (Optional): Authenticate with Google (Existing PKP)
        </h3>
        <p>
          If you have an existing PKP associated with your Google account, you
          can authenticate to get an AuthContext for it.
        </p>
        <button
          onClick={googleAuth}
          disabled={!areDependenciesLoaded() || isAuthenticating}
          style={{
            padding: "12px 20px",
            backgroundColor:
              areDependenciesLoaded() && !isAuthenticating
                ? "#3b82f6"
                : "#cccccc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor:
              areDependenciesLoaded() && !isAuthenticating
                ? "pointer"
                : "not-allowed",
            fontWeight: "500",
          }}
        >
          {!areDependenciesLoaded()
            ? "Waiting for dependencies..."
            : isAuthenticating
            ? "Processing..."
            : `Get AuthContext with Google`}
        </button> */}
      </div>

      {authContext && activeMethod === "google-auth" && !pkpInfo && (
        <div style={{ marginTop: "20px" }}>
          <h3>Google AuthContext Result</h3>
          <p>This context can be used if you authenticated an existing PKP.</p>
          <div
            style={{
              backgroundColor: "#f5f5f5",
              padding: "15px",
              borderRadius: "6px",
              overflowX: "auto",
            }}
          >
            <pre style={{ margin: 0, fontSize: "13px" }}>
              {JSON.stringify(authContext, replacer, 2)}
            </pre>
          </div>
        </div>
      )}

      {pkpInfo && (
        <div style={{ marginTop: "20px" }}>
          <h3>Minted PKP Information</h3>
          <div
            style={{
              backgroundColor: "#f5f5f5",
              padding: "15px",
              borderRadius: "6px",
              overflowX: "auto",
            }}
          >
            <pre style={{ margin: 0, fontSize: "13px" }}>
              {JSON.stringify(pkpInfo, replacer, 2)}
            </pre>
          </div>
        </div>
      )}

      {pkpInfo && (
        <div
          style={{
            marginTop: "30px",
            padding: "20px",
            backgroundColor: "#f9f9f9",
            borderRadius: "6px",
            border: "1px solid #e0e0e0",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Step 2: Sign Message with Minted PKP</h3>
          <p>Use your newly minted PKP to sign a message.</p>

          <div style={{ marginTop: "15px" }}>
            <label
              htmlFor="google-pkp-message-input"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "500",
              }}
            >
              Message to Sign:
            </label>
            <input
              id="google-pkp-message-input"
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
            />
          </div>

          <button
            onClick={signWithPkpFromGoogleAuth}
            disabled={isSigning || !messageToSign.trim() || !pkpInfo}
            style={{
              marginTop: "15px",
              padding: "12px 20px",
              backgroundColor:
                isSigning || !messageToSign.trim() || !pkpInfo
                  ? "#cccccc"
                  : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor:
                isSigning || !messageToSign.trim() || !pkpInfo
                  ? "not-allowed"
                  : "pointer",
              fontWeight: "500",
            }}
          >
            {isSigning ? "Signing..." : "Sign Message with Google PKP"}
          </button>

          {signature && (
            <div style={{ marginTop: "20px" }}>
              <h4 style={{ marginBottom: "10px" }}>Signature Result:</h4>
              <div
                style={{
                  backgroundColor: "#e9ecef",
                  padding: "15px",
                  borderRadius: "6px",
                  overflowX: "auto",
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}
                >
                  {JSON.stringify(signature, replacer, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
