import { useState, useEffect } from "react";
import { DisplayCode } from "../../../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../../../components/layout/GreyboardWhiteBgContainer";
import EoaAuthSection from "../../../components/common/EoaAuthSection";
import PkpSelectionComponent from "../../../components/common/PkpSelectionComponent";
import { useAppContext } from "../../../router";
import PkpSigningComponent from "../../../components/common/PkpSigningComponent";
import ExecuteJsComponent from "../../../components/common/ExecuteJsComponent";
import { APP_INFO } from "../../../_config";

const AUTH_NAME = "Stytch TOTP 2FA Authentication";

// Configuration constants
const DEFAULT_AUTH_SERVICE_BASE_URL = APP_INFO.litAuthServer;

// Code snippets for each functionality
const AUTHENTICATE_TOTP_CODE = `
import { StytchTotp2FAAuthenticator } from "@lit-protocol/auth";

const authData = await StytchTotp2FAAuthenticator.authenticate({
  userId: "user-test-uuid-1234", // Stytch user ID from primary auth
  totpCode: "123456", // 6-digit code from authenticator app
  authServiceBaseUrl: "https://naga-auth-service.onrender.com"
});`;

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

export default function StytchTotpAuthTab() {
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

  const [userId, setUserId] = useState<string>("");
  const [totpCode, setTotpCode] = useState<string>("");
  const [authServiceBaseUrl, setAuthServiceBaseUrl] = useState<string>(
    DEFAULT_AUTH_SERVICE_BASE_URL
  );
  const [authData, setAuthData] = useState<any>(null);
  const [pkpInfo, setPkpInfo] = useState<any>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isCreatingAuthContext, setIsCreatingAuthContext] = useState(false);
  const [cachedUserIds, setCachedUserIds] = useState<Record<string, string>>(
    {}
  );
  const [selectedCachedUserIdKey, setSelectedCachedUserIdKey] =
    useState<string>("");

  useEffect(() => {
    const loadCachedUserIds = () => {
      const cached: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith("stytchEmailOtp:") ||
            key.startsWith("stytchSmsOtp:") ||
            key.startsWith("stytchWhatsAppOtp:"))
        ) {
          const value = localStorage.getItem(key);
          if (value) {
            cached[key] = value;
          }
        }
      }
      setCachedUserIds(cached);
      if (Object.keys(cached).length > 0) {
        const firstKey = Object.keys(cached)[0];
        setSelectedCachedUserIdKey(firstKey);
        setUserId(cached[firstKey]);
      }
    };
    loadCachedUserIds();
  }, []);

  const handleCachedUserChange = (key: string) => {
    setSelectedCachedUserIdKey(key);
    setUserId(cachedUserIds[key] || "");
  };

  // Authentication Functions
  const authenticateTotp = async () => {
    try {
      setIsAuthenticating(true);
      setStatus("Authenticating with TOTP...");

      if (!userId || !totpCode) {
        throw new Error("Please enter both User ID and TOTP code.");
      }

      // Import StytchTotp2FAAuthenticator dynamically
      const { StytchTotp2FAAuthenticator } = await import("@lit-protocol/auth");

      const authData = await StytchTotp2FAAuthenticator.authenticate({
        userId: userId,
        totpCode: totpCode,
        authServiceBaseUrl: authServiceBaseUrl,
      });

      setAuthData(authData);
      setStatus("TOTP authenticated successfully! You can now mint a PKP.");
    } catch (error: any) {
      console.error("Error authenticating TOTP:", error);
      setStatus(
        `Failed to authenticate TOTP: ${error?.message || "Unknown error"}`
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

  return (
    <div className="tab-content">
      <h2>{AUTH_NAME}</h2>
      <p>
        {AUTH_NAME} is a <strong>secondary authentication method</strong> that
        adds an extra layer of security using TOTP (Time-based One-Time
        Password) from authenticator apps like Google Authenticator, Authy, or
        1Password.
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
            Stytch Auth Service (backend required):{" "}
            {authServiceBaseUrl ? (
              <span style={{ color: "green" }}>✓ Configured</span>
            ) : (
              <span style={{ color: "red" }}>✗ Not configured</span>
            )}
          </li>
          <li>
            Existing Stytch User Account:{" "}
            <span style={{ color: "orange" }}>
              Required (from primary authentication methods, such as Email, SMS,
              or WhatsApp)
            </span>
          </li>
          <li>
            TOTP Configured:{" "}
            <span style={{ color: "orange" }}>
              Must be set up via primary auth method first
            </span>
          </li>
        </ul>

        {/* Auth Service Base URL Configuration */}
        <div style={{ marginTop: "15px" }}>
          <label
            htmlFor="authServiceBaseUrl"
            style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}
          >
            Auth Service Base URL:
          </label>
          <input
            id="authServiceBaseUrl"
            type="url"
            value={authServiceBaseUrl}
            onChange={(e) => setAuthServiceBaseUrl(e.target.value)}
            placeholder={APP_INFO.litAuthServer}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              fontFamily: "monospace",
            }}
          />
          <small style={{ color: "#666", fontSize: "12px" }}>
            URL of your authentication service that handles Stytch interaction.
          </small>
        </div>

        {/* Information box about backend requirement */}
        <div
          style={{
            marginTop: "15px",
            padding: "10px",
            backgroundColor: "#fff3cd",
            borderRadius: "4px",
            border: "1px solid #ffeaa7",
          }}
        >
          <strong>⚠️ Backend Required:</strong> This authentication method
          requires a backend service that handles Stytch TOTP operations. The
          auth service includes the <code>/stytch/totp/authenticate</code>{" "}
          endpoint that is disabled by default - simply run your auth service at
          the configured URL to enable Stytch TOTP functionality.
        </div>
      </GreyBoarderWhiteBgContainer>

      {/* ================================================ */}
      {/*           TOTP 2FA AUTHENTICATION               */}
      {/* ================================================ */}
      <GreyBoarderWhiteBgContainer>
        <h3 style={{ marginTop: 0, color: "#cc6600" }}>
          Step 1: Authenticate with TOTP 2FA
        </h3>
        <p>
          Enter your Stytch User ID (from your primary authentication) and the
          current 6-digit TOTP code from your authenticator app to authenticate
          and generate authentication data.
        </p>

        {Object.keys(cachedUserIds).length > 0 && (
          <div style={{ marginBottom: "15px" }}>
            <label
              htmlFor="cachedUserIdSelect"
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "500",
              }}
            >
              Select Cached User for Authentication:
            </label>
            <select
              id="cachedUserIdSelect"
              value={selectedCachedUserIdKey}
              onChange={(e) => handleCachedUserChange(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                marginBottom: "10px",
              }}
            >
              {Object.entries(cachedUserIds).map(([key, value]) => (
                <option key={key} value={key}>
                  {key} (User ID: {value.substring(0, 8)}...)
                </option>
              ))}
            </select>
          </div>
        )}

        <DisplayCode
          code={AUTHENTICATE_TOTP_CODE}
          language="typescript"
          renderComponent={
            <div style={{ marginBottom: "10px" }}>
              <div style={{ marginBottom: "10px" }}>
                <label
                  htmlFor="authUserId"
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
                >
                  Stytch User ID:
                </label>
                <input
                  id="authUserId"
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="user-test-uuid-1234"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontFamily: "monospace",
                  }}
                />
                <small style={{ color: "#666", fontSize: "12px" }}>
                  Enter the Stytch User ID from your primary authentication
                  method (check the authData from Email/SMS/WhatsApp OTP tabs).
                </small>
              </div>

              <div style={{ marginBottom: "10px" }}>
                <label
                  htmlFor="authTotpCode"
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
                >
                  TOTP Code:
                </label>
                <input
                  id="authTotpCode"
                  type="text"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "16px",
                    fontFamily: "monospace",
                    letterSpacing: "2px",
                  }}
                />
                <small style={{ color: "#666", fontSize: "12px" }}>
                  Enter the current 6-digit code from your authenticator app.
                </small>
              </div>

              <button
                onClick={authenticateTotp}
                disabled={isAuthenticating || !userId || !totpCode}
                style={{
                  padding: "10px 15px",
                  backgroundColor:
                    isAuthenticating || !userId || !totpCode
                      ? "#cccccc"
                      : "#cc6600",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor:
                    isAuthenticating || !userId || !totpCode
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: "500",
                }}
              >
                {isAuthenticating
                  ? "Authenticating..."
                  : "Authenticate with TOTP 2FA"}
                {(!userId || !totpCode) && " (Enter User ID and TOTP code)"}
              </button>
            </div>
          }
          resultData={authData}
          resultLabel="Auth Data from 2FA Authentication"
          useSideBySide={true}
          theme="dracula"
        />
      </GreyBoarderWhiteBgContainer>

      {/* ================================================ */}
      {/*             GET OR MINT PKP                     */}
      {/* ================================================ */}
      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*               Get or Mint PKP via Stytch 2FA    */}
        {/* ================================================ */}
        <PkpSelectionComponent
          authData={authData}
          onPkpSelected={setPkpInfo}
          setStatus={setStatus}
          assertDependenciesLoaded={assertDependenciesLoaded}
          showError={showError}
          authMethodName="Stytch TOTP 2FA Auth"
          mintCodeSnippet={MINT_PKP_CODE}
          disabled={!authData}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h3 style={{ marginTop: 0 }}>
          Step 3: Create AuthContext{" "}
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
                : "Create AuthContext with Stytch PKP"}
            </button>
          }
          resultData={authContext}
          resultLabel="AuthContext Information"
          useSideBySide={true}
          theme="dracula"
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <PkpSigningComponent
          authContext={authContext}
          pkpInfo={pkpInfo}
          setStatus={setStatus}
          assertDependenciesLoaded={assertDependenciesLoaded}
          defaultMessage="Hello from Stytch TOTP 2FA PKP!"
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
          defaultMessage="Hello from Stytch TOTP 2FA Lit Action!"
          componentTitle={`Step 5: Execute Lit Action (${AUTH_NAME})`}
          showError={showError}
        />
      </GreyBoarderWhiteBgContainer>
    </div>
  );
}
