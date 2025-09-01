import { useState, useEffect } from "react";
import { DisplayCode } from "../DisplayCode";
import MyEditorComponent from "./MyEditorComponent";
import PaymentInformation from "../tips/PaymentInformation";

// Default Lit Action code for demonstration
export const DEFAULT_LIT_ACTION_CODE = `
(async () => {

  const { sigName, toSign, publicKey, } = jsParams;
  const { keccak256, arrayify } = ethers.utils;
  
  // We are performing the hash here in the Lit Action
  // to show case the ethers library.
  // Alternatively, you could hash your data to a 32-byte array 
  // before passing it into jsParams, then use it directly
  const toSignBytes = new TextEncoder().encode(toSign);
  const toSignBytes32 = keccak256(toSignBytes);
  const toSignBytes32Array = arrayify(toSignBytes32);
  
  // this requests a signature share from the Lit Node
  // the signature share will be automatically returned in the HTTP response from the node
  const sigShare = await Lit.Actions.signEcdsa({
    toSign: toSignBytes32Array,
    publicKey,
    sigName,
  });
  
})();`.trim();

// Default jsParams for demonstration - will be updated with PKP public key
const getDefaultJsParams = (authContext?: any, pkpInfo?: any) => {
  const baseParams: any = {
    sigName: "sig-identifier",
    toSign: "Just getting started baby!",
  };

  // Add PKP public key if available - use same logic as PkpSigningComponent
  let publicKey = null;

  // Primary: pkpInfo.pubkey, Fallback: authContext.pkpPublicKey
  if (pkpInfo?.pubkey) {
    publicKey = pkpInfo.pubkey;
  } else if (authContext?.pkpPublicKey) {
    publicKey = authContext.pkpPublicKey;
  }

  if (publicKey) {
    baseParams.publicKey = publicKey;
  }

  return JSON.stringify(baseParams, null, 2);
};

// Code snippet for display
const EXECUTE_JS_CODE_SNIPPET = `
// Execute Lit Action with custom code
const result = await litClient.executeJs({
  code: litActionCode,        // Custom Lit Action code
  authContext: authContext,   // Auth context from previous steps
  jsParams: parsedJsParams,
  
  // 💰 Optional: Set custom maximum price you're willing to pay
  // userMaxPrice: BigInt("1000000000000000"), // 0.001 ETH in Wei
  // If not specified, Lit Protocol will automatically find the most optimised price
});

// Or execute with IPFS CID
const result = await litClient.executeJs({
  ipfsId: ipfsCid,           // IPFS CID of stored Lit Action
  authContext: authContext,   // Auth context from previous steps  
  jsParams: parsedJsParams,
  
  // 💰 Optional: Set custom maximum price you're willing to pay
  // userMaxPrice: BigInt("1000000000000000"), // 0.001 ETH in Wei
  // If not specified, Lit Protocol will automatically find the most optimised price
});`;

interface ExecuteJsComponentProps {
  authContext: any;
  pkpInfo?: any; // Optional - may not be needed for all auth methods
  setStatus: (message: string) => void;
  assertDependenciesLoaded: () => { litClient: any /* other deps */ };
  defaultMessage?: string;
  componentTitle?: string;
  showError?: (errorMessage: string, autoHide?: boolean) => void;
}

