import { useState } from "react";
import { DisplayCode } from "../../../../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../../../../components/layout/GreyboardWhiteBgContainer";
import PkpSelectionComponent from "../../../../components/common/PkpSelectionComponent";
import { useAppContext } from "../../../../router";
import PkpSigningComponent from "../../../../components/common/PkpSigningComponent";
import ExecuteJsComponent from "../../../../components/common/ExecuteJsComponent";

const AUTH_NAME = "Stytch SMS OTP Authentication";

// Configuration constants
const DEFAULT_AUTH_SERVICE_BASE_URL = "https://naga-auth-service.onrender.com";

// Code snippets for each functionality
const SEND_OTP_CODE = `
import { StytchSmsOtpAuthenticator } from "@lit-protocol/auth";

const { methodId } = await StytchSmsOtpAuthenticator.sendOtp({
  phoneNumber: "+1234567890",
  authServiceBaseUrl: "https://naga-auth-service.onrender.com"
});`;

const VERIFY_OTP_CODE = `
import { StytchSmsOtpAuthenticator } from "@lit-protocol/auth";

const authData = await StytchSmsOtpAuthenticator.authenticate({
  methodId: methodId, // from sendOtp step
  code: "123456", // user-entered OTP code
  authServiceBaseUrl: "https://naga-auth-service.onrender.com"
});`;

const MINT_PKP_CODE = `
const res = await litClient.authService.mintWithAuth({
  authData: authData,
});`;

