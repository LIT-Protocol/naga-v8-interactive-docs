/**
 * Delegating.tsx
 *
 * This component provides a comprehensive guide on payment delegation using
 * the Payment Delegation contract. It covers adding/removing delegatees,
 * setting payment restrictions, and managing delegated payment permissions.
 */

import React from "react";
import GreyBoarderWhiteBgContainer from "../../../components/layout/GreyboardWhiteBgContainer";
import { NoteCallout } from "../../../components/common";
import DisplayCode from "../../../components/DisplayCode";
import { Link } from "react-router-dom";
import { pageStyles } from "../../../styles/pageStyles";

const PaymentManagerDelegating: React.FC = () => {
  const setupCode = `import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { nagaDev } from '@lit-protocol/networks';

// Setup your account and clients
const myAccount = privateKeyToAccount(process.env.PRIVATE_KEY as \`0x\${string}\`);

const publicClient = createPublicClient({
  chain: nagaDev.viemConfig,
  transport: http(),
});

const walletClient = createWalletClient({
  account: myAccount,
  chain: nagaDev.viemConfig,
  transport: http(),
});

const PAYMENT_DELEGATION_FACET_ABI = "...";
const PAYMENT_DELEGATION_CONTRACT_ADDRESS = "0x...";
`;

  const addDelegateeExample = `// Add a single payment delegatee
const delegateeAddress = '0x742d35Cc6434C0532925a3b8D6Ac6e7a1b64E5c2';

const hash = await walletClient.writeContract({
    address: PAYMENT_DELEGATION_CONTRACT_ADDRESS,
    abi: PAYMENT_DELEGATION_FACET_ABI,
    functionName: 'delegatePayments',
    args: [delegateeAddress],
  });

const receipt = await publicClient.waitForTransactionReceipt({ hash });
console.log('Delegation confirmed!', receipt);`;

  const batchAddDelegateesExample = `// Add multiple payment delegatees in one transaction
const delegatees = [
  '0x742d35Cc6434C0532925a3b8D6Ac6e7a1b64E5c2',
  '0x8ba1f109551bD432803012645Hac136c4b5F7A4b',
  '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
];

const hash = await walletClient.writeContract({
  address: PAYMENT_DELEGATION_CONTRACT_ADDRESS,
  abi: PAYMENT_DELEGATION_FACET_ABI,
  functionName: 'delegatePaymentsBatch',
  args: [delegatees],
});

const receipt = await publicClient.waitForTransactionReceipt({ hash });
console.log(\`Successfully delegated to \${delegatees.length} users\`);`;

  const setRestrictionsExample = `// Set payment restrictions for your delegatees
const restrictions = {
  totalMaxPrice: BigInt('1000000000000000000'), // 1 $LITKEY in wei
  periodSeconds: BigInt(3600), // 1 hour in seconds
  requestsPerPeriod: BigInt(10), // Max 10 requests per hour
};

const hash = await walletClient.writeContract({
  address: PAYMENT_DELEGATION_CONTRACT_ADDRESS,
  abi: PAYMENT_DELEGATION_FACET_ABI,
  functionName: 'setRestriction',
  args: [restrictions],
});

const receipt = await publicClient.waitForTransactionReceipt({ hash });
console.log('Payment restrictions updated successfully!');`;

  const removeDelegateeExample = `// Remove a single payment delegatee
const delegateeToRemove = '0x742d35Cc6434C0532925a3b8D6Ac6e7a1b64E5c2';

const hash = await walletClient.writeContract({
  address: PAYMENT_DELEGATION_CONTRACT_ADDRESS,
  abi: PAYMENT_DELEGATION_FACET_ABI,
  functionName: 'undelegatePayments',
  args: [delegateeToRemove],
});

const receipt = await publicClient.waitForTransactionReceipt({ hash });
console.log('Delegatee removed successfully!');`;

  const batchRemoveDelegateesExample = `// Remove multiple payment delegatees in one transaction
const delegateesToRemove = [
  '0x742d35Cc6434C0532925a3b8D6Ac6e7a1b64E5c2',
  '0x8ba1f109551bD432803012645Hac136c4b5F7A4b',
  '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
];

const hash = await walletClient.writeContract({
  address: PAYMENT_DELEGATION_CONTRACT_ADDRESS,
  abi: PAYMENT_DELEGATION_FACET_ABI,
  functionName: 'undelegatePaymentsBatch',
  args: [delegateesToRemove],
});

const receipt = await publicClient.waitForTransactionReceipt({ hash });
console.log(\`Successfully removed \${delegateesToRemove.length} delegatees\`);`;

  const viewDelegationsExample = `
// Get all users you've delegated to
const delegatedUsers = await publicClient.readContract({
  address: PAYMENT_DELEGATION_CONTRACT_ADDRESS,
  abi: PAYMENT_DELEGATION_FACET_ABI,
  functionName: 'getUsers',
  args: [myAccount.address],
});

console.log('Your delegatees:', delegatedUsers);

// Get your current payment restrictions
const restrictions = await publicClient.readContract({
  address: PAYMENT_DELEGATION_CONTRACT_ADDRESS,
  abi: PAYMENT_DELEGATION_FACET_ABI,
  functionName: 'getRestriction',
  args: [myAccount.address],
});

console.log('Your payment restrictions:', {
  totalMaxPrice: restrictions.totalMaxPrice.toString(),
  periodSeconds: restrictions.periodSeconds.toString(),
  requestsPerPeriod: restrictions.requestsPerPeriod.toString(),
});`;

  const checkPayersExample = `// Check who can pay for a specific user's operations
const userAddress = '0x742d35Cc6434C0532925a3b8D6Ac6e7a1b64E5c2';

const payers = await publicClient.readContract({
  address: PAYMENT_DELEGATION_CONTRACT_ADDRESS,
  abi: PAYMENT_DELEGATION_FACET_ABI,
  functionName: 'getPayers',
  args: [userAddress],
});

console.log(\`Accounts that can pay for \${userAddress}:\`, payers);`;

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>Payment Delegation Management</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Introduction</h2>
        <p style={pageStyles.p}>
          Payment delegation allows you to authorize other users to spend your
          deposited <code>$LITKEY</code> tokens on Lit network operations. This
          enables sponsored transaction workflows where you can pay for your
          users' operations while maintaining control through payment
          restrictions.
        </p>

        <p style={pageStyles.p}>
          The Payment Delegation system provides fine-grained control over who
          can spend your funds and how much they can spend, with optional rate
          limiting to prevent abuse. All delegation operations are managed
          through smart contracts for transparency and security.
        </p>

        <div style={{ marginTop: "24px" }}>
          <h3 style={pageStyles.h3}>Key Features</h3>
          <ul style={pageStyles.ul}>
            <li style={pageStyles.li}>
              <strong>Flexible Authorization:</strong> Add or remove delegatees
              at any time
            </li>
            <li style={pageStyles.li}>
              <strong>Spending Limits:</strong> Set maximum total spending
              amounts per delegatee
            </li>
            <li style={pageStyles.li}>
              <strong>Rate Limiting:</strong> Control the frequency of requests
              within time periods
            </li>
            <li style={pageStyles.li}>
              <strong>Batch Operations:</strong> Manage multiple delegatees in
              single transactions
            </li>
          </ul>
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Prerequisites</h2>

        <p style={pageStyles.p}>
          Before managing payment delegations, ensure you have:
        </p>

        <ul style={pageStyles.ul}>
          <li style={pageStyles.li}>
            Access to an Ethereum account that has{" "}
            <Link
              to="/paying-for-lit/payment-manager/depositing"
              style={{
                color: "#007bff",
                textDecoration: "underline",
              }}
            >
              deposited $LITKEY tokens
            </Link>{" "}
            into the Ledger contract.
          </li>
          <li style={pageStyles.li}>
            The ABI and contract address for the{" "}
            <code>PaymentDelegationFacet</code> contract.
            <ul style={pageStyles.ul}>
              <li style={pageStyles.li}>
                If you're using <code>Naga-dev</code>, the deployed contract
                ABIs are available{" "}
                <a
                  href="https://github.com/LIT-Protocol/networks/tree/main/naga-dev/abis"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#007bff",
                    textDecoration: "underline",
                  }}
                >
                  here
                </a>
                , and the deployed contract addresses are available{" "}
                <a
                  href="https://github.com/LIT-Protocol/networks/blob/main/naga-dev/deployed-lit-node-contracts-temp.json"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#007bff",
                    textDecoration: "underline",
                  }}
                >
                  here
                </a>
              </li>
              <li style={pageStyles.li}>
                If you're using <code>Naga-test</code>, the deployed contract
                ABIs are available{" "}
                <a
                  href="https://github.com/LIT-Protocol/networks/tree/main/naga-test/abis"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#007bff",
                    textDecoration: "underline",
                  }}
                >
                  here
                </a>
                , and the deployed contract addresses are available{" "}
                <a
                  href="https://github.com/LIT-Protocol/networks/blob/main/naga-test/deployed-lit-node-contracts-temp.json"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#007bff",
                    textDecoration: "underline",
                  }}
                >
                  here
                </a>
              </li>
            </ul>
          </li>
        </ul>

        <NoteCallout
          message={
            <>
              <p>
                The Lit SDK doesn't currently include Payment Delegation
                methods. This guide uses viem directly with the contract ABI and
                address until native SDK support is added.
              </p>
            </>
          }
          variant="note"
          style={{ marginTop: "16px" }}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Setup and Contract Interface</h2>

        <p style={pageStyles.p}>
          First, set up your viem clients and the contract interface for
          interacting with the Payment Delegation contract.
        </p>

        <DisplayCode code={setupCode} language="typescript" />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Adding Payment Delegatees</h2>

        <p style={pageStyles.p}>
          Grant permission for specific users to spend your deposited{" "}
          <code>$LITKEY</code> tokens to pay for Lit network operations. You can
          add delegatees individually or in batches.
        </p>

        <div style={{ marginBottom: "24px" }}>
          <h3 style={pageStyles.h3}>Add Single Delegatee</h3>
          <p style={pageStyles.p}>Add a single user as a payment delegatee:</p>

          <DisplayCode code={addDelegateeExample} language="typescript" />
        </div>

        <div>
          <h3 style={pageStyles.h3}>Add Multiple Delegatees</h3>
          <p style={pageStyles.p}>
            You can also add multiple delegatees in a single transaction:
          </p>

          <DisplayCode code={batchAddDelegateesExample} language="typescript" />
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Setting Payment Restrictions</h2>

        <p style={pageStyles.p}>
          Control how much and how often your delegatees can spend by setting
          payment restrictions. These limits apply to all your delegatees, but
          limits are tracked for each delegatee separately.
        </p>

        <DisplayCode code={setRestrictionsExample} language="typescript" />

        <div style={{ marginTop: "20px" }}>
          <h3 style={pageStyles.h3}>Restriction Parameters</h3>
          <ul style={pageStyles.ul}>
            <li style={pageStyles.li}>
              <strong>totalMaxPrice:</strong> Maximum total amount of{" "}
              <code>$LITKEY</code> that can be spent per delegatee (in wei)
            </li>
            <li style={pageStyles.li}>
              <strong>periodDuration:</strong> Time window for rate limiting (in
              seconds)
            </li>
            <li style={pageStyles.li}>
              <strong>requestsPerPeriod:</strong> Maximum number of requests
              allowed within the period duration
            </li>
          </ul>
        </div>

        <NoteCallout
          message={
            <>
              <p>
                Restrictions apply to all your delegatees, and setting new
                restrictions will overwrite previous ones.
              </p>
            </>
          }
          variant="note"
          style={{ marginTop: "16px" }}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Viewing Delegation Status</h2>

        <p style={pageStyles.p}>
          Check your current delegatees, payment restrictions, and delegation
          relationships using the contract's view functions.
        </p>

        <div style={{ marginBottom: "24px" }}>
          <h3 style={pageStyles.h3}>View Your Delegatees and Restrictions</h3>
          <p style={pageStyles.p}>
            Check who you've delegated to and your current payment restrictions:
          </p>

          <DisplayCode code={viewDelegationsExample} language="typescript" />
        </div>

        <div>
          <h3 style={pageStyles.h3}>Check Who Can Pay for a User</h3>
          <p style={pageStyles.p}>
            See which accounts have delegated payment for a specific user:
          </p>

          <DisplayCode code={checkPayersExample} language="typescript" />
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Removing Payment Delegatees</h2>

        <p style={pageStyles.p}>
          Revoke payment delegation from users when you no longer want them to
          spend your <code>$LITKEY</code> tokens. Like adding delegatees, you
          can remove them individually or in batches.
        </p>

        <DisplayCode code={removeDelegateeExample} language="typescript" />

        <div style={{ marginTop: "20px" }}>
          <h3 style={pageStyles.h3}>Batch Remove Delegatees</h3>
          <p style={pageStyles.p}>
            To remove multiple delegatees at once, use{" "}
            <code>undelegatePaymentsBatch</code> with an array of addresses:
          </p>

          <DisplayCode
            code={batchRemoveDelegateesExample}
            language="typescript"
          />
        </div>
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default PaymentManagerDelegating;
