/**
 * NetworkConfigurationTab.tsx
 *
 * Demonstrates network configuration options for Lit Protocol.
 * Shows nagaDev, naga, and nagaTest configurations with interactive selection.
 */

import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { nagaDev } from "@lit-protocol/networks";
import { DisplayCode } from "../components/DisplayCode";

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

const NetworkConfigurationTab: React.FC = () => {
  const { areDependenciesLoaded, showError, setStatus } =
    useOutletContext<TabContext>();
  const [selectedNetwork, setSelectedNetwork] = useState<string>("nagaDev");
  const [configResult, setConfigResult] = useState<any>(null);

  const networks: Record<string, NetworkConfig> = {
    nagaDev: {
      name: "Naga Dev",
      config: nagaDev,
      description: "Development network for testing and experimentation",
      recommended: true,
      available: true,
    },
    nagaTest: {
      name: "Naga Test",
      config: null, // Will be available in future releases
      description: "Test network for pre-production testing",
      recommended: false,
      available: false,
    },
    naga: {
      name: "Naga",
      config: null, // Will be available in future releases
      description: "Production network for live applications",
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

  const networkImportCode = `import { nagaDev } from "@lit-protocol/networks";
import { createLitClient } from "@lit-protocol/lit-client";

// Currently Available: Development Network
const devClient = await createLitClient({ network: nagaDev });

// Future Networks (Coming Soon):
// const prodClient = await createLitClient({ network: naga });
// const testClient = await createLitClient({ network: nagaTest });`;

  return (
    <div style={{ maxWidth: "90%" }}>
      <div style={{ marginBottom: "30px" }}>
        <h1>Network Configuration</h1>
        <p style={{ color: "#666", fontSize: "16px", lineHeight: "1.6" }}>
          Configure your Lit Protocol client to connect to different networks.
          Choose the appropriate network based on your development stage and
          requirements.
        </p>
      </div>

      {/* Network Selection */}
      <div style={{ marginBottom: "30px" }}>
        <h2>Interactive Network Selection</h2>
        <DisplayCode
          code={networkImportCode}
          language="typescript"
          useSideBySide={true}
          renderComponent={
            <div>
              <h4 style={{ marginTop: "0", color: "#2c5282" }}>
                Select a Network
              </h4>
              <p
                style={{
                  fontSize: "14px",
                  color: "#666",
                  marginBottom: "15px",
                }}
              >
                Choose a network configuration to see its details and usage.
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
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
                            RECOMMENDED
                          </span>
                        )}
                        <div
                          style={{
                            fontSize: "12px",
                            color: selectedNetwork === key ? "#e6f3ff" : "#666",
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
            </div>
          }
          resultData={configResult}
          resultLabel="Network Configuration"
          isSuccess={!!configResult}
        />
      </div>

      {/* Network Comparison */}
      <div style={{ marginBottom: "30px" }}>
        <h2>Network Comparison</h2>
        <div
          style={{
            backgroundColor: "#f8f9fa",
            border: "1px solid #dee2e6",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#e9ecef" }}>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    borderBottom: "1px solid #dee2e6",
                  }}
                >
                  Network
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    borderBottom: "1px solid #dee2e6",
                  }}
                >
                  Purpose
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    borderBottom: "1px solid #dee2e6",
                  }}
                >
                  Use Case
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  style={{
                    padding: "12px",
                    borderBottom: "1px solid #dee2e6",
                    fontWeight: "bold",
                  }}
                >
                  nagaDev
                  <span
                    style={{
                      marginLeft: "8px",
                      padding: "2px 6px",
                      backgroundColor: "#28a745",
                      color: "white",
                      fontSize: "10px",
                      borderRadius: "3px",
                    }}
                  >
                    RECOMMENDED
                  </span>
                </td>
                <td
                  style={{ padding: "12px", borderBottom: "1px solid #dee2e6" }}
                >
                  Development & Testing
                </td>
                <td
                  style={{ padding: "12px", borderBottom: "1px solid #dee2e6" }}
                >
                  Centralised test network. Keys are not persistent and will be
                  deleted.
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "12px",
                    borderBottom: "1px solid #dee2e6",
                    fontWeight: "bold",
                  }}
                >
                  nagaTest
                </td>
                <td
                  style={{ padding: "12px", borderBottom: "1px solid #dee2e6" }}
                >
                  Pre-production Testing
                </td>
                <td
                  style={{ padding: "12px", borderBottom: "1px solid #dee2e6" }}
                >
                  Decentralised test network. No persistency guarantees. Mirrors
                  Datil code and configuration. Payment is enforced.
                </td>
              </tr>
              <tr>
                <td style={{ padding: "12px", fontWeight: "bold" }}>naga</td>
                <td style={{ padding: "12px" }}>Production</td>
                <td style={{ padding: "12px" }}>
                  Decentralised mainnet. Persistent, keys will not be deleted.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Next Steps */}
      <div
        style={{
          backgroundColor: "#fff3cd",
          border: "1px solid #ffeaa7",
          borderRadius: "6px",
          padding: "20px",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0", color: "#856404" }}>Next Steps</h3>
        <p style={{ margin: "0", color: "#856404" }}>
          With your network configured, explore storage plugins to complete your
          foundation setup and then proceed to authentication methods.
        </p>
      </div>
    </div>
  );
};

export default NetworkConfigurationTab;
