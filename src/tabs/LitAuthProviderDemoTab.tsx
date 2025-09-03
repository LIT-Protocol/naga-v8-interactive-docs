import React from "react";
import { LitAuthProvider } from "../lit-login-modal/LitAuthProvider";
import GreyBoarderWhiteBgContainer from "../components/layout/GreyboardWhiteBgContainer";
import ProtectedAppComplete from "../components/protectedApp/examples/ProtectedAppComplete";
import { APP_INFO } from "../_config";

const LitAuthProviderDemoTab: React.FC = () => {
  return (
    <div className="tab-content" style={{ marginTop: "-20px" }}>
      {/* <GreyBoarderWhiteBgContainer style={{ marginTop: "0px" }}>
        <h2>
          ❗️ This is just a demo. If you would like us to create a modal for
          this, we will do it 💪!
        </h2>
        <p>LMK at anson[@]litprotocol.com</p>
      </GreyBoarderWhiteBgContainer> */}

      <div className="max-w-8xl mx-auto" style={{  margin: "0 auto", padding: "20px" }}>
        {/* <h1>🚀 Lit Auth Provider - Modal Demo</h1> */}

        <div>
          <div
            style={{
              padding: "12px 20px",
              backgroundColor: "#f9fafb",
              borderBottom: "1px solid #e5e7eb",
              fontSize: "14px",
              fontWeight: "500",
              color: "#374151",
            }}
          >
            🖼️ The Amazing App You Are Building
          </div>

          <div style={{ minHeight: "600px" }}>
            <LitAuthProvider
              appName="lit-auth-modal-demo"
              networkName={APP_INFO.network}
              autoSetup={false}
              storageKey="lit-auth-modal-demo"
            >
              {/* <ProtectedAppRefactored /> */}
              <ProtectedAppComplete />
            </LitAuthProvider>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LitAuthProviderDemoTab;
