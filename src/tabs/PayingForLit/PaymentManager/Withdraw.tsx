import React from "react";
import GreyBoarderWhiteBgContainer from "../../../components/layout/GreyboardWhiteBgContainer";
import { NoteCallout } from "../../../components/common";
import DisplayCode from "../../../components/DisplayCode";
import { Link } from "react-router-dom";
import { pageStyles } from "../../../styles/pageStyles";

const PaymentManagerWithdraw: React.FC = () => {
  const requestWithdrawExample = `
// Request withdraw of 0.1 $LITKEY tokens
const result = await paymentManager.requestWithdraw({ 
  amountInEth: "0.1"
});
console.log("Withdraw request transaction:", result.receipt);

// Check the withdraw request details
const withdrawRequest = await paymentManager.getWithdrawRequest({ 
  userAddress: myAccount.address 
});
console.log(\`Withdraw requested: \${withdrawRequest.amount} $LITKEY\`);
console.log(\`Request timestamp: \${withdrawRequest.timestamp}\`);`;

  const checkWithdrawStatusExample = `
// Check if withdraw can be executed
const status = await paymentManager.canExecuteWithdraw({ 
  userAddress: myAccount.address 
});

if (status.canExecute) {
  console.log("Withdraw is ready to execute!");
} else if (status.timeRemaining) {
  console.log(\`Time remaining: \${status.timeRemaining} seconds\`);
} else {
  console.log("No pending withdraw request");
}

// Get withdraw delay info
const delay = await paymentManager.getWithdrawDelay();
console.log(\`Withdraw delay: \${delay.delaySeconds} seconds\`);`;

  const executeWithdrawExample = `
// First, verify the withdraw can be executed
const status = await paymentManager.canExecuteWithdraw({ 
  userAddress: myAccount.address 
});

if (!status.canExecute) {
  throw new Error("Withdraw cannot be executed yet");
}

// Execute the withdraw (can be less than or equal to requested amount)
const withdrawAmount = status.withdrawRequest.amount; // Full amount
// const withdrawAmount = "0.05"; // Or partial amount, must be <= requested amount

const result = await paymentManager.withdraw({ 
  amountInEth: withdrawAmount
});
console.log("Withdraw executed:", result.receipt);

// Check updated balance
const balance = await paymentManager.getBalance({ 
  userAddress: myAccount.address 
});
console.log(\`New available balance: \${balance.availableBalance} $LITKEY\`);`;

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>Withdrawing $LITKEY Tokens</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Introduction</h2>
        <p style={pageStyles.p}>
          Withdrawing <code>$LITKEY</code> tokens from the Ledger smart contract
          follows a two-step process designed for security and health of the
          network. You must first request a withdraw, wait for a mandatory delay
          period, and then execute the withdraw to receive your tokens back to
          your wallet.
        </p>

        <p style={pageStyles.p}>
          The Payment Manager provides methods to handle each step of this
          process, including utilities to check withdraw status and timing. This
          ensures a smooth withdraw experience while maintaining the security
          guarantees of the Ledger contract.
        </p>

        <div style={{ marginTop: "24px" }}>
          <h3 style={pageStyles.h3}>Withdraw Process</h3>
          <ol
            style={{
              ...pageStyles.ul,
              listStyle: "decimal",
              paddingLeft: "2rem",
            }}
          >
            <li style={pageStyles.li}>
              <strong>Request Withdraw:</strong> Submit a withdraw request
              specifying the amount to withdraw
            </li>
            <li style={pageStyles.li}>
              <strong>Wait for Delay:</strong> Wait for the mandatory delay
              period
            </li>
            <li style={pageStyles.li}>
              <strong>Execute Withdraw:</strong> Complete the withdraw to
              receive tokens in your wallet
            </li>
          </ol>
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Prerequisites</h2>

        <ul style={pageStyles.ul}>
          <li style={pageStyles.li}>
            <strong>Payment Manager:</strong> A configured Payment Manager
            instance, see the{" "}
            <Link
              to="/paying-for-lit/payment-manager/setup-payment-manager"
              style={{ color: "#007bff", textDecoration: "underline" }}
            >
              Setup Payment Manager
            </Link>{" "}
            guide for more information.
          </li>
          <li style={pageStyles.li}>
            <strong>Deposited Balance:</strong> You must have{" "}
            <code>$LITKEY</code> tokens{" "}
            <Link
              to="/paying-for-lit/payment-manager/depositing"
              style={{ color: "#007bff", textDecoration: "underline" }}
            >
              deposited in the Ledger contract
            </Link>{" "}
            to withdraw.
          </li>
          <li style={pageStyles.li}>
            <strong>Available Balance:</strong> The amount you withdraw cannot
            exceed your available balance (total balance minus any pending
            withdraws).
          </li>
        </ul>

        <NoteCallout
          message={
            <>
              <p>
                You can only have one pending withdraw request at a time.
                However, once you execute a withdraw, you can immediately
                request another. There's no limit to the total number of
                withdraws you can make over time.
              </p>
            </>
          }
          variant="note"
          style={{ marginTop: "16px" }}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Step 1: Request a Withdraw</h2>

        <p style={pageStyles.p}>
          Begin the withdraw process by requesting your desired amount of tokens
          to be withdrawn from the Ledger payment contract:
        </p>

        <DisplayCode code={requestWithdrawExample} language="typescript" />

        <div style={{ marginTop: "20px" }}>
          <h3 style={pageStyles.h3}>What Happens</h3>
          <ul style={pageStyles.ul}>
            <li style={pageStyles.li}>
              Your withdraw request is recorded on-chain with a timestamp
            </li>
            <li style={pageStyles.li}>
              The requested amount is reserved and deducted from your available
              balance
            </li>
            <li style={pageStyles.li}>
              The delay period begins, during which the withdraw cannot be
              executed
            </li>
            <li style={pageStyles.li}>
              You cannot make additional withdraw requests until this one is
              completed
            </li>
          </ul>
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Step 2: Check Withdraw Status</h2>

        <p style={pageStyles.p}>
          Use the Payment Manager's status checking methods to monitor your
          withdraw request and determine when it's ready to execute.
        </p>

        <DisplayCode code={checkWithdrawStatusExample} language="typescript" />

        <div style={{ marginTop: "20px" }}>
          <h3 style={pageStyles.h3}>Status Information</h3>
          <ul style={pageStyles.ul}>
            <li style={pageStyles.li}>
              <strong>canExecute:</strong> Boolean indicating if the withdraw is
              ready
            </li>
            <li style={pageStyles.li}>
              <strong>timeRemaining:</strong> Seconds remaining in the delay
              period (if any)
            </li>
            <li style={pageStyles.li}>
              <strong>withdrawRequest:</strong> Details about your pending
              withdraw request
            </li>
          </ul>
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Step 3: Execute Withdraw</h2>

        <p style={pageStyles.p}>
          Once the delay period has passed, you can execute the withdraw to
          receive your <code>$LITKEY</code> tokens back in your wallet. Always
          verify the withdraw is ready before attempting to execute it to avoid
          wasting gas.
        </p>

        <DisplayCode code={executeWithdrawExample} language="typescript" />

        <div style={{ marginTop: "20px" }}>
          <h3 style={pageStyles.h3}>What Happens</h3>
          <ul style={pageStyles.ul}>
            <li style={pageStyles.li}>
              The Ledger contract transfers the specified amount of{" "}
              <code>$LITKEY</code> tokens to your wallet (can be partial or full
              requested amount)
            </li>
            <li style={pageStyles.li}>
              Your entire withdraw request is cleared, regardless of whether you
              withdrew the full amount or only part of it
            </li>
            <li style={pageStyles.li}>
              You can immediately submit new withdraw requests if needed
            </li>
            <li style={pageStyles.li}>
              Your deposited balance is updated to reflect the withdraw
            </li>
          </ul>
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Important Considerations</h2>

        <h4 style={pageStyles.h4}>Withdraw Delays</h4>
        <p style={pageStyles.p}>
          The withdraw delay is a security feature that helps maintain the
          health of the network. The delay period is configurable by the Lit
          network administrators. Use <code>getWithdrawDelay()</code> to check
          the current delay for the network.
        </p>

        <h4 style={pageStyles.h4}>Concurrent Withdraw Limit</h4>
        <p style={pageStyles.p}>
          You can only have one pending withdraw request at a time. However,
          once you execute a withdraw, you can immediately request another one.
          There's no limit to the total number of withdraws over time.
        </p>

        <h4 style={pageStyles.h4}>Gas Fees</h4>
        <p style={pageStyles.p}>
          Both requesting and executing withdraws require gas fees. Make sure
          your wallet has sufficient <code>$LITKEY</code> tokens to cover the
          transaction costs.
        </p>

        <h4 style={pageStyles.h4}>Partial Withdraws</h4>
        <p style={pageStyles.p}>
          You can withdraw less than your requested amount if needed. However,
          the entire withdraw request is cleared once you execute any withdraw,
          so you cannot make multiple partial withdraws from the same request.
        </p>
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default PaymentManagerWithdraw;
