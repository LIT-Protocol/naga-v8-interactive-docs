import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import EoaAuthTab from "./tabs/EoaAuthTab";
import GoogleAuthTab from "./tabs/GoogleAuthTab";
import DiscordAuthTab from "./tabs/DiscordAuthTab";
import WebAuthnTab from "./tabs/WebAuthnTab";
import { MintAndUsePkp } from "./tabs";
import { Outlet, useOutletContext } from "react-router-dom";
import { createAuthManager } from "@lit-protocol/auth";
import { createLitClient } from "@lit-protocol/lit-client";
import { HomePage } from "./pages";

// Create a type for the context
type ContextType = {
  getDependencyStatus: () => {
    litClient: boolean;
    authManager: boolean;
    walletClient?: boolean;
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
    walletClient?: any;
  };
  siteAuthConfig: any;
  canMintPkp?: () => boolean;
  loading?: boolean;
  pkpInfo?: any;
  signature?: any;
  setPkpInfo?: (pkpInfo: any) => void;
  setSignature?: (signature: any) => void;
  setLoading?: (loading: boolean) => void;
};

// Create a layout component that provides context to the routes
export const AppLayout = ({ children }: { children?: React.ReactNode }) => {
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
        element: <Navigate to="/eoa" replace />,
      },
      {
        path: "eoa",
        element: <EoaAuthTab />,
      },
      {
        path: "pkp",
        element: <MintAndUsePkp />,
      },
      {
        path: "google-auth",
        element: <GoogleAuthTab />,
      },
      {
        path: "discord-auth",
        element: <DiscordAuthTab />,
      },
      {
        path: "webauthn-auth",
        element: <WebAuthnTab />,
      },
    ],
  },
]);

// Export the context hook
export function useAppContext() {
  return useOutletContext<ContextType>();
} 