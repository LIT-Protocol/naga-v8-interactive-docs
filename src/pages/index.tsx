import { MainLayout } from "../layouts/MainLayout";
import { usePublicClient, useWalletClient } from "wagmi";
import { createAuthManager, storagePlugins } from "@lit-protocol/auth";
import { createAuthConfigBuilder } from "@lit-protocol/auth-helpers";
import { createLitClient } from "@lit-protocol/lit-client";
import { privateKeyToAccount } from "viem/accounts";
import { useState } from "react";
import { nagaDev } from "@lit-protocol/networks";
import { WalletClient } from "viem";
// import { goChain } from "viem/chains";
// import { useCounter } from '@lit-protocol/react-hooks';

export const HomePage = () => {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [status, setStatus] = useState<string>("");
  const [signature, setSignature] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [pkpInfo, setPkpInfo] = useState<any>(null);
  // const { count, increment, decrement } = useCounter();
  // Helper function to serialize BigInts
  const replacer = (key: string, value: any) =>
    typeof value === "bigint" ? value.toString() : value;

  const authenticate = async () => {

    if (!walletClient) {
      throw new Error("Wallet client not found");
    }

    try {
      setLoading(true);
      setStatus("Starting authentication process...");

      // Step 1: Get private key (in a real app, this would be securely stored)
      // For demo purposes only - never use hardcoded keys in production
      // const demoPrivateKey =
      //   "0x1234567890123456789012345678901234567890123456789012345678901234";
      // const myAccount = privateKeyToAccount(demoPrivateKey as `0x${string}`);
      // setStatus("Account created...");

      // Step 2: Import and choose the Lit network to connect to
      // setStatus("Network imported...");

      // Step 3: Instantiate the LitClient using the selected network
      const litClient = await createLitClient({ network: nagaDev });
      // setStatus("Lit client created...");

      // Step 4: Create an AuthManager to manage authentication state
      const authManager = createAuthManager({
        // on browser, use browser storage plugin by default
        storage: storagePlugins.localStorage({
          appName: "my-app", // namespace for isolating auth data
          networkName: "naga-dev", // useful for distinguishing environments
        }),
      });

      setStatus("Auth manager created...");

      // Step 5: Build a reusable auth configuration
      const authConfig = createAuthConfigBuilder()
        .addDomain(window.location.host)
        .addPKPSigningRequest("*")
        .addStatement("🔥🔥🔥🔥LOOOOOL")
        .addLitActionExecutionRequest("*")
        .build();
      setStatus("Auth config built...");

      // const toSign = "hello from the frontend";
      // const signatures = await walletClient?.signMessage({
      //   message: toSign,
      // });
      // console.log("XX signatures:", signatures);
      // return;
      // Step 6: Create an EOA-based auth context
      const eoaAuthContext = await authManager.createEoaAuthContext({
        config: {
          account: walletClient,
        },
        authConfig,
        litClient: litClient,
      });
      console.log("eoaAuthContext:", eoaAuthContext);
      setStatus("EOA auth context created...");


      // Step 7: Mint a new Programmable Key Pair
      const { data: mintedPkpInfo } = await litClient.mintPkp({
        authContext: eoaAuthContext,
        scopes: ["sign-anything"],
      });
      setPkpInfo(mintedPkpInfo);
      setStatus("PKP minted successfully!");

      // Step 8: Sign a message with the PKP
      const signatureResult = await litClient.chain.ethereum.pkpSign({
        pubKey: mintedPkpInfo.pubkey,
        toSign: "hello from the frontend",
        authContext: eoaAuthContext,
      });
      setSignature(JSON.stringify(signatureResult));
      setStatus("Message signed successfully!");

      // Disconnect from Lit network
      await litClient.disconnect();
      setStatus("Authentication complete!");
    } catch (error) {
      console.error("Authentication error:", error);
      setStatus(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="home-page">
        <h1>Lit Protocol Demo</h1>

        {/* <p>Count: {count}</p>
        <button onClick={increment}>Increment</button>
        <button onClick={decrement}>Decrement</button> */}

        <button
          onClick={authenticate}
          disabled={loading}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: loading ? "#cccccc" : "#4285f4",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Authenticating..." : "Authenticate with Lit Protocol"}
        </button>

        {status && (
          <div style={{ marginTop: "20px" }}>
            <h3>Status:</h3>
            <p>{status}</p>
          </div>
        )}

        {pkpInfo && (
          <div style={{ marginTop: "20px" }}>
            <h3>PKP Information:</h3>
            <pre
              style={{
                backgroundColor: "#f5f5f5",
                padding: "10px",
                borderRadius: "4px",
                overflow: "auto",
              }}
            >
              {JSON.stringify(pkpInfo, replacer, 2)}
            </pre>
          </div>
        )}

        {signature && (
          <div style={{ marginTop: "20px" }}>
            <h3>Signature:</h3>
            <pre
              style={{
                backgroundColor: "#f5f5f5",
                padding: "10px",
                borderRadius: "4px",
                overflow: "auto",
              }}
            >
              {signature}
            </pre>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default HomePage;
