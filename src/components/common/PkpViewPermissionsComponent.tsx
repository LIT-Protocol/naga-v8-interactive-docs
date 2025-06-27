/**
 * PkpViewMethodComponent.tsx
 *
 * A reusable component that allows users to:
 * 1. Choose which PKP identifier type to use (tokenId, ethAddress, publicKey)
 * 2. Call viewPKPPermissions with the selected identifier
 * 3. Display the retrieved permissions information
 *
 * Features:
 * - Three identifier type options (ERC721 Token ID, PKP Ethereum Address, PKP Public Key)
 * - Interactive code display with real-time execution
 * - Loading states and error handling
 * - Responsive UI with clear selection indicators
 */

import { useState } from "react";
import { DisplayCode } from "../DisplayCode";

// Code snippets for different identifier types
const VIEW_PKP_PERMISSIONS_TOKEN_ID_CODE = `
const permissions = await litClient.viewPKPPermissions({
  tokenId: pkpInfo.tokenId,
});`;

const VIEW_PKP_PERMISSIONS_ETH_ADDRESS_CODE = `
const permissions = await litClient.viewPKPPermissions({
  address: pkpInfo.ethAddress,
});`;

const VIEW_PKP_PERMISSIONS_PUBLIC_KEY_CODE = `
const permissions = await litClient.viewPKPPermissions({
  pubkey: pkpInfo.pubkey,
});`;

interface PKPInfo {
  tokenId: string;
  ethAddress: string;
  pubkey: string;
}

type PkpIdentifierType = "tokenId" | "ethAddress" | "pubkey";

interface PkpViewMethodComponentProps {
  pkpInfo: PKPInfo | null;
  account: any;
  walletClient: any;
  setStatus: (message: string) => void;
  assertDependenciesLoaded: () => { litClient: unknown; authManager: unknown };
  showError?: (errorMessage: string) => void;
  disabled?: boolean;
}

