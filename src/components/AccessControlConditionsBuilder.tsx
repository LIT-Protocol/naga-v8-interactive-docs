/**
 * AccessControlConditionsBuilder.tsx
 *
 * Interactive component for building Lit Protocol access control conditions using the official createAccBuilder.
 * Provides a user-friendly interface for creating complex conditions with real-time preview.
 */

import {
  createAccBuilder,
  humanizeUnifiedAccessControlConditions,
} from "@lit-protocol/access-control-conditions";
import { useEffect, useState } from "react";

interface AccessControlConditionsBuilderProps {
  recipientAddress?: string;
  onConditionsChange: (conditions: any[]) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export default function AccessControlConditionsBuilder({
  recipientAddress,
  onConditionsChange,
  onValidationChange,
}: AccessControlConditionsBuilderProps) {
  const [conditions, setConditions] = useState<any[]>([]);
  const [humanizedConditions, setHumanizedConditions] = useState<string>("");
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);

  // Builder state for manual condition creation
  const [builderCode, setBuilderCode] = useState<string>("");

  // Predefined templates using createAccBuilder
  const templates = {
    "": {
      name: "Select a template...",
      description: "",
      code: "",
    },
    simple_wallet: {
      name: "Simple Wallet Ownership",
      description: "Only the specified wallet address can decrypt",
      code: `const builder = createAccBuilder();
const conditions = builder
  .requireWalletOwnership('${recipientAddress || "0x742d35Cc6Af4..."}')
  .on('ethereum')
  .build();`,
    },
    eth_balance: {
      name: "ETH Balance Gate",
      description: "Require minimum ETH balance to decrypt",
      code: `const builder = createAccBuilder();
const conditions = builder
  .requireEthBalance('0.001', '>=')
  .on('ethereum')
  .build();`,
    },
    token_holder: {
      name: "Token Holder Gate",
      description: "Require minimum token balance to decrypt",
      code: `const builder = createAccBuilder();
const conditions = builder
  .requireTokenBalance('0xA0b86a33E6441aBFd5b17eDf2b6Fcb8a6A4Fe4d6', '1000')
  .on('ethereum')
  .build();`,
    },
    nft_owner: {
      name: "NFT Ownership Gate",
      description: "Require NFT ownership to decrypt",
      code: `const builder = createAccBuilder();
const conditions = builder
  .requireNftOwnership('0x60E4d786628Fea6478F785A6d7e704777c86a7c6')
  .on('ethereum')
  .build();`,
    },
    multi_chain: {
      name: "Multi-Chain Requirements",
      description: "Require conditions across multiple chains",
      code: `const builder = createAccBuilder();
const conditions = builder
  .requireEthBalance('0.001').on('ethereum')
  .and()
  .requireTokenBalance('0x...', '100').on('polygon')
  .build();`,
    },
    lit_action: {
      name: "Lit Action Gate",
      description: "Custom logic using Lit Actions",
      code: `const builder = createAccBuilder();
const conditions = builder
  .requireLitAction(
    'Qme2pfQUV9cuxWmzHrhMKuvTVvKVx87iLiz4AnQnEwS3B6',
    'go',
    ['123456'], // parameters
    'true' // expected value
  )
  .build();`,
    },
    weather_gated: {
      name: "Weather-Gated Content",
      description: "Decrypt only when temperature is above threshold",
      code: `const builder = createAccBuilder();
const conditions = builder
  .requireLitAction(
    'QmWeatherCheckCID', // Your weather checking Lit Action
    'checkTemperature',
    ['40'], // temperature threshold
    'true'
  )
  .build();`,
    },
    cosmos_funder: {
      name: "KYVE Funder Gate",
      description: "Require being a KYVE protocol funder",
      code: `const builder = createAccBuilder();
const conditions = builder
  .requireCosmosCustom(
    '/kyve/registry/v1beta1/funders_list/0',
    '$.funders.*.account',
    ':userAddress',
    'contains'
  )
  .on('kyve')
  .build();`,
    },
  };

  // Execute builder code and update conditions
  const executeBuilderCode = async (code: string) => {
    try {
      // Evaluate the code with real createAccBuilder
      const func = new Function(
        "createAccBuilder",
        `
        ${code}
        return conditions;
      `
      );

      const result = func(createAccBuilder);

      if (Array.isArray(result)) {
        setConditions(result);

        // Generate humanized description using real function
        try {
          const humanised = await humanizeUnifiedAccessControlConditions({
            unifiedAccessControlConditions: result,
          });
          setHumanizedConditions(humanised);
        } catch (error) {
          setHumanizedConditions(
            "Unable to generate human-readable description"
          );
        }
      }
    } catch (error) {
      console.error("Error executing builder code:", error);
      setConditions([]);
      setHumanizedConditions("Invalid condition code");
    }
  };