const TOTP_SETUP_CODE = `
import { StytchTotp2FAAuthenticator } from "@lit-protocol/auth";

// Step 1: Create TOTP registration
const registrationData = await StytchTotp2FAAuthenticator.initiateTotpRegistration({
  userId:authData?.metadata?.userId // from your SMS auth
  authServiceBaseUrl: "https://naga-auth-service.onrender.com"
});

// Step 2: Verify TOTP setup with code from authenticator app
const verifyResult = await StytchTotp2FAAuthenticator.verifyTotpRegistration({
  userId:authData?.metadata?.userId
  totpRegistrationId: registrationData.totpRegistrationId,
  totpCode: "123456", // from authenticator app
  authServiceBaseUrl: "https://naga-auth-service.onrender.com"
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

export default function StytchSmsOtpAuthTab() {
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

  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isCreatingAuthContext, setIsCreatingAuthContext] = useState(false);

  // 2FA Setup state
  const [isSettingUpTotp, setIsSettingUpTotp] = useState(false);
  const [isVerifyingTotpSetup, setIsVerifyingTotpSetup] = useState(false);
  const [showTotpSetup, setShowTotpSetup] = useState(false);
  const [totpRegistrationData, setTotpRegistrationData] = useState<any>(null);
  const [totpSetupCode, setTotpSetupCode] = useState<string>("");

  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const [authServiceBaseUrl, setAuthServiceBaseUrl] = useState<string>(
    DEFAULT_AUTH_SERVICE_BASE_URL
  );
  const [methodId, setMethodId] = useState<string>("");
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

  const sendOtp = async () => {
    try {
      setIsSendingOtp(true);
      setStatus("Sending OTP to phone number...");

      if (!phoneNumber) {
        throw new Error("Please enter a valid phone number.");
      }

      // Import StytchSmsOtpAuthenticator dynamically
      const { StytchSmsOtpAuthenticator } = await import("@lit-protocol/auth");

      const result = await StytchSmsOtpAuthenticator.sendOtp({
        phoneNumber: phoneNumber,
        authServiceBaseUrl: authServiceBaseUrl,
      });

      setMethodId(result.methodId);
      setStatus(
        `OTP sent successfully to ${phoneNumber}. Check your phone for the verification code.`
      );
      showSuccess("stytch-sms-send-otp");
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      const errorMessage = formatErrorMessage("Failed to send OTP: ", error);
      setStatus(errorMessage);
      showError?.(errorMessage);
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

      // Import StytchSmsOtpAuthenticator dynamically
      const { StytchSmsOtpAuthenticator } = await import("@lit-protocol/auth");

      const authData = await StytchSmsOtpAuthenticator.authenticate({
        methodId: methodId,
        code: otpCode,
        authServiceBaseUrl: authServiceBaseUrl,
      });

      setAuthData(authData);
      setStatus(
        "OTP verified successfully! You can now optionally set up 2FA or mint a PKP directly."
      );
      showSuccess("stytch-sms-verify-otp");

      // Cache the userId
      if (authData?.metadata?.userId && phoneNumber) {
        localStorage.setItem(
          `stytchSmsOtp:${phoneNumber}`,
          authData.metadata.userId
        );
        console.log(`Cached userId for stytchSmsOtp:${phoneNumber}`);
      }
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      const errorMessage = formatErrorMessage("Failed to verify OTP: ", error);
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsVerifyingOtp(false);
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
      showSuccess("stytch-sms-create-auth-context");
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

  // 2FA Setup Functions
  const setupTotp = async () => {
    try {
      setIsSettingUpTotp(true);
      setStatus("Setting up TOTP 2FA...");

      if (!authData?.metadata?.userId) {
        throw new Error(
          "No user ID found in auth data. Please verify OTP first."
        );
      }

      // Import StytchTotp2FAAuthenticator dynamically
      const { StytchTotp2FAAuthenticator } = await import("@lit-protocol/auth");

      const registrationData =
        await StytchTotp2FAAuthenticator.initiateTotpRegistration({
          userId: authData?.metadata?.userId,
          authServiceBaseUrl: authServiceBaseUrl,
        });

      setTotpRegistrationData(registrationData);
      setStatus(
        "TOTP 2FA setup initiated! Scan the QR code with your authenticator app and enter the code to complete setup."
      );
      showSuccess("stytch-sms-setup-totp");
    } catch (error: any) {
      console.error("Error setting up TOTP:", error);
      const errorMessage = formatErrorMessage("Failed to setup TOTP: ", error);
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsSettingUpTotp(false);
    }
  };

  const verifyTotpSetup = async () => {
    try {
      setIsVerifyingTotpSetup(true);
      setStatus("Verifying TOTP setup...");

      if (!totpSetupCode || !totpRegistrationData?.totpRegistrationId) {
        throw new Error(
          "Please enter the TOTP code from your authenticator app."
        );
      }

      // Import StytchTotp2FAAuthenticator dynamically
      const { StytchTotp2FAAuthenticator } = await import("@lit-protocol/auth");

      const verifyResult =
        await StytchTotp2FAAuthenticator.verifyTotpRegistration({
          userId: authData?.metadata?.userId,
          totpRegistrationId: totpRegistrationData.totpRegistrationId,
          totpCode: totpSetupCode,
          authServiceBaseUrl: authServiceBaseUrl,
        });

      setStatus(
        "🎉 TOTP 2FA setup completed successfully! You can now use the TOTP 2FA tab for future logins."
      );
      setShowTotpSetup(false);
      showSuccess("stytch-sms-verify-totp-setup");
    } catch (error: any) {
      console.error("Error verifying TOTP setup:", error);
      const errorMessage = formatErrorMessage(
        "Failed to verify TOTP setup: ",
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsVerifyingTotpSetup(false);
    }
  };

  return (
    <div className="tab-content">
      <h2>{AUTH_NAME}</h2>
      <p>
        {AUTH_NAME} uses Stytch's SMS OTP service to authenticate users through
        mobile phone verification. This method sends a one-time password (OTP)
        to your phone number, which you then use to verify your identity and
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
          requires a backend service that handles Stytch SMS OTP operations. The
          auth service already has the implementation in place with the{" "}
          <code>/stytch/sms/send-otp</code> and{" "}
          <code>/stytch/sms/verify-otp</code> endpoints, but they are disabled
          by default. Simply run your auth service at the configured URL to
          enable Stytch SMS OTP functionality.
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*                   Send OTP                       */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>Step 1: Send OTP to Phone</h3>
        <p>
          Enter your phone number to receive a one-time password (OTP). The OTP
          will be sent via Stytch's SMS service through your backend.
        </p>

        <DisplayCode
          code={SEND_OTP_CODE}
          language="typescript"
          renderComponent={
            <div style={{ marginBottom: "10px" }}>
              <div style={{ marginBottom: "10px" }}>
                <label
                  htmlFor="phoneNumber"
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
                >
                  Phone Number:
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
                  Enter phone number in international format (e.g.,
                  +1234567890).
                </small>
              </div>

              <div style={{ marginBottom: "10px" }}>
                <label
                  htmlFor="authServiceBaseUrl"
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
                >
                  Auth Service Base URL:
                </label>
                <input
                  id="authServiceBaseUrl"
                  type="url"
                  value={authServiceBaseUrl}
                  onChange={(e) => setAuthServiceBaseUrl(e.target.value)}
                  placeholder="https://naga-auth-service.onrender.com"
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
                  URL of your authentication service that handles Stytch
                  interaction.
                </small>
              </div>

              <button
                onClick={sendOtp}
                disabled={isSendingOtp || !phoneNumber}
                style={{
                  padding: "10px 15px",
                  backgroundColor:
                    isSendingOtp || !phoneNumber ? "#cccccc" : "#4285F4",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor:
                    isSendingOtp || !phoneNumber ? "not-allowed" : "pointer",
                  fontWeight: "500",
                }}
              >
                {isSendingOtp ? "Sending OTP..." : "Send OTP to Phone"}
                {!phoneNumber && " (Enter phone number first)"}
              </button>
            </div>
          }
          resultData={methodId ? { methodId } : null}
          resultLabel="Method ID"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("stytch-sms-send-otp")}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*                  Verify OTP                      */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>Step 2: Verify OTP Code</h3>
        <p>
          Enter the OTP code sent to your phone to verify your identity and
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
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
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
                  Enter the 6-digit code sent to your phone.
                </small>
              </div>

              <button
                onClick={verifyOtp}
                disabled={isVerifyingOtp || !otpCode || !methodId}
                style={{
                  padding: "10px 15px",
                  backgroundColor:
                    isVerifyingOtp || !otpCode || !methodId
                      ? "#cccccc"
                      : "#4285F4",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor:
                    isVerifyingOtp || !otpCode || !methodId
                      ? "not-allowed"
                      : "pointer",
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
          isSuccess={successActions.has("stytch-sms-verify-otp")}
        />
      </GreyBoarderWhiteBgContainer>

      {/* ================================================ */}
      {/*              OPTIONAL: 2FA SETUP                */}
      {/* ================================================ */}
      {authData && (
        <div style={{ opacity: 0.85 }}>
          <GreyBoarderWhiteBgContainer>
            <h3 style={{ marginTop: "20px", color: "#0066cc" }}>
              Optional: Set Up TOTP 2FA{" "}
              {!authData && (
                <span style={{ color: "orange" }}>(Verify OTP first)</span>
              )}
            </h3>
            <p>
              Add an extra layer of security to your account by setting up TOTP
              (Time-based One-Time Password) 2FA. This will allow you to use
              authenticator apps like Google Authenticator, Authy, or 1Password
              for future logins.
            </p>

            {!showTotpSetup ? (
              <div style={{ marginBottom: "20px" }}>
                <button
                  onClick={() => setShowTotpSetup(true)}
                  disabled={!authData}
                  style={{
                    padding: "10px 15px",
                    backgroundColor: !authData ? "#cccccc" : "#0066cc",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: !authData ? "not-allowed" : "pointer",
                    fontWeight: "500",
                    marginRight: "10px",
                  }}
                >
                  🔐 Set Up 2FA (Recommended)
                </button>
                <button
                  onClick={() => setShowTotpSetup(false)}
                  style={{
                    padding: "10px 15px",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                >
                  Skip for Now
                </button>
              </div>
            ) : (
              <div>
                {/* Step 1: Setup TOTP */}
                <h4>Step 1: Create TOTP Registration</h4>
                <DisplayCode
                  code={TOTP_SETUP_CODE}
                  language="typescript"
                  renderComponent={
                    <div style={{ marginBottom: "10px" }}>
                      <button
                        onClick={setupTotp}
                        disabled={
                          isSettingUpTotp || !authData?.metadata?.userId
                        }
                        style={{
                          padding: "10px 15px",
                          backgroundColor:
                            isSettingUpTotp || !authData?.metadata?.userId
                              ? "#cccccc"
                              : "#0066cc",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor:
                            isSettingUpTotp || !authData?.metadata?.userId
                              ? "not-allowed"
                              : "pointer",
                          fontWeight: "500",
                        }}
                      >
                        {isSettingUpTotp
                          ? "Setting up..."
                          : "Generate QR Code & Secret"}
                      </button>
                    </div>
                  }
                  resultData={totpRegistrationData}
                  resultLabel="TOTP Registration Data"
                  useSideBySide={true}
                  theme="dracula"
                  isSuccess={successActions.has("stytch-sms-setup-totp")}
                />

                {/* QR Code Display */}
                {totpRegistrationData?.qrCode && (
                  <div
                    style={{
                      marginTop: "15px",
                      padding: "15px",
                      backgroundColor: "#f0f9ff",
                      borderRadius: "4px",
                      border: "1px solid #bee3f8",
                    }}
                  >
                    <h4 style={{ margin: "0 0 10px 0" }}>
                      📱 Set Up Your Authenticator App
                    </h4>
                    <p style={{ margin: "0 0 15px 0" }}>
                      Scan this QR code with your authenticator app (Google
                      Authenticator, Authy, 1Password, etc.):
                    </p>
                    <div style={{ textAlign: "center", marginBottom: "15px" }}>
                      <img
                        src={totpRegistrationData.qrCode}
                        alt="TOTP QR Code"
                        style={{
                          maxWidth: "200px",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                        }}
                      />
                    </div>
                    <p style={{ margin: "0 0 10px 0" }}>
                      <strong>Or manually enter this secret:</strong>
                    </p>
                    <code
                      style={{
                        display: "block",
                        padding: "8px",
                        backgroundColor: "#ffffff",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        fontFamily: "monospace",
                        wordBreak: "break-all",
                      }}
                    >
                      {totpRegistrationData.secret}
                    </code>
                    {totpRegistrationData.recoveryCodes &&
                      totpRegistrationData.recoveryCodes.length > 0 && (
                        <div style={{ marginTop: "15px" }}>
                          <p
                            style={{
                              margin: "0 0 10px 0",
                              color: "#dc3545",
                              fontWeight: "600",
                            }}
                          >
                            🔑 Recovery Codes - Save These Immediately!
                          </p>
                          <div
                            style={{
                              padding: "12px",
                              backgroundColor: "#fff5f5",
                              border: "2px solid #fecaca",
                              borderRadius: "6px",
                              marginBottom: "10px",
                            }}
                          >
                            <p
                              style={{
                                margin: "0 0 8px 0",
                                fontSize: "13px",
                                color: "#7f1d1d",
                                fontWeight: "500",
                              }}
                            >
                              ⚠️ Store these recovery codes in a safe place.
                              Each code can only be used once to regain access
                              if you lose your authenticator device.
                            </p>
                          </div>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "8px",
                              padding: "12px",
                              backgroundColor: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              borderRadius: "6px",
                              marginBottom: "10px",
                            }}
                          >
                            {totpRegistrationData.recoveryCodes.map(
                              (code: string, index: number) => (
                                <div
                                  key={index}
                                  style={{
                                    padding: "6px 8px",
                                    backgroundColor: "#ffffff",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "4px",
                                    fontFamily: "monospace",
                                    fontSize: "13px",
                                    textAlign: "center",
                                    color: "#374151",
                                    fontWeight: "500",
                                  }}
                                >
                                  {code}
                                </div>
                              )
                            )}
                          </div>
                          <button
                            onClick={() => {
                              const codesText =
                                totpRegistrationData.recoveryCodes.join("\n");
                              navigator.clipboard
                                .writeText(codesText)
                                .then(() => {
                                  // Brief visual feedback
                                  const button =
                                    document.activeElement as HTMLButtonElement;
                                  const originalText = button.textContent;
                                  button.textContent = "✓ Copied!";
                                  button.style.backgroundColor = "#10b981";
                                  setTimeout(() => {
                                    button.textContent = originalText;
                                    button.style.backgroundColor = "#6366f1";
                                  }, 2000);
                                })
                                .catch(() => {
                                  alert(
                                    "Failed to copy codes. Please manually save them."
                                  );
                                });
                            }}
                            style={{
                              padding: "8px 16px",
                              backgroundColor: "#6366f1",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "13px",
                              fontWeight: "500",
                              transition: "background-color 0.2s",
                            }}
                          >
                            📋 Copy All Codes
                          </button>
                        </div>
                      )}
                  </div>
                )}

                {/* Step 2: Verify TOTP Setup */}
                {totpRegistrationData && (
                  <div style={{ marginTop: "20px" }}>
                    <h4>Step 2: Verify TOTP Setup</h4>
                    <p>
                      Enter the 6-digit code from your authenticator app to
                      complete the 2FA setup:
                    </p>

                    <div style={{ marginBottom: "10px" }}>
                      <div style={{ marginBottom: "10px" }}>
                        <label
                          htmlFor="totpSetupCode"
                          style={{
                            display: "block",
                            marginBottom: "5px",
                            fontWeight: "500",
                          }}
                        >
                          TOTP Code from Authenticator App:
                        </label>
                        <input
                          id="totpSetupCode"
                          type="text"
                          value={totpSetupCode}
                          onChange={(e) => setTotpSetupCode(e.target.value)}
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
                      </div>

                      <button
                        onClick={verifyTotpSetup}
                        disabled={isVerifyingTotpSetup || !totpSetupCode}
                        style={{
                          padding: "10px 15px",
                          backgroundColor:
                            isVerifyingTotpSetup || !totpSetupCode
                              ? "#cccccc"
                              : "#28a745",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor:
                            isVerifyingTotpSetup || !totpSetupCode
                              ? "not-allowed"
                              : "pointer",
                          fontWeight: "500",
                          marginRight: "10px",
                        }}
                      >
                        {isVerifyingTotpSetup
                          ? "Verifying..."
                          : "Complete 2FA Setup"}
                      </button>

                      <button
                        onClick={() => {
                          setShowTotpSetup(false);
                          setTotpRegistrationData(null);
                          setTotpSetupCode("");
                        }}
                        style={{
                          padding: "10px 15px",
                          backgroundColor: "#6c757d",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: "500",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </GreyBoarderWhiteBgContainer>
        </div>
      )}

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*               Get or Mint PKP via Stytch        */}
        {/* ================================================ */}
        <PkpSelectionComponent
          authData={authData}
          onPkpSelected={setPkpInfo}
          setStatus={setStatus}
          assertDependenciesLoaded={assertDependenciesLoaded}
          showError={showError}
          authMethodName="Stytch SMS OTP Auth"
          mintCodeSnippet={MINT_PKP_CODE}
          disabled={!authData}
        />
      </GreyBoarderWhiteBgContainer>

      {/* ================================================ */}
      {/*               Create AuthContext                  */}
      {/* ================================================ */}
      <GreyBoarderWhiteBgContainer>
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
                : "Create AuthContext with Stytch PKP"}
            </button>
          }
          resultData={authContext}
          resultLabel="AuthContext Information"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("stytch-sms-create-auth-context")}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*               Sign Message with PKP               */}
        {/* ================================================ */}

        <PkpSigningComponent
          authContext={authContext}
          pkpInfo={pkpInfo}
          setStatus={setStatus}
          assertDependenciesLoaded={assertDependenciesLoaded}
          defaultMessage="Hello from Stytch SMS OTP PKP!"
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
          defaultMessage="Hello from Stytch SMS OTP Lit Action!"
          componentTitle={`Step 6: Execute Lit Action (${AUTH_NAME})`}
          showError={showError}
        />
      </GreyBoarderWhiteBgContainer>
    </div>
  );
}