export default function PkpViewPermissionsComponent({
  pkpInfo,
  setStatus,
  assertDependenciesLoaded,
  showError,
  disabled = false,
}: PkpViewMethodComponentProps) {
  // Identifier selection state
  const [selectedIdentifierType, setSelectedIdentifierType] =
    useState<PkpIdentifierType>("tokenId");

  // View permissions state
  const [isViewingPermissions, setIsViewingPermissions] = useState(false);
  const [permissions, setPermissions] = useState<unknown>(null);

  // Success feedback state
  const [successActions, setSuccessActions] = useState<Set<string>>(new Set());

  // Function to show success feedback
  const showSuccess = (actionId: string) => {
    setSuccessActions((prev) => new Set([...prev, actionId]));
    setTimeout(() => {
      setSuccessActions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(actionId);
        return newSet;
      });
    }, 3000);
  };

  // Utility function to format error messages
  const formatErrorMessage = (prefix: string, error: unknown): string => {
    let errorMessage = prefix;
    if (error && typeof error === "object" && "message" in error) {
      errorMessage += (error as { message: string }).message;
    } else if (typeof error === "object") {
      errorMessage += JSON.stringify(error, null, 2);
    } else {
      errorMessage += String(error);
    }
    return errorMessage;
  };

  // Get the identifier value for the selected PKP and identifier type
  const getIdentifierValue = (): string => {
    if (!pkpInfo) return "";

    switch (selectedIdentifierType) {
      case "tokenId":
        return pkpInfo.tokenId;
      case "ethAddress":
        return pkpInfo.ethAddress;
      case "pubkey":
        return pkpInfo.pubkey;
      default:
        return pkpInfo.tokenId;
    }
  };

  // Get the appropriate code snippet for the selected identifier type
  const getCodeSnippet = (): string => {
    switch (selectedIdentifierType) {
      case "tokenId":
        return VIEW_PKP_PERMISSIONS_TOKEN_ID_CODE;
      case "ethAddress":
        return VIEW_PKP_PERMISSIONS_ETH_ADDRESS_CODE;
      case "pubkey":
        return VIEW_PKP_PERMISSIONS_PUBLIC_KEY_CODE;
      default:
        return VIEW_PKP_PERMISSIONS_TOKEN_ID_CODE;
    }
  };

  // View PKP permissions
  const viewPkpPermissions = async () => {
    if (!pkpInfo) {
      setStatus("No PKP selected. Please select or mint a PKP first.");
      return;
    }

    try {
      setIsViewingPermissions(true);
      setStatus(`Viewing PKP permissions using ${selectedIdentifierType}...`);

      const { litClient } = assertDependenciesLoaded();

      let params: {
        tokenId?: string;
        address?: string;
        pubkey?: string;
      };
      if (selectedIdentifierType === "tokenId") {
        params = {
          tokenId: pkpInfo.tokenId,
        };
      } else if (selectedIdentifierType === "ethAddress") {
        params = {
          address: pkpInfo.ethAddress,
        };
      } else if (selectedIdentifierType === "pubkey") {
        params = {
          pubkey: pkpInfo.pubkey,
        };
      } else {
        throw new Error("Invalid identifier type selected");
      }

      const result = await (litClient as any).viewPKPPermissions(params);

      setPermissions(result);
      setStatus(
        `PKP permissions viewed successfully using ${selectedIdentifierType}!`
      );
      showSuccess("view-pkp-permissions");
    } catch (error: unknown) {
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

  return (
    <div>
      <h3 style={{ marginTop: "20px" }}>
        Step 4: Call <code>viewPKPPermissions</code>
      </h3>
      <p>
        Choose which PKP identifier type you'd like to use to call the{" "}
        <code>viewPKPPermissions</code> method:
      </p>

      <div style={{ marginBottom: "20px" }}>
        <label
          style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}
        >
          Select PKP Identifier Type:
        </label>
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          {[
            { type: "tokenId" as const, label: "Token ID" },
            {
              type: "ethAddress" as const,
              label: "Ethereum Address",
            },
            { type: "pubkey" as const, label: "Public Key" },
          ].map(({ type, label }) => (
            <button
              key={type}
              onClick={() => setSelectedIdentifierType(type)}
              disabled={disabled || !pkpInfo || type === "ethAddress"}
              style={{
                padding: "10px 15px",
                backgroundColor:
                  selectedIdentifierType === type ? "#4285F4" : "#f0f0f0",
                color: selectedIdentifierType === type ? "white" : "#333",
                border: "1px solid #ddd",
                borderRadius: "4px",
                cursor:
                  disabled || !pkpInfo || type === "ethAddress"
                    ? "not-allowed"
                    : "pointer",
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

      {/* View PKP Permissions */}
      <p>
        Use the selected identifier type to query the permissions for your PKP.
      </p>

      <DisplayCode
        code={getCodeSnippet()}
        language="typescript"
        renderComponent={
          <div>
            <button
              onClick={viewPkpPermissions}
              disabled={isViewingPermissions || !pkpInfo || disabled}
              style={{
                padding: "12px 20px",
                backgroundColor:
                  isViewingPermissions || !pkpInfo || disabled
                    ? "#cccccc"
                    : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor:
                  isViewingPermissions || !pkpInfo || disabled
                    ? "not-allowed"
                    : "pointer",
                fontWeight: "500",
                marginBottom: "10px",
              }}
            >
              {isViewingPermissions
                ? "Viewing..."
                : `View PKP Permissions Using: ${selectedIdentifierType}`}
              {!pkpInfo && " (Select PKP first)"}
            </button>

            {pkpInfo && (
              <div
                style={{
                  padding: "10px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "4px",
                  fontSize: "12px",
                  color: "#666",
                  marginTop: "10px",
                }}
              >
                <strong>PKP {selectedIdentifierType}:</strong>{" "}
                {selectedIdentifierType === "tokenId"
                  ? `${pkpInfo.tokenId.slice(0, 20)}...`
                  : selectedIdentifierType === "ethAddress"
                  ? pkpInfo.ethAddress
                  : selectedIdentifierType === "pubkey"
                  ? `${pkpInfo.pubkey.slice(0, 30)}...`
                  : getIdentifierValue()}
              </div>
            )}
          </div>
        }
        resultData={permissions}
        resultLabel="PKP Permissions"
        useSideBySide={true}
        theme="dracula"
        isSuccess={successActions.has("view-pkp-permissions")}
      />
    </div>
  );
}
