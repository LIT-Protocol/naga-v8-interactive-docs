import React from "react";
import GreyBoarderWhiteBgContainer from "../../../components/layout/GreyboardWhiteBgContainer";
import { NoteCallout } from "../../../components/common";
import DisplayCode from "../../../components/DisplayCode";
import { Link } from "react-router-dom";
import { pageStyles } from "../../../styles/pageStyles";

const PaymentManagerDepositing: React.FC = () => {
  const basicDepositExample = `
const result = await paymentManager.deposit({ 
  amountInEth: "0.1"
});
console.log("Transaction receipt:", result.receipt);

const balance = await paymentManager.getBalance({ 
  userAddress: myAccount.address 
});
console.log(\`New available balance: \${balance.availableBalance} $LITKEY\`);`;

  const depositForUserExample = `
const recipientAddress = "0x742d35Cc6434C0532925a3b8D6Ac6e7a1b64E5c2";
const depositAmount = "0.05";

const result = await paymentManager.depositForUser({ 
  userAddress: recipientAddress,
  amountInEth: depositAmount
});
console.log(\`Transaction receipt: \${result.receipt}\`);

const recipientBalance = await paymentManager.getBalance({ 
  userAddress: recipientAddress 
});
console.log(\`Recipient's new available balance: \${recipientBalance.availableBalance} $LITKEY\`);`;

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>Depositing $LITKEY Tokens</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Introduction</h2>
        <p style={pageStyles.p}>
          Depositing $LITKEY tokens into the Ledger smart contract is the first
          step to using Lit Protocol's paid services. The Payment Manager
          provides a simple interface for making deposits to your own account or
          on behalf of other users, allowing you to pay network fees for
          yourself or sponsor usage for your users.
        </p>

        <p style={pageStyles.p}>
          Once deposited, $LITKEY tokens become immediately available for paying
          for Lit network operations such as PKP signing, decryption, and Lit
          Action execution. The deposited balance is managed transparently
          on-chain by the Ledger contract with full audit trail.
        </p>
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
            <strong>Funded Ethereum Account:</strong> An Ethereum wallet funded
            with <code>$LITKEY</code> tokens is required to make a deposit.
          </li>
        </ul>

        <NoteCallout
          message={
            <>
              <p>
                <p style={pageStyles.p}>
                  For the Naga-dev network, you can get test{" "}
                  <code>$LITKEY</code> tokens from the{" "}
                  <a
                    href="https://chronicle-yellowstone-faucet.getlit.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#007bff", textDecoration: "underline" }}
                  >
                    Yellowstone Faucet
                  </a>
                  .
                </p>
              </p>
            </>
          }
          variant="tip"
          title="Tip"
          style={{ marginTop: "16px" }}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Depositing for Yourself</h2>

        <p style={pageStyles.p}>
          If you need to deposit <code>$LITKEY</code> tokens to pay for your own
          Lit requests, you can do so by calling the <code>deposit</code> method
          on the Payment Manager:
        </p>

        <DisplayCode code={basicDepositExample} language="typescript" />

        <div style={{ marginTop: "20px" }}>
          <h3 style={pageStyles.h3}>What Happens</h3>
          <ul style={pageStyles.ul}>
            <li style={pageStyles.li}>
              The Viem account connected to the Payment Manager signs a
              transaction transferring the specified amount of{" "}
              <code>$LITKEY</code> to the Ledger contract.
            </li>
            <li style={pageStyles.li}>
              The Ledger contract updates your deposited balance, and the funds
              become available to pay for Lit network operations once the
              transaction is confirmed.
            </li>
          </ul>
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Depositing for Other Users</h2>

        <p style={pageStyles.p}>
          The Payment Manager allows you to deposit <code>$LITKEY</code> on
          behalf of other users, enabling sponsored transaction workflows. This
          is useful for onboarding new users or covering operational costs for
          your application's users.
        </p>

        <NoteCallout
          message={
            <>
              <p>
                Depositing <code>$LITKEY</code> on behalf of someone else gives
                them complete control over the <code>$LITKEY</code>.
              </p>
              <p>
                You will not be able to reclaim the deposited{" "}
                <code>$LITKEY</code> unless the user decides to withdraw the
                tokens and transfer them back to you.
              </p>
            </>
          }
          variant="note"
          style={{ marginBottom: "16px" }}
        />

        <DisplayCode code={depositForUserExample} language="typescript" />

        <div style={{ marginTop: "20px" }}>
          <h3 style={pageStyles.h3}>What Happens</h3>
          <ul style={pageStyles.ul}>
            <li style={pageStyles.li}>
              The Viem account connected to the Payment Manager signs a
              transaction transferring the specified amount of{" "}
              <code>$LITKEY</code> to the Ledger contract.
            </li>
            <li style={pageStyles.li}>
              The Ledger contract updates the recipient's deposited balance, and
              the funds become available to pay for Lit network operations once
              the transaction is confirmed.
            </li>
          </ul>
        </div>
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default PaymentManagerDepositing;
