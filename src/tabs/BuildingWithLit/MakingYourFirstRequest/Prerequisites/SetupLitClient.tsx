import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createLitClient } from "@lit-protocol/lit-client";
import { nagaDev, nagaTest } from "@lit-protocol/networks";
import { DisplayCode } from "../../../../components/DisplayCode";
import { exploreClientStructure } from "../../../../utils/explore-structure";
import SingletonPattern from "../../../../components/tips/SingletonPattern";
import GreyBoarderWhiteBgContainer from "../../../../components/layout/GreyboardWhiteBgContainer";
import { RequiredPackages } from "../../../../components/common";
import { pageStyles } from "../../../../styles/pageStyles";

interface NetworkConfig {
  name: string;
  config: unknown;
  description: string;
  detailedDescription: string;
  recommended: boolean;
  available: boolean;
  icon: string;
}

const SetupLitClient: React.FC = () => {
  const [clientStatus, setClientStatus] = useState<string>("Not initialized");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [clientResult, setClientResult] = useState<unknown>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string>("nagaDev");
  const [configResult, setConfigResult] = useState<unknown>(null);
  const [showSingletonPattern, setShowSingletonPattern] =
    useState<boolean>(false);

  const networks: Record<string, NetworkConfig> = {
    nagaDev: {
      name: "Naga Dev",
      config: nagaDev,
      description: "Development network - Perfect for learning and testing",
      detailedDescription:
        "This is a centralized test network designed for development and experimentation. Keys and data are not persistent and may be deleted.",
      recommended: true,
      available: true,
      icon: "🛠️",
    },
    nagaTest: {
      name: "Naga Test",
      config: nagaTest,
      description: "Test network - Mirrors production environment",
      detailedDescription:
        "This is a decentralized test network that closely mirrors the production environment. It includes payment enforcement and provides a more realistic testing experience. Use this when you're ready to test in production-like conditions.",
      recommended: false,
      available: true,
      icon: "🧪",
    },
    naga: {
      name: "Naga Mainnet",
      config: null,
      description: "Production network - Coming soon",
      detailedDescription:
        "This is the main production network where keys are persistent and permanent. Only use this for production applications. Currently not available in this SDK version.",
      recommended: false,
      available: false,
      icon: "🏭",
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
      return;
    }

    setConfigResult({
      success: true,
      network: network.name,
      description: network.description,
      config: network.config,
      timestamp: new Date().toISOString(),
    });
  };

  const handleCreateClient = async () => {
    try {
      setIsCreating(true);
      setClientStatus("Creating client...");
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

      const clientStructure = exploreClientStructure(client, 3);

      setClientStatus("✅ Client created successfully!");
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
    } finally {
      setIsCreating(false);
    }
  };

  const installationCode = `
npm install @lit-protocol/lit-client @lit-protocol/networks`;

  const getNetworkCode = () => {
    const network = networks[selectedNetwork];
    const networkImport =
      selectedNetwork === "nagaTest"
        ? "nagaTest"
        : selectedNetwork === "naga"
        ? "naga"
        : "nagaDev";

    return `import { createLitClient } from "@lit-protocol/lit-client";
import { ${networkImport} } from "@lit-protocol/networks";

// Create Lit Client for ${network.name}
const litClient = await createLitClient({ 
  network: ${networkImport} 
});`;
  };

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>Setting Up the Lit Client</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>What is the Lit Client?</h2>
        <p style={pageStyles.p}>
          Just like how you need a database client to talk to a database, or an
          API client to talk to a web service, you need a Lit Client to
          communicate with the Lit network.
        </p>

        <p style={pageStyles.p}>
          The Lit Client connects your app to the decentralized nodes and takes
          care of the networking, cryptographic protocols, and node
          communication so you can focus on writing application logic that uses
          the network's cryptographic features like encryption, PKP signing,
          access control, and more.
        </p>
      </GreyBoarderWhiteBgContainer>

      <RequiredPackages
        description="To get started with Lit Protocol, you'll need to install two essential packages:"
        packages={[
          {
            name: "@lit-protocol/lit-client",
            description:
              "The main client library that provides the interface for connecting to and interacting with the Lit Protocol network.",
          },
          {
            name: "@lit-protocol/networks",
            description:
              "Network configuration objects that define the network metadata used to connect to and communicate with the Lit networks.",
          },
        ]}
        installationCode={installationCode}
        style={{ marginTop: "32px" }}
      />

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Connect to a Lit Network</h2>
        <p style={pageStyles.p}>
          Lit Protocol has different networks for different purposes. Think of
          these like different environments in software development:
        </p>

        <DisplayCode
          code={getNetworkCode()}
          language="typescript"
          useSideBySide={true}
          renderComponent={
            <div>
              <h4
                style={{
                  marginTop: "0",
                  color: "#2c5282",
                  marginBottom: "16px",
                }}
              >
                🌐 Select a Network
              </h4>
              <p
                style={{
                  fontSize: "14px",
                  color: "#666",
                  marginBottom: "20px",
                }}
              >
                Each network serves a different purpose. Click on a network to
                see its configuration and learn more about when to use it.
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  marginBottom: "24px",
                }}
              >
                {Object.entries(networks).map(([key, network]) => (
                  <button
                    key={key}
                    onClick={() => handleNetworkSelect(key)}
                    disabled={!network.available}
                    style={{
                      padding: "16px",
                      backgroundColor:
                        selectedNetwork === key
                          ? "#3b82f6"
                          : network.available
                          ? "#ffffff"
                          : "#f3f4f6",
                      color:
                        selectedNetwork === key
                          ? "white"
                          : network.available
                          ? "#374151"
                          : "#9ca3af",
                      border: `2px solid ${
                        selectedNetwork === key
                          ? "#3b82f6"
                          : network.available
                          ? "#d1d5db"
                          : "#e5e7eb"
                      }`,
                      borderRadius: "8px",
                      cursor: network.available ? "pointer" : "not-allowed",
                      textAlign: "left",
                      transition: "all 0.2s",
                      opacity: network.available ? 1 : 0.6,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                      }}
                    >
                      <div style={{ fontSize: "1.5rem" }}>{network.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "4px",
                          }}
                        >
                          <strong style={{ fontSize: "1rem" }}>
                            {network.name}
                          </strong>
                          {network.recommended && (
                            <span
                              style={{
                                padding: "2px 8px",
                                backgroundColor: "#22c55e",
                                color: "white",
                                fontSize: "11px",
                                borderRadius: "12px",
                                fontWeight: "600",
                              }}
                            >
                              RECOMMENDED
                            </span>
                          )}
                          {!network.available && (
                            <span
                              style={{
                                padding: "2px 8px",
                                backgroundColor: "#ef4444",
                                color: "white",
                                fontSize: "11px",
                                borderRadius: "12px",
                                fontWeight: "600",
                              }}
                            >
                              COMING SOON
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color:
                              selectedNetwork === key ? "#e6f3ff" : "#6b7280",
                            marginBottom: "8px",
                            fontWeight: "500",
                          }}
                        >
                          {network.description}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color:
                              selectedNetwork === key ? "#dbeafe" : "#9ca3af",
                            lineHeight: "1.4",
                          }}
                        >
                          {network.detailedDescription}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Client Status */}
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  marginBottom: "20px",
                }}
              >
                <h5
                  style={{
                    margin: "0 0 8px 0",
                    color: "#374151",
                    fontSize: "0.9rem",
                  }}
                >
                  🔌 Client Status
                </h5>
                <p
                  style={{
                    margin: "0",
                    fontFamily: "monospace",
                    fontSize: "13px",
                    padding: "8px 12px",
                    backgroundColor: clientStatus.includes("✅")
                      ? "#dcfce7"
                      : clientStatus.includes("❌")
                      ? "#fee2e2"
                      : "#fef3c7",
                    borderRadius: "6px",
                    border: `1px solid ${
                      clientStatus.includes("✅")
                        ? "#bbf7d0"
                        : clientStatus.includes("❌")
                        ? "#fecaca"
                        : "#fde68a"
                    }`,
                    color: clientStatus.includes("✅")
                      ? "#166534"
                      : clientStatus.includes("❌")
                      ? "#991b1b"
                      : "#92400e",
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
                  gap: "12px",
                }}
              >
                <button
                  onClick={handleCreateClient}
                  disabled={isCreating || !networks[selectedNetwork].available}
                  style={{
                    padding: "14px 24px",
                    backgroundColor: isCreating
                      ? "#6b7280"
                      : !networks[selectedNetwork].available
                      ? "#ef4444"
                      : "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontWeight: "600",
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
                    : `🚀 Create Client with ${networks[selectedNetwork].name}`}
                </button>

                <button
                  onClick={() => setShowSingletonPattern(true)}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "#ffffff",
                    color: "#3b82f6",
                    border: "2px solid #3b82f6",
                    borderRadius: "8px",
                    fontSize: "0.9rem",
                    fontWeight: "500",
                    cursor: "pointer",
                    width: "100%",
                    transition: "all 0.2s",
                  }}
                >
                  📋 View Singleton Pattern (Advanced)
                </button>
              </div>
            </div>
          }
          resultData={clientResult}
          resultLabel={clientResult ? "Lit Client" : undefined}
          isSuccess={Boolean(clientResult && clientStatus.includes("✅"))}
          isError={Boolean(clientResult && clientStatus.includes("❌"))}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Understanding the Result</h2>
        <p style={pageStyles.p}>
          After successfully creating a Lit Client, you get an object with
          methods that perform various operations on the Lit network. Here's
          what some of the key ones do:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
            marginTop: "20px",
          }}
        >
          {[
            {
              method: "encrypt()",
              description: "Encrypts data with access control conditions",
              icon: "🔒",
            },
            {
              method: "decrypt()",
              description: "Decrypts data if you meet the access conditions",
              icon: "🔓",
            },
            {
              method: "executeJs()",
              description: "Runs Lit Actions (serverless JavaScript functions)",
              icon: "⚙️",
            },
            {
              method: "mintWithAuth()",
              description:
                "Creates a new Programmable Key Pair using a specified authentication method (e.g. email, phone number, etc.)",
              icon: "🔑",
            },
            {
              method: "getPkpViemAccount()",
              description:
                "Creates a viem account object that can be used to sign transactions with the PKP.",
              icon: "👛",
            },
            {
              method: "disconnect()",
              description: "Disconnects the background worker from the network",
              icon: "🔌",
            },
          ].map((item, index) => (
            <div
              key={index}
              style={{
                padding: "16px",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>{item.icon}</span>
                <code>{item.method}</code>
              </div>
              <p
                style={{
                  margin: "0",
                  fontSize: "0.85rem",
                  color: "#4b5563",
                  lineHeight: "1.4",
                }}
              >
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </GreyBoarderWhiteBgContainer>

      {/* Next Steps */}
      <div
        style={{
          backgroundColor: "#f0f9ff",
          border: "2px solid #3b82f6",
          borderRadius: "12px",
          padding: "24px",
          marginTop: "32px",
        }}
      >
        <h3
          style={{
            margin: "0 0 12px 0",
            color: "#1e40af",
            fontSize: "1.3rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          🚀 What's Next?
        </h3>
        <p
          style={{ margin: "0 0 16px 0", color: "#1e3a8a", lineHeight: "1.6" }}
        >
          Great! You now understand how to create a Lit Client. Your next step
          is to set up authentication so you can use the client to perform
          operations.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Link
            to="/building-with-lit/first-request/prerequisites/setup-auth-manager"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              backgroundColor: "#3b82f6",
              color: "white",
              textDecoration: "none",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "1rem",
              transition: "background-color 0.2s",
            }}
          >
            Continue to Auth Manager Setup →
          </Link>
        </div>
      </div>

      {/* Singleton Pattern Modal */}
      <SingletonPattern
        isOpen={showSingletonPattern}
        onClose={() => setShowSingletonPattern(false)}
        componentType="litClient"
        selectedNetwork={selectedNetwork}
      />
    </div>
  );
};

export default SetupLitClient;
