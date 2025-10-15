import { useState } from "react";
import { useWalletClient } from "wagmi";
import EoaAuthSection from "../components/common/EoaAuthSection";
import AccountMethodSelector, { 
  AccountMethod, 
  CREATE_ACCOUNT_PRIVATE_KEY_CODE, 
  CREATE_ACCOUNT_WALLET_CLIENT_CODE 
} from "../components/common/AccountMethodSelector";
import { DisplayCode } from "../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../components/layout/GreyboardWhiteBgContainer";
import { useAppContext } from "../router";
import { APP_INFO } from "../_config";

const OPERATION_NAME = "EOA Auth";

// Configuration constants
const FAUCET_URL = "https://chronicle-yellowstone-faucet.getlit.dev/";

// Remove the old code snippets since they're now exported from AccountMethodSelector
// const CREATE_ACCOUNT_PRIVATE_KEY_CODE = `...` (removed)
// const CREATE_ACCOUNT_WALLET_CLIENT_CODE = `...` (removed)

const MINT_PKP_WITH_EOA_CODE = `
// 3a. Mint a PKP using your account. This is then owned by the account
// ❗️ You will need to manually add permissions to the PKP before it can be used.
const mintedPkpWithEoa = await litClient.mintWithEoa({
  account: myAccount,
});`;

const GET_PKP_PERMISSIONS_MANAGER_CODE = `
// Then you can instantiate a PKP manager for control your PKP permissions like this:
const pkpPermissionsManager = await litClient.getPKPPermissionsManager({
  pkpIdentifier: {
    tokenId: mintedPkpWithEoa.data.tokenId,
  },
  account: myAccount,
});`;

const VIEW_PKP_PERMISSIONS_CODE = `
// you can also use the viewPKPPermissions method to view all permissions you pkp has: eg.
const res = await litClient.viewPKPPermissions({
  tokenId: mintedPkpWithEoa.data.tokenId,
});

console.log('✅ viewPKPPermissions:', res);`;

const ADD_PERMISSIONS_CODE = `
// Add permissions to allow the PKP to be used for signing
const addPermissionsTx = await pkpPermissionsManager.addPermittedAction({
  ipfsId: "QmWGkjZKcfsE9nabey7cXf8ViZ5Mf5CvLFTHbsYa79s3ER",
  scopes: ["sign-anything"],
});
]);`;

const CREATE_EOA_AUTH_CONTEXT_CODE = `
// Create an EOA AuthContext to use your EOA-owned PKP for signing
const eoaAuthContext = await authManager.createEoaAuthContext({
  config: {
    account: myAccount, // your EOA (walletClient or viem account)
  },
  authConfig: {
    domain: window.location.origin,
    statement: 'Use PKP with EOA',
    expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    resources: [
      ['pkp-signing', '*'],
      ['lit-action-execution', '*'],
    ],
  },
  litClient,
});`;

const PKP_SIGN_CODE = `
// Sign a message with your EOA-owned PKP via viem account
// Precondition: you created eoaAuthContext and funded the PKP ledger
const chainConfig = litClient.getChainConfig().viemConfig;
const pkpViemAccount = await litClient.getPkpViemAccount({
  pkpPublicKey: mintedPkpInfo.pubkey,
  authContext: eoaAuthContext,
  chainConfig,
});
const signature = await pkpViemAccount.signMessage({ message: 'Hello from EOA PKP' });
console.log('signature:', signature);`;

const LIT_ACTION_EXECUTE_CODE = `
// Execute a Lit Action using your EOA-owned PKP (inline code example)
// Precondition: eoaAuthContext exists and PKP ledger is funded
const code = ` + "`" + `
const go = async () => {
  const message = (jsParams && jsParams.message) || 'Hello from EOA PKP';
  // Return a simple response
  Lit.Actions.setResponse({ response: message });
};
go();
` + "`" + `;

const result = await litClient.executeJs({
  code,
  authContext: eoaAuthContext,
  jsParams: { message: 'Hello from EOA PKP' },
});
console.log('Lit Action result:', result);`;

