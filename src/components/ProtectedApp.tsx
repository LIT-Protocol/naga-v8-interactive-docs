import Editor from "@monaco-editor/react";
import bs58 from "bs58";
import { useEffect, useState } from "react";
import { useLitAuth } from "../contexts/LitAuthProvider";
import PkpSelectionForDemo from "./common/PkpSelectionForDemo";
import { PaymentManagerOperationsDashboard } from "./protectedApp/components/payment/PaymentManagerOperationsDashboard";

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
  const latestBlockhash = await Lit.Actions.getLatestBlockhash({
    chain: "ethereum",
  });
  Lit.Actions.setResponse({
    response: JSON.stringify({ latestBlockhash }),
  });
})();`;

// Authentication method type mapping
const AUTH_METHOD_TYPE = {
  EthWallet: 1,
  LitAction: 2,
  WebAuthn: 3,
  Discord: 4,
  Google: 5,
  GoogleJwt: 6,
  AppleJwt: 8,
  StytchOtp: 9,
  StytchEmailFactorOtp: 10,
  StytchSmsFactorOtp: 11,
  StytchWhatsAppFactorOtp: 12,
  StytchTotpFactorOtp: 13,
} as const;

// Create reverse mapping for display
const getAuthMethodTypeName = (typeNumber: number): string => {
  const entry = Object.entries(AUTH_METHOD_TYPE).find(
    ([, value]) => value === typeNumber
  );
  return entry ? entry[0] : `Unknown (${typeNumber})`;
};

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

interface TransactionToast {
  id: string;
  message: string;
  txHash: string;
  type: 'success' | 'error';
  timestamp: number;
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

// Helper function to convert hex to IPFS CID (for LitAction auth methods)
const hexToIpfsCid = (hex: string): string => {
  try {
    // Remove 0x prefix if present
    const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
    // Convert hex string to bytes array
    const bytes = new Uint8Array(
      cleanHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    );
    return bs58.encode(bytes);
  } catch (error) {
    console.error("Error converting hex to IPFS CID:", error);
    return hex; // Return original if conversion fails
  }
};

export const SCOPE_VALUES = [
  "no-permissions",
  "sign-anything",
  "personal-sign",
] as const;

// Utility functions
const formatTxHash = (hash: string) => {
  if (!hash) return "";
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
};

const formatAddress = (address: string) => {
  if (!address) return "N/A";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatPublicKey = (pubKey: string) => {
  if (!pubKey) return "N/A";
  return `${pubKey.slice(0, 30)}...${pubKey.slice(-30)}`;
};

const decodeScopeValues = (scopes: any) => {
  if (!scopes || typeof scopes !== "object") return scopes;

  if (Array.isArray(scopes)) {
    return scopes.map((scope: any) => {
      if (
        typeof scope === "number" &&
        scope >= 0 &&
        scope < SCOPE_VALUES.length
      ) {
        return `${scope} (${SCOPE_VALUES[scope]})`;
      }
      return scope;
    });
  }

  const decoded = { ...scopes };
  for (const [key, value] of Object.entries(decoded)) {
    if (Array.isArray(value)) {
      decoded[key] = value.map((item: any) => {
        if (
          typeof item === "number" &&
          item >= 0 &&
          item < SCOPE_VALUES.length
        ) {
          return `${item} (${SCOPE_VALUES[item]})`;
        }
        return item;
      });
    }
  }

  return decoded;
};

// Available scopes configuration
const AVAILABLE_SCOPES = [
  {
    id: "sign-anything",
    label: "Sign Anything",
    description: "Allow signing any message or transaction",
  },
  {
    id: "personal-sign",
    label: "Personal Sign",
    description: "Allow personal message signing only",
  },
];

// Reusable Components
const LoadingSpinner = ({ size = 16 }: { size?: number }) => (
  <div
    style={{
      width: `${size}px`,
      height: `${size}px`,
      border: "2px solid #ffffff",
      borderTop: "2px solid transparent",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
    }}
  />
);

const RemoveButton = ({
  onRemove,
  isRemoving,
  itemId,
}: {
  onRemove: () => void;
  isRemoving: boolean;
  itemId: string;
}) => (
  <button
    onClick={onRemove}
    disabled={isRemoving}
    style={{
      padding: "4px 8px",
      backgroundColor: isRemoving ? "#9ca3af" : "#ef4444",
      color: "white",
      border: "none",
      borderRadius: "4px",
      fontSize: "11px",
      cursor: isRemoving ? "not-allowed" : "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "4px",
      minWidth: "70px",
    }}
  >
    {isRemoving ? (
      <>
        <LoadingSpinner size={10} />
        Removing...
      </>
    ) : (
      "Remove"
    )}
  </button>
);

const ScopeCheckboxes = ({
  availableScopes,
  selectedScopes,
  onScopeChange,
}: {
  availableScopes: typeof AVAILABLE_SCOPES;
  selectedScopes: string[];
  onScopeChange: (scopes: string[]) => void;
}) => (
  <div style={{ marginBottom: "16px" }}>
    <label
      style={{
        display: "block",
        marginBottom: "8px",
        fontSize: "14px",
        fontWeight: "500",
        color: "#374151",
      }}
    >
      🎯 Scopes (select permissions):
    </label>
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {availableScopes.map((scope) => (
        <label
          key={scope.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 12px",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            backgroundColor: selectedScopes.includes(scope.id)
              ? "#eff6ff"
              : "#ffffff",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          <input
            type="checkbox"
            checked={selectedScopes.includes(scope.id)}
            onChange={(e) => {
              if (e.target.checked) {
                onScopeChange([...selectedScopes, scope.id]);
              } else {
                onScopeChange(selectedScopes.filter((s) => s !== scope.id));
              }
            }}
            style={{
              width: "16px",
              height: "16px",
              cursor: "pointer",
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: "13px",
                fontWeight: "500",
                color: "#374151",
              }}
            >
              {scope.label}
            </div>
            <div style={{ fontSize: "11px", color: "#6b7280" }}>
              {scope.description}
            </div>
          </div>
        </label>
      ))}
    </div>
  </div>
);

// Transaction Toast Component
const TransactionToastContainer = ({ toasts, onRemoveToast }: {
  toasts: TransactionToast[];
  onRemoveToast: (id: string) => void;
}) => (
  <div
    style={{
      position: "fixed",
      top: "20px",
      right: "20px",
      zIndex: 10000,
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      maxWidth: "400px",
    }}
  >
    {toasts.map((toast) => (
      <div
        key={toast.id}
        style={{
          background: toast.type === 'success' ? "#10b981" : "#ef4444",
          color: "white",
          padding: "12px 16px",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "500",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          animation: "slideIn 0.3s ease-out",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: "4px" }}>
            {toast.type === 'success' ? '✅' : '❌'} {toast.message}
          </div>
          <div style={{ fontSize: "11px", opacity: 0.9, fontFamily: "monospace" }}>
            <a
              href={`https://yellowstone-explorer.litprotocol.com/tx/${toast.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "white",
                textDecoration: "underline",
                opacity: 0.9,
              }}
            >
              Tx: {formatTxHash(toast.txHash)}
            </a>
          </div>
        </div>
        <button
          onClick={() => onRemoveToast(toast.id)}
          style={{
            background: "none",
            border: "none",
            color: "white",
            fontSize: "16px",
            cursor: "pointer",
            padding: "4px",
            borderRadius: "4px",
            opacity: 0.8,
          }}
        >
          ✕
        </button>
      </div>
    ))}
  </div>
);

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

  // Better PKP Permissions state management
  const [permissionsContext, setPermissionsContext] = useState<any>(null);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [permissionsError, setPermissionsError] = useState<string>("");

  // Add Permission states
  const [newActionIpfsId, setNewActionIpfsId] = useState(
    "QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB"
  );
  const [newActionSelectedScopes, setNewActionSelectedScopes] = useState<
    string[]
  >(["sign-anything"]);
  const [newPermittedAddress, setNewPermittedAddress] = useState(
    "0xef3eE1bD838aF5B36482FAe8a6Fc394C68d5Fa9F"
  );
  const [newAddressSelectedScopes, setNewAddressSelectedScopes] = useState<
    string[]
  >(["sign-anything"]);
  const [isAddingAction, setIsAddingAction] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  // Unified remove state
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  // Additional missing state variables
  const [checkActionIpfsId, setCheckActionIpfsId] = useState(
    "QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB"
  );
  const [checkPermittedAddress, setCheckPermittedAddress] = useState(
    "0xef3eE1bD838aF5B36482FAe8a6Fc394C68d5Fa9F"
  );
  const [permissionCheckResults, setPermissionCheckResults] =
    useState<any>(null);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(false);

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<"overview" | "permissions" | "payment">(
    "overview"
  );

  // Auth Method Scope states
  const [authMethodType, setAuthMethodType] = useState<string>("1"); // Default to ETH_WALLET
  const [authMethodId, setAuthMethodId] = useState<string>("");
  const [scopeId, setScopeId] = useState<string>("1"); // Default to sign-anything
  const [isAddingAuthMethodScope, setIsAddingAuthMethodScope] = useState(false);
  const [authMethodScopeStatus, setAuthMethodScopeStatus] =
    useState<string>("");

  // Check Auth Method Scopes states
  const [checkAuthMethodType, setCheckAuthMethodType] = useState<string>("1");
  const [checkAuthMethodId, setCheckAuthMethodId] = useState<string>("");
  const [authMethodScopes, setAuthMethodScopes] = useState<any>(null);
  const [isCheckingAuthMethodScopes, setIsCheckingAuthMethodScopes] =
    useState(false);

  // Transaction Toast state
  const [transactionToasts, setTransactionToasts] = useState<TransactionToast[]>([]);

  // Toast management functions
  const addTransactionToast = (message: string, txHash: string, type: 'success' | 'error' = 'success') => {
    const toast: TransactionToast = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      txHash,
      type,
      timestamp: Date.now(),
    };
    setTransactionToasts(prev => [...prev, toast]);
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
      setTransactionToasts(prev => prev.filter(t => t.id !== toast.id));
    }, 8000);
  };

  const removeTransactionToast = (id: string) => {
    setTransactionToasts(prev => prev.filter(t => t.id !== id));
  };

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

  // PKP Permissions helper functions
  const loadPermissionsContext = async () => {
    if (!user?.authContext || !selectedPkp || !services?.litClient) {
      setPermissionsError("No auth context, selected PKP, or Lit client");
      return;
    }

    setIsLoadingPermissions(true);
    setPermissionsError("");
    try {
      // Get PKP as a viem account
      const chainConfig = services.litClient.getChainConfig().viemConfig;
      const pkpViemAccount = await services.litClient.getPkpViemAccount({
        pkpPublicKey: selectedPkp.publicKey || user?.pkpInfo?.pubkey,
        authContext: user.authContext,
        chainConfig: chainConfig,
      });

      // Get PKP permissions manager
      const pkpPermissionsManager =
        await services.litClient.getPKPPermissionsManager({
          pkpIdentifier: {
            tokenId: selectedPkp.tokenId,
          },
          account: pkpViemAccount,
        });

      // Load permissions context
      const context = await pkpPermissionsManager.getPermissionsContext();
      // console.log("Permissions context:", JSON.stringify(context, replacer, 2));
      setPermissionsContext(context);

      // Only set success status if there's no current transaction status
      if (
        !status ||
        (!status.includes("Transaction:") && !status.includes("successfully!"))
      ) {
        setStatus("Permissions context loaded successfully!");
      } else {
        console.log(
          "🔒 Keeping existing transaction status, not overwriting with permissions load message"
        );
      }
    } catch (error: any) {
      console.error("Failed to load permissions context:", error);
      setPermissionsError(
        `Failed to load permissions: ${error.message || error}`
      );
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  const addPermittedAction = async () => {
    if (
      !user?.authContext ||
      !selectedPkp ||
      !services?.litClient ||
      !newActionIpfsId.trim()
    ) {
      setPermissionsError("Missing required data or IPFS ID");
      return;
    }

    setIsAddingAction(true);
    setPermissionsError("");
    console.log("🔄 Starting to add permitted action...", {
      pkpTokenId: selectedPkp.tokenId,
      ipfsId: newActionIpfsId,
      scopes: newActionSelectedScopes,
    });

    try {
      const chainConfig = services.litClient.getChainConfig().viemConfig;
      const pkpViemAccount = await services.litClient.getPkpViemAccount({
        pkpPublicKey: selectedPkp.publicKey || user?.pkpInfo?.pubkey,
        authContext: user.authContext,
        chainConfig: chainConfig,
      });

      const pkpPermissionsManager =
        await services.litClient.getPKPPermissionsManager({
          pkpIdentifier: {
            tokenId: selectedPkp.tokenId,
          },
          account: pkpViemAccount,
        });

      const result = await pkpPermissionsManager.addPermittedAction({
        ipfsId: newActionIpfsId,
        scopes: newActionSelectedScopes,
      });

      console.log("✅ Action permission added - Full result:", result);
      console.log("📋 Result structure:", {
        hash: result?.hash,
        transactionHash: result?.transactionHash,
        tx: result?.tx,
        transaction: result?.transaction,
        receipt: result?.receipt,
        txHash: result?.txHash,
        keys: Object.keys(result || {}),
      });

      // Try multiple ways to extract transaction hash
      const txHash =
        result?.hash ||
        result?.transactionHash ||
        result?.tx?.hash ||
        result?.transaction?.hash ||
        result?.receipt?.transactionHash ||
        result?.txHash ||
        (typeof result === "string" ? result : null);

      console.log("🔗 Extracted transaction hash:", txHash);

      if (txHash) {
        const explorerUrl = `https://yellowstone-explorer.litprotocol.com/tx/${txHash}`;
        console.log("🌐 Explorer URL:", explorerUrl);
        setStatus(
          `✅ Action permission added successfully! Transaction: ${txHash}`
        );
        console.log(
          "📝 Action status set to:",
          `✅ Action permission added successfully! Transaction: ${txHash}`
        );
      } else {
        console.log("⚠️ No transaction hash found in result");
        setStatus("✅ Action permission added successfully!");
        console.log(
          "📝 Action status set to:",
          "✅ Action permission added successfully!"
        );
      }
      setPermissionsError("");

      // Clear form
      setNewActionIpfsId("");
      setNewActionSelectedScopes([]);

      // Reload permissions after delay (no auto-clear of status)
      console.log("⏰ Setting timeout to reload permissions in 5 seconds...");
      setTimeout(() => {
        console.log("🔄 Reloading permissions context...");
        loadPermissionsContext();
      }, 5000);
    } catch (error: any) {
      console.error("❌ Failed to add permitted action:", error);
      console.log("📋 Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause,
      });
      if (error.message?.includes("Not PKP NFT owner")) {
        setPermissionsError(
          "❌ You don't own this PKP. Only PKP owners can modify permissions."
        );
      } else {
        setPermissionsError(
          `❌ Failed to add permitted action: ${error.message || error}`
        );
      }
    } finally {
      setIsAddingAction(false);
    }
  };

  const addPermittedAddress = async () => {
    if (
      !user?.authContext ||
      !selectedPkp ||
      !services?.litClient ||
      !newPermittedAddress.trim()
    ) {
      setPermissionsError("Missing required data or address");
      return;
    }

    setIsAddingAddress(true);
    setPermissionsError("");
    console.log("🔄 Starting to add permitted address...", {
      pkpTokenId: selectedPkp.tokenId,
      address: newPermittedAddress,
      scopes: newAddressSelectedScopes,
    });

    try {
      const chainConfig = services.litClient.getChainConfig().viemConfig;
      const pkpViemAccount = await services.litClient.getPkpViemAccount({
        pkpPublicKey: selectedPkp.publicKey || user?.pkpInfo?.pubkey,
        authContext: user.authContext,
        chainConfig: chainConfig,
      });

      const pkpPermissionsManager =
        await services.litClient.getPKPPermissionsManager({
          pkpIdentifier: {
            tokenId: selectedPkp.tokenId,
          },
          account: pkpViemAccount,
        });

      const result = await pkpPermissionsManager.addPermittedAddress({
        address: newPermittedAddress,
        scopes: newAddressSelectedScopes,
      });

      console.log("✅ Permitted address added - Full result:", result);
      console.log("📋 Result structure:", {
        hash: result?.hash,
        transactionHash: result?.transactionHash,
        tx: result?.tx,
        transaction: result?.transaction,
        receipt: result?.receipt,
        txHash: result?.txHash,
        keys: Object.keys(result || {}),
      });

      // Try multiple ways to extract transaction hash
      const txHash =
        result?.hash ||
        result?.transactionHash ||
        result?.tx?.hash ||
        result?.transaction?.hash ||
        result?.receipt?.transactionHash ||
        result?.txHash ||
        (typeof result === "string" ? result : null);

      console.log("🔗 Extracted transaction hash:", txHash);

      if (txHash) {
        const explorerUrl = `https://yellowstone-explorer.litprotocol.com/tx/${txHash}`;
        console.log("🌐 Explorer URL:", explorerUrl);
        setStatus(
          `✅ Permitted address added successfully! Transaction: ${txHash}`
        );
        console.log(
          "📝 Address status set to:",
          `✅ Permitted address added successfully! Transaction: ${txHash}`
        );
      } else {
        console.log("⚠️ No transaction hash found in result");
        setStatus("✅ Permitted address added successfully!");
        console.log(
          "📝 Address status set to:",
          "✅ Permitted address added successfully!"
        );
      }

      // Clear form
      setNewPermittedAddress("");
      setNewAddressSelectedScopes([]);

      // Reload permissions after delay (no auto-clear of status)
      console.log("⏰ Setting timeout to reload permissions in 5 seconds...");
      setTimeout(() => {
        console.log("🔄 Reloading permissions context...");
        loadPermissionsContext();
      }, 5000);
    } catch (error: any) {
      console.error("❌ Failed to add permitted address:", error);
      const errorMessage = (error as any)?.message || String(error);
      setPermissionsError(`Failed to add permitted address: ${errorMessage}`);
    } finally {
      setIsAddingAddress(false);
    }
  };

  const removePermittedAction = async (actionIpfsCid: string) => {
    if (!user?.authContext || !selectedPkp || !services?.litClient) {
      setPermissionsError("Missing required data");
      return;
    }

    const actionKey = `action:${actionIpfsCid}`;
    setRemovingItems((prev) => new Set([...prev, actionKey]));
    setPermissionsError("");

    try {
      const chainConfig = services.litClient.getChainConfig().viemConfig;
      const pkpViemAccount = await services.litClient.getPkpViemAccount({
        pkpPublicKey: selectedPkp.publicKey || user?.pkpInfo?.pubkey,
        authContext: user.authContext,
        chainConfig: chainConfig,
      });

      const pkpPermissionsManager =
        await services.litClient.getPKPPermissionsManager({
          pkpIdentifier: {
            tokenId: selectedPkp.tokenId,
          },
          account: pkpViemAccount,
        });

      const result = await pkpPermissionsManager.removePermittedAction({
        ipfsId: actionIpfsCid,
      });

      // Show success with transaction hash
      const txHash = result?.hash || result?.transactionHash || result;
      if (txHash) {
        addTransactionToast("Permitted action removed successfully!", txHash);
      } else {
        setStatus("✅ Permitted action removed successfully!");
      }

      await loadPermissionsContext(); // Reload permissions
    } catch (error: any) {
      console.error("Failed to remove permitted action:", error);
      if (error.message?.includes("Not PKP NFT owner")) {
        setPermissionsError(
          "❌ You don't own this PKP. Only PKP owners can modify permissions."
        );
      } else if (
        error.message?.includes("not found") ||
        error.message?.includes("does not exist")
      ) {
        setPermissionsError(
          `❌ Action not found. Please check the IPFS CID: ${actionIpfsCid}`
        );
      } else {
        setPermissionsError(
          `❌ Failed to remove permitted action: ${error.message || error}`
        );
      }
    } finally {
      setRemovingItems((prev) => {
        const next = new Set(prev);
        next.delete(actionKey);
        return next;
      });
    }
  };

  const removePermittedAddress = async (address: string) => {
    if (!user?.authContext || !selectedPkp || !services?.litClient) {
      setPermissionsError("Missing required data");
      return;
    }

    const key = `address:${address}`;
    setRemovingItems((prev) => new Set(prev).add(key));
    setPermissionsError("");

    try {
      const chainConfig = services.litClient.getChainConfig().viemConfig;
      const pkpViemAccount = await services.litClient.getPkpViemAccount({
        pkpPublicKey: selectedPkp.publicKey || user?.pkpInfo?.pubkey,
        authContext: user.authContext,
        chainConfig: chainConfig,
      });

      const pkpPermissionsManager =
        await services.litClient.getPKPPermissionsManager({
          pkpIdentifier: {
            tokenId: selectedPkp.tokenId,
          },
          account: pkpViemAccount,
        });

      const result = await pkpPermissionsManager.removePermittedAddress({
        address: address,
      });

      console.log("Remove permitted address result:", result);

      const txHash = result?.transactionHash || result?.hash || "Unknown";
      if (txHash && txHash !== "Unknown") {
        addTransactionToast("Address removed successfully!", txHash);
      } else {
        setStatus("✅ Address removed successfully!");
      }

      await loadPermissionsContext();
    } catch (error) {
      console.error("Failed to remove permitted address:", error);
      const errorMessage = (error as any)?.message || String(error);
      setPermissionsError(`Failed to remove address: ${errorMessage}`);
    } finally {
      setRemovingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  const removePermittedAuthMethod = async (
    authMethodType: number,
    authMethodId: string
  ) => {
    if (!user?.authContext || !selectedPkp || !services?.litClient) {
      setPermissionsError("Missing required data");
      return;
    }

    // Create unique key for tracking removal state
    const authMethodKey = `${authMethodType}:${authMethodId}`;

    // Add auth method to removing set
    setRemovingItems((prev) => new Set([...prev, authMethodKey]));
    setPermissionsError("");

    try {
      const chainConfig = services.litClient.getChainConfig().viemConfig;
      const pkpViemAccount = await services.litClient.getPkpViemAccount({
        pkpPublicKey: selectedPkp.publicKey || user?.pkpInfo?.pubkey,
        authContext: user.authContext,
        chainConfig: chainConfig,
      });

      const pkpPermissionsManager =
        await services.litClient.getPKPPermissionsManager({
          pkpIdentifier: {
            tokenId: selectedPkp.tokenId,
          },
          account: pkpViemAccount,
        });

      const result = await pkpPermissionsManager.removePermittedAuthMethod({
        authMethodType: authMethodType,
        authMethodId: authMethodId,
      });

      // Show success with transaction hash
      const txHash = result?.hash || result?.transactionHash || result;
      if (txHash) {
        setStatus(
          `✅ Auth method removed successfully! Transaction: ${txHash}`
        );
      } else {
        setStatus("✅ Auth method removed successfully!");
      }

      await loadPermissionsContext(); // Reload permissions
    } catch (error: any) {
      console.error("Failed to remove auth method:", error);
      if (error.message?.includes("Not PKP NFT owner")) {
        setPermissionsError(
          "❌ You don't own this PKP. Only PKP owners can modify permissions."
        );
      } else {
        setPermissionsError(
          `❌ Failed to remove auth method: ${error.message || error}`
        );
      }
    } finally {
      // Remove auth method from removing set
      setRemovingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(authMethodKey);
        return newSet;
      });
    }
  };

  const addPermittedAuthMethodScope = async () => {
    if (!user?.authContext || !selectedPkp || !services?.litClient) {
      setAuthMethodScopeStatus("❌ Missing required data");
      return;
    }

    if (!authMethodId.trim()) {
      setAuthMethodScopeStatus("❌ Please enter an auth method ID");
      return;
    }

    setIsAddingAuthMethodScope(true);
    setAuthMethodScopeStatus("Adding auth method scope...");

    try {
      const chainConfig = services.litClient.getChainConfig().viemConfig;
      const pkpViemAccount = await services.litClient.getPkpViemAccount({
        pkpPublicKey: selectedPkp.publicKey || user?.pkpInfo?.pubkey,
        authContext: user.authContext,
        chainConfig: chainConfig,
      });

      const pkpPermissionsManager =
        await services.litClient.getPKPPermissionsManager({
          pkpIdentifier: {
            tokenId: selectedPkp.tokenId,
          },
          account: pkpViemAccount,
        });

      const result = await pkpPermissionsManager.addPermittedAuthMethodScope({
        authMethodType: parseInt(authMethodType),
        authMethodId: authMethodId,
        scopeId: parseInt(scopeId),
      });

      // Show success with transaction hash
      const txHash = result?.hash || result?.transactionHash || result;
      if (txHash) {
        setAuthMethodScopeStatus(
          `✅ Auth method scope added successfully! Transaction: ${txHash}`
        );
      } else {
        setAuthMethodScopeStatus("✅ Auth method scope added successfully!");
      }

      // Reset form
      setAuthMethodId("");
      setAuthMethodType("1");
      setScopeId("1");

      await loadPermissionsContext(); // Reload permissions
    } catch (error: any) {
      console.error("Failed to add auth method scope:", error);
      if (error.message?.includes("Not PKP NFT owner")) {
        setAuthMethodScopeStatus(
          "❌ You don't own this PKP. Only PKP owners can modify permissions."
        );
      } else {
        setAuthMethodScopeStatus(
          `❌ Failed to add auth method scope: ${error.message || error}`
        );
      }
    } finally {
      setIsAddingAuthMethodScope(false);
    }
  };

  const getPermittedAuthMethodScopes = async () => {
    if (!user?.authContext || !selectedPkp || !services?.litClient) {
      setAuthMethodScopes({ error: "Missing required data" });
      return;
    }

    if (!checkAuthMethodId.trim()) {
      setAuthMethodScopes({ error: "Please enter an auth method ID" });
      return;
    }

    setIsCheckingAuthMethodScopes(true);
    setAuthMethodScopes(null);

    try {
      const chainConfig = services.litClient.getChainConfig().viemConfig;
      const pkpViemAccount = await services.litClient.getPkpViemAccount({
        pkpPublicKey: selectedPkp.publicKey || user?.pkpInfo?.pubkey,
        authContext: user.authContext,
        chainConfig: chainConfig,
      });

      const pkpPermissionsManager =
        await services.litClient.getPKPPermissionsManager({
          pkpIdentifier: {
            tokenId: selectedPkp.tokenId,
          },
          account: pkpViemAccount,
        });

      const scopes = await pkpPermissionsManager.getPermittedAuthMethodScopes({
        authMethodType: parseInt(checkAuthMethodType),
        authMethodId: checkAuthMethodId,
      });

      setAuthMethodScopes(scopes);
    } catch (error: any) {
      console.error("Failed to get auth method scopes:", error);
      setAuthMethodScopes({
        error: `Failed to get auth method scopes: ${error.message || error}`,
      });
    } finally {
      setIsCheckingAuthMethodScopes(false);
    }
  };

  const checkPermissions = async () => {
    if (!user?.authContext || !selectedPkp || !services?.litClient) {
      setPermissionsError("Missing required data");
      return;
    }

    setIsCheckingPermissions(true);
    setPermissionsError("");
    try {
      const chainConfig = services.litClient.getChainConfig().viemConfig;
      const pkpViemAccount = await services.litClient.getPkpViemAccount({
        pkpPublicKey: selectedPkp.publicKey || user?.pkpInfo?.pubkey,
        authContext: user.authContext,
        chainConfig: chainConfig,
      });

      const pkpPermissionsManager =
        await services.litClient.getPKPPermissionsManager({
          pkpIdentifier: {
            tokenId: selectedPkp.tokenId,
          },
          account: pkpViemAccount,
        });

      const actionPermitted = checkActionIpfsId.trim()
        ? await pkpPermissionsManager.isPermittedAction({
            ipfsId: checkActionIpfsId,
          })
        : null;

      const addressPermitted = checkPermittedAddress.trim()
        ? await pkpPermissionsManager.isPermittedAddress({
            address: checkPermittedAddress,
          })
        : null;

      setPermissionCheckResults({
        actionPermitted,
        addressPermitted,
        actionIpfsId: checkActionIpfsId,
        address: checkPermittedAddress,
        timestamp: new Date().toISOString(),
      });

      setStatus("✅ Permission check completed!");
    } catch (error: any) {
      console.error("Failed to check permissions:", error);
      setPermissionsError(
        `❌ Failed to check permissions: ${error.message || error}`
      );
    } finally {
      setIsCheckingPermissions(false);
    }
  };

  const revokeAllPermissions = async () => {
    if (!user?.authContext || !selectedPkp || !services?.litClient) {
      setPermissionsError("Missing required data");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to revoke ALL permissions? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsRevokingAll(true);
    setPermissionsError("");
    try {
      const chainConfig = services.litClient.getChainConfig().viemConfig;
      const pkpViemAccount = await services.litClient.getPkpViemAccount({
        pkpPublicKey: selectedPkp.publicKey || user?.pkpInfo?.pubkey,
        authContext: user.authContext,
        chainConfig: chainConfig,
      });

      const pkpPermissionsManager =
        await services.litClient.getPKPPermissionsManager({
          pkpIdentifier: {
            tokenId: selectedPkp.tokenId,
          },
          account: pkpViemAccount,
        });

      const result = await pkpPermissionsManager.revokeAllPermissions();

      // Show success with transaction hash
      const txHash = result?.hash || result?.transactionHash || result;
      if (txHash) {
        setStatus(
          `✅ All permissions revoked successfully! Transaction: ${txHash}`
        );
      } else {
        setStatus("✅ All permissions revoked successfully!");
      }

      await loadPermissionsContext(); // Reload permissions
    } catch (error: any) {
      console.error("Failed to revoke all permissions:", error);
      if (error.message?.includes("Not PKP NFT owner")) {
        setPermissionsError(
          "❌ You don't own this PKP. Only PKP owners can modify permissions."
        );
      } else {
        setPermissionsError(
          `❌ Failed to revoke all permissions: ${error.message || error}`
        );
      }
    } finally {
      setIsRevokingAll(false);
    }
  };

  // Helper function to format transaction hash for display
  const formatTxHash = (hash: string) => {
    if (!hash) return "";
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  // Function to decode scope values for better readability
  const decodeScopeValues = (scopes: any) => {
    if (!scopes || typeof scopes !== "object") return scopes;

    // If it's an array of numbers, decode them
    if (Array.isArray(scopes)) {
      return scopes.map((scope: any) => {
        if (
          typeof scope === "number" &&
          scope >= 0 &&
          scope < SCOPE_VALUES.length
        ) {
          return `${scope} (${SCOPE_VALUES[scope]})`;
        }
        return scope;
      });
    }

    // If it's an object, recursively decode any arrays within it
    const decoded = { ...scopes };
    for (const [key, value] of Object.entries(decoded)) {
      if (Array.isArray(value)) {
        decoded[key] = value.map((item: any) => {
          if (
            typeof item === "number" &&
            item >= 0 &&
            item < SCOPE_VALUES.length
          ) {
            return `${item} (${SCOPE_VALUES[item]})`;
          }
          return item;
        });
      }
    }

    return decoded;
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

      {/* Copy Status */}
      {copiedField && (
        <div
          style={{
            marginTop: "16px",
            padding: "8px 16px",
            backgroundColor: "#10b981",
            color: "white",
            borderRadius: "6px",
            fontSize: "12px",
            textAlign: "center",
          }}
        >
          ✅ {copiedField} copied to clipboard!
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ marginBottom: "30px" }}>
        <div
          style={{
            display: "flex",
            borderBottom: "2px solid #e5e7eb",
            marginBottom: "20px",
          }}
        >
          <button
            onClick={() => setActiveTab("overview")}
            style={{
              padding: "12px 24px",
              border: "none",
              backgroundColor: "transparent",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              borderBottom:
                activeTab === "overview"
                  ? "2px solid #3b82f6"
                  : "2px solid transparent",
              color: activeTab === "overview" ? "#3b82f6" : "#6b7280",
              transition: "all 0.2s",
            }}
          >
            📊 Overview
          </button>
          <button
            onClick={() => {
              setActiveTab("permissions");
              // Auto-load permissions when switching to permissions tab
              if (!permissionsContext && !isLoadingPermissions) {
                loadPermissionsContext();
              }
            }}
            style={{
              padding: "12px 24px",
              border: "none",
              backgroundColor: "transparent",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              borderBottom:
                activeTab === "permissions"
                  ? "2px solid #3b82f6"
                  : "2px solid transparent",
              color: activeTab === "permissions" ? "#3b82f6" : "#6b7280",
              transition: "all 0.2s",
            }}
          >
            🔐 PKP Permissions 2
          </button>
          <button
            onClick={() => setActiveTab("payment")}
            style={{
              padding: "12px 24px",
              border: "none",
              backgroundColor: "transparent",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              borderBottom:
                activeTab === "payment"
                  ? "2px solid #10b981"
                  : "2px solid transparent",
              color: activeTab === "payment" ? "#10b981" : "#6b7280",
              transition: "all 0.2s",
            }}
          >
            💰 Payment Manager
          </button>
        </div>
      </div>

      {/* Status Messages with Transaction Links */}
      {status && (
        <div
          style={{
            marginBottom: "20px",
            padding: "12px 16px",
            backgroundColor: status.includes("✅") ? "#f0fdf4" : "#eff6ff",
            border: `1px solid ${
              status.includes("✅") ? "#bbf7d0" : "#bfdbfe"
            }`,
            borderRadius: "8px",
            color: status.includes("✅") ? "#15803d" : "#1e40af",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ flex: 1 }}>
            {status.includes("Transaction:") ? (
              <div>
                <div style={{ marginBottom: "8px" }}>
                  {status.split("Transaction:")[0].trim()}
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span style={{ fontSize: "12px", fontWeight: "500" }}>
                    Transaction Hash:
                  </span>
                  <a
                    href={`https://yellowstone-explorer.litprotocol.com/tx/${status
                      .split("Transaction:")[1]
                      .trim()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#1d4ed8",
                      textDecoration: "underline",
                      fontFamily: "monospace",
                      fontSize: "11px",
                      fontWeight: "500",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#2563eb";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#1d4ed8";
                    }}
                  >
                    {status.split("Transaction:")[1].trim()}
                  </a>
                </div>
              </div>
            ) : (
              status
            )}
          </div>
          <button
            onClick={() => setStatus("")}
            style={{
              background: "none",
              border: "none",
              color: "inherit",
              fontSize: "16px",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "4px",
              opacity: 0.7,
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "0.7";
            }}
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {activeTab === "overview" && (
        <>
          {/* Sign Message */}
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
              marginBottom: "20px",
            }}
          >
            <h3 style={{ margin: "0 0 16px 0", color: "#1f2937" }}>
              🔐 Encrypt & Decrypt
            </h3>
            <p
              style={{
                margin: "0 0 16px 0",
                color: "#6b7280",
                fontSize: "14px",
              }}
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
                      <strong>Original:</strong> "
                      {encryptedData.originalMessage}"
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
              marginBottom: "20px",
            }}
          >
            <h3 style={{ margin: "0 0 16px 0", color: "#1f2937" }}>
              ⚡ Execute Lit Action
            </h3>
            <p
              style={{
                margin: "0 0 16px 0",
                color: "#6b7280",
                fontSize: "14px",
              }}
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

          {/* Chain Selection */}
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
                Explore how PKPs integrate with popular web3 libraries like Viem
                for enhanced functionality.
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
                  Sign messages using PKP as a viem account (replaces
                  PKPEthers).
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
                    backgroundColor: isSendingTransaction
                      ? "#9ca3af"
                      : "#dc2626",
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
        </>
      )}

      {activeTab === "permissions" && (
        <>
          {/* PKP Permissions Dashboard Header */}
          <div
            style={{
              marginBottom: "20px",
              padding: "16px 20px",
              background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
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
              🔐 PKP Permissions Dashboard
            </h2>
            <p
              style={{
                margin: "0",
                fontSize: "14px",
                opacity: 0.9,
                lineHeight: "1.4",
              }}
            >
              Manage what your PKP wallet can do. Add actions, addresses, and
              control permissions.
            </p>
          </div>

          {/* Status Messages for Permissions Operations */}
          {status && (
            <div
              style={{
                marginBottom: "20px",
                padding: "12px 16px",
                backgroundColor: status.includes("✅") ? "#f0fdf4" : "#eff6ff",
                border: `1px solid ${
                  status.includes("✅") ? "#bbf7d0" : "#bfdbfe"
                }`,
                borderRadius: "8px",
                color: status.includes("✅") ? "#15803d" : "#1e40af",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ flex: 1 }}>
                {status.includes("Transaction:") ? (
                  <div>
                    <div style={{ marginBottom: "8px" }}>
                      {status.split("Transaction:")[0].trim()}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span style={{ fontSize: "12px", fontWeight: "500" }}>
                        Transaction Hash:
                      </span>
                      <a
                        href={`https://yellowstone-explorer.litprotocol.com/tx/${status
                          .split("Transaction:")[1]
                          .trim()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#1d4ed8",
                          textDecoration: "underline",
                          fontFamily: "monospace",
                          fontSize: "11px",
                          fontWeight: "500",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#2563eb";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "#1d4ed8";
                        }}
                      >
                        {status.split("Transaction:")[1].trim()}
                      </a>
                    </div>
                  </div>
                ) : (
                  status
                )}
              </div>
              <button
                onClick={() => setStatus("")}
                style={{
                  background: "none",
                  border: "none",
                  color: "inherit",
                  fontSize: "16px",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "4px",
                  opacity: 0.7,
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "0.7";
                }}
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          )}

          {/* Google-style Dashboard Summary Cards */}
          {permissionsContext && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
                marginBottom: "30px",
              }}
            >
              {/* Actions Summary Card */}
              <div
                style={{
                  padding: "20px",
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "36px",
                    fontWeight: "bold",
                    color: "#3b82f6",
                    marginBottom: "8px",
                  }}
                >
                  {permissionsContext?.actions?.length || 0}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "4px",
                  }}
                >
                  ⚡ Permitted Actions
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  Lit Actions this PKP can execute
                </div>
              </div>

              {/* Addresses Summary Card */}
              <div
                style={{
                  padding: "20px",
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "36px",
                    fontWeight: "bold",
                    color: "#059669",
                    marginBottom: "8px",
                  }}
                >
                  {permissionsContext?.addresses?.length || 0}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "4px",
                  }}
                >
                  🏠 Permitted Addresses
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  Addresses that can use this PKP
                </div>
              </div>

              {/* Auth Methods Summary Card */}
              <div
                style={{
                  padding: "20px",
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "36px",
                    fontWeight: "bold",
                    color: "#7c3aed",
                    marginBottom: "8px",
                  }}
                >
                  {permissionsContext?.authMethods?.length || 0}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "4px",
                  }}
                >
                  🔑 Auth Methods
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  Authentication methods linked
                </div>
              </div>
            </div>
          )}

          {/* Current Permissions Detail View */}
          <div
            style={{
              marginBottom: "30px",
              padding: "20px",
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
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h3 style={{ margin: 0, color: "#1f2937" }}>
                📋 Current Permissions
              </h3>
              <button
                onClick={loadPermissionsContext}
                disabled={isLoadingPermissions}
                style={{
                  padding: "8px 16px",
                  backgroundColor: isLoadingPermissions ? "#9ca3af" : "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "500",
                  cursor: isLoadingPermissions ? "not-allowed" : "pointer",
                }}
              >
                {isLoadingPermissions ? "Loading..." : "🔄 Refresh"}
              </button>
            </div>

            {!permissionsContext && !isLoadingPermissions && (
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#f3f4f6",
                  borderRadius: "8px",
                  textAlign: "center",
                  color: "#6b7280",
                }}
              >
                No permissions loaded. Click "Refresh" to load current
                permissions.
              </div>
            )}

            {isLoadingPermissions && (
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#f3f4f6",
                  borderRadius: "8px",
                  textAlign: "center",
                  color: "#6b7280",
                }}
              >
                Loading permissions...
              </div>
            )}

            {permissionsContext && (
              <div style={{ display: "grid", gap: "16px" }}>
                {/* Permitted Actions */}
                {permissionsContext.actions &&
                  permissionsContext.actions.length > 0 && (
                    <div>
                      <h4
                        style={{
                          margin: "0 0 12px 0",
                          color: "#374151",
                          fontSize: "16px",
                        }}
                      >
                        ⚡ Permitted Actions (
                        {permissionsContext.actions.length})
                      </h4>
                      <div style={{ display: "grid", gap: "8px" }}>
                        {permissionsContext.actions.map(
                          (action: string, index: number) => (
                            <div
                              key={index}
                              style={{
                                padding: "12px",
                                backgroundColor: "#f0f9ff",
                                border: "1px solid #bfdbfe",
                                borderRadius: "6px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    fontSize: "13px",
                                    fontFamily: "monospace",
                                    color: "#1e40af",
                                    marginBottom: "4px",
                                  }}
                                >
                                  <a
                                    href={`https://explorer.litprotocol.com/ipfs/${action}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      color: "#1e40af",
                                      textDecoration: "underline",
                                      cursor: "pointer",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.color = "#1d4ed8";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.color = "#1e40af";
                                    }}
                                  >
                                    {action}
                                  </a>
                                </div>
                                <div
                                  style={{ fontSize: "11px", color: "#6b7280" }}
                                >
                                  📎 IPFS CID (Lit Action Identifier) - Click to
                                  view
                                </div>
                              </div>
                              <button
                                onClick={() => removePermittedAction(action)}
                                disabled={removingItems.has(`action:${action}`)}
                                style={{
                                  padding: "4px 8px",
                                  backgroundColor: removingItems.has(`action:${action}`)
                                    ? "#9ca3af"
                                    : "#ef4444",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  cursor: removingItems.has(`action:${action}`)
                                    ? "not-allowed"
                                    : "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "4px",
                                  minWidth: "60px",
                                }}
                              >
                                {removingItems.has(`action:${action}`) ? (
                                  <>
                                    <div
                                      style={{
                                        width: "10px",
                                        height: "10px",
                                        border: "1px solid #ffffff",
                                        borderTop: "1px solid transparent",
                                        borderRadius: "50%",
                                        animation: "spin 1s linear infinite",
                                      }}
                                    />
                                    Removing...
                                  </>
                                ) : (
                                  "Remove"
                                )}
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Permitted Addresses */}
                {permissionsContext.addresses &&
                  permissionsContext.addresses.length > 0 && (
                    <div>
                      <h4
                        style={{
                          margin: "0 0 12px 0",
                          color: "#374151",
                          fontSize: "16px",
                        }}
                      >
                        🏠 Permitted Addresses (
                        {permissionsContext.addresses.length})
                      </h4>
                      <div style={{ display: "grid", gap: "8px" }}>
                        {permissionsContext.addresses.map(
                          (address: string, index: number) => (
                            <div
                              key={index}
                              style={{
                                padding: "12px",
                                backgroundColor: "#f0fdf4",
                                border: "1px solid #bbf7d0",
                                borderRadius: "6px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    fontSize: "13px",
                                    fontFamily: "monospace",
                                    color: "#15803d",
                                    marginBottom: "4px",
                                  }}
                                >
                                  {address}
                                </div>
                                <div
                                  style={{ fontSize: "11px", color: "#6b7280" }}
                                >
                                  Ethereum Address
                                </div>
                              </div>
                              <button
                                onClick={() => removePermittedAddress(address)}
                                disabled={removingItems.has(`address:${address}`)}
                                style={{
                                  padding: "4px 8px",
                                  backgroundColor: removingItems.has(`address:${address}`)
                                    ? "#9ca3af"
                                    : "#ef4444",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  cursor: removingItems.has(`address:${address}`)
                                    ? "not-allowed"
                                    : "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "4px",
                                  minWidth: "60px",
                                }}
                              >
                                {removingItems.has(`address:${address}`) ? (
                                  <>
                                    <div
                                      style={{
                                        width: "10px",
                                        height: "10px",
                                        border: "1px solid #ffffff",
                                        borderTop: "1px solid transparent",
                                        borderRadius: "50%",
                                        animation: "spin 1s linear infinite",
                                      }}
                                    />
                                    Removing...
                                  </>
                                ) : (
                                  "Remove"
                                )}
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Auth Methods */}
                {permissionsContext.authMethods &&
                  permissionsContext.authMethods.length > 0 && (
                    <div>
                      <h4
                        style={{
                          margin: "0 0 12px 0",
                          color: "#374151",
                          fontSize: "16px",
                        }}
                      >
                        🔑 Auth Methods ({permissionsContext.authMethods.length}
                        )
                      </h4>
                      <div style={{ display: "grid", gap: "8px" }}>
                        {permissionsContext.authMethods.map(
                          (authMethod: any, index: number) => {
                            const authType = Number(authMethod.authMethodType);
                            const isLitAction =
                              authType === AUTH_METHOD_TYPE.LitAction;
                            const displayId =
                              isLitAction && authMethod.id
                                ? hexToIpfsCid(authMethod.id)
                                : authMethod.id || "";

                            return (
                              <div
                                key={index}
                                style={{
                                  padding: "12px",
                                  backgroundColor: "#faf5ff",
                                  border: "1px solid #ddd6fe",
                                  borderRadius: "6px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "12px",
                                }}
                              >
                                <div style={{ flex: 1 }}>
                                  <div
                                    style={{
                                      fontSize: "13px",
                                      fontFamily: "monospace",
                                      color: "#7c3aed",
                                      marginBottom: "4px",
                                    }}
                                  >
                                    {isLitAction ? (
                                      <a
                                        href={`https://explorer.litprotocol.com/ipfs/${displayId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                          color: "#7c3aed",
                                          textDecoration: "underline",
                                          cursor: "pointer",
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.color =
                                            "#5b21b6";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.color =
                                            "#7c3aed";
                                        }}
                                      >
                                        {displayId}
                                      </a>
                                    ) : (
                                      displayId
                                    )}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "11px",
                                      color: "#6b7280",
                                      marginBottom: "4px",
                                    }}
                                  >
                                    <strong>Type:</strong>{" "}
                                    {getAuthMethodTypeName(authType)}
                                    {isLitAction && (
                                      <span
                                        style={{
                                          color: "#059669",
                                          marginLeft: "8px",
                                        }}
                                      >
                                        📎 (IPFS Link)
                                      </span>
                                    )}
                                  </div>
                                  {authMethod.scopes &&
                                    authMethod.scopes.length > 0 && (
                                      <div
                                        style={{
                                          fontSize: "11px",
                                          color: "#6b7280",
                                        }}
                                      >
                                        <strong>Scopes:</strong>{" "}
                                        {Array.isArray(authMethod.scopes)
                                          ? authMethod.scopes.join(", ")
                                          : authMethod.scopes}
                                      </div>
                                    )}
                                  {authMethod.scopes &&
                                    authMethod.scopes.length === 0 && (
                                      <div
                                        style={{
                                          fontSize: "11px",
                                          color: "#ef4444",
                                        }}
                                      >
                                        <strong>Scopes:</strong> None (no
                                        permissions)
                                      </div>
                                    )}
                                </div>
                                <button
                                  onClick={() =>
                                    removePermittedAuthMethod(
                                      authType,
                                      authMethod.id
                                    )
                                  }
                                  disabled={removingItems.has(
                                    `${authType}:${authMethod.id}`
                                  )}
                                  style={{
                                    padding: "4px 8px",
                                    backgroundColor: removingItems.has(
                                      `${authType}:${authMethod.id}`
                                    )
                                      ? "#9ca3af"
                                      : "#ef4444",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    fontSize: "11px",
                                    cursor: removingItems.has(
                                      `${authType}:${authMethod.id}`
                                    )
                                      ? "not-allowed"
                                      : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "4px",
                                    minWidth: "60px",
                                  }}
                                >
                                  {removingItems.has(
                                    `${authType}:${authMethod.id}`
                                  ) ? (
                                    <>
                                      <div
                                        style={{
                                          width: "10px",
                                          height: "10px",
                                          border: "1px solid #ffffff",
                                          borderTop: "1px solid transparent",
                                          borderRadius: "50%",
                                          animation: "spin 1s linear infinite",
                                        }}
                                      />
                                      Removing...
                                    </>
                                  ) : (
                                    "Remove"
                                  )}
                                </button>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Permission Management Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
              gap: "20px",
              marginBottom: "20px",
            }}
          >
            {/* Add Action Permission */}
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
                ➕ Add Action Permission
              </h3>
              <p
                style={{
                  margin: "0 0 16px 0",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                Allow your PKP to execute a specific Lit Action.
              </p>

              <input
                type="text"
                value={newActionIpfsId}
                onChange={(e) => setNewActionIpfsId(e.target.value)}
                placeholder="IPFS ID (e.g., QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB)"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "13px",
                  marginBottom: "16px",
                  fontFamily: "monospace",
                }}
              />

              {/* Scope Checkboxes */}
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                  }}
                >
                  🎯 Scopes (select permissions):
                </label>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {AVAILABLE_SCOPES.map((scope) => (
                    <label
                      key={scope.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        backgroundColor: newActionSelectedScopes.includes(
                          scope.id
                        )
                          ? "#eff6ff"
                          : "#ffffff",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={newActionSelectedScopes.includes(scope.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewActionSelectedScopes([
                              ...newActionSelectedScopes,
                              scope.id,
                            ]);
                          } else {
                            setNewActionSelectedScopes(
                              newActionSelectedScopes.filter(
                                (s) => s !== scope.id
                              )
                            );
                          }
                        }}
                        style={{
                          width: "16px",
                          height: "16px",
                          cursor: "pointer",
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: "500",
                            color: "#374151",
                          }}
                        >
                          {scope.label}
                        </div>
                        <div style={{ fontSize: "11px", color: "#6b7280" }}>
                          {scope.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={addPermittedAction}
                disabled={
                  isAddingAction ||
                  !newActionIpfsId.trim() ||
                  newActionSelectedScopes.length === 0
                }
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor:
                    isAddingAction ||
                    !newActionIpfsId.trim() ||
                    newActionSelectedScopes.length === 0
                      ? "#9ca3af"
                      : "#059669",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor:
                    isAddingAction ||
                    !newActionIpfsId.trim() ||
                    newActionSelectedScopes.length === 0
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {isAddingAction ? "Adding..." : "Add Action Permission"}
              </button>

              {/* Scope Checkboxes for Action */}
              <ScopeCheckboxes
                availableScopes={AVAILABLE_SCOPES}
                selectedScopes={newActionSelectedScopes}
                onScopeChange={setNewActionSelectedScopes}
              />

            </div>

            {/* Add Address Permission */}
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
                🏠 Add Address Permission
              </h3>
              <p
                style={{
                  margin: "0 0 16px 0",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                Allow a specific address to use your PKP.
              </p>

              <input
                type="text"
                value={newPermittedAddress}
                onChange={(e) => setNewPermittedAddress(e.target.value)}
                placeholder="Ethereum Address (0x...)"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "13px",
                  marginBottom: "16px",
                  fontFamily: "monospace",
                }}
              />

              {/* Scope Checkboxes for Address */}
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                  }}
                >
                  🎯 Scopes (select permissions):
                </label>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {AVAILABLE_SCOPES.map((scope) => (
                    <label
                      key={scope.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        backgroundColor: newAddressSelectedScopes.includes(
                          scope.id
                        )
                          ? "#eff6ff"
                          : "#ffffff",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={newAddressSelectedScopes.includes(scope.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewAddressSelectedScopes([
                              ...newAddressSelectedScopes,
                              scope.id,
                            ]);
                          } else {
                            setNewAddressSelectedScopes(
                              newAddressSelectedScopes.filter(
                                (s) => s !== scope.id
                              )
                            );
                          }
                        }}
                        style={{
                          width: "16px",
                          height: "16px",
                          cursor: "pointer",
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: "500",
                            color: "#374151",
                          }}
                        >
                          {scope.label}
                        </div>
                        <div style={{ fontSize: "11px", color: "#6b7280" }}>
                          {scope.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={addPermittedAddress}
                disabled={
                  isAddingAddress ||
                  !newPermittedAddress.trim() ||
                  newAddressSelectedScopes.length === 0
                }
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor:
                    isAddingAddress ||
                    !newPermittedAddress.trim() ||
                    newAddressSelectedScopes.length === 0
                      ? "#9ca3af"
                      : "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor:
                    isAddingAddress ||
                    !newPermittedAddress.trim() ||
                    newAddressSelectedScopes.length === 0
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {isAddingAddress ? "Adding..." : "Add Address Permission"}
              </button>

            </div>
          </div>

          {/* Permissions Error Display */}
          {permissionsError && (
            <div
              style={{
                marginTop: "20px",
                padding: "16px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                color: "#dc2626",
                fontSize: "14px",
              }}
            >
              <strong>⚠️ Error:</strong> {permissionsError}
            </div>
          )}

          {/* Empty State */}
          {permissionsContext &&
            (!permissionsContext.actions ||
              permissionsContext.actions.length === 0) &&
            (!permissionsContext.addresses ||
              permissionsContext.addresses.length === 0) &&
            (!permissionsContext.authMethods ||
              permissionsContext.authMethods.length === 0) && (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "#6b7280",
                  backgroundColor: "#f9fafb",
                  borderRadius: "8px",
                  border: "1px dashed #d1d5db",
                }}
              >
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔓</div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "500",
                    marginBottom: "8px",
                  }}
                >
                  No Permissions Set
                </div>
                <div style={{ fontSize: "14px" }}>
                  This PKP has no specific permissions configured. Use the forms
                  below to add permissions.
                </div>
              </div>
            )}


          {/* Auth Method Scope Management - Side by Side */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              marginBottom: "20px",
            }}
          >
            {/* Add Auth Method Scope */}
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
                🔐 Add Auth Method Scope
              </h3>
              <p
                style={{
                  margin: "0 0 16px 0",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                Add specific scopes/permissions to an existing auth method.
              </p>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#374151",
                  }}
                >
                  Auth Method Type:
                </label>
                <select
                  value={authMethodType}
                  onChange={(e) => setAuthMethodType(e.target.value)}
                  style={{
                    color: "black",
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "13px",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <option value="1">ETH Wallet (1)</option>
                  <option value="2">Lit Action (2)</option>
                  <option value="3">WebAuthn (3)</option>
                  <option value="4">Discord (4)</option>
                  <option value="5">Google (5)</option>
                  <option value="6">Google JWT (6)</option>
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#374151",
                  }}
                >
                  Auth Method ID:
                </label>
                <input
                  type="text"
                  value={authMethodId}
                  onChange={(e) => setAuthMethodId(e.target.value)}
                  placeholder="e.g., 0x... for address, or IPFS hash for Lit Action"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontFamily: "monospace",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#374151",
                  }}
                >
                  Scope ID:
                </label>
                <select
                  value={scopeId}
                  onChange={(e) => setScopeId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "13px",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <option value="1">Sign Anything (1)</option>
                  <option value="2">Personal Sign (2)</option>
                </select>
              </div>

              <button
                onClick={addPermittedAuthMethodScope}
                disabled={isAddingAuthMethodScope || !authMethodId.trim()}
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor:
                    isAddingAuthMethodScope || !authMethodId.trim()
                      ? "#9ca3af"
                      : "#8b5cf6",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor:
                    isAddingAuthMethodScope || !authMethodId.trim()
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {isAddingAuthMethodScope
                  ? "Adding Scope..."
                  : "Add Auth Method Scope"}
              </button>

              {/* Auth Method Scope Status Display */}
              {authMethodScopeStatus && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px 16px",
                    backgroundColor: authMethodScopeStatus.includes("✅")
                      ? "#f0fdf4"
                      : "#fef2f2",
                    border: `1px solid ${
                      authMethodScopeStatus.includes("✅")
                        ? "#bbf7d0"
                        : "#fecaca"
                    }`,
                    borderRadius: "8px",
                    color: authMethodScopeStatus.includes("✅")
                      ? "#15803d"
                      : "#dc2626",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    {authMethodScopeStatus.includes("Transaction:") ? (
                      <div>
                        <div style={{ marginBottom: "8px" }}>
                          {authMethodScopeStatus.split("Transaction:")[0]}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span style={{ fontSize: "11px", color: "#6b7280" }}>
                            Tx:
                          </span>
                          <a
                            href={`https://yellowstone-explorer.litprotocol.com/tx/${authMethodScopeStatus
                              .split("Transaction:")[1]
                              .trim()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#1d4ed8",
                              textDecoration: "underline",
                              fontFamily: "monospace",
                              fontSize: "11px",
                              fontWeight: "500",
                              cursor: "pointer",
                            }}
                          >
                            {formatTxHash(
                              authMethodScopeStatus
                                .split("Transaction:")[1]
                                .trim()
                            )}
                          </a>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                authMethodScopeStatus
                                  .split("Transaction:")[1]
                                  .trim(),
                                "Transaction Hash"
                              )
                            }
                            style={{
                              background: "none",
                              border: "1px solid #e5e7eb",
                              borderRadius: "4px",
                              padding: "2px 6px",
                              fontSize: "10px",
                              cursor: "pointer",
                              color: "#6b7280",
                            }}
                            title="Copy full hash"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                    ) : (
                      authMethodScopeStatus
                    )}
                  </div>
                  <button
                    onClick={() => setAuthMethodScopeStatus("")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "inherit",
                      fontSize: "16px",
                      cursor: "pointer",
                      padding: "4px",
                      borderRadius: "4px",
                      opacity: 0.7,
                    }}
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Check Auth Method Scopes */}
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
                🔍 Check Auth Method Scopes
              </h3>
              <p
                style={{
                  margin: "0 0 16px 0",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                View the current scopes/permissions for an auth method.
              </p>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#374151",
                  }}
                >
                  Auth Method Type:
                </label>
                <select
                  value={checkAuthMethodType}
                  onChange={(e) => setCheckAuthMethodType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "13px",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <option value="1">ETH Wallet (1)</option>
                  <option value="2">Lit Action (2)</option>
                  <option value="3">WebAuthn (3)</option>
                  <option value="4">Discord (4)</option>
                  <option value="5">Google (5)</option>
                  <option value="6">Google JWT (6)</option>
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#374151",
                  }}
                >
                  Auth Method ID:
                </label>
                <input
                  type="text"
                  value={checkAuthMethodId}
                  onChange={(e) => setCheckAuthMethodId(e.target.value)}
                  placeholder="e.g., 0x... for address, or IPFS hash for Lit Action"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontFamily: "monospace",
                  }}
                />
              </div>

              <button
                onClick={getPermittedAuthMethodScopes}
                disabled={
                  isCheckingAuthMethodScopes || !checkAuthMethodId.trim()
                }
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor:
                    isCheckingAuthMethodScopes || !checkAuthMethodId.trim()
                      ? "#9ca3af"
                      : "#0891b2",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor:
                    isCheckingAuthMethodScopes || !checkAuthMethodId.trim()
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {isCheckingAuthMethodScopes
                  ? "Checking..."
                  : "Check Auth Method Scopes"}
              </button>

              {/* Auth Method Scopes Results */}
              {authMethodScopes && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "500",
                      marginBottom: "8px",
                      color: "#374151",
                    }}
                  >
                    🔍 Scope Results:
                  </div>
                  {authMethodScopes.error ? (
                    <div style={{ color: "#dc2626", fontSize: "12px" }}>
                      ❌ {authMethodScopes.error}
                    </div>
                  ) : (
                    <pre
                      style={{
                        fontFamily: "monospace",
                        fontSize: "11px",
                        backgroundColor: "#ffffff",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #e5e7eb",
                        whiteSpace: "pre-wrap",
                        margin: 0,
                        color: "#374151",
                        maxHeight: "200px",
                        overflowY: "auto",
                      }}
                    >
                      {JSON.stringify(
                        decodeScopeValues(authMethodScopes),
                        null,
                        2
                      )}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: "16px" }}>
            {/* Danger Zone */}
            <div
              style={{
                padding: "20px",
                backgroundColor: "#fef2f2",
                borderRadius: "12px",
                border: "1px solid #fecaca",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
              }}
            >
              <h3 style={{ margin: "0 0 16px 0", color: "#dc2626" }}>
                ⚠️ Danger Zone
              </h3>
              <p
                style={{
                  margin: "0 0 16px 0",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                <strong>Warning:</strong> This will remove ALL permissions from
                your PKP. This action cannot be undone.
              </p>

              <button
                onClick={revokeAllPermissions}
                disabled={isRevokingAll}
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: isRevokingAll ? "#9ca3af" : "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: isRevokingAll ? "not-allowed" : "pointer",
                }}
              >
                {isRevokingAll
                  ? "Revoking All..."
                  : "🚨 Revoke All Permissions"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Payment Manager Tab */}
      {activeTab === "payment" && (
        <div style={{ marginTop: "20px" }}>
          <PaymentManagerOperationsDashboard
            selectedPkp={selectedPkp}
            selectedChain={selectedChain}
            onTransactionComplete={(result) => {
              // Add transaction toast notification
              addTransactionToast("PaymentManager transaction completed!", result.hash);
              
              // Refresh balance after transaction
              setTimeout(() => {
                loadBalance();
              }, 2000);
            }}
            services={services}
          />
        </div>
      )}

      {/* CSS Animation for Loading Spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      {/* Transaction Toast Notifications */}
      <TransactionToastContainer 
        toasts={transactionToasts} 
        onRemoveToast={removeTransactionToast} 
      />

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
              color: "black",
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
