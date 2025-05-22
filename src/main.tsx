import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./styles/global.css";
import "@rainbow-me/rainbowkit/styles.css";
import { WagmiProvider, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { mainnet, sepolia, base, arbitrum } from "wagmi/chains";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  rainbowWallet,
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig } from "wagmi";
import { APP_INFO, NETWORKS, THEME, WALLET_CONNECT, WALLETS } from "./_config";
import { router } from "./router";

const queryClient = new QueryClient();

// Define the Chronicle Testnet (nagaDev)
const chronicleTestnet = {
  id: 175188,
  name: 'Chronicle Testnet',
  nativeCurrency: { name: 'Test Lit Token', symbol: 'tLIT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://chain-rpc.litprotocol.com/http'] },
    public: { http: ['https://chain-rpc.litprotocol.com/http'] },
  },
  blockExplorers: {
    default: { name: 'Chronicle Explorer', url: 'https://chain.litprotocol.com' },
  },
  testnet: true,
};

// Create a proper Chain object for Chronicle Yellowstone - type cast to avoid type errors
// const chronicleChain = {
//   ...yellowstoneChainConfig,
//   ...NETWORKS.chronicleYellowstone,
// } as any; // Type cast to avoid chain type errors

// Configure custom RainbowKit theme with Lit Protocol branding
const litTheme = darkTheme({
  accentColor: THEME.rainbowKit.accentColor,
  accentColorForeground: THEME.rainbowKit.accentColorForeground,
  borderRadius: THEME.rainbowKit.borderRadius as "medium",
  fontStack: THEME.rainbowKit.fontStack as "system",
  overlayBlur: THEME.rainbowKit.overlayBlur as "small",
});

const defaultConfig = createConfig({
  chains: [mainnet, chronicleTestnet],
  transports: {
    [mainnet.id]: http(),
    [chronicleTestnet.id]: http(),
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={defaultConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={litTheme}>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
