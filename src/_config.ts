/**
 * Application Configuration
 *
 * This file centralizes all configurable settings for the application.
 * Modify these values to customize the application behavior.
 */

import { nagaDev } from "@lit-protocol/networks";

// WalletConnect Configuration
export const WALLET_CONNECT = {
  projectId: "YOUR_WALLETCONNECT_PROJECT_ID", // Replace with your actual WalletConnect Project ID
};

// Application Information
export const APP_INFO = {
  copyright: "Lit Protocol",
  network: "naga-dev",
  networkModule: nagaDev,
  // litLoginServer: "https://login.litgateway.com",
  litLoginServer: import.meta.env.VITE_LOGIN_SERVICE_URL || 'https://login.litgateway.com',

  // 'https://naga-dev-auth-service.getlit.dev'
  litAuthServer: import.meta.env.VITE_AUTH_SERVICE_URL,
  faucetUrl: "https://chronicle-yellowstone-faucet.getlit.dev/",
  defaultPrivateKey:
    "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
} as const;

// Blockchain Network Configuration
export const NETWORKS = {
  chronicleYellowstone: {
    id: 175188,
    name: "Chronicle Yellowstone",
    network: "chronicle-yellowstone",
    iconUrl: "/logo.svg", // Add icon path here
    iconBackground: "#27233B",
  },
  enabled: [
    "Chronicle Yellowstone", // This must match the name above
    // "mainnet",
    // "sepolia",
    // "base",
    "arbitrum",
  ],
};

// Wallet Configuration
export const WALLETS = {
  recommended: ["rainbow", "metamask", "coinbase"],
  others: ["injected", "walletConnect"],
};

// Layout Configuration
export const LAYOUT = {
  maxWidth: "48rem", // max-w-3xl
  contentPadding: "24px",
};

// Application Features Toggle
export const FEATURES = {
  showWalletBalance: true,
  enableFlameAnimation: true,
};
