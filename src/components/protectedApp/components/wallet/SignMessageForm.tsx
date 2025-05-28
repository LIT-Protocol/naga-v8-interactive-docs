/**
 * SignMessageForm Component
 * 
 * Form for signing messages with PKP wallet
 */

import React, { useState } from 'react';
import { useLitAuth } from '../../../../contexts/LitAuthProvider';
import { PkpInfo } from '../../types';
import { LoadingSpinner } from '../ui/LoadingSpinner';

// Default message constant
const DEFAULT_MESSAGE = "Hello from your PKP wallet! 🔐";

interface SignMessageFormProps {
  selectedPkp: PkpInfo | null;
  disabled?: boolean;
}

interface SignedMessageResult {
  message: string;
  signature: string;
  address: string;
  timestamp: string;
}

export const SignMessageForm: React.FC<SignMessageFormProps> = ({ 
  selectedPkp, 
  disabled = false 
}) => {
  const { user, services } = useLitAuth();
  const [messageToSign, setMessageToSign] = useState(DEFAULT_MESSAGE);
  const [signedMessage, setSignedMessage] = useState<SignedMessageResult | null>(null);
  const [isSigningMessage, setIsSigningMessage] = useState(false);
  const [status, setStatus] = useState<string>("");

  const signMessage = async () => {
    if (!user?.authContext || !messageToSign.trim() || !services?.litClient) {
      setStatus("No auth context, message to sign, or Lit client");
      return;
    }

    setIsSigningMessage(true);
    setStatus("Signing message...");
    try {
      // Get chain config from litClient
      const chainConfig = services.litClient.getChainConfig().viemConfig;

      // Get PKP as a viem account
      const pkpViemAccount = await services.litClient.getPkpViemAccount({
        pkpPublicKey: selectedPkp?.publicKey || user?.pkpInfo?.pubkey,
        authContext: user.authContext,
        chainConfig: chainConfig,
      });

      const signature = await pkpViemAccount.signMessage({
        message: messageToSign,
      });

      setSignedMessage({
        message: messageToSign,
        signature,
        address: pkpViemAccount.address,
        timestamp: new Date().toISOString(),
      });
      setStatus("Message signed successfully!");
    } catch (error: any) {
      console.error("Failed to sign message:", error);
      setStatus(`Failed to sign message: ${error.message || error}`);
    } finally {
      setIsSigningMessage(false);
    }
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
      <h3 style={{ margin: "0 0 16px 0", color: "#1f2937" }}>
        ✍️ Sign Message
      </h3>
      <p
        style={{
          margin: "0 0 16px 0",
          color: "#6b7280",
          fontSize: "14px",
        }}
      >
        Sign a message using your PKP wallet.
      </p>

      <textarea
        value={messageToSign}
        onChange={(e) => setMessageToSign(e.target.value)}
        placeholder="Enter message to sign..."
        disabled={disabled || isSigningMessage}
        style={{
          width: "100%",
          height: "80px",
          padding: "12px",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          fontSize: "14px",
          marginBottom: "12px",
          resize: "vertical",
          color: "#374151",
          backgroundColor: disabled ? "#f3f4f6" : "#ffffff",
        }}
      />

      <button
        onClick={signMessage}
        disabled={disabled || isSigningMessage || !messageToSign.trim()}
        style={{
          width: "100%",
          padding: "12px",
          backgroundColor: 
            disabled || isSigningMessage || !messageToSign.trim() 
              ? "#9ca3af" 
              : "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "500",
          cursor: 
            disabled || isSigningMessage || !messageToSign.trim() 
              ? "not-allowed" 
              : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        {isSigningMessage ? (
          <>
            <LoadingSpinner size={16} />
            Signing...
          </>
        ) : (
          "Sign Message"
        )}
      </button>

      {/* Status Display */}
      {status && (
        <div
          style={{
            marginTop: "12px",
            padding: "8px 12px",
            backgroundColor: status.includes("successfully") ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${status.includes("successfully") ? "#bbf7d0" : "#fecaca"}`,
            borderRadius: "6px",
            color: status.includes("successfully") ? "#15803d" : "#dc2626",
            fontSize: "12px",
          }}
        >
          {status}
        </div>
      )}

      {/* Signed Message Result */}
      {signedMessage && (
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
            ✅ Message Signed
          </h4>
          <div style={{ fontSize: "12px", color: "#15803d" }}>
            <div style={{ marginBottom: "4px" }}>
              <strong>Message:</strong> "{signedMessage.message}"
            </div>
            <div style={{ marginBottom: "4px" }}>
              <strong>Address:</strong> {signedMessage.address}
            </div>
            <div
              style={{
                fontFamily: "monospace",
                wordBreak: "break-all",
                backgroundColor: "#dcfce7",
                padding: "4px 6px",
                borderRadius: "4px",
                border: "1px solid #bbf7d0",
              }}
            >
              <strong>Signature:</strong> {signedMessage.signature?.slice(0, 40)}...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 