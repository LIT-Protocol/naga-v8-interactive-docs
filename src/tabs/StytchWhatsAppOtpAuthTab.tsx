import { useState } from "react";
import { DisplayCode } from "../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../components/layout/GreyboardWhiteBgContainer";
import EoaAuthSection from "../components/common/EoaAuthSection";
import { useAppContext } from "../router";
import PkpSigningComponent from "../components/common/PkpSigningComponent";

const AUTH_NAME = "Stytch WhatsApp OTP Authentication";

// Configuration constants
const DEFAULT_AUTH_SERVICE_BASE_URL = "http://localhost:3301";

// Code snippets for each functionality
const SEND_OTP_CODE = `
import { StytchWhatsAppOtpAuthenticator } from "@lit-protocol/auth";

const { methodId } = await StytchWhatsAppOtpAuthenticator.sendOtp({
  phoneNumber: "+1234567890",
  authServiceBaseUrl: "http://localhost:3301"
});`;

const VERIFY_OTP_CODE = `
import { StytchWhatsAppOtpAuthenticator } from "@lit-protocol/auth";

const authData = await StytchWhatsAppOtpAuthenticator.authenticate({
  methodId: methodId, // from sendOtp step
  code: "123456", // user-entered OTP code
  authServiceBaseUrl: "http://localhost:3301"
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

export default function StytchWhatsAppOtpAuthTab() {
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
  } = useAppContext();

  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [isCreatingAuthContext, setIsCreatingAuthContext] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const [authServiceBaseUrl, setAuthServiceBaseUrl] = useState<string>(
    DEFAULT_AUTH_SERVICE_BASE_URL
  );
  const [methodId, setMethodId] = useState<string>("");
  const [authData, setAuthData] = useState<any>(null);
  const [pkpInfo, setPkpInfo] = useState<any>(null);

  const sendOtp = async () => {
    try {
      setIsSendingOtp(true);
      setStatus("Sending OTP to WhatsApp...");

      if (!phoneNumber) {
        throw new Error("Please enter a valid phone number.");
      }

      // Import StytchWhatsAppOtpAuthenticator dynamically
      const { StytchWhatsAppOtpAuthenticator } = await import(
        "@lit-protocol/auth"
      );

      const result = await StytchWhatsAppOtpAuthenticator.sendOtp({
        phoneNumber: phoneNumber,
        authServiceBaseUrl: authServiceBaseUrl,
      });

      setMethodId(result.methodId);
      setStatus(
        `OTP sent successfully to ${phoneNumber} via WhatsApp. Check your WhatsApp messages for the verification code.`
      );
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      setStatus(`Failed to send OTP: ${error?.message || "Unknown error"}`);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    try {
      setIsVerifyingOtp(true);
      setStatus("Verifying OTP code...");

      if (!otpCode || !methodId) {
        throw new Error(
          "Please enter the OTP code and ensure you've sent an OTP first."
        );
      }

      // Import StytchWhatsAppOtpAuthenticator dynamically
      const { StytchWhatsAppOtpAuthenticator } = await import(
        "@lit-protocol/auth"
      );

      const authData = await StytchWhatsAppOtpAuthenticator.authenticate({
        methodId: methodId,
        code: otpCode,
        authServiceBaseUrl: authServiceBaseUrl,
      });

      setAuthData(authData);
      setStatus("OTP verified successfully! You can now mint a PKP.");
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      setStatus(`Failed to verify OTP: ${error?.message || "Unknown error"}`);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const mintPkp = async () => {
    const { authManager, litClient } = assertDependenciesLoaded();

    if (!authData) {
      throw new Error("No auth data found");
    }

    setStatus("Minting PKP via Stytch WhatsApp OTP Auth...");
    setIsMinting(true);
    setPkpInfo(null);

    try {
      const res = await litClient.authService.mintWithAuth({
        authData: authData,
      });

      const mintedPkpInfo = res.data;
      setPkpInfo(mintedPkpInfo);
      console.log("Minted PKP Info:", mintedPkpInfo);
      setStatus("PKP minted successfully via Stytch WhatsApp OTP Auth!");
    } catch (error: any) {
      console.error("Error minting PKP with Stytch WhatsApp OTP Auth:", error);
      setStatus(
        `Failed to mint PKP with Stytch WhatsApp OTP Auth: ${
          error?.message || "Unknown error"
        }`
      );
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
        {AUTH_NAME} uses Stytch's WhatsApp OTP service to authenticate users
        through WhatsApp messaging. This method sends a one-time password (OTP)
        to your WhatsApp account via your phone number, which you then use to verify your identity and
        mint a PKP.
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
            Valid Phone Number:{" "}
            {phoneNumber ? (
              <span style={{ color: "green" }}>✓ Provided</span>
            ) : (
              <span style={{ color: "red" }}>✗ Not provided</span>
            )}
          </li>
          <li>
            WhatsApp Account:{" "}
            <span style={{ color: "orange" }}>
              Ensure your phone number is associated with a WhatsApp account
            </span>
          </li>
        </ul>

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
          requires a backend service that handles Stytch WhatsApp OTP operations.
          The auth service already has the implementation in place with the{" "}
          <code>/stytch/whatsapp/send-otp</code> and{" "}
          <code>/stytch/whatsapp/verify-otp</code> endpoints, but they are disabled
          by default. Simply run your auth service at the configured URL to
          enable Stytch WhatsApp OTP functionality.
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*                   Send OTP                       */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>Step 1: Send OTP to WhatsApp</h3>
        <p>
          Enter your phone number to receive a one-time password (OTP) via WhatsApp. The OTP
          will be sent through Stytch's WhatsApp service via your backend to your WhatsApp account.
        </p>

        <DisplayCode
          code={SEND_OTP_CODE}
          language="typescript"
          renderComponent={
            <div style={{ marginBottom: "10px" }}>
              <div style={{ marginBottom: "10px" }}>
                <label
                  htmlFor="phoneNumber"
                  style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}
                >
                  Phone Number (WhatsApp):
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                />
                <small style={{ color: "#666", fontSize: "12px" }}>
                  Enter phone number in international format (e.g., +1234567890). Must be associated with a WhatsApp account.
                </small>
              </div>

              <div style={{ marginBottom: "10px" }}>
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
                  placeholder="http://localhost:3301"
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

              <button
                onClick={sendOtp}
                disabled={isSendingOtp || !phoneNumber}
                style={{
                  padding: "10px 15px",
                  backgroundColor: isSendingOtp || !phoneNumber ? "#cccccc" : "#25D366",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: isSendingOtp || !phoneNumber ? "not-allowed" : "pointer",
                  fontWeight: "500",
                }}
              >
                {isSendingOtp ? "Sending OTP..." : "Send OTP to WhatsApp"}
                {!phoneNumber && " (Enter phone number first)"}
              </button>
            </div>
          }
          resultData={methodId ? { methodId } : null}
          resultLabel="Method ID"
          useSideBySide={true}
          theme="dracula"
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*                  Verify OTP                      */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>Step 2: Verify OTP Code</h3>
        <p>
          Enter the OTP code sent to your WhatsApp to verify your identity and
          generate authentication data.
        </p>

        <DisplayCode
          code={VERIFY_OTP_CODE}
          language="typescript"
          renderComponent={
            <div style={{ marginBottom: "10px" }}>
              <div style={{ marginBottom: "10px" }}>
                <label
                  htmlFor="otpCode"
                  style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}
                >
                  OTP Code:
                </label>
                <input
                  id="otpCode"
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
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
                  Enter the 6-digit code sent to your WhatsApp.
                </small>
              </div>

              <button
                onClick={verifyOtp}
                disabled={isVerifyingOtp || !otpCode || !methodId}
                style={{
                  padding: "10px 15px",
                  backgroundColor:
                    isVerifyingOtp || !otpCode || !methodId ? "#cccccc" : "#25D366",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor:
                    isVerifyingOtp || !otpCode || !methodId ? "not-allowed" : "pointer",
                  fontWeight: "500",
                }}
              >
                {isVerifyingOtp ? "Verifying..." : "Verify OTP Code"}
                {(!otpCode || !methodId) && " (Send OTP first)"}
              </button>
            </div>
          }
          resultData={authData}
          resultLabel="Auth Data"
          useSideBySide={true}
          theme="dracula"
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*               Mint PKP via Stytch               */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>Step 3: Mint PKP via Stytch Auth</h3>
        <p>
          Mint a new Programmable Key Pair (PKP) using your Stytch WhatsApp OTP
          authentication data. This PKP will be associated with your WhatsApp
          account identity.
        </p>

        <DisplayCode
          code={MINT_PKP_CODE}
          language="typescript"
          renderComponent={
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
              {isMinting ? "Minting PKP..." : "Mint New PKP with Stytch Auth"}
              {!authData && " (Verify OTP first)"}
            </button>
          }
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
                : "Create AuthContext with Stytch PKP"}
            </button>
          }
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
        <PkpSigningComponent
          authContext={authContext}
          pkpInfo={pkpInfo}
          setStatus={setStatus}
          assertDependenciesLoaded={assertDependenciesLoaded}
          defaultMessage="Hello from Stytch WhatsApp OTP PKP!"
          componentTitle={`Step 5: Sign Message with PKP (${AUTH_NAME})`}
        />
      </GreyBoarderWhiteBgContainer>
    </div>
  );
} 