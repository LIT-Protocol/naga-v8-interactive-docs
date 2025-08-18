/**
 * CompleteIntegration.tsx
 *
 * Comprehensive integration examples showing how to combine all foundational components.
 * Demonstrates complete setups for browser and Node.js environments with best practices.
 */

import React, { useState } from "react";
import { DisplayCode } from "../../components/DisplayCode";

const CompleteIntegration: React.FC = () => {
  const [selectedExample, setSelectedExample] = useState<string>("browser");

  const examples = {
    browser: {
      name: "Browser Setup",
      description: "Complete setup for web applications using localStorage",
      code: `import { createAuthManager } from "@lit-protocol/auth";
import { localStorage } from "@lit-protocol/auth/storage";
import { createLitClient } from "@lit-protocol/lit-client";
import { nagaDev } from "@lit-protocol/networks";

// Complete browser setup with localStorage
const createLitService = async () => {
  try {
    // 1. Create Lit Client with nagaDev network
    const litClient = await createLitClient({ 
      network: nagaDev 
    });

    // 2. Create Auth Manager with localStorage
    const authManager = createAuthManager({
      storage: localStorage({
        appName: "my-app",
        networkName: import.meta.env.VITE_LIT_NETWORK || "naga-dev",
      }),
    });

    console.log("✅ Lit Protocol setup complete!");
    return { litClient, authManager };
  } catch (error) {
    console.error("❌ Setup failed:", error);
    throw error;
  }
};

// Usage example
const { litClient, authManager } = await createLitService();`,
    },
    node: {
      name: "Node.js Setup",
      description:
        "Complete setup for Node.js applications using file-based storage",
      code: `import { createAuthManager } from "@lit-protocol/auth";
import { localStorageNode } from "@lit-protocol/auth/storage";
import { createLitClient } from "@lit-protocol/lit-client";
import { nagaDev } from "@lit-protocol/networks";

// Complete Node.js setup with file-based storage
const createLitService = async () => {
  try {
    // 1. Create Lit Client with nagaDev network
    const litClient = await createLitClient({ 
      network: nagaDev 
    });

    // 2. Create Auth Manager with localStorageNode
    const authManager = createAuthManager({
      storage: localStorageNode({
        appName: "my-node-app", 
        networkName: import.meta.env.VITE_LIT_NETWORK || "naga-dev",
        storagePath: "./lit-auth-storage"
      }),
    });

    console.log("✅ Lit Protocol Node.js setup complete!");
    return { litClient, authManager };
  } catch (error) {
    console.error("❌ Setup failed:", error);
    throw error;
  }
};

// Usage example
const { litClient, authManager } = await createLitService();`,
    },

    comprehensive: {
      name: "Complete EOA Authentication Setup",
      description:
        "End-to-end setup with viem account authentication, PKP viewing, and auth context creation",
      code: `import {
  createAuthManager,
  storagePlugins,
  ViemAccountAuthenticator,
} from '@lit-protocol/auth';
import { createLitClient } from '@lit-protocol/lit-client';
import { privateKeyToAccount } from 'viem/accounts';

const createLitService = async () => {
  try {
    // Step 1: Convert your EOA private key to a viem account object
    // Use test private key if PRIVATE_KEY env var is not set
    const privateKey =
      process.env.PRIVATE_KEY ||
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

    const myAccount = privateKeyToAccount(privateKey as \`0x\${string}\`);

    // Step 2: Import and choose the Lit network to connect to
    const { nagaDev } = await import('@lit-protocol/networks');

    // Step 3: Instantiate the LitClient using the selected network
    const litClient = await createLitClient({ network: nagaDev });

    // Step 4: Create the AuthManager
    const authManager = createAuthManager({
      storage: storagePlugins.localStorageNode({
        appName: 'my-app',
        networkName: import.meta.env.VITE_LIT_NETWORK || 'naga-dev',
        storagePath: './lit-auth-storage',
      }),
    });

    // Step 5: Authenticate the account
    const viemAccountAuthData = await ViemAccountAuthenticator.authenticate(
      myAccount
    );

    // Step 6: View existing PKPs for this account
    const { pkps: viemAccountPkps } = await litClient.viewPKPsByAuthData({
      authData: viemAccountAuthData,
      pagination: {
        limit: 5,
      },
      storageProvider: storagePlugins.localStorageNode({
        appName: 'my-app',
        networkName: import.meta.env.VITE_LIT_NETWORK || 'naga-dev',
        storagePath: './pkp-tokens',
      }),
    });

    // Step 7: Create EOA auth context for signing operations
    const viemAuthContext = await authManager.createEoaAuthContext({
      config: {
        account: myAccount,
      },
      authConfig: {
        statement: 'I authorize the Lit Protocol to execute this Lit Action.',
        domain: 'example.com',
        resources: [
          ['lit-action-execution', '*'],
          ['pkp-signing', '*'],
          ['access-control-condition-decryption', '*'],
        ],
        capabilityAuthSigs: [],
        expiration: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
      },
      litClient: litClient,
    });

    console.log('✅ viemAccountPkps:', viemAccountPkps);

    // Step 8: Select a PKP (choose the first one)
    const viemAccountPkp = viemAccountPkps[0];

    console.log("✅ Complete Lit Protocol service with authentication ready!");
    
    return {
      myAccount,
      litClient,
      authManager,
      viemAccountAuthData,
      viemAccountPkp,
      viemAuthContext,
    };
  } catch (error) {
    console.error("❌ Setup failed:", error);
    throw error;
  }
};

// Usage example
const service = await createLitService();
console.log("Ready to use:", service.litClient, service.authManager, service.viemAccountPkp);`,
    },
  };

  return (
    <div style={{ maxWidth: "90%" }}>
      <div style={{ marginBottom: "30px" }}>
        <h1>Complete Integration</h1>
        <p style={{ color: "#666", fontSize: "16px", lineHeight: "1.6" }}>
          Now that you've learned about individual components, here are complete
          integration examples that bring together all the foundational pieces:
          network configuration, client creation, storage plugins, and auth
          management. The comprehensive example also shows complete EOA
          authentication with viem accounts, PKP viewing, and auth context
          creation.
        </p>
      </div>

      {/* Foundation Complete Badge */}
      <div
        style={{
          backgroundColor: "#d4edda",
          border: "1px solid #c3e6cb",
          borderRadius: "6px",
          padding: "20px",
          marginBottom: "30px",
          textAlign: "center",
        }}
      >
        <h2 style={{ margin: "0 0 10px 0", color: "#155724" }}>
          🎉 Foundation Complete!
        </h2>
        <p style={{ margin: "0", color: "#155724", fontSize: "16px" }}>
          You've learned about all the foundational components: Lit Client, Auth
          Manager, Network Configuration, and Storage Plugins. Now let's put it
          all together!
        </p>
      </div>

      {/* Interactive Integration Examples */}
      <div style={{ marginBottom: "30px" }}>
        <h2>Integration Examples</h2>
        <DisplayCode
          code={examples[selectedExample as keyof typeof examples].code}
          language="typescript"
          useSideBySide={true}
          renderComponent={
            <div>
              <h4 style={{ marginTop: "0", color: "#2c5282" }}>
                Choose Integration Type
              </h4>
              <p
                style={{
                  fontSize: "14px",
                  color: "#666",
                  marginBottom: "15px",
                }}
              >
                Select an integration example to see the complete setup.
              </p>

              <div style={{ marginBottom: "15px" }}>
                {Object.entries(examples).map(([key, example]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedExample(key)}
                    style={{
                      padding: "10px 16px",
                      margin: "4px",
                      backgroundColor:
                        selectedExample === key ? "#007bff" : "#f8f9fa",
                      color: selectedExample === key ? "white" : "#333",
                      border: `1px solid ${
                        selectedExample === key ? "#007bff" : "#dee2e6"
                      }`,
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "14px",
                      transition: "all 0.2s",
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      marginBottom: "8px",
                    }}
                  >
                    <strong>{example.name}</strong>
                    <div
                      style={{
                        fontSize: "12px",
                        color: selectedExample === key ? "#e6f3ff" : "#666",
                        marginTop: "4px",
                      }}
                    >
                      {example.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          }
        />
      </div>

      {/* Next Steps */}
      <div
        style={{
          backgroundColor: "#d1ecf1",
          border: "1px solid #bee5eb",
          borderRadius: "6px",
          padding: "20px",
        }}
      >
        <h3 style={{ margin: "0 0 15px 0", color: "#0c5460" }}>
          🚀 What's Next?
        </h3>
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#0c5460" }}>
            📚 Explore Available APIs
          </h4>
          <p style={{ margin: "0 0 15px 0", color: "#0c5460", lineHeight: "1.6" }}>
            Before jumping into authentication, check out the <strong>"Available APIs"</strong> section 
            to understand what you can do once authenticated:
          </p>
          <ul style={{ marginTop: "8px", paddingLeft: "20px", color: "#0c5460" }}>
            <li><strong>PKP Signing:</strong> Sign messages and transactions</li>
            <li><strong>Lit Actions:</strong> Execute serverless JavaScript code</li>
            <li><strong>Encryption & Decryption:</strong> Secure data with access controls</li>
            <li><strong>Session Signatures:</strong> Enhanced user experience with temporary sessions</li>
          </ul>
        </div>
        
        <div>
          <h4 style={{ margin: "0 0 10px 0", color: "#0c5460" }}>
            🔐 Choose Your Authentication Method
          </h4>
          <p style={{ margin: "0 0 15px 0", color: "#0c5460", lineHeight: "1.6" }}>
            Once you understand what APIs are available, pick an authentication method 
            to start creating and managing PKPs:
          </p>
          <ul style={{ marginTop: "8px", paddingLeft: "20px", color: "#0c5460" }}>
            <li><strong>Social Login:</strong> Google, Discord for easy onboarding</li>
            <li><strong>WebAuthn:</strong> Passwordless authentication with biometrics</li>
            <li><strong>EOA:</strong> Use your existing Ethereum wallet</li>
            <li><strong>Custom Auth:</strong> Build your own authentication flow</li>
          </ul>
        </div>
        
        <div style={{ 
          marginTop: "20px", 
          padding: "15px", 
          backgroundColor: "#b8e5eb", 
          borderRadius: "4px",
          border: "1px solid #9dd9e0"
        }}>
          <strong style={{ color: "#0c5460" }}>💡 Recommended Learning Path:</strong>
          <p style={{ margin: "8px 0 0 0", color: "#0c5460", fontSize: "14px" }}>
            1. Review "Available APIs" → 2. Choose an auth method → 3. Try the APIs with your authenticated PKP
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompleteIntegration;
