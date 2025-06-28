import { createAuthManager, storagePlugins } from "@lit-protocol/auth";
import { createLitClient } from "@lit-protocol/lit-client";
import { nagaDev } from "@lit-protocol/networks";
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { MainLayout } from "../layouts/MainLayout";

// --- Singleton instances ---
type LitClient = Awaited<ReturnType<typeof createLitClient>>;
type AuthManager = Awaited<ReturnType<typeof createAuthManager>>;

let litClientInstance: LitClient | null = null;
let authManagerInstance: AuthManager | null = null;

const getLitClient = async (): Promise<LitClient> => {
  if (!litClientInstance) {
    console.log("Creating new LitClient instance (should happen only once)");
    litClientInstance = await createLitClient({ network: nagaDev });
  }
  return litClientInstance;
};

const getAuthManager = (): AuthManager => {
  if (!authManagerInstance) {
    console.log("Creating new AuthManager instance (should happen only once)");
    authManagerInstance = createAuthManager({
      storage: storagePlugins.localStorage({
        appName: "my-app",
        networkName: "naga-dev",
      }),
    });
  }
  return authManagerInstance;
};

// Type definitions for navigation items
interface NavigationItem {
  id: string;
  path?: string;
  name: string;
  description?: string;
  category?: string; // Optional for child items
  type?: "primary" | "secondary"; // Optional for child items
  secondarySection?: string;
  children?: NavigationItem[];
}

// DependencyStatus component for displaying dependency status with proper alignment
type Dependency = {
  name: string;
  isLoaded: boolean;
  description?: string; // Optional description for each dependency
};

// Error Display Component
interface ErrorDisplayProps {
  error: string | null;
  isVisible: boolean;
  onClear: () => void;
}

const ErrorDisplay = ({ error, isVisible, onClear }: ErrorDisplayProps) => {
  if (!error || !isVisible) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 9999,
        maxWidth: "450px",
        minWidth: "300px",
        padding: "20px",
        backgroundColor: "#fff5f5",
        border: "2px solid #feb2b2",
        borderLeft: "5px solid #e53e3e",
        borderRadius: "8px",
        boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
        animation: "slideInFromRight 0.3s ease-out",
      }}
    >
      <style>
        {`
          @keyframes slideInFromRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          @keyframes pulse {
            0%, 100% { 
              box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            }
            50% { 
              box-shadow: 0 8px 25px rgba(229, 62, 62, 0.3);
            }
          }
        `}
      </style>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <div
          style={{
            fontSize: "24px",
            color: "#e53e3e",
            lineHeight: "1",
            animation: "pulse 2s ease-in-out infinite",
          }}
        >
          ❌
        </div>
        <div style={{ flex: 1 }}>
          <h4
            style={{
              margin: "0 0 10px 0",
              color: "#c53030",
              fontSize: "16px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Error
          </h4>
          <div
            style={{
              color: "#742a2a",
              fontSize: "14px",
              lineHeight: "1.5",
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              backgroundColor: "#fed7d7",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #feb2b2",
            }}
          >
            {error}
          </div>
        </div>
        <button
          onClick={onClear}
          style={{
            background: "#e53e3e",
            border: "none",
            fontSize: "14px",
            color: "white",
            cursor: "pointer",
            padding: "6px 8px",
            borderRadius: "4px",
            fontWeight: "bold",
            transition: "background-color 0.2s",
          }}
          title="Close error"
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "#c53030")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "#e53e3e")
          }
        >
          ✕
        </button>
      </div>
    </div>
  );
};

interface DependencyStatusProps {
  dependencies: Dependency[];
  title?: string; // Optional custom title
}

