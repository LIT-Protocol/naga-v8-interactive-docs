import { useState } from "react";
import { useWalletClient } from "wagmi";
import PkpSelectionComponent from "../../../../components/common/PkpSelectionComponent";
import AccountMethodSelector, {
  AccountMethod,
  CREATE_ACCOUNT_PRIVATE_KEY_CODE,
  CREATE_ACCOUNT_WALLET_CLIENT_CODE,
} from "../../../../components/common/AccountMethodSelector";
import { DisplayCode } from "../../../../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../../../../components/layout/GreyboardWhiteBgContainer";
import { useAppContext } from "../../../../router";
import { SUPPORTED_CHAINS } from "../../../../components/protectedApp/utils/chains";

// Configuration constants
const FAUCET_URL = "https://chronicle-yellowstone-faucet.getlit.dev/";

// Code snippets for each functionality
const AUTHENTICATE_PRIVATE_KEY_CODE = `
import { ViemAccountAuthenticator } from '@lit-protocol/auth';

const authData = await ViemAccountAuthenticator.authenticate(myAccount);`;

const AUTHENTICATE_WALLET_CLIENT_CODE = `
import { WalletClientAuthenticator } from '@lit-protocol/auth';

const authData = await WalletClientAuthenticator.authenticate(walletClient);`;

const CREATE_AUTH_CONTEXT_CODE = `
const authContext = await authManager.createPkpAuthContext({
  authData: authData, // <-- Retrieved earlier
  pkpPublicKey: pkpInfo.pubkey, // <-- Minted earlier
  authConfig: {
    resources: [
      ["pkp-signing", "*"],
      ["lit-action-execution", "*"],
    ],
    capabilityAuthSigs: [],
    expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    statement: "",
    domain: window.location.origin,
  },
  litClient: litClient,
});`;

const GET_PKP_PERMISSIONS_MANAGER_CODE = `
// Then you can instantiate a PKP manager for control your PKP permissions like this:
const pkpPermissionsManager = await litClient.getPKPPermissionsManager({
  pkpIdentifier: {
    tokenId: pkpInfo.tokenId,
  },
  account: pkpViemAccount,
});`;

const VIEW_PKP_PERMISSIONS_CODE = `
// you can also use the viewPKPPermissions method to view all permissions you pkp has: eg.
const res = await litClient.viewPKPPermissions({
  tokenId: pkpInfo.tokenId,
});

console.log('viewPKPPermissions:', res);`;

// Different code snippets for different addPermitted actions
const ADD_PERMITTED_ACTION_CODE = `
const addPermissionsTx = await pkpPermissionsManager.addPermittedAction({
  ipfsId: "QmWGkjZKcfsE9nabey7cXf8ViZ5Mf5CvLFTHbsYa79s3ER",
  scopes: ["sign-anything"],
});`;

const ADD_PERMITTED_ADDRESS_CODE = `
// A dummy address is being used as an example
const addPermissionsTx = await pkpPermissionsManager.addPermittedAddress({
  address: "0x1234567890123456789012345678901234567890",
  scopes: ["no-permissions"],
});`;

const ADD_PERMITTED_AUTH_METHOD_SCOPE_CODE = `
// This is adding the Sign Anything scope
// to the address 0x1234567890123456789012345678901234567890
const addPermissionsTx = await pkpPermissionsManager.addPermittedAuthMethodScope({
  tokenId: pkpInfo.tokenId,
  authMethodType: 1,
  authMethodId: "0x1234567890123456789012345678901234567890",
  scopeId: 1, // Sign Anything scope
});`;

// Different code snippets for different removePermitted actions
const REMOVE_PERMITTED_ACTION_CODE = `
// Remove permissions from the PKP
const removePermissionsTx = await pkpPermissionsManager.removePermittedAction({
  tokenId: pkpInfo.tokenId,  
  ipfsId: "QmWGkjZKcfsE9nabey7cXf8ViZ5Mf5CvLFTHbsYa79s3ER",
});`;

const REMOVE_PERMITTED_ADDRESS_CODE = `
// Remove a permitted address from this PKP
const removePermissionsTx = await pkpPermissionsManager.removePermittedAddress({
  tokenId: pkpInfo.tokenId,
  address: "0x1234567890123456789012345678901234567890",
});`;

