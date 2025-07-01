import React, { useState } from "react";

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  style?: React.CSSProperties;
  variant?: "default" | "code" | "info";
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultOpen = false,
  className = "",
  style = {},
  variant = "default",
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const getVariantStyles = () => {
    switch (variant) {
      case "code":
        return {
          backgroundColor: "#f8f9fa",
          borderColor: "#e9ecef",
          headerColor: "#495057",
        };
      case "info":
        return {
          backgroundColor: "#e3f2fd",
          borderColor: "#90caf9",
          headerColor: "#1976d2",
        };
      case "default":
      default:
        return {
          backgroundColor: "#ffffff",
          borderColor: "#d1d5db",
          headerColor: "#374151",
        };
    }
  };

  const variantStyles = getVariantStyles();

  const containerStyle: React.CSSProperties = {
    border: `1px solid ${variantStyles.borderColor}`,
    borderRadius: "8px",
    backgroundColor: variantStyles.backgroundColor,
    overflow: "hidden",
    ...style,
  };

  const headerStyle: React.CSSProperties = {
    padding: "12px 16px",
    backgroundColor: isOpen ? variantStyles.backgroundColor : "#f8f9fa",
    borderBottom: isOpen ? `1px solid ${variantStyles.borderColor}` : "none",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.95rem",
    fontWeight: "600",
    color: variantStyles.headerColor,
    transition: "all 0.2s ease",
    userSelect: "none",
  };

  const chevronStyle: React.CSSProperties = {
    transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
    transition: "transform 0.2s ease",
    fontSize: "0.8rem",
    color: "#6b7280",
  };

  const contentStyle: React.CSSProperties = {
    maxHeight: isOpen ? "none" : "0",
    overflow: isOpen ? "visible" : "hidden",
    transition: "all 0.3s ease",
    opacity: isOpen ? 1 : 0,
  };

  const contentInnerStyle: React.CSSProperties = {
    padding: isOpen ? "0" : "0",
  };

  return (
    <div style={containerStyle} className={className}>
      <div
        style={headerStyle}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#f1f5f9";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isOpen
            ? variantStyles.backgroundColor
            : "#f8f9fa";
        }}
      >
        <span>{title}</span>
        <span style={chevronStyle}>▶</span>
      </div>
      <div style={contentStyle}>
        <div style={contentInnerStyle}>{children}</div>
      </div>
    </div>
  );
};

export default CollapsibleSection;