export default function ExecuteJsComponent({
  authContext,
  pkpInfo,
  setStatus,
  assertDependenciesLoaded,
  defaultMessage = "Hello from Lit Action!",
  componentTitle = "Execute Lit Action",
  showError,
}: ExecuteJsComponentProps) {
  const [executionMode, setExecutionMode] = useState<"code" | "ipfs">("code");
  const [litActionCode, setLitActionCode] = useState<string>(
    DEFAULT_LIT_ACTION_CODE
  );
  const [ipfsCid, setIpfsCid] = useState<string>("");
  const [jsParamsText, setJsParamsText] = useState<string>(
    getDefaultJsParams(authContext, pkpInfo)
  );
  const [executeResult, setExecuteResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);

  // Success feedback state
  const [isSuccess, setIsSuccess] = useState(false);

  // Function to show success feedback
  const showSuccess = () => {
    setIsSuccess(true);
    // Auto-clear after 3 seconds
    setTimeout(() => {
      setIsSuccess(false);
    }, 3000);
  };

  // Handle code changes from Monaco editor
  const handleCodeChange = (code: string) => {
    setLitActionCode(code);
  };

  // Reset code to default
  const resetToDefaultCode = () => {
    setLitActionCode(DEFAULT_LIT_ACTION_CODE);
  };

  // Update jsParams when authContext changes
  useEffect(() => {
    const newJsParams = getDefaultJsParams(authContext, pkpInfo);
    setJsParamsText(newJsParams);
  }, [authContext, pkpInfo]);

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

  const executeJs = async () => {
    const { litClient } = assertDependenciesLoaded();

    if (!authContext || !litClient) {
      setStatus(
        "Cannot execute: Missing AuthContext or LitClient is not ready."
      );
      return;
    }

    if (executionMode === "code" && !litActionCode.trim()) {
      setStatus("Cannot execute: Lit Action code is required.");
      return;
    }

    if (executionMode === "ipfs" && !ipfsCid.trim()) {
      setStatus("Cannot execute: IPFS CID is required.");
      return;
    }

    try {
      setIsExecuting(true);
      setStatus("Executing Lit Action...");

      // Parse jsParams
      let parsedJsParams = {};
      if (jsParamsText.trim()) {
        try {
          parsedJsParams = JSON.parse(jsParamsText);
        } catch (parseError: any) {
          throw new Error(
            `Invalid JSON in jsParams: ${parseError.message || parseError}`
          );
        }
      }

      console.log(
        `Executing Lit Action with mode='${executionMode}'`,
        executionMode === "code"
          ? { codeLength: litActionCode.length }
          : { ipfsCid }
      );
      console.log("jsParams:", parsedJsParams);
      console.log("authContext:", authContext);

      // Build the execution parameters
      const executeParams: any = {
        authContext: authContext,
        jsParams: parsedJsParams,
      };

      // Add either code or ipfsId based on execution mode
      if (executionMode === "code") {
        executeParams.code = litActionCode;
      } else {
        executeParams.ipfsId = ipfsCid;
      }

      const result = await litClient.executeJs(executeParams);

      console.log("executeJs result:", result);
      setExecuteResult(result);
      setStatus("Lit Action executed successfully");
      showSuccess();
    } catch (error: any) {
      console.error("Error executing Lit Action:", error);
      const errorMessage = formatErrorMessage(
        "Failed to execute Lit Action: ",
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsExecuting(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsEditorExpanded(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Handle Escape key to close modal and Cmd+Enter to execute
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isEditorExpanded) {
        setIsEditorExpanded(false);
      }

      // Handle Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux) to execute Lit Action
      if (isEditorExpanded && e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault(); // Prevent default behavior
        if (authContext && !isExecuting) {
          executeJs();
        }
      }
    };

    if (isEditorExpanded) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEditorExpanded, authContext, isExecuting]); // Added dependencies for the executeJs function

  return (
    <>
      <h3>
        {componentTitle}{" "}
        {!authContext && (
          <span style={{ color: "orange" }}>(Requires AuthContext)</span>
        )}
      </h3>
      <p>
        Execute custom Lit Actions using your authenticated context. Choose
        between custom code or IPFS-stored actions. The execution will
        automatically find the most optimised price, or you can specify a custom
        maximum price using the <code>userMaxPrice</code> parameter.
      </p>

      <PaymentInformation />

      {/* SDK Parameter Structure Disclaimer - Moved to top */}
      <div
        style={{
          backgroundColor: "#fff3cd",
          border: "1px solid #ffeaa7",
          borderRadius: "6px",
          padding: "12px",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
          <span style={{ fontSize: "16px", flexShrink: 0 }}>ℹ️</span>
          <div style={{ fontSize: "14px", lineHeight: "1.4" }}>
            <strong>SDK Parameter Structure:</strong> In this SDK version, all
            your parameters are wrapped within a{" "}
            <code
              style={{
                backgroundColor: "#f8f9fa",
                padding: "2px 4px",
                borderRadius: "3px",
              }}
            >
              jsParams
            </code>{" "}
            object. This means you can access all parameters as properties of{" "}
            <code
              style={{
                backgroundColor: "#f8f9fa",
                padding: "2px 4px",
                borderRadius: "3px",
              }}
            >
              jsParams
            </code>{" "}
            in your Lit Action, making validation and parameter management much
            clearer.
          </div>
        </div>
      </div>

      {/* Information about LitActions API and Editor Features */}
      <div
        style={{
          backgroundColor: "#f8f9fa",
          border: "1px solid #e9ecef",
          borderRadius: "6px",
          padding: "16px",
          marginBottom: "20px",
        }}
      >
        <h4
          style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600" }}
        >
          📝 Enhanced Code Editor Features
        </h4>
        <ul style={{ margin: "0", paddingLeft: "20px", fontSize: "14px" }}>
          <li>
            <strong>IntelliSense & Auto-completion:</strong> Full TypeScript
            support with syntax highlighting
          </li>
          <li>
            <strong>LitActions Global Namespace:</strong> Access all Lit
            Protocol functions directly (e.g.,{" "}
            <code>LitActions.setResponse()</code>,{" "}
            <code>LitActions.signEcdsa()</code>)
          </li>
        </ul>
        <div style={{ marginTop: "12px" }}>
          <a
            href="https://actions-docs.litprotocol.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#6f42c1",
              textDecoration: "none",
              fontWeight: "500",
              fontSize: "14px",
            }}
          >
            📚 View Full LitActions API Documentation →
          </a>
        </div>
      </div>

      <DisplayCode
        code={EXECUTE_JS_CODE_SNIPPET}
        language="typescript"
        renderComponent={
          <div>
            {/* Editor Expand Button - Top Right Corner of the right panel */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: "15px",
              }}
            >
              <button
                onClick={() => setIsEditorExpanded(true)}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#6f42c1",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "500",
                }}
              >
                🖥️ Fullscreen Editor
              </button>
            </div>

            {/* Execution Mode Selector */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "500",
                }}
              >
                Execution Mode:
              </label>
              <div
                style={{ display: "flex", gap: "10px", marginBottom: "10px" }}
              >
                <button
                  onClick={() => setExecutionMode("code")}
                  style={{
                    padding: "8px 15px",
                    backgroundColor:
                      executionMode === "code" ? "#6f42c1" : "#f0f0f0",
                    color: executionMode === "code" ? "white" : "#333",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  Custom Code
                </button>
                <button
                  onClick={() => setExecutionMode("ipfs")}
                  style={{
                    padding: "8px 15px",
                    backgroundColor:
                      executionMode === "ipfs" ? "#6f42c1" : "#f0f0f0",
                    color: executionMode === "ipfs" ? "white" : "#333",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  IPFS CID
                </button>
              </div>
            </div>

            {/* Conditional Input Based on Execution Mode */}
            {executionMode === "code" ? (
              <div style={{ marginBottom: "15px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <label
                    style={{
                      fontWeight: "500",
                    }}
                  >
                    Lit Action Code:
                  </label>
                  <button
                    onClick={resetToDefaultCode}
                    disabled={!authContext || isExecuting}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "3px",
                      cursor:
                        !authContext || isExecuting ? "not-allowed" : "pointer",
                      fontSize: "12px",
                      fontWeight: "500",
                      opacity: !authContext || isExecuting ? 0.6 : 1,
                    }}
                  >
                    🔄 Reset to Default
                  </button>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "400px",
                    border: "1px solid #dddddd",
                    borderRadius: "4px",
                    overflow: "hidden",
                    opacity: !authContext || isExecuting ? 0.6 : 1,
                    pointerEvents:
                      !authContext || isExecuting ? "none" : "auto",
                  }}
                >
                  <MyEditorComponent
                    onCodeChange={handleCodeChange}
                    initialCode={litActionCode}
                  />
                </div>
                <small
                  style={{ display: "block", marginTop: "5px", color: "#555" }}
                >
                  ✨ <strong>Enhanced with IntelliSense:</strong> Use{" "}
                  <code>LitActions.*</code> for all Lit Protocol functions.
                  Global variables like <code>jsParams</code>,{" "}
                  <code>publicKey</code> are auto-completed.
                </small>
              </div>
            ) : (
              <div style={{ marginBottom: "15px" }}>
                <label
                  htmlFor={`ipfs-cid-input-${
                    authContext?.sessionKey || "default"
                  }`}
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                  }}
                >
                  IPFS CID:
                </label>
                <input
                  id={`ipfs-cid-input-${authContext?.sessionKey || "default"}`}
                  type="text"
                  value={ipfsCid}
                  onChange={(e) => setIpfsCid(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #dddddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontFamily: "monospace",
                    boxSizing: "border-box",
                  }}
                  placeholder="QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx"
                  disabled={!authContext || isExecuting}
                />
                <small
                  style={{ display: "block", marginTop: "5px", color: "#555" }}
                >
                  Enter the IPFS CID of a Lit Action that has been previously
                  uploaded to IPFS.
                </small>
              </div>
            )}

            {/* jsParams Input */}
            <div style={{ marginBottom: "15px" }}>
              <label
                htmlFor={`js-params-input-${
                  authContext?.sessionKey || "default"
                }`}
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "500",
                }}
              >
                JavaScript Parameters (JSON):
              </label>
              <div
                style={{
                  width: "100%",
                  height: "150px",
                  border: "1px solid #dddddd",
                  borderRadius: "4px",
                  overflow: "hidden",
                  opacity: !authContext || isExecuting ? 0.6 : 1,
                  pointerEvents: !authContext || isExecuting ? "none" : "auto",
                }}
              >
                <MyEditorComponent
                  onCodeChange={setJsParamsText}
                  initialCode={jsParamsText}
                  language="json"
                  height="150px"
                />
              </div>
              <small
                style={{ display: "block", marginTop: "5px", color: "#555" }}
              >
                Parameters to pass to your Lit Action. Must be valid JSON
                format. Access these in your Lit Action using{" "}
                <code>jsParams.parameterName</code>.
              </small>
            </div>

            <button
              onClick={executeJs}
              disabled={!authContext || isExecuting}
              style={{
                padding: "12px 20px",
                backgroundColor:
                  !authContext || isExecuting ? "#cccccc" : "#6f42c1",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: !authContext || isExecuting ? "not-allowed" : "pointer",
                fontWeight: "500",
                fontSize: "16px",
              }}
            >
              {isExecuting
                ? "🔄 Executing..."
                : `🚀 Execute Lit Action (${
                    executionMode === "code" ? "Code" : "IPFS"
                  })`}
            </button>
          </div>
        }
        resultData={executeResult}
        resultLabel="Execution Result"
        useSideBySide={true}
        theme="dracula"
        isSuccess={isSuccess}
      />

      {/* Fullscreen Modal for Expanded Editor */}
      {isEditorExpanded && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            padding: "20px",
            color: "white",
          }}
          onClick={(e) => {
            // Close modal when clicking on backdrop
            if (e.target === e.currentTarget) {
              setIsEditorExpanded(false);
            }
          }}
        >
          {/* Modal Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              padding: "0 10px",
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "600" }}>
                🖥️ Fullscreen Lit Action Editor
              </h2>
              <p
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "14px",
                  color: "#ccc",
                  fontStyle: "italic",
                }}
              >
                Press{" "}
                <kbd
                  style={{
                    backgroundColor: "#444",
                    padding: "2px 6px",
                    borderRadius: "3px",
                    fontSize: "12px",
                    border: "1px solid #666",
                  }}
                >
                  ⌘+Enter
                </kbd>{" "}
                or{" "}
                <kbd
                  style={{
                    backgroundColor: "#444",
                    padding: "2px 6px",
                    borderRadius: "3px",
                    fontSize: "12px",
                    border: "1px solid #666",
                  }}
                >
                  Ctrl+Enter
                </kbd>{" "}
                to execute
              </p>
            </div>
            <button
              onClick={() => setIsEditorExpanded(false)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              ✕ Close
            </button>
          </div>

          {/* Modal Content */}
          <div
            style={{
              display: "flex",
              flex: 1,
              gap: "20px",
              minHeight: 0, // Important for flexbox
            }}
          >
            {/* Left Panel - Code Editor */}
            <div
              style={{
                width: "60%", // Fixed width instead of flex
                display: "flex",
                flexDirection: "column",
                gap: "15px",
              }}
            >
              {/* Execution Mode Selector */}
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                    color: "white",
                  }}
                >
                  Execution Mode:
                </label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => setExecutionMode("code")}
                    style={{
                      padding: "8px 15px",
                      backgroundColor:
                        executionMode === "code" ? "#6f42c1" : "#555",
                      color: "white",
                      border: "1px solid #666",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Custom Code
                  </button>
                  <button
                    onClick={() => setExecutionMode("ipfs")}
                    style={{
                      padding: "8px 15px",
                      backgroundColor:
                        executionMode === "ipfs" ? "#6f42c1" : "#555",
                      color: "white",
                      border: "1px solid #666",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    IPFS CID
                  </button>
                </div>
              </div>

              {/* Editor Area */}
              {executionMode === "code" ? (
                <div
                  style={{ flex: 1, display: "flex", flexDirection: "column" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <label
                      style={{
                        fontWeight: "500",
                        color: "white",
                      }}
                    >
                      Lit Action Code:
                    </label>
                    <button
                      onClick={resetToDefaultCode}
                      disabled={!authContext || isExecuting}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor:
                          !authContext || isExecuting
                            ? "not-allowed"
                            : "pointer",
                        fontSize: "12px",
                        fontWeight: "500",
                        opacity: !authContext || isExecuting ? 0.6 : 1,
                      }}
                    >
                      🔄 Reset to Default
                    </button>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      border: "1px solid #555",
                      borderRadius: "6px",
                      overflow: "hidden",
                      opacity: !authContext || isExecuting ? 0.6 : 1,
                      pointerEvents:
                        !authContext || isExecuting ? "none" : "auto",
                    }}
                  >
                    <MyEditorComponent
                      onCodeChange={handleCodeChange}
                      initialCode={litActionCode}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "500",
                      color: "white",
                    }}
                  >
                    IPFS CID:
                  </label>
                  <input
                    type="text"
                    value={ipfsCid}
                    onChange={(e) => setIpfsCid(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #555",
                      borderRadius: "4px",
                      fontSize: "14px",
                      fontFamily: "monospace",
                      backgroundColor: "#333",
                      color: "white",
                      boxSizing: "border-box",
                    }}
                    placeholder="QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx"
                    disabled={!authContext || isExecuting}
                  />
                </div>
              )}
            </div>

            {/* Right Panel - Controls and Results */}
            <div
              style={{
                width: "40%", // Fixed width instead of flex
                display: "flex",
                flexDirection: "column",
                gap: "15px",
                borderLeft: "1px solid #555",
                paddingLeft: "20px",
              }}
            >
              {/* jsParams Input */}
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                    color: "white",
                  }}
                >
                  JavaScript Parameters (JSON):
                </label>
                <div
                  style={{
                    width: "100%",
                    height: "150px",
                    border: "1px solid #555",
                    borderRadius: "4px",
                    overflow: "hidden",
                    opacity: !authContext || isExecuting ? 0.6 : 1,
                    pointerEvents:
                      !authContext || isExecuting ? "none" : "auto",
                  }}
                >
                  <MyEditorComponent
                    onCodeChange={setJsParamsText}
                    initialCode={jsParamsText}
                    language="json"
                    height="150px"
                  />
                </div>
                <small
                  style={{ display: "block", marginTop: "5px", color: "#ccc" }}
                >
                  Parameters to pass to your Lit Action. Must be valid JSON
                  format. Access these in your Lit Action using{" "}
                  <code>jsParams.parameterName</code>.
                </small>
              </div>

              {/* Execute Button */}
              <button
                onClick={executeJs}
                disabled={!authContext || isExecuting}
                style={{
                  padding: "12px 20px",
                  backgroundColor:
                    !authContext || isExecuting ? "#555" : "#6f42c1",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor:
                    !authContext || isExecuting ? "not-allowed" : "pointer",
                  fontWeight: "500",
                  fontSize: "16px",
                }}
              >
                {isExecuting
                  ? "🔄 Executing..."
                  : `🚀 Execute Lit Action (${
                      executionMode === "code" ? "Code" : "IPFS"
                    })`}
              </button>

              {/* Results Panel */}
              <div
                style={{
                  height: "300px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <h4
                  style={{
                    margin: "0 0 10px 0",
                    color: "white",
                    fontSize: "16px",
                  }}
                >
                  📊 Execution Results
                </h4>
                {executeResult ? (
                  <div
                    style={{
                      flex: 1,
                      border: `1px solid ${isSuccess ? "#22c55e" : "#555"}`,
                      borderRadius: "6px",
                      overflow: "hidden",
                    }}
                  >
                    <MyEditorComponent
                      onCodeChange={() => {}} // Read-only, no changes needed
                      initialCode={JSON.stringify(executeResult, null, 2)}
                      language="json"
                      height="100%"
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      flex: 1,
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #333",
                      borderRadius: "6px",
                      padding: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        textAlign: "center",
                        color: "#999",
                        fontStyle: "italic",
                      }}
                    >
                      Execute a Lit Action to see results here...
                    </div>
                  </div>
                )}
              </div>

              {/* SDK Parameter Structure Disclaimer - Bottom Right */}
              <div
                style={{
                  backgroundColor: "#2d3748",
                  border: "1px solid #4a5568",
                  borderRadius: "6px",
                  padding: "10px",
                  marginTop: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "6px",
                  }}
                >
                  <span style={{ fontSize: "14px", flexShrink: 0 }}>ℹ️</span>
                  <div
                    style={{
                      fontSize: "12px",
                      lineHeight: "1.4",
                      color: "#e2e8f0",
                    }}
                  >
                    <strong>SDK Parameter Structure:</strong> All your
                    parameters are wrapped within a{" "}
                    <code
                      style={{
                        backgroundColor: "#1a202c",
                        padding: "1px 3px",
                        borderRadius: "2px",
                        color: "#90cdf4",
                        fontSize: "11px",
                      }}
                    >
                      jsParams
                    </code>{" "}
                    object. Access them as{" "}
                    <code
                      style={{
                        backgroundColor: "#1a202c",
                        padding: "1px 3px",
                        borderRadius: "2px",
                        color: "#90cdf4",
                        fontSize: "11px",
                      }}
                    >
                      jsParams.parameterName
                    </code>{" "}
                    in your Lit Action.
                  </div>
                </div>
              </div>

              {/* LitActions API Documentation Link - Bottom Right */}
              <div
                style={{
                  backgroundColor: "#2d3748",
                  border: "1px solid #4a5568",
                  borderRadius: "6px",
                  padding: "10px",
                  marginTop: "8px",
                  textAlign: "center",
                }}
              >
                <a
                  href="https://actions-docs.litprotocol.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#90cdf4",
                    textDecoration: "none",
                    fontWeight: "500",
                    fontSize: "13px",
                    display: "block",
                  }}
                >
                  📚 View Full LitActions API Documentation →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
