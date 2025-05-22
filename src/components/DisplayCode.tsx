import React, { useState } from "react";

/**
 * DisplayCode Component
 *
 * A component that displays code with line numbers and a copy button.
 * Features:
 * - Line numbers
 * - Syntax highlighting based on language
 * - Copy to clipboard functionality
 * - Responsive design
 */

interface DisplayCodeProps {
  /**
   * The code to display
   */
  code: string;

  /**
   * The programming language for syntax highlighting
   * @default "typescript"
   */
  language?: string;

  /**
   * Whether to show line numbers
   * @default true
   */
  showLineNumbers?: boolean;

  /**
   * Custom styles for the container
   */
  style?: React.CSSProperties;

  /**
   * Custom class name for the container
   */
  className?: string;
}

export const DisplayCode: React.FC<DisplayCodeProps> = ({
  code,
  language = "typescript",
  showLineNumbers = true,
  style,
  className,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  // Calculate line numbers
  const lines = code.split("\n");
  const lineNumbers = showLineNumbers
    ? Array.from({ length: lines.length }, (_, i) => i + 1)
    : [];

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  return (
    <div
      className={`display-code-container ${className || ""}`}
      style={{
        backgroundColor: "#1e1e1e",
        borderRadius: "8px",
        overflow: "hidden",
        fontFamily: "monospace",
        position: "relative",
        ...style,
      }}
    >
      {/* Copy button */}
      <button
        onClick={handleCopy}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          border: "none",
          borderRadius: "4px",
          padding: "5px 10px",
          color: "#fff",
          cursor: "pointer",
          fontSize: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        }}
      >
        {isCopied ? "Copied!" : "Copy"}
      </button>

      <div
        style={{
          display: "flex",
          padding: "20px 0",
          overflowX: "auto",
        }}
      >
        {/* Line numbers */}
        {showLineNumbers && (
          <div
            style={{
              borderRight: "1px solid #333",
              textAlign: "right",
              padding: "0 10px",
              color: "#666",
              userSelect: "none",
              backgroundColor: "#252525",
              minWidth: "40px",
            }}
          >
            {lineNumbers.map((num) => (
              <div key={num} style={{ lineHeight: "1.5" }}>
                {num}
              </div>
            ))}
          </div>
        )}

        {/* Code content */}
        <pre
          style={{
            margin: 0,
            padding: "0 15px",
            overflowX: "auto",
            color: "#e6e6e6",
            lineHeight: "1.5",
            width: "100%",
          }}
        >
          <code className={language}>
            {lines.map((line, index) => {
              // Basic syntax highlighting
              const highlightedLine = highlightSyntax(line, language);
              return (
                <div key={index} style={{ whiteSpace: "pre" }}>
                  {highlightedLine}
                </div>
              );
            })}
          </code>
        </pre>
      </div>
    </div>
  );
};

/**
 * Basic syntax highlighting function
 * Note: This is a simple implementation. For production use, consider using a library like Prism.js
 */
function highlightSyntax(code: string, language: string): React.ReactNode {
  // This is a simplified version of syntax highlighting
  // For a more robust solution, consider using a library

  if (language === "typescript" || language === "javascript") {
    // Keywords
    const keywords = [
      "const",
      "let",
      "var",
      "function",
      "return",
      "if",
      "else",
      "for",
      "while",
      "import",
      "export",
      "from",
      "class",
      "interface",
      "type",
      "extends",
      "implements",
      "new",
      "this",
      "super",
      "async",
      "await",
      "try",
      "catch",
      "finally",
      "throw",
      "true",
      "false",
      "null",
      "undefined",
    ];

    // Simple regex-based highlighting
    let result = code;

    // Highlight strings
    result = result.replace(
      /(["'`])(.*?)\1/g,
      '<span style="color: #ce9178">$&</span>'
    );

    // Highlight comments
    result = result.replace(
      /\/\/.*/g,
      '<span style="color: #6a9955">$&</span>'
    );

    // Highlight keywords
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, "g");
      result = result.replace(regex, `<span style="color: #569cd6">$&</span>`);
    }

    // Highlight types
    result = result.replace(
      /\b([A-Z][A-Za-z0-9_]*)\b/g,
      '<span style="color: #4ec9b0">$&</span>'
    );

    // Highlight functions
    result = result.replace(
      /\b([a-z][A-Za-z0-9_]*)\(/g,
      '<span style="color: #dcdcaa">$1</span>('
    );

    // Highlight numbers
    result = result.replace(
      /\b(\d+)\b/g,
      '<span style="color: #b5cea8">$&</span>'
    );

    // Return as dangerouslySetInnerHTML to render the HTML
    return <span dangerouslySetInnerHTML={{ __html: result }} />;
  }

  // For other languages or if no highlighting is needed, return the code as is
  return code;
}

export default DisplayCode;
