/**
 * DashboardLayout Component
 *
 * Provides consistent layout structure for the protected app
 */

import React from "react";
import { PkpInfo, BalanceInfo } from "../../types";
import { PKPControlSection } from "../dashboard/PKPControlSection";


interface DashboardLayoutProps {
  selectedPkp: PkpInfo | null;
  balance: BalanceInfo | null;
  isLoadingBalance: boolean;
  selectedChain: string;
  onShowPkpModal: () => void;
  onChainChange: (chain: string) => void;
  userMethod: string;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  selectedPkp,
  balance,
  isLoadingBalance,
  selectedChain,
  onShowPkpModal,
  onChainChange,
  userMethod,
  children,
}) => {
  return (
    <div className="bg-[#FAFAFA] text-black z-0">
      <div className="h-8"></div>
      <div className="max-w-8xl m-auto px-12">
        <aside
          className="z-20 lg:block fixed bottom-0 right-auto w-[18rem] h-full pt-8"
          style={{ top: "calc(7rem + 38px)" }}
        >
          <PKPControlSection
            selectedPkp={selectedPkp}
            balance={balance}
            isLoadingBalance={isLoadingBalance}
            selectedChain={selectedChain}
            onShowPkpModal={onShowPkpModal}
            onChainChange={onChainChange}
            userMethod={userMethod}
          />
        </aside>
        <main className="relative grow box-border flex-col w-full mx-auto px-1 lg:pl-[23.7rem] lg:-ml-12 ">
            {children}
        </main>
      </div>
    </div>
  );
};
