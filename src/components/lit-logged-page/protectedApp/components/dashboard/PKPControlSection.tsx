/**
 * PKPControlSection Component
 *
 * Combines PKP info, chain selector, and balance display
 */

import React from "react";
import { PKPInfoCard } from "../pkp/PKPInfoCard";
import { PkpInfo, BalanceInfo } from "../../types";

interface PKPControlSectionProps {
  selectedPkp: PkpInfo | null;
  balance: BalanceInfo | null;
  isLoadingBalance: boolean;
  selectedChain: string;
  onShowPkpModal: () => void;
  onChainChange: (chain: string) => void;
  userMethod: string;
}

export const PKPControlSection: React.FC<PKPControlSectionProps> = ({
  selectedPkp,
  balance,
  isLoadingBalance,
  selectedChain,
  onShowPkpModal,
  onChainChange,
  userMethod,
}) => {
  return (
    <>
      <PKPInfoCard
        selectedPkp={selectedPkp}
        balance={balance}
        isLoadingBalance={isLoadingBalance}
        onShowPkpModal={onShowPkpModal}
        userMethod={userMethod}
        selectedChain={selectedChain}
        onChainChange={onChainChange}
      />
    </>
  );
};
