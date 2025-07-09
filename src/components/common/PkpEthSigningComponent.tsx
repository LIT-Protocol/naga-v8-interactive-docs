import { useState } from "react";
import { DisplayCode } from "../DisplayCode";

export const ETHEREUM_SIGN_CODE_SNIPPET = `
// The message string will be UTF-8 encoded before signing.
// For Ethereum, the data is automatically hashed with Keccak256
// and signed using the specified ECDSA scheme.
const messageBytes = new TextEncoder().encode(messageToSign);

const signatures = await litClient.chain.ethereum.pkpSign({
  signingScheme: "EcdsaK256Sha256", // Standard Ethereum signature scheme
  pubKey: pkpInfo.pubkey,
  authContext: authContext,
  toSign: messageBytes,          // UTF-8 encoded message
  
  // 💰 Optional: Set custom maximum price you're willing to pay
  // userMaxPrice: BigInt("1000000000000000"), // 0.001 ETH in Wei
  // If not specified, Lit Protocol will automatically find the most optimised price
});`;

interface LitClient {
  chain: {
    ethereum: {
      pkpSign: (params: {
        signingScheme: string;
        pubKey: string;
        authContext: unknown;
        toSign: Uint8Array;
        userMaxPrice?: bigint;
      }) => Promise<unknown>;
    };
  };
}

interface Dependencies {
  litClient: LitClient;
  [key: string]: unknown;
}

interface SignatureResult {
  [key: string]: unknown;
}

interface PkpEthSigningComponentProps {
  authContext: unknown;
  pkpInfo: unknown;
  setStatus: (message: string) => void;
  assertDependenciesLoaded: () => Dependencies;
  defaultMessage?: string;
  componentTitle?: string;
  showError?: (errorMessage: string, autoHide?: boolean) => void;
}

export default function PkpEthSigningComponent({
  authContext,
  pkpInfo,
  setStatus,
  assertDependenciesLoaded,
  defaultMessage = "Hello from Lit PKP Ethereum Signing!",
  componentTitle = "Sign Message with PKP (Ethereum)",
  showError,
}: PkpEthSigningComponentProps) {
  const [messageToSign, setMessageToSign] = useState<string>(defaultMessage);
  const [signature, setSignature] = useState<SignatureResult | null>(null);
  const [isSigning, setIsSigning] = useState(false);

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
  const formatErrorMessage = (prefix: string, error: unknown): string => {
    let errorMessage = prefix;
    if (error && typeof error === "object" && "message" in error) {
      errorMessage += String(error.message);
    } else if (typeof error === "object") {
      errorMessage += JSON.stringify(error, null, 2);
    } else {
      errorMessage += String(error);
    }
    return errorMessage;
  };

  const signMessage = async () => {
    const { litClient } = assertDependenciesLoaded();

    if (!authContext || !pkpInfo || !litClient) {
      setStatus(
        "Cannot sign: Missing AuthContext, PKP Info, or LitClient is not ready."
      );
      return;
    }

    try {
      setIsSigning(true);
      setStatus("Signing message with Ethereum...");

      const messageBytes = new TextEncoder().encode(messageToSign);

      console.log("pkpInfo:", pkpInfo);
      console.log("authContext:", authContext);

      // Type assertion for working with existing codebase
      const pkpData = pkpInfo as Record<string, unknown>;
      const authCtx = authContext as Record<string, unknown>;

      const signatures = await litClient.chain.ethereum.pkpSign({
        signingScheme: "EcdsaK256Sha256",
        pubKey: String(
          pkpData?.pubkey || pkpData?.publicKey || authCtx?.pkpPublicKey || ""
        ),
        authContext: authContext,
        toSign: messageBytes,
      });

      console.log("signatures:", signatures);
      setSignature(signatures as SignatureResult);
      setStatus("Message signed successfully with Ethereum");
      showSuccess();
    } catch (error: unknown) {
      console.error("Error signing message:", error);
      const errorMessage = formatErrorMessage(
        "Failed to sign message: ",
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <>
      <h3>
        {componentTitle}{" "}
        {!(pkpInfo && authContext) && (
          <span style={{ color: "orange" }}>
            (Requires PKP and AuthContext)
          </span>
        )}
      </h3>
      <p>
        Use your PKP to sign a message for the Ethereum blockchain. The signing
        operation automatically hashes the input with Keccak256 and signs it
        using the selected ECDSA scheme, which is compatible with Ethereum's
        native ECDSA validation.
      </p>

      <div
        style={{
          padding: "12px",
          backgroundColor: "#e8f4fd",
          borderRadius: "4px",
          border: "1px solid #b3d9ff",
          marginBottom: "15px",
          fontSize: "14px",
        }}
      >
        <strong>💰 Payment Information:</strong> PKP signing operations require
        payment. Visit the{" "}
        <a
          href="/payment-manager"
          style={{ color: "#0066cc", textDecoration: "underline" }}
        >
          Payment Manager
        </a>{" "}
        page to understand pricing, deposit funds, and manage your payment
        balance.
      </div>

      <DisplayCode
        code={ETHEREUM_SIGN_CODE_SNIPPET}
        language="typescript"
        renderComponent={
          <div>
            <div style={{ marginBottom: "15px" }}>
              <label
                htmlFor={`pkp-eth-message-input-${
                  (pkpInfo as any)?.pkpAddress || "default"
                }`}
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "500",
                }}
              >
                Message to Sign:
              </label>
              <input
                id={`pkp-eth-message-input-${pkpInfo?.pkpAddress}`}
                type="text"
                value={messageToSign}
                onChange={(e) => setMessageToSign(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #dddddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
                placeholder="Enter a message to sign"
                disabled={!(pkpInfo && authContext) || isSigning}
              />
            </div>

            {/* Ethereum Signing Scheme Dropdown */}
            <div style={{ marginBottom: "15px" }}>
              <label
                htmlFor={`pkp-eth-signing-scheme-select-${pkpInfo?.pkpAddress}`}
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "500",
                }}
              >
                Ethereum Signing Scheme: <code>EcdsaK256Sha256</code>
              </label>
              <small
                style={{ display: "block", marginTop: "5px", color: "#555" }}
              >
                The message will be UTF-8 encoded and automatically hashed with
                Keccak256 before signing.
              </small>
            </div>

            <button
              onClick={signMessage}
              disabled={!(pkpInfo && authContext) || isSigning}
              style={{
                padding: "10px 15px",
                backgroundColor:
                  !(pkpInfo && authContext) || isSigning
                    ? "#cccccc"
                    : "#0066cc",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor:
                  !(pkpInfo && authContext) || isSigning
                    ? "not-allowed"
                    : "pointer",
                fontWeight: "500",
              }}
            >
              {isSigning ? "Signing..." : "Sign Message with Ethereum"}
            </button>
          </div>
        }
        resultData={signature}
        resultLabel="Ethereum Signature Result"
        useSideBySide={true}
        theme="dracula"
        isSuccess={isSuccess}
      />
    </>
  );
}
