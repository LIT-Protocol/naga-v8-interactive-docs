/**
 * PKPInfoCard Component
 *
 * Displays PKP wallet information including balance and addresses
 */

import React, { useEffect, useRef, useState } from "react";
import { PkpInfo, BalanceInfo } from "../../types";
import { formatPublicKey, copyToClipboard } from "../../utils";
import copyIcon from "../../../../assets/copy.svg";
import googleIcon from "../../../../assets/google.png";
import discordIcon from "../../../../assets/discord.png";
import web3WalletIcon from "../../../../assets/web3-wallet.svg";
import passkeyIcon from "../../../../assets/passkey.svg";
import emailIcon from "../../../../assets/email.svg";
import phoneIcon from "../../../../assets/phone.svg";
import whatsappIcon from "../../../../assets/whatsapp.svg";
import tfaIcon from "../../../../assets/2fa.svg";
import { getAddress } from "viem";
import { ChainSelector } from "../layout";
import { Settings } from "lucide-react";
// Replaced hover behaviour with a click-triggered menu

const AUTH_ICON_BY_METHOD: Record<string, string> = {
  google: googleIcon,
  discord: discordIcon,
  eoa: web3WalletIcon,
  webauthn: passkeyIcon,
  "stytch-email": emailIcon,
  "stytch-sms": phoneIcon,
  "stytch-whatsapp": whatsappIcon,
  "stytch-totp": tfaIcon,
  custom: passkeyIcon,
};

interface PKPInfoCardProps {
  selectedPkp: PkpInfo | null;
  balance: BalanceInfo | null;
  isLoadingBalance: boolean;
  onShowPkpModal: () => void;
  userMethod: string;
  selectedChain: string;
  onChainChange: (chain: string) => void;
}

