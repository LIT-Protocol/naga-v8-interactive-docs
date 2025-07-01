import React from "react";
import GreyBoarderWhiteBgContainer from "../../components/layout/GreyboardWhiteBgContainer";
import { pageStyles } from "../../styles/pageStyles";
import NoteCallout from "../../components/common/NoteCallout";

interface PaymentRequirement {
  requestType: string;
  requiresPayment: boolean;
}

interface PaymentRequirementsTableProps {
  title: string;
  requirements: PaymentRequirement[];
}

const PaymentRequirementsTable: React.FC<PaymentRequirementsTableProps> = ({
  title,
  requirements,
}) => (
  <>
    <h3 style={pageStyles.h3}>{title}</h3>
    <div style={{ overflowX: "auto" }}>
      <table style={pageStyles.table}>
        <thead>
          <tr>
            <th style={pageStyles.th}>Request Type</th>
            <th
              style={{ ...pageStyles.th, textAlign: "center", width: "300px" }}
            >
              Requires Payment
            </th>
          </tr>
        </thead>
        <tbody>
          {requirements.map((req, index) => (
            <tr
              key={index}
              style={{
                backgroundColor: index % 2 === 1 ? "#f1f5f9" : "transparent",
              }}
            >
              <td style={pageStyles.td}>{req.requestType}</td>
              <td
                style={{
                  ...pageStyles.td,
                  textAlign: "center",
                  width: "300px",
                }}
              >
                {req.requiresPayment ? "✅" : "❌"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
);

interface PaymentFeatureProps {
  title: string;
  description: string;
  icon: string;
}

const PaymentFeature: React.FC<PaymentFeatureProps> = ({
  title,
  description,
  icon,
}) => (
  <div
    style={{
      padding: "20px",
      backgroundColor: "#f8fafc",
      borderRadius: "8px",
      border: "1px solid #e2e8f0",
      textAlign: "center",
    }}
  >
    <div
      style={{
        fontSize: "2rem",
        marginBottom: "12px",
      }}
    >
      {icon}
    </div>
    <h4
      style={{
        fontSize: "1.2rem",
        fontWeight: "600",
        color: "#1f2937",
        marginBottom: "8px",
      }}
    >
      {title}
    </h4>
    <p
      style={{
        fontSize: "0.9rem",
        lineHeight: "1.5",
        color: "#4b5563",
        margin: 0,
      }}
    >
      {description}
    </p>
  </div>
);

interface PaymentStepProps {
  title: React.ReactNode;
  description: React.ReactNode;
  stepNumber: number;
  variant?: "payment" | "delegation" | "sponsored";
}

const PaymentStep: React.FC<PaymentStepProps> = ({
  title,
  description,
  stepNumber,
  variant = "payment",
}) => {
  const colors =
    variant === "delegation"
      ? {
          backgroundColor: "#f0fdf4",
          borderColor: "#22c55e20",
          accentColor: "#22c55e",
        }
      : variant === "sponsored"
      ? {
          backgroundColor: "#faf5ff",
          borderColor: "#a855f720",
          accentColor: "#a855f7",
        }
      : {
          backgroundColor: "#f0f9ff",
          borderColor: "#0ea5e920",
          accentColor: "#0ea5e9",
        };

  return (
    <div
      style={{
        padding: "18px",
        backgroundColor: colors.backgroundColor,
        borderRadius: "12px",
        border: `2px solid ${colors.borderColor}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            backgroundColor: colors.accentColor,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "600",
            fontSize: "1.1rem",
          }}
        >
          {stepNumber}
        </div>
        <h4
          style={{
            margin: 0,
            color: colors.accentColor,
            fontSize: "1.3rem",
            fontWeight: "600",
          }}
        >
          {title}
        </h4>
      </div>
      <p
        style={{
          fontSize: "0.9rem",
          lineHeight: "1.6",
          color: "#4b5563",
          marginBottom: "0",
        }}
      >
        {description}
      </p>
    </div>
  );
};

const PayingForLitOverview: React.FC = () => {
  const generalNetworkRequirements: PaymentRequirement[] = [
    { requestType: "Connecting to a Lit Network", requiresPayment: false },
    {
      requestType: "Creating non-PKP based Auth Contexts",
      requiresPayment: false,
    },
    { requestType: "Reading Data from Lit Contracts", requiresPayment: false },
    { requestType: "Lit Action Execution", requiresPayment: true },
    {
      requestType: "Setting Up a Payment Delegation",
      requiresPayment: true,
    },
    {
      requestType: "Modifying Payment Delegations",
      requiresPayment: true,
    },
  ];

  const pkpRequirements: PaymentRequirement[] = [
    { requestType: "Minting a PKP", requiresPayment: true },
    {
      requestType: "Adding / Removing PKP Auth Methods",
      requiresPayment: true,
    },
    {
      requestType: "Reading PKP Permissions",
      requiresPayment: false,
    },
    {
      requestType: "Modifying PKP Permissions",
      requiresPayment: true,
    },
    {
      requestType: "Fetching PKPs by Auth Method or Address",
      requiresPayment: false,
    },
    { requestType: "Signing with a PKP", requiresPayment: true },
    {
      requestType: "Generating PKP Based Auth Contexts",
      requiresPayment: true,
    },
  ];

  const encryptionRequirements: PaymentRequirement[] = [
    { requestType: "Encrypting Data", requiresPayment: false },
    {
      requestType: "Building Access Control Conditions",
      requiresPayment: false,
    },
    { requestType: "Decrypting Data", requiresPayment: true },
  ];

  const paymentSteps = [
    {
      title: (
        <>
          Deposit <code>$LITKEY</code>
        </>
      ),
      description: (
        <>
          <p>
            Deposit $LITKEY into the Ledger contract via the Payment Manager or
            by calling the Ledger contract directly.
          </p>
          <p>
            After your deposit transaction is confirmed, you can immediately
            start using your balance to pay for Lit network requests.
          </p>
        </>
      ),
      stepNumber: 1,
    },
    {
      title: "Use the Lit Network",
      description: (
        <>
          <p>
            You are now setup to make requests to the Lit network that require
            payment.
          </p>
          <p>
            The Lit nodes will handle deducting from your balance automatically
            as you make requests to the Lit network.
          </p>
        </>
      ),
      stepNumber: 2,
    },
    {
      title: (
        <>
          Withdraw <code>$LITKEY</code>
        </>
      ),
      description: (
        <>
          <p>
            At any point in time you can submit a request to withdraw your
            <code>$LITKEY</code> from the Ledger contract using the Payment
            Manager or by calling the Ledger contract directly.
          </p>
          <p>
            Once your withdraw transaction is confirmed by the network, a time
            delay before you can complete your withdraw to your wallet begins.
          </p>
          <p>
            Using the Payment Manager, or by calling the Ledger contract
            directly, you can view the current withdraw delay, as well as how
            long your withdraw request has until it can be completed.
          </p>
        </>
      ),
      stepNumber: 3,
    },
  ];

  const delegationStepsPathA = [
    {
      title: (
        <>
          Deposit <code>$LITKEY</code>
        </>
      ),
      description: (
        <>
          <p>
            Deposit <code>$LITKEY</code> into the Ledger contract via the
            Payment Manager or by calling the Ledger contract directly.
          </p>
        </>
      ),
      stepNumber: 1,
    },
    {
      title: "Add a Payment Delegatee",
      description: (
        <>
          <p>
            Add a delegatee by Ethereum address using the Payment Delegation
            smart contract.
          </p>
        </>
      ),
      stepNumber: 2,
    },
    {
      title: "Set Payment Restrictions (Optional)",
      description: (
        <>
          <p>
            Optionally configure restrictions on the delegatee's ability to
            spend your <code>$LITKEY</code>. You can set two types of limits:
          </p>
          <ul style={{ ...pageStyles.ul, paddingLeft: "0" }}>
            <li style={pageStyles.li}>
              <strong>Total Max Price:</strong> Maximum amount of{" "}
              <code>$LITKEY</code> that can be spent per delegatee.
            </li>
            <li style={pageStyles.li}>
              <strong>Rate Limiting:</strong>
              <ul style={{ ...pageStyles.ul, paddingLeft: "0" }}>
                <li style={pageStyles.li}>
                  <strong>Period Duration:</strong> Time window length (in
                  seconds).
                </li>
                <li style={pageStyles.li}>
                  <strong>Requests Per Period:</strong> Number of requests
                  allowed within <code>Period Duration</code>.
                </li>
              </ul>
            </li>
          </ul>
          <NoteCallout
            title="Modifying Delegations"
            message={
              <>
                <p>
                  You can modify the payment restrictions and completely
                  un-delegate to any delegatee at any time.
                </p>
              </>
            }
            variant="note"
          />
        </>
      ),
      stepNumber: 3,
    },
    {
      title: "Delegatee Uses the Lit Network",
      description: (
        <>
          <p>
            The delegatee can now make requests to the Lit network that require
            payment.
          </p>
          <p>
            The Lit nodes will automatically handle deducting from your
            deposited <code>$LITKEY</code>, and update the tracking for any
            payment restrictions you've set, as the delegatee makes requests to
            the Lit network that require payment.
          </p>
        </>
      ),
      stepNumber: 4,
    },
  ];

  const delegationStepsPathB = [
    {
      title: (
        <>
          Deposit <code>$LITKEY</code>
        </>
      ),
      description: (
        <>
          <p>
            Deposit <code>$LITKEY</code> on behalf of a user, incrementing their
            balance via the Payment Manager or by calling the Ledger contract
            directly.
          </p>

          <NoteCallout
            title="Depositing on Behalf of Someone Else"
            message={
              <>
                <p>
                  Depositing <code>$LITKEY</code> on behalf of someone else
                  gives them complete control over the <code>$LITKEY</code>.
                </p>
                <p>
                  You will not be able to reclaim the deposited{" "}
                  <code>$LITKEY</code> unless the user decides to withdraw the
                  tokens and transfer them back to you.
                </p>
              </>
            }
            variant="note"
          />
        </>
      ),
      stepNumber: 1,
    },
    {
      title: "Delegatee Uses the Lit Network",
      description: (
        <>
          <p>
            The delegatee is now setup to make requests to the Lit network that
            require payment.
          </p>
          <p>
            The Lit nodes will automatically handle deducting from the user's{" "}
            <code>$LITKEY</code> balance when making requests to the Lit network
            that require payment.
          </p>
        </>
      ),
      stepNumber: 2,
    },
    {
      title: (
        <>
          Withdraw <code>$LITKEY</code>
        </>
      ),
      description: (
        <>
          <p>
            Because the <code>$LITKEY</code> is under the control of the
            delegatee, the delegatee can choose to withdraw their{" "}
            <code>$LITKEY</code> at any time.
          </p>
          <p>
            You <strong>cannot</strong> force the delegatee to withdraw the
            <code>$LITKEY</code> you've deposited on their behalf, and you will{" "}
            <strong>not</strong> receive the tokens after the withdraw has been
            completed unless the delegatee transfers them back to you.
          </p>
        </>
      ),
      stepNumber: 2,
    },
  ];

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>Paying for Lit Requests</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Introduction</h2>
        <p style={pageStyles.p}>
          Like other decentralized networks, Lit requires payment for the
          operations done on your behalf by the node operators.
        </p>
        <p style={pageStyles.p}>
          Payment for various requests such as PKP signing, decryption, and Lit
          Action execution is done by depositing the <code>$LITKEY</code> token
          into the Ledger smart contract where the Lit nodes will automatically
          deduct from your deposited amount as you make requests to the Lit
          network.
        </p>
        <p style={pageStyles.p}>
          This system provides a unified payment infrastructure that enables
          seamless funding with advanced features like delegated spending and
          secure withdrawal mechanisms.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Core Components</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
            marginTop: "24px",
          }}
        >
          <PaymentFeature
            title="Ledger Smart Contract"
            description="Manages balances, deposits, withdrawals, and spending across the network."
            icon="📊"
          />
          <PaymentFeature
            title="Payment Delegation"
            description="Allows delegates to spend from another user's balance for sponsored transactions."
            icon="🤝"
          />
          <PaymentFeature
            title="Payment Manager"
            description="A set of functions that allow you to manage your balance, deposit, withdraw, and delegate funds to other users."
            icon="⚙️"
          />
        </div>
      </GreyBoarderWhiteBgContainer>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "24px",
        }}
      >
        <GreyBoarderWhiteBgContainer>
          <h2 style={pageStyles.h2}>How Payment Works</h2>
          <div
            style={{
              display: "grid",
              gap: "5px",
              marginTop: "12px",
            }}
          >
            {paymentSteps.map((step, index) => (
              <PaymentStep key={index} {...step} />
            ))}
          </div>
        </GreyBoarderWhiteBgContainer>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "24px",
        }}
      >
        <GreyBoarderWhiteBgContainer>
          <h2 style={pageStyles.h2}>How Delegated Payment Works</h2>
          {/* Two paths branching from the first step */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginTop: "16px",
              alignItems: "start",
            }}
          >
            {/* Path A: self deposit then delegate */}
            <div
              style={{
                display: "grid",
                gap: "5px",
                marginTop: "12px",
              }}
            >
              <p style={{ ...pageStyles.p, textAlign: "center" }}>
                Path A: Self Deposit then Delegate
              </p>
              {delegationStepsPathA.map((step, index) => (
                <PaymentStep key={index} {...step} variant="delegation" />
              ))}
            </div>

            {/* Path B: deposit on behalf of someone else */}
            <div
              style={{
                display: "grid",
                gap: "5px",
                marginTop: "12px",
              }}
            >
              <p style={{ ...pageStyles.p, textAlign: "center" }}>
                Path B: Deposit on Behalf of Someone Else
              </p>
              {delegationStepsPathB.map((step, index) => (
                <PaymentStep key={index} {...step} variant="sponsored" />
              ))}
            </div>
          </div>
        </GreyBoarderWhiteBgContainer>
      </div>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Overview of What Requires Payment</h2>
        <p style={pageStyles.p}>
          Not every interaction with the Lit network or Lit SDK requires
          payment. Below is a comprehensive breakdown of the payment
          requirements across different Lit Network services.
        </p>

        <PaymentRequirementsTable
          title="General Lit Network Usage"
          requirements={generalNetworkRequirements}
        />

        <PaymentRequirementsTable
          title="PKP Usage"
          requirements={pkpRequirements}
        />

        <PaymentRequirementsTable
          title="Encrypting Data"
          requirements={encryptionRequirements}
        />
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default PayingForLitOverview;
