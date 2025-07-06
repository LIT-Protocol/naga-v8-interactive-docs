import React, { useState } from "react";

interface AuthenticateStytchEmailProps {
  onBack: () => void;
  onAuthSuccess: (userData: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface AuthUser {
  authContext: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  pkpInfo: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  method: "stytch-email";
  timestamp: number;
  authData?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  accountMethod: string;
}

type StytchEmailStep = "send-otp" | "verify-otp";

const DEFAULT_AUTH_SERVICE_BASE_URL = "https://naga-auth-service.onrender.com";

const AuthenticateStytchEmail: React.FC<AuthenticateStytchEmailProps> = ({
  onBack,
  onAuthSuccess,
}) => {
  const [step, setStep] = useState<StytchEmailStep>("send-otp");
  const [email, setEmail] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const [methodId, setMethodId] = useState<string>("");
  const [authServiceBaseUrl, setAuthServiceBaseUrl] = useState<string>(
    DEFAULT_AUTH_SERVICE_BASE_URL
  );

  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  const formatErrorMessage = (prefix: string, error: any): string => {
    // eslint-disable-line @typescript-eslint/no-explicit-any
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
      setError(null);
      setStatus("Sending OTP to your email...");

      if (!email || !email.includes("@")) {
        throw new Error("Please enter a valid email address.");
      }

      const { StytchEmailOtpAuthenticator } = await import(
        "@lit-protocol/auth"
      );

      const result = await StytchEmailOtpAuthenticator.sendOtp({
        email: email,
        authServiceBaseUrl: authServiceBaseUrl,
      });

      setMethodId(result.methodId);
      setStatus(
        `✅ OTP sent successfully to ${email}! Check your email for the verification code.`
      );
      setStep("verify-otp");
    } catch (error: any) {
      // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error("Error sending OTP:", error);
      const errorMessage = formatErrorMessage("Failed to send OTP: ", error);
      setError(errorMessage);
      setStatus(errorMessage);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    try {
      setIsVerifyingOtp(true);
      setError(null);
      setStatus("Verifying OTP code...");

      if (!otpCode || !methodId) {
        throw new Error("Please enter the OTP code.");
      }

      const { StytchEmailOtpAuthenticator } = await import(
        "@lit-protocol/auth"
      );

      const authData = await StytchEmailOtpAuthenticator.authenticate({
        methodId: methodId,
        code: otpCode,
        authServiceBaseUrl: authServiceBaseUrl,
      });

      setStatus("✅ OTP verified successfully!");

      // Cache the userId for potential future use
      if (authData?.metadata?.userId && email) {
        localStorage.setItem(
          `stytchEmailOtp:${email}`,
          authData.metadata.userId
        );
      }

      // Create user data for Stytch Email authentication
      const userData: AuthUser = {
        authContext: null, // Will be created by Explorer after PKP selection
        pkpInfo: null, // Will be set by Explorer when PKP is selected
        method: "stytch-email",
        timestamp: Date.now(),
        authData: authData,
        accountMethod: "stytch-email",
      };

      // Brief delay to show success message
      setTimeout(() => {
        onAuthSuccess(userData);
      }, 1000);
    } catch (error: any) {
      // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error("Error verifying OTP:", error);
      const errorMessage = formatErrorMessage("Failed to verify OTP: ", error);
      setError(errorMessage);
      setStatus(errorMessage);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleBackToSendOtp = () => {
    setStep("send-otp");
    setOtpCode("");
    setError(null);
    setStatus("");
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      {/* Back Button */}
      <button
        onClick={step === "send-otp" ? onBack : handleBackToSendOtp}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          backgroundColor: "transparent",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "14px",
          color: "#6b7280",
          marginBottom: "2rem",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#f9fafb";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        ← {step === "send-otp" ? "Back" : "Back to Email"}
      </button>

      {/* Main Content */}
      <div
        style={{
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "2rem",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: "600",
            color: "#111827",
            marginBottom: "2rem",
            textAlign: "center",
          }}
        >
          Email OTP Authentication
        </h2>

        {/* Step Indicator */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* Step 1 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                1
              </div>
              <span
                style={{
                  fontSize: "14px",
                  color: "#374151",
                  fontWeight: "500",
                }}
              >
                Send OTP
              </span>
            </div>

            {/* Arrow */}
            <div
              style={{
                flex: 1,
                height: "2px",
                backgroundColor: step === "verify-otp" ? "#3b82f6" : "#e5e7eb",
                transition: "all 0.3s",
              }}
            />

            {/* Step 2 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor:
                    step === "verify-otp" ? "#3b82f6" : "#e5e7eb",
                  color: step === "verify-otp" ? "white" : "#6b7280",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "600",
                  transition: "all 0.3s",
                }}
              >
                2
              </div>
              <span
                style={{
                  fontSize: "14px",
                  color: step === "verify-otp" ? "#374151" : "#6b7280",
                  fontWeight: "500",
                  transition: "all 0.3s",
                }}
              >
                Verify OTP
              </span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        {step === "send-otp" ? (
          /* Send OTP Step */
          <div>
            <div style={{ marginBottom: "2rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "0.5rem",
                }}
              >
                Email Address:
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#3b82f6";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#d1d5db";
                }}
              />
            </div>

            {/* Advanced Settings (Auth Service URL) */}
            <details style={{ marginBottom: "2rem" }}>
              <summary
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  cursor: "pointer",
                  marginBottom: "0.5rem",
                }}
              >
                Advanced Settings
              </summary>
              <div style={{ paddingLeft: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "0.5rem",
                  }}
                >
                  Auth Service URL:
                </label>
                <input
                  type="url"
                  value={authServiceBaseUrl}
                  onChange={(e) => setAuthServiceBaseUrl(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontFamily: "monospace",
                  }}
                />
              </div>
            </details>

            <button
              onClick={sendOtp}
              disabled={isSendingOtp || !email}
              style={{
                width: "100%",
                padding: "16px",
                backgroundColor: isSendingOtp || !email ? "#9ca3af" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: isSendingOtp || !email ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                if (!isSendingOtp && email) {
                  e.currentTarget.style.backgroundColor = "#2563eb";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSendingOtp && email) {
                  e.currentTarget.style.backgroundColor = "#3b82f6";
                }
              }}
            >
              {isSendingOtp && (
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid transparent",
                    borderTop: "2px solid #ffffff",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
              )}
              {isSendingOtp ? "Sending OTP..." : "Send OTP"}
            </button>
          </div>
        ) : (
          /* Verify OTP Step */
          <div>
            <div
              style={{
                marginBottom: "1rem",
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              We sent a verification code to <strong>{email}</strong>
            </div>

            <div style={{ marginBottom: "2rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "0.5rem",
                }}
              >
                Verification Code:
              </label>

              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "18px",
                  fontFamily: "monospace",
                  textAlign: "center",
                  letterSpacing: "0.2em",
                  outline: "none",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#3b82f6";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#d1d5db";
                }}
              />
            </div>

            <button
              onClick={verifyOtp}
              disabled={isVerifyingOtp || !otpCode}
              style={{
                width: "100%",
                padding: "16px",
                backgroundColor:
                  isVerifyingOtp || !otpCode ? "#9ca3af" : "#10b981",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: isVerifyingOtp || !otpCode ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                if (!isVerifyingOtp && otpCode) {
                  e.currentTarget.style.backgroundColor = "#059669";
                }
              }}
              onMouseLeave={(e) => {
                if (!isVerifyingOtp && otpCode) {
                  e.currentTarget.style.backgroundColor = "#10b981";
                }
              }}
            >
              {isVerifyingOtp && (
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid transparent",
                    borderTop: "2px solid #ffffff",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
              )}
              {isVerifyingOtp ? "Verifying..." : "Verify & Continue"}
            </button>

            {/* Resend OTP option */}
            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <button
                onClick={() => {
                  setStep("send-otp");
                  setOtpCode("");
                  setError(null);
                  setStatus("You can now send a new OTP code.");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#3b82f6",
                  fontSize: "14px",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Didn't receive the code? Send again
              </button>
            </div>
          </div>
        )}

        {/* Status Message */}
        {status && (
          <div
            style={{
              marginTop: "1rem",
              padding: "12px",
              backgroundColor: error ? "#fef2f2" : "#f0f9ff",
              border: "1px solid",
              borderColor: error ? "#fecaca" : "#bfdbfe",
              borderRadius: "8px",
              fontSize: "14px",
              color: error ? "#dc2626" : "#1e40af",
            }}
          >
            {status}
          </div>
        )}

        {/* Info Message */}
        <div
          style={{
            marginTop: "1.5rem",
            padding: "12px",
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          <p style={{ margin: "0 0 8px 0" }}>
            <strong>How it works:</strong>
          </p>
          <ol style={{ margin: 0, paddingLeft: "1.2rem" }}>
            <li>Enter your email address to receive a verification code</li>
            <li>Check your email and enter the 6-digit code</li>
            <li>Your identity will be verified and you can mint a PKP</li>
          </ol>
        </div>
      </div>

      {/* Keyframe animation for spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AuthenticateStytchEmail;
