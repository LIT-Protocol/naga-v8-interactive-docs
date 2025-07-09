/**
 * SetupPaymentManager.tsx
 *
 * This component provides a comprehensive guide on setting up the Payment Manager
 * for Lit Protocol. This page serves as a prerequisite for other Payment Manager
 * operations and covers all necessary setup steps including account configuration,
 * network selection, and initialization.
 */

import React from "react";
import GreyBoarderWhiteBgContainer from "../../../components/layout/GreyboardWhiteBgContainer";
import { NoteCallout } from "../../../components/common";
import DisplayCode from "../../../components/DisplayCode";
import { Link } from "react-router-dom";
import { pageStyles } from "../../../styles/pageStyles";

const SetupPaymentManager: React.FC = () => {
  const nextSteps = [
    {
      title: (
        <>
          Deposit <code>$LITKEY</code>
        </>
      ),
      description: (
        <>
          Learn how to deposit <code>$LITKEY</code> tokens into the Ledger smart
          contract, so you can use them to pay for Lit services:
        </>
      ),
      icon: "💰",
      links: [
        {
          text: "Deposit $LITKEY Tokens",
          to: "/paying-for-lit/payment-manager/depositing",
        },
      ],
    },
    {
      title: (
        <>
          Withdraw <code>$LITKEY</code>
        </>
      ),
      description: (
        <>
          Learn how to withdraw <code>$LITKEY</code> tokens from the Ledger
          smart contract back to your wallet:
        </>
      ),
      icon: "💸",
      links: [
        {
          text: "Withdraw $LITKEY Tokens",
          to: "/paying-for-lit/payment-manager/withdrawing",
        },
      ],
    },
    {
      title: <>Start Using Lit Services</>,
      description: (
        <>
          Starting using your configured Payment Manager to pay for Lit services
          like:
        </>
      ),
      icon: "🚀",
      links: [
        {
          text: "Signing with PKPs",
          to: "/programmable-keys/pkps/getting-started",
        },
        {
          text: "Decrypting Data",
          to: "/encryption/overview",
        },
        {
          text: "Executing Lit Actions",
          to: "/lit-actions/overview",
        },
      ],
    },
  ];

  const installationCode = `
npm install @lit-protocol/lit-client @lit-protocol/networks viem`;

  const createLitClientCode = `
import { createLitClient } from '@lit-protocol/lit-client';
import { nagaDev } from '@lit-protocol/networks';

const litClient = await createLitClient({ 
  network: nagaDev 
});`;

  const privateKeyAccountCode = `
import { privateKeyToAccount } from 'viem/accounts';

const privateKey = process.env.PRIVATE_KEY as \`0x\${string}\`;
const myAccount = privateKeyToAccount(privateKey);`;

  const walletClientAccountCode = `
import { useWalletClient } from 'wagmi';

const { data: walletClient } = useWalletClient();
const myAccount = walletClient;`;

  const createPaymentManagerCode = `
const paymentManager = await litClient.getPaymentManager({ 
  account: myAccount
});`;

  const verificationCode = `
const balance = await paymentManager.getBalance({ 
    userAddress: myAccount.address 
});
console.log(\`Current balance: \${balance.totalBalance} $LITKEY\`);`;

  const completeSetupCode = `
// Step 1: Install and import dependencies
import { createLitClient } from '@lit-protocol/lit-client';
import { nagaDev } from '@lit-protocol/networks';
import { privateKeyToAccount } from 'viem/accounts';

// Step 2: Create Lit Client
const litClient = await createLitClient({ 
    network: nagaDev 
});

// Step 3: Create Viem account
const privateKey = process.env.PRIVATE_KEY as \`0x\${string}\`;
const myAccount = privateKeyToAccount(privateKey);

// Step 4: Initialize Payment Manager
const paymentManager = await litClient.getPaymentManager({ 
    account: myAccount
});

// Step 5: Verify setup
const balance = await paymentManager.getBalance({ 
    userAddress: myAccount.address 
});
console.log(\`Current balance: \${balance.totalBalance} $LITKEY\`);`;

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>Setting Up the Payment Manager</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Introduction</h2>
        <p style={pageStyles.p}>
          The Payment Manager provides a simple interface to Lit Protocol's paid
          services. It provides a unified interface for managing{" "}
          <code>$LITKEY</code> deposits, withdrawals, balance queries, and
          payment delegation.
        </p>

        <p style={pageStyles.p}>
          Once configured, the Payment Manager handles all the complexity of
          interacting with Lit's payment infrastructure, allowing you to focus
          on building your application's core functionality.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Prerequisites</h2>

        <ul style={pageStyles.ul}>
          <li style={pageStyles.li}>
            <strong>Ethereum Account:</strong> Private key or connected wallet
            to create a Viem account
          </li>
        </ul>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Step 1: Install Required Packages</h2>

        <p style={pageStyles.p}>
          First, install the required Lit Protocol packages. These packages
          provide the core functionality for creating Lit clients, managing
          authentication, and handling blockchain interactions.
        </p>

        <DisplayCode code={installationCode} language="bash" />

        <div style={{ marginTop: "20px" }}>
          <h3 style={pageStyles.h3}>Package Overview</h3>
          <ul style={pageStyles.ul}>
            <li style={pageStyles.li}>
              <strong>@lit-protocol/lit-client:</strong> Core client for
              interacting with Lit nodes
            </li>
            <li style={pageStyles.li}>
              <strong>@lit-protocol/networks:</strong> Network configurations
              and endpoints
            </li>
            <li style={pageStyles.li}>
              <strong>viem:</strong> Ethereum library for account management and
              transactions
            </li>
          </ul>
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Step 2: Create Lit Client</h2>
        <p style={pageStyles.p}>
          As covered in the{" "}
          <Link
            to="/paying-for-lit/payment-manager/quickstart"
            style={{
              color: "#007bff",
              textDecoration: "underline",
            }}
          >
            Setup Lit Client
          </Link>{" "}
          guide, import the necessary modules and create an instance of the Lit
          Client:
        </p>

        <DisplayCode
          code={createLitClientCode}
          language="typescript"
          style={{ marginBottom: "16px" }}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Step 3: Configure a Viem Account</h2>

        <p style={pageStyles.p}>
          The Payment Manager requires an account to sign transactions. You can
          use a private key, connect a browser wallet using <code>wagmi</code>,
          or{" "}
          <Link
            to="/building-with-lit/setup-auth-manager"
            style={{
              color: "#007bff",
              textDecoration: "underline",
            }}
          >
            connect a PKP Viem account
          </Link>
          .
        </p>

        <p style={pageStyles.p}>
          For this guide, we'll use a private key account:
        </p>
        <DisplayCode code={privateKeyAccountCode} language="typescript" />

        <NoteCallout
          message={
            <>
              <p>
                <p style={pageStyles.p}>
                  Here is how you could connect a browser wallet using{" "}
                  <code>wagmi</code>:
                </p>

                <DisplayCode
                  code={walletClientAccountCode}
                  language="typescript"
                />
              </p>
            </>
          }
          variant="tip"
          title="Tip"
          style={{ marginTop: "16px" }}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Step 4: Initialize Payment Manager</h2>

        <p style={pageStyles.p}>
          With your Lit Client and account configured, you can now create the
          Payment Manager instance. This will enable you to perform all payment
          operations.
        </p>

        <DisplayCode
          code={createPaymentManagerCode}
          language="typescript"
          style={{ marginBottom: "16px" }}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Step 5: Verify Your Setup</h2>

        <p style={pageStyles.p}>
          It's important to verify that your Payment Manager is properly
          configured before proceeding with operations. This verification step
          helps catch configuration issues early.
        </p>

        <DisplayCode
          code={verificationCode}
          language="typescript"
          style={{ marginBottom: "16px" }}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Complete Setup Example</h2>

        <p style={pageStyles.p}>
          Here's a complete code example that combines all the setup steps:
        </p>

        <DisplayCode code={completeSetupCode} language="typescript" />
      </GreyBoarderWhiteBgContainer>

      {/* Next Steps */}
      <GreyBoarderWhiteBgContainer
        style={{
          backgroundColor: "#f0f9ff",
          border: "1px solid #3b82f6",
          borderRadius: "8px",
          padding: "20px",
          marginTop: "20px",
        }}
      >
        <h2 style={pageStyles.h2}>Next Steps</h2>
        <p style={pageStyles.p}>
          Now that you have a configured Payment Manager, explore these payment
          operations and management features:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
            marginTop: "24px",
          }}
        >
          {nextSteps.map((step, index) => (
            <div
              key={index}
              style={{
                padding: "20px",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  marginBottom: "12px",
                }}
              >
                {step.icon}
              </div>
              <h3
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  color: "#1f2937",
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "0.9rem",
                  color: "#6b7280",
                  lineHeight: "1.5",
                }}
              >
                {step.description}
              </p>
              <ul
                style={{
                  margin: "0",
                  paddingLeft: "16px",
                  fontSize: "0.85rem",
                }}
              >
                {step.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link to={link.to} style={{ color: "#3b82f6" }}>
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default SetupPaymentManager;
