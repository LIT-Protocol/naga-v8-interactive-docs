/**
 * paymentHelpers.ts
 *
 * Utility functions for PaymentManager operations.
 * Includes ETH/Wei conversions, time formatting, transaction status checking, and validation.
 */

// ETH to Wei conversion utilities
export const ETH_TO_WEI = 10n ** 18n;

/**
 * Convert ETH string to Wei bigint
 * @param ethAmount ETH amount as string (e.g., "0.1")
 * @returns Wei amount as bigint
 */
export function ethToWei(ethAmount: string): bigint {
  if (!ethAmount || ethAmount === "0") return 0n;
  
  // Handle decimal places properly
  const [whole, decimal = ""] = ethAmount.split(".");
  const wholePart = BigInt(whole || "0");
  
  // Pad decimal part to 18 digits
  const decimalPart = decimal.padEnd(18, "0").slice(0, 18);
  const decimalBigInt = BigInt(decimalPart);
  
  return wholePart * ETH_TO_WEI + decimalBigInt;
}

/**
 * Convert Wei bigint to ETH string
 * @param weiAmount Wei amount as bigint
 * @param decimals Number of decimal places to show (default: 6)
 * @returns ETH amount as string
 */
export function weiToEth(weiAmount: bigint, decimals: number = 6): string {
  if (weiAmount === 0n) return "0";
  
  const wholePart = weiAmount / ETH_TO_WEI;
  const decimalPart = weiAmount % ETH_TO_WEI;
  
  if (decimalPart === 0n) {
    return wholePart.toString();
  }
  
  // Convert decimal part to string with proper padding
  const decimalStr = decimalPart.toString().padStart(18, "0");
  const truncatedDecimal = decimalStr.slice(0, decimals).replace(/0+$/, "");
  
  if (truncatedDecimal === "") {
    return wholePart.toString();
  }
  
  return `${wholePart}.${truncatedDecimal}`;
}

/**
 * Format time duration in seconds to human-readable format
 * @param seconds Time in seconds
 * @returns Formatted time string (e.g., "1h 30m 45s")
 */
export function formatTimeDuration(seconds: string | number): string {
  const secs = typeof seconds === "string" ? parseInt(seconds) : seconds;
  
  if (secs <= 0) return "0s";
  
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const remainingSeconds = secs % 60;
  
  const parts: string[] = [];
  
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);
  
  return parts.join(" ");
}

/**
 * Format timestamp to human-readable date string
 * @param timestamp Unix timestamp in seconds (string or number)
 * @returns Formatted date string
 */
export function formatTimestamp(timestamp: string | number): string {
  const ts = typeof timestamp === "string" ? parseInt(timestamp) : timestamp;
  return new Date(ts * 1000).toLocaleString();
}

/**
 * Check if an Ethereum address is valid
 * @param address Ethereum address to validate
 * @returns true if valid, false otherwise
 */
export function isValidEthereumAddress(address: string): boolean {
  if (!address) return false;
  
  // Check if it starts with 0x and has 42 characters total
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return false;
  
  return true;
}

/**
 * Validate ETH amount string
 * @param amount ETH amount string to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateEthAmount(amount: string): { isValid: boolean; error?: string } {
  if (!amount || amount.trim() === "") {
    return { isValid: false, error: "Amount is required" };
  }
  
  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount)) {
    return { isValid: false, error: "Invalid amount format" };
  }
  
  if (numAmount <= 0) {
    return { isValid: false, error: "Amount must be greater than 0" };
  }
  
  if (numAmount > 1000) {
    return { isValid: false, error: "Amount too large (max: 1000 ETH)" };
  }
  
  // Check for too many decimal places
  const decimalPlaces = (amount.split(".")[1] || "").length;
  if (decimalPlaces > 18) {
    return { isValid: false, error: "Too many decimal places (max: 18)" };
  }
  
  return { isValid: true };
}

/**
 * Truncate long transaction hash for display
 * @param hash Transaction hash
 * @param startLength Number of characters to show at start (default: 6)
 * @param endLength Number of characters to show at end (default: 6)
 * @returns Truncated hash string
 */
export function truncateHash(hash: string, startLength: number = 6, endLength: number = 6): string {
  if (!hash || hash.length <= startLength + endLength) return hash;
  
  return `${hash.slice(0, startLength)}...${hash.slice(-endLength)}`;
}

/**
 * Format balance display with proper units
 * @param balance Balance info object
 * @returns Formatted balance display object
 */