const DependencyStatus = ({
  dependencies,
  title = "Dependencies Status:",
}: DependencyStatusProps) => {
  return (
    <div
      style={{
        padding: "12px",
        marginBottom: "20px",
        backgroundColor: "#f0f9ff",
        borderRadius: "4px",
        fontSize: "14px",
        border: "1px solid #bee3f8",
      }}
    >
      <h3 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>{title}</h3>
      <table
        style={{
          width: "100%",
          borderCollapse: "separate",
          borderSpacing: "0 4px",
        }}
      >
        <tbody>
          {dependencies.map((dep, index) => (
            <tr key={index}>
              <td
                style={{
                  textAlign: "left",
                  paddingRight: "10px",
                  fontWeight: "500",
                  minWidth: "120px",
                }}
              >
                {dep.name}:
              </td>
              <td
                style={{
                  textAlign: "left",
                  whiteSpace: "nowrap",
                }}
              >
                {dep.isLoaded ? (
                  <span style={{ color: "green", fontWeight: "bold" }}>
                    ✓ Loaded
                  </span>
                ) : (
                  <span style={{ color: "orange", fontWeight: "bold" }}>
                    ⟳ Loading...
                  </span>
                )}
              </td>
              {dep.description && (
                <td
                  style={{
                    textAlign: "left",
                    paddingLeft: "15px",
                    color: "#666",
                    fontSize: "13px",
                    fontStyle: "italic",
                  }}
                >
                  {dep.description}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Recursive Navigation Item Component
interface NavigationItemProps {
  item: NavigationItem;
  level: number;
  activeMethod: string;
  expandedCategories: { [key: string]: boolean };
  toggleCategoryCollapse: (categoryKey: string) => void;
  location: { pathname: string };
}

const NavigationItem = ({
  item,
  level,
  activeMethod,
  expandedCategories,
  toggleCategoryCollapse,
  location,
}: NavigationItemProps) => {
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedCategories[item.id];
  const isActive = activeMethod === item.id;
  const isPathActive = item.path && location.pathname === item.path;

  const indentLevel = level * 15;
  const fontSize = Math.max(0.9 - level * 0.05, 0.75); // Decrease font size for deeper levels

  if (hasChildren) {
    return (
      <div style={{ marginBottom: "4px" }}>
        <div style={{ position: "relative" }}>
          <button
            type="button"
            style={{
              display: "block",
              width: "100%",
              padding: "10px 15px",
              paddingLeft: `${10 + indentLevel}px`,
              borderRadius: "4px",
              cursor: "pointer",
              backgroundColor: isActive ? "#3b82f6" : "#ffffff",
              color: isActive ? "#ffffff" : "#333333",
              border: `1px solid ${isActive ? "#3b82f6" : "#dddddd"}`,
              transition: "all 0.2s",
              textAlign: "left",
              fontWeight: "500",
              textDecoration: "none",
              position: "relative",
              fontSize: `${fontSize}rem`,
              marginBottom: "2px",
            }}
            onClick={(e) => {
              e.stopPropagation();
              toggleCategoryCollapse(item.id);
            }}
          >
            <span style={{ marginRight: 8 }}>{isExpanded ? "▼" : "▶"}</span>
            {item.name}
          </button>

          {/* Recursive children */}
          {isExpanded && (
            <div style={{ marginLeft: 0 }}>
              {item.children!.map((child) => (
                <NavigationItem
                  key={child.id}
                  item={child}
                  level={level + 1}
                  activeMethod={activeMethod}
                  expandedCategories={expandedCategories}
                  toggleCategoryCollapse={toggleCategoryCollapse}
                  location={location}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  } else {
    return (
      <Link
        to={item.path || ""}
        style={{
          display: "block",
          padding: "10px 15px",
          paddingLeft: `${10 + indentLevel}px`,
          borderRadius: "4px",
          cursor: "pointer",
          backgroundColor: isPathActive ? "#3b82f6" : "#ffffff",
          color: isPathActive ? "#ffffff" : "#333333",
          border: `1px solid ${isPathActive ? "#3b82f6" : "#e9ecef"}`,
          transition: "all 0.2s",
          width: "100%",
          textAlign: "left",
          fontWeight: "500",
          textDecoration: "none",
          fontSize: `${fontSize}rem`,
          marginBottom: 2,
        }}
      >
        {item.name}
      </Link>
    );
  }
};

// Authentication methods configuration
const ACTIONS: NavigationItem[] = [
  {
    id: "home",
    path: "/",
    name: "Home",
    description: "Welcome to Lit Protocol Interactive Documentation",
    category: "Home",
    type: "primary",
  },
  {
    id: "what-is-lit",
    path: "/learning-lit/what-is-lit",
    name: "What is Lit Protocol",
    description: "An overview of Lit Protocol.",
    category: "Learning Lit",
    type: "primary",
  },
  {
    id: "how-it-works",
    path: "/learning-lit/how-it-works",
    name: "How It Works",
    description: "An overview of how Lit Protocol works.",
    category: "Learning Lit",
    type: "primary",
  },
  {
    id: "security",
    name: "Security",
    description: "An overview of Lit Protocol security.",
    category: "Learning Lit",
    type: "primary",
    children: [
      {
        id: "security-overview",
        path: "/learning-lit/security",
        name: "Overview",
      },
      {
        id: "security-node-architecture",
        path: "/learning-lit/security/node-architecture",
        name: "Node Architecture",
      },
      {
        id: "security-key-generation",
        path: "/learning-lit/security/key-generation",
        name: "Key Generation",
      },
      {
        id: "security-on-chain-coordination",
        path: "/learning-lit/security/on-chain-coordination",
        name: "On-Chain Coordination",
      },
      {
        id: "security-communicating-with-nodes",
        path: "/learning-lit/security/communicating-with-nodes",
        name: "Communicating with Nodes",
      },
      {
        id: "security-cryptoeconomic-security",
        path: "/learning-lit/security/cryptoeconomic-security",
        name: "Cryptoeconomic Security",
      },
      {
        id: "security-backup-and-recovery",
        path: "/learning-lit/security/backup-and-recovery",
        name: "Backup and Recovery",
      },
    ],
  },
  {
    id: "demo",
    path: "/learning-lit/demo",
    name: "Demo",
    description:
      "Interactive demo showcasing Lit Protocol authentication and encryption features",
    category: "Learning Lit",
    type: "primary",
  },

  // Building With Lit
  {
    id: "building-getting-started",
    path: "/building-with-lit/getting-started",
    name: "Getting Started",
    description:
      "Introduction to building with Lit Protocol and setup overview",
    category: "Building With Lit",
    type: "primary",
  },
  {
    id: "setup-lit-client",
    path: "/building-with-lit/setup-lit-client",
    name: "Setup Lit Client",
    description: "Create and configure your Lit Protocol client instance",
    category: "Building With Lit",
    type: "primary",
  },
  {
    id: "setup-auth-manager",
    path: "/building-with-lit/setup-auth-manager",
    name: "Setup Auth Manager",
    description: "Create and configure authentication manager with storage",
    category: "Building With Lit",
    type: "primary",
  },
  {
    id: "setup-auth-services",
    path: "/building-with-lit/setup-auth-services",
    name: "Setup Auth Services",
    description: "Configure your own auth infrastructure (servers & worker)",
    category: "Building With Lit",
    type: "primary",
  },
  // {
  //   id: "network-configuration",
  //   path: "/network-configuration",
  //   name: "Network Configuration",
  //   description: "Configure Lit Protocol network settings (nagaDev)",
  //   category: "Getting Started",
  //   type: "primary",
  // },
  // {
  //   id: "storage-plugins",
  //   path: "/storage-plugins",
  //   name: "Storage Plugins",
  //   description: "Configure localStorage and other storage options",
  //   category: "Getting Started",
  //   type: "primary",
  // },

  // Primary: Programmable Keys
  {
    id: "programmable-keys-overview",
    path: "/programmable-keys/overview",
    name: "Overview",
    description: "Overview of Programmable Keys",
    category: "Programmable Keys",
    type: "primary",
  },
  // Secondary: PKPs
  {
    id: "pkps",
    name: "PKPs",
    description: "Guide to minting and using PKPs",
    category: "Programmable Keys",
    type: "primary",
    children: [
      {
        id: "pkps-getting-started",
        path: "/programmable-keys/pkps/getting-started",
        name: "Getting Started",
      },
      {
        id: "pkps-auth-methods",
        path: "/programmable-keys/pkps/auth-methods",
        name: "Auth Methods",
        children: [
          {
            id: "pkps-auth-method-providers",
            path: "/programmable-keys/pkps/auth-method-providers",
            name: "Auth Method Providers",
            children: [
              {
                id: "pkps-auth-methods-eoa-native",
                path: "/programmable-keys/pkps/auth-methods/eoa-native",
                name: "Ethereum Wallet (Native)",
                description: "Direct EOA usage for PKP management",
              },
              {
                id: "pkps-auth-methods-eoa",
                path: "/programmable-keys/pkps/auth-methods/eoa",
                name: "Ethereum Wallet (SIWE)",
                description:
                  "Authenticate using your Ethereum wallet and a SIWE message",
              },
              {
                id: "pkps-auth-methods-google",
                path: "/programmable-keys/pkps/auth-methods/google",
                name: "Google oAuth",
                description: "Authenticate using your Google account",
              },
              {
                id: "pkps-auth-methods-discord",
                path: "/programmable-keys/pkps/auth-methods/discord",
                name: "Discord oAuth",
                description: "Authenticate using your Discord account",
              },
              {
                id: "pkps-auth-methods-webauthn",
                path: "/programmable-keys/pkps/auth-methods/webauthn",
                name: "WebAuthn",
                description: "Authenticate using your WebAuthn device",
              },
              {
                id: "pkps-auth-methods-stytch-email-otp",
                path: "/programmable-keys/pkps/auth-methods/stytch-email-otp",
                name: "Stytch Email OTP",
                description: "Authenticate using Stytch Email OTP verification",
              },
              {
                id: "pkps-auth-methods-stytch-sms-otp",
                path: "/programmable-keys/pkps/auth-methods/stytch-sms-otp",
                name: "Stytch SMS OTP",
                description: "Authenticate using Stytch SMS OTP verification",
              },
              {
                id: "pkps-auth-methods-stytch-whatsapp-otp",
                path: "/programmable-keys/pkps/auth-methods/stytch-whatsapp-otp",
                name: "Stytch WhatsApp OTP",
                description:
                  "Authenticate using Stytch WhatsApp OTP verification",
              },
              {
                id: "pkps-auth-methods-stytch-totp",
                path: "/programmable-keys/pkps/auth-methods/stytch-totp",
                name: "Stytch 2FA TOTP",
                description:
                  "Authenticate using Stytch TOTP (Authenticator App)",
              },
            ],
          },
          {
            id: "pkps-auth-methods-custom-auth",
            path: "/programmable-keys/pkps/auth-methods/custom-auth",
            name: "Custom Auth Method",
            description:
              "Build your own custom authentication with Lit Actions",
          },
          {
            id: "pkps-auth-methods-add-remove",
            path: "/programmable-keys/pkps/auth-methods/add-remove",
            name: "Add & Remove Auth Methods",
            description: "Add or remove auth methods from a PKP",
          },
        ],
      },
      {
        id: "pkps-view-methods",
        path: "/programmable-keys/pkps/view-methods",
        name: "View PKP Info",
        children: [
          {
            id: "pkps-view-methods-pkp-permissions",
            path: "/programmable-keys/pkps/view/pkp-permissions",
            name: "PKP Permissions",
            description: "View PKP permissions",
          },
          {
            id: "pkps-view-methods-pkps-by-address",
            path: "/programmable-keys/pkps/view/pkps-by-address",
            name: "PKPs by Address",
            description: "View PKPs by address",
          },
          {
            id: "pkps-view-methods-pkps-by-auth",
            path: "/programmable-keys/pkps/view/pkps-by-auth",
            name: "PKPs by Auth",
            description: "View PKPs by auth",
          },
        ],
      },
      {
        id: "pkps-signing",
        path: "/programmable-keys/pkps/signing",
        name: "PKP Signing",
        children: [
          {
            id: "pkps-signing-raw",
            path: "/programmable-keys/pkps/signing/raw",
            name: "Raw Signing",
            description: "Sign data using your PKP",
          },
          {
            id: "pkps-signing-eth",
            path: "/programmable-keys/pkps/signing/eth",
            name: "Ethereum Signing",
            description: "Sign data using your PKP",
          },
          {
            id: "pkps-btc-signing",
            path: "/programmable-keys/pkps/signing/btc",
            name: "Bitcoin Signing",
            description: "Sign data using your PKP",
          },
        ],
      },
      {
        id: "pkps-connecting-to-dapps",
        path: "/programmable-keys/pkps/connecting-to-dapps",
        name: "Connecting to dApps",
        description: "Connect your PKP to a dApp",
      },
    ],
  },

  // Encryption & Access Control
  {
    id: "encryption-overview",
    path: "/encryption/overview",
    name: "Overview",
    description: "Encrypt and decrypt data using access control conditions",
    category: "Encryption & Access Control",
    type: "primary",
  },
  {
    id: "encryption-quickstart",
    path: "/encryption/quickstart",
    name: "Quickstart",
    description: "Quickstart guide to encrypting and decrypting data",
    category: "Encryption & Access Control",
    type: "primary",
  },
  {
    id: "encryption-access-control-conditions",
    path: "/encryption/accs",
    name: "Access Control Conditions",
    description: "Access Control Conditions for encrypting data",
    category: "Encryption & Access Control",
    type: "primary",
    children: [
      {
        id: "encryption-access-control-conditions-boolean-logic",
        path: "/encryption/access-control/boolean-logic",
        name: "Boolean Logic",
      },
      {
        id: "encryption-access-control-conditions-evm",
        path: "/encryption/access-control/evm",
        name: "EVM Based Conditions",
        description: "Access Control Conditions for EVM",
        category: "Encryption & Access Control",
        type: "secondary",
        children: [
          {
            id: "encryption-access-control-conditions-evm-supported-chains",
            path: "/encryption/access-control/evm/supported-chains",
            name: "Supported EVM Chains",
            description: "Access Control Conditions for Supported EVM Chains",
            category: "Encryption & Access Control",
            type: "secondary",
          },
          {
            id: "encryption-access-control-conditions-evm-wallet-ownership",
            path: "/encryption/access-control/evm/wallet-ownership",
            name: "Wallet Ownership",
            description: "Access Control Conditions for Wallet Ownership",
            category: "Encryption & Access Control",
            type: "secondary",
          },
          {
            id: "encryption-access-control-conditions-evm-eth-balance",
            path: "/encryption/access-control/evm/eth-balance",
            name: "ETH Balance",
            description: "Access Control Conditions for ETH Balance",
            category: "Encryption & Access Control",
            type: "secondary",
          },
          {
            id: "encryption-access-control-conditions-evm-erc20-balance",
            path: "/encryption/access-control/evm/erc20-balance",
            name: "ERC-20 Balance",
            description: "Access Control Conditions for ERC20 Balance",
            category: "Encryption & Access Control",
            type: "secondary",
          },
          {
            id: "encryption-access-control-conditions-evm-erc721-ownership",
            path: "/encryption/access-control/evm/erc721-ownership",
            name: "ERC-721 NFT Ownership",
            description: "Access Control Conditions for ERC721 Ownership",
            category: "Encryption & Access Control",
            type: "secondary",
          },
        ],
      },
    ],
  },

  // {
  //   id: "encryption",
  //   name: "Encryption",
  //   description: "Guide to encrypting and decrypting data",
  //   category: "Encryption & Access Control",
  //   type: "primary",
  //   children: [
  //     {
  //       id: "encryption-overview",
  //       path: "/encryption/overview",
  //       name: "Overview",
  //     },
  //   ],
  // },

  // Payment Management
  {
    id: "payment-manager",
    path: "/payment-manager",
    name: "Payment Manager",
    description:
      "Manage deposits, withdrawals, and balance queries on the Ledger Contract",
    category: "Payment Management",
    type: "primary",
  },

  // More authentication methods will be added here
];

export const HomePage = () => {
  // const { data: walletClient } = useWalletClient();
  const location = useLocation();

  const [status, setStatus] = useState<string>("");
  const [signature, setSignature] = useState<any>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [pkpInfo, setPkpInfo] = useState<any>(null);
  const [litClient, setLitClient] = useState<LitClient | null>(null);
  const [authManager, setAuthManager] = useState<AuthManager | null>(null);
  const [authContext, setAuthContext] = useState<any>(null);
  const [activeMethod, setActiveMethod] = useState<string>("eoa");
  // Helper function to find all parent categories for a given path
  const findCategoriesForPath = (path: string): string[] => {
    const categories: string[] = [];

    const findInActions = (
      actions: NavigationItem[],
      parentCategory?: string
    ): void => {
      for (const action of actions) {
        if (action.path === path) {
          if (action.category) categories.push(action.category);
          if (parentCategory) categories.push(parentCategory);
          return;
        }

        if (action.children) {
          findInActions(action.children, action.id);
        }
      }
    };

    findInActions(ACTIONS);
    return categories;
  };

  // Get expanded categories based on current path
  const getExpandedCategoriesForPath = (
    path: string
  ): { [key: string]: boolean } => {
    const defaultExpanded: { [key: string]: boolean } = {
      "Learning Lit": true,
      "Building With Lit": true,
    };

    // Always expand categories for the current path
    const currentPathCategories = findCategoriesForPath(path);
    currentPathCategories.forEach((category) => {
      defaultExpanded[category] = true;
    });

    return defaultExpanded;
  };

  const [expandedCategories, setExpandedCategories] = useState<{
    [key: string]: boolean;
  }>(getExpandedCategoriesForPath(location.pathname));
  const [siteAuthConfig, setSiteAuthConfig] = useState<any>({
    domain: window.location.host,
    statement: "🫵 YOU AGREED TO THE TERMS AND CONDITIONS",
    resources: [
      ["pkp-signing", "*"],
      ["lit-action-execution", "*"],
    ],
    capabilityAuthSigs: [],
    expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  });

  // Error state management
  const [error, setError] = useState<string | null>(null);
  const [isErrorVisible, setIsErrorVisible] = useState<boolean>(false);

  // Function to show error with auto-hide
  const showError = (errorMessage: string, autoHide: boolean = true) => {
    setError(errorMessage);
    setIsErrorVisible(true);

    // Play error sound for better user experience
    try {
      // Create a simple beep sound
      const audioContext = new (window.AudioContext ||
        (window as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.2
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
      console.log("Could not play error sound:", e);
    }

    if (autoHide) {
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setIsErrorVisible(false);
      }, 5000);
    }
  };

  // Function to clear error
  const clearError = () => {
    setError(null);
    setIsErrorVisible(false);
  };

  // Function to toggle category collapse state
  const toggleCategoryCollapse = (categoryKey: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryKey]: !prev[categoryKey],
    }));
  };

  // Effect to initialize LitClient and AuthManager state using singletons
  useEffect(() => {
    const initClients = async () => {
      if (!litClient) {
        // Only set if not already in state
        const client = await getLitClient();
        // Check again in case of rapid re-renders or if state was set by another means
        // This check is against the current closure's `litClient` value.
        // A more robust check for multiple calls to set state might involve a ref for this effect's completion.
        // However, for setting from a singleton, simply calling set once is usually fine.
        setLitClient(client);
      }
      if (!authManager) {
        // Only set if not already in state
        const manager = getAuthManager();
        setAuthManager(manager);
      }
    };
    initClients();
  }, []); // Empty dependency array ensures this runs once on mount

  // Effect to update loading and status messages based on client availability
  useEffect(() => {
    // if (walletClient && litClient && authManager) {
    if (litClient && authManager) {
      setLoading(false);
      setStatus("All dependencies loaded successfully!");
    } else {
      setLoading(true);
      const missingDeps = [];
      // if (!walletClient) missingDeps.push("Wallet Client");
      if (!litClient) missingDeps.push("Lit Client");
      if (!authManager) missingDeps.push("Auth Manager");
      setStatus(
        missingDeps.length > 0
          ? `Waiting for: ${missingDeps.join(", ")}...`
          : "Initializing..."
      );
    }
  }, [litClient, authManager]);

  // Update activeMethod and expanded categories based on the current path
  useEffect(() => {
    const path = location.pathname;
    const actionId =
      ACTIONS.find((action) => action.path === path)?.id || "eoa";
    setActiveMethod(actionId);

    // Update expanded categories for current path
    setExpandedCategories(getExpandedCategoriesForPath(path));
  }, [location.pathname]);

  function assertDependenciesLoaded() {
    // if (!walletClient || !authManager || !litClient) {
    if (!authManager || !litClient) {
      throw new Error(
        `Missing dependencies: ${authManager ? "" : "authManager"} ${
          litClient ? "" : "litClient"
        }`
      );
    }

    return {
      // walletClient,
      authManager,
      litClient,
    };
  }

  // Check if all dependencies are loaded
  const areDependenciesLoaded = () => {
    // return !!(walletClient && authManager && litClient);
    return !!(authManager && litClient);
  };

  // Get dependency status for display
  const getDependencyStatus = () => {
    return {
      // walletClient: !!walletClient,
      authManager: !!authManager,
      litClient: !!litClient,
    };
  };

  // Get dependencies for the DependencyStatus component
  const getDependencies = (): Dependency[] => {
    return [
      // {
      //   name: "Wallet Client",
      //   isLoaded: !!walletClient,
      // },
      {
        name: "Lit Client",
        isLoaded: !!litClient,
      },
      {
        name: "Auth Manager",
        isLoaded: !!authManager,
      },
      // Add new dependencies here by adding a new object with name, isLoaded, and optional description
    ];
  };

  // Check if we can mint PKP (requires auth context)
  const canMintPkp = () => {
    return areDependenciesLoaded() && !!authContext;
  };

  const contextValue = {
    getDependencyStatus,
    areDependenciesLoaded,
    authContext,
    activeMethod,
    setAuthContext,
    setActiveMethod,
    setStatus,
    assertDependenciesLoaded,
    siteAuthConfig,
    canMintPkp,
    loading,
    pkpInfo,
    signature,
    setPkpInfo,
    setSignature,
    setLoading,
    error,
    showError,
    clearError,
    isErrorVisible,
  };

  return (
    <MainLayout>
      {/* Fixed Error Toast - positioned outside of sidebar */}
      <ErrorDisplay
        error={error}
        isVisible={isErrorVisible}
        onClear={clearError}
      />

      <div
        className="doc-layout"
        style={{
          display: "flex",
          height: "100vh",
          margin: "0 auto",
        }}
      >
        {/* Sidebar with navigation */}
        <div
          className="sidebar"
          style={{
            width: "280px",
            borderRight: "1px solid #eaeaea",
            padding: "20px",
            backgroundColor: "#f9f9f9",
            height: "100%",
            overflowY: "auto",
          }}
        >
          <h2 style={{ marginBottom: "20px" }}>Documentation</h2>

          <DependencyStatus dependencies={getDependencies()} />

          <div className="nav-tabs">
            {(() => {
              const groupedActions: { [key: string]: typeof ACTIONS } = {};
              ACTIONS.forEach((action) => {
                // Only group actions that have a category
                if (action.category) {
                  if (!groupedActions[action.category]) {
                    groupedActions[action.category] = [];
                  }
                  groupedActions[action.category].push(action);
                }
              });

              return Object.entries(groupedActions).map(
                ([category, actionsInCategory], categoryIndex) => {
                  // Separate primary and secondary actions
                  const primaryActions = actionsInCategory.filter(
                    (action) => action.type === "primary"
                  );
                  const secondaryActions = actionsInCategory.filter(
                    (action) => action.type === "secondary"
                  );

                  const hasSecondaryActions = secondaryActions.length > 0;
                  const categoryKey = category;
                  const secondaryKey = `${category}-secondary`;
                  const isCategoryExpanded = expandedCategories[categoryKey];
                  const isSecondaryExpanded = expandedCategories[secondaryKey];

                  return (
                    <div key={category}>
                      {categoryIndex > 0 && (
                        <hr
                          style={{ margin: "15px 0", borderColor: "#dddddd" }}
                        />
                      )}

                      {category === "Home" ? (
                        primaryActions.map((action) => (
                          <Link
                            key={action.id}
                            to={action.path || ""}
                            style={{
                              display: "block",
                              padding: "10px 15px",
                              marginBottom: "4px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              backgroundColor:
                                activeMethod === action.id
                                  ? "#3b82f6"
                                  : "#ffffff",
                              color:
                                activeMethod === action.id
                                  ? "#ffffff"
                                  : "#333333",
                              border: `1px solid ${
                                activeMethod === action.id
                                  ? "#3b82f6"
                                  : "#dddddd"
                              }`,
                              transition: "all 0.2s",
                              width: "100%",
                              textAlign: "left",
                              fontWeight: "500",
                              textDecoration: "none",
                            }}
                          >
                            {action.name}
                          </Link>
                        ))
                      ) : (
                        <>
                          {/* Collapsible Category Header */}
                          <button
                            onClick={() => toggleCategoryCollapse(categoryKey)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              width: "100%",
                              padding: "12px 0",
                              backgroundColor: "transparent",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "1rem",
                              color: "#555",
                              fontWeight: "600",
                              textAlign: "left",
                            }}
                          >
                            <span style={{ marginRight: "8px" }}>
                              {isCategoryExpanded ? "▼" : "▶"}
                            </span>
                            {category}
                          </button>

                          {/* Category Content */}
                          {isCategoryExpanded && (
                            <div style={{ marginLeft: "0px" }}>
                              {/* Primary Actions */}
                              {primaryActions.map((action) =>
                                action.children ? (
                                  <NavigationItem
                                    key={action.id}
                                    item={action}
                                    level={0}
                                    activeMethod={activeMethod}
                                    expandedCategories={expandedCategories}
                                    toggleCategoryCollapse={
                                      toggleCategoryCollapse
                                    }
                                    location={location}
                                  />
                                ) : (
                                  <Link
                                    key={action.id}
                                    to={action.path || ""}
                                    style={{
                                      display: "block",
                                      padding: "10px 15px",
                                      marginBottom: "4px",
                                      borderRadius: "4px",
                                      cursor: "pointer",
                                      backgroundColor:
                                        activeMethod === action.id
                                          ? "#3b82f6"
                                          : "#ffffff",
                                      color:
                                        activeMethod === action.id
                                          ? "#ffffff"
                                          : "#333333",
                                      border: `1px solid ${
                                        activeMethod === action.id
                                          ? "#3b82f6"
                                          : "#dddddd"
                                      }`,
                                      transition: "all 0.2s",
                                      width: "100%",
                                      textAlign: "left",
                                      fontWeight: "500",
                                      textDecoration: "none",
                                    }}
                                  >
                                    {action.name}
                                  </Link>
                                )
                              )}

                              {/* Secondary Actions - Collapsible Tree */}
                              {hasSecondaryActions && (
                                <>
                                  {/* Toggle Button for Secondary Actions */}
                                  <button
                                    onClick={() =>
                                      toggleCategoryCollapse(secondaryKey)
                                    }
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      width: "100%",
                                      padding: "8px 15px",
                                      marginTop: "8px",
                                      marginBottom: "4px",
                                      backgroundColor: "transparent",
                                      border: "1px solid #e0e0e0",
                                      borderRadius: "4px",
                                      cursor: "pointer",
                                      fontSize: "0.85rem",
                                      color: "#666",
                                      fontWeight: "600",
                                    }}
                                  >
                                    <span style={{ marginRight: "8px" }}>
                                      {isSecondaryExpanded ? "▼" : "▶"}
                                    </span>
                                    Secondary Methods ({secondaryActions.length}
                                    )
                                  </button>

                                  {/* Secondary Actions List */}
                                  {isSecondaryExpanded &&
                                    secondaryActions.map((action) => (
                                      <div
                                        key={action.id}
                                        style={{ marginBottom: "4px" }}
                                      >
                                        <Link
                                          to={action.path || ""}
                                          style={{
                                            display: "block",
                                            padding: "8px 15px",
                                            paddingLeft: "35px", // Indent to show hierarchy
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            backgroundColor:
                                              activeMethod === action.id
                                                ? "#3b82f6"
                                                : "#f8f9fa",
                                            color:
                                              activeMethod === action.id
                                                ? "#ffffff"
                                                : "#333333",
                                            border: `1px solid ${
                                              activeMethod === action.id
                                                ? "#3b82f6"
                                                : "#e9ecef"
                                            }`,
                                            borderLeft: `3px solid #fbbf24`, // Visual indicator for dependency
                                            transition: "all 0.2s",
                                            width: "100%",
                                            textAlign: "left",
                                            fontWeight: "500",
                                            textDecoration: "none",
                                            fontSize: "0.9rem",
                                          }}
                                        >
                                          {action.name}
                                        </Link>
                                      </div>
                                    ))}
                                </>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                }
              );
            })()}
          </div>
        </div>

        {/* Content area */}
        <div
          className="content"
          style={{
            flex: 1,
            padding: "20px",
            overflowY: "auto",
          }}
        >
          <Outlet context={contextValue} />
        </div>
      </div>
    </MainLayout>
  );
};

export default HomePage;