const REMOVE_PERMITTED_AUTH_METHOD_CODE = `
// Remove a permitted auth method from this PKP
const removePermissionsTx = await pkpPermissionsManager.removePermittedAuthMethod({
  tokenId: pkpInfo.tokenId,
  authMethodType: 1,
  authMethodId: "0x1234567890123456789012345678901234567890",
});`;

const GET_PKP_VIEM_ACCOUNT_CODE = `
// Get PKP as a viem account
const pkpViemAccount = await litClient.getPkpViemAccount({
  pkpPublicKey: pkpInfo.pubkey,
  authContext: authContext,
  chainConfig: chainConfig, // viem chain configuration
});

// Now you can use pkpViemAccount like any viem account
console.log("PKP Address:", pkpViemAccount.address);`;

import { createLitClient } from "@lit-protocol/lit-client";
import { NoteCallout, WarningCallout } from "../../../../components/common";
import { pageStyles } from "../../../../styles/pageStyles";
import { keccak256, toBytes } from "viem";

type LitClient = Awaited<
  ReturnType<
    Awaited<ReturnType<typeof createLitClient>>["getPKPPermissionsManager"]
  >
>;

type AddPermittedActionType =
  | "addPermittedAction"
  | "addPermittedAddress"
  | "addPermittedAuthMethodScope";

type RemovePermittedActionType =
  | "removePermittedAction"
  | "removePermittedAddress"
  | "removePermittedAuthMethod";

