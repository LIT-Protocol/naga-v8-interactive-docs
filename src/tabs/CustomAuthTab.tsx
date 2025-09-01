import { useState } from "react";
import { DisplayCode } from "../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../components/layout/GreyboardWhiteBgContainer";
import { useAppContext } from "../router";
import PkpSigningComponent from "../components/common/PkpSigningComponent";
import { privateKeyToAccount } from "viem/accounts";
import { utils as litUtils } from '@lit-protocol/lit-client';
import { APP_INFO } from "../_config";
import PaymentInformation from "../components/tips/PaymentInformation";

const AUTH_NAME = "Custom Authentication (dApp-Centric)";

// Configuration constants
const DEFAULT_AUTH_SERVICE_BASE_URL = APP_INFO.litAuthServer;
const DEFAULT_DEMO_USERNAME = "alice";
const DEFAULT_DEMO_PASSWORD = "lit";

// Site owner private key for minting PKPs (provided for demo)
const SITE_OWNER_PRIVATE_KEY =
  "0x65b80901b185bd7bd9c07178c8e3b2bfae62472feeeb86d3dd834e5b14c2d5f8";


// Code snippets for each step
const SITE_OWNER_BACKEND_CODE = `
import { utils as litUtils } from '@lit-protocol/lit-client';

class myDappBackend {

  // Create a unique secret name of your dApp (you can share it if you want to share the authMethodType)
  uniqueDappName: string = 'my-supa-dupa-app-name';
  
  // Use Lit client utilities to generate unique auth method type
  authMethodConfig = litUtils.generateUniqueAuthMethodType({
    uniqueDappName: this.uniqueDappName
  });
  
  // Validation IPFS CID (immutable validation logic)
  public static validationIpfsCid = 'QmYLeVmwJPVs7Uebk85YdVPivMyrvoeKR6X37kyVRZUXW4';

  // [DEMO] Not a very safe database of registered users
  public registeredUsers: Array<{
    userId: string;
    password: string;
    pkpPublicKey: string | null;
  }> = [
    { userId: 'alice', password: 'password-1', pkpPublicKey: null },
    { userId: 'bob', password: 'password-2', pkpPublicKey: null },
  ];

  // Generate unique auth data for each user using Lit utilities
  private _generateAuthData(userId: string) {
    return litUtils.generateAuthData({
      uniqueDappName: this.uniqueDappName,
      uniqueAuthMethodType: this.authMethodConfig.bigint,
      userId: userId
    });
  }
  
  // Site owner mints PKPs for users
  async mintPKPForUser(userId: string) {
      // 1. Check if the user is registered
      if (!this.registeredUsers.find((user) => user.userId === userId)) {
        throw new Error('User not registered');
      }

      // 2. Generate the auth data from the unique user id
      const uniqueUserAuthData = this._generateAuthData(userId);
      console.log('✅ uniqueUserAuthData:', uniqueUserAuthData);

      // 3. Mint a PKP for the user. Then, we will send the PKP to itself, since itself is also
      // a valid ETH Wallet. The owner of the PKP will have NO permissions. To access the PKP,
      // the user will need to pass the immutable validation code which lives inside the Lit Action.
      const { pkpData: mintedPKP, validationIpfsCid } =
        await litClient.mintWithCustomAuth({
          account: myAccount,
          authData: uniqueUserAuthData,
          scope: 'sign-anything',
          validationIpfsCid: myDappBackend.validationIpfsCid,
        });

      console.log('✅ validationIpfsCid:', validationIpfsCid);
      console.log('✅ mintedPKP:', mintedPKP);
      console.log(
        '✅ hexedUniqueAuthMethodType:',
        this.hexedUniqueAuthMethodType
      );

      // find the user first
      const user = this.registeredUsers.find((user) => user.userId === userId);
      if (!user) {
        throw new Error('User not found');
      }

      // update the user with the PKP public key
      user.pkpPublicKey = mintedPKP.data.pubkey;
    }
}

// Example usage
const ownerDapp = new myDappBackend();
await ownerDapp.mintPKPForUser('alice');

`;

const USER_FRONTEND_CODE = `
import { utils as litUtils } from '@lit-protocol/lit-client';

class myDappFrontend {
  constructor(private readonly myDappBackend: myDappBackend) {
    this.myDappBackend = myDappBackend;
  }

  userDashboard(userId: string) {
    const user = this.myDappBackend.registeredUsers.find(
      (user) => user.userId === userId
    );
    const uniqueAuthMethodId = \${this.myDappBackend.uniqueDappName}-userId}

    if (!user) {
      throw new Error('User not found');
    }

    return {
      getMyPkpPublicKey() {
        return user.pkpPublicKey;
      },

      getAuthMethodId() {
        return keccak256(toBytes(uniqueAuthMethodId));
      },

      // Ideally, as the site owner you will publish this to the public
      // so they can see the validation logic.
      getValidationIpfsCid() {
        return myDappBackend.validationIpfsCid;
      },
    };
  }
}
  
// User gets their PKP info from dApp
const frontend = new myDappFrontend(ownerDapp);
const userDashboard = frontend.userDashboard('alice');
const userPkpPublicKey = userDashboard.getMyPkpPublicKey();
const validationIpfsCid = userDashboard.getValidationIpfsCid();

// Generate authMethodId using the same utilities (or get from backend)
const authData = litUtils.generateAuthData({
  uniqueDappName: 'my-supa-dupa-app-name',
  uniqueAuthMethodType: BigInt('0x22b562b86d5d467a9f06c3f20137b37ed13981f63bd5dbdf6fc1e0fb97015401'),
  userId: 'alice'
});

const authManager = createAuthManager({
  storage: storagePlugins.localStorage({
    appName: 'my-app', // namespace for isolating auth data
    networkName: 'naga-dev', // useful for distinguishing environments
  }),
});

// Create custom auth context
const userAuthContext = await authManager.createCustomAuthContext({
  pkpPublicKey: userPkpPublicKey,
  authConfig: {
    resources: [['pkp-signing', '*'], ['lit-action-execution', '*']],
    expiration: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
  },
  litClient: litClient,
  customAuthParams: {
    litActionIpfsId: validationIpfsCid, // Immutable validation logic
    jsParams: {
      pkpPublicKey: userPkpPublicKey,
      username: 'alice',
      password: 'lit',
      authMethodId: authData.authMethodId, // Generated using Lit utilities
    },
  },
});

// Sign with PKP
const signature = await litClient.chain.ethereum.pkpSign({
  pubKey: userPkpPublicKey,
  toSign: 'hello',
  authContext: userAuthContext,
  
  // 💰 Optional: Set custom maximum price you're willing to pay
  // userMaxPrice: BigInt("1000000000000000"), // 0.001 ETH in Wei
  // If not specified, Lit Protocol will automatically find the most optimised price
});`;

