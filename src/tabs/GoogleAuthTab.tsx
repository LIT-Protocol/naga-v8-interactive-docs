import { createAuthManager, GoogleAuthenticator } from "@lit-protocol/auth";
import { createLitClient } from "@lit-protocol/lit-client";
import { useState } from "react";
import { DisplayCode } from "../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../components/layout/GreyboardWhiteBgContainer";
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
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isCreatingAuthContext, setIsCreatingAuthContext] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [authData, setAuthData] = useState<any>();
  const [pkpInfo, setPkpInfo] = useState<any>();
  const [messageToSign, setMessageToSign] = useState<string>(
    "Hello from Google PKP!"
  );
  const [signature, setSignature] = useState<any>(null);

  const signIn = async () => {
    try {
      setIsSigningIn(true);
      setStatus("Signing in with Google...");

      const authData = await GoogleAuthenticator.authenticate(
        "http://localhost:3300"
      );

      setAuthData(authData);
      setStatus("Successfully signed in with Google");
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      setStatus(
        `Failed to sign in with Google: ${error?.message || "Unknown error"}`
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const mintPkp = async () => {
    const { authManager, litClient } = assertDependenciesLoaded();

    if (!authData) {
      throw new Error("No auth data found");
    }

    setStatus("Minting PKP via Google Auth...");
    setIsAuthenticating(true);
    setPkpInfo(null);
    setSignature(null);

    try {
      const res = await litClient.mintWithAuth({
        authData: authData,
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
    } catch (error: any) {
      console.error("Error creating auth context:", error);
      setStatus(
        `Failed to create auth context: ${error?.message || "Unknown error"}`
      );
    } finally {
      setIsCreatingAuthContext(false);
    }
  };

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

  return (
    <div className="tab-content">
      <h2>{AUTH_NAME}</h2>
      <p>
        {AUTH_NAME} uses your Google account to authenticate via the Lit Login
        Server or your own Login Server. This can be used to mint a PKP and then
        sign messages.
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
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*               Sign in with Google                */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>Sign in with Google</h3>
        <p>
          To sign in with Google, you can use the `authenticate` function
          provided by the GoogleAuthenticator.
        </p>
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

        {/* ================================================ */}
        {/*         (Render) Auth Data after sign in          */}
        {/* ================================================ */}
        <div
          style={{
            marginTop: "20px",
            opacity: authData ? 1 : 0.5,
            pointerEvents: authData ? "auto" : "none",
          }}
        >
          <h3>
            Auth Data{" "}
            {!authData && (
              <span style={{ color: "orange" }}>(Sign in to view)</span>
            )}
          </h3>

          <p>
            ❗️Please note that it's highly recommendeded to use your own Google
            Login Server. The one used here is for demo purposes only (See
            prerequisites)
          </p>
          <DisplayCode
            code={
              authData
                ? JSON.stringify(authData, replacer, 2)
                : "// Auth data will appear here after signing in"
            }
            language="typescript"
          />
        </div>

        {/* ================================================ */}
        {/*               Mint PKP via Google                */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>Mint PKP via Google</h3>
        <p>
          Mint a new Programmable Key Pair (PKP) using your Google account. This
          PKP will be associated with your Google identity.
        </p>
        <button
          onClick={mintPkp}
          disabled={!areDependenciesLoaded() || isAuthenticating || !authData}
          style={{
            padding: "10px 15px",
            backgroundColor:
              !areDependenciesLoaded() || isAuthenticating || !authData
                ? "#cccccc"
                : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor:
              !areDependenciesLoaded() || isAuthenticating || !authData
                ? "not-allowed"
                : "pointer",
            fontWeight: "500",
            marginBottom: "10px",
          }}
        >
          {isAuthenticating ? "Minting PKP..." : "Mint New PKP with Google"}
          {!authData && " (Sign in first)"}
        </button>

        {/* ================================================ */}
        {/*         (Render) Minted PKP Information          */}
        {/* ================================================ */}
        <div
          style={{
            marginTop: "20px",
            opacity: pkpInfo ? 1 : 0.5,
          }}
        >
          <h3>
            Minted PKP Information{" "}
            {!pkpInfo && (
              <span style={{ color: "orange" }}>(Mint PKP first)</span>
            )}
          </h3>
          <div
            style={{
              backgroundColor: "#f5f5f5",
              padding: "15px",
              borderRadius: "6px",
              overflowX: "auto",
            }}
          >
            <DisplayCode
              code={
                pkpInfo
                  ? JSON.stringify(pkpInfo, replacer, 2)
                  : "// PKP information will appear here after minting"
              }
              language="typescript"
            />
          </div>
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*               Create AuthContext                  */}
        {/* ================================================ */}
        <h3 style={{ marginTop: 0 }}>
          Step 2: Create AuthContext{" "}
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

        <button
          onClick={createAuthContext}
          disabled={isCreatingAuthContext || !messageToSign.trim() || !pkpInfo}
          style={{
            marginTop: "15px",
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
            : "Create AuthContext with Google PKP"}
        </button>
        {/* ================================================ */}
        {/*         (Render) AuthContext Information          */}
        {/* ================================================ */}
        <div
          style={{
            marginTop: "20px",
            opacity: authContext ? 1 : 0.5,
          }}
        >
          <h3>
            AuthContext Information{" "}
            {!authContext && (
              <span style={{ color: "orange" }}>
                (Create AuthContext first)
              </span>
            )}
          </h3>
          <div
            style={{
              backgroundColor: "#f5f5f5",
              padding: "15px",
              borderRadius: "6px",
              overflowX: "auto",
            }}
          >
            <DisplayCode
              code={
                authContext
                  ? JSON.stringify(authContext, replacer, 2)
                  : "// AuthContext information will appear here after creation"
              }
              language="typescript"
            />
          </div>
        </div>
      </GreyBoarderWhiteBgContainer>

      {/* ================================================ */}
      {/*               Sign Message with PKP               */}
      {/* ================================================ */}

      <GreyBoarderWhiteBgContainer>
        <div
          style={{
            marginTop: "20px",
            opacity: pkpInfo && authContext ? 1 : 0.5,
            pointerEvents: pkpInfo && authContext ? "auto" : "none",
          }}
        >
          <h3>
            Step 3: Sign Message with PKP{" "}
            {!(pkpInfo && authContext) && (
              <span style={{ color: "orange" }}>
                (Requires PKP and AuthContext)
              </span>
            )}
          </h3>
          <p>Use your newly minted PKP to sign a message.</p>

          <p>
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
                disabled={!(pkpInfo && authContext) || isSigning}
              />
            </div>
          </p>
          <p>
            <button
              onClick={signMessage}
              disabled={!(pkpInfo && authContext) || isSigning}
              style={{
                padding: "10px 15px",
                backgroundColor:
                  !(pkpInfo && authContext) || isSigning
                    ? "#cccccc"
                    : "#6f42c1",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor:
                  !(pkpInfo && authContext) || isSigning
                    ? "not-allowed"
                    : "pointer",
                fontWeight: "500",
              }}
            >
              {isSigning ? "Signing..." : "Sign Message"}
            </button>
          </p>
        </div>
        {/* ================================================ */}
        {/*               Signature Result                    */}
        {/* ================================================ */}
        <div
          style={{
            marginTop: "20px",
            opacity: signature ? 1 : 0.5,
          }}
        >
          <h4 style={{ marginBottom: "10px" }}>
            Signature Result:{" "}
            {!signature && (
              <span style={{ color: "orange" }}>(Sign a message first)</span>
            )}
          </h4>
          <DisplayCode
            code={
              signature
                ? JSON.stringify(signature, replacer, 2)
                : "// Signature results will appear here after signing a message"
            }
          />
        </div>
      </GreyBoarderWhiteBgContainer>
    </div>
  );
}
