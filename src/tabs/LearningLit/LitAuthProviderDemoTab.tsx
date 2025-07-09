/**
 * LitAuthProviderDemoTab.tsx
 *
 * Demonstrates the LitAuthProvider modal pattern - shows a compact authentication modal
 * that can be closed with ESC and allows users to access the main app once authenticated.
 */

import React from "react";
import { LitAuthProvider } from "../../contexts/LitAuthProvider";
import { DisplayCode } from "../../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../../components/layout/GreyboardWhiteBgContainer";
import ProtectedAppComplete from "../../components/protectedApp/examples/ProtectedAppComplete";
import { Link } from "react-router-dom";

const LitAuthProviderDemoTab: React.FC = () => {
  const pageStyles = {
    container: {
      maxWidth: "1000px",
      margin: "0 auto",
      padding: "20px",
    },
    h1: {
      fontSize: "2.5rem",
      fontWeight: "700",
      color: "#1f2937",
      marginBottom: "24px",
    },
    h2: {
      fontSize: "2rem",
      fontWeight: "600",
      color: "#1f2937",
      marginBottom: "16px",
      borderBottom: "1px solid #e5e7eb",
      paddingBottom: "8px",
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: "600",
      color: "#374151",
      marginTop: "24px",
      marginBottom: "12px",
    },
    p: {
      fontSize: "1rem",
      lineHeight: "1.6",
      color: "#4b5563",
      marginBottom: "16px",
    },
    ul: {
      listStyleType: "disc",
      paddingLeft: "20px",
      marginBottom: "16px",
    },
    li: {
      marginBottom: "8px",
      color: "#4b5563",
    },
  };

  const usageCode = `import { LitAuthProvider, useLitAuth } from './contexts/LitAuthProvider';

function App() {
  return (
    <LitAuthProvider
      appName="my-awesome-app"
      networkName={import.meta.env.VITE_LIT_NETWORK || "naga-dev"}
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
    <div style={pageStyles.container}>
      <h1 style={pageStyles.h1}>Lit Auth Provider Modal Demo</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Introduction</h2>
        <p style={pageStyles.p}>
          This demo showcases the LitAuthProvider modal pattern - a compact
          authentication modal that can be closed with ESC and allows users to
          access the main app once authenticated.
        </p>
        <p style={pageStyles.p}>
          The demo below shows a complete application wrapped with
          LitAuthProvider. Try clicking the login button to see the
          authentication modal in action.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Demo Application</h2>
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
              networkName={import.meta.env.VITE_LIT_NETWORK || "naga-dev"}
              autoSetup={false}
              storageKey="lit-auth-modal-demo"
            >
              <ProtectedAppComplete />
            </LitAuthProvider>
          </div>
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Key Features</h2>
        <ul style={pageStyles.ul}>
          <li style={pageStyles.li}>
            <strong>Modal Authentication:</strong> Clean, focused authentication
            experience that doesn't disrupt your app's flow
          </li>
          <li style={pageStyles.li}>
            <strong>Multiple Auth Methods:</strong> Support for OAuth, Web3
            wallets, WebAuthn, and various OTP methods
          </li>
          <li style={pageStyles.li}>
            <strong>Session Management:</strong> Automatic handling of
            authentication state and session persistence
          </li>
          <li style={pageStyles.li}>
            <strong>Responsive Design:</strong> The modal adapts to different
            screen sizes and device types
          </li>
        </ul>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Implementation</h2>
        <p style={pageStyles.p}>
          The LitAuthProvider wraps your application and provides authentication
          context. Here's how to implement it in your own application:
        </p>

        <h3 style={pageStyles.h3}>Basic Setup</h3>
        <DisplayCode code={usageCode} language="typescript" />

        <h3 style={pageStyles.h3}>Available Authentication Methods</h3>
        <p style={pageStyles.p}>
          The LitAuthProvider supports multiple authentication methods that are
          automatically available in the modal:
        </p>
        <DisplayCode code={authMethodsCode} language="typescript" />
      </GreyBoarderWhiteBgContainer>

      {/* Next Steps */}
      <div
        style={{
          backgroundColor: "#f0f9ff",
          border: "1px solid #3b82f6",
          borderRadius: "8px",
          padding: "20px",
          marginTop: "20px",
        }}
      >
        <h3
          style={{ margin: "0 0 10px 0", color: "#1e40af", fontSize: "1.2rem" }}
        >
          🚀 Next Steps
        </h3>
        <p style={{ margin: "0", color: "#1e3a8a", lineHeight: "1.5" }}>
          Now that you've seen the LitAuthProvider in action, you're ready to
          start building with Lit Protocol! Head over to the{" "}
          <Link
            to="/building-with-lit/getting-started"
            style={{ color: "#3b82f6", textDecoration: "underline" }}
          >
            Getting Started
          </Link>{" "}
          guide to learn how to set up a Lit Client and get started with using
          Lit to build your own applications.
        </p>
      </div>
    </div>
  );
};

export default LitAuthProviderDemoTab;
