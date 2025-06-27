import { useState } from "react";
import { DisplayCode } from "../DisplayCode";

export type BitcoinSigningScheme =
  | "EcdsaK256Sha256" // Standard Bitcoin ECDSA signatures
  | "SchnorrK256Sha256"; // Bitcoin Taproot Schnorr signatures

export const BITCOIN_SIGNING_SCHEMES: BitcoinSigningScheme[] = [
  "EcdsaK256Sha256", // Standard Bitcoin ECDSA (P2PKH, P2WPKH, P2SH-P2WPKH)
  "SchnorrK256Sha256", // Bitcoin Taproot Schnorr (P2TR)
];

export const BITCOIN_SIGN_CODE_SNIPPET = `
// The message string will be UTF-8 encoded before signing.
// For Bitcoin, the data is automatically hashed with SHA256
// and signed using the specified signature scheme.
const messageBytes = new TextEncoder().encode(messageToSign);

const signatures = await litClient.chain.bitcoin.pkpSign({
  chain: "bitcoin",             // Specify Bitcoin blockchain
  signingScheme: selectedScheme, // EcdsaK256Sha256 or SchnorrK256Sha256
  pubKey: pkpInfo.pubkey,
  authContext: authContext,
  toSign: messageBytes,          // UTF-8 encoded message
  
  // 💰 Optional: Set custom maximum price you're willing to pay
  // userMaxPrice: BigInt("1000000000000000"), // 0.001 ETH in Wei
  // If not specified, Lit Protocol will automatically find the most optimised price
});`;

interface LitClient {
  chain: {
    bitcoin: {
      pkpSign: (params: {
        chain: string;
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

interface PkpBtcSigningComponentProps {
  authContext: unknown;
  pkpInfo: unknown;
  setStatus: (message: string) => void;
  assertDependenciesLoaded: () => Dependencies;
  defaultMessage?: string;
  componentTitle?: string;
  showError?: (errorMessage: string, autoHide?: boolean) => void;
}

export default function PkpBtcSigningComponent({
  authContext,
  pkpInfo,
  setStatus,
  assertDependenciesLoaded,
  defaultMessage = "Hello from Lit PKP Bitcoin Signing!",
  componentTitle = "Sign Message with PKP (Bitcoin)",
  showError,
}: PkpBtcSigningComponentProps) {
  const [messageToSign, setMessageToSign] = useState<string>(defaultMessage);
  const [selectedScheme, setSelectedScheme] = useState<BitcoinSigningScheme>(
    BITCOIN_SIGNING_SCHEMES[0]
  );
  const [signature, setSignature] = useState<SignatureResult | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const showSuccess = () => {
    setIsSuccess(true);
    // Auto-clear after 3 seconds
    setTimeout(() => {
      setIsSuccess(false);
    }, 3000);
  };

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
      setStatus("Signing message with Bitcoin...");

      const messageBytes = new TextEncoder().encode(messageToSign);

      console.log(
        `Signing with Bitcoin: scheme='${selectedScheme}', message='${messageToSign}'`
      );

      console.log("pkpInfo:", pkpInfo);
      console.log("authContext:", authContext);

      const pkpData = pkpInfo as Record<string, unknown>;
      const authCtx = authContext as Record<string, unknown>;

      const signatures = await litClient.chain.bitcoin.pkpSign({
        chain: "bitcoin",
        signingScheme: selectedScheme,
        pubKey: String(
          pkpData?.pubkey || pkpData?.publicKey || authCtx?.pkpPublicKey || ""
        ),
        authContext: authContext,
        toSign: messageBytes,
      });

      console.log("signatures:", signatures);
      setSignature(signatures as SignatureResult);
      setStatus("Message signed successfully with Bitcoin");
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
        Use your PKP to sign a message for the Bitcoin blockchain. The signing
        operation automatically hashes the input with SHA256 and signs it using
        the selected signature scheme, which is compatible with Bitcoin's native
        signature verification.
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
        code={BITCOIN_SIGN_CODE_SNIPPET}
        language="typescript"
        renderComponent={
          <div>
            <div style={{ marginBottom: "15px" }}>
              <label
                htmlFor={`pkp-btc-message-input-${
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
                id={`pkp-btc-message-input-${
                  (pkpInfo as any)?.pkpAddress || "default"
                }`}
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

            {/* Bitcoin Signing Scheme Dropdown */}
            <div style={{ marginBottom: "15px" }}>
              <label
                htmlFor={`pkp-btc-signing-scheme-select-${
                  (pkpInfo as any)?.pkpAddress || "default"
                }`}
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "500",
                }}
              >
                Bitcoin Signing Scheme:
              </label>
              <select
                id={`pkp-btc-signing-scheme-select-${
                  (pkpInfo as any)?.pkpAddress || "default"
                }`}
                value={selectedScheme}
                onChange={(e) =>
                  setSelectedScheme(e.target.value as BitcoinSigningScheme)
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #dddddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
                disabled={!(pkpInfo && authContext) || isSigning}
              >
                {BITCOIN_SIGNING_SCHEMES.map((scheme) => (
                  <option key={scheme} value={scheme}>
                    {scheme}
                  </option>
                ))}
              </select>
              <small
                style={{ display: "block", marginTop: "5px", color: "#555" }}
              >
                <strong>EcdsaK256Sha256:</strong> Standard Bitcoin ECDSA
                signatures (P2PKH, P2WPKH, P2SH-P2WPKH)
                <br />
                <strong>SchnorrK256Sha256:</strong> Bitcoin Taproot Schnorr
                signatures (P2TR) - more efficient and private
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
              {isSigning ? "Signing..." : "Sign Message with Bitcoin"}
            </button>
          </div>
        }
        resultData={signature}
        resultLabel="Bitcoin Signature Result"
        useSideBySide={true}
        theme="dracula"
        isSuccess={isSuccess}
      />
    </>
  );
}