export function formatBalanceDisplay(balance: {
  totalBalance: string;
  availableBalance: string;
  raw: { totalBalance: bigint; availableBalance: bigint };
}) {
  return {
    total: {
      eth: balance.totalBalance,
      wei: balance.raw.totalBalance.toString(),
      formatted: `${balance.totalBalance} ETH`
    },
    available: {
      eth: balance.availableBalance,
      wei: balance.raw.availableBalance.toString(),
      formatted: `${balance.availableBalance} ETH`
    },
    locked: {
      wei: (balance.raw.totalBalance - balance.raw.availableBalance).toString(),
      eth: weiToEth(balance.raw.totalBalance - balance.raw.availableBalance),
      formatted: `${weiToEth(balance.raw.totalBalance - balance.raw.availableBalance)} ETH`
    }
  };
}

/**
 * Check if withdrawal can be executed based on timing
 * @param canExecuteInfo Information about withdrawal execution status
 * @returns Object with execution status and formatted time remaining
 */
export function getWithdrawExecutionStatus(canExecuteInfo: {
  canExecute: boolean;
  timeRemaining: string;
}) {
  return {
    canExecute: canExecuteInfo.canExecute,
    timeRemaining: formatTimeDuration(canExecuteInfo.timeRemaining),
    message: canExecuteInfo.canExecute 
      ? "✅ Ready to execute withdrawal"
      : `⏱️ ${formatTimeDuration(canExecuteInfo.timeRemaining)} remaining`
  };
}

/**
 * Generate a sample withdrawal delay message
 * @param delayInfo Withdrawal delay information
 * @returns Formatted delay message
 */
export function formatWithdrawDelayInfo(delayInfo: {
  delayHours: string;
  delaySeconds: string;
}) {
  const hours = parseInt(delayInfo.delayHours);
  const message = hours === 1 
    ? "All withdrawals have a 1-hour security delay"
    : `All withdrawals have a ${hours}-hour security delay`;
  
  return {
    message,
    hours: delayInfo.delayHours,
    seconds: delayInfo.delaySeconds,
    formatted: `${delayInfo.delayHours} hours`
  };
}

/**
 * Create a payment operation result formatter
 * @param result Transaction result from PaymentManager
 * @returns Formatted result object
 */
export function formatPaymentResult(result: { hash: string; receipt?: any }) {
  return {
    hash: result.hash,
    truncatedHash: truncateHash(result.hash),
    explorerUrl: `https://chain.litprotocol.com/tx/${result.hash}`,
    receipt: result.receipt,
    timestamp: new Date().toISOString()
  };
}

/**
 * Payment operation error handler
 * @param error Error object
 * @returns Formatted error message
 */
export function formatPaymentError(error: any): string {
  if (typeof error === "string") return error;
  
  if (error?.message) {
    // Handle common error patterns
    if (error.message.includes("insufficient funds")) {
      return "Insufficient funds for this transaction";
    }
    
    if (error.message.includes("user rejected")) {
      return "Transaction was rejected by user";
    }
    
    if (error.message.includes("network")) {
      return "Network error occurred. Please try again.";
    }
    
    return error.message;
  }
  
  if (error?.reason) {
    return error.reason;
  }
  
  return "An unexpected error occurred";
}

/**
 * Constants for payment operations
 */
export const PAYMENT_CONSTANTS = {
  // Default amounts for demo purposes
  DEFAULT_DEPOSIT_AMOUNT: "0.01",
  DEFAULT_WITHDRAW_AMOUNT: "0.01",
  
  // Limits
  MIN_AMOUNT: "0.001",
  MAX_AMOUNT: "1000",
  
  // Timing
  REFRESH_INTERVAL: 10000, // 10 seconds
  TX_CONFIRMATION_DELAY: 2000, // 2 seconds
  
  // UI
  TRUNCATE_HASH_LENGTH: 8,
  BALANCE_DECIMALS: 6,
} as const;

/**
 * Type definitions for PaymentManager operations
 */
export interface PaymentManagerBalance {
  totalBalance: string;
  availableBalance: string;
  raw: {
    totalBalance: bigint;
    availableBalance: bigint;
  };
}

export interface PaymentManagerWithdrawInfo {
  isPending: boolean;
  amount: string;
  timestamp: string;
  raw: {
    amount: bigint;
    timestamp: bigint;
  };
}

export interface PaymentManagerDelayInfo {
  delaySeconds: string;
  delayHours: string;
  raw: bigint;
}

export interface PaymentManagerCanExecuteInfo {
  canExecute: boolean;
  timeRemaining: string;
  withdrawRequest: PaymentManagerWithdrawInfo;
}

export interface PaymentManagerTransactionResult {
  hash: string;
  receipt?: any;
}