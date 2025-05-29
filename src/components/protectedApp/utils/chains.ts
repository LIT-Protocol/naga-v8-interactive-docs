/**
 * Supported Chains Configuration
 * 
 * Configuration for all supported blockchain networks including local development
 */

import { ChainConfig } from '../types';

// Configuration constants
export const SUPPORTED_CHAIN_ID = 2888; // Naga chain ID (legacy reference)

export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  local: {
    id: 31337,
    name: "Local Development Chain",
    symbol: "ETH",
    rpcUrl: "http://127.0.0.1:8545",
    explorerUrl: "#", // No explorer for local chain
    litIdentifier: "local",
    testnet: true,
  },
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