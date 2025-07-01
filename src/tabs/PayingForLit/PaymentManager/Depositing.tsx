import React from "react";
import GreyBoarderWhiteBgContainer from "../../../components/layout/GreyboardWhiteBgContainer";
import { NoteCallout } from "../../../components/common";
import DisplayCode from "../../../components/DisplayCode";
import { Link } from "react-router-dom";
import { pageStyles } from "../../../styles/pageStyles";

const PaymentManagerDepositing: React.FC = () => {
  const setupPaymentManagerCode = `import { createLitClient } from '@lit-protocol/lit-client';
import { nagaDev } from '@lit-protocol/networks';

// Create lit client
const litClient = await createLitClient({ network: nagaDev });

// Get PaymentManager instance (requires account for transactions)
const paymentManager = await litClient.getPaymentManager({ 
  account: yourAccount // viem account instance
});`;

  const basicDepositExample = `// Deposit funds to your own account
const depositAmount = "0.1"; // Amount in ETH

try {
  const result = await paymentManager.deposit({ 
    amountInEth: depositAmount 
  });
  
  console.log(\`Deposit successful: \${result.hash}\`);
  console.log("Transaction receipt:", result.receipt);
  
  // The deposit is immediately available for use
  // Check your balance after deposit
  const balance = await paymentManager.getBalance({ 
    userAddress: yourAccount.address 
  });
  console.log(\`New balance: \${balance.totalBalance} ETH\`);
  
} catch (error) {
  console.error("Deposit failed:", error.message);
}`;

  const depositForUserExample = `// Deposit funds for another user's account
const recipientAddress = "0x742d35Cc6434C0532925a3b8D6Ac6e7a1b64E5c2";
const depositAmount = "0.05"; // Amount in ETH

try {
  const result = await paymentManager.depositForUser({ 
    userAddress: recipientAddress,
    amountInEth: depositAmount
  });
  
  console.log(\`Deposit for user successful: \${result.hash}\`);
  
  // Check the recipient's updated balance
  const recipientBalance = await paymentManager.getBalance({ 
    userAddress: recipientAddress 
  });
  console.log(\`Recipient's new balance: \${recipientBalance.totalBalance} ETH\`);
  
} catch (error) {
  console.error("Deposit for user failed:", error.message);
}`;

  const checkBalanceExample = `// Get comprehensive balance information
const userAddress = "0x742d35Cc6434C0532925a3b8D6Ac6e7a1b64E5c2";

const balance = await paymentManager.getBalance({ 
  userAddress: userAddress 
});

console.log(\`Total Balance: \${balance.totalBalance} ETH\`);
console.log(\`Available Balance: \${balance.availableBalance} ETH\`);

// Raw values in Wei (bigint)
console.log("Raw total balance (Wei):", balance.raw.totalBalance);
console.log("Raw available balance (Wei):", balance.raw.availableBalance);

// Available balance excludes any pending withdrawals
const difference = parseFloat(balance.totalBalance) - parseFloat(balance.availableBalance);
if (difference > 0) {
  console.log(\`Pending withdrawals: \${difference} ETH\`);
}`;

  const batchDepositExample = `// Deposit for multiple users in a single transaction flow
const recipients = [
  { address: "0x742d35Cc6434C0532925a3b8D6Ac6e7a1b64E5c2", amount: "0.1" },
  { address: "0x8ba1f109551bD432803012645Hac136c4b5F7A4b", amount: "0.05" },
  { address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", amount: "0.2" }
];

try {
  // Process deposits sequentially
  for (const recipient of recipients) {
    const result = await paymentManager.depositForUser({
      userAddress: recipient.address,
      amountInEth: recipient.amount
    });
    
    console.log(\`Deposited \${recipient.amount} ETH for \${recipient.address}\`);
    console.log(\`Transaction hash: \${result.hash}\`);
    
    // Small delay between transactions to avoid nonce issues
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log("All deposits completed successfully");
  
} catch (error) {
  console.error("Batch deposit failed:", error.message);
}`;

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>Depositing $LITKEY Tokens</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Introduction</h2>
        <p style={pageStyles.p}>
          Depositing $LITKEY tokens into the Ledger smart contract is the first
          step to using Lit Protocol's paid services. The Payment Manager
          provides a simple interface for making deposits to your own account or
          on behalf of other users, enabling you to pay for Lit network
          operations or pay on behalf of your users.
        </p>

        <p style={pageStyles.p}>
          Once deposited, $LITKEY tokens become immediately available for paying
          for Lit network operations such as PKP signing, decryption, and Lit
          Action execution. The deposited balance is managed transparently
          on-chain by the Ledger contract with full audit trail.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Setting Up Payment Manager</h2>

        <NoteCallout
          message={
            <>
              <p>
                The Payment Manager requires a configured account (viem account
                instance) to perform transactions. Make sure you have sufficient
                $LITKEY tokens in your wallet and that your account has enough
                ETH to cover gas fees.
              </p>
            </>
          }
          variant="note"
          style={{ marginBottom: "16px" }}
        />

        <p style={pageStyles.p}>
          Before making deposits, you need to initialize the Payment Manager
          with your account. This account will be used to sign transactions and
          pay for gas fees.
        </p>

        <DisplayCode code={setupPaymentManagerCode} language="typescript" />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Basic Self-Deposit</h2>

        <p style={pageStyles.p}>
          The most common deposit scenario is adding $LITKEY to your own account
          balance. This gives you immediate access to paid Lit network services
          using your deposited funds.
        </p>

        <DisplayCode code={basicDepositExample} language="typescript" />

        <div style={{ marginTop: "20px" }}>
          <h3 style={pageStyles.h3}>What Happens During Deposit</h3>
          <ul style={pageStyles.ul}>
            <li style={pageStyles.li}>
              Your wallet signs a transaction transferring $LITKEY to the Ledger
              contract
            </li>
            <li style={pageStyles.li}>
              The Ledger contract updates your account balance immediately
            </li>
            <li style={pageStyles.li}>
              Funds become available for Lit network operations once the
              transaction is confirmed
            </li>
            <li style={pageStyles.li}>
              You can verify the deposit by checking your balance
            </li>
          </ul>
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Depositing for Other Users</h2>

        <p style={pageStyles.p}>
          The Payment Manager allows you to deposit $LITKEY on behalf of other
          users, enabling sponsored transaction workflows. This is useful for
          onboarding new users or covering operational costs for your
          application's users.
        </p>

        <NoteCallout
          message={
            <>
              <p>
                <strong>Important:</strong> When you deposit for another user,
                you give them complete control over those funds. You cannot
                reclaim the deposited $LITKEY unless the recipient chooses to
                withdraw and transfer the tokens back to you.
              </p>
            </>
          }
          variant="note"
          style={{ marginBottom: "16px" }}
        />

        <DisplayCode code={depositForUserExample} language="typescript" />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Checking Account Balances</h2>

        <p style={pageStyles.p}>
          After making deposits, you can check account balances to verify
          successful transactions and monitor available funds. The Payment
          Manager provides detailed balance information including total balance
          and available balance (excluding pending withdrawals).
        </p>

        <DisplayCode code={checkBalanceExample} language="typescript" />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Batch Deposits</h2>

        <p style={pageStyles.p}>
          For applications that need to fund multiple users, you can perform
          batch deposits by making multiple <code>depositForUser</code> calls.
          Each deposit is a separate transaction, so proper error handling and
          nonce management are important.
        </p>

        <DisplayCode code={batchDepositExample} language="typescript" />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Important Considerations</h2>

        <h4 style={pageStyles.h4}>Transaction Costs</h4>
        <p style={pageStyles.p}>
          Each deposit operation requires a blockchain transaction with
          associated gas fees. Factor these costs into your application's
          economics, especially for batch operations or frequent small deposits.
        </p>

        <h4 style={pageStyles.h4}>Minimum Deposit Amounts</h4>
        <p style={pageStyles.p}>
          While there's no enforced minimum deposit amount, consider the cost of
          Lit network operations when deciding deposit amounts. Very small
          deposits may be quickly consumed by a single operation.
        </p>

        <h4 style={pageStyles.h4}>Token Allowances</h4>
        <p style={pageStyles.p}>
          If your wallet hasn't previously interacted with the Ledger contract,
          you may need to approve the contract to spend your $LITKEY tokens.
          Most wallets will prompt you for this approval automatically.
        </p>

        <h4 style={pageStyles.h4}>Network Confirmation Times</h4>
        <p style={pageStyles.p}>
          Deposits become available after the transaction is confirmed on the
          blockchain. On Ethereum mainnet, this typically takes 1-2 minutes, but
          can vary based on network congestion and gas prices.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Error Handling Best Practices</h2>

        <p style={pageStyles.p}>
          Robust error handling is essential for deposit operations since they
          involve blockchain transactions and token transfers. Common issues
          include insufficient token balance, network connectivity problems, and
          transaction failures.
        </p>

        <div style={{ marginTop: "20px" }}>
          <h3 style={pageStyles.h3}>Common Error Scenarios</h3>
          <ul style={pageStyles.ul}>
            <li style={pageStyles.li}>
              <strong>Insufficient $LITKEY Balance:</strong> Ensure the
              depositing account has enough tokens before attempting deposit
            </li>
            <li style={pageStyles.li}>
              <strong>Insufficient ETH for Gas:</strong> The account needs ETH
              to pay for transaction gas fees
            </li>
            <li style={pageStyles.li}>
              <strong>Invalid Recipient Address:</strong> Verify recipient
              addresses are valid Ethereum addresses when depositing for others
            </li>
            <li style={pageStyles.li}>
              <strong>Network Connectivity:</strong> Handle network timeouts and
              connection failures gracefully
            </li>
            <li style={pageStyles.li}>
              <strong>Transaction Reverted:</strong> Monitor transaction status
              and provide meaningful error messages to users
            </li>
          </ul>
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Next Steps</h2>

        <p style={pageStyles.p}>
          Once you've successfully deposited $LITKEY tokens, you can start using
          Lit Protocol's paid services. Your deposited balance will be
          automatically deducted as you use the network.
        </p>

        <div style={{ marginTop: "20px" }}>
          <h3 style={pageStyles.h3}>Related Topics</h3>
          <ul style={pageStyles.ul}>
            <li style={pageStyles.li}>
              <Link
                to="/paying-for-lit/payment-manager/quick-start"
                style={{
                  color: "#007bff",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                }}
              >
                Payment Manager Quick Start
              </Link>{" "}
              - Complete Payment Manager tutorial with interactive examples
            </li>
            <li style={pageStyles.li}>
              <Link
                to="/paying-for-lit/overview"
                style={{
                  color: "#007bff",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                }}
              >
                Payment Overview
              </Link>{" "}
              - Learn about Lit Protocol's payment system and delegation
            </li>
            <li style={pageStyles.li}>
              Setting up withdrawal requests - Learn how to withdraw your
              deposited funds when needed
            </li>
          </ul>
        </div>
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default PaymentManagerDepositing;
