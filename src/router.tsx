import { createAuthManager } from "@lit-protocol/auth";
import { createLitClient } from "@lit-protocol/lit-client";
import {
  createBrowserRouter,
  Outlet,
  useOutletContext,
} from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { HomePage } from "./pages";
import DiscordAuthTab from "./tabs/ProgrammableKeys/PKPs/AuthMethods/AuthMethodProviders/DiscordAuthTab";
import GoogleAuthTab from "./tabs/ProgrammableKeys/PKPs/AuthMethods/AuthMethodProviders/GoogleAuthTab";
import WebAuthnTab from "./tabs/ProgrammableKeys/PKPs/AuthMethods/AuthMethodProviders/WebAuthnTab";
import EoaAuthTab from "./tabs/ProgrammableKeys/PKPs/AuthMethods/AuthMethodProviders/EoaAuthTab";
import StytchEmailOtpAuthTab from "./tabs/ProgrammableKeys/PKPs/AuthMethods/AuthMethodProviders/StytchEmailOtpAuthTab";
import StytchSmsOtpAuthTab from "./tabs/ProgrammableKeys/PKPs/AuthMethods/AuthMethodProviders/StytchSmsOtpAuthTab";
import StytchWhatsAppOtpAuthTab from "./tabs/ProgrammableKeys/PKPs/AuthMethods/AuthMethodProviders/StytchWhatsAppOtpAuthTab";
import CustomAuthTab from "./tabs/ProgrammableKeys/PKPs/AuthMethods/CustomAuthTab";
import LitAuthProviderDemoTab from "./tabs/LearningLit/LitAuthProviderDemoTab";
import EncryptionQuickStart from "./tabs/EncryptionAccessControl/QuickStart";
import SetupLitClientTab from "./tabs/BuildingWithLit/SetupLitClientTab";
import SetupAuthManagerTab from "./tabs/BuildingWithLit/SetupAuthManagerTab";
import SetupAuthServicesTab from "./tabs/BuildingWithLit/SetupAuthServicesTab";
import EoaNativeTab from "./tabs/EoaNativeTab";
import StoragePluginsTab from "./tabs/GettingStarted/StoragePluginsTab";
import StytchTotpAuthTab from "./tabs/ProgrammableKeys/PKPs/AuthMethods/AuthMethodProviders/2fa/StytchTotpAuthTab";
import PaymentManagerTab from "./tabs/PaymentManagerTab";
import HomePageTab from "./tabs/HomePageTab";
import WhatIsLitTab from "./tabs/LearningLit/WhatIsLitTab";
import HowItWorksTab from "./tabs/LearningLit/HowItWorksTab";
import GettingStartedTab from "./tabs/BuildingWithLit/GettingStartedTab";
import ProgrammableKeysOverview from "./tabs/ProgrammableKeys/Overview";
import PkpGettingStarted from "./tabs/ProgrammableKeys/PKPs/GettingStarted";
import SecurityOverviewTab from "./tabs/LearningLit/Security/Overview";
import NodeArchitectureTab from "./tabs/LearningLit/Security/NodeArchitecture";
import KeyGenerationTab from "./tabs/LearningLit/Security/KeyGeneration";
import OnChainCoordinationTab from "./tabs/LearningLit/Security/OnChainCoordination";
import CommunicatingWithNodes from "./tabs/LearningLit/Security/CommunicatingWithNodes";
import CryptoeconomicSecurity from "./tabs/LearningLit/Security/CryptoeconomicSecurity";
import BackupAndRecovery from "./tabs/LearningLit/Security/BackupAndRecovery";
import PKPPermissions from "./tabs/ProgrammableKeys/PKPs/ViewPkpInfo/PKPPermissions";
import PKPsByAddress from "./tabs/ProgrammableKeys/PKPs/ViewPkpInfo/PKPsByAddress";
import PKPsByAuth from "./tabs/ProgrammableKeys/PKPs/ViewPkpInfo/PKPsByAuth";
import AddRemoveAuthMethods from "./tabs/ProgrammableKeys/PKPs/AuthMethods/AddRemoveAuthMethods";
import SigningRaw from "./tabs/ProgrammableKeys/PKPs/PKPSigning/SigningRaw";
import PkpSignEth from "./tabs/ProgrammableKeys/PKPs/PKPSigning/SigningEth";
import PkpSignBtc from "./tabs/ProgrammableKeys/PKPs/PKPSigning/SigningBtc";
import ConnectingToDApp from "./tabs/ProgrammableKeys/PKPs/ConnectingToDApp";
import EncryptionAccessControlOverview from "./tabs/EncryptionAccessControl/Overview";
import BooleanLogic from "./tabs/EncryptionAccessControl/AccessControlConditions/BooleanLogic";

// Create a type for the context
type ContextType = {
  getDependencyStatus: () => {
    litClient: boolean;
    authManager: boolean;
    // walletClient?: boolean;
  };
  areDependenciesLoaded: () => boolean;
  authContext: any;
  activeMethod: string;
  setAuthContext: (authContext: any) => void;
  setActiveMethod: (method: string) => void;
  setStatus: (status: string) => void;
  assertDependenciesLoaded: () => {
    authManager: Awaited<ReturnType<typeof createAuthManager>>;
    litClient: Awaited<ReturnType<typeof createLitClient>>;
    // walletClient?: any;
  };
  siteAuthConfig: any;
  canMintPkp?: () => boolean;
  loading?: boolean;
  pkpInfo?: any;
  signature?: any;
  setPkpInfo?: (pkpInfo: any) => void;
  setSignature?: (signature: any) => void;
  setLoading?: (loading: boolean) => void;
  error?: string | null;
  showError?: (errorMessage: string, autoHide?: boolean) => void;
  clearError?: () => void;
  isErrorVisible?: boolean;
};

