/**
 * LitAuthProviderDemoTab.tsx
 *
 * Demonstrates the LitAuthProvider modal pattern - shows a compact authentication modal
 * that can be closed with ESC and allows users to access the main app once authenticated.
 */

import React from "react";
import { LitAuthProvider } from "../lit-login-modal/LitAuthProvider";
import ProtectedApp from "../components/ProtectedApp";
import { DisplayCode } from "../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../components/layout/GreyboardWhiteBgContainer";
import ProtectedAppRefactored from "../components/protectedApp/examples/ProtectedAppRefactored";
import ProtectedAppComplete from "../components/protectedApp/examples/ProtectedAppComplete";
import { APP_INFO } from "../_config";

const LitAuthProviderDemoTab: React.FC = () => {
  const usageCode = `import { LitAuthProvider, useLitAuth } from './contexts/LitAuthProvider';

function App() {
  return (
    <LitAuthProvider
      appName="my-awesome-app"
      networkName="naga-dev"
      autoSetup={false} // Services setup only when user initiates auth
    >
      <MyApp />
    </LitAuthProvider>
  );
}

function MyApp() {
  const { user, logout, services, initiateAuthentication } = useLitAuth();
  
  if (!user) {
    return (
      <div>
        <h1>Welcome! Please authenticate to continue.</h1>
        {/* initiateAuthentication handles both service setup and modal display */}
        <button onClick={initiateAuthentication}>Login</button>
      </div>
    );
  }
  
  return (
    <div>
      <h1>Welcome {user.method} user!</h1>
      <p>PKP: {user.pkpInfo.pubkey}</p>
      <button onClick={logout}>Logout</button>
      {/* Your app content here */}
    </div>
  );
}`;

  const authMethodsCode = `// All implemented authentication methods
const authMethods = [
  // OAuth Methods (Direct)
  { id: 'google', name: 'Google', available: true },
  { id: 'discord', name: 'Discord', available: true }, 
  
  // Web3 Methods
  { id: 'eoa', name: 'Web3 Wallet', available: true },
  
  // WebAuthn/Passkey
  { id: 'webauthn', name: 'WebAuthn', available: true },
  
  // Stytch OTP Methods (Multi-step)
  { id: 'stytch-email', name: 'Email OTP', available: true },
  { id: 'stytch-sms', name: 'SMS OTP', available: true },
  { id: 'stytch-whatsapp', name: 'WhatsApp OTP', available: true },
  
  // Stytch 2FA
  { id: 'stytch-totp', name: 'Authenticator', available: true }
];

// The modal layout adapts to fit all methods:
// - Top 4 in a 2x2 grid (larger buttons)
// - Bottom 4 in a 4x1 grid (smaller buttons)`;

  return (
    <div className="tab-content" style={{ marginTop: "-20px" }}>
      {/* <GreyBoarderWhiteBgContainer style={{ marginTop: "0px" }}>
        <h2>
          ❗️ This is just a demo. If you would like us to create a modal for
          this, we will do it 💪!
        </h2>
        <p>LMK at anson[@]litprotocol.com</p>
      </GreyBoarderWhiteBgContainer> */}

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
        {/* <h1>🚀 Lit Auth Provider - Modal Demo</h1> */}

        <GreyBoarderWhiteBgContainer>
          <div
            style={{
              border: "2px solid #e5e7eb",
              borderRadius: "12px",
              overflow: "hidden",
              backgroundColor: "#ffffff",
            }}
          >
            <div
              style={{
                padding: "12px 20px",
                backgroundColor: "#f9fafb",
                borderBottom: "1px solid #e5e7eb",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
              }}
            >
              🖼️ The Amazing App You Are Building
            </div>

            <div style={{ minHeight: "600px" }}>
              <LitAuthProvider
                appName="lit-auth-modal-demo"
                networkName={APP_INFO.network}
                autoSetup={false}
                storageKey="lit-auth-modal-demo"
              >
                {/* <ProtectedAppRefactored /> */}
                <ProtectedAppComplete />
              </LitAuthProvider>
            </div>
          </div>
        </GreyBoarderWhiteBgContainer>
      </div>
    </div>
  );
};

export default LitAuthProviderDemoTab;