export default function AddRemoveAuthMethods() {
  const { data: walletClient } = useWalletClient();
  const {
    getDependencyStatus,
    areDependenciesLoaded,
    setStatus,
    assertDependenciesLoaded,
    showError,
    authContext,
    setAuthContext,
  } = useAppContext();

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isGettingManager, setIsGettingManager] = useState(false);
  const [isViewingPermissions, setIsViewingPermissions] = useState(false);
  const [isAddingPermissions, setIsAddingPermissions] = useState(false);
  const [isRemovingPermissions, setIsRemovingPermissions] = useState(false);
  const [isCreatingAuthContext, setIsCreatingAuthContext] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  // Add permitted action type selection state
  const [selectedAddPermittedType, setSelectedAddPermittedType] =
    useState<AddPermittedActionType>("addPermittedAction");

  // Remove permitted action type selection state
  const [selectedRemovePermittedType, setSelectedRemovePermittedType] =
    useState<RemovePermittedActionType>("removePermittedAction");

  const [accountMethod, setAccountMethod] =
    useState<AccountMethod>("walletClient"); // Default to wallet client
  const [account, setAccount] = useState<any>(null);
  const [authData, setAuthData] = useState<any>(null);
  const [pkpInfo, setPkpInfo] = useState<any>(null);
  const [pkpPermissionsManager, setPkpPermissionsManager] = useState<LitClient>(
    null as unknown as LitClient
  );
  const [pkpPermissions, setPkpPermissions] = useState<unknown>(null);
  const [addPermissionsResult, setAddPermissionsResult] =
    useState<unknown>(null);
  const [removePermissionsResult, setRemovePermissionsResult] =
    useState<unknown>(null);
  const [pkpViemAccount, setPkpViemAccount] = useState<any>(null);

  // Success feedback state
  const [successActions, setSuccessActions] = useState<Set<string>>(new Set());

  // Longer-lived success messages for add/remove operations
  const [permissionActionSuccess, setPermissionActionSuccess] = useState<{
    type: "add" | "remove" | null;
    timestamp: number;
  }>({ type: null, timestamp: 0 });

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

  // Function to show permission action success with longer timeout
  const showPermissionActionSuccess = (type: "add" | "remove") => {
    const timestamp = Date.now();
    setPermissionActionSuccess({ type, timestamp });
    // Auto-clear after 10 seconds
    setTimeout(() => {
      setPermissionActionSuccess((prev) => {
        // Only clear if this is still the same message (no newer message)
        if (prev.timestamp === timestamp) {
          return { type: null, timestamp: 0 };
        }
        return prev;
      });
    }, 10000);
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

  // Get the appropriate code snippet for the selected add permitted type
  const getAddPermittedCodeSnippet = (): string => {
    switch (selectedAddPermittedType) {
      case "addPermittedAction":
        return ADD_PERMITTED_ACTION_CODE;
      case "addPermittedAddress":
        return ADD_PERMITTED_ADDRESS_CODE;
      case "addPermittedAuthMethodScope":
        return ADD_PERMITTED_AUTH_METHOD_SCOPE_CODE;
      default:
        return ADD_PERMITTED_ACTION_CODE;
    }
  };

  // Get the appropriate label for the selected add permitted type
  const getAddPermittedLabel = (): string => {
    switch (selectedAddPermittedType) {
      case "addPermittedAction":
        return "Lit Action";
      case "addPermittedAddress":
        return "Ethereum Address";
      case "addPermittedAuthMethodScope":
        return "Auth Method";
      default:
        return "Lit Action";
    }
  };

  // Get the appropriate code snippet for the selected remove permitted type
  const getRemovePermittedCodeSnippet = (): string => {
    switch (selectedRemovePermittedType) {
      case "removePermittedAction":
        return REMOVE_PERMITTED_ACTION_CODE;
      case "removePermittedAddress":
        return REMOVE_PERMITTED_ADDRESS_CODE;
      case "removePermittedAuthMethod":
        return REMOVE_PERMITTED_AUTH_METHOD_CODE;
      default:
        return REMOVE_PERMITTED_ACTION_CODE;
    }
  };

  // Get the appropriate label for the selected remove permitted type
  const getRemovePermittedLabel = (): string => {
    switch (selectedRemovePermittedType) {
      case "removePermittedAction":
        return "Lit Action";
      case "removePermittedAddress":
        return "Ethereum Address";
      case "removePermittedAuthMethod":
        return "Auth Method";
      default:
        return "Lit Action";
    }
  };

  const authenticate = async () => {
    try {
      setIsAuthenticating(true);
      setStatus("Authenticating with EOA account...");

      if (!account) {
        throw new Error("No account found. Create account first.");
      }

      let authData;
      if (accountMethod === "privateKey") {
        // Use ViemAccountAuthenticator for private key accounts
        const { ViemAccountAuthenticator } = await import("@lit-protocol/auth");
        authData = await ViemAccountAuthenticator.authenticate(account);
      } else {
        // Use WalletClientAuthenticator for connected wallet accounts
        const { WalletClientAuthenticator } = await import(
          "@lit-protocol/auth"
        );
        if (!walletClient) {
          throw new Error(
            "No wallet client available. Please connect your wallet."
          );
        }
        authData = await WalletClientAuthenticator.authenticate(walletClient);
      }

      setAuthData(authData);
      setStatus(
        `Successfully authenticated with EOA account using ${
          accountMethod === "privateKey" ? "private key" : "wallet client"
        }`
      );
      showSuccess("add-remove-auth-authenticate");
    } catch (error: any) {
      console.error("Error authenticating with EOA:", error);
      const errorMessage = formatErrorMessage(
        "Failed to authenticate with EOA: ",
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const createAuthContext = async () => {
    try {
      setIsCreatingAuthContext(true);
      setStatus("Creating auth context...");

      const { authManager, litClient } = assertDependenciesLoaded();

      if (!pkpInfo) {
        setStatus("Cannot sign: Missing PKP or Lit Client.");
        return;
      }

      const authContext = await authManager.createPkpAuthContext({
        authData: authData,
        pkpPublicKey: pkpInfo.pubkey,
        authConfig: {
          resources: [
            ["pkp-signing", "*"],
            ["lit-action-execution", "*"],
          ],
          capabilityAuthSigs: [],
          expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
          statement: "",
          domain: window.location.origin,
        },
        litClient: litClient,
      });

      setAuthContext(authContext);
      setStatus("Auth context created successfully");
      showSuccess("create-auth-context");
    } catch (error: any) {
      console.error("Error creating auth context:", error);
      const errorMessage = formatErrorMessage(
        "Failed to create auth context: ",
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsCreatingAuthContext(false);
    }
  };

  const createPkpViemAccount = async () => {
    try {
      setIsCreatingAccount(true);
      setStatus("Creating PKP Viem account...");

      const { litClient } = assertDependenciesLoaded();

      if (!authContext) {
        throw new Error(
          "No auth context available. Please complete steps 1-4 first."
        );
      }

      // Get PKP as a viem account
      const viemAccount = await litClient.getPkpViemAccount({
        pkpPublicKey: authContext.pkpPublicKey,
        authContext: authContext,
        chainConfig: litClient.getChainConfig().viemConfig,
      });

      setPkpViemAccount(viemAccount);
      setStatus(
        `PKP Viem account created successfully! Address: ${viemAccount.address}`
      );
      showSuccess("create-pkp-viem-account");
    } catch (error: any) {
      console.error("Error creating PKP Viem account:", error);
      const errorMessage = formatErrorMessage(
        "Failed to create PKP Viem account: ",
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const getPkpPermissionsManager = async () => {
    const { litClient } = assertDependenciesLoaded();

    if (!account || !pkpInfo) {
      throw new Error("No account or PKP found.");
    }

    setStatus("Getting PKP permissions manager...");
    setIsGettingManager(true);
    setPkpPermissionsManager(null as unknown as LitClient);

    try {
      const pkpPermissionsManager = await litClient.getPKPPermissionsManager({
        pkpIdentifier: {
          tokenId: pkpInfo.tokenId,
        },
        account: pkpViemAccount,
      });

      setPkpPermissionsManager(pkpPermissionsManager);
      setStatus("PKP permissions manager obtained successfully!");
      showSuccess("add-remove-auth-get-permissions-manager");
    } catch (error: any) {
      console.error("Error getting PKP permissions manager:", error);
      const errorMessage = formatErrorMessage(
        "Failed to get PKP permissions manager: ",
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsGettingManager(false);
    }
  };

  const viewPkpPermissions = async () => {
    const { litClient } = assertDependenciesLoaded();

    if (!pkpInfo) {
      throw new Error("No PKP found.");
    }

    setStatus("Viewing PKP permissions...");
    setIsViewingPermissions(true);
    setPkpPermissions(null);

    try {
      const res = await litClient.viewPKPPermissions({
        tokenId: pkpInfo.tokenId,
      });

      setPkpPermissions(res);
      console.log("✅ viewPKPPermissions:", res);
      setStatus("PKP permissions viewed successfully!");
      showSuccess("add-remove-auth-view-permissions");
    } catch (error: any) {
      console.error("Error viewing PKP permissions:", error);
      const errorMessage = formatErrorMessage(
        "Failed to view PKP permissions: ",
        error
      );
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

    setStatus(`Adding ${selectedAddPermittedType} to PKP...`);
    setIsAddingPermissions(true);
    setAddPermissionsResult(null);

    try {
      let addPermissionsTx;

      switch (selectedAddPermittedType) {
        case "addPermittedAction":
          addPermissionsTx = await pkpPermissionsManager.addPermittedAction({
            ipfsId: "QmWGkjZKcfsE9nabey7cXf8ViZ5Mf5CvLFTHbsYa79s3ER",
            scopes: ["sign-anything"],
          });
          break;
        case "addPermittedAddress":
          addPermissionsTx = await pkpPermissionsManager.addPermittedAddress({
            address: "0x1234567890123456789012345678901234567890",
            scopes: ["no-permissions"],
          });
          break;
        case "addPermittedAuthMethodScope":
          addPermissionsTx =
            await pkpPermissionsManager.addPermittedAuthMethodScope({
              tokenId: pkpInfo.tokenId,
              authMethodType: 1,
              authMethodId: "0x1234567890123456789012345678901234567890",
              scopeId: 1,
            });
          break;
        default:
          throw new Error("Invalid add permitted action type selected");
      }

      setAddPermissionsResult(addPermissionsTx);
      console.log(`✅ ${selectedAddPermittedType} result:`, addPermissionsTx);
      setStatus(`${selectedAddPermittedType} added to PKP successfully!`);
      showSuccess("add-remove-auth-add-permissions");
      showPermissionActionSuccess("add");
    } catch (error: any) {
      console.error(`Error adding ${selectedAddPermittedType} to PKP:`, error);
      const errorMessage = formatErrorMessage(
        `Failed to add ${selectedAddPermittedType} to PKP: `,
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsAddingPermissions(false);
    }
  };

  const removePermissionsFromPkp = async () => {
    if (!pkpPermissionsManager) {
      throw new Error("No PKP permissions manager found. Get manager first.");
    }

    setStatus(`Removing ${selectedRemovePermittedType} from PKP...`);
    setIsRemovingPermissions(true);
    setRemovePermissionsResult(null);

    try {
      let removePermissionsTx;

      switch (selectedRemovePermittedType) {
        case "removePermittedAction":
          removePermissionsTx =
            await pkpPermissionsManager.removePermittedAction({
              tokenId: pkpInfo.tokenId,
              ipfsId: "QmWGkjZKcfsE9nabey7cXf8ViZ5Mf5CvLFTHbsYa79s3ER",
            });
          break;
        case "removePermittedAddress":
          removePermissionsTx =
            await pkpPermissionsManager.removePermittedAddress({
              tokenId: pkpInfo.tokenId,
              address: "0x1234567890123456789012345678901234567890",
            });
          break;
        case "removePermittedAuthMethod":
          removePermissionsTx =
            await pkpPermissionsManager.removePermittedAuthMethod({
              tokenId: pkpInfo.tokenId,
              authMethodType: 1,
              authMethodId: "0x1234567890123456789012345678901234567890",
            });
          break;
        default:
          throw new Error("Invalid remove permitted action type selected");
      }

      setRemovePermissionsResult(removePermissionsTx);
      console.log(
        `✅ ${selectedRemovePermittedType} result:`,
        removePermissionsTx
      );
      setStatus(
        `${selectedRemovePermittedType} removed from PKP successfully!`
      );
      showSuccess("add-remove-auth-remove-permissions");
      showPermissionActionSuccess("remove");
    } catch (error: any) {
      console.error(
        `Error removing ${selectedRemovePermittedType} from PKP:`,
        error
      );
      const errorMessage = formatErrorMessage(
        `Failed to remove ${selectedRemovePermittedType} from PKP: `,
        error
      );
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsRemovingPermissions(false);
    }
  };

  // Component to render Authenticate button
  const AuthenticateButton = () => (
    <button
      onClick={authenticate}
      disabled={!areDependenciesLoaded() || isAuthenticating || !account}
      style={{
        padding: "10px 15px",
        backgroundColor:
          !areDependenciesLoaded() || isAuthenticating || !account
            ? "#cccccc"
            : "#007bff",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor:
          !areDependenciesLoaded() || isAuthenticating || !account
            ? "not-allowed"
            : "pointer",
        fontWeight: "500",
        marginBottom: "10px",
      }}
    >
      {isAuthenticating ? "Authenticating..." : "Authenticate with EOA"}
      {!account && " (Create account first)"}
    </button>
  );

  // Component to render Get PKP Permissions Manager button
  const GetManagerButton = () => (
    <button
      onClick={getPkpPermissionsManager}
      disabled={isGettingManager || !pkpInfo || !account}
      style={{
        padding: "10px 15px",
        backgroundColor:
          isGettingManager || !pkpInfo || !account ? "#cccccc" : "#007bff",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor:
          isGettingManager || !pkpInfo || !account ? "not-allowed" : "pointer",
        fontWeight: "500",
      }}
    >
      {isGettingManager ? "Getting Manager..." : "Get PKP Permissions Manager"}
      {(!pkpInfo || !account) && " (Mint PKP first)"}
    </button>
  );

  // Component to render View PKP Permissions button
  const ViewPermissionsButton = () => (
    <button
      onClick={viewPkpPermissions}
      disabled={isViewingPermissions || !pkpInfo}
      style={{
        padding: "10px 15px",
        backgroundColor:
          isViewingPermissions || !pkpInfo ? "#cccccc" : "#007bff",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: isViewingPermissions || !pkpInfo ? "not-allowed" : "pointer",
        fontWeight: "500",
      }}
    >
      {isViewingPermissions ? "Viewing..." : "View PKP Permissions"}
      {!pkpInfo && " (Mint PKP first)"}
    </button>
  );

  const chainInfo = SUPPORTED_CHAINS["yellowstone"];

  return (
    <div className="tab-content">
      <h2>Adding & Removing PKP Auth Methods</h2>

      <GreyBoarderWhiteBgContainer>
        <h2 style={{ marginTop: 0 }}>Intro</h2>
        <p style={pageStyles.p}>
          You can add additional Auth Methods to PKPs you control, by using the
          following methods:
        </p>
        <ul style={pageStyles.ul}>
          <li style={pageStyles.li}>
            <code>addPermittedAction</code> - Allows you to permit Lit Actions
            to sign data using your PKP. This is useful if you wanted to execute
            logic within a Lit node's TEE that could decide when and what is
            signed using your PKP.
          </li>
          <li style={pageStyles.li}>
            <code>addPermittedAddress</code> - Allows you to permit an address
            to sign data using your PKP. This is useful if you wanted to permit
            additional addresses that don't own the PKP, but still have
            permission to sign data using your PKP.
          </li>
          <li style={pageStyles.li}>
            <code>addPermittedAuthMethodScope</code> - Allows you to permit
            additional Auth Method scopes to an existing permitted Auth Method.
            This is useful if an Auth Method was permitted without a signing
            scope, or was permitted with a scope that doesn't allow signing
            arbitrary data.
          </li>
        </ul>
        <p style={pageStyles.p}>
          There are also the following methods that allow you to remove Auth
          Methods from PKPs you control:
        </p>
        <ul style={pageStyles.ul}>
          <li style={pageStyles.li}>
            <code>removePermittedAction</code> - Allows you to remove a Lit
            Action from being able to sign data using your PKP.
          </li>
          <li style={pageStyles.li}>
            <code>removePermittedAddress</code> - Allows you to remove an
            address from being able to sign data using your PKP.
          </li>
          <li style={pageStyles.li}>
            <code>removePermittedAuthMethod</code> - Allows you to remove an
            Auth Method from being able to sign data using your PKP.
          </li>
        </ul>
        <p style={pageStyles.p}>
          The following guide will walk you through the prerequisite steps
          required to add (Step 8) and remove (Step 9) Auth Methods from PKPs.
        </p>
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
                createAccount: "add-remove-auth-create-account",
                getWalletAccount: "add-remove-auth-get-wallet-account",
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
          isSuccess={
            successActions.has("add-remove-auth-create-account") ||
            successActions.has("add-remove-auth-get-wallet-account")
          }
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*              Authenticate with EOA               */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>
          Step 2: Authenticate with EOA{" "}
          {!account && (
            <span style={{ color: "orange" }}>(Create account first)</span>
          )}
        </h3>
        <p>
          Authenticate your EOA account to establish your identity for PKP
          operations. This creates the necessary authentication data for minting
          and managing PKPs.
        </p>

        <DisplayCode
          code={
            accountMethod === "privateKey"
              ? AUTHENTICATE_PRIVATE_KEY_CODE
              : AUTHENTICATE_WALLET_CLIENT_CODE
          }
          language="typescript"
          renderComponent={<AuthenticateButton />}
          resultData={authData}
          resultLabel="Authentication Data"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("add-remove-auth-authenticate")}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*               Get or Mint PKP                    */}
        {/* ================================================ */}
        {/* PKP Selection Component for existing PKPs */}
        <div style={{ marginTop: "20px" }}>
          <PkpSelectionComponent
            authData={authData}
            account={account}
            walletClient={walletClient}
            accountMethod={accountMethod}
            onPkpSelected={setPkpInfo}
            setStatus={setStatus}
            assertDependenciesLoaded={assertDependenciesLoaded}
            showError={showError}
            authMethodName="EOA Auth"
            disabled={!authData}
          />
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*               Create AuthContext                  */}
        {/* ================================================ */}
        <h3 style={{ marginTop: 0 }}>
          Step 4: Create AuthContext{" "}
          {!pkpInfo && (
            <span style={{ color: "orange" }}>(Select or mint PKP first)</span>
          )}
        </h3>
        <p>
          Use your newly minted PKP to create an AuthContext. This method will
          cache two things:
        </p>
        <ul>
          <li>
            session key pair - a temporary cryptographic key pair generated on
            the client side that acts as a temporary identity for the client
            application. It consists of:
            <ul>
              <li>A public key - shared with the Lit nodes</li>
              <li>A secret key (private key) - kept securely on the client</li>
            </ul>
          </li>
          <li>
            Delegation AuthSig aka. the inner auth sig - a cryptographic
            attestation from the Lit Protocol nodes that authorises your session
            key to act on behalf of your PKP.
          </li>
        </ul>

        <DisplayCode
          code={CREATE_AUTH_CONTEXT_CODE}
          language="typescript"
          renderComponent={
            <button
              onClick={createAuthContext}
              disabled={isCreatingAuthContext || !pkpInfo}
              style={{
                padding: "12px 20px",
                backgroundColor:
                  isCreatingAuthContext || !pkpInfo ? "#cccccc" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor:
                  isCreatingAuthContext || !pkpInfo ? "not-allowed" : "pointer",
                fontWeight: "500",
              }}
            >
              {isCreatingAuthContext
                ? "Creating..."
                : "Create AuthContext with EOA PKP"}
            </button>
          }
          resultData={authContext}
          resultLabel="AuthContext Information"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("create-auth-context")}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*            Create PKP Viem Account               */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>Step 5: Create PKP Viem Account</h3>
        <p>
          Convert your authenticated PKP into a Viem account object that can be
          used with the Viem library for signing and transactions.
        </p>

        <DisplayCode
          code={GET_PKP_VIEM_ACCOUNT_CODE}
          language="typescript"
          renderComponent={
            <button
              onClick={createPkpViemAccount}
              disabled={isCreatingAccount || !authContext}
              style={{
                padding: "10px 15px",
                backgroundColor:
                  isCreatingAccount || !authContext ? "#cccccc" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor:
                  isCreatingAccount || !authContext ? "not-allowed" : "pointer",
                fontWeight: "500",
              }}
            >
              {isCreatingAccount ? "Creating..." : "Create PKP Viem Account"}
              {!authContext && " (Complete steps 1-4 first)"}
            </button>
          }
          resultData={
            pkpViemAccount
              ? {
                  address: pkpViemAccount.address,
                  type: pkpViemAccount.type,
                  chain: chainInfo?.name,
                }
              : null
          }
          resultLabel="PKP Viem Account"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("create-pkp-viem-account")}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*            Get PKP Permissions Manager           */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>
          Step 6: Get PKP Permissions Manager{" "}
          {!pkpInfo && (
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
          isSuccess={successActions.has(
            "add-remove-auth-get-permissions-manager"
          )}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*              View PKP Permissions                */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>
          Step 7: View PKP Permissions{" "}
          {!pkpInfo && (
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
          isSuccess={successActions.has("add-remove-auth-view-permissions")}
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*              Add PKP Permissions                 */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>
          Step 8: Add Signing Permissions{" "}
          {!pkpPermissionsManager && (
            <span style={{ color: "orange" }}>(Get manager first)</span>
          )}
        </h3>
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}
          >
            Select Permission Type:
          </label>
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "15px",
              flexWrap: "wrap",
            }}
          >
            {[
              {
                type: "addPermittedAction" as const,
                label: "Lit Action",
              },
              {
                type: "addPermittedAddress" as const,
                label: "Ethereum Address",
              },
              {
                type: "addPermittedAuthMethodScope" as const,
                label: "Auth Method",
              },
            ].map(({ type, label }) => (
              <button
                key={type}
                onClick={() => setSelectedAddPermittedType(type)}
                disabled={!pkpPermissionsManager}
                style={{
                  padding: "10px 15px",
                  backgroundColor:
                    selectedAddPermittedType === type ? "#4285F4" : "#f0f0f0",
                  color: selectedAddPermittedType === type ? "white" : "#333",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  cursor: !pkpPermissionsManager ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <p>
          {selectedAddPermittedType === "addPermittedAction" &&
            "Permit a Lit Action to sign using your PKP."}
          {selectedAddPermittedType === "addPermittedAddress" &&
            "Permit an Ethereum address to sign using your PKP."}
          {selectedAddPermittedType === "addPermittedAuthMethodScope" &&
            "Permit an additional Auth Method scope to an existing permitted Auth Method."}
        </p>

        <p style={pageStyles.p}>The available Auth Method scopes are:</p>
        <ul style={pageStyles.ul}>
          <li style={pageStyles.li}>
            <code>no-permissions</code> (Scope ID: 0) - No signing permissions
            granted to the Auth Method.
          </li>
          <li style={pageStyles.li}>
            <code>sign-anything</code> (Scope ID: 1) - Permits the Auth Method
            to sign arbitrary data. This is the default scope for all Auth
            Methods.
          </li>
          <li style={pageStyles.li}>
            <code>personal-sign</code> (Scope ID: 2) - Permits the Auth Method
            to sign personal messages (EIP-191).
          </li>
        </ul>

        <WarningCallout
          title="This action requires your PKP to be funded with test tokens"
          message={
            <>
              <p>
                Add a permitted Lit Action to your PKP requires sending a
                transaction to the Yellowstone blockchain.
              </p>
              Your PKP needs to have Lit test tokens to pay for the gas. Visit
              the{" "}
              <a
                href={FAUCET_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#0066cc", textDecoration: "underline" }}
              >
                Chronicle Yellowstone Faucet
              </a>{" "}
              to get test tokens for your PKP {pkpViemAccount?.address}
            </>
          }
          variant="warning"
          style={{ marginBottom: "24px" }}
        />

        <DisplayCode
          code={getAddPermittedCodeSnippet()}
          language="typescript"
          renderComponent={
            <button
              onClick={addPermissionsToPkp}
              disabled={isAddingPermissions || !pkpPermissionsManager}
              style={{
                padding: "10px 15px",
                backgroundColor:
                  isAddingPermissions || !pkpPermissionsManager
                    ? "#cccccc"
                    : "#007bff",
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
                ? `Permitting ${getAddPermittedLabel()}...`
                : `Permit ${getAddPermittedLabel()}`}
              {!pkpPermissionsManager && " (Get manager first)"}
            </button>
          }
          resultData={addPermissionsResult}
          resultLabel="Add Permissions Result"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("add-remove-auth-add-permissions")}
        />

        {permissionActionSuccess.type === "add" && (
          <NoteCallout
            title="Permissions Added Successfully"
            message={
              <>
                <p>
                  Signing permissions have been successfully added to your PKP.
                  Re-execute Step 7 to view the updated permissions.
                </p>
              </>
            }
            variant="info"
            style={{ marginTop: "24px" }}
          />
        )}
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        {/* ================================================ */}
        {/*             Remove PKP Permissions               */}
        {/* ================================================ */}
        <h3 style={{ marginTop: "20px" }}>
          Step 9: Remove Permissions{" "}
          {!pkpPermissionsManager && (
            <span style={{ color: "orange" }}>(Get manager first)</span>
          )}
        </h3>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}
          >
            Select Permission Type to Remove:
          </label>
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "15px",
              flexWrap: "wrap",
            }}
          >
            {[
              {
                type: "removePermittedAction" as const,
                label: "Lit Action",
              },
              {
                type: "removePermittedAddress" as const,
                label: "Ethereum Address",
              },
              {
                type: "removePermittedAuthMethod" as const,
                label: "Auth Method",
              },
            ].map(({ type, label }) => (
              <button
                key={type}
                onClick={() => setSelectedRemovePermittedType(type)}
                disabled={!pkpPermissionsManager}
                style={{
                  padding: "10px 15px",
                  backgroundColor:
                    selectedRemovePermittedType === type
                      ? "#4285F4"
                      : "#f0f0f0",
                  color:
                    selectedRemovePermittedType === type ? "white" : "#333",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  cursor: !pkpPermissionsManager ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <p>
          {selectedRemovePermittedType === "removePermittedAction" &&
            "Remove a Lit Action's permission to sign using your PKP."}
          {selectedRemovePermittedType === "removePermittedAddress" &&
            "Remove an Ethereum address's permission to sign using your PKP."}
          {selectedRemovePermittedType === "removePermittedAuthMethod" &&
            "Remove an Auth Method's permission to sign using your PKP."}
        </p>

        <WarningCallout
          title="This action requires your PKP to be funded with test tokens"
          message={
            <>
              <p>
                Removing a permitted Lit Action from your PKP requires sending a
                transaction to the Yellowstone blockchain.
              </p>
              Your PKP needs to have Lit test tokens to pay for the gas. Visit
              the{" "}
              <a
                href={FAUCET_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#0066cc", textDecoration: "underline" }}
              >
                Chronicle Yellowstone Faucet
              </a>{" "}
              to get test tokens for your PKP {pkpViemAccount?.address}
            </>
          }
          variant="warning"
          style={{ marginBottom: "24px" }}
        />

        <DisplayCode
          code={getRemovePermittedCodeSnippet()}
          language="typescript"
          renderComponent={
            <button
              onClick={removePermissionsFromPkp}
              disabled={isRemovingPermissions || !pkpPermissionsManager}
              style={{
                padding: "10px 15px",
                backgroundColor:
                  isRemovingPermissions || !pkpPermissionsManager
                    ? "#cccccc"
                    : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor:
                  isRemovingPermissions || !pkpPermissionsManager
                    ? "not-allowed"
                    : "pointer",
                fontWeight: "500",
              }}
            >
              {isRemovingPermissions
                ? `Removing ${getRemovePermittedLabel()}...`
                : `Remove ${getRemovePermittedLabel()}`}
              {!pkpPermissionsManager && " (Get manager first)"}
            </button>
          }
          resultData={removePermissionsResult}
          resultLabel="Remove Permissions Result"
          useSideBySide={true}
          theme="dracula"
          isSuccess={successActions.has("add-remove-auth-remove-permissions")}
        />

        {permissionActionSuccess.type === "remove" && (
          <NoteCallout
            title="Permissions Removed Successfully"
            message={
              <>
                <p>
                  Signing permissions have been successfully removed from your
                  PKP. Re-execute Step 7 to view the updated permissions.
                </p>
              </>
            }
            variant="info"
            style={{ marginTop: "24px" }}
          />
        )}
      </GreyBoarderWhiteBgContainer>
    </div>
  );
}
