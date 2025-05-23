import { useState } from "react";
import { privateKeyToAccount } from "viem/accounts";
import { useWalletClient } from "wagmi";
import EoaAuthSection from "../components/common/EoaAuthSection";
import { DisplayCode } from "../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../components/layout/GreyboardWhiteBgContainer";
import { useAppContext } from "../router";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const OPERATION_NAME = "EOA Auth";

// Configuration constants
const DEFAULT_PRIVATE_KEY =
  "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const FAUCET_URL = "https://chronicle-yellowstone-faucet.getlit.dev/";

// Code snippets for each functionality
const CREATE_ACCOUNT_PRIVATE_KEY_CODE = `
import { privateKeyToAccount } from 'viem/accounts';

// Step 1: Convert your EOA private key to a viem account object
const myAccount = privateKeyToAccount(
  process.env.PRIVATE_KEY as \`0x\${string}\`
);`;

const CREATE_ACCOUNT_WALLET_CLIENT_CODE = `
import { useWalletClient } from 'wagmi';

// Use your connected wallet as the account
const { data: myAccount } = useWalletClient();`;

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

import { createLitClient } from "@lit-protocol/lit-client";
import { FEATURES } from "../_config";
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
  } = useAppContext();

  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [isGettingManager, setIsGettingManager] = useState(false);
  const [isViewingPermissions, setIsViewingPermissions] = useState(false);
  const [isAddingPermissions, setIsAddingPermissions] = useState(false);

  const [accountMethod, setAccountMethod] = useState<
    "privateKey" | "walletClient"
  >("privateKey");
  const [privateKey, setPrivateKey] = useState<string>(DEFAULT_PRIVATE_KEY);
  const [account, setAccount] = useState<any>(null);
  const [mintedPkpInfo, setMintedPkpInfo] = useState<any>(null);
  const [pkpPermissionsManager, setPkpPermissionsManager] = useState<LitClient>(
    null as unknown as LitClient
  );
  const [pkpPermissions, setPkpPermissions] = useState<any>(null);
  const [addPermissionsResult, setAddPermissionsResult] = useState<any>(null);

  const createAccountFromPrivateKey = async () => {
    try {
      setIsCreatingAccount(true);
      setStatus("Creating viem account from private key...");

      if (!privateKey.startsWith("0x") || privateKey.length !== 66) {
        throw new Error(
          "Invalid private key format. Must be a hex string starting with 0x and 66 characters long."
        );
      }

      const myAccount = privateKeyToAccount(privateKey as `0x${string}`);
      setAccount(myAccount);
      setStatus(`Successfully created account: ${myAccount.address}`);
    } catch (error: any) {
      console.error("Error creating account:", error);
      setStatus(
        `Failed to create account: ${error?.message || "Unknown error"}`
      );
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const createAccountFromWalletClient = async () => {
    try {
      setIsCreatingAccount(true);
      setStatus("Getting account from connected wallet...");

      if (!walletClient || !walletClient.account) {
        throw new Error(
          "No wallet connected. Please connect your wallet first."
        );
      }

      setAccount(walletClient);
      setStatus(
        `Successfully got account from wallet: ${walletClient.account.address}`
      );
    } catch (error: any) {
      console.error("Error getting wallet account:", error);
      setStatus(
        `Failed to get wallet account: ${error?.message || "Unknown error"}`
      );
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const createAccount = async () => {
    if (accountMethod === "privateKey") {
      return createAccountFromPrivateKey();
    } else {
      return createAccountFromWalletClient();
    }
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
    } catch (error: any) {
      console.error("Error minting PKP with EOA:", error);
      setStatus(
        `Failed to mint PKP with EOA: ${error?.message || "Unknown error"}`
      );
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
    } catch (error: any) {
      console.error("Error getting PKP permissions manager:", error);
      setStatus(
        `Failed to get PKP permissions manager: ${
          error?.message || "Unknown error"
        }`
      );
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
    } catch (error: any) {
      console.error("Error viewing PKP permissions:", error);
      setStatus(
        `Failed to view PKP permissions: ${error?.message || "Unknown error"}`
      );
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
    } catch (error: any) {
      console.error("Error adding permissions to PKP:", error);
      setStatus(
        `Failed to add permissions to PKP: ${error?.message || "Unknown error"}`
      );
    } finally {
      setIsAddingPermissions(false);
    }
  };

  // Component to render Account Method Selector and Create Account button
  const CreateAccountComponent = () => (
    <div style={{ marginBottom: "10px" }}>
      {/* Account Method Selector */}
      <div style={{ marginBottom: "15px" }}>
        <label
          style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}
        >
          Choose Account Method:
        </label>
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <button
            onClick={() => setAccountMethod("privateKey")}
            style={{
              padding: "8px 15px",
              backgroundColor:
                accountMethod === "privateKey" ? "#4285F4" : "#f0f0f0",
              color: accountMethod === "privateKey" ? "white" : "#333",
              border: "1px solid #ddd",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Private Key
          </button>
          <button
            onClick={() => setAccountMethod("walletClient")}
            style={{
              padding: "8px 15px",
              backgroundColor:
                accountMethod === "walletClient" ? "#4285F4" : "#f0f0f0",
              color: accountMethod === "walletClient" ? "white" : "#333",
              border: "1px solid #ddd",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Connected Wallet
          </button>
        </div>
      </div>

      {/* Private Key Input (only show when private key method is selected) */}
      {accountMethod === "privateKey" && (
        <div style={{ marginBottom: "10px" }}>
          <label
            htmlFor="privateKey"
            style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}
          >
            Private Key:
          </label>
          <input
            id="privateKey"
            type="password"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            placeholder="0x..."
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontFamily: "monospace",
              fontSize: "14px",
            }}
          />
          <small style={{ color: "#666", fontSize: "12px" }}>
            Default test private key is provided. Replace with your own for
            production use.
          </small>
        </div>
      )}

      {/* Wallet Client Info (only show when wallet client method is selected) */}
      {accountMethod === "walletClient" && (
        <div
          style={{
            marginBottom: "10px",
            padding: "10px",
            backgroundColor: "#f8f9fa",
            borderRadius: "4px",
            border: "1px solid #e9ecef",
          }}
        >
          <p style={{ margin: "0 0 8px 0", fontSize: "14px" }}>
            <strong>Using Connected Wallet:</strong> This will use your
            currently connected wallet account (e.g., MetaMask).
          </p>
          <p style={{ margin: "0", fontSize: "12px", color: "#666" }}>
            Make sure your wallet is connected and you have test tokens. Need
            tokens? Visit the{" "}
            <a
              href={FAUCET_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#4285F4", textDecoration: "underline" }}
            >
              Chronicle Yellowstone Faucet
            </a>
            <div style={{ marginTop: "10px" }}>
              <ConnectButton showBalance={FEATURES.showWalletBalance} />
            </div>
          </p>
        </div>
      )}
      <button
        onClick={createAccount}
        disabled={isCreatingAccount}
        style={{
          padding: "10px 15px",
          backgroundColor: isCreatingAccount ? "#cccccc" : "#4285F4",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: isCreatingAccount ? "not-allowed" : "pointer",
          fontWeight: "500",
        }}
      >
        {isCreatingAccount
          ? "Creating..."
          : accountMethod === "privateKey"
          ? "Create Account from Private Key"
          : "Use Connected Wallet Account"}
      </button>
    </div>
  );

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
              {privateKey ? (
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
          renderComponent={<CreateAccountComponent />}
          resultData={
            account ? { address: account.address, type: account.type } : null
          }
          resultLabel="Account Information"
          useSideBySide={true}
          theme="dracula"
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
        />
      </GreyBoarderWhiteBgContainer>

      {/* Add EOA Auth Section */}
      <EoaAuthSection tabName={OPERATION_NAME} />
    </div>
  );
}
