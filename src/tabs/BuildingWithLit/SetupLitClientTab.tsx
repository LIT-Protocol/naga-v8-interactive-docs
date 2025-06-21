/**
 * SetupLitClientTab.tsx
 *
 * Demonstrates network configuration and how to create and configure a Lit Protocol client instance.
 * Shows network selection, singleton pattern implementation and client creation.
 */

import React, { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { createLitClient } from "@lit-protocol/lit-client";
import { nagaDev } from "@lit-protocol/networks";
import { DisplayCode } from "../../components/DisplayCode";
import { exploreClientStructure } from "../../utils/explore-structure";
import SingletonPattern from "../../components/tips/SingletonPattern";
import GreyBoarderWhiteBgContainer from "../../components/layout/GreyboardWhiteBgContainer";

interface TabContext {
  areDependenciesLoaded: () => boolean;
  showError: (error: string) => void;
  setStatus: (status: string) => void;
}

interface NetworkConfig {
  name: string;
  config: any;
  description: string;
  recommended: boolean;
  available: boolean;
}

const SetupLitClientTab: React.FC = () => {
  const { areDependenciesLoaded, showError, setStatus } =
    useOutletContext<TabContext>();
  const [clientStatus, setClientStatus] = useState<string>("Not initialised");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [clientResult, setClientResult] = useState<any>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string>("nagaDev");
  const [configResult, setConfigResult] = useState<any>(null);
  const [exploreDepth, setExploreDepth] = useState<number>(3);
  const [showSingletonPattern, setShowSingletonPattern] =
    useState<boolean>(false);

  const networks: Record<string, NetworkConfig> = {
    nagaDev: {
      name: "Naga Dev",
      config: nagaDev,
      description:
        "Centralised test network. Keys are not persistent and will be deleted.",
      recommended: true,
      available: true,
    },
    nagaTest: {
      name: "Naga Test",
      config: null, // Will be available in future releases
      description:
        "Decentralised test network. No persistency guarantees. Mirrors Datil code and configuration. Payment is enforced.",
      recommended: false,
      available: false,
    },
    naga: {
      name: "Naga",
      config: null, // Will be available in future releases
      description:
        "Decentralised mainnet. Persistent, keys will not be deleted.",
      recommended: false,
      available: false,
    },
  };

  const handleNetworkSelect = (networkKey: string) => {
    setSelectedNetwork(networkKey);
    const network = networks[networkKey];

    if (!network.available) {
      setConfigResult({
        success: false,
        error: `${network.name} is not yet available in this SDK version`,
        network: network.name,
        description: network.description,
        timestamp: new Date().toISOString(),
      });
      setStatus(`${network.name} network is not yet available`);
      showError(
        `${network.name} network is not yet available in this SDK version`
      );
      return;
    }

    setConfigResult({
      success: true,
      network: network.name,
      description: network.description,
      config: network.config,
      timestamp: new Date().toISOString(),
    });
    setStatus(`Selected ${network.name} network configuration`);
  };

  const handleCreateClient = async () => {
    try {
      setIsCreating(true);
      setClientStatus("Creating client...");
      setStatus("Creating Lit Client instance...");
      setClientResult(null);

      const selectedNetworkConfig = networks[selectedNetwork];
      if (!selectedNetworkConfig.available) {
        throw new Error(
          `${selectedNetworkConfig.name} network is not available`
        );
      }

      // Create the client with selected network
      const client = await createLitClient({
        network: selectedNetworkConfig.config,
      });

      const clientStructure = exploreClientStructure(client, exploreDepth);

      setClientStatus("✅ Client created successfully!");
      setStatus("Lit Client created successfully!");
      setClientResult(clientStructure);

      console.log("Lit Client instance:", client);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setClientStatus(`❌ Error: ${errorMessage}`);
      setClientResult({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
      showError(`Failed to create Lit Client: ${errorMessage}`);
    } finally {
      setIsCreating(false);
    }
  };

  const networkImportCode = `import { nagaDev } from "@lit-protocol/networks";
import { createLitClient } from "@lit-protocol/lit-client";

const devClient = await createLitClient({ 
  network: nagaDev 
});`;

  const networkTestImportCode = `import { nagaTest } from "@lit-protocol/networks";
import { createLitClient } from "@lit-protocol/lit-client";

const testClient = await createLitClient({ 
  network: nagaTest 
});`;

  const networkProdImportCode = `import { naga } from "@lit-protocol/networks";
import { createLitClient } from "@lit-protocol/lit-client";

const litClient = await createLitClient({ 
  network: naga 
});`;

  // Function to get the appropriate code based on selected network
  const getNetworkCode = () => {
    switch (selectedNetwork) {
      case "nagaTest":
        return networkTestImportCode;
      case "naga":
        return networkProdImportCode;
      default:
        return networkImportCode;
    }
  };

  // Function to get the appropriate import for singleton code
  const getSingletonCode = () => {
    const networkImport =
      selectedNetwork === "nagaTest"
        ? "nagaTest"
        : selectedNetwork === "naga"
        ? "naga"
        : "nagaDev";
    const networkVar =
      selectedNetwork === "nagaTest"
        ? "nagaTest"
        : selectedNetwork === "naga"
        ? "naga"
        : "nagaDev";

    return `import { createLitClient } from "@lit-protocol/lit-client";
import { ${networkImport} } from "@lit-protocol/networks";

// Create a Lit Client instance
const createClient = async () => {
  const client = await createLitClient({ 
    network: ${networkVar} 
  });
  
  console.log("Client created:", client);
  return client;
};

// Usage
const client = await createClient();`;
  };

  const singletonCode = getSingletonCode();

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
      <h1>Setting Up the Lit Client</h1>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <div>
          <h2 style={pageStyles.h2}>Introduction</h2>
          <p style={{ color: "#666", fontSize: "16px", lineHeight: "1.6" }}>
            The Lit Client is the core interface for interacting with the Lit
            Protocol network. First, select your network configuration, then
            create your client instance.
          </p>
        </div>
      </GreyBoarderWhiteBgContainer>

      {/* Network Configuration Section */}
      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <div>
          <h2>Network Configuration & Client Creation</h2>
          <p style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}>
            Choose the appropriate network based on your development stage and
            requirements, then create your Lit Client instance.
          </p>

          <DisplayCode
            code={getNetworkCode()}
            language="typescript"
            useSideBySide={true}
            renderComponent={
              <div>
                <h4 style={{ marginTop: "0", color: "#2c5282" }}>
                  Select a Network & Create Client
                </h4>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#666",
                    marginBottom: "15px",
                  }}
                >
                  Choose a network configuration to see its details and usage,
                  then create your client.
                </p>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    marginBottom: "20px",
                  }}
                >
                  {Object.entries(networks).map(([key, network]) => (
                    <button
                      key={key}
                      onClick={() => handleNetworkSelect(key)}
                      style={{
                        padding: "12px 16px",
                        backgroundColor:
                          selectedNetwork === key ? "#007bff" : "#f8f9fa",
                        color: selectedNetwork === key ? "white" : "#333",
                        border: `2px solid ${
                          selectedNetwork === key ? "#007bff" : "#dee2e6"
                        }`,
                        borderRadius: "6px",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.2s",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <strong>{network.name}</strong>
                          {network.recommended && (
                            <span
                              style={{
                                marginLeft: "8px",
                                padding: "2px 6px",
                                backgroundColor: "#28a745",
                                color: "white",
                                fontSize: "11px",
                                borderRadius: "3px",
                              }}
                            >
                              AVAILABLE
                            </span>
                          )}
                          <div
                            style={{
                              fontSize: "12px",
                              color:
                                selectedNetwork === key ? "#e6f3ff" : "#666",
                              marginTop: "4px",
                            }}
                          >
                            {network.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Client Status */}
                <div
                  style={{
                    padding: "15px",
                    backgroundColor: "#f8f9fa",
                    border: "1px solid #dee2e6",
                    borderRadius: "6px",
                    marginBottom: "15px",
                  }}
                >
                  <h5 style={{ margin: "0 0 8px 0", color: "#2c5282" }}>
                    Client Status
                  </h5>
                  <p
                    style={{
                      margin: "0",
                      fontFamily: "monospace",
                      fontSize: "13px",
                      padding: "8px",
                      backgroundColor: clientStatus.includes("✅")
                        ? "#d4edda"
                        : clientStatus.includes("❌")
                        ? "#f8d7da"
                        : "#fff3cd",
                      borderRadius: "4px",
                      border: `1px solid ${
                        clientStatus.includes("✅")
                          ? "#c3e6cb"
                          : clientStatus.includes("❌")
                          ? "#f5c6cb"
                          : "#ffeaa7"
                      }`,
                    }}
                  >
                    {clientStatus}
                  </p>
                </div>

                {/* Action Buttons */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {/* Singleton Pattern Button */}
                  <button
                    onClick={() => setShowSingletonPattern(true)}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#f8f9fa",
                      color: "#007bff",
                      border: "2px solid #007bff",
                      borderRadius: "6px",
                      fontSize: "14px",
                      cursor: "pointer",
                      width: "100%",
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = "#007bff";
                      e.currentTarget.style.color = "white";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = "#f8f9fa";
                      e.currentTarget.style.color = "#007bff";
                    }}
                  >
                    📋 View Singleton Pattern Implementation
                  </button>

                  {/* Create Client Button */}
                  <button
                    onClick={handleCreateClient}
                    disabled={
                      isCreating || !networks[selectedNetwork].available
                    }
                    style={{
                      padding: "12px 24px",
                      backgroundColor: isCreating
                        ? "#6c757d"
                        : !networks[selectedNetwork].available
                        ? "#dc3545"
                        : "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "16px",
                      cursor:
                        isCreating || !networks[selectedNetwork].available
                          ? "not-allowed"
                          : "pointer",
                      transition: "background-color 0.2s",
                      width: "100%",
                    }}
                  >
                    {isCreating
                      ? "Creating Client..."
                      : !networks[selectedNetwork].available
                      ? `${networks[selectedNetwork].name} Not Available`
                      : `Create Lit Client with ${networks[selectedNetwork].name}`}
                  </button>
                </div>
              </div>
            }
            resultData={clientResult || configResult}
            resultLabel={
              clientResult ? "Lit Client APIs" : "Network Configuration"
            }
            isSuccess={
              (clientResult && clientStatus.includes("✅")) ||
              (configResult && configResult.success === true)
            }
            isError={
              (clientResult && clientStatus.includes("❌")) ||
              (configResult && configResult.success === false)
            }
          />
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
          Once you've successfully created a Lit Client with your preferred
          network, proceed to{" "}
          <Link
            to="/building-with-lit/setup-auth-manager"
            style={{ color: "#3b82f6", textDecoration: "underline" }}
          >
            Setup the Auth Manager
          </Link>{" "}
          guide to configure the Auth Manager for data persistence.
        </p>
      </div>

      {/* Singleton Pattern Popup */}
      <SingletonPattern
        isOpen={showSingletonPattern}
        onClose={() => setShowSingletonPattern(false)}
        componentType="litClient"
        selectedNetwork={selectedNetwork}
      />
    </div>
  );
};

export default SetupLitClientTab;
