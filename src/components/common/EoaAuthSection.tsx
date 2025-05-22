import React from "react";
import { DisplayCode } from "../DisplayCode";

// Code snippets for EOA authentication
const VIEM_ACCOUNT_AUTH_CODE = `// Step 1: Convert your EOA private key to a viem account object
const myAccount = privateKeyToAccount(
  process.env.PRIVATE_KEY as \`0x\${string}\`
);
const { ViemAccountAuthenticator } = await import('@lit-protocol/auth');

const authData = await ViemAccountAuthenticator.authenticate(myAccount);
console.log('✅ authData:', authData);

// Minting a PKP with EOA Auth Method
const mintedPkpWithEoaAuth = await litClient.mintWithAuth({
  account: myAccount,
  authData: authData,
  scopes: ['sign-anything'],
});

console.log('mintedPkpWithEoaAuth:', mintedPkpWithEoaAuth);`;

const WALLET_CLIENT_AUTH_CODE = `// For browser environments with wagmi/core
import { getWalletClient } from '@wagmi/core';
const { WalletClientAuthenticator } = await import('@lit-protocol/auth');

const walletClient = await getWalletClient();
const authData = await WalletClientAuthenticator.authenticate(walletClient);

// Minting a PKP with Wallet Client Auth Method
const mintedPkpWithWalletClient = await litClient.mintWithAuth({
  authData: authData,
  scopes: ['sign-anything'],
});

console.log('mintedPkpWithWalletClient:', mintedPkpWithWalletClient);`;

interface EoaAuthSectionProps {
  tabName: string;
}

const EoaAuthSection: React.FC<EoaAuthSectionProps> = ({ tabName }) => {
  return (
    <div
      style={{
        border: "1px solid #4b6cb7",
        borderRadius: "8px",
        marginTop: "20px",
        padding: "20px",
        backgroundColor: "#f0f4ff",
        boxShadow: "0 2px 4px rgba(75, 108, 183, 0.15)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "15px",
          borderBottom: "1px solid #4b6cb7",
          paddingBottom: "10px",
        }}
      >
        <div
          style={{
            backgroundColor: "#4b6cb7",
            color: "white",
            padding: "5px 10px",
            borderRadius: "4px",
            marginRight: "10px",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          Developer Note
        </div>
        <h3
          style={{
            margin: 0,
            color: "#4b6cb7",
          }}
        >
          Alternative: Mint PKP with EOA Wallet
        </h3>
      </div>

      <p>
        While the {tabName} authentication method provides a streamlined user
        experience, developers can also mint PKPs using their own Externally
        Owned Account (EOA) wallet and add authentication methods themselves.
      </p>

      <h4 style={{ color: "#4b6cb7" }}>
        Server-Side with ViemAccountAuthenticator
      </h4>
      <p>
        The following approach is typically used on the server side where you
        have access to a private key:
      </p>
      <DisplayCode
        code={VIEM_ACCOUNT_AUTH_CODE}
        language="typescript"
        theme="dracula"
      />

      <h4 style={{ color: "#4b6cb7" }}>
        Browser-Side with WalletClientAuthenticator
      </h4>
      <p>
        For browser environments using wagmi/core and wallet providers like
        MetaMask:
      </p>
      <DisplayCode
        code={WALLET_CLIENT_AUTH_CODE}
        language="typescript"
        theme="dracula"
      />

      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          backgroundColor: "rgba(75, 108, 183, 0.1)",
          borderRadius: "5px",
          border: "1px solid #4b6cb7",
        }}
      >
        <strong style={{ color: "#4b6cb7" }}>Usage Notes:</strong>
        <ul>
          <li>
            ViemAccountAuthenticator is suitable for server environments where
            private keys can be securely stored.
          </li>
          <li>
            WalletClientAuthenticator is designed for browser environments where
            users interact with web3 wallets.
          </li>
          <li>
            Browsers can use both authentication methods, but servers should
            only use ViemAccountAuthenticator.
          </li>
          <li>
            This approach gives you more control over the minting process
            compared to using the auth server.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default EoaAuthSection;