const VALIDATION_LIT_ACTION_CODE = `
import { utils as litUtils } from '@lit-protocol/lit-client';

export class ExampleAppAuthenticator {
  // Generated using: litUtils.generateUniqueAuthMethodType({ uniqueDappName: 'my-supa-dupa-app-name' })
  public static readonly AUTH_METHOD_TYPE = 
    '0x22b562b86d5d467a9f06c3f20137b37ed13981f63bd5dbdf6fc1e0fb97015401';
  
  public static readonly VALIDATION_CID = 
    'QmYLeVmwJPVs7Uebk85YdVPivMyrvoeKR6X37kyVRZUXW4';
  
  // This code runs on Lit nodes for validation
  public static readonly VALIDATION_CODE = \`
    (async () => {
      // 1. Set your unique authMethodType (use the hex value from generateUniqueAuthMethodType)
      const dAppUniqueAuthMethodType = "0x22b562b86d5d467a9f06c3f20137b37ed13981f63bd5dbdf6fc1e0fb97015401";
      
      // 2. Get params from jsParams
      const { pkpPublicKey, username, password, authMethodId } = jsParams;
      
      // 3. Validate user credentials (customize this logic for your dApp)
      const EXPECTED_USERNAME = 'alice';
      const EXPECTED_PASSWORD = 'lit';
      const userIsValid = username === EXPECTED_USERNAME && password === EXPECTED_PASSWORD;
      
      // 4. Check PKP permissions using the generated authMethodId
      const tokenId = await Lit.Actions.pubkeyToTokenId({ publicKey: pkpPublicKey });
      const permittedAuthMethods = await Lit.Actions.getPermittedAuthMethods({ tokenId });
      
      const isPermitted = permittedAuthMethods.some((permittedAuthMethod) => {
        return permittedAuthMethod["auth_method_type"] === dAppUniqueAuthMethodType && 
               permittedAuthMethod["id"] === authMethodId;
      });
      
      // 5. Return validation result
      const isValid = isPermitted && userIsValid;
      LitActions.setResponse({ response: isValid ? "true" : "false" });
    })();
  \`;
}`;

// Generate random dApp name for demo
const generateRandomDappName = () => {
  const adjectives = [
    "super",
    "awesome",
    "cool",
    "amazing",
    "epic",
    "stellar",
    "magic",
    "crypto",
    "web3",
    "defi",
  ];
  const nouns = [
    "app",
    "dapp",
    "platform",
    "service",
    "protocol",
    "network",
    "ecosystem",
    "vault",
    "wallet",
    "exchange",
  ];
  const randomId = Math.random().toString(36).substring(2, 8);

  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

  return `${randomAdjective}-${randomNoun}-${randomId}`;
};

