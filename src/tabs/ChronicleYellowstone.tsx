import React from "react";
import GreyBoarderWhiteBgContainer from "../components/layout/GreyboardWhiteBgContainer";
import { LinkExternal, NoteCallout } from "../components/common";
import { pageStyles } from "../styles/pageStyles";
import { Link } from "react-router-dom";

const ChronicleYellowstone: React.FC = () => {
  const networkParameters = [
    { parameter: "Chain ID", value: "175188" },
    {
      parameter: "Name",
      value: "Chronicle Yellowstone - Lit Protocol Testnet",
    },
    { parameter: "RPC URL", value: "https://yellowstone-rpc.litprotocol.com/" },
    {
      parameter: "Block Explorer URL",
      value: "https://yellowstone-explorer.litprotocol.com/",
    },
    { parameter: "Currency Symbol", value: "tstLPX" },
    { parameter: "Currency Decimals", value: "18" },
  ];

  return (
    <div className="tab-content" style={pageStyles.container}>
      <h1 style={pageStyles.h1}>Chronicle Yellowstone</h1>

      <GreyBoarderWhiteBgContainer>
        <p style={pageStyles.p}>
          <p style={pageStyles.p}>
            Chronicle Yellowstone is Lit Protocol's custom EVM rollup using{" "}
            <LinkExternal href="https://arbitrum.io/orbit">
              Arbitrum Orbit
            </LinkExternal>
            , designed specifically for Lit Protocol. This rollup is the primary
            platform for coordination, minting PKPs (programmable key pairs),
            and managing PKP Permissions.
          </p>
        </p>

        <div style={{ textAlign: "center", margin: "24px 0" }}>
          <button
            onClick={() => {
              if (window.ethereum) {
                window.ethereum.request({
                  method: "wallet_addEthereumChain",
                  params: [
                    {
                      chainId: "0x2AC4C",
                      chainName: "Chronicle Yellowstone - Lit Protocol Testnet",
                      rpcUrls: ["https://yellowstone-rpc.litprotocol.com/"],
                      blockExplorerUrls: [
                        "https://yellowstone-explorer.litprotocol.com/",
                      ],
                      nativeCurrency: {
                        name: "tstLPX",
                        symbol: "tstLPX",
                        decimals: 18,
                      },
                    },
                  ],
                });
              }
            }}
            style={{
              ...pageStyles.button(),
              backgroundColor: "#3b82f6",
              fontSize: "1.1rem",
              padding: "12px 24px",
            }}
          >
            Add Chronicle Yellowstone to Your Browser Wallet
          </button>
        </div>

        <NoteCallout
          variant="info"
          message={
            <>
              <p>
                PKPs minted on Chronicle Yellowstone can still sign transactions
                on any{" "}
                <Link
                  to="/encryption/access-control/evm/supported-chains"
                  style={{ color: "#3b82f6", textDecoration: "underline" }}
                >
                  EVM chain supported by Lit
                </Link>
                , Solana, Bitcoin, and Cosmos. This is a key feature of Lit
                Protocol's cross-chain capabilities.
              </p>
            </>
          }
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Network Parameters</h2>
        <p style={pageStyles.p}>
          To connect to Chronicle Yellowstone, you can use the "Add to Wallet"
          button above or manually add the network using the parameters below:
        </p>

        <NoteCallout
          variant="info"
          message={
            <>
              Additional chain facts are available at{" "}
              <LinkExternal href="https://app.conduit.xyz/published/view/chronicle-yellowstone-testnet-9qgmzfcohk">
                Conduit's Chronicle Yellowstone page
              </LinkExternal>
              .
            </>
          }
        />

        <table style={pageStyles.table}>
          <thead>
            <tr>
              <th style={pageStyles.th}>Parameter Name</th>
              <th style={pageStyles.th}>Value</th>
            </tr>
          </thead>
          <tbody>
            {networkParameters.map((param, index) => (
              <tr key={index}>
                <td style={pageStyles.td}>{param.parameter}</td>
                <td style={{ ...pageStyles.td, fontFamily: "monospace" }}>
                  {param.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 style={pageStyles.h3}>Block Explorer</h3>
        <p style={pageStyles.p}>
          A block explorer is available for Chronicle Yellowstone, providing
          valuable insights into the network. The explorer allows you to track
          transactions, addresses, and other essential data on the rollup.
        </p>

        <div style={{ textAlign: "center", margin: "20px 0" }}>
          <LinkExternal href="https://yellowstone-explorer.litprotocol.com/">
            <button
              style={{
                ...pageStyles.button(),
                backgroundColor: "#3b82f6",
                fontSize: "1.1rem",
                padding: "12px 24px",
              }}
            >
              🔍 Open Block Explorer
            </button>
          </LinkExternal>
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>
          <code>$LITKEY</code> Test Token
        </h2>

        <NoteCallout
          message={
            <>
              <p>
                The <code>$LITKEY</code> token and v1 Mainnet are{" "}
                <strong>NOT YET LIVE</strong>, but are coming soon.
              </p>
              <p>
                <a
                  href="https://x.com/LitProtocol"
                  target="_blank"
                  style={{ color: "#3b82f6", textDecoration: "underline" }}
                >
                  Follow Lit Protocol on X
                </a>{" "}
                to stay up to date.
              </p>
            </>
          }
          variant="note"
          style={{ marginBottom: "16px" }}
        />

        <p style={pageStyles.p}>
          The <code>$LITKEY</code> test token serves as the gas for transactions
          on Chronicle Yellowstone. Please note that this is a test token with
          no real-world value, its purpose is exclusively for testing and
          development on the Lit Protocol platform.
        </p>

        <div
          style={{
            backgroundColor: "#f0f9ff",
            border: "1px solid #0ea5e9",
            borderRadius: "8px",
            padding: "16px",
            margin: "16px 0",
          }}
        >
          <p style={{ ...pageStyles.p, marginBottom: "12px" }}>
            <strong>🚰 Get test tokens:</strong>
          </p>
          <LinkExternal href="https://chronicle-yellowstone-faucet.getlit.dev/">
            Chronicle Yellowstone Faucet
          </LinkExternal>
        </div>
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default ChronicleYellowstone;
