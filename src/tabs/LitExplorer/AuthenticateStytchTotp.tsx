import React, { useState, useEffect } from "react";

interface AuthenticateStytchTotpProps {
  onBack: () => void;
  onAuthSuccess: (userData: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface AuthUser {
  authContext: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  pkpInfo: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  method: "stytch-totp";
  timestamp: number;
  authData?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  accountMethod: string;
}

type TotpMode = "setup" | "authenticate";

const DEFAULT_AUTH_SERVICE_BASE_URL = import.meta.env.VITE_AUTH_SERVICE_BASE_URL || "https://naga-auth-service.onrender.com";

const AuthenticateStytchTotp: React.FC<AuthenticateStytchTotpProps> = ({
  onBack,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<TotpMode>("setup");
  const [userId, setUserId] = useState<string>("");
  const [totpCode, setTotpCode] = useState<string>("");
  const [totpSetupCode, setTotpSetupCode] = useState<string>("");
  const [authServiceBaseUrl, setAuthServiceBaseUrl] = useState<string>(
    DEFAULT_AUTH_SERVICE_BASE_URL
  );
  const [cachedUserIds, setCachedUserIds] = useState<Record<string, string>>(
    {}
  );
  const [selectedCachedUserIdKey, setSelectedCachedUserIdKey] =
    useState<string>("");
  const [totpRegistrationData, setTotpRegistrationData] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [isSettingUpTotp, setIsSettingUpTotp] = useState<boolean>(false);
  const [isVerifyingTotpSetup, setIsVerifyingTotpSetup] =
    useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  // Load cached user IDs from localStorage on component mount
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
        // Default to setup mode if we have cached users
        setMode("setup");
      } else {
        // Default to authenticate mode if no cached users
        setMode("authenticate");
      }
    };
    loadCachedUserIds();
  }, []);

  const handleCachedUserChange = (key: string) => {
    setSelectedCachedUserIdKey(key);
    setUserId(cachedUserIds[key] || "");
  };

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

  // TOTP Setup Functions
  const setupTotp = async () => {
    try {
      setIsSettingUpTotp(true);
      setError(null);
      setStatus("Setting up TOTP 2FA...");

      if (!userId) {
        throw new Error("Please select or enter a User ID.");
      }

      const { StytchTotp2FAAuthenticator } = await import("@lit-protocol/auth");

      const registrationData =
        await StytchTotp2FAAuthenticator.initiateTotpRegistration({
          userId: userId,
          authServiceBaseUrl: authServiceBaseUrl,
        });

      setTotpRegistrationData(registrationData);
      setStatus(
        "✅ TOTP 2FA setup initiated! Scan the QR code with your authenticator app and enter the code to complete setup."
      );
    } catch (error: any) {
      // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error("Error setting up TOTP:", error);
      const errorMessage = formatErrorMessage("Failed to setup TOTP: ", error);
      setError(errorMessage);
      setStatus(errorMessage);
    } finally {
      setIsSettingUpTotp(false);
    }
  };

  const verifyTotpSetup = async () => {
    try {
      setIsVerifyingTotpSetup(true);
      setError(null);
      setStatus("Verifying TOTP setup...");

      if (!totpSetupCode || !totpRegistrationData?.totpRegistrationId) {
        throw new Error(
          "Please enter the TOTP code from your authenticator app."
        );
      }

      const { StytchTotp2FAAuthenticator } = await import("@lit-protocol/auth");

      await StytchTotp2FAAuthenticator.verifyTotpRegistration({
        userId: userId,
        totpRegistrationId: totpRegistrationData.totpRegistrationId,
        totpCode: totpSetupCode,
        authServiceBaseUrl: authServiceBaseUrl,
      });

      setStatus(
        "🎉 TOTP 2FA setup completed successfully! You can now use the Authenticate tab for future logins."
      );
      setTotpRegistrationData(null);
      setTotpSetupCode("");
    } catch (error: any) {
      // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error("Error verifying TOTP setup:", error);
      const errorMessage = formatErrorMessage(
        "Failed to verify TOTP setup: ",
        error
      );
      setError(errorMessage);
      setStatus(errorMessage);
    } finally {
      setIsVerifyingTotpSetup(false);
    }
  };

  const authenticateTotp = async () => {
    try {
      setIsAuthenticating(true);
      setError(null);
      setStatus("Authenticating with TOTP...");

      if (!userId || !totpCode) {
        throw new Error("Please enter both User ID and TOTP code.");
      }

      if (totpCode.length !== 6) {
        throw new Error("TOTP code must be exactly 6 digits.");
      }

      const { StytchTotp2FAAuthenticator } = await import("@lit-protocol/auth");

      const authData = await StytchTotp2FAAuthenticator.authenticate({
        userId: userId,
        totpCode: totpCode,
        authServiceBaseUrl: authServiceBaseUrl,
      });

      setStatus("✅ TOTP authenticated successfully!");

      // Create user data for Stytch TOTP authentication
      const userData: AuthUser = {
        authContext: null, // Will be created by Explorer after PKP selection
        pkpInfo: null, // Will be set by Explorer when PKP is selected
        method: "stytch-totp",
        timestamp: Date.now(),
        authData: authData,
        accountMethod: "stytch-totp",
      };

      // Brief delay to show success message
      setTimeout(() => {
        onAuthSuccess(userData);
      }, 1000);
    } catch (error: any) {
      // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error("Error authenticating TOTP:", error);
      const errorMessage = formatErrorMessage(
        "Failed to authenticate TOTP: ",
        error
      );
      setError(errorMessage);
      setStatus(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const extractUserDisplayName = (cacheKey: string): string => {
    if (cacheKey.startsWith("stytchEmailOtp:")) {
      return cacheKey.replace("stytchEmailOtp:", "");
    }
    if (cacheKey.startsWith("stytchSmsOtp:")) {
      return cacheKey.replace("stytchSmsOtp:", "");
    }
    if (cacheKey.startsWith("stytchWhatsAppOtp:")) {
      return cacheKey.replace("stytchWhatsAppOtp:", "");
    }
    return cacheKey;
  };

  const getAuthMethodDisplayName = (cacheKey: string): string => {
    if (cacheKey.startsWith("stytchEmailOtp:")) {
      return "Email";
    }
    if (cacheKey.startsWith("stytchSmsOtp:")) {
      return "SMS";
    }
    if (cacheKey.startsWith("stytchWhatsAppOtp:")) {
      return "WhatsApp";
    }
    return "Unknown";
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      {/* Back Button */}
      <button
        onClick={onBack}
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
        ← Back
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
            marginBottom: "1rem",
            textAlign: "center",
          }}
        >
          TOTP 2FA Authentication
        </h2>

        {/* Mode Toggle */}
        <div style={{ marginBottom: "2rem" }}>
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              padding: "4px",
              backgroundColor: "#f3f4f6",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
            }}
          >
            <button
              onClick={() => setMode("setup")}
              style={{
                flex: 1,
                padding: "8px 16px",
                backgroundColor: mode === "setup" ? "#6366f1" : "transparent",
                color: mode === "setup" ? "white" : "#6b7280",
                border: "none",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Setup TOTP 2FA
            </button>
            <button
              onClick={() => setMode("authenticate")}
              style={{
                flex: 1,
                padding: "8px 16px",
                backgroundColor:
                  mode === "authenticate" ? "#6366f1" : "transparent",
                color: mode === "authenticate" ? "white" : "#6b7280",
                border: "none",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Authenticate with TOTP
            </button>
          </div>
        </div>

        {mode === "setup" ? (
          /* TOTP Setup Mode */
          <div>
            <div
              style={{
                backgroundColor: "#f0f9ff",
                border: "1px solid #bfdbfe",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "2rem",
                fontSize: "14px",
                color: "#1e40af",
              }}
            >
              <p style={{ margin: "0 0 0.5rem 0", fontWeight: "500" }}>
                🔐 Setup TOTP 2FA for enhanced security
              </p>
              <p style={{ margin: "0" }}>
                This will generate a QR code to scan with your authenticator app
                (Google Authenticator, Authy, 1Password, etc.)
              </p>
            </div>

            {/* User Selection for Setup */}
            {Object.keys(cachedUserIds).length > 0 ? (
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
                  Select User for TOTP Setup:
                </label>
                <select
                  value={selectedCachedUserIdKey}
                  onChange={(e) => handleCachedUserChange(e.target.value)}
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
                    e.currentTarget.style.borderColor = "#6366f1";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#d1d5db";
                  }}
                >
                  {Object.entries(cachedUserIds).map(([key, value]) => (
                    <option key={key} value={key}>
                      {getAuthMethodDisplayName(key)}:{" "}
                      {extractUserDisplayName(key)} (ID: {value.substring(0, 8)}
                      ...)
                    </option>
                  ))}
                </select>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginTop: "4px",
                  }}
                >
                  Choose which authenticated user account to set up TOTP for
                </div>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: "#fef3c7",
                  border: "1px solid #f59e0b",
                  borderRadius: "8px",
                  padding: "1rem",
                  marginBottom: "2rem",
                  fontSize: "14px",
                  color: "#92400e",
                }}
              >
                <p style={{ margin: "0 0 0.5rem 0", fontWeight: "500" }}>
                  ⚠️ No authenticated users found
                </p>
                <p style={{ margin: "0" }}>
                  You need to authenticate with Email, SMS, or WhatsApp first
                  before setting up TOTP 2FA.
                </p>
              </div>
            )}

            {/* Manual User ID for Setup */}
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
                User ID:
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="user-test-uuid-1234"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontFamily: "monospace",
                  outline: "none",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#6366f1";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#d1d5db";
                }}
              />
            </div>

            {!totpRegistrationData ? (
              /* Initial Setup Button */
              <button
                onClick={setupTotp}
                disabled={isSettingUpTotp || !userId}
                style={{
                  width: "100%",
                  padding: "16px",
                  backgroundColor:
                    isSettingUpTotp || !userId ? "#9ca3af" : "#6366f1",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor:
                    isSettingUpTotp || !userId ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {isSettingUpTotp && (
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
                {isSettingUpTotp ? "Setting up TOTP..." : "Generate QR Code"}
              </button>
            ) : (
              /* QR Code and Verification */
              <div>
                {/* QR Code Display */}
                <div style={{ marginBottom: "2rem", textAlign: "center" }}>
                  <h4 style={{ margin: "0 0 1rem 0", color: "#374151" }}>
                    Scan QR Code with Authenticator App
                  </h4>
                  {totpRegistrationData.qrCode ? (
                    <img
                      src={totpRegistrationData.qrCode}
                      alt="TOTP QR Code"
                      style={{
                        width: "200px",
                        height: "200px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "200px",
                        height: "200px",
                        backgroundColor: "#f3f4f6",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto",
                        color: "#6b7280",
                      }}
                    >
                      QR Code Loading...
                    </div>
                  )}
                  <p
                    style={{
                      margin: "1rem 0 0 0",
                      fontSize: "12px",
                      color: "#6b7280",
                    }}
                  >
                    Use Google Authenticator, Authy, 1Password, or any TOTP app
                  </p>
                </div>

                {/* Manual Secret (if needed) */}
                {totpRegistrationData.secret && (
                  <div style={{ marginBottom: "2rem" }}>
                    <details>
                      <summary
                        style={{
                          cursor: "pointer",
                          color: "#6366f1",
                          fontSize: "14px",
                        }}
                      >
                        Can&apos;t scan QR code? Enter manually
                      </summary>
                      <div
                        style={{
                          marginTop: "0.5rem",
                          padding: "0.5rem",
                          backgroundColor: "#f9fafb",
                          borderRadius: "4px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            marginBottom: "0.25rem",
                          }}
                        >
                          Secret Key:
                        </div>
                        <code
                          style={{ fontSize: "12px", wordBreak: "break-all" }}
                        >
                          {totpRegistrationData.secret}
                        </code>
                      </div>
                    </details>
                  </div>
                )}

                {/* Verification Code Input */}
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
                    Enter Code from Authenticator App:
                  </label>
                  <input
                    type="text"
                    value={totpSetupCode}
                    onChange={(e) => setTotpSetupCode(e.target.value)}
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
                      e.currentTarget.style.borderColor = "#6366f1";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#d1d5db";
                    }}
                  />
                </div>

                {/* Verify Setup Button */}
                <button
                  onClick={verifyTotpSetup}
                  disabled={isVerifyingTotpSetup || !totpSetupCode}
                  style={{
                    width: "100%",
                    padding: "16px",
                    backgroundColor:
                      isVerifyingTotpSetup || !totpSetupCode
                        ? "#9ca3af"
                        : "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor:
                      isVerifyingTotpSetup || !totpSetupCode
                        ? "not-allowed"
                        : "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {isVerifyingTotpSetup && (
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
                  {isVerifyingTotpSetup
                    ? "Verifying..."
                    : "Complete TOTP Setup"}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* TOTP Authentication Mode */
          <div>
            <div
              style={{
                backgroundColor: "#f3f4f6",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "2rem",
                fontSize: "14px",
                color: "#374151",
              }}
            >
              <p style={{ margin: "0 0 0.5rem 0", fontWeight: "500" }}>
                🔒 TOTP 2FA Authentication
              </p>
              <p style={{ margin: "0" }}>
                This requires a User ID and a 6-digit code from your
                authenticator app.
              </p>
            </div>

            {/* Cached User Selection for Auth */}
            {Object.keys(cachedUserIds).length > 0 && (
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
                  Select Previous Authentication:
                </label>
                <select
                  value={selectedCachedUserIdKey}
                  onChange={(e) => handleCachedUserChange(e.target.value)}
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
                    e.currentTarget.style.borderColor = "#6366f1";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#d1d5db";
                  }}
                >
                  {Object.entries(cachedUserIds).map(([key, value]) => (
                    <option key={key} value={key}>
                      {getAuthMethodDisplayName(key)}:{" "}
                      {extractUserDisplayName(key)} (ID: {value.substring(0, 8)}
                      ...)
                    </option>
                  ))}
                </select>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginTop: "4px",
                  }}
                >
                  These are User IDs from your previous Stytch authentications
                </div>
              </div>
            )}

            {/* Manual User ID Input for Auth */}
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
                User ID:
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="user-test-uuid-1234"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontFamily: "monospace",
                  outline: "none",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#6366f1";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#d1d5db";
                }}
              />
              <div
                style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}
              >
                Enter the User ID from your primary Stytch authentication
              </div>
            </div>

            {/* TOTP Code Input for Auth */}
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
                TOTP Code:
              </label>
              <input
                type="text"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
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
                  e.currentTarget.style.borderColor = "#6366f1";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#d1d5db";
                }}
              />
              <div
                style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}
              >
                Enter the current 6-digit code from your authenticator app
              </div>
            </div>

            {/* Authenticate Button */}
            <button
              onClick={authenticateTotp}
              disabled={isAuthenticating || !userId || !totpCode}
              style={{
                width: "100%",
                padding: "16px",
                backgroundColor:
                  isAuthenticating || !userId || !totpCode
                    ? "#9ca3af"
                    : "#6366f1",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor:
                  isAuthenticating || !userId || !totpCode
                    ? "not-allowed"
                    : "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                if (!isAuthenticating && userId && totpCode) {
                  e.currentTarget.style.backgroundColor = "#4f46e5";
                }
              }}
              onMouseLeave={(e) => {
                if (!isAuthenticating && userId && totpCode) {
                  e.currentTarget.style.backgroundColor = "#6366f1";
                }
              }}
            >
              {isAuthenticating && (
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
              {isAuthenticating
                ? "Authenticating..."
                : "Authenticate with TOTP"}
            </button>
          </div>
        )}

        {/* Advanced Settings */}
        <details style={{ marginTop: "2rem" }}>
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

        {/* Status Message */}
        {status && (
          <div
            style={{
              marginTop: "1rem",
              padding: "12px",
              backgroundColor: error ? "#fef2f2" : "#f0fdf4",
              border: "1px solid",
              borderColor: error ? "#fecaca" : "#bbf7d0",
              borderRadius: "8px",
              fontSize: "14px",
              color: error ? "#dc2626" : "#166534",
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
            <strong>How TOTP 2FA works:</strong>
          </p>
          <ol style={{ margin: 0, paddingLeft: "1.2rem" }}>
            <li>First authenticate with Email, SMS, or WhatsApp OTP</li>
            <li>
              <strong>Setup:</strong> Generate QR code and scan with
              authenticator app
            </li>
            <li>
              <strong>Authenticate:</strong> Use User ID + current TOTP code
            </li>
            <li>This provides additional security for your PKP operations</li>
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

export default AuthenticateStytchTotp;