export default function CustomAuthTab() {
  const {
    getDependencyStatus,
    areDependenciesLoaded,
    authContext,
    setAuthContext,
    setStatus,
    assertDependenciesLoaded,
    showError,
    clearError,
  } = useAppContext();

  // Utility function to format error messages properly
  const formatErrorMessage = (prefix: string, error: any): string => {
    let errorMessage = prefix;
    if (error?.message) {
      errorMessage += error.message;
    } else if (typeof error === "object") {
      errorMessage += JSON.stringify(error, null, 2);
    } else {
      errorMessage += String(error);
    }
    return errorMessage;
  };

  const [authServiceBaseUrl, setAuthServiceBaseUrl] = useState<string>(
    DEFAULT_AUTH_SERVICE_BASE_URL
  );
  const [demoUsername, setDemoUsername] = useState<string>(
    DEFAULT_DEMO_USERNAME
  );
  const [demoPassword, setDemoPassword] = useState<string>(
    DEFAULT_DEMO_PASSWORD
  );

  // Site Owner Flow State
  const [dappName, setDappName] = useState<string>(generateRandomDappName());
  const [authMethodConfig, setAuthMethodConfig] = useState<any>(null);
  const [validationCid, setValidationCid] = useState<string>("");
  const [mintedPkps, setMintedPkps] = useState<any[]>([]);
  const [isGeneratingAuthMethod, setIsGeneratingAuthMethod] = useState(false);
  const [isMintingPkp, setIsMintingPkp] = useState(false);

  // User Flow State
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isCreatingAuthContext, setIsCreatingAuthContext] = useState(false);
  const [mockAuthContext, setMockAuthContext] = useState<any>(null);
  const [hasCreatedAuthContext, setHasCreatedAuthContext] = useState(false);

  // Success feedback state
  const [successActions, setSuccessActions] = useState<Set<string>>(new Set());

  // Function to show success feedback
  const showSuccess = (actionId: string) => {
    setSuccessActions((prev) => new Set([...prev, actionId]));
    // Auto-clear after 3 seconds
    setTimeout(() => {
      setSuccessActions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(actionId);
        return newSet;
      });
    }, 3000);
  };

  // Editable jsParams for Lit Action
  const [editableJsParams, setEditableJsParams] = useState<{
    pkpPublicKey: string;
    username: string;
    password: string;
    authMethodId: string;
  }>({
    pkpPublicKey: "",
    username: demoUsername,
    password: demoPassword,
    authMethodId: "",
  });

  // ========== SITE OWNER FLOW FUNCTIONS ==========

  const regenerateDappName = () => {
    const newDappName = generateRandomDappName();
    setDappName(newDappName);
    // Clear auth method config since it depends on dApp name
    setAuthMethodConfig(null);
    setStatus(`Generated new dApp name: ${newDappName}`);
  };

  const generateAuthMethodType = async () => {
    try {
      setIsGeneratingAuthMethod(true);
      setStatus("Generating unique auth method type for dApp...");

      const { litClient } = assertDependenciesLoaded();

      // Use real Lit client utilities to generate unique auth method type
      const authMethodConfig = litUtils.generateUniqueAuthMethodType({
        uniqueDappName: dappName,
      });

      setAuthMethodConfig(authMethodConfig);
      setStatus(`Generated auth method type for dApp: ${dappName}`);
      showSuccess("generate-auth-method");
    } catch (error: any) {
      console.error("Error generating auth method type:", error);
      const errorMessage = formatErrorMessage(
        "Failed to generate auth method type: ",
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsGeneratingAuthMethod(false);
    }
  };

  const openLitActionCreator = () => {
    // Open Lit Protocol Explorer in a popup for creating Lit Actions
    const popupWindow = window.open(
      "https://explorer.litprotocol.com/create-action",
      "litActionCreator",
      "width=1200,height=800,scrollbars=yes,resizable=yes,left=" +
        (window.screen.width - 1200) / 2 +
        ",top=" +
        (window.screen.height - 800) / 2
    );

    if (popupWindow) {
      setStatus(
        "Opened Lit Action Creator. Create your validation logic and copy the IPFS CID back here."
      );
    } else {
      setStatus(
        "Failed to open popup. Please check your popup blocker settings."
      );
    }
  };

  const setValidationCidManually = (cid: string) => {
    setValidationCid(cid);
    setStatus(`Validation CID set: ${cid}`);
    if (cid) {
      showSuccess("set-validation-cid");
    }
  };

  const mintPkpForUser = async (userId: string) => {
    try {
      setIsMintingPkp(true);
      setStatus(`Minting PKP for user: ${userId}...`);

      const { litClient } = assertDependenciesLoaded();

      if (!authMethodConfig || !validationCid) {
        throw new Error(
          "Auth method type and validation CID must be set first"
        );
      }

      // Create account from private key for site owner
      const siteOwnerAccount = privateKeyToAccount(
        SITE_OWNER_PRIVATE_KEY as `0x${string}`
      );

      // Generate auth data for user using real Lit utilities
      const authData = litUtils.generateAuthData({
        uniqueDappName: dappName,
        uniqueAuthMethodType: authMethodConfig.bigint,
        userId: userId,
      });

      // Actually mint PKP using Lit client
      const { pkpData } = await litClient.mintWithCustomAuth({
        account: siteOwnerAccount,
        authData: authData,
        scope: "sign-anything",
        validationIpfsCid: validationCid,
      });

      const pkpInfo = {
        userId: userId,
        pkpPublicKey: pkpData.data.pubkey,
        pkpTokenId: pkpData.data.tokenId,
        authData: authData,
        validationCid: validationCid,
      };

      setMintedPkps((prev) => [...prev, pkpInfo]);
      setStatus(`PKP minted successfully for user: ${userId}`);
      showSuccess("mint-pkp");
    } catch (error: any) {
      console.error("Error minting PKP:", error);
      const errorMessage = formatErrorMessage("Failed to mint PKP: ", error);
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsMintingPkp(false);
    }
  };

  // ========== USER FLOW FUNCTIONS ==========

  const selectUserFromDapp = async () => {
    try {
      setStatus("User logging into dApp and retrieving PKP info...");

      // Find the user's minted PKP
      const userPkp = mintedPkps.find((pkp) => pkp.userId === demoUsername);

      if (!userPkp) {
        throw new Error(
          `No PKP found for user '${demoUsername}'. Site owner must mint PKP first.`
        );
      }

      setSelectedUser(userPkp);

      // Reset auth context creation state for new user
      setHasCreatedAuthContext(false);
      setAuthContext(null);
      setMockAuthContext(null);

      // Populate editable jsParams with user's PKP data
      setEditableJsParams({
        pkpPublicKey: userPkp.pkpPublicKey,
        username: demoUsername,
        password: demoPassword,
        authMethodId: userPkp.authData?.authMethodId || "",
      });

      setStatus(`Successfully retrieved PKP info for user '${demoUsername}'`);
      showSuccess("select-user");
    } catch (error: any) {
      console.error("Error selecting user:", error);
      const errorMessage = formatErrorMessage(
        "Failed to get user PKP info: ",
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    }
  };

  const createCustomAuthContext = async () => {
    try {
      setIsCreatingAuthContext(true);

      // If auth context was already created before, clear the cache first
      if (hasCreatedAuthContext) {
        setStatus("Clearing auth cache and re-authenticating...");

        // Clear all localStorage entries that start with 'lit-auth:my-app-inner-delegation'
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("lit-auth:my-app-inner-delegation")) {
            keysToRemove.push(key);
          }
        }

        keysToRemove.forEach((key) => {
          localStorage.removeItem(key);
          console.log(`🗑️ Cleared cache key: ${key}`);
        });

        console.log(`🗑️ Cleared ${keysToRemove.length} cached auth signatures`);
      }

      setStatus("User creating custom auth context...");

      const { authManager, litClient } = assertDependenciesLoaded();

      if (!selectedUser) {
        setStatus("Cannot create auth context: No user selected.");
        return;
      }

      // Debug: Log all authentication parameters
      console.log("🔍 Custom Auth Debug Info:", {
        dappName: dappName,
        authMethodType: authMethodConfig?.hex,
        userId: selectedUser.userId,
        username: editableJsParams.username,
        password: editableJsParams.password,
        pkpPublicKey: editableJsParams.pkpPublicKey,
        pkpTokenId: selectedUser.pkpTokenId,
        authMethodId: editableJsParams.authMethodId,
        validationCid: selectedUser.validationCid,
        jsParams: editableJsParams,
      });

      const customAuthContext = await authManager.createCustomAuthContext({
        pkpPublicKey: selectedUser.pkpPublicKey,
        authConfig: {
          capabilityAuthSigs: [],
          expiration: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
          statement: "",
          domain: "",
          resources: [
            ["pkp-signing", "*"],
            ["lit-action-execution", "*"],
          ],
        },
        litClient: litClient,
        customAuthParams: {
          litActionIpfsId: selectedUser.validationCid,
          jsParams: editableJsParams,
        },
      });

      console.log("✅ Custom auth context created:", customAuthContext);
      setAuthContext(customAuthContext);
      setMockAuthContext({
        ...customAuthContext,
        pubkey: selectedUser.pkpPublicKey,
      });
      setStatus("Custom auth context created successfully");
      setHasCreatedAuthContext(true);
      showSuccess("create-auth-context");
    } catch (error: any) {
      console.error("❌ Error creating custom auth context:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        cause: error.cause,
      });

      const errorMessage = formatErrorMessage(
        "Failed to create custom auth context: ",
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage); // Enable auto-hide (default 5 seconds)
    } finally {
      setIsCreatingAuthContext(false);
    }
  };

  return (
    <div className="tab-content">
      <h2>{AUTH_NAME}</h2>

      {/* ================================================ */}
      {/*            COMPREHENSIVE OVERVIEW                */}
      {/* ================================================ */}
      <GreyBoarderWhiteBgContainer>
        <h3 style={{ marginTop: 0, color: "#2563eb" }}>
          🎯 What is Custom Authentication?
        </h3>
        <p>
          Custom Authentication allows <strong>dApp owners</strong> to provide
          crypto wallets (PKPs) to their users without requiring them to
          understand blockchain technology or manage private keys. Instead of
          forcing users to learn new authentication methods, you can leverage
          your existing authentication systems (OAuth, APIs, databases) while
          providing them with powerful web3 capabilities.
        </p>
        <p>
          This demonstrates the complete{" "}
          <strong>dApp-centric custom authentication</strong> flow from both
          perspectives: the <strong>Site Owner</strong> who sets up the system
          and the <strong>User</strong> who interacts with it.
        </p>
        
        <PaymentInformation/>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*                  Prerequisites                   */}
        {/* ================================================ */}
        <h3 style={{ marginTop: 0 }}>Prerequisites</h3>

        <ul>
          <li>
            Lit Client:{" "}
            {getDependencyStatus().litClient ? (
              <span style={{ color: "green" }}>✓ Initialised</span>
            ) : (
              <span style={{ color: "red" }}>✗ Not initialised</span>
            )}
          </li>
          <li>
            Auth Manager:{" "}
            {getDependencyStatus().authManager ? (
              <span style={{ color: "green" }}>✓ Initialised</span>
            ) : (
              <span style={{ color: "red" }}>✗ Not initialised</span>
            )}
          </li>
        </ul>

        {/* Information box about dApp-centric auth */}
        <div
          style={{
            marginTop: "15px",
            padding: "15px",
            backgroundColor: "#e8f4fd",
            borderRadius: "8px",
            border: "1px solid #b3d9ff",
          }}
        >
          <h4 style={{ margin: "0 0 10px 0" }}>
            🏢 dApp-Centric Authentication Model
          </h4>
          <p style={{ margin: "0 0 10px 0" }}>
            In this approach, <strong>site owners</strong> control the PKP
            minting process and provide immutable validation logic via IPFS.
            <strong> Users</strong> get pre-minted PKPs and authenticate through
            the site owner's validation Lit Action.
          </p>
          <div style={{ display: "flex", gap: "20px", fontSize: "14px" }}>
            <div>
              <strong>Site Owner:</strong> Mints PKPs, defines validation rules
            </div>
            <div>
              <strong>User:</strong> Gets PKP, authenticates via validation
            </div>
          </div>
        </div>
      </GreyBoarderWhiteBgContainer>

      {/* ================================================ */}
      {/*                SITE OWNER FLOW                   */}
      {/* ================================================ */}
      <div
        style={{
          border: "2px solid #28a745",
          borderRadius: "8px",
          marginBottom: "30px",
          backgroundColor: "#f8fff9",
        }}
      >
        <div
          style={{
            backgroundColor: "#28a745",
            color: "white",
            padding: "15px",
            borderRadius: "6px 6px 0 0",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ margin: 0 }}>🏢 Site Owner Flow</h2>
          <p style={{ margin: "5px 0 0 0", fontSize: "14px" }}>
            Complete setup process for dApp owners to implement custom
            authentication
          </p>
        </div>

        <div style={{ padding: "0 20px 20px 20px" }}>
          {/* Site Owner Step 1 */}
          <GreyBoarderWhiteBgContainer>
            <h3 style={{ marginTop: 0 }}>
              Step 1: Configure dApp and Generate Auth Method Type
            </h3>
            <p>
              Generate a unique authentication method type for your dApp using
              the dApp name. This creates a secure identifier that will be used
              for all PKP minting and validation.
            </p>

            <DisplayCode
              code={`// Generate unique auth method type for dApp
import { utils as litUtils } from '@lit-protocol/lit-client';

const authMethodConfig = litUtils.generateUniqueAuthMethodType({
  uniqueDappName: '${dappName}'
});

console.log('Auth Method Type (hex):', authMethodConfig.hex);
console.log('Auth Method Type (bigint):', authMethodConfig.bigint);`}
              language="typescript"
              renderComponent={
                <div style={{ marginBottom: "10px" }}>
                  <div style={{ marginBottom: "10px" }}>
                    <label
                      htmlFor="dappName"
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        fontWeight: "500",
                      }}
                    >
                      dApp Name:
                    </label>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "stretch",
                      }}
                    >
                      <input
                        id="dappName"
                        type="text"
                        value={dappName}
                        onChange={(e) => setDappName(e.target.value)}
                        placeholder="my-supa-dupa-app-name"
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          fontSize: "14px",
                          fontFamily: "monospace",
                        }}
                      />
                      <button
                        onClick={regenerateDappName}
                        style={{
                          padding: "8px 12px",
                          backgroundColor: "#6c757d",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        🎲 Generate New
                      </button>
                    </div>
                    <small style={{ color: "#666", fontSize: "12px" }}>
                      Each dApp needs a unique name for authentication
                    </small>
                  </div>

                  <button
                    onClick={generateAuthMethodType}
                    disabled={isGeneratingAuthMethod || !dappName}
                    style={{
                      padding: "10px 15px",
                      backgroundColor:
                        isGeneratingAuthMethod || !dappName
                          ? "#cccccc"
                          : "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor:
                        isGeneratingAuthMethod || !dappName
                          ? "not-allowed"
                          : "pointer",
                      fontWeight: "500",
                    }}
                  >
                    {isGeneratingAuthMethod
                      ? "Generating..."
                      : "Generate Auth Method Type"}
                    {!dappName && " (Enter dApp name first)"}
                  </button>
                </div>
              }
              resultData={authMethodConfig}
              resultLabel="Generated Auth Method Configuration"
              useSideBySide={true}
              theme="dracula"
              isSuccess={successActions.has("generate-auth-method")}
            />
          </GreyBoarderWhiteBgContainer>

          {/* Site Owner Step 2 */}
          <GreyBoarderWhiteBgContainer>
            <h3 style={{ marginTop: 0 }}>
              Step 2: Create and Pin Validation Lit Action
              {!authMethodConfig && (
                <span style={{ color: "orange" }}>
                  {" "}
                  (Generate auth method first)
                </span>
              )}
            </h3>
            <p>
              Create the validation logic as a Lit Action and pin it to IPFS for
              immutable validation. This code will run on Lit nodes to validate
              user authentication attempts.
            </p>

            <DisplayCode
              code={`
(async () => {
  const dAppUniqueAuthMethodType = "${authMethodConfig?.hex || "0x..."}";
  const { pkpPublicKey, username, password, authMethodId } = jsParams;
  
  // Custom validation logic for ${dappName}
  const EXPECTED_USERNAME = 'alice';
  const EXPECTED_PASSWORD = 'lit';
  const userIsValid = username === EXPECTED_USERNAME && password === EXPECTED_PASSWORD;
  
  // Check PKP permissions
  const tokenId = await Lit.Actions.pubkeyToTokenId({ publicKey: pkpPublicKey });
  const permittedAuthMethods = await Lit.Actions.getPermittedAuthMethods({ tokenId });
  
  const isPermitted = permittedAuthMethods.some((permittedAuthMethod) => {
    return permittedAuthMethod["auth_method_type"] === dAppUniqueAuthMethodType && 
           permittedAuthMethod["id"] === authMethodId;
  });
  
  const isValid = isPermitted && userIsValid;
  LitActions.setResponse({ response: isValid ? "true" : "false" });
})();`}
              language="javascript"
              renderComponent={
                <div>
                  {authMethodConfig && (
                    <div
                      style={{
                        padding: "12px",
                        backgroundColor: "#fff3cd",
                        borderRadius: "4px",
                        border: "1px solid #ffecb5",
                        marginBottom: "15px",
                      }}
                    >
                      <strong>⚠️ Important:</strong> Copy the self-executing
                      JavaScript function on the left to Lit Explorer.
                      <br />
                      Your unique auth method type{" "}
                      <code
                        style={{
                          wordBreak: "break-all",
                          fontSize: "11px",
                          backgroundColor: "#f8f9fa",
                          padding: "2px 4px",
                          borderRadius: "2px",
                        }}
                      >
                        {authMethodConfig.hex}
                      </code>{" "}
                      is already included in the code.
                    </div>
                  )}

                  <div style={{ marginBottom: "15px" }}>
                    <button
                      onClick={openLitActionCreator}
                      disabled={!authMethodConfig}
                      style={{
                        padding: "12px 20px",
                        backgroundColor: !authMethodConfig
                          ? "#cccccc"
                          : "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: !authMethodConfig ? "not-allowed" : "pointer",
                        fontWeight: "500",
                        marginRight: "10px",
                      }}
                    >
                      🚀 Open Lit Action Creator
                    </button>
                    👈 Make sure you login first
                    <small
                      style={{
                        color: "#666",
                        fontSize: "12px",
                        display: "block",
                        marginTop: "5px",
                      }}
                    >
                      Opens{" "}
                      <a
                        href="https://explorer.litprotocol.com/create-action"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lit Protocol Explorer
                      </a>{" "}
                      to create and pin your validation Lit Action
                    </small>
                  </div>

                  <div style={{ marginBottom: "10px" }}>
                    <label
                      htmlFor="validationCidInput"
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        fontWeight: "500",
                      }}
                    >
                      Validation IPFS CID:
                    </label>
                    <input
                      id="validationCidInput"
                      type="text"
                      value={validationCid}
                      onChange={(e) => setValidationCidManually(e.target.value)}
                      placeholder="QmYLeVmwJPVs7Uebk85YdVPivMyrvoeKR6X37kyVRZUXW4"
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        fontSize: "14px",
                        fontFamily: "monospace",
                      }}
                    />
                    <small style={{ color: "#666", fontSize: "12px" }}>
                      Copy the IPFS CID from Lit Explorer - the CID must be
                      visible on the explorer for Lit nodes to fetch it
                    </small>
                  </div>

                  {/* IPFS Visibility Warning */}
                  <div
                    style={{
                      padding: "10px",
                      backgroundColor: "#fff9e6",
                      borderRadius: "4px",
                      border: "1px solid #ffd700",
                      marginBottom: "10px",
                    }}
                  >
                    <strong>🔍 IPFS Visibility Required:</strong> The IPFS CID
                    must be publicly accessible via the Lit Explorer. If the CID
                    isn't visible on <code>explorer.litprotocol.com</code>, the
                    Lit nodes won't be able to fetch and execute your validation
                    logic.
                  </div>

                  {validationCid && (
                    <div
                      style={{
                        padding: "10px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "4px",
                        border: "1px solid #e9ecef",
                        marginTop: "10px",
                      }}
                    >
                      <strong>Validation CID:</strong> {validationCid}
                      <br />
                      <a
                        href={`https://explorer.litprotocol.com/ipfs/${validationCid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#007bff",
                          textDecoration: "none",
                          fontSize: "12px",
                        }}
                      >
                        🔗 View on Lit Explorer
                      </a>
                    </div>
                  )}
                </div>
              }
              resultData={validationCid ? { validationCid } : null}
              resultLabel="Validation CID"
              useSideBySide={true}
              theme="dracula"
            />
          </GreyBoarderWhiteBgContainer>

          {/* Site Owner Step 3 */}
          <GreyBoarderWhiteBgContainer>
            <h3 style={{ marginTop: 0 }}>
              Step 3: Mint PKPs for Users
              {(!authMethodConfig || !validationCid) && (
                <span style={{ color: "orange" }}>
                  {" "}
                  (Complete previous steps first)
                </span>
              )}
            </h3>
            <p>
              Mint PKPs for your users using the custom auth method type and
              validation CID. Each user gets their own unique PKP tied to your
              dApp's authentication system.
            </p>

            <DisplayCode
              code={`
import { utils as litUtils } from '@lit-protocol/lit-client';

// Mint PKP for each user, assuming that's what you want to do
for (const userId of ['alice', 'bob']) {
  const authData = litUtils.generateAuthData({
    uniqueDappName: '${dappName}',
    uniqueAuthMethodType: authMethodConfig.bigint,
    userId: userId
  });

  const { pkpData } = await litClient.mintWithCustomAuth({
    account: siteOwnerAccount,
    authData: authData,
    scope: 'sign-anything',
    validationIpfsCid: '${validationCid || "your-validation-cid-here"}',
  });

  // Store PKP info for user
  database.users[userId].pkpPublicKey = pkpData.data.pubkey;
}`}
              language="typescript"
              renderComponent={
                <div>
                  <div style={{ marginBottom: "15px" }}>
                    <h4>Mint PKPs for demo users:</h4>
                    <div
                      style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
                    >
                      {["alice", "bob"].map((userId) => (
                        <button
                          key={userId}
                          onClick={() => mintPkpForUser(userId)}
                          disabled={
                            isMintingPkp || !authMethodConfig || !validationCid
                          }
                          style={{
                            padding: "8px 15px",
                            backgroundColor:
                              isMintingPkp ||
                              !authMethodConfig ||
                              !validationCid
                                ? "#cccccc"
                                : "#28a745",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor:
                              isMintingPkp ||
                              !authMethodConfig ||
                              !validationCid
                                ? "not-allowed"
                                : "pointer",
                            fontWeight: "500",
                          }}
                        >
                          {isMintingPkp
                            ? "Minting..."
                            : `Mint PKP for ${userId}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {mintedPkps.length > 0 && (
                    <div
                      style={{
                        padding: "10px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "4px",
                        border: "1px solid #e9ecef",
                        marginTop: "10px",
                      }}
                    >
                      <h5 style={{ margin: "0 0 10px 0" }}>Minted PKPs:</h5>
                      {mintedPkps.map((pkp, index) => (
                        <div
                          key={index}
                          style={{ marginBottom: "5px", fontSize: "12px" }}
                        >
                          <strong>{pkp.userId}:</strong> {pkp.pkpPublicKey}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              }
              resultData={mintedPkps}
              resultLabel="Minted PKPs Database"
              useSideBySide={true}
              theme="dracula"
              isSuccess={successActions.has("mint-pkp")}
            />
          </GreyBoarderWhiteBgContainer>
        </div>
      </div>

      {/* ================================================ */}
      {/*                  USER FLOW                       */}
      {/* ================================================ */}
      <div
        style={{
          border: "2px solid #007bff",
          borderRadius: "8px",
          marginBottom: "30px",
          backgroundColor: "#f8fbff",
        }}
      >
        <div
          style={{
            backgroundColor: "#007bff",
            color: "white",
            padding: "15px",
            borderRadius: "6px 6px 0 0",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ margin: 0 }}>👤 User Flow</h2>
          <p style={{ margin: "5px 0 0 0", fontSize: "14px" }}>
            How users interact with the dApp to authenticate and use their PKP
          </p>
        </div>

        <div style={{ padding: "0 20px 20px 20px" }}>
          {/* User Step 1 */}
          <GreyBoarderWhiteBgContainer>
            <h3 style={{ marginTop: 0 }}>
              Step 1: Login to dApp and Get PKP Info
              {mintedPkps.length === 0 && (
                <span style={{ color: "orange" }}>
                  {" "}
                  (Site owner must mint PKPs first)
                </span>
              )}
            </h3>
            <p>
              User logs into the dApp frontend and retrieves their pre-minted
              PKP information from the dApp's backend. The dApp provides the PKP
              public key and validation details.
            </p>

            <DisplayCode
              code={`// User login and PKP retrieval
const userDashboard = dappFrontend.login('${demoUsername}', password);
const userPkpInfo = userDashboard.getMyPkpInfo();

console.log('User PKP Public Key:', userPkpInfo.pkpPublicKey);
console.log('Validation CID:', userPkpInfo.validationCid);`}
              language="typescript"
              renderComponent={
                <div style={{ marginBottom: "10px" }}>
                  <div style={{ marginBottom: "10px" }}>
                    <label
                      htmlFor="userSelect"
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        fontWeight: "500",
                      }}
                    >
                      Select User:
                    </label>
                    <select
                      id="userSelect"
                      value={demoUsername}
                      onChange={(e) => setDemoUsername(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        fontSize: "14px",
                      }}
                    >
                      {mintedPkps.map((pkp) => (
                        <option key={pkp.userId} value={pkp.userId}>
                          {pkp.userId}
                        </option>
                      ))}
                      {mintedPkps.length === 0 && (
                        <option value="">
                          No users available (mint PKPs first)
                        </option>
                      )}
                    </select>
                  </div>

                  <div style={{ marginBottom: "10px" }}>
                    <label
                      htmlFor="userPassword"
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        fontWeight: "500",
                      }}
                    >
                      Password:
                    </label>
                    <div style={{ color: "#666", fontSize: "12px", marginBottom: "3px" }}>(no validation checking here, so all passwords are valid)</div>
                    <input
                      id="userPassword"
                      type="password"
                      value={demoPassword}
                      onChange={(e) => setDemoPassword(e.target.value)}
                      placeholder="lit"
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        fontSize: "14px",
                      }}
                    />
                  </div>

                  <button
                    onClick={selectUserFromDapp}
                    disabled={mintedPkps.length === 0 || !demoUsername}
                    style={{
                      padding: "10px 15px",
                      backgroundColor:
                        mintedPkps.length === 0 || !demoUsername
                          ? "#cccccc"
                          : "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor:
                        mintedPkps.length === 0 || !demoUsername
                          ? "not-allowed"
                          : "pointer",
                      fontWeight: "500",
                    }}
                  >
                    Login & Get PKP Info
                    {mintedPkps.length === 0 && " (No PKPs minted yet)"}
                  </button>
                </div>
              }
              resultData={selectedUser}
              resultLabel="User PKP Information"
              useSideBySide={true}
              theme="dracula"
              isSuccess={successActions.has("select-user")}
            />
          </GreyBoarderWhiteBgContainer>

          {/* User Step 2 */}
          <GreyBoarderWhiteBgContainer>
            <h3 style={{ marginTop: 0 }}>
              Step 2: Create Custom AuthContext
              {!selectedUser && (
                <span style={{ color: "orange" }}> (Login first)</span>
              )}
            </h3>
            <p>
              Create a custom auth context using the user's PKP and the dApp's
              validation IPFS CID. The Lit Action will validate the user's
              credentials against the dApp's authentication logic.
            </p>

            <p>
              ⭐️ Try changing the password, you will get an error if you don't have the correct password.
            </p>

            <DisplayCode
              code={`// Create custom auth context for user
const customAuthContext = await authManager.createCustomAuthContext({
  pkpPublicKey: userPkpInfo.pkpPublicKey,
  authConfig: {
    resources: [["pkp-signing", "*"], ["lit-action-execution", "*"]],
    expiration: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
  },
  litClient: litClient,
  customAuthParams: {
    litActionIpfsId: userPkpInfo.validationCid,
    jsParams: {
      pkpPublicKey: userPkpInfo.pkpPublicKey,
      username: '${demoUsername}',
      password: userPassword,
      authMethodId: userPkpInfo.authData.authMethodId,
    },
  },
});`}
              language="typescript"
              renderComponent={
                <div>
                  {/* Editable jsParams section */}
                  {selectedUser && (
                    <div
                      style={{
                        padding: "12px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "4px",
                        border: "1px solid #e9ecef",
                        marginBottom: "15px",
                      }}
                    >
                      <h5 style={{ margin: "0 0 15px 0", color: "#495057" }}>
                        🔧 Edit jsParams (passed to Lit Action)
                      </h5>

                      <div style={{ display: "grid", gap: "10px" }}>
                        <div>
                          <label
                            style={{
                              display: "block",
                              marginBottom: "5px",
                              fontSize: "12px",
                              fontWeight: "500",
                            }}
                          >
                            PKP Public Key:
                          </label>
                          <input
                            type="text"
                            value={editableJsParams.pkpPublicKey}
                            onChange={(e) =>
                              setEditableJsParams((prev) => ({
                                ...prev,
                                pkpPublicKey: e.target.value,
                              }))
                            }
                            style={{
                              width: "100%",
                              padding: "6px 8px",
                              fontSize: "11px",
                              fontFamily: "monospace",
                              border: "1px solid #ddd",
                              borderRadius: "3px",
                            }}
                          />
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "10px",
                          }}
                        >
                          <div>
                            <label
                              style={{
                                display: "block",
                                marginBottom: "5px",
                                fontSize: "12px",
                                fontWeight: "500",
                              }}
                            >
                              Username:
                            </label>
                            <input
                              type="text"
                              value={editableJsParams.username}
                              onChange={(e) =>
                                setEditableJsParams((prev) => ({
                                  ...prev,
                                  username: e.target.value,
                                }))
                              }
                              style={{
                                width: "100%",
                                padding: "6px 8px",
                                fontSize: "11px",
                                fontFamily: "monospace",
                                border: "1px solid #ddd",
                                borderRadius: "3px",
                              }}
                            />
                          </div>

                          <div>
                            <label
                              style={{
                                display: "block",
                                marginBottom: "5px",
                                fontSize: "12px",
                                fontWeight: "500",
                              }}
                            >
                              Password:
                            </label>
                            <input
                              type="text"
                              value={editableJsParams.password}
                              onChange={(e) =>
                                setEditableJsParams((prev) => ({
                                  ...prev,
                                  password: e.target.value,
                                }))
                              }
                              style={{
                                width: "100%",
                                padding: "6px 8px",
                                fontSize: "11px",
                                fontFamily: "monospace",
                                border: "1px solid #ddd",
                                borderRadius: "3px",
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            style={{
                              display: "block",
                              marginBottom: "5px",
                              fontSize: "12px",
                              fontWeight: "500",
                            }}
                          >
                            Auth Method ID:
                          </label>
                          <input
                            type="text"
                            value={editableJsParams.authMethodId}
                            onChange={(e) =>
                              setEditableJsParams((prev) => ({
                                ...prev,
                                authMethodId: e.target.value,
                              }))
                            }
                            style={{
                              width: "100%",
                              padding: "6px 8px",
                              fontSize: "11px",
                              fontFamily: "monospace",
                              border: "1px solid #ddd",
                              borderRadius: "3px",
                            }}
                          />
                        </div>
                      </div>

                      <small
                        style={{
                          color: "#6c757d",
                          fontSize: "11px",
                          marginTop: "10px",
                          display: "block",
                        }}
                      >
                        These are the exact values that will be passed to the
                        Lit Action as jsParams.
                      </small>
                    </div>
                  )}

                  <button
                    onClick={createCustomAuthContext}
                    disabled={isCreatingAuthContext || !selectedUser}
                    style={{
                      padding: "12px 20px",
                      backgroundColor:
                        isCreatingAuthContext || !selectedUser
                          ? "#cccccc"
                          : hasCreatedAuthContext
                          ? "#dc3545" // Red for cache clear
                          : "#007bff", // Blue for first time
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor:
                        isCreatingAuthContext || !selectedUser
                          ? "not-allowed"
                          : "pointer",
                      fontWeight: "500",
                    }}
                  >
                    {isCreatingAuthContext
                      ? "Creating..."
                      : hasCreatedAuthContext
                      ? "🗑️ Clear Cache & Re-authenticate"
                      : "Create Custom AuthContext"}
                  </button>

                  {hasCreatedAuthContext && (
                    <small
                      style={{
                        display: "block",
                        marginTop: "8px",
                        color: "#dc3545",
                        fontSize: "12px",
                        fontStyle: "italic",
                      }}
                    >
                      👋 Next click will clear cached auth signatures and
                      re-authenticate with current jsParams, try to change the
                      jsParams you will get an error
                    </small>
                  )}
                </div>
              }
              resultData={authContext}
              resultLabel="Custom AuthContext Information"
              useSideBySide={true}
              theme="dracula"
              isSuccess={successActions.has("create-auth-context")}
            />
          </GreyBoarderWhiteBgContainer>

          {/* User Step 3 */}
          <GreyBoarderWhiteBgContainer>
            <PkpSigningComponent
              authContext={authContext}
              pkpInfo={mockAuthContext}
              setStatus={setStatus}
              assertDependenciesLoaded={assertDependenciesLoaded}
              defaultMessage="Hello from dApp Custom Auth PKP!"
              componentTitle={`Step 3: Sign Message with PKP (${AUTH_NAME})`}
            />
          </GreyBoarderWhiteBgContainer>
        </div>
      </div>

      {/* ================================================ */}
      {/*               REFERENCE CODE SECTIONS           */}
      {/* ================================================ */}

      <GreyBoarderWhiteBgContainer>
        <h3 style={{ marginTop: "20px", color: "#6366f1" }}>
          📋 Reference: Complete Validation Lit Action
        </h3>
        <p>
          This is the complete immutable validation code that site owners pin to
          IPFS for their custom authentication logic.
        </p>

        <DisplayCode
          code={VALIDATION_LIT_ACTION_CODE}
          language="typescript"
          useSideBySide={false}
          theme="dracula"
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h3 style={{ marginTop: "20px", color: "#28a745" }}>
          📋 Reference: Complete Site Owner Backend Implementation
        </h3>
        <p>
          This is how site owners would implement the complete backend to manage
          their dApp's custom authentication system.
        </p>

        <DisplayCode
          code={SITE_OWNER_BACKEND_CODE}
          language="typescript"
          useSideBySide={false}
          theme="dracula"
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h3 style={{ marginTop: "20px", color: "#007bff" }}>
          📋 Reference: Complete User Frontend Implementation
        </h3>
        <p>
          This is how users would interact with the dApp frontend to
          authenticate and use their PKP.
        </p>

        <DisplayCode
          code={USER_FRONTEND_CODE}
          language="typescript"
          useSideBySide={false}
          theme="dracula"
        />
      </GreyBoarderWhiteBgContainer>
    </div>
  );
}
