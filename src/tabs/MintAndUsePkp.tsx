import React, { useState } from "react";
import { replacer } from "../helper";
import { useAppContext } from "../router";

// Define the component with context from the router
const MintAndUsePkp: React.FC = () => {
  const context = useAppContext();
  
  // Make sure all properties exist and aren't undefined
  if (!context || !context.canMintPkp || !context.setPkpInfo || !context.setSignature || !context.setLoading) {
    return <div>Loading context...</div>;
  }
  
  const {
    getDependencyStatus,
    canMintPkp,
    loading,
    authContext,
    pkpInfo,
    signature,
    assertDependenciesLoaded,
    setStatus,
    setPkpInfo,
    setSignature,
    setLoading,
  } = context;
  
  const [messageToSign, setMessageToSign] = useState<string>(
    "Hello, Lit Protocol!"
  );
  const [isSigning, setIsSigning] = useState<boolean>(false);

  // Function to mint a PKP with the authenticated context
  const mintWithContext = async () => {
    const { walletClient, authManager, litClient } = assertDependenciesLoaded();
    if (!authContext) {
      throw new Error("Auth context not found");
    }

    setStatus("Minting PKP...");
    setLoading(true);

    try {
      // Use the authService.mintWithAuth method instead of mintPkp
      const res = await litClient.authService.mintWithAuth({
        authData: authContext,
      });

      setPkpInfo(res.data);
      setStatus("PKP minted successfully!");
    } catch (error: any) {
      console.error("Error minting PKP:", error);
      setStatus(`Failed to mint PKP: ${error?.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to sign a message with the minted PKP
  const signWithPkp = async () => {
    if (!pkpInfo || !assertDependenciesLoaded().litClient || !authContext) {
      setStatus("Cannot sign: Missing PKP, Lit Client, or Auth Context");
      return;
    }

    setStatus("Signing message with PKP...");
    setIsSigning(true);

    try {
      // Construct a message to sign
      const messageToSignBytes = new TextEncoder().encode(messageToSign);
      
      const signatures =
        await assertDependenciesLoaded().litClient.chain.ethereum.pkpSign({
          pubKey: pkpInfo.pubkey,
          authContext: authContext,
          toSign: messageToSignBytes,
        });

      console.log("signatures:", signatures);

      setSignature(signatures);
      setStatus("Message signed successfully!");
    } catch (error: any) {
      console.error("Error signing with PKP:", error);
      setStatus(`Failed to sign message: ${error?.message || "Unknown error"}`);
    } finally {
      // Always reset the signing state, regardless of success or failure
      setIsSigning(false);
    }
  };

  return (
    <div className="tab-content">
      <h2>Mint & Use PKP</h2>
      <p>
        Programmable Key Pairs (PKPs) are decentralised key pairs that can be
        controlled and used via the Lit Protocol.
      </p>

      {/* Mint PKP Section */}
      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          backgroundColor: "#f9f9f9",
          borderRadius: "6px",
          border: "1px solid #e0e0e0",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Step 1: Mint PKP</h3>
        <ul>
          <li>
            Authentication Context:{" "}
            {authContext ? (
              <span style={{ color: "green" }}>✓ Available</span>
            ) : (
              <span style={{ color: "red" }}>
                ✗ Not available (authenticate first)
              </span>
            )}
          </li>
          <li>
            Lit Client:{" "}
            {getDependencyStatus().litClient ? (
              <span style={{ color: "green" }}>✓ Initialised</span>
            ) : (
              <span style={{ color: "red" }}>✗ Not initialised</span>
            )}
          </li>
        </ul>

        <button
          onClick={mintWithContext}
          disabled={!canMintPkp() || loading}
          style={{
            marginTop: "15px",
            padding: "12px 20px",
            backgroundColor: canMintPkp() && !loading ? "#3b82f6" : "#cccccc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: canMintPkp() && !loading ? "pointer" : "not-allowed",
            fontWeight: "500",
          }}
        >
          {loading
            ? "Minting..."
            : canMintPkp()
            ? "Mint PKP"
            : "Missing Prerequisites"}
        </button>

        {!authContext && (
          <div
            style={{
              marginTop: "10px",
              padding: "8px 12px",
              backgroundColor: "#fff8e1",
              borderRadius: "4px",
              fontSize: "14px",
              color: "#856404",
            }}
          >
            You need to authenticate first. Go to the EOA Authentication tab.
          </div>
        )}
      </div>

      {/* PKP Result */}
      {pkpInfo && (
        <div style={{ marginTop: "20px" }}>
          <h3>PKP Information</h3>
          <div
            style={{
              backgroundColor: "#f5f5f5",
              padding: "15px",
              borderRadius: "6px",
              overflowX: "auto",
            }}
          >
            <pre style={{ margin: 0, fontSize: "13px" }}>
              {JSON.stringify(pkpInfo, replacer, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Signing Section - Only visible after PKP is minted */}
      {pkpInfo && (
        <div
          style={{
            marginTop: "30px",
            padding: "20px",
            backgroundColor: "#f9f9f9",
            borderRadius: "6px",
            border: "1px solid #e0e0e0",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Step 2: Sign Message with PKP</h3>
          <p>Use your minted PKP to sign a message.</p>

          <div style={{ marginTop: "15px" }}>
            <label
              htmlFor="message-input"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "500",
              }}
            >
              Message to Sign:
            </label>
            <input
              id="message-input"
              type="text"
              value={messageToSign}
              onChange={(e) => setMessageToSign(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #dddddd",
                borderRadius: "4px",
                fontSize: "14px",
              }}
              placeholder="Enter a message to sign"
            />
          </div>

          <button
            onClick={signWithPkp}
            disabled={isSigning || !messageToSign.trim()}
            style={{
              marginTop: "15px",
              padding: "12px 20px",
              backgroundColor:
                isSigning || !messageToSign.trim() ? "#cccccc" : "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor:
                isSigning || !messageToSign.trim() ? "not-allowed" : "pointer",
              fontWeight: "500",
            }}
          >
            {isSigning ? "Signing..." : "Sign Message"}
          </button>

          {/* Show signature if available */}
          {signature && (
            <div style={{ marginTop: "20px" }}>
              <h4 style={{ marginBottom: "10px" }}>Signature:</h4>
              <div
                style={{
                  backgroundColor: "#f5f5f5",
                  padding: "15px",
                  borderRadius: "6px",
                  overflowX: "auto",
                }}
              >
                <pre style={{ margin: 0, fontSize: "13px" }}>
                  {JSON.stringify(signature, replacer, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MintAndUsePkp;
