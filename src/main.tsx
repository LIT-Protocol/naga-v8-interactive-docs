import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./styles/global.css";
import "@rainbow-me/rainbowkit/styles.css";
import { WagmiProvider, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { routes } from "./utils/routes";
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

const queryClient = new QueryClient();

// Get Chronicle Yellowstone chain configuration
// const chronicleYellowstone = getChain("chronicle-yellowstone");
// const yellowstoneChainConfig = chronicleYellowstone.chainConfig();

// Create a proper Chain object for Chronicle Yellowstone - type cast to avoid type errors
// const chronicleChain = {
//   ...yellowstoneChainConfig,
//   ...NETWORKS.chronicleYellowstone,
// } as any; // Type cast to avoid chain type errors

// Create router from routes configuration
const router = createBrowserRouter(routes);

// Configure custom RainbowKit theme with Lit Protocol branding
const litTheme = darkTheme({
  accentColor: THEME.rainbowKit.accentColor,
  accentColorForeground: THEME.rainbowKit.accentColorForeground,
  borderRadius: THEME.rainbowKit.borderRadius as "medium",
  fontStack: THEME.rainbowKit.fontStack as "system",
  overlayBlur: THEME.rainbowKit.overlayBlur as "small",
});

const defaultConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
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