import { createLitClient } from "@lit-protocol/lit-client";
type LitClient = Awaited<
  ReturnType<
    Awaited<ReturnType<typeof createLitClient>>["getPKPPermissionsManager"]
  >
>;

export default function EoaNativeTab() {
  const { data: walletClient } = useWalletClient();
  const {
    getDependencyStatus,
    areDependenciesLoaded,
    setStatus,
    assertDependenciesLoaded,
    showError,
    clearError,
  } = useAppContext();

  const [isMinting, setIsMinting] = useState(false);
  const [isGettingManager, setIsGettingManager] = useState(false);
  const [isViewingPermissions, setIsViewingPermissions] = useState(false);
  const [isAddingPermissions, setIsAddingPermissions] = useState(false);

  const [accountMethod, setAccountMethod] = useState<AccountMethod>("walletClient"); // Default to wallet client
  const [account, setAccount] = useState<any>(null);
  const [mintedPkpInfo, setMintedPkpInfo] = useState<any>(null);
  const [pkpPermissionsManager, setPkpPermissionsManager] = useState<LitClient>(
    null as unknown as LitClient
  );
  const [pkpPermissions, setPkpPermissions] = useState<any>(null);
  const [addPermissionsResult, setAddPermissionsResult] = useState<any>(null);
  const [eoaAuthContext, setEoaAuthContext] = useState<any>(null);
  const [pkpSignature, setPkpSignature] = useState<string>("");
  const [litActionResult, setLitActionResult] = useState<any>(null);
  // Funding state for PKP Ledger
  const [fundAccount, setFundAccount] = useState<any>(null);
  const [fundAmount, setFundAmount] = useState<string>("0.1");
  const [fundTxHash, setFundTxHash] = useState<string>("");
  const [isFunding, setIsFunding] = useState<boolean>(false);
  const [isCheckingBalance, setIsCheckingBalance] = useState<boolean>(false);
  const [availableBalance, setAvailableBalance] = useState<string>("");

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

  const mintPkpWithEoa = async () => {
    const { litClient } = assertDependenciesLoaded();

    if (!account) {
      throw new Error("No account found. Create account first.");
    }

    setStatus("Minting PKP with EOA...");
    setIsMinting(true);
    setMintedPkpInfo(null);

    try {
      // ❗️ You will need to manually add permissions to the PKP before it can be used.
      const mintedPkpWithEoa = await litClient.mintWithEoa({
        account: account,
      });

      const mintedPkpInfo = mintedPkpWithEoa.data;
      setMintedPkpInfo(mintedPkpInfo);
      console.log("Minted PKP Info:", mintedPkpInfo);
      setStatus(
        "PKP minted successfully with EOA! Note: You need to add permissions before it can be used."
      );
      showSuccess("eoa-native-mint-pkp");
    } catch (error: any) {
      console.error("Error minting PKP with EOA:", error);
      const errorMessage = formatErrorMessage("Failed to mint PKP with EOA: ", error);
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsMinting(false);
    }
  };

  const getPkpPermissionsManager = async () => {
    const { litClient } = assertDependenciesLoaded();

    if (!account || !mintedPkpInfo) {
      throw new Error("No account or minted PKP found.");
    }

    setStatus("Getting PKP permissions manager...");
    setIsGettingManager(true);
    setPkpPermissionsManager(null as unknown as LitClient);

    try {
      const pkpPermissionsManager = await litClient.getPKPPermissionsManager({
        pkpIdentifier: {
          tokenId: mintedPkpInfo.tokenId,
        },
        account: account,
      });

      setPkpPermissionsManager(pkpPermissionsManager);
      setStatus("PKP permissions manager obtained successfully!");
      showSuccess("eoa-native-get-permissions-manager");
    } catch (error: any) {
      console.error("Error getting PKP permissions manager:", error);
      const errorMessage = formatErrorMessage("Failed to get PKP permissions manager: ", error);
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsGettingManager(false);
    }
  };

  const viewPkpPermissions = async () => {
    const { litClient } = assertDependenciesLoaded();

    if (!mintedPkpInfo) {
      throw new Error("No minted PKP found.");
    }

    setStatus("Viewing PKP permissions...");
    setIsViewingPermissions(true);
    setPkpPermissions(null);

    try {
      const res = await litClient.viewPKPPermissions({
        tokenId: mintedPkpInfo.tokenId,
      });

      setPkpPermissions(res);
      console.log("✅ viewPKPPermissions:", res);
      setStatus("PKP permissions viewed successfully!");
      showSuccess("eoa-native-view-permissions");
    } catch (error: any) {
      console.error("Error viewing PKP permissions:", error);
      const errorMessage = formatErrorMessage("Failed to view PKP permissions: ", error);
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsViewingPermissions(false);
    }
  };

  const addPermissionsToPkp = async () => {
    if (!pkpPermissionsManager) {
      throw new Error("No PKP permissions manager found. Get manager first.");
    }

    setStatus("Adding permissions to PKP...");
    setIsAddingPermissions(true);
    setAddPermissionsResult(null);

    try {
      // Add permissions to allow the PKP to be used for signing
      const addPermissionsTx = await pkpPermissionsManager.addPermittedAction({
        ipfsId: "QmWGkjZKcfsE9nabey7cXf8ViZ5Mf5CvLFTHbsYa79s3ER",
        scopes: ["sign-anything"],
      });

      setAddPermissionsResult(addPermissionsTx);
      console.log("✅ addPermissions result:", addPermissionsTx);
      setStatus("Permissions added to PKP successfully!");
      showSuccess("eoa-native-add-permissions");
    } catch (error: any) {
      console.error("Error adding permissions to PKP:", error);
      const errorMessage = formatErrorMessage("Failed to add permissions to PKP: ", error);
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsAddingPermissions(false);
    }
  };

  // Create EOA AuthContext (required for pkpSign)
  const createEoaAuthContext = async () => {
    try {
      const { authManager, litClient } = assertDependenciesLoaded();
      if (!account) {
        throw new Error("No account found. Create or connect an account first.");
      }
      setStatus("Creating EOA AuthContext for PKP usage...");
      const ctx = await authManager.createEoaAuthContext({
        config: { account },
        authConfig: {
          domain: window.location.origin,
          statement: "Use PKP with EOA",
          expiration: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          resources: [["pkp-signing", "*"], ["lit-action-execution", "*"]],
        },
        litClient,
      });
      setEoaAuthContext(ctx);
      setStatus("EOA AuthContext created successfully");
      showSuccess("eoa-native-create-eoa-auth");
    } catch (error: any) {
      const msg = formatErrorMessage("Failed to create EOA AuthContext: ", error);
      setStatus(msg);
      showError?.(msg);
    }
  };

  // Sign a message using the EOA-owned PKP
  const signWithPkp = async () => {
    try {
      console.log("[EOA_NATIVE][pkpSign] Clicked Sign Message with PKP");
      const { litClient } = assertDependenciesLoaded();
      console.log("[EOA_NATIVE][pkpSign] litClient ready:", !!litClient);
      const pkpPublicKey = mintedPkpInfo?.pubkey || mintedPkpInfo?.publicKey;
      console.log("[EOA_NATIVE][pkpSign] mintedPkpInfo:", mintedPkpInfo);
      console.log("[EOA_NATIVE][pkpSign] pkpPublicKey detected:", pkpPublicKey);
      if (!pkpPublicKey) {
        throw new Error("No PKP found. Mint or load a PKP first.");
      }
      console.log("[EOA_NATIVE][pkpSign] eoaAuthContext present:", !!eoaAuthContext);
      if (!eoaAuthContext) {
        throw new Error("No EOA AuthContext. Create it first.");
      }

      // Preflight: ensure PKP ledger is funded on current network
      try {
        console.log("[EOA_NATIVE][pkpSign] Getting PaymentManager with account:",
          account?.address || walletClient?.account?.address);
        const pm = await litClient.getPaymentManager({ account: account || walletClient });
        const bal = await pm.getBalance({ userAddress: mintedPkpInfo.ethAddress });
        console.log("[EOA_NATIVE][pkpSign] PKP balance:", bal);
        const available = parseFloat(bal?.availableBalance || "0");
        if (available <= 0) {
          setStatus(
            `PKP Lit Ledger has 0 balance on ${APP_INFO.network}. Please fund ${mintedPkpInfo.ethAddress} and try again.`
          );
          console.warn("[EOA_NATIVE][pkpSign] Insufficient ledger balance. Aborting sign.");
          return;
        }
      } catch {}

      setStatus("Signing with PKP via viem...");
      const chainConfig = litClient.getChainConfig().viemConfig;
      console.log("[EOA_NATIVE][pkpSign] chainConfig ready:", !!chainConfig);
      const pkpViemAccount = await litClient.getPkpViemAccount({
        pkpPublicKey,
        authContext: eoaAuthContext,
        chainConfig,
      });
      console.log("[EOA_NATIVE][pkpSign] Derived pkpViemAccount:", {
        address: pkpViemAccount?.address,
        type: typeof pkpViemAccount,
      });
      const sig = await pkpViemAccount.signMessage({ message: "Hello from EOA PKP" });
      console.log("[EOA_NATIVE][pkpSign] signature:", sig);
      setPkpSignature(sig);
      setStatus("Signed with PKP successfully");
      showSuccess("eoa-native-pkp-sign");
    } catch (error: any) {
      console.error("[EOA_NATIVE][pkpSign] Error:", error);
      const msg = formatErrorMessage("Failed to sign with PKP: ", error);
      setStatus(msg);
      showError?.(msg);
    }
  };

  // Execute a Lit Action using the EOA-owned PKP
  const executeLitAction = async () => {
    try {
      const { litClient } = assertDependenciesLoaded();
      const pkpPublicKey = mintedPkpInfo?.pubkey || mintedPkpInfo?.publicKey;
      if (!pkpPublicKey) throw new Error("No PKP found. Mint or load a PKP first.");
      if (!eoaAuthContext) throw new Error("No EOA AuthContext. Create it first.");

      // Preflight funding (reuse fundAccount or account)
      try {
        const pm = await litClient.getPaymentManager({ account: fundAccount || account || walletClient });
        const bal = await pm.getBalance({ userAddress: mintedPkpInfo.ethAddress });
        const available = parseFloat(bal?.availableBalance || "0");
        if (available <= 0) {
          setStatus(
            `PKP Lit Ledger has 0 balance on ${APP_INFO.network}. Please fund ${mintedPkpInfo.ethAddress} and try again.`
          );
          return;
        }
      } catch {}

      setStatus("Executing Lit Action with PKP...");
      const code = `\nconst go = async () => {\n  const message = (jsParams && jsParams.message) || 'Hello from EOA PKP';\n  Lit.Actions.setResponse({ response: message });\n};\ngo();\n`;
      const res = await litClient.executeJs({
        code,
        authContext: eoaAuthContext,
        jsParams: { message: 'Hello from EOA PKP' },
      });
      setLitActionResult(res);
      setStatus("Lit Action executed successfully");
      showSuccess("eoa-native-execute-lit-action");
    } catch (error: any) {
      const msg = formatErrorMessage("Failed to execute Lit Action: ", error);
      setStatus(msg);
      showError?.(msg);
    }
  };

  // Fund PKP Ledger helpers
  const checkPkpBalance = async () => {
    if (!mintedPkpInfo?.ethAddress || !fundAccount) return;
    try {
      setIsCheckingBalance(true);
      const { litClient } = assertDependenciesLoaded();
      const pm = await litClient.getPaymentManager({ account: fundAccount });
      const bal = await pm.getBalance({ userAddress: mintedPkpInfo.ethAddress });
      setAvailableBalance(bal?.availableBalance || "0");
      setStatus(`Available balance: ${bal?.availableBalance || "0"} ETH`);
    } catch (e: any) {
      const msg = formatErrorMessage("Balance check failed: ", e);
      setStatus(msg);
      showError?.(msg);
    } finally {
      setIsCheckingBalance(false);
    }
  };

  const fundPkp = async () => {
    if (!mintedPkpInfo?.ethAddress || !fundAccount || !fundAmount) return;
    try {
      setIsFunding(true);
      const { litClient } = assertDependenciesLoaded();
      const pm = await litClient.getPaymentManager({ account: fundAccount });
      const tx = await pm.depositForUser({
        userAddress: mintedPkpInfo.ethAddress,
        amountInEth: fundAmount,
      });
      const hash = (tx as any)?.transactionHash || (tx as any)?.hash || "";
      setFundTxHash(hash);
      setStatus(`Funding submitted: ${hash}`);
      await checkPkpBalance();
      showSuccess("eoa-native-fund-pkp");
    } catch (e: any) {
      const msg = formatErrorMessage("Funding failed: ", e);
      setStatus(msg);
      showError?.(msg);
    } finally {
      setIsFunding(false);
    }
  };

  // Component to render Mint PKP button
  const MintPKPButton = () => (
    <button
      onClick={mintPkpWithEoa}
      disabled={!areDependenciesLoaded() || isMinting || !account}
      style={{
        padding: "10px 15px",
        backgroundColor:
          !areDependenciesLoaded() || isMinting || !account
            ? "#cccccc"
            : "#28a745",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor:
          !areDependenciesLoaded() || isMinting || !account
            ? "not-allowed"
            : "pointer",
        fontWeight: "500",
        marginBottom: "10px",
      }}
    >
      {isMinting ? "Minting PKP..." : "Mint PKP with EOA"}
      {!account && " (Create account first)"}
    </button>
  );

  // Component to render Get PKP Permissions Manager button
  const GetManagerButton = () => (
    <button
      onClick={getPkpPermissionsManager}
      disabled={isGettingManager || !mintedPkpInfo || !account}
      style={{
        padding: "10px 15px",
        backgroundColor:
          isGettingManager || !mintedPkpInfo || !account
            ? "#cccccc"
            : "#007bff",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor:
          isGettingManager || !mintedPkpInfo || !account
            ? "not-allowed"
            : "pointer",
        fontWeight: "500",
      }}
    >
      {isGettingManager ? "Getting Manager..." : "Get PKP Permissions Manager"}
      {(!mintedPkpInfo || !account) && " (Mint PKP first)"}
    </button>
  );

  // Component to render View PKP Permissions button
  const ViewPermissionsButton = () => (
    <button
      onClick={viewPkpPermissions}
      disabled={isViewingPermissions || !mintedPkpInfo}
      style={{
        padding: "10px 15px",
        backgroundColor:
          isViewingPermissions || !mintedPkpInfo ? "#cccccc" : "#6f42c1",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor:
          isViewingPermissions || !mintedPkpInfo ? "not-allowed" : "pointer",
        fontWeight: "500",
      }}
    >
      {isViewingPermissions ? "Viewing..." : "View PKP Permissions"}
      {!mintedPkpInfo && " (Mint PKP first)"}
    </button>
  );

  // Component to render Add Permissions button
  const AddPermissionsButton = () => (
    <button
      onClick={addPermissionsToPkp}
      disabled={isAddingPermissions || !pkpPermissionsManager}
      style={{
        padding: "10px 15px",
        backgroundColor:
          isAddingPermissions || !pkpPermissionsManager ? "#cccccc" : "#dc3545",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor:
          isAddingPermissions || !pkpPermissionsManager
            ? "not-allowed"
            : "pointer",
        fontWeight: "500",
      }}
    >
      {isAddingPermissions
        ? "Adding Permissions..."
        : "Add Signing Permissions"}
      {!pkpPermissionsManager && " (Get manager first)"}
    </button>
  );

  return (
    <div className="tab-content">
      <h2>{OPERATION_NAME}</h2>
      <p>
        {OPERATION_NAME} demonstrates direct EOA usage for PKP management. Your
        EOA owns and directly manages PKPs, including minting, setting
        permissions, and viewing permissions. This approach gives you full
        control over PKP management.
      </p>

      <div
        style={{
          padding: "12px",
          marginBottom: "20px",
          backgroundColor: "#fff3cd",
          borderRadius: "4px",
          fontSize: "14px",
          border: "1px solid #ffeaa7",
        }}
      >
        <strong>⚠️ Important:</strong> PKPs minted with <code>mintWithEoa</code>{" "}
        require manual permission setup before they can be used for signing
        operations.
      </div>

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
          {accountMethod === "privateKey" ? (
            <li>
              Private Key:{" "}
              {account ? (
                <span style={{ color: "green" }}>✓ Provided</span>
              ) : (
                <span style={{ color: "red" }}>✗ Not provided</span>
              )}
            </li>
          ) : (
            <li>
              Wallet Client:{" "}
              {walletClient ? (
                <span style={{ color: "green" }}>✓ Connected</span>
              ) : (
                <span style={{ color: "red" }}>✗ Not connected</span>
              )}
            </li>
          )}
        </ul>

        {/* Faucet Information */}
        <div
          style={{
            marginTop: "15px",
            padding: "10px",
            backgroundColor: "#e8f4fd",
            borderRadius: "4px",
            border: "1px solid #b3d9ff",
          }}
        >
          <strong>💰 Need Test Tokens?</strong> Visit the{" "}
          <a
            href={FAUCET_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#0066cc", textDecoration: "underline" }}
          >
            Chronicle Yellowstone Faucet
          </a>{" "}
          to get test tokens for your EOA account.
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*            Create Account from Private Key       */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>Step 1: Create Account</h3>
        <p>
          {accountMethod === "privateKey"
            ? "Convert your private key to a viem account object that will own and manage PKPs."
            : "Use your connected wallet account to own and manage PKPs."}
        </p>

        <DisplayCode
          code={
            accountMethod === "privateKey"
              ? CREATE_ACCOUNT_PRIVATE_KEY_CODE
              : CREATE_ACCOUNT_WALLET_CLIENT_CODE
          }
          language="typescript"
          renderComponent={
            <AccountMethodSelector
              onAccountCreated={setAccount}
              onMethodChange={setAccountMethod}
              setStatus={setStatus}
              showError={showError}
              showSuccess={showSuccess}
              successActionIds={{
                createAccount: "eoa-native-create-account",
                getWalletAccount: "eoa-native-get-wallet-account",
              }}
              successActions={successActions}
            />
          }
          resultData={
            account ? { address: account.address, type: account.type } : null
          }
          resultLabel="Account Information"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("eoa-native-create-account") || successActions.has("eoa-native-get-wallet-account")}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*               Mint PKP with EOA                  */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>Step 2: Mint PKP with EOA</h3>
        <p>
          Mint a new Programmable Key Pair (PKP) using your EOA. The PKP will be
          owned by your EOA account.
          <br />
          <strong>Note:</strong> You will need to manually add permissions to
          the PKP before it can be used for signing.
        </p>

        <DisplayCode
          code={MINT_PKP_WITH_EOA_CODE}
          language="typescript"
          renderComponent={<MintPKPButton />}
          resultData={mintedPkpInfo}
          resultLabel="Minted PKP Information"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("eoa-native-mint-pkp")}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*            Get PKP Permissions Manager           */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>
          Step 3: Get PKP Permissions Manager{" "}
          {!mintedPkpInfo && (
            <span style={{ color: "orange" }}>(Mint PKP first)</span>
          )}
        </h3>
        <p>
          Instantiate a PKP permissions manager to control your PKP permissions.
          This manager allows you to add, remove, and modify permissions for
          your PKP.
        </p>

        <DisplayCode
          code={GET_PKP_PERMISSIONS_MANAGER_CODE}
          language="typescript"
          renderComponent={<GetManagerButton />}
          resultData={
            pkpPermissionsManager
              ? {
                  hasManager: true,
                  methods: Object.keys(pkpPermissionsManager).slice(0, 5),
                }
              : null
          }
          resultLabel="PKP Permissions Manager"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("eoa-native-get-permissions-manager")}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*              View PKP Permissions                */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>
          Step 4: View PKP Permissions{" "}
          {!mintedPkpInfo && (
            <span style={{ color: "orange" }}>(Mint PKP first)</span>
          )}
        </h3>
        <p>
          View all current permissions associated with your PKP. This shows what
          actions and scopes are currently allowed.
        </p>

        <DisplayCode
          code={VIEW_PKP_PERMISSIONS_CODE}
          language="typescript"
          renderComponent={<ViewPermissionsButton />}
          resultData={pkpPermissions}
          resultLabel="PKP Permissions"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("eoa-native-view-permissions")}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*              Add PKP Permissions                 */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>
          Step 5: Add Signing Permissions{" "}
          {!pkpPermissionsManager && (
            <span style={{ color: "orange" }}>(Get manager first)</span>
          )}
        </h3>
        <p>
          Add permissions to allow your PKP to be used for signing operations.
          This adds the "sign anything" scope which enables general signing
          functionality.
        </p>

        <DisplayCode
          code={ADD_PERMISSIONS_CODE}
          language="typescript"
          renderComponent={<AddPermissionsButton />}
          resultData={addPermissionsResult}
          resultLabel="Add Permissions Result"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("eoa-native-add-permissions")}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*                Fund PKP Ledger (EOA)             */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>
          Step 6: Fund PKP Ledger {(!mintedPkpInfo) && (
            <span style={{ color: "orange" }}>(Mint PKP first)</span>
          )}
        </h3>
        <p>
          Use your EOA to deposit to the PKP's Lit Ledger on the selected network. Default amount is 0.1.
        </p>
        <div style={{ marginTop: "8px" }}>
          <div style={{ marginBottom: "8px" }}>
            <AccountMethodSelector
              onAccountCreated={setFundAccount}
              onMethodChange={() => {}}
              setStatus={setStatus}
              showError={showError}
              showSuccess={showSuccess}
              successActionIds={{
                createAccount: "eoa-native-fund-create-account",
                getWalletAccount: "eoa-native-fund-get-wallet-account",
              }}
              successActions={successActions}
            />
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <label>Amount (ETH):</label>
            <input
              type="number"
              min="0"
              step="0.001"
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
              style={{ padding: "6px 8px", border: "1px solid #ddd", borderRadius: 4 }}
            />
            <button
              onClick={fundPkp}
              disabled={!fundAccount || !mintedPkpInfo || isFunding}
              style={{
                padding: "8px 12px",
                backgroundColor: !fundAccount || !mintedPkpInfo || isFunding ? "#cccccc" : "#0ea5e9",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: !fundAccount || !mintedPkpInfo || isFunding ? "not-allowed" : "pointer",
                fontWeight: "500",
              }}
            >
              {isFunding ? "Funding..." : "Fund Now"}
            </button>
            <button
              onClick={checkPkpBalance}
              disabled={!fundAccount || !mintedPkpInfo || isCheckingBalance}
              style={{
                padding: "8px 12px",
                backgroundColor: !fundAccount || !mintedPkpInfo || isCheckingBalance ? "#cccccc" : "#198754",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: !fundAccount || !mintedPkpInfo || isCheckingBalance ? "not-allowed" : "pointer",
                fontWeight: "500",
              }}
            >
              {isCheckingBalance ? "Checking..." : "Check Balance"}
            </button>
          </div>
          {(availableBalance || fundTxHash) && (
            <div style={{ marginTop: 8, fontFamily: "monospace", fontSize: 12 }}>
              {availableBalance && <div>Available: {availableBalance} ETH</div>}
              {fundTxHash && <div>Tx: {fundTxHash}</div>}
            </div>
          )}
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*      Create EOA AuthContext for PKP Usage        */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>
          Step 7: Create EOA AuthContext {(!account) && (
            <span style={{ color: "orange" }}>(Create account first)</span>
          )}
        </h3>
        <p>
          Create an EOA AuthContext to authorise the PKP for signing and Lit Action execution.
        </p>

        <DisplayCode
          code={CREATE_EOA_AUTH_CONTEXT_CODE}
          language="typescript"
          renderComponent={
            <button
              onClick={createEoaAuthContext}
              disabled={!account}
              style={{
                padding: "10px 15px",
                backgroundColor: !account ? "#cccccc" : "#0d6efd",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: !account ? "not-allowed" : "pointer",
                fontWeight: "500",
              }}
            >
              Create EOA AuthContext
            </button>
          }
          resultData={eoaAuthContext}
          resultLabel="EOA AuthContext"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("eoa-native-create-eoa-auth")}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*                Sign with PKP (EOA)               */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>
          Step 8: Sign Message with PKP {(!mintedPkpInfo || !eoaAuthContext) && (
            <span style={{ color: "orange" }}>(Mint PKP and create EOA AuthContext first)</span>
          )}
        </h3>
        <p>
          Use your EOA-owned PKP to sign a message. Ensure the PKP ledger is funded on naga‑test.
        </p>

        <DisplayCode
          code={PKP_SIGN_CODE}
          language="typescript"
          renderComponent={
            <button
              onClick={signWithPkp}
              disabled={!mintedPkpInfo || !eoaAuthContext}
              style={{
                padding: "10px 15px",
                backgroundColor: !mintedPkpInfo || !eoaAuthContext ? "#cccccc" : "#198754",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: !mintedPkpInfo || !eoaAuthContext ? "not-allowed" : "pointer",
                fontWeight: "500",
              }}
            >
              Sign Message with PKP
            </button>
          }
          resultData={pkpSignature ? { signature: pkpSignature } : null}
          resultLabel="PKP Signature"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("eoa-native-pkp-sign")}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*              Execute Lit Action (EOA PKP)         */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>
          Step 9: Execute Lit Action {(!mintedPkpInfo || !eoaAuthContext) && (
            <span style={{ color: "orange" }}>(Mint PKP and create EOA AuthContext first)</span>
          )}
        </h3>
        <p>
          Run a Lit Action using your EOA-owned PKP. Ensure the PKP ledger is funded on the selected network.
        </p>

        <DisplayCode
          code={LIT_ACTION_EXECUTE_CODE}
          language="typescript"
          renderComponent={
            <button
              onClick={executeLitAction}
              disabled={!mintedPkpInfo || !eoaAuthContext}
              style={{
                padding: "10px 15px",
                backgroundColor: !mintedPkpInfo || !eoaAuthContext ? "#cccccc" : "#6610f2",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: !mintedPkpInfo || !eoaAuthContext ? "not-allowed" : "pointer",
                fontWeight: "500",
              }}
            >
              Execute Lit Action
            </button>
          }
          resultData={litActionResult}
          resultLabel="Lit Action Result"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("eoa-native-execute-lit-action")}
        />
      </GreyBoarderWhiteBgContainer>

      {/* Add EOA Auth Section */}
      <EoaAuthSection tabName={OPERATION_NAME} />
    </div>
  );
}
