/**
 * TransactionToastContainer Component
 * 
 * Displays transaction notifications with links to block explorer
 */

import React from 'react';
import { TransactionToast } from '../../types';
import { formatTxHash } from '../../utils';

interface TransactionToastContainerProps {
  toasts: TransactionToast[];
  onRemoveToast: (id: string) => void;
}

export const TransactionToastContainer: React.FC<TransactionToastContainerProps> = ({ 
  toasts, 
  onRemoveToast 
}) => (
  <div
    style={{
      position: "fixed",
      top: "20px",
      right: "20px",
      zIndex: 10000,
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      maxWidth: "400px",
    }}
  >
    {toasts.map((toast) => (
      <div
        key={toast.id}
        style={{
          background: toast.type === 'success' ? "#10b981" : "#ef4444",
          color: "white",
          padding: "12px 16px",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "500",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          animation: "slideIn 0.3s ease-out",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: "4px" }}>
            {toast.type === 'success' ? '✅' : '❌'} {toast.message}
          </div>
          <div style={{ fontSize: "11px", opacity: 0.9, fontFamily: "monospace" }}>
            <a
              href={`https://yellowstone-explorer.litprotocol.com/tx/${toast.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "white",
                textDecoration: "underline",
                opacity: 0.9,
              }}
            >
              Tx: {formatTxHash(toast.txHash)}
            </a>
          </div>
        </div>
        <button
          onClick={() => onRemoveToast(toast.id)}
          style={{
            background: "none",
            border: "none",
            color: "white",
            fontSize: "16px",
            cursor: "pointer",
            padding: "4px",
            borderRadius: "4px",
            opacity: 0.8,
          }}
        >
          ✕
        </button>
      </div>
    ))}
  </div>
); 