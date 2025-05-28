/**
 * DashboardHeader Component
 * 
 * Combines PKP info, chain selector, and balance display
 */

import React from 'react';
import { PKPInfoCard } from '../pkp/PKPInfoCard';
import { ChainSelector } from '../layout/ChainSelector';
import { PkpInfo, BalanceInfo } from '../../types';

interface DashboardHeaderProps {
  selectedPkp: PkpInfo | null;
  balance: BalanceInfo | null;
  isLoadingBalance: boolean;
  selectedChain: string;
  onShowPkpModal: () => void;
  onChainChange: (chain: string) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  selectedPkp,
  balance,
  isLoadingBalance,
  selectedChain,
  onShowPkpModal,
  onChainChange,
}) => {
  return (
    <>
      {/* Chain Selector */}
      <ChainSelector 
        selectedChain={selectedChain}
        onChainChange={onChainChange}
      />
      
      {/* PKP Information Card */}
      <PKPInfoCard
        selectedPkp={selectedPkp}
        balance={balance}
        isLoadingBalance={isLoadingBalance}
        selectedChain={selectedChain}
        onShowPkpModal={onShowPkpModal}
      />
    </>
  );
}; 