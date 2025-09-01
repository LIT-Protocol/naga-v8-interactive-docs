import { useState } from "react";
import { DisplayCode } from "../DisplayCode"; // Assuming DisplayCode is in ../components/DisplayCode
import PaymentInformation from "../tips/PaymentInformation";

// Define types for chain and scheme to match SDK expectations
export type SupportedChain = "ethereum" | "bitcoin" | "cosmos" | "solana"; // Add others if supported by raw.pkpSign
export type SupportedScheme =
  | "EcdsaK256Sha256"
  | "EcdsaP256Sha256"
  | "EcdsaP384Sha384"
  | "SchnorrEd25519Sha512"
  | "SchnorrK256Sha256"
  | "SchnorrP256Sha256"
  | "SchnorrP384Sha384"
  | "SchnorrRistretto25519Sha512"
  | "SchnorrEd448Shake256"
  | "SchnorrRedJubjubBlake2b512"
  | "SchnorrK256Taproot"
  | "SchnorrRedDecaf377Blake2b512"
  | "SchnorrkelSubstrate";

// Define available signing schemes
export const SIGNING_SCHEMES: SupportedScheme[] = [
  "EcdsaK256Sha256",
  "EcdsaP256Sha256",
  "EcdsaP384Sha384",
  "SchnorrEd25519Sha512",
  "SchnorrK256Sha256",
  "SchnorrP256Sha256",
  "SchnorrP384Sha384",
  "SchnorrRistretto25519Sha512",
  "SchnorrEd448Shake256",
  "SchnorrRedJubjubBlake2b512",
  "SchnorrK256Taproot",
  "SchnorrRedDecaf377Blake2b512",
  "SchnorrkelSubstrate",
];

// Define available chains
export const AVAILABLE_CHAINS: { key: SupportedChain; label: string }[] = [
  { key: "ethereum", label: "Ethereum" },
  { key: "bitcoin", label: "Bitcoin" },
  { key: "cosmos", label: "Cosmos" },
  { key: "solana", label: "Solana" },
  // Add other chains supported by raw.pkpSign as needed
];

// Code snippet for display
// Note: This is a static representation. If selectedChain/Scheme need to be dynamic here,
// this could be a function that returns the string, or DisplayCode could accept params.
export const SIGN_MESSAGE_CODE_SNIPPET = `
// The message string will be UTF-8 encoded before signing.
// Hashing (e.g., Keccak256 for Ethereum, SHA256 for Bitcoin)
// is handled automatically by the Lit Protocol based on the selected chain.
const messageBytes = new TextEncoder().encode(messageToSign);

const signatures = await litClient.chain.raw.pkpSign({
  chain: selectedChain,         
  signingScheme: selectedScheme, // From dropdown
  pubKey: pkpInfo.pubkey,
  authContext: authContext,
  toSign: messageBytes,          // UTF-8 encoded message
  
  // 💰 Optional: Set custom maximum price you're willing to pay
  // userMaxPrice: BigInt("1000000000000000"), // 0.001 ETH in Wei
  // If not specified, Lit Protocol will automatically find the most optimised price
});`;

interface PkpSigningComponentProps {
  authContext: any;
  pkpInfo: any; // Consider defining a more specific type for pkpInfo if available
  setStatus: (message: string) => void;
  assertDependenciesLoaded: () => { litClient: any /* other deps */ };
  defaultMessage?: string;
  componentTitle?: string;
  showError?: (errorMessage: string, autoHide?: boolean) => void;
}

export default function PkpSigningComponent({
  authContext,
  pkpInfo,
  setStatus,
  assertDependenciesLoaded,
  defaultMessage = "Hello from Lit PKP!",
  componentTitle = "Sign Message with PKP",
  showError,
}: PkpSigningComponentProps) {
  const [messageToSign, setMessageToSign] = useState<string>(defaultMessage);
  const [selectedScheme, setSelectedScheme] = useState<SupportedScheme>(
    SIGNING_SCHEMES[0]
  );
  const [selectedChain, setSelectedChain] = useState<SupportedChain>(
    AVAILABLE_CHAINS[0].key
  );
  const [signature, setSignature] = useState<any>(null);
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
      setStatus("Signing message...");

      const messageBytes = new TextEncoder().encode(messageToSign);

      console.log(
        `Signing with: chain='${selectedChain}', scheme='${selectedScheme}', message='${messageToSign}'`
      );

      console.log("pkpInfo:", pkpInfo);
      console.log("authContext:", authContext);

      const signatures = await litClient.chain.raw.pkpSign({
        chain: selectedChain,
        signingScheme: selectedScheme,
        pubKey: pkpInfo.pubkey || authContext.pkpPublicKey,
        authContext: authContext,
        toSign: messageBytes,
      });

      console.log("signatures:", signatures);
      setSignature(signatures);
      setStatus("Message signed successfully");
      showSuccess();
    } catch (error: any) {
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
        Use your PKP to sign a message with the selected chain and scheme. The
        signing operation will automatically find the most optimised price, or
        you can specify a custom maximum price using the{" "}
        <code>userMaxPrice</code> parameter.
      </p>

      <PaymentInformation />

      <DisplayCode
        code={SIGN_MESSAGE_CODE_SNIPPET}
        language="typescript"
        renderComponent={
          <div>
            <div style={{ marginBottom: "15px" }}>
              <label
                htmlFor={`pkp-message-input-${pkpInfo?.pkpAddress}`} // Unique ID
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "500",
                }}
              >
                Message to Sign:
              </label>
              <input
                id={`pkp-message-input-${pkpInfo?.pkpAddress}`}
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

            {/* Chain Selection Dropdown */}
            <div style={{ marginBottom: "15px" }}>
              <label
                htmlFor={`pkp-chain-select-${pkpInfo?.pkpAddress}`}
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "500",
                }}
              >
                Chain:
              </label>
              <select
                id={`pkp-chain-select-${pkpInfo?.pkpAddress}`}
                value={selectedChain}
                onChange={(e) =>
                  setSelectedChain(e.target.value as SupportedChain)
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
                {AVAILABLE_CHAINS.map((chain) => (
                  <option key={chain.key} value={chain.key}>
                    {chain.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Signing Scheme Dropdown */}
            <div style={{ marginBottom: "15px" }}>
              <label
                htmlFor={`pkp-signing-scheme-select-${pkpInfo?.pkpAddress}`}
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "500",
                }}
              >
                Signing Scheme:
              </label>
              <select
                id={`pkp-signing-scheme-select-${pkpInfo?.pkpAddress}`}
                value={selectedScheme}
                onChange={(e) =>
                  setSelectedScheme(e.target.value as SupportedScheme)
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
                {SIGNING_SCHEMES.map((scheme) => (
                  <option key={scheme} value={scheme}>
                    {scheme}
                  </option>
                ))}
              </select>
              <small
                style={{ display: "block", marginTop: "5px", color: "#555" }}
              >
                Note: The message will be UTF-8 encoded. Hashing is
                automatically handled by Lit Protocol based on the selected
                chain.
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
                    : "#6f42c1",
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
              {isSigning ? "Signing..." : "Sign Message"}
            </button>
          </div>
        }
        resultData={signature}
        resultLabel="Signature Result"
        useSideBySide={true}
        theme="dracula"
        isSuccess={isSuccess}
      />
    </>
  );
}