  // Update parent when conditions change
  useEffect(() => {
    onConditionsChange(conditions);
    onValidationChange?.(conditions.length > 0);
  }, [conditions]);

  // Load template
  const loadTemplate = (templateKey: string) => {
    if (templateKey && templates[templateKey as keyof typeof templates]) {
      const template = templates[templateKey as keyof typeof templates];
      setBuilderCode(template.code);
      setSelectedTemplate(templateKey);
      executeBuilderCode(template.code);
    } else {
      setBuilderCode("");
      setSelectedTemplate("");
      setConditions([]);
      setHumanizedConditions("");
    }
  };

  // Handle copy to clipboard
  const handleCopyConditions = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(conditions, null, 2));
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy conditions:", err);
    }
  };

  return (
    <div style={{ margin: "20px 0" }}>
      {/* Alice's Section - Creating Access Control Conditions */}
      <div
        style={{
          border: "2px solid #28a745",
          borderRadius: "8px",
          marginBottom: "20px",
          backgroundColor: "#f8fff9",
        }}
      >
        <div
          style={{
            backgroundColor: "#28a745",
            color: "white",
            padding: "12px 20px",
            borderRadius: "6px 6px 0 0",
            marginBottom: "15px",
          }}
        >
          <h4 style={{ margin: "0", fontSize: "16px" }}>
            👩‍💻 Alice: Creating Access Control Conditions
          </h4>
          <p style={{ margin: "5px 0 0 0", fontSize: "12px", opacity: 0.9 }}>
            Alice defines who can decrypt the content by setting access control
            conditions
          </p>
        </div>

        <div style={{ padding: "0 20px 20px 20px" }}>
          {/* Template Selection Dropdown */}
          <div style={{ marginBottom: "20px" }}>
            <label
              htmlFor="templateSelect"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "500",
                color: "#495057",
              }}
            >
              📚 Quick Template:
            </label>
            <select
              id="templateSelect"
              value={selectedTemplate}
              onChange={(e) => loadTemplate(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                fontSize: "14px",
                backgroundColor: "white",
                color: "#495057",
              }}
            >
              {Object.entries(templates).map(([key, template]) => (
                <option key={key} value={key}>
                  {template.name}
                </option>
              ))}
            </select>
            {selectedTemplate &&
              templates[selectedTemplate as keyof typeof templates]
                ?.description && (
                <small
                  style={{
                    color: "#6c757d",
                    fontSize: "12px",
                    marginTop: "5px",
                    display: "block",
                  }}
                >
                  {
                    templates[selectedTemplate as keyof typeof templates]
                      .description
                  }
                </small>
              )}
          </div>

          {/* Interactive Builder Toggle */}
          <div style={{ marginBottom: "20px" }}>
            <button
              onClick={() => setShowBuilder(!showBuilder)}
              style={{
                padding: "10px 15px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              {showBuilder
                ? "📝 Hide Interactive Builder"
                : "📝 Show Interactive Builder"}
            </button>
          </div>

          {/* Builder Code Editor */}
          {showBuilder && (
            <div style={{ marginBottom: "20px" }}>
              <h5 style={{ margin: "0 0 10px 0", color: "#495057" }}>
                ⚡ Builder Code:
              </h5>
              <div style={{ position: "relative" }}>
                <textarea
                  value={builderCode}
                  onChange={(e) => setBuilderCode(e.target.value)}
                  placeholder={`const builder = createAccBuilder();
const conditions = builder
  .requireWalletOwnership('${recipientAddress || "0x742d35Cc6Af4..."}')
  .on('ethereum')
  .build();`}
                  style={{
                    width: "100%",
                    height: "200px",
                    padding: "15px",
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                    fontFamily: "monospace",
                    fontSize: "13px",
                    backgroundColor: "#1e1e1e",
                    color: "#f8f9fa",
                    resize: "vertical",
                  }}
                />
              </div>
              <button
                onClick={() => executeBuilderCode(builderCode)}
                style={{
                  marginTop: "10px",
                  padding: "10px 20px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Execute Builder Code
              </button>
            </div>
          )}

          {/* Human-readable Description */}
          {humanizedConditions && (
            <div
              style={{
                marginBottom: "20px",
                padding: "15px",
                backgroundColor: "#e7f3ff",
                borderRadius: "8px",
                border: "1px solid #bee5eb",
              }}
            >
              <h5 style={{ margin: "0 0 10px 0", color: "#0c5460" }}>
                🧑‍💻 Human-Readable Description:
              </h5>
              <p style={{ margin: "0", color: "#0c5460", fontStyle: "italic" }}>
                {humanizedConditions}
              </p>
            </div>
          )}

          {/* Generated Conditions Preview */}
          {conditions.length > 0 && (
            <div
              style={{
                marginTop: "20px",
                padding: "15px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
                border: "1px solid #dee2e6",
                position: "relative",
              }}
            >
              <h5 style={{ margin: "0 0 10px 0", color: "#495057" }}>
                🔑 Generated Access Control Conditions:
              </h5>

              {/* Copy button */}
              <button
                onClick={handleCopyConditions}
                style={{
                  position: "absolute",
                  top: "15px",
                  right: "15px",
                  padding: "5px 10px",
                  backgroundColor: "rgba(0, 0, 0, 0.1)",
                  border: "1px solid #dee2e6",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                  color: "#495057",
                }}
              >
                {isCopied ? "Copied!" : "Copy"}
              </button>

              <pre
                style={{
                  backgroundColor: "#343a40",
                  color: "#f8f9fa",
                  padding: "15px",
                  borderRadius: "4px",
                  overflow: "auto",
                  fontSize: "12px",
                  margin: "0",
                  paddingRight: "80px", // Make room for copy button
                }}
              >
                {JSON.stringify(conditions, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Bob's Section - Using Access Control Conditions for Decryption */}
      {conditions.length > 0 && (
        <div
          style={{
            border: "2px solid #007bff",
            borderRadius: "8px",
            marginBottom: "20px",
            backgroundColor: "#f8fbff",
          }}
        >
          <div
            style={{
              backgroundColor: "#007bff",
              color: "white",
              padding: "12px 20px",
              borderRadius: "6px 6px 0 0",
              marginBottom: "15px",
            }}
          >
            <h4 style={{ margin: "0", fontSize: "16px" }}>
              👤 Bob: Using Conditions for Decryption
            </h4>
            <p style={{ margin: "5px 0 0 0", fontSize: "12px", opacity: 0.9 }}>
              Bob needs these conditions and proper AuthContext to decrypt
              Alice's content
            </p>
          </div>

          <div style={{ padding: "0 20px 20px 20px" }}>
            {/* Important Information for Bob */}
            <div
              style={{
                backgroundColor: "#fff3cd",
                border: "1px solid #ffeaa7",
                borderRadius: "8px",
                padding: "15px",
                marginBottom: "20px",
              }}
            >
              <h5 style={{ margin: "0 0 10px 0", color: "#856404" }}>
                ⚠️ Important Requirements for Bob:
              </h5>
              <ul
                style={{ margin: "0", paddingLeft: "20px", color: "#856404" }}
              >
                <li>
                  <strong>Bob MUST have the access control conditions</strong>{" "}
                  to decrypt the content
                </li>
                <li>
                  <strong>Bob MUST create an AuthContext</strong> with proper
                  resources
                </li>
                <li>
                  <strong>For Lit Actions:</strong> AuthContext resources must
                  include <code>['lit-action-execution', '*']</code>
                </li>
                <li>
                  <strong>Bob pays for Lit Action execution</strong> when
                  conditions include custom logic
                </li>
              </ul>
            </div>

            {/* Code Example for Bob */}
            <div
              style={{
                padding: "15px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
                border: "1px solid #dee2e6",
              }}
            >
              <h5 style={{ margin: "0 0 10px 0", color: "#495057" }}>
                💻 Usage Example for Bob:
              </h5>
              <pre
                style={{
                  backgroundColor: "#343a40",
                  color: "#f8f9fa",
                  padding: "15px",
                  borderRadius: "4px",
                  overflow: "auto",
                  fontSize: "12px",
                  margin: "0",
                }}
              >
                {`import { humanizeUnifiedAccessControlConditions } from '@lit-protocol/access-control-conditions';

// 1. Bob gets these access control conditions from Alice
const accessControlConditions = ${JSON.stringify(conditions, null, 2)};

// 2. Bob creates AuthContext with proper resources
const bobAuthContext = await authManager.createEoaAuthContext({
  signer: bobAccount,
  authConfig: {
    resources: [
      ['access-control-condition-decryption', '*'],
      ['lit-action-execution', '*'] // Required for Lit Actions
    ],
    expiration: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
  },
  litClient: litClient,
});

// 3. Bob can now decrypt Alice's content
const decryptedData = await litClient.decrypt({
  accessControlConditions,
  ciphertext,
  dataToEncryptHash,
  authContext: bobAuthContext, // Bob's AuthContext required!
});

// 4. (Optional) Get human-readable description
const humanised = await humanizeUnifiedAccessControlConditions({
  unifiedAccessControlConditions: accessControlConditions,
});
console.log('🔑 Conditions:', humanised);`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
