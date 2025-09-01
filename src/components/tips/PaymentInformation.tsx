import { APP_INFO } from "../../_config";

export default function PaymentInformation() {
  return (
    <div
      style={{
        padding: "12px",
        backgroundColor: "#e8f4fd",
        borderRadius: "4px",
        border: "1px solid #b3d9ff",
        marginBottom: "15px",
        fontSize: "14px",
      }}
    >
      <strong>🌐 Current Network:</strong> <code>{APP_INFO.network}</code>
      <br />
      <br />
      {APP_INFO.network === "naga-dev" ? (
        <>
          <strong>ℹ️ Network Information:</strong> On naga-dev network, PKP
          signing and Lit Action execution are free. However, please note that
          this is a development network and state is not persistent - when the
          network refreshes, all PKPs will be deleted. Do not store anything
          valuable on this network.
        </>
      ) : (
        <>
          <strong>💰 Payment Information:</strong> PKP signing and Lit Action
          execution require payment. Visit the{" "}
          <a
            href="/payment-manager"
            style={{ color: "#0066cc", textDecoration: "underline" }}
          >
            Payment Manager
          </a>{" "}
          page to understand pricing, deposit funds, and manage your payment
          balance.
        </>
      )}
    </div>
  );
}
