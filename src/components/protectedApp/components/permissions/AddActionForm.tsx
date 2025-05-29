/**
 * AddActionForm Component
 * 
 * Form for adding permitted actions to a PKP
 */

import React, { useState } from 'react';
import { ScopeCheckboxes } from '../ui/ScopeCheckboxes';
import { AVAILABLE_SCOPES } from '../../types';
import { usePKPPermissions } from '../../contexts/PKPPermissionsContext';

interface AddActionFormProps {
  disabled?: boolean;
}

export const AddActionForm: React.FC<AddActionFormProps> = ({ disabled = false }) => {
  const { addPermittedAction } = usePKPPermissions();
  const [newActionIpfsId, setNewActionIpfsId] = useState(
    "QmSQDKRWEXZ9CGoucSTR11Mv6fhGqaytZ1MqrfHdkuS1Vg"
  );
  const [newActionSelectedScopes, setNewActionSelectedScopes] = useState<string[]>(["sign-anything"]);
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async () => {
    if (!newActionIpfsId.trim() || newActionSelectedScopes.length === 0) {
      return;
    }

    setIsAdding(true);
    try {
      await addPermittedAction(newActionIpfsId, newActionSelectedScopes);
      
      // Clear form on success
      setNewActionIpfsId("");
      setNewActionSelectedScopes([]);
    } catch (error) {
      console.error("Failed to add permitted action:", error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
      }}
    >
      <h3 style={{ margin: "0 0 16px 0", color: "#1f2937" }}>
        ➕ Add Action Permission
      </h3>
      <p
        style={{
          margin: "0 0 16px 0",
          color: "#6b7280",
          fontSize: "14px",
        }}
      >
        Allow your PKP to execute a specific Lit Action.
      </p>

      <input
        type="text"
        value={newActionIpfsId}
        onChange={(e) => setNewActionIpfsId(e.target.value)}
        placeholder="IPFS ID (e.g., QmSQDKRWEXZ9CGoucSTR11Mv6fhGqaytZ1MqrfHdkuS1Vg)"
        disabled={disabled || isAdding}
        style={{
          width: "100%",
          padding: "12px",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          fontSize: "13px",
          marginBottom: "16px",
          fontFamily: "monospace",
          backgroundColor: disabled ? "#f3f4f6" : "#ffffff",
          color: disabled ? "#6b7280" : "#000000",
        }}
      />

      <ScopeCheckboxes
        availableScopes={AVAILABLE_SCOPES}
        selectedScopes={newActionSelectedScopes}
        onScopeChange={setNewActionSelectedScopes}
        disabled={disabled || isAdding}
      />

      <button
        onClick={handleSubmit}
        disabled={
          disabled ||
          isAdding ||
          !newActionIpfsId.trim() ||
          newActionSelectedScopes.length === 0
        }
        style={{
          width: "100%",
          padding: "12px",
          backgroundColor:
            disabled ||
            isAdding ||
            !newActionIpfsId.trim() ||
            newActionSelectedScopes.length === 0
              ? "#9ca3af"
              : "#059669",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "500",
          cursor:
            disabled ||
            isAdding ||
            !newActionIpfsId.trim() ||
            newActionSelectedScopes.length === 0
              ? "not-allowed"
              : "pointer",
        }}
      >
        {isAdding ? "Adding..." : "Add Action Permission"}
      </button>
    </div>
  );
}; 