// Create a layout component that provides context to the routes
export const AppLayout = () => {
  return (
    <MainLayout>
      <div
        className="doc-layout"
        style={{
          display: "flex",
          height: "100vh",
          margin: "0 auto",
        }}
      >
        {/* Sidebar will be rendered in the index page */}
        <Outlet />
      </div>
    </MainLayout>
  );
};

// Define the routes - HomePage will handle the layout and context
export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    children: [
      {
        index: true,
        element: <HomePageTab />,
      },

      // Learning Lit
      {
        path: "learning-lit/what-is-lit",
        element: <WhatIsLitTab />,
      },
      {
        path: "learning-lit/how-it-works",
        element: <HowItWorksTab />,
      },
      {
        path: "learning-lit/security",
        element: <SecurityOverviewTab />,
      },
      {
        path: "learning-lit/security/node-architecture",
        element: <NodeArchitectureTab />,
      },
      {
        path: "learning-lit/security/key-generation",
        element: <KeyGenerationTab />,
      },
      {
        path: "learning-lit/security/on-chain-coordination",
        element: <OnChainCoordinationTab />,
      },
      {
        path: "learning-lit/security/communicating-with-nodes",
        element: <CommunicatingWithNodes />,
      },
      {
        path: "learning-lit/security/cryptoeconomic-security",
        element: <CryptoeconomicSecurity />,
      },
      {
        path: "learning-lit/security/backup-and-recovery",
        element: <BackupAndRecovery />,
      },
      {
        path: "learning-lit/demo",
        element: <LitAuthProviderDemoTab />,
      },

      // Building With Lit
      {
        path: "building-with-lit/setup-lit-client",
        element: <SetupLitClientTab />,
      },
      {
        path: "building-with-lit/setup-auth-manager",
        element: <SetupAuthManagerTab />,
      },
      {
        path: "building-with-lit/setup-auth-services",
        element: <SetupAuthServicesTab />,
      },
      {
        path: "building-with-lit/getting-started",
        element: <GettingStartedTab />,
      },
      {
        path: "storage-plugins",
        element: <StoragePluginsTab />,
      },

      // Programmable Keys
      {
        path: "programmable-keys/overview",
        element: <ProgrammableKeysOverview />,
      },
      {
        path: "programmable-keys/pkps/getting-started",
        element: <PkpGettingStarted />,
      },
      // PKP Auth Methods
      {
        path: "programmable-keys/pkps/auth-methods/eoa-native",
        element: <EoaNativeTab />,
      },
      {
        path: "programmable-keys/pkps/auth-methods/google",
        element: <GoogleAuthTab />,
      },
      {
        path: "programmable-keys/pkps/auth-methods/discord",
        element: <DiscordAuthTab />,
      },
      {
        path: "programmable-keys/pkps/auth-methods/webauthn",
        element: <WebAuthnTab />,
      },
      {
        path: "programmable-keys/pkps/auth-methods/eoa",
        element: <EoaAuthTab />,
      },
      {
        path: "programmable-keys/pkps/auth-methods/stytch-email-otp",
        element: <StytchEmailOtpAuthTab />,
      },
      {
        path: "programmable-keys/pkps/auth-methods/stytch-sms-otp",
        element: <StytchSmsOtpAuthTab />,
      },
      {
        path: "programmable-keys/pkps/auth-methods/stytch-whatsapp-otp",
        element: <StytchWhatsAppOtpAuthTab />,
      },
      {
        path: "programmable-keys/pkps/auth-methods/stytch-totp",
        element: <StytchTotpAuthTab />,
      },
      {
        path: "programmable-keys/pkps/auth-methods/custom-auth",
        element: <CustomAuthTab />,
      },
      {
        path: "payment-manager",
        element: <PaymentManagerTab />,
      },
      // PKP View Methods
      {
        path: "programmable-keys/pkps/view/pkp-permissions",
        element: <PKPPermissions />,
      },
      {
        path: "programmable-keys/pkps/view/pkps-by-address",
        element: <PKPsByAddress />,
      },
      {
        path: "programmable-keys/pkps/view/pkps-by-auth",
        element: <PKPsByAuth />,
      },
      // Add/Remove Auth Methods
      {
        path: "programmable-keys/pkps/auth-methods/add-remove",
        element: <AddRemoveAuthMethods />,
      },
      // PKP Signing
      {
        path: "programmable-keys/pkps/signing/raw",
        element: <SigningRaw />,
      },
      {
        path: "programmable-keys/pkps/signing/eth",
        element: <PkpSignEth />,
      },
      {
        path: "programmable-keys/pkps/signing/btc",
        element: <PkpSignBtc />,
      },
      // Connecting PKPs to dApps
      {
        path: "programmable-keys/pkps/connecting-to-dapps",
        element: <ConnectingToDApp />,
      },

      // Encryption and Access Control
      {
        path: "encryption/overview",
        element: <EncryptionAccessControlOverview />,
      },
      {
        path: "encryption/quickstart",
        element: <EncryptionQuickStart />,
      },
      {
        path: "encryption/access-control/boolean-logic",
        element: <BooleanLogic />,
      },
    ],
  },
]);

// Export the context hook
export function useAppContext() {
  return useOutletContext<ContextType>();
}
