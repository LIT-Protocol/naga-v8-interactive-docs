/**
 * SetupLitClientTab.tsx
 * 
 * Demonstrates how to create and configure a Lit Protocol client instance.
 * Shows the singleton pattern implementation and nagaDev network configuration.
 */

import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { createLitClient } from "@lit-protocol/lit-client";
import { nagaDev } from "@lit-protocol/networks";
import { DisplayCode } from "../components/DisplayCode";

interface TabContext {
  areDependenciesLoaded: () => boolean;
  showError: (error: string) => void;
  setStatus: (status: string) => void;
}

const SetupLitClientTab: React.FC = () => {
  const { areDependenciesLoaded, showError, setStatus } = useOutletContext<TabContext>();
  const [clientStatus, setClientStatus] = useState<string>("Not initialized");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [clientResult, setClientResult] = useState<any>(null);

  const handleCreateClient = async () => {
    try {
      setIsCreating(true);
      setClientStatus("Creating client...");
      setStatus("Creating Lit Client instance...");
      setClientResult(null);

      // Create the client with nagaDev network
      const client = await createLitClient({ network: nagaDev });
      
      setClientStatus("✅ Client created successfully!");
      setStatus("Lit Client created successfully!");
      setClientResult({
        success: true,
        message: "Lit Client instance created successfully",
        network: "nagaDev",
        timestamp: new Date().toISOString(),
        clientInfo: {
          ready: true,
          network: "nagaDev"
        }
      });
      
      console.log("Lit Client instance:", client);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setClientStatus(`❌ Error: ${errorMessage}`);
      setClientResult({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
      showError(`Failed to create Lit Client: ${errorMessage}`);
    } finally {
      setIsCreating(false);
    }
  };

  const singletonCode = `import { createLitClient } from "@lit-protocol/lit-client";
import { nagaDev } from "@lit-protocol/networks";

// Singleton pattern implementation
let litClientInstance = null;

const getLitClient = async () => {
  if (!litClientInstance) {
    console.log("Creating new LitClient instance");
    litClientInstance = await createLitClient({ 
      network: nagaDev 
    });
  }
  return litClientInstance;
};

// Usage
const client = await getLitClient();`;

  return (
    <div style={{ maxWidth: "800px" }}>
      <div style={{ marginBottom: "30px" }}>
        <h1>Setup Lit Client</h1>
        <p style={{ color: "#666", fontSize: "16px", lineHeight: "1.6" }}>
          The Lit Client is the core interface for interacting with the Lit Protocol network. 
          This component handles communication with Lit nodes and provides methods for PKP operations.
        </p>
      </div>

      {/* Status Card */}
      <div style={{
        padding: "20px",
        backgroundColor: "#f8f9fa",
        border: "1px solid #dee2e6",
        borderRadius: "8px",
        marginBottom: "30px"
      }}>
        <h3 style={{ margin: "0 0 10px 0" }}>Current Status</h3>
        <p style={{ 
          margin: "0", 
          fontFamily: "monospace",
          padding: "10px",
          backgroundColor: clientStatus.includes("✅") ? "#d4edda" : 
                           clientStatus.includes("❌") ? "#f8d7da" : "#fff3cd",
          borderRadius: "4px",
          border: `1px solid ${clientStatus.includes("✅") ? "#c3e6cb" : 
                                clientStatus.includes("❌") ? "#f5c6cb" : "#ffeaa7"}`
        }}>
          {clientStatus}
        </p>
      </div>

      {/* Interactive Code Demo */}
      <div style={{ marginBottom: "30px" }}>
        <h2>Interactive Demo</h2>
        <DisplayCode
          code={singletonCode}
          language="typescript"
          useSideBySide={true}
          renderComponent={
            <div>
              <h4 style={{ marginTop: "0", color: "#2c5282" }}>Try it yourself</h4>
              <p style={{ fontSize: "14px", color: "#666", marginBottom: "15px" }}>
                Click the button to create a Lit Client instance using the singleton pattern.
              </p>
              <button
                onClick={handleCreateClient}
                disabled={isCreating}
                style={{
                  padding: "12px 24px",
                  backgroundColor: isCreating ? "#6c757d" : "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "16px",
                  cursor: isCreating ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s",
                  width: "100%"
                }}
              >
                {isCreating ? "Creating Client..." : "Create Lit Client"}
              </button>
            </div>
          }
          resultData={clientResult}
          resultLabel="Client Creation Result"
          isSuccess={clientStatus.includes("✅")}
        />
      </div>

      {/* Key Concepts */}
      <div style={{ marginBottom: "30px" }}>
        <h2>Key Concepts</h2>
        <div style={{
          backgroundColor: "#e7f3ff",
          border: "1px solid #b3d9ff",
          borderRadius: "6px",
          padding: "20px"
        }}>
          <h3 style={{ margin: "0 0 15px 0", color: "#0066cc" }}>Network Configuration</h3>
          <ul style={{ marginBottom: "20px", paddingLeft: "20px" }}>
            <li><strong>nagaDev:</strong> Development network for testing Lit Protocol features</li>
            <li><strong>Singleton Pattern:</strong> Ensures only one client instance exists</li>
            <li><strong>Async Initialization:</strong> Client creation is asynchronous and may take time</li>
          </ul>
          
          <h3 style={{ margin: "20px 0 15px 0", color: "#0066cc" }}>Best Practices</h3>
          <ul style={{ paddingLeft: "20px" }}>
            <li>Always use the singleton pattern to avoid multiple instances</li>
            <li>Handle errors gracefully during client creation</li>
            <li>Check client readiness before performing operations</li>
            <li>Use appropriate network configuration for your environment</li>
          </ul>
        </div>
      </div>

      {/* Next Steps */}
      <div style={{
        backgroundColor: "#fff3cd",
        border: "1px solid #ffeaa7",
        borderRadius: "6px",
        padding: "20px"
      }}>
        <h3 style={{ margin: "0 0 10px 0", color: "#856404" }}>Next Steps</h3>
        <p style={{ margin: "0", color: "#856404" }}>
          Once you've successfully created a Lit Client, proceed to setup the Auth Manager to handle authentication flows.
        </p>
      </div>
    </div>
  );
};

export default SetupLitClientTab; 