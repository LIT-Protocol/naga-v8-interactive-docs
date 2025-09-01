/**
 * useLitServiceSetup.ts
 *
 * React hook for setting up Lit Protocol services with proper configuration.
 * Handles network setup, auth manager creation, and storage plugin configuration.
 */

import React, { useState, useCallback, useRef } from "react";
import { createLitClient } from "@lit-protocol/lit-client";
import { createAuthManager, storagePlugins } from "@lit-protocol/auth";
import { APP_INFO } from "../_config";

// Configuration constants at the top
const DEFAULT_APP_NAME = "lit-auth-app";
const DEFAULT_NETWORK_NAME = APP_INFO.network;
const DEFAULT_NETWORK = APP_INFO.networkModule;

interface LitServiceSetupConfig {
  appName?: string;
  networkName?: string;
  network?: any;
  autoSetup?: boolean;
}

interface LitServices {
  litClient: any;
  authManager: any;
}

interface UseLitServiceSetupReturn {
  services: LitServices | null;
  isInitializing: boolean;
  error: string | null;
  setupServices: () => Promise<LitServices>;
  clearServices: () => void;
  isReady: boolean;
}

/**
 * Hook for setting up Lit Protocol services
 *
 * @param config Configuration options for the setup
 * @returns Object containing services, setup state, and control functions
 */
export const useLitServiceSetup = (
  config: LitServiceSetupConfig = {}
): UseLitServiceSetupReturn => {
  const [services, setServices] = useState<LitServices | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref to track if services are being initialized to prevent multiple calls
  const initializingRef = useRef(false);

  const setupServices = useCallback(async (): Promise<LitServices> => {
    // Prevent multiple simultaneous initialization attempts
    if (initializingRef.current) {
      throw new Error("Services are already being initialized");
    }

    try {
      initializingRef.current = true;
      setIsInitializing(true);
      setError(null);

      console.log("🚀 Starting Lit Protocol service setup...");

      // Step 1: Create Lit Client with singleton pattern
      console.log("📡 Creating Lit Client...");
      const litClient = await createLitClient({
        network: config.network || DEFAULT_NETWORK,
      });
      console.log("✅ Lit Client created successfully");

      // Step 2: Create Auth Manager with storage configuration
      console.log("🔐 Creating Auth Manager...");
      const authManager = createAuthManager({
        storage: storagePlugins.localStorage({
          appName: config.appName || DEFAULT_APP_NAME,
          networkName: config.networkName || DEFAULT_NETWORK_NAME,
        }),
      });
      console.log("✅ Auth Manager created successfully");

      const newServices = { litClient, authManager };
      setServices(newServices);

      console.log("🎉 All Lit Protocol services initialized successfully");
      return newServices;
    } catch (err: any) {
      const errorMessage = `Failed to initialize Lit Protocol services: ${
        err.message || err
      }`;
      console.error("❌", errorMessage, err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsInitializing(false);
      initializingRef.current = false;
    }
  }, [config]);

  const clearServices = useCallback(() => {
    console.log("🧹 Clearing Lit Protocol services...");
    setServices(null);
    setError(null);
  }, []);

  // Auto-setup on mount if requested
  React.useEffect(() => {
    if (config.autoSetup && !services && !isInitializing) {
      setupServices().catch(console.error);
    }
  }, [config.autoSetup, services, isInitializing, setupServices]);

  return {
    services,
    isInitializing,
    error,
    setupServices,
    clearServices,
    isReady: !!(services?.litClient && services?.authManager),
  };
};
