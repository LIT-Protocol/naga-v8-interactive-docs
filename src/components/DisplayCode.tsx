import React, { useState, ReactNode, useRef, useEffect } from "react";
import { Highlight, themes } from "prism-react-renderer";
import { replacer } from "../helper";

/**
 * DisplayCode Component
 *
 * A component that displays code with line numbers and a copy button.
 * Features:
 * - Line numbers
 * - Syntax highlighting using Prism.js
 * - Copy to clipboard functionality
 * - Responsive design
 * - Optional side-by-side layout with component rendering
 * - Optional result display below (collapsible)
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

  /**
   * Component to render alongside the code (for side-by-side view)
   */
  renderComponent?: ReactNode;

  /**
   * Result data to display below the code and component
   */
  resultData?: any;

  /**
   * Label for the result section
   * @default "Result"
   */
  resultLabel?: string;

  /**
   * Whether to use side-by-side layout (code on left, component on right)
   * @default false
   */
  useSideBySide?: boolean;

  /**
   * Theme for syntax highlighting
   * @default "dracula"
   */
  theme?: keyof typeof themes;

  /**
   * Whether to show success styling (green border animation)
   * @default false
   */
  isSuccess?: boolean;
}

export const DisplayCode: React.FC<DisplayCodeProps> = ({
  code,
  language = "typescript",
  showLineNumbers = true,
  style,
  className,
  renderComponent,
  resultData,
  resultLabel = "Result",
  useSideBySide = false,
  theme = "dracula",
  isSuccess = false,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isResultExpanded, setIsResultExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  // Measure the content height when data changes
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [resultData]);

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

  // Toggle result section visibility
  const toggleResult = () => {
    setIsResultExpanded(!isResultExpanded);
  };

  // Render the code block
  const codeBlock = (
    <div
      className={`display-code-container ${className || ""}`}
      style={{
        backgroundColor: "#1e1e1e",
        borderRadius: "8px",
        height: "100%",
        overflow: "hidden",
        fontFamily: "monospace",
        position: "relative",
        ...style,
        width: useSideBySide && renderComponent ? "48%" : "100%",
      }}
    >
      {/* Copy button */}
      <button
        onClick={handleCopy}
        style={{
          position: "absolute",
          bottom: "10px",
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
          padding: "0",
          overflowX: "auto",
        }}
      >
        <Highlight
          theme={themes[theme]}
          code={code.trim()}
          language={language as any}
        >
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre
              className={className}
              style={{
                ...style,
                margin: 0,
                padding: "20px 0",
                width: "100%",
                overflowX: "auto",
                fontSize: "12px",
              }}
            >
              <div style={{ display: "flex" }}>
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
                    {tokens.map((_, i) => (
                      <div key={i} style={{ lineHeight: "1.5" }}>
                        {i + 1}
                      </div>
                    ))}
                  </div>
                )}

                {/* Code content */}
                <div
                  style={{
                    margin: 0,
                    padding: "0 15px",
                    overflowX: "auto",
                    lineHeight: "1.5",
                    width: "100%",
                  }}
                >
                  {tokens.map((line, i) => {
                    const { key: lineKey, ...lineProps } = getLineProps({
                      line,
                      key: i,
                    });
                    return (
                      <div key={i} {...lineProps}>
                        {line.map((token, key) => {
                          const { key: tokenKey, ...tokenProps } =
                            getTokenProps({ token, key });
                          return <span key={key} {...tokenProps} />;
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  );

  // Render the component block (if provided)
  const componentBlock = renderComponent ? (
    <div
      className="rendered-component-container"
      style={{
        width: useSideBySide ? "48%" : "100%",
        padding: "20px",
        border: "2px solid #4a90e2", // Enhanced border
        borderRadius: "8px",
        backgroundColor: "#fff",
        marginTop: useSideBySide ? 0 : "20px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)", // Subtle shadow
      }}
    >
      <div
        style={{
          backgroundColor: "#f0f8ff",
          margin: "-20px -20px 15px -20px",
          padding: "8px 16px",
          borderBottom: "1px solid #4a90e2",
          borderTopLeftRadius: "6px",
          borderTopRightRadius: "6px",
          fontWeight: "500",
          color: "#2c5282",
        }}
      >
        Interactive Area
      </div>
      {renderComponent}
    </div>
  ) : null;

  // Render the result block (if provided)
  const resultBlock = resultData ? (
    <div
      className="result-container"
      style={{
        width: "100%",
        marginTop: "20px",
        backgroundColor: "#f5f5f5",
        borderRadius: "8px",
        border: isSuccess ? "2px solid #28a745" : "1px solid #e0e0e0",
        overflow: "hidden", // Important for the animation
        boxShadow: isSuccess ? "0 0 20px rgba(40, 167, 69, 0.3)" : "none",
        transition: "all 0.3s ease-in-out",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          padding: "15px",
          borderBottom: isResultExpanded ? "1px solid #e0e0e0" : "none",
          backgroundColor: isSuccess ? "rgba(40, 167, 69, 0.1)" : "transparent",
        }}
        onClick={toggleResult}
      >
        <h4
          style={{
            margin: 0,
            color: isSuccess ? "#28a745" : "inherit",
            fontWeight: isSuccess ? "600" : "normal",
          }}
        >
          {isSuccess ? "✅ " : ""}
          {resultLabel}
        </h4>
        <button
          style={{
            background: "none",
            border: "none",
            fontSize: "18px",
            cursor: "pointer",
            padding: "0 8px",
            color: "#666",
            transition: "transform 0.3s ease-in-out",
          }}
        >
          <span
            style={{
              display: "inline-block",
              transform: isResultExpanded ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 0.3s ease-in-out",
            }}
          >
            ▼
          </span>
        </button>
      </div>

      <div
        style={{
          height: isResultExpanded ? `${contentHeight}px` : "0",
          transition: "height 0.4s ease-in-out",
          overflow: "hidden",
        }}
      >
        <div
          ref={contentRef}
          style={{
            backgroundColor: "#1e1e1e",
            padding: "15px",
            color: "#e6e6e6",
            fontFamily: "monospace",
            overflowX: "auto",
          }}
        >
          <pre style={{ margin: 0 }}>
            {typeof resultData === "string"
              ? resultData
              : JSON.stringify(resultData, replacer, 2)}
          </pre>
        </div>
      </div>
    </div>
  ) : null;

  // Conditional rendering based on layout choice
  if (useSideBySide && renderComponent) {
    return (
      <div className="display-code-with-component">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "20px", // Add some spacing between code and component
          }}
        >
          {codeBlock}
          {componentBlock}
        </div>
        {resultBlock}
      </div>
    );
  }

  // Default vertical layout
  return (
    <div className="display-code-with-component">
      {codeBlock}
      {componentBlock}
      {resultBlock}
    </div>
  );
};

export default DisplayCode;
