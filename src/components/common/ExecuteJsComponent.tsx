import { useState } from "react";
import { DisplayCode } from "../DisplayCode";

// Default Lit Action code for demonstration
const DEFAULT_LIT_ACTION_CODE = `
(async () => {
  try {
    // Log some information
    console.log("🔥 Lit Action started");
    console.log("Params received:", JSON.stringify(jsParams));
    
    // Get parameters
    const message = jsParams.message || "Hello from Lit Action!";
    const timestamp = Date.now();
    
    console.log("Processing message:", message);
    console.log("Current timestamp:", timestamp);
    
    // Perform some computation
    const processedData = {
      originalMessage: message,
      processedAt: timestamp,
      messageLength: message.length,
      reversedMessage: message.split('').reverse().join(''),
      uppercaseMessage: message.toUpperCase(),
    };
    
    console.log("✅ Data processing completed successfully");
    console.log("Processed data:", JSON.stringify(processedData));
    
    // Return some response data
    LitActions.setResponse({
      response: JSON.stringify({
        message: "Lit Action executed successfully",
        timestamp: timestamp,
        processedData: processedData,
        success: true
      })
    });
    
    console.log("🎉 Lit Action completed");
  } catch (error) {
    console.error("❌ Error in Lit Action:", error);
    LitActions.setResponse({
      response: JSON.stringify({
        error: error.message,
        success: false
      })
    });
  }
})();`.trim();

// Default jsParams for demonstration
const DEFAULT_JS_PARAMS = `{
  "message": "Hello from ExecuteJs Component!",
  "userId": 123,
  "timestamp": "${new Date().toISOString()}"
}`;

// Code snippet for display
const EXECUTE_JS_CODE_SNIPPET = `
// Execute Lit Action with custom code
const result = await litClient.executeJs({
  code: litActionCode,        // Custom Lit Action code
  authContext: authContext,   // Auth context from previous steps
  jsParams: {
    jsParams: parsedJsParams  // Parameters to pass to the Lit Action
  },
});

// Or execute with IPFS CID
const result = await litClient.executeJs({
  ipfsId: ipfsCid,           // IPFS CID of stored Lit Action
  authContext: authContext,   // Auth context from previous steps  
  jsParams: {
    jsParams: parsedJsParams  // Parameters to pass to the Lit Action
  },
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
  const [litActionCode, setLitActionCode] = useState<string>(DEFAULT_LIT_ACTION_CODE);
  const [ipfsCid, setIpfsCid] = useState<string>("");
  const [jsParamsText, setJsParamsText] = useState<string>(DEFAULT_JS_PARAMS);
  const [executeResult, setExecuteResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);

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
          throw new Error(`Invalid JSON in jsParams: ${parseError.message || parseError}`);
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
        jsParams: {
          jsParams: parsedJsParams,
        },
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
      const errorMessage = formatErrorMessage("Failed to execute Lit Action: ", error);
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <>
      <h3>
        {componentTitle}{" "}
        {!authContext && (
          <span style={{ color: "orange" }}>
            (Requires AuthContext)
          </span>
        )}
      </h3>
      <p>Execute custom Lit Actions using your authenticated context. Choose between custom code or IPFS-stored actions.</p>

      <DisplayCode
        code={EXECUTE_JS_CODE_SNIPPET}
        language="typescript"
        renderComponent={
          <div>
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
              <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                <button
                  onClick={() => setExecutionMode("code")}
                  style={{
                    padding: "8px 15px",
                    backgroundColor: executionMode === "code" ? "#6f42c1" : "#f0f0f0",
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
                    backgroundColor: executionMode === "ipfs" ? "#6f42c1" : "#f0f0f0",
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
                <label
                  htmlFor={`lit-action-code-${authContext?.sessionKey || 'default'}`}
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                  }}
                >
                  Lit Action Code:
                </label>
                <textarea
                  id={`lit-action-code-${authContext?.sessionKey || 'default'}`}
                  value={litActionCode}
                  onChange={(e) => setLitActionCode(e.target.value)}
                  style={{
                    width: "100%",
                    height: "200px",
                    padding: "10px",
                    border: "1px solid #dddddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontFamily: "monospace",
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                  placeholder="Enter your Lit Action JavaScript code here..."
                  disabled={!authContext || isExecuting}
                />
                <small style={{ display: "block", marginTop: "5px", color: "#555" }}>
                  Write JavaScript code that will be executed on Lit Protocol nodes. 
                  Use <code>jsParams</code> to access passed parameters and <code>LitActions.setResponse()</code> to return data.
                </small>
              </div>
            ) : (
              <div style={{ marginBottom: "15px" }}>
                <label
                  htmlFor={`ipfs-cid-input-${authContext?.sessionKey || 'default'}`}
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                  }}
                >
                  IPFS CID:
                </label>
                <input
                  id={`ipfs-cid-input-${authContext?.sessionKey || 'default'}`}
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
                <small style={{ display: "block", marginTop: "5px", color: "#555" }}>
                  Enter the IPFS CID of a Lit Action that has been previously uploaded to IPFS.
                </small>
              </div>
            )}

            {/* jsParams Input */}
            <div style={{ marginBottom: "15px" }}>
              <label
                htmlFor={`js-params-input-${authContext?.sessionKey || 'default'}`}
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "500",
                }}
              >
                JavaScript Parameters (JSON):
              </label>
              <textarea
                id={`js-params-input-${authContext?.sessionKey || 'default'}`}
                value={jsParamsText}
                onChange={(e) => setJsParamsText(e.target.value)}
                style={{
                  width: "100%",
                  height: "120px",
                  padding: "10px",
                  border: "1px solid #dddddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontFamily: "monospace",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
                placeholder='{"key": "value", "message": "Hello World"}'
                disabled={!authContext || isExecuting}
              />
              <small style={{ display: "block", marginTop: "5px", color: "#555" }}>
                Parameters to pass to your Lit Action. Must be valid JSON format. 
                Access these in your Lit Action using <code>jsParams.parameterName</code>.
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
                cursor:
                  !authContext || isExecuting ? "not-allowed" : "pointer",
                fontWeight: "500",
                fontSize: "16px",
              }}
            >
              {isExecuting ? "Executing..." : `Execute Lit Action (${executionMode === "code" ? "Code" : "IPFS"})`}
            </button>
          </div>
        }
        resultData={executeResult}
        resultLabel="Execution Result"
        useSideBySide={true}
        theme="dracula"
        isSuccess={isSuccess}
      />
    </>
  );
} 