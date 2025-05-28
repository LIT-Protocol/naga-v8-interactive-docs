/**
 * DashboardLayout Component
 * 
 * Provides consistent layout structure for the protected app
 */

import React from 'react';
import { PkpInfo, BalanceInfo } from '../../types';

interface DashboardLayoutProps {
  selectedPkp: PkpInfo | null;
  balance: BalanceInfo | null;
  isLoadingBalance: boolean;
  selectedChain: string;
  onShowPkpModal: () => void;
  onChainChange: (chain: string) => void;
  onLogout: () => void;
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
  onLogout,
  userMethod,
  children,
}) => {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      {/* Welcome Banner */}
      <div
        style={{
          marginBottom: "24px",
          padding: "20px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "12px",
          color: "white",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
        <h1
          style={{
            margin: "0 0 8px 0",
            fontSize: "24px",
            fontWeight: "700",
            color: "white",
          }}
        >
          You've successfully authenticated via{" "}
          <strong
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              fontSize: "24px",
              borderBottom: "2px solid white",
            }}
          >
            {userMethod}
          </strong>{" "}
          and selected your PKP wallet!
        </h1>
      </div>

      {/* Header with PKP info and controls */}
      <div
        style={{
          marginBottom: "30px",
          padding: "24px",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "20px",
          }}
        >
          <div>
            <h2
              style={{
                margin: "0 0 8px 0",
                color: "#111827",
                fontSize: "20px",
                fontWeight: "600",
              }}
            >
              🔐 Your PKP Wallet Dashboard
            </h2>
            <p
              style={{
                margin: 0,
                color: "#6b7280",
                fontSize: "14px",
                lineHeight: "1.4",
              }}
            >
              Authenticated via{" "}
              <span
                style={{
                  backgroundColor: "#e0f2fe",
                  color: "#0284c7",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "500",
                }}
              >
                {userMethod}
              </span>
            </p>
          </div>
          <button
            onClick={onLogout}
            style={{
              padding: "8px 16px",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#dc2626";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ef4444";
            }}
          >
            🚪 Logout
          </button>
        </div>

        {/* Chain and PKP Info Section */}
        {children}
      </div>
    </div>
  );
}; 