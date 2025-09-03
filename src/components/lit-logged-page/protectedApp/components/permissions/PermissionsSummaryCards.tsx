/**
 * PermissionsSummaryCards Component
 * 
 * Google-style dashboard summary cards for permissions overview
 */

import React from 'react';
import { usePKPPermissions } from '../../contexts/PKPPermissionsContext';

export const PermissionsSummaryCards: React.FC = () => {
  const { permissionsContext } = usePKPPermissions();

  if (!permissionsContext) {
    return null;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        marginBottom: "30px",
      }}
    >
      {/* Actions Summary Card */}
      <div
        style={{
          padding: "20px",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "36px",
            fontWeight: "bold",
            color: "#3b82f6",
            marginBottom: "8px",
          }}
        >
          {permissionsContext?.actions?.length || 0}
        </div>
        <div
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#374151",
            marginBottom: "4px",
          }}
        >
          ⚡ Permitted Actions
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "#6b7280",
          }}
        >
          Lit Actions this PKP can execute
        </div>
      </div>

      {/* Addresses Summary Card */}
      <div
        style={{
          padding: "20px",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "36px",
            fontWeight: "bold",
            color: "#059669",
            marginBottom: "8px",
          }}
        >
          {permissionsContext?.addresses?.length || 0}
        </div>
        <div
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#374151",
            marginBottom: "4px",
          }}
        >
          🏠 Permitted Addresses
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "#6b7280",
          }}
        >
          Addresses that can use this PKP
        </div>
      </div>

      {/* Auth Methods Summary Card */}
      <div
        style={{
          padding: "20px",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "36px",
            fontWeight: "bold",
            color: "#7c3aed",
            marginBottom: "8px",
          }}
        >
          {permissionsContext?.authMethods?.length || 0}
        </div>
        <div
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#374151",
            marginBottom: "4px",
          }}
        >
          🔑 Auth Methods
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "#6b7280",
          }}
        >
          Authentication methods linked
        </div>
      </div>
    </div>
  );
}; 