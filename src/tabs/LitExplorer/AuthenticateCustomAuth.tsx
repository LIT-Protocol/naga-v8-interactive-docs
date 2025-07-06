import React, { useState, useEffect } from "react";
import { privateKeyToAccount } from "viem/accounts";
import { utils as litUtils } from "@lit-protocol/lit-client";
import { useLitServiceSetup } from "../../hooks/useLitServiceSetup";

interface AuthenticateCustomAuthProps {
  onBack: () => void;
  onAuthSuccess: (userData: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface AuthUser {
  authContext: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  pkpInfo: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  method: "custom";
  timestamp: number;
  authData?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  accountMethod: string;
}

interface PkpInfo {
  userId: string;
  pkpPublicKey: string;
  pkpTokenId: string;
  authData: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  validationCid: string;
}

// Configuration constants
const DEFAULT_DEMO_USERNAME = "alice";
const DEFAULT_DEMO_PASSWORD = "lit";

// Site owner private key for minting PKPs (provided for demo)
const SITE_OWNER_PRIVATE_KEY =
  "0x65b80901b185bd7bd9c07178c8e3b2bfae62472feeeb86d3dd834e5b14c2d5f8";

// Default validation CID for demo
const DEFAULT_VALIDATION_CID = "QmYLeVmwJPVs7Uebk85YdVPivMyrvoeKR6X37kyVRZUXW4";

const generateRandomDappName = () => {
  const adjectives = [
    "super",
    "awesome",
    "cool",
    "amazing",
    "fantastic",
    "incredible",
    "wonderful",
  ];
  const nouns = [
    "app",
    "dapp",
    "tool",
    "platform",
    "service",
    "solution",
    "system",
  ];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj}-${noun}-${num}`;
};

const AuthenticateCustomAuth: React.FC<AuthenticateCustomAuthProps> = ({
  onBack,
  onAuthSuccess,
}) => {
  const { services } = useLitServiceSetup({
    autoSetup: true,
  });

  const litClient = services?.litClient;
  const authManager = services?.authManager;

  // Site Owner Flow State
  const [dappName, setDappName] = useState<string>(generateRandomDappName());
  const [authMethodConfig, setAuthMethodConfig] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [validationCid, setValidationCid] = useState<string>(
    DEFAULT_VALIDATION_CID
  );
  const [mintedPkps, setMintedPkps] = useState<PkpInfo[]>([]);
  const [isGeneratingAuthMethod, setIsGeneratingAuthMethod] = useState(false);
  const [isMintingPkp, setIsMintingPkp] = useState(false);

  // User Flow State
  const [demoUsername, setDemoUsername] = useState<string>(
    DEFAULT_DEMO_USERNAME
  );
  const [demoPassword, setDemoPassword] = useState<string>(
    DEFAULT_DEMO_PASSWORD
  );
  const [selectedUser, setSelectedUser] = useState<PkpInfo | null>(null);
  const [isCreatingAuthContext, setIsCreatingAuthContext] = useState(false);
  const [hasCreatedAuthContext, setHasCreatedAuthContext] = useState(false);

  // UI State
  const [currentStep, setCurrentStep] = useState<
    "setup" | "mint" | "authenticate"
  >("setup");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  // Editable jsParams for Lit Action
  const [editableJsParams, setEditableJsParams] = useState<{
    pkpPublicKey: string;
    username: string;
    password: string;
    authMethodId: string;
  }>({
    pkpPublicKey: "",
    username: demoUsername,
    password: demoPassword,
    authMethodId: "",
  });

  // Setup services when component mounts
  useEffect(() => {
    if (!litClient || !authManager) {
      // Services will be setup automatically by the hook
    }
  }, [litClient, authManager]);

  // Update jsParams when demo credentials change
  useEffect(() => {
    setEditableJsParams((prev) => ({
      ...prev,
      username: demoUsername,
      password: demoPassword,
    }));
  }, [demoUsername, demoPassword]);

  const formatErrorMessage = (prefix: string, error: unknown): string => {
    if (error instanceof Error) {
      return prefix + error.message;
    }
    return prefix + String(error);
  };

  const regenerateDappName = () => {
    const newDappName = generateRandomDappName();
    setDappName(newDappName);
    setAuthMethodConfig(null);
    setStatus(`Generated new dApp name: ${newDappName}`);
  };

  const generateAuthMethodType = async () => {
    try {
      setIsGeneratingAuthMethod(true);
      setError(null);
      setStatus("Generating unique auth method type for dApp...");

      if (!litClient) {
        throw new Error("Lit client not available");
      }

      // Use real Lit client utilities to generate unique auth method type
      const authMethodConfig = litUtils.generateUniqueAuthMethodType({
        uniqueDappName: dappName,
      });

      setAuthMethodConfig(authMethodConfig);
      setStatus(`✅ Generated auth method type for dApp: ${dappName}`);

      // Automatically advance to step 2 (mint) after successful generation
      setTimeout(() => {
        setCurrentStep("mint");
      }, 1000);
    } catch (error: unknown) {
      console.error("Error generating auth method type:", error);
      const errorMessage = formatErrorMessage(
        "Failed to generate auth method type: ",
        error
      );
      setError(errorMessage);
      setStatus(errorMessage);
    } finally {
      setIsGeneratingAuthMethod(false);
    }
  };

  const mintPkpForUser = async (userId: string) => {
    try {
      setIsMintingPkp(true);
      setError(null);
      setStatus(`Minting PKP for user: ${userId}...`);

      if (!litClient) {
        throw new Error("Lit client not available");
      }

      if (!authMethodConfig || !validationCid) {
        throw new Error(
          "Auth method type and validation CID must be set first"
        );
      }

      // Create account from private key for site owner
      const siteOwnerAccount = privateKeyToAccount(
        SITE_OWNER_PRIVATE_KEY as `0x${string}`
      );

      // Generate auth data for user using real Lit utilities
      const authData = litUtils.generateAuthData({
        uniqueDappName: dappName,
        uniqueAuthMethodType: authMethodConfig.bigint,
        userId: userId,
      });

      // Actually mint PKP using Lit client
      const { pkpData } = await litClient.mintWithCustomAuth({
        account: siteOwnerAccount,
        authData: authData,
        scope: "sign-anything",
        validationIpfsCid: validationCid,
      });

      const pkpInfo: PkpInfo = {
        userId: userId,
        pkpPublicKey: pkpData.data.pubkey,
        pkpTokenId: pkpData.data.tokenId.toString(),
        authData: authData,
        validationCid: validationCid,
      };

      setMintedPkps((prev) => [...prev, pkpInfo]);
      setStatus(`✅ PKP minted successfully for user: ${userId}`);
      setCurrentStep("authenticate");
    } catch (error: unknown) {
      console.error("Error minting PKP:", error);
      const errorMessage = formatErrorMessage("Failed to mint PKP: ", error);
      setError(errorMessage);
      setStatus(errorMessage);
    } finally {
      setIsMintingPkp(false);
    }
  };

  const selectUserFromDapp = async () => {
    try {
      setError(null);
      setStatus("User logging into dApp and retrieving PKP info...");

      // Find the user's minted PKP
      const userPkp = mintedPkps.find((pkp) => pkp.userId === demoUsername);

      if (!userPkp) {
        throw new Error(
          `No PKP found for user '${demoUsername}'. Site owner must mint PKP first.`
        );
      }

      setSelectedUser(userPkp);

      // Reset auth context creation state for new user
      setHasCreatedAuthContext(false);

      // Populate editable jsParams with user's PKP data
      setEditableJsParams({
        pkpPublicKey: userPkp.pkpPublicKey,
        username: demoUsername,
        password: demoPassword,
        authMethodId: userPkp.authData?.authMethodId || "",
      });

      setStatus(
        `✅ Successfully retrieved PKP info for user '${demoUsername}'`
      );
    } catch (error: unknown) {
      console.error("Error selecting user:", error);
      const errorMessage = formatErrorMessage(
        "Failed to get user PKP info: ",
        error
      );
      setError(errorMessage);
      setStatus(errorMessage);
    }
  };

  const createCustomAuthContext = async () => {
    try {
      setIsCreatingAuthContext(true);
      setError(null);

      // If auth context was already created before, clear the cache first
      if (hasCreatedAuthContext) {
        setStatus("Clearing auth cache and re-authenticating...");

        // Clear all localStorage entries that start with 'lit-auth:my-app-inner-delegation'
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("lit-auth:my-app-inner-delegation")) {
            keysToRemove.push(key);
          }
        }

        keysToRemove.forEach((key) => {
          localStorage.removeItem(key);
          console.log(`🗑️ Cleared cache key: ${key}`);
        });

        console.log(`🗑️ Cleared ${keysToRemove.length} cached auth signatures`);
      }

      setStatus("User creating custom auth context...");

      if (!authManager || !litClient) {
        throw new Error("Auth manager or Lit client not available");
      }

      if (!selectedUser) {
        throw new Error("Cannot create auth context: No user selected.");
      }

      // Debug: Log all authentication parameters
      console.log("🔍 Custom Auth Debug Info:", {
        dappName: dappName,
        authMethodType: authMethodConfig?.hex,
        userId: selectedUser.userId,
        username: editableJsParams.username,
        password: editableJsParams.password,
        pkpPublicKey: editableJsParams.pkpPublicKey,
        pkpTokenId: selectedUser.pkpTokenId,
        authMethodId: editableJsParams.authMethodId,
        validationCid: selectedUser.validationCid,
        jsParams: editableJsParams,
      });

      const customAuthContext = await authManager.createCustomAuthContext({
        pkpPublicKey: selectedUser.pkpPublicKey,
        authConfig: {
          capabilityAuthSigs: [],
          expiration: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
          statement: "",
          domain: "",
          resources: [
            ["pkp-signing", "*"],
            ["lit-action-execution", "*"],
          ],
        },
        litClient: litClient,
        customAuthParams: {
          litActionIpfsId: selectedUser.validationCid,
          jsParams: editableJsParams,
        },
      });

      console.log("✅ Custom auth context created:", customAuthContext);

      // Create user data for custom authentication
      const userData: AuthUser = {
        authContext: customAuthContext,
        pkpInfo: {
          ...selectedUser,
          pubkey: selectedUser.pkpPublicKey,
        },
        method: "custom",
        timestamp: Date.now(),
        authData: selectedUser.authData,
        accountMethod: "custom",
      };

      setStatus("✅ Custom auth context created successfully!");
      setHasCreatedAuthContext(true);

      // Brief delay to show success message
      setTimeout(() => {
        onAuthSuccess(userData);
      }, 1000);
    } catch (error: unknown) {
      console.error("❌ Error creating custom auth context:", error);
      console.error("Error details:", error);

      const errorMessage = formatErrorMessage(
        "Failed to create custom auth context: ",
        error
      );
      setError(errorMessage);
      setStatus(errorMessage);
    } finally {
      setIsCreatingAuthContext(false);
    }
  };

  const handleStepChange = (step: "setup" | "mint" | "authenticate") => {
    setCurrentStep(step);
    setError(null);
    setStatus("");
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
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
          Custom Authentication
        </h2>

        {/* Step Navigation */}
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
              onClick={() => handleStepChange("setup")}
              style={{
                flex: 1,
                padding: "8px 16px",
                backgroundColor:
                  currentStep === "setup" ? "#6366f1" : "transparent",
                color: currentStep === "setup" ? "white" : "#6b7280",
                border: "none",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              1. Setup dApp
            </button>
            <button
              onClick={() => handleStepChange("mint")}
              style={{
                flex: 1,
                padding: "8px 16px",
                backgroundColor:
                  currentStep === "mint" ? "#6366f1" : "transparent",
                color: currentStep === "mint" ? "white" : "#6b7280",
                border: "none",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              2. Mint PKP
            </button>
            <button
              onClick={() => handleStepChange("authenticate")}
              style={{
                flex: 1,
                padding: "8px 16px",
                backgroundColor:
                  currentStep === "authenticate" ? "#6366f1" : "transparent",
                color: currentStep === "authenticate" ? "white" : "#6b7280",
                border: "none",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              3. Authenticate
            </button>
          </div>
        </div>

        {currentStep === "setup" && (
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
                🔧 dApp Setup (Site Owner Flow)
              </p>
              <p style={{ margin: "0" }}>
                Configure your dApp with unique authentication method and
                validation logic.
              </p>
            </div>

            {/* dApp Name Configuration */}
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
                dApp Name:
              </label>
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <input
                  type="text"
                  value={dappName}
                  onChange={(e) => setDappName(e.target.value)}
                  style={{
                    flex: 1,
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
                <button
                  onClick={regenerateDappName}
                  style={{
                    padding: "12px 16px",
                    backgroundColor: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    whiteSpace: "nowrap",
                  }}
                >
                  Regenerate
                </button>
              </div>
            </div>

            {/* Auth Method Type Generation */}
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
                Auth Method Type:
              </label>
              {authMethodConfig ? (
                <div
                  style={{
                    padding: "12px 16px",
                    backgroundColor: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontFamily: "monospace",
                    wordBreak: "break-all",
                  }}
                >
                  {authMethodConfig.hex}
                </div>
              ) : (
                <button
                  onClick={generateAuthMethodType}
                  disabled={isGeneratingAuthMethod}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    backgroundColor: isGeneratingAuthMethod
                      ? "#9ca3af"
                      : "#6366f1",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: isGeneratingAuthMethod ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {isGeneratingAuthMethod
                    ? "Generating..."
                    : "Generate Auth Method Type"}
                </button>
              )}
            </div>

            {/* Validation CID */}
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
                Validation CID (Lit Action):
              </label>
              <input
                type="text"
                value={validationCid}
                onChange={(e) => setValidationCid(e.target.value)}
                placeholder="QmYLeVmwJPVs7Uebk85YdVPivMyrvoeKR6X37kyVRZUXW4"
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
                IPFS CID of the Lit Action that validates custom authentication
              </div>
            </div>

            {/* Setup Status */}
            <div
              style={{
                backgroundColor:
                  authMethodConfig && validationCid ? "#f0fdf4" : "#fef3c7",
                border: "1px solid",
                borderColor:
                  authMethodConfig && validationCid ? "#bbf7d0" : "#f59e0b",
                borderRadius: "8px",
                padding: "1rem",
                fontSize: "14px",
                color:
                  authMethodConfig && validationCid ? "#166534" : "#92400e",
              }}
            >
              {authMethodConfig && validationCid ? (
                <div>
                  <p style={{ margin: "0 0 0.5rem 0", fontWeight: "500" }}>
                    ✅ dApp Setup Complete
                  </p>
                  <p style={{ margin: "0" }}>
                    Your dApp is configured and ready to mint PKPs for users.
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ margin: "0 0 0.5rem 0", fontWeight: "500" }}>
                    ⚠️ Setup Required
                  </p>
                  <p style={{ margin: "0" }}>
                    Complete the auth method type generation and validation CID
                    setup.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === "mint" && (
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
                🔐 PKP Minting (Site Owner Flow)
              </p>
              <p style={{ margin: "0" }}>
                Mint PKPs for your users using the custom authentication method.
              </p>
            </div>

            {/* Demo User Configuration */}
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
                Demo User ID:
              </label>
              <input
                type="text"
                value={demoUsername}
                onChange={(e) => setDemoUsername(e.target.value)}
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
              />
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
                Demo Password:
              </label>
              <input
                type="text"
                value={demoPassword}
                onChange={(e) => setDemoPassword(e.target.value)}
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
              />
            </div>

            {/* Mint PKP Button */}
            <button
              onClick={() => mintPkpForUser(demoUsername)}
              disabled={isMintingPkp || !authMethodConfig || !validationCid}
              style={{
                width: "100%",
                padding: "16px",
                backgroundColor:
                  isMintingPkp || !authMethodConfig || !validationCid
                    ? "#9ca3af"
                    : "#6366f1",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor:
                  isMintingPkp || !authMethodConfig || !validationCid
                    ? "not-allowed"
                    : "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginBottom: "2rem",
              }}
            >
              {isMintingPkp && (
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
              {isMintingPkp
                ? `Minting PKP for ${demoUsername}...`
                : `Mint PKP for ${demoUsername}`}
            </button>

            {/* Minted PKPs List */}
            {mintedPkps.length > 0 && (
              <div>
                <h4 style={{ margin: "0 0 1rem 0", color: "#374151" }}>
                  Minted PKPs:
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  {mintedPkps.map((pkp, index) => (
                    <div
                      key={index}
                      style={{
                        padding: "12px",
                        backgroundColor: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        borderRadius: "8px",
                        fontSize: "14px",
                      }}
                    >
                      <div style={{ fontWeight: "500", color: "#166534" }}>
                        User: {pkp.userId}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#166534",
                          fontFamily: "monospace",
                        }}
                      >
                        PKP: {pkp.pkpPublicKey.slice(0, 20)}...
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === "authenticate" && (
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
                🔑 User Authentication
              </p>
              <p style={{ margin: "0" }}>
                Authenticate as a user to access your PKP and create an auth
                context.
              </p>
            </div>

            {/* User Selection */}
            <div style={{ marginBottom: "2rem" }}>
              <button
                onClick={selectUserFromDapp}
                disabled={mintedPkps.length === 0}
                style={{
                  width: "100%",
                  padding: "16px",
                  backgroundColor:
                    mintedPkps.length === 0 ? "#9ca3af" : "#6366f1",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: mintedPkps.length === 0 ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  marginBottom: "1rem",
                }}
              >
                {mintedPkps.length === 0
                  ? "No PKPs Available"
                  : `Login as ${demoUsername}`}
              </button>
            </div>

            {/* User PKP Info */}
            {selectedUser && (
              <div style={{ marginBottom: "2rem" }}>
                <h4 style={{ margin: "0 0 1rem 0", color: "#374151" }}>
                  User PKP Information:
                </h4>
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                >
                  <div style={{ marginBottom: "0.5rem" }}>
                    <strong>User ID:</strong> {selectedUser.userId}
                  </div>
                  <div style={{ marginBottom: "0.5rem" }}>
                    <strong>PKP Public Key:</strong>
                    <br />
                    <code style={{ fontSize: "12px", wordBreak: "break-all" }}>
                      {selectedUser.pkpPublicKey}
                    </code>
                  </div>
                  <div>
                    <strong>Token ID:</strong> {selectedUser.pkpTokenId}
                  </div>
                </div>
              </div>
            )}

            {/* Create Auth Context */}
            {selectedUser && (
              <button
                onClick={createCustomAuthContext}
                disabled={isCreatingAuthContext}
                style={{
                  width: "100%",
                  padding: "16px",
                  backgroundColor: isCreatingAuthContext
                    ? "#9ca3af"
                    : "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: isCreatingAuthContext ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {isCreatingAuthContext && (
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
                {isCreatingAuthContext
                  ? "Creating Auth Context..."
                  : "Create Auth Context"}
              </button>
            )}
          </div>
        )}

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
            <strong>How Custom Authentication works:</strong>
          </p>
          <ol style={{ margin: 0, paddingLeft: "1.2rem" }}>
            <li>
              <strong>Setup:</strong> dApp owner configures unique auth method
              and validation logic
            </li>
            <li>
              <strong>Mint:</strong> dApp owner mints PKPs for users with custom
              auth method
            </li>
            <li>
              <strong>Authenticate:</strong> Users authenticate using their
              credentials and validation logic
            </li>
            <li>
              This provides complete control over authentication flow for dApp
              developers
            </li>
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

export default AuthenticateCustomAuth;
