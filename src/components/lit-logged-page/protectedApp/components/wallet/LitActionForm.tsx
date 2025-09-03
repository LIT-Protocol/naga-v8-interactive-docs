/**
 * LitActionForm Component
 *
 * Form for executing Lit Actions with custom JavaScript code
 */

import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import { useLitAuth } from "../../../../../lit-login-modal/LitAuthProvider";
import { PkpInfo } from "../../types";
import { LoadingSpinner } from "../ui/LoadingSpinner";

// Default Lit Action code constants
const DEFAULT_LIT_ACTION = `const { sigName, toSign, publicKey, } = jsParams;
const { keccak256, arrayify } = ethers.utils;

(async () => {
  const toSignBytes = new TextEncoder().encode(toSign);
  const toSignBytes32 = keccak256(toSignBytes);
  const toSignBytes32Array = arrayify(toSignBytes32);
  
  await Lit.Actions.signEcdsa({
    toSign: toSignBytes32Array,
    publicKey,
    sigName,
  });  
})();`;

const DEFAULT_LIT_ACTION2 = `(async () => {
  const dAppUniqueAuthMethodType = "0x...";
  const { publicKey, username, password, authMethodId } = jsParams;
  
  // Custom validation logic 
  const EXPECTED_USERNAME = 'alice';
  const EXPECTED_PASSWORD = 'lit';
  const userIsValid = username === EXPECTED_USERNAME && password === EXPECTED_PASSWORD;
  
  // Check PKP permissions
  const tokenId = await Lit.Actions.pubkeyToTokenId({ publicKey: publicKey });
  const permittedAuthMethods = await Lit.Actions.getPermittedAuthMethods({ tokenId });
  
  const isPermitted = permittedAuthMethods.some((permittedAuthMethod) => {
    return permittedAuthMethod["auth_method_type"] === dAppUniqueAuthMethodType && 
           permittedAuthMethod["id"] === authMethodId;
  });
  
  const isValid = isPermitted && userIsValid;
  LitActions.setResponse({ response: isValid ? "true" : "false" });
})();`;

interface LitActionFormProps {
  selectedPkp: PkpInfo | null;
  disabled?: boolean;
}

interface LitActionResult {
  result: any;
  timestamp: string;
}

export const LitActionForm: React.FC<LitActionFormProps> = ({
  selectedPkp,
  disabled = false,
}) => {
  const { user, services } = useLitAuth();
  const [litActionCode, setLitActionCode] = useState(DEFAULT_LIT_ACTION);
  const [litActionResult, setLitActionResult] =
    useState<LitActionResult | null>(null);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [status, setStatus] = useState<string>("");

  const executeLitAction = async () => {
    if (!user?.authContext || !litActionCode.trim() || !services?.litClient) {
      setStatus("No auth context, Lit Action code, or Lit client");
      return;
    }

    setIsExecutingAction(true);
    setStatus("Executing Lit Action...");
    try {
      const result = await services.litClient.executeJs({
        authContext: user.authContext,
        code: litActionCode,
        jsParams: {
          publicKey: selectedPkp?.publicKey || user?.pkpInfo?.pubkey,
          sigName: "sig1",
          toSign: "Hello from Lit Action",
        },
      });

      setLitActionResult({
        result,
        timestamp: new Date().toISOString(),
      });
      setStatus("Lit Action executed successfully!");
    } catch (error: any) {
      console.error("Failed to execute Lit Action:", error);
      setStatus(`Failed to execute Lit Action: ${error.message || error}`);
    } finally {
      setIsExecutingAction(false);
    }
  };

  const loadExample = (example: "sign" | "blockchash") => {
    if (example === "sign") {
      setLitActionCode(DEFAULT_LIT_ACTION);
    } else {
      setLitActionCode(DEFAULT_LIT_ACTION2);
    }
    setLitActionResult(null);
  };

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        marginBottom: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h3 style={{ margin: 0, color: "#1f2937" }}>⚡ Execute Lit Action</h3>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => loadExample("sign")}
            disabled={disabled || isExecutingAction}
            style={{
              padding: "4px 8px",
              backgroundColor:
                disabled || isExecutingAction ? "#9ca3af" : "#6366f1",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "11px",
              cursor: disabled || isExecutingAction ? "not-allowed" : "pointer",
            }}
          >
            Load Sign Example
          </button>
          <button
            onClick={() => loadExample("blockchash")}
            disabled={disabled || isExecutingAction}
            style={{
              padding: "4px 8px",
              backgroundColor:
                disabled || isExecutingAction ? "#9ca3af" : "#059669",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "11px",
              cursor: disabled || isExecutingAction ? "not-allowed" : "pointer",
            }}
          >
            Load Custom Auth Example
          </button>
        </div>
      </div>

      <p
        style={{
          margin: "0 0 16px 0",
          color: "#6b7280",
          fontSize: "14px",
        }}
      >
        Run custom JavaScript code with your PKP. Use the examples above to get
        started.
      </p>

      <div
        style={{
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          overflow: "hidden",
          marginBottom: "12px",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <Editor
          value={litActionCode}
          onChange={(value) => setLitActionCode(value || "")}
          language="javascript"
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            wordWrap: "on",
            fontSize: 10,
            padding: { top: 12, bottom: 12 },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            lineNumbers: "on",
            folding: false,
            lineDecorationsWidth: 0,
            lineNumbersMinChars: 3,
            readOnly: disabled || isExecutingAction,
          }}
          height="200px"
          width="100%"
        />
      </div>

      <button
        onClick={executeLitAction}
        disabled={disabled || isExecutingAction || !litActionCode.trim()}
        style={{
          width: "100%",
          padding: "12px",
          backgroundColor:
            disabled || isExecutingAction || !litActionCode.trim()
              ? "#9ca3af"
              : "#dc2626",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "500",
          cursor:
            disabled || isExecutingAction || !litActionCode.trim()
              ? "not-allowed"
              : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        {isExecutingAction ? (
          <>
            <LoadingSpinner size={16} />
            Executing...
          </>
        ) : (
          "Execute Lit Action"
        )}
      </button>

      {/* Status Display */}
      {status && (
        <div
          style={{
            marginTop: "12px",
            padding: "8px 12px",
            backgroundColor: status.includes("successfully")
              ? "#f0fdf4"
              : "#fef2f2",
            border: `1px solid ${
              status.includes("successfully") ? "#bbf7d0" : "#fecaca"
            }`,
            borderRadius: "6px",
            color: status.includes("successfully") ? "#15803d" : "#dc2626",
            fontSize: "12px",
          }}
        >
          {status}
        </div>
      )}

      {/* Execution Result */}
      {litActionResult && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
          }}
        >
          <h4
            style={{
              margin: "0 0 8px 0",
              color: "#15803d",
              fontSize: "14px",
            }}
          >
            ✅ Execution Result
          </h4>
          <div
            style={{
              fontSize: "11px",
              color: "#6b7280",
              marginBottom: "8px",
            }}
          >
            Executed at: {new Date(litActionResult.timestamp).toLocaleString()}
          </div>
          <pre
            style={{
              fontSize: "11px",
              fontFamily: "monospace",
              color: "#15803d",
              overflow: "auto",
              maxHeight: "200px",
              margin: 0,
              backgroundColor: "#dcfce7",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #bbf7d0",
              whiteSpace: "pre-wrap",
            }}
          >
            {JSON.stringify(litActionResult.result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
