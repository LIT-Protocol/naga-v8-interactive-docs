/**
 * SetupAuthServicesTab.tsx
 *
 * Demonstrates how to set up and configure your own Lit Auth Services.
 * Shows configuration for auth server, login server, and worker setup.
 */

import React from "react";
import { Link, useOutletContext } from "react-router-dom";
import { DisplayCode } from "../../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../../components/layout/GreyboardWhiteBgContainer";

interface TabContext {
  areDependenciesLoaded: () => boolean;
  showError: (error: string) => void;
  setStatus: (status: string) => void;
}

const SetupAuthServicesTab: React.FC = () => {
  const {} = useOutletContext<TabContext>();

  const mainExportsCode = `// Main exports from @lit-protocol/auth-services
import { 
  createLitAuthServer,    // Auth service for PKP operations
  createLitLoginServer,   // Login server for OAuth flows
  startAuthServiceWorker  // Background worker for job processing
} from "@lit-protocol/auth-services";`;

  const envConfigCode = `# ---------- LIT AUTH SERVICE ----------
# Network configuration (supports naga-dev, naga-test, naga)
NETWORK=naga-dev
LOG_LEVEL=debug

# Lit transaction sender settings
LIT_TXSENDER_RPC_URL=https://yellowstone-rpc.litprotocol.com
LIT_TXSENDER_PRIVATE_KEY=your_private_key

# Redis settings for job queue and caching
REDIS_URL=redis://user:pass@redis-host.com:12345
PORT=6380

# Rate limiting configuration
ENABLE_API_KEY_GATE=true
MAX_REQUESTS_PER_WINDOW=10
WINDOW_MS=10000

# Stytch configuration (for OTP services)
STYTCH_PUBLIC_TOKEN=your_stytch_public_token
STYTCH_SECRET=your_stytch_secret

# ---------- LIT LOGIN SERVER ----------
# OAuth provider credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret`;

  const authServerCode = `// Auth Server Setup
import { createLitAuthServer } from "@lit-protocol/auth-services";

const litAuthServer = createLitAuthServer({
  port: process.env.PORT || 6380,
  network: process.env.NETWORK || "naga-dev",
  litTxsenderRpcUrl: process.env.LIT_TXSENDER_RPC_URL,
  litTxsenderPrivateKey: process.env.LIT_TXSENDER_PRIVATE_KEY,
  enableApiKeyGate: process.env.ENABLE_API_KEY_GATE === "true",
});

// Start the auth server
await litAuthServer.start();`;

  const loginServerCode = `// Login Server Setup  
import { createLitLoginServer } from "@lit-protocol/auth-services";

const litLoginServer = createLitLoginServer({
  port: 3300,
  host: "0.0.0.0",
  stateExpirySeconds: 30,
  
  // OAuth provider configuration
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    },
  },
});

// Start the login server
await litLoginServer.start();`;

  const workerCode = `// Worker Setup
import { startAuthServiceWorker } from "@lit-protocol/auth-services";

// Start the background worker for processing PKP minting operations
await startAuthServiceWorker();

// The worker handles:
// - Background PKP minting operations (non-blocking)
// - Job queue processing with BullMQ
// - Redis connection management
// - Error handling and retry logic for minting jobs`;

  const runAllServicesCode = `// Running all services together
import { 
  createLitAuthServer,
  createLitLoginServer,
  startAuthServiceWorker 
} from "@lit-protocol/auth-services";

async function startAllServices() {
  try {
    // Start auth server
    const authServer = createLitAuthServer({
      port: process.env.PORT || 6380,
      network: process.env.NETWORK || "naga-dev",
      litTxsenderRpcUrl: process.env.LIT_TXSENDER_RPC_URL,
      litTxsenderPrivateKey: process.env.LIT_TXSENDER_PRIVATE_KEY,
      enableApiKeyGate: process.env.ENABLE_API_KEY_GATE === "true",
    });

    // Start login server
    const loginServer = createLitLoginServer({
      port: 3300,
      host: "0.0.0.0",
      stateExpirySeconds: 30,
      socialProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
        discord: {
          clientId: process.env.DISCORD_CLIENT_ID!,
          clientSecret: process.env.DISCORD_CLIENT_SECRET!,
        },
      },
    });

    // Start all services
    await Promise.all([
      authServer.start(),
      loginServer.start(),
      startAuthServiceWorker()
    ]);

    console.log("All Lit Auth Services started successfully!");
  } catch (error) {
    console.error("Failed to start services:", error);
    process.exit(1);
  }
}

startAllServices();`;

  const pageStyles = {
    h2: {
      fontSize: "2rem",
      fontWeight: "600",
      color: "#1f2937",
      marginBottom: "16px",
      borderBottom: "1px solid #e5e7eb",
      paddingBottom: "8px",
    },
  };

  return (
    <div style={{ maxWidth: "90%" }}>
      <h1>Setup Custom Auth Services</h1>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <div>
          <h2 style={pageStyles.h2}>Introduction</h2>
          <p style={{ color: "#666", fontSize: "16px", lineHeight: "1.6" }}>
            Create your own authentication infrastructure using the Lit Protocol
            Auth Services package. This provides three core services:
          </p>
          <ul>
            <li>Auth Server for PKP minting with various auth methods</li>
            <li>Login Server for OAuth flows</li>
            <li>Worker for background minting operations</li>
          </ul>
        </div>
      </GreyBoarderWhiteBgContainer>

      {/* Service Architecture Overview */}
      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <div>
          <h2 style={pageStyles.h2}>Service Architecture</h2>
          <p
            style={{
              color: "#666",
              fontSize: "16px",
              lineHeight: "1.6",
              marginBottom: "24px",
            }}
          >
            The Lit Auth Services package provides three core services that work
            together to create a complete authentication infrastructure:
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
              marginTop: "24px",
            }}
          >
            <div
              style={{
                padding: "20px",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.1)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  marginBottom: "12px",
                }}
              >
                🔐
              </div>
              <h3
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  color: "#1f2937",
                }}
              >
                Auth Server
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.9rem",
                  color: "#6b7280",
                  lineHeight: "1.5",
                }}
              >
                API for PKP minting using various authentication methods
                (Google, Discord, WebAuthn, Stytch, etc.)
              </p>
            </div>

            <div
              style={{
                padding: "20px",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.1)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  marginBottom: "12px",
                }}
              >
                🔗
              </div>
              <h3
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  color: "#1f2937",
                }}
              >
                Login Server
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.9rem",
                  color: "#6b7280",
                  lineHeight: "1.5",
                }}
              >
                OAuth integration for social logins (Google, Discord)
              </p>
            </div>

            <div
              style={{
                padding: "20px",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.1)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  marginBottom: "12px",
                }}
              >
                ⚙️
              </div>
              <h3
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  color: "#1f2937",
                }}
              >
                Background Worker
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.9rem",
                  color: "#6b7280",
                  lineHeight: "1.5",
                }}
              >
                Background processing for PKP minting operations, making API
                calls non-blocking
              </p>
            </div>

            <div
              style={{
                padding: "20px",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.1)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  marginBottom: "12px",
                }}
              >
                💾
              </div>
              <h3
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  color: "#1f2937",
                }}
              >
                Redis
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.9rem",
                  color: "#6b7280",
                  lineHeight: "1.5",
                }}
              >
                Job queue and caching layer for all services
              </p>
            </div>
          </div>
        </div>
      </GreyBoarderWhiteBgContainer>

      {/* Main Exports */}
      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <div style={{ marginBottom: "30px" }}>
          <h2>Main Exports</h2>
          <DisplayCode code={mainExportsCode} language="typescript" />
        </div>

        {/* Environment Configuration */}
        <div>
          <h2>Environment Configuration</h2>
          <DisplayCode code={envConfigCode} language="bash" />
        </div>
      </GreyBoarderWhiteBgContainer>

      {/* Service Setup */}
      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <div>
          <h2>Service Configuration</h2>

          {/* Auth Server */}
          <div style={{ marginBottom: "20px" }}>
            <h3>1. Auth Server</h3>
            <p style={{ color: "#666", marginBottom: "15px" }}>
              Handles PKP minting using various authentication methods (Google,
              Discord, WebAuthn, Stytch, etc.).
            </p>
            <DisplayCode code={authServerCode} language="typescript" />
          </div>

          {/* Login Server */}
          <div style={{ marginBottom: "20px" }}>
            <h3>2. Login Server</h3>
            <p style={{ color: "#666", marginBottom: "15px" }}>
              Handles OAuth flows for Google, Discord, and other providers.
            </p>
            <DisplayCode code={loginServerCode} language="typescript" />
          </div>

          {/* Worker */}
          <div style={{ marginBottom: "20px" }}>
            <h3>3. Background Worker</h3>
            <p style={{ color: "#666", marginBottom: "15px" }}>
              Processes PKP minting operations in the background, making API
              calls non-blocking.
            </p>
            <DisplayCode code={workerCode} language="typescript" />
          </div>
        </div>
      </GreyBoarderWhiteBgContainer>

      {/* Combined Setup */}
      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <div>
          <h2>Running All Services Together</h2>
          <p style={{ color: "#666", marginBottom: "15px" }}>
            Example of how to start all three services in a single application.
          </p>
          <DisplayCode code={runAllServicesCode} language="typescript" />
        </div>
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
          Once your auth services are configured, proceed to explore the various
          authentication methods like Google Auth, Discord Auth, WebAuthn, and
          custom authentication flows.
        </p>
      </div>
    </div>
  );
};

export default SetupAuthServicesTab;