export const PKPInfoCard: React.FC<PKPInfoCardProps> = ({
  selectedPkp,
  balance,
  isLoadingBalance,
  onShowPkpModal,
  userMethod,
  selectedChain,
  onChainChange,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isChainMenuOpen, setIsChainMenuOpen] = useState<boolean>(false);
  const chainTriggerRef = useRef<HTMLButtonElement | null>(null);
  const chainMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        isChainMenuOpen &&
        chainMenuRef.current &&
        !chainMenuRef.current.contains(target) &&
        chainTriggerRef.current &&
        !chainTriggerRef.current.contains(target)
      ) {
        setIsChainMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsChainMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isChainMenuOpen]);

  const handleCopy = async (text: string, fieldName: string) => {
    await copyToClipboard(text, setCopiedField, fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!selectedPkp) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-200 rounded-md mb-4">
        <div className="text-yellow-800 text-sm">
          No PKP selected. Click below to select a PKP wallet.
        </div>
      </div>
    );
  }

  return (
    <div id="pkp-info-card">
      {/* Header row: avatar | title | actions (chain + settings) */}
      <div className="mb-3 grid grid-cols-[24px_1fr_auto] items-center gap-2">
        {/* Avatar (circular) */}
        <div className="h-6 w-6 rounded-full overflow-hidden bg-white border border-sky-200 flex items-center justify-center">
          <img
            src={AUTH_ICON_BY_METHOD[userMethod] || web3WalletIcon}
            alt={`${userMethod} logo`}
            className="h-4 w-4 object-contain"
          />
        </div>

        {/* Title only */}
        <div className="min-w-0">
          <div className="capitalized text-sm font-medium leading-none">
            PKP Wallet
          </div>
        </div>

        {/* Actions: Chain selector + Settings */}
        <div className="flex items-center gap-1 relative">
          <ChainSelector
            selectedChain={selectedChain}
            onChainChange={(slug) => {
              onChainChange(slug);
            }}
            iconTrigger
            triggerAriaLabel="Select chain"
          />

          <button
            type="button"
            onClick={onShowPkpModal}
            className="group h-6 w-6 inline-flex items-center justify-center rounded hover:bg-sky-100 text-sky-700 cursor-pointer"
            aria-label="Change PKP"
            title="Click to change PKP"
          >
            <Settings
              aria-hidden="true"
              className="h-4 w-4 opacity-80 transition-transform group-hover:opacity-100 group-hover:rotate-6"
            />
          </button>
        </div>
      </div>

      {/* Balance shown outside of the info container, directly under the auth label */}
      <div className="mb-4">
        {isLoadingBalance ? (
          <div className="text-gray-500 text-xs">Loading balance...</div>
        ) : (
          balance && (
            <div>
              <span className="font-mono text-green-700 text-lg">
                {balance.balance} {balance.symbol}
              </span>
              <span className="text-gray-500 ml-2 text-xs">
                (Chain ID: {balance.chainId})
              </span>
            </div>
          )
        )}
      </div>

      <div className="p-4 bg-white rounded-md border border-gray-300">
        <div className="text-black grid gap-2 text-xs">
          <div className="grid [grid-template-columns:90px_1fr] gap-2 items-center">
            <strong>Token ID:</strong>
            <span
              className={`group font-mono cursor-pointer px-1.5 py-0.5 rounded border transition block w-full min-w-0 flex items-center justify-between gap-1 ${
                copiedField === "tokenId"
                  ? "bg-green-100 border-green-200"
                  : "bg-gray-50 border-gray-200"
              }`}
              onClick={() => handleCopy(selectedPkp.tokenId || "", "tokenId")}
              title="Click to copy Token ID"
            >
              <span className="truncate">
                {copiedField === "tokenId"
                  ? `✅ ${selectedPkp.tokenId}`
                  : selectedPkp.tokenId || "N/A"}
              </span>
              <img
                src={copyIcon}
                alt="Copy"
                className="shrink-0 h-3 w-3 opacity-70 group-hover:opacity-100"
              />
            </span>
          </div>

          <div className="grid [grid-template-columns:90px_1fr] gap-2 items-center">
            <strong>ETH Address:</strong>
            <span
              className={`group font-mono cursor-pointer px-1.5 py-0.5 rounded border transition block w-full min-w-0 flex items-center justify-between gap-1 ${
                copiedField === "ethAddress"
                  ? "bg-green-100 border-green-200"
                  : "bg-gray-50 border-gray-200"
              }`}
              onClick={() =>
                handleCopy(
                  getAddress(selectedPkp.ethAddress) || "",
                  "ethAddress"
                )
              }
              title="Click to copy ETH Address"
            >
              <span className="truncate">
                {copiedField === "ethAddress"
                  ? `✅ ${getAddress(selectedPkp.ethAddress)}`
                  : getAddress(selectedPkp.ethAddress) || "N/A"}
              </span>
              <img
                src={copyIcon}
                alt="Copy"
                className="shrink-0 h-3 w-3 opacity-70 group-hover:opacity-100"
              />
            </span>
          </div>

          <div className="grid [grid-template-columns:90px_1fr] gap-2 items-center">
            <strong>Public Key:</strong>
            <span
              className={`group font-mono cursor-pointer px-1.5 py-0.5 rounded border transition block w-full min-w-0 flex items-center justify-between gap-1 ${
                copiedField === "publicKey"
                  ? "bg-green-100 border-green-200"
                  : "bg-gray-50 border-gray-200"
              }`}
              onClick={() =>
                handleCopy(
                  selectedPkp.publicKey || selectedPkp.pubkey || "",
                  "publicKey"
                )
              }
              title="Click to copy Public Key (full value)"
            >
              <span className="truncate">
                {copiedField === "publicKey"
                  ? `✅ ${selectedPkp.publicKey}`
                  : formatPublicKey(
                      selectedPkp.publicKey || selectedPkp.pubkey || ""
                    )}
              </span>
              <img
                src={copyIcon}
                alt="Copy"
                className="shrink-0 h-3 w-3 opacity-70 group-hover:opacity-100"
              />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
