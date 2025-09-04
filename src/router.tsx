import { createAuthManager } from "@lit-protocol/auth";
import { createLitClient } from "@lit-protocol/lit-client";
import {
  createBrowserRouter,
  Outlet,
  useOutletContext,
} from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { HomePage } from "./pages";

import LoggedInDashboard from "./components/lit-logged-page/LoggedInDashboard";

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
      <div id="lit-auth-main-layout" className="doc-layout flex h-screen mx-auto">
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
        element: <LoggedInDashboard />,
      },
    ],
  },
]);

// Export the context hook
export function useAppContext() {
  return useOutletContext<ContextType>();
}
