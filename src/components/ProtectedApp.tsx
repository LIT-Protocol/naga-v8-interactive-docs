import Editor from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { useLitAuth } from "../contexts/LitAuthProvider";
import PkpSelectionForDemo from "./common/PkpSelectionForDemo";

// Configuration constants
const SUPPORTED_CHAIN_ID = 2888; // Naga chain ID
const DEFAULT_MESSAGE = "Hello from your PKP wallet! 🔐";
const DEFAULT_ENCRYPT_MESSAGE = "This is my secret message! 🤫";
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
  const message = "Hello from Lit Action!";
  const signature = await Lit.Actions.signAndCombineEcdsa({
    toSign: ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.toUtf8Bytes(message))),
    publicKey,
    sigName: "sig1",
  });
  
  Lit.Actions.setResponse({ response: JSON.stringify({ message, signature }) });
})();`;

interface BalanceInfo {
  balance: string;
  symbol: string;
  chainId: number;
}

interface PkpInfo {
  tokenId: string;
  publicKey: string;
  ethAddress: string;
}

interface TransactionResult {
  hash: string;
  to: string;
  value: string;
  from: string;
  timestamp: string;
  chainId?: number;
  chainName?: string;
  explorerUrl?: string;
}

// Supported chains configuration based on Lit Protocol documentation
const SUPPORTED_CHAINS = {
  yellowstone: {
    id: 175188,
    name: "Chronicle Yellowstone",
    symbol: "tstLPX",
    rpcUrl: "https://yellowstone-rpc.litprotocol.com/",
    explorerUrl: "https://yellowstone-explorer.litprotocol.com/",
    litIdentifier: "yellowstone",
    testnet: true,
  },
  ethereum: {
    id: 1,
    name: "Ethereum",
    symbol: "ETH",
    rpcUrl: "https://eth.llamarpc.com",
    explorerUrl: "https://etherscan.io/",
    litIdentifier: "ethereum",
    testnet: false,
  },
  sepolia: {
    id: 11155111,
    name: "Sepolia Testnet",
    symbol: "ETH",
    rpcUrl: "https://sepolia.infura.io/v3/YOUR_KEY",
    explorerUrl: "https://sepolia.etherscan.io/",
    litIdentifier: "sepolia",
    testnet: true,
  },
  polygon: {
    id: 137,
    name: "Polygon",
    symbol: "MATIC",
    rpcUrl: "https://polygon.llamarpc.com",
    explorerUrl: "https://polygonscan.com/",
    litIdentifier: "polygon",
    testnet: false,
  },
  arbitrum: {
    id: 42161,
    name: "Arbitrum",
    symbol: "AETH",
    rpcUrl: "https://arbitrum.llamarpc.com",
    explorerUrl: "https://arbiscan.io/",
    litIdentifier: "arbitrum",
    testnet: false,
  },
  base: {
    id: 8453,
    name: "Base",
    symbol: "ETH",
    rpcUrl: "https://base.llamarpc.com",
    explorerUrl: "https://basescan.org/",
    litIdentifier: "base",
    testnet: false,
  },
  optimism: {
    id: 10,
    name: "Optimism",
    symbol: "ETH",
    rpcUrl: "https://optimism.llamarpc.com",
    explorerUrl: "https://optimistic.etherscan.io/",
    litIdentifier: "optimism",
    testnet: false,
  },
} as const;

export default function ProtectedApp() {
  const {
    user,
    logout,
    services,
    initiateAuthentication,
    isInitializingServices,
    isServicesReady,
  } = useLitAuth();
  const [showPkpModal, setShowPkpModal] = useState(false);
  const [selectedPkp, setSelectedPkp] = useState(user?.pkpInfo || null);
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // PKP selection state
  const [pkps, setPkps] = useState<PkpInfo[]>([]);
  const [isLoadingPkps, setIsLoadingPkps] = useState(false);
  const [pkpStatus, setPkpStatus] = useState<string>("");

  // Message signing state
  const [messageToSign, setMessageToSign] = useState(DEFAULT_MESSAGE);
  const [signedMessage, setSignedMessage] = useState<any>(null);
  const [isSigningMessage, setIsSigningMessage] = useState(false);

  // Encryption/Decryption state
  const [messageToEncrypt, setMessageToEncrypt] = useState(
    DEFAULT_ENCRYPT_MESSAGE
  );
  const [encryptedData, setEncryptedData] = useState<any>(null);
  const [decryptedMessage, setDecryptedMessage] = useState<string>("");
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Lit Action state
  const [litActionCode, setLitActionCode] = useState(DEFAULT_LIT_ACTION);
  const [litActionResult, setLitActionResult] = useState<any>(null);
  const [isExecutingAction, setIsExecutingAction] = useState(false);

  // PKP Viem Account state
  const [viemAccountMessage, setViemAccountMessage] = useState(
    "Hello from PKP Viem Account!"
  );
  const [viemSignature, setViemSignature] = useState<any>(null);
  const [isSigningViem, setIsSigningViem] = useState(false);

  // Transaction state
  const [recipientAddress, setRecipientAddress] = useState("0x...");
  const [sendAmount, setSendAmount] = useState("0.001");
  const [transactionResult, setTransactionResult] =
    useState<TransactionResult | null>(null);
  const [isSendingTransaction, setIsSendingTransaction] = useState(false);

  // General status
  const [status, setStatus] = useState<string>("");

  // Copy functionality
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Chain selection state
  const [selectedChain, setSelectedChain] = useState<string>("yellowstone");

  // Load balance when PKP changes or chain changes
  useEffect(() => {
    if (selectedPkp) {
      loadBalance();
    }
  }, [selectedPkp, selectedChain]);

  // Sync selectedPkp with user.pkpInfo when user changes
  useEffect(() => {
    console.log("ProtectedApp: user.pkpInfo:", user?.pkpInfo);

    if (user?.pkpInfo) {
      // Map the user's PKP info to our expected format
      const mappedPkp = {
        tokenId: user.pkpInfo.tokenId || "unknown",
        publicKey: user.pkpInfo.pubkey || user.pkpInfo.publicKey || "",
        ethAddress: user.pkpInfo.ethAddress || "",
      };
      console.log("ProtectedApp: mappedPkp:", mappedPkp);
      setSelectedPkp(mappedPkp);
    } else {
      setSelectedPkp(null);
    }
  }, [user?.pkpInfo]);

  // Set default recipient address to PKP's own address
  useEffect(() => {
    if (selectedPkp?.ethAddress && selectedPkp.ethAddress !== "N/A") {
      setRecipientAddress(selectedPkp.ethAddress);
    }
  }, [selectedPkp?.ethAddress]);

  const loadBalance = async () => {
    if (!selectedPkp?.ethAddress || !services?.litClient) return;

    setIsLoadingBalance(true);
    try {
      // Use viem to get balance
      const { createPublicClient, http } = await import("viem");

      // Get the selected chain configuration
      const chainInfo =
        SUPPORTED_CHAINS[selectedChain as keyof typeof SUPPORTED_CHAINS];

      // Create a custom chain config for viem
      const chainConfig = {
        id: chainInfo.id,
        name: chainInfo.name,
        network: chainInfo.litIdentifier,
        nativeCurrency: {
          name: chainInfo.name,
          symbol: chainInfo.symbol,
          decimals: 18,
        },
        rpcUrls: {
          default: {
            http: [chainInfo.rpcUrl],
          },
          public: {
            http: [chainInfo.rpcUrl],
          },
        },
        blockExplorers: {
          default: {
            name: `${chainInfo.name} Explorer`,
            url: chainInfo.explorerUrl,
          },
        },
      };

      const client = createPublicClient({
        chain: chainConfig,
        transport: http(chainInfo.rpcUrl),
      });

      const balance = await client.getBalance({
        address: selectedPkp.ethAddress as `0x${string}`,
      });

      setBalance({
        balance: (Number(balance) / 1e18).toFixed(6), // Convert from wei to ETH
        symbol: chainInfo.symbol,
        chainId: chainInfo.id,
      });
    } catch (error) {
      console.error("Failed to load balance:", error);
      setBalance(null);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handlePkpSelected = (pkpInfo: PkpInfo) => {
    setSelectedPkp(pkpInfo);
    setShowPkpModal(false);
  };

  const formatAddress = (address: string) => {
    if (!address) return "N/A";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatPublicKey = (pubKey: string) => {
    if (!pubKey) return "N/A";
    // return pubKey;
    return `${pubKey.slice(0, 30)}...${pubKey.slice(-30)}`;
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  // Sign a message with PKP
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

  // Encrypt data
  const encryptData = async () => {
    if (
      !services?.litClient ||
      !messageToEncrypt.trim() ||
      !user?.authContext
    ) {
      setStatus("No Lit client, message to encrypt, or auth context");
      return;
    }

    setIsEncrypting(true);
    setStatus("Encrypting data...");
    try {
      const { createAccBuilder } = await import(
        "@lit-protocol/access-control-conditions"
      );

      // Get the actual PKP address from the viem account
      const chainConfig = services.litClient.getChainConfig().viemConfig;
      const pkpViemAccount = await services.litClient.getPkpViemAccount({
        pkpPublicKey: selectedPkp?.publicKey || user?.pkpInfo?.pubkey,
        authContext: user.authContext,
        chainConfig: chainConfig,
      });

      // Create access control conditions using the basic pattern
      const builder = createAccBuilder();
      const accs = builder
        .requireWalletOwnership(pkpViemAccount.address)
        .on("ethereum")
        // .and()
        // .requireEthBalance("0", ">=")
        // .on("yellowstone")
        .build();

      console.log("accs:", accs);

      const encrypted = await services!.litClient.encrypt({
        dataToEncrypt: messageToEncrypt,
        unifiedAccessControlConditions: accs,
        chain: "ethereum",
      });

      console.log("encrypted:", encrypted);

      setEncryptedData({
        ...encrypted,
        originalMessage: messageToEncrypt,
        pkpAddress: pkpViemAccount.address, // Store the PKP address used
        timestamp: new Date().toISOString(),
      });
      setStatus("Data encrypted successfully!");
    } catch (error: any) {
      console.error("Failed to encrypt data:", error);
      setStatus(`Failed to encrypt data: ${error.message || error}`);
    } finally {
      setIsEncrypting(false);
    }
  };

  // Decrypt data
  const decryptData = async () => {
    if (!user?.authData || !encryptedData || !services?.litClient) {
      setStatus("No auth data, encrypted data, or Lit client");
      return;
    }

    setIsDecrypting(true);
    setStatus("Creating auth context for decryption...");
    try {
      const { createAccBuilder } = await import(
        "@lit-protocol/access-control-conditions"
      );

      // Use the same PKP address that was used for encryption
      const pkpAddress = encryptedData.pkpAddress || selectedPkp?.ethAddress;
      if (!pkpAddress) {
        throw new Error("Cannot determine PKP address for decryption");
      }

      // Create the same access control conditions as used in encryption
      const builder = createAccBuilder();
      const accs = builder
        .requireWalletOwnership(pkpAddress)
        .on("ethereum")
        // .and()
        // .requireEthBalance("0", ">=")
        // .on("yellowstone")
        .build();

      console.log("Decryption accs:", accs);

      // Create a new authContext specifically for decryption with proper capabilities
      setStatus("Creating auth context with decryption capabilities...");
      const decryptionAuthContext =
        await services.authManager.createPkpAuthContext({
          authData: user.authData,
          pkpPublicKey: selectedPkp?.publicKey || user?.pkpInfo?.pubkey,
          authConfig: {
            capabilityAuthSigs: [],
            expiration: new Date(
              Date.now() + 1000 * 60 * 60 * 24
            ).toISOString(),
            statement: "",
            domain: "",
            resources: [
              ["pkp-signing", "*"],
              ["lit-action-execution", "*"],
              ["access-control-condition-decryption", "*"],
            ],
          },
          litClient: services.litClient,
        });

      setStatus("Decrypting data...");
      const decrypted = await services!.litClient.decrypt({
        data: encryptedData,
        unifiedAccessControlConditions: accs,
        authContext: decryptionAuthContext,
        chain: "ethereum",
      });

      const decryptedText =
        decrypted.convertedData ||
        decrypted.plaintext ||
        decrypted.decryptedData ||
        decrypted.data;
      setDecryptedMessage(decryptedText);
      setStatus("Data decrypted successfully!");
    } catch (error: any) {
      console.error("Failed to decrypt data:", error);
      setStatus(`Failed to decrypt data: ${error.message || error}`);
    } finally {
      setIsDecrypting(false);
    }
  };

  // Execute Lit Action
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

  // Sign message with PKP Viem Account
  const signWithViemAccount = async () => {
    if (
      !user?.authContext ||
      !viemAccountMessage.trim() ||
      !services?.litClient
    ) {
      setStatus("No auth context, message to sign, or Lit client");
      return;
    }

    setIsSigningViem(true);
    setStatus("Signing with PKP Viem Account...");
    try {
      // Get chain config from litClient
      const chainConfig = services.litClient.getChainConfig().viemConfig;

      // Get PKP as a viem account
      const pkpViemAccount = await services.litClient.getPkpViemAccount({
        pkpPublicKey: selectedPkp?.publicKey || user?.pkpInfo?.pubkey,
        authContext: user.authContext,
        chainConfig: chainConfig,
      });

      // Sign the message
      const signature = await pkpViemAccount.signMessage({
        message: viemAccountMessage,
      });

      setViemSignature({
        message: viemAccountMessage,
        signature,
        address: pkpViemAccount.address,
        timestamp: new Date().toISOString(),
      });
      setStatus("Message signed with PKP Viem Account!");
    } catch (error: any) {
      console.error("Failed to sign with viem account:", error);
      setStatus(`Failed to sign with viem account: ${error.message || error}`);
    } finally {
      setIsSigningViem(false);
    }
  };

  // Send transaction with PKP
  const sendTransaction = async () => {
    if (
      !user?.authContext ||
      !recipientAddress ||
      !sendAmount ||
      !services?.litClient
    ) {
      setStatus(
        "Missing auth context, recipient address, amount, or Lit client"
      );
      return;
    }

    setIsSendingTransaction(true);
    setStatus("Preparing and sending transaction...");
    try {
      // Get the selected chain configuration
      const chainInfo =
        SUPPORTED_CHAINS[selectedChain as keyof typeof SUPPORTED_CHAINS];

      // Create a custom chain config for viem
      const chainConfig = {
        id: chainInfo.id,
        name: chainInfo.name,
        network: chainInfo.litIdentifier,
        nativeCurrency: {
          name: chainInfo.name,
          symbol: chainInfo.symbol,
          decimals: 18,
        },
        rpcUrls: {
          default: {
            http: [chainInfo.rpcUrl],
          },
          public: {
            http: [chainInfo.rpcUrl],
          },
        },
        blockExplorers: {
          default: {
            name: `${chainInfo.name} Explorer`,
            url: chainInfo.explorerUrl,
          },
        },
      };

      // Get PKP as a viem account
      const pkpViemAccount = await services.litClient.getPkpViemAccount({
        pkpPublicKey: selectedPkp?.publicKey || user?.pkpInfo?.pubkey,
        authContext: user.authContext,
        chainConfig: chainConfig,
      });

      // Create wallet client with PKP account
      const { createWalletClient, http, parseEther } = await import("viem");

      const walletClient = createWalletClient({
        account: pkpViemAccount,
        chain: chainConfig,
        transport: http(chainInfo.rpcUrl),
      });

      // Send the transaction
      const hash = await walletClient.sendTransaction({
        account: pkpViemAccount,
        chain: chainConfig,
        to: recipientAddress as `0x${string}`,
        value: parseEther(sendAmount),
      });

      setTransactionResult({
        hash,
        to: recipientAddress,
        value: sendAmount,
        from: pkpViemAccount.address,
        timestamp: new Date().toISOString(),
        chainId: chainInfo.id,
        chainName: chainInfo.name,
        explorerUrl: chainInfo.explorerUrl,
      });
      setStatus("Transaction sent successfully!");

      // Reload balance after transaction
      setTimeout(loadBalance, 2000);
    } catch (error: any) {
      console.error("Failed to send transaction:", error);
      setStatus(`Failed to send transaction: ${error.message || error}`);
    } finally {
      setIsSendingTransaction(false);
    }
  };

  if (!user) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Not authenticated</h2>
        <p>Please sign in to continue.</p>
        <button
          onClick={initiateAuthentication}
          style={{
            padding: "12px 24px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            marginTop: "20px",
          }}
        >
          Sign In
        </button>
      </div>
    );
  }

  // Show loading state while services are initializing
  if (user && !isServicesReady) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div
          style={{
            display: "inline-block",
            width: "40px",
            height: "40px",
            border: "4px solid #e3e3e3",
            borderTop: "4px solid #007bff",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            marginBottom: "20px",
          }}
        />
        <h2 style={{ color: "#333", marginBottom: "10px" }}>
          Initialising Lit Protocol Services
        </h2>
        <p style={{ color: "#666" }}>
          {isInitializingServices
            ? "Setting up your authentication context..."
            : "Loading your PKP wallet..."}
        </p>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      {/* Welcome Banner */}
      <div
        style={{
          marginBottom: "24px",
          padding: "20px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "12px",
          color: "white",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
        <h1
          style={{
            margin: "0 0 8px 0",
            fontSize: "24px",
            fontWeight: "700",
            color: "white",
          }}
        >
          You've successfully authenticated via {/* make it all uppercase */}
          <strong
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              fontSize: "24px",
              borderBottom: "2px solid white",
            }}
          >
            {user.method}
          </strong>{" "}
          and selected your PKP wallet!
        </h1>
      </div>

      {/* Header with PKP info and controls */}
      <div
        style={{
          marginBottom: "30px",
          padding: "24px",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "20px",
          }}
        >
          <div>
            <h2
              style={{
                margin: "0 0 8px 0",
                color: "#111827",
                fontSize: "20px",
                fontWeight: "600",
              }}
            >
              🔐 Your PKP Wallet Dashboard
            </h2>
            <p
              style={{
                margin: 0,
                color: "#6b7280",
                fontSize: "14px",
                lineHeight: "1.4",
              }}
            >
              Authenticated via{" "}
              <span
                style={{
                  backgroundColor: "#e0f2fe",
                  color: "#0284c7",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "500",
                }}
              >
                {user.method}
              </span>
            </p>
          </div>
          <button
            onClick={logout}
            style={{
              padding: "8px 16px",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#dc2626";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ef4444";
            }}
          >
            🚪 Logout
          </button>
        </div>

        {/* PKP Information Card */}
        {selectedPkp && (
          <div
            style={{
              padding: "16px",
              backgroundColor: "white",
              borderRadius: "6px",
              border: "1px solid #dee2e6",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <h4 style={{ margin: 0, color: "#495057", fontSize: "14px" }}>
                Selected PKP Wallet
              </h4>
              <button
                onClick={() => setShowPkpModal(true)}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "11px",
                }}
              >
                Change PKP
              </button>
            </div>

            {/* Chain Selector */}
            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#374151",
                }}
              >
                🔗 Network:
              </label>
              <select
                value={selectedChain}
                onChange={(e) => setSelectedChain(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "11px",
                  color: "black",
                  backgroundColor: "white",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                {Object.entries(SUPPORTED_CHAINS).map(([key, chain]) => (
                  <option key={key} value={key}>
                    {chain.name} ({chain.symbol})
                    {chain.testnet ? " - Testnet" : ""}
                  </option>
                ))}
              </select>
              <div
                style={{
                  fontSize: "10px",
                  color: "#6b7280",
                  marginTop: "4px",
                  lineHeight: "1.3",
                }}
              >
                💡 Switch networks to check balances and send transactions on
                different chains.
                {SUPPORTED_CHAINS[
                  selectedChain as keyof typeof SUPPORTED_CHAINS
                ]?.testnet && (
                  <span style={{ color: "#f59e0b" }}> This is a testnet.</span>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gap: "8px", fontSize: "11px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "90px 1fr",
                  gap: "8px",
                  alignItems: "center",
                }}
              >
                <strong>Token ID:</strong>
                <span
                  style={{
                    fontFamily: "monospace",
                    cursor: "pointer",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    backgroundColor:
                      copiedField === "tokenId" ? "#dcfce7" : "#f8f9fa",
                    border:
                      "1px solid " +
                      (copiedField === "tokenId" ? "#bbf7d0" : "#e9ecef"),
                    transition: "all 0.2s",
                    display: "inline-block",
                  }}
                  onClick={() =>
                    copyToClipboard(selectedPkp.tokenId || "", "tokenId")
                  }
                  title="Click to copy Token ID"
                >
                  {copiedField === "tokenId"
                    ? "✅ Copied!"
                    : selectedPkp.tokenId || "N/A"}
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "90px 1fr",
                  gap: "8px",
                  alignItems: "center",
                }}
              >
                <strong>ETH Address:</strong>
                <span
                  style={{
                    fontFamily: "monospace",
                    cursor: "pointer",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    backgroundColor:
                      copiedField === "ethAddress" ? "#dcfce7" : "#f8f9fa",
                    border:
                      "1px solid " +
                      (copiedField === "ethAddress" ? "#bbf7d0" : "#e9ecef"),
                    transition: "all 0.2s",
                    display: "inline-block",
                  }}
                  onClick={() =>
                    copyToClipboard(selectedPkp.ethAddress || "", "ethAddress")
                  }
                  title="Click to copy ETH Address"
                >
                  {copiedField === "ethAddress"
                    ? "✅ Copied!"
                    : selectedPkp.ethAddress || "N/A"}
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "90px 1fr",
                  gap: "8px",
                  alignItems: "center",
                }}
              >
                <strong>Public Key:</strong>
                <span
                  style={{
                    fontFamily: "monospace",
                    cursor: "pointer",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    backgroundColor:
                      copiedField === "publicKey" ? "#dcfce7" : "#f8f9fa",
                    border:
                      "1px solid " +
                      (copiedField === "publicKey" ? "#bbf7d0" : "#e9ecef"),
                    transition: "all 0.2s",
                    display: "inline-block",
                  }}
                  onClick={() =>
                    copyToClipboard(
                      selectedPkp.publicKey || selectedPkp.pubkey || "",
                      "publicKey"
                    )
                  }
                  title="Click to copy Public Key (full value)"
                >
                  {copiedField === "publicKey"
                    ? "✅ Copied!"
                    : formatPublicKey(
                        selectedPkp.publicKey || selectedPkp.pubkey
                      )}
                </span>
              </div>
              {balance && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "90px 1fr",
                    gap: "8px",
                    alignItems: "center",
                  }}
                >
                  <strong>Balance:</strong>
                  <div>
                    <span style={{ fontFamily: "monospace", color: "#28a745" }}>
                      {balance.balance} {balance.symbol}
                    </span>{" "}
                    <span style={{ color: "#6c757d" }}>
                      (Chain ID: {balance.chainId})
                    </span>
                  </div>
                </div>
              )}
              {isLoadingBalance && (
                <div style={{ color: "#6c757d" }}>Loading balance...</div>
              )}

              {/* Faucet Information */}
              {(balance && parseFloat(balance.balance) < 0.001) ||
              SUPPORTED_CHAINS[selectedChain as keyof typeof SUPPORTED_CHAINS]
                ?.testnet ? (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "8px 12px",
                    backgroundColor: "#e0f2fe",
                    border: "1px solid #0284c7",
                    borderRadius: "6px",
                    fontSize: "12px",
                    color: "#0284c7",
                  }}
                >
                  💰 <strong>Need tokens?</strong> Visit the{" "}
                  <a
                    href="https://chronicle-yellowstone-faucet.getlit.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#0284c7",
                      textDecoration: "underline",
                      fontWeight: "500",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#0369a1";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#0284c7";
                    }}
                  >
                    Chronicle Yellowstone Faucet
                  </a>{" "}
                  to request free test tokens.
                </div>
              ) : null}
            </div>
          </div>
        )}

        {!selectedPkp && (
          <div
            style={{
              padding: "16px",
              backgroundColor: "#fff3cd",
              border: "1px solid #ffeaa7",
              borderRadius: "6px",
              marginBottom: "16px",
            }}
          >
            <div style={{ color: "#856404", fontSize: "14px" }}>
              No PKP selected. Click below to select a PKP wallet.
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      {status && (
        <div
          style={{
            marginBottom: "20px",
            padding: "12px 16px",
            backgroundColor: "#f8f9fa",
            border: "1px solid #dee2e6",
            borderRadius: "8px",
            fontSize: "14px",
            fontFamily: "monospace",
          }}
        >
          {status}
        </div>
      )}

      {/* Main content - Demo Functions */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        {/* Sign Message */}
        <div
          style={{
            padding: "20px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          }}
        >
          <h3 style={{ margin: "0 0 16px 0", color: "#1f2937" }}>
            ✍️ Sign Message
          </h3>
          <p
            style={{ margin: "0 0 16px 0", color: "#6b7280", fontSize: "14px" }}
          >
            Sign a message using your PKP wallet.
          </p>

          <textarea
            value={messageToSign}
            onChange={(e) => setMessageToSign(e.target.value)}
            placeholder="Enter message to sign..."
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
              backgroundColor: "#ffffff",
            }}
          />

          <button
            onClick={signMessage}
            disabled={isSigningMessage || !messageToSign.trim()}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: isSigningMessage ? "#9ca3af" : "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: isSigningMessage ? "not-allowed" : "pointer",
            }}
          >
            {isSigningMessage ? "Signing..." : "Sign Message"}
          </button>

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
              <div
                style={{
                  fontSize: "12px",
                  fontFamily: "monospace",
                  wordBreak: "break-all",
                }}
              >
                <strong>Signature:</strong>{" "}
                {signedMessage.signature?.slice(0, 40)}...
              </div>
            </div>
          )}
        </div>

        {/* Encrypt/Decrypt */}
        <div
          style={{
            padding: "20px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          }}
        >
          <h3 style={{ margin: "0 0 16px 0", color: "#1f2937" }}>
            🔐 Encrypt & Decrypt
          </h3>
          <p
            style={{ margin: "0 0 16px 0", color: "#6b7280", fontSize: "14px" }}
          >
            Encrypt data that only your PKP can decrypt.
          </p>

          <textarea
            value={messageToEncrypt}
            onChange={(e) => setMessageToEncrypt(e.target.value)}
            placeholder="Enter message to encrypt..."
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
              backgroundColor: "#ffffff",
            }}
          />

          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <button
              onClick={encryptData}
              disabled={isEncrypting || !messageToEncrypt.trim()}
              style={{
                flex: 1,
                padding: "12px",
                backgroundColor: isEncrypting ? "#9ca3af" : "#7c3aed",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: isEncrypting ? "not-allowed" : "pointer",
              }}
            >
              {isEncrypting ? "Encrypting..." : "Encrypt"}
            </button>

            <button
              onClick={decryptData}
              disabled={isDecrypting || !encryptedData}
              style={{
                flex: 1,
                padding: "12px",
                backgroundColor: isDecrypting ? "#9ca3af" : "#059669",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor:
                  isDecrypting || !encryptedData ? "not-allowed" : "pointer",
              }}
            >
              {isDecrypting ? "Decrypting..." : "Decrypt"}
            </button>
          </div>

          {encryptedData && (
            <div
              style={{
                marginBottom: "12px",
                padding: "12px",
                backgroundColor: "#fef3c7",
                border: "1px solid #fbbf24",
                borderRadius: "8px",
              }}
            >
              <h4
                style={{
                  margin: "0 0 8px 0",
                  color: "#92400e",
                  fontSize: "14px",
                }}
              >
                🔒 Data Encrypted
              </h4>
              <div
                style={{
                  fontSize: "12px",
                  color: "#92400e",
                  marginBottom: "8px",
                }}
              >
                Encrypted at:{" "}
                {new Date(encryptedData.timestamp).toLocaleString()}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  fontFamily: "monospace",
                  color: "#92400e",
                  backgroundColor: "#fef8e1",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #f59e0b",
                  wordBreak: "break-all",
                  maxHeight: "120px",
                  overflow: "auto",
                }}
              >
                <div style={{ marginBottom: "6px" }}>
                  <strong>Ciphertext:</strong>{" "}
                  {encryptedData.ciphertext || "N/A"}
                </div>
                <div style={{ marginBottom: "6px" }}>
                  <strong>Data Hash:</strong>{" "}
                  {encryptedData.dataToEncryptHash || "N/A"}
                </div>
                {encryptedData.originalMessage && (
                  <div style={{ marginBottom: "6px" }}>
                    <strong>Original:</strong> "{encryptedData.originalMessage}"
                  </div>
                )}
                {encryptedData.pkpAddress && (
                  <div>
                    <strong>PKP Address:</strong> {encryptedData.pkpAddress}
                  </div>
                )}
              </div>
            </div>
          )}

          {decryptedMessage && (
            <div
              style={{
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
                🔓 Decrypted Message
              </h4>
              <div
                style={{
                  fontSize: "14px",
                  color: "#15803d",
                  fontStyle: "italic",
                }}
              >
                "{decryptedMessage}"
              </div>
            </div>
          )}
        </div>

        {/* Execute Lit Action */}
        <div
          style={{
            padding: "20px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          }}
        >
          <h3 style={{ margin: "0 0 16px 0", color: "#1f2937" }}>
            ⚡ Execute Lit Action
          </h3>
          <p
            style={{ margin: "0 0 16px 0", color: "#6b7280", fontSize: "14px" }}
          >
            Run custom JavaScript code with your PKP.
          </p>

          <div
            style={{
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              overflow: "hidden",
              marginBottom: "12px",
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
              }}
              height="200px"
              width="100%"
            />
          </div>

          <button
            onClick={executeLitAction}
            disabled={isExecutingAction || !litActionCode.trim()}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: isExecutingAction ? "#9ca3af" : "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: isExecutingAction ? "not-allowed" : "pointer",
            }}
          >
            {isExecutingAction ? "Executing..." : "Execute Lit Action"}
          </button>

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
              <pre
                style={{
                  fontSize: "11px",
                  fontFamily: "monospace",
                  color: "#15803d",
                  overflow: "auto",
                  maxHeight: "100px",
                  margin: 0,
                }}
              >
                {JSON.stringify(litActionResult.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* PKP Integrations Section */}
      <div style={{ marginBottom: "30px" }}>
        <div
          style={{
            marginBottom: "20px",
            padding: "16px 20px",
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            borderRadius: "12px",
            color: "white",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              margin: "0 0 8px 0",
              fontSize: "20px",
              fontWeight: "700",
            }}
          >
            🔧 PKP Viem Integrations
          </h2>
          <p
            style={{
              margin: "0",
              fontSize: "14px",
              opacity: 0.9,
              lineHeight: "1.4",
            }}
          >
            Explore how PKPs integrate with popular web3 libraries like Viem for
            enhanced functionality.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: "20px",
          }}
        >
          {/* PKP Viem Account Signing */}
          <div
            style={{
              padding: "20px",
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                padding: "4px 8px",
                backgroundColor: "#f59e0b",
                color: "white",
                borderRadius: "12px",
                fontSize: "10px",
                fontWeight: "600",
                textTransform: "uppercase",
              }}
            >
              Viem Integration
            </div>
            <h3 style={{ margin: "0 0 16px 0", color: "#1f2937" }}>
              🔑 PKP Viem Account
            </h3>
            <p
              style={{
                margin: "0 0 16px 0",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              Sign messages using PKP as a viem account (replaces PKPEthers).
            </p>

            <input
              type="text"
              value={viemAccountMessage}
              onChange={(e) => setViemAccountMessage(e.target.value)}
              placeholder="Enter message to sign..."
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                marginBottom: "12px",
                color: "#374151",
                backgroundColor: "#ffffff",
              }}
            />

            <button
              onClick={signWithViemAccount}
              disabled={isSigningViem || !viemAccountMessage.trim()}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: isSigningViem ? "#9ca3af" : "#7c3aed",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: isSigningViem ? "not-allowed" : "pointer",
              }}
            >
              {isSigningViem ? "Signing..." : "Sign with Viem Account"}
            </button>

            {viemSignature && (
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
                  ✅ Viem Signature
                </h4>
                <div
                  style={{
                    fontSize: "12px",
                    fontFamily: "monospace",
                    wordBreak: "break-all",
                  }}
                >
                  <strong>Address:</strong> {viemSignature.address}
                  <br />
                  <strong>Signature:</strong>{" "}
                  {viemSignature.signature?.slice(0, 40)}...
                </div>
              </div>
            )}
          </div>

          {/* Send Transaction */}
          <div
            style={{
              padding: "20px",
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                padding: "4px 8px",
                backgroundColor: "#f59e0b",
                color: "white",
                borderRadius: "12px",
                fontSize: "10px",
                fontWeight: "600",
                textTransform: "uppercase",
              }}
            >
              Viem Integration
            </div>
            <h3 style={{ margin: "0 0 16px 0", color: "#1f2937" }}>
              💸 Send Transaction
            </h3>
            <p
              style={{
                margin: "0 0 16px 0",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              Send ETH using your PKP wallet via Viem (replaces PKPEthers).
            </p>

            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="Recipient address (0x...)"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                fontFamily: "monospace",
                marginBottom: "12px",
                color: "#374151",
                backgroundColor: "#ffffff",
              }}
            />

            <input
              type="number"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              placeholder="Amount in ETH"
              step="0.001"
              min="0"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                marginBottom: "12px",
                color: "#374151",
                backgroundColor: "#ffffff",
              }}
            />

            <button
              onClick={sendTransaction}
              disabled={
                isSendingTransaction || !recipientAddress || !sendAmount
              }
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: isSendingTransaction ? "#9ca3af" : "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor:
                  isSendingTransaction || !recipientAddress || !sendAmount
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {isSendingTransaction ? "Sending..." : "Send Transaction"}
            </button>

            {transactionResult && (
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
                  ✅ Transaction Sent
                </h4>
                <div
                  style={{
                    fontSize: "11px",
                    fontFamily: "monospace",
                    wordBreak: "break-all",
                    color: "#15803d",
                  }}
                >
                  <div style={{ marginBottom: "4px" }}>
                    <strong>Hash:</strong>{" "}
                    <a
                      href={`${
                        transactionResult.explorerUrl ||
                        "https://yellowstone-explorer.litprotocol.com"
                      }/tx/${transactionResult.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#1d4ed8",
                        textDecoration: "underline",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#2563eb";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#1d4ed8";
                      }}
                    >
                      {transactionResult.hash}
                    </a>
                  </div>
                  <div style={{ marginBottom: "4px" }}>
                    <strong>Network:</strong>{" "}
                    {transactionResult.chainName || "Unknown"}
                    {transactionResult.chainId &&
                      ` (ID: ${transactionResult.chainId})`}
                  </div>
                  <div style={{ marginBottom: "4px" }}>
                    <strong>To:</strong> {transactionResult.to}
                  </div>
                  <div>
                    <strong>Value:</strong> {transactionResult.value}{" "}
                    {SUPPORTED_CHAINS[
                      selectedChain as keyof typeof SUPPORTED_CHAINS
                    ]?.symbol || "ETH"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PKP Selection Modal */}
      {showPkpModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPkpModal(false);
            }
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "28px",
              maxWidth: "48rem",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              border: "1px solid #e5e7eb",
            }}
          >
            {/* Modal Header */}
            <div style={{ marginBottom: "20px" }}>
              <button
                onClick={() => setShowPkpModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6b7280",
                  fontSize: "13px",
                  cursor: "pointer",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                  e.currentTarget.style.color = "#374151";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#6b7280";
                }}
              >
                ← Close
              </button>

              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#f0f9ff",
                  borderRadius: "8px",
                  border: "1px solid #bfdbfe",
                  marginBottom: "16px",
                }}
              >
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#1e40af",
                    margin: "0 0 8px 0",
                  }}
                >
                  🔄 Switch PKP Wallet
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#1e40af",
                    margin: "0",
                    lineHeight: "1.4",
                  }}
                >
                  Select a different PKP wallet from your available options.
                </p>
              </div>
            </div>

            {/* PKP Selection Component */}
            <PkpSelectionForDemo
              authData={user.authData}
              onPkpSelected={(pkpInfo) => {
                handlePkpSelected(pkpInfo);
                setShowPkpModal(false);
              }}
              authMethodName={user.method}
              services={services}
              disabled={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}
