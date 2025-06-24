import React from "react";

interface WarningCalloutProps {
  title?: string;
  message: React.ReactNode;
  variant?: "warning" | "error" | "info";
  showIcon?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const WarningCallout: React.FC<WarningCalloutProps> = ({
  title = "Warning",
  message,
  variant = "warning",
  showIcon = true,
  className = "",
  style = {},
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "error":
        return {
          backgroundColor: "#fef2f2",
          borderColor: "#ef4444",
          textColor: "#991b1b",
          iconColor: "#dc2626",
        };
      case "info":
        return {
          backgroundColor: "#eff6ff",
          borderColor: "#3b82f6",
          textColor: "#1e40af",
          iconColor: "#2563eb",
        };
      case "warning":
      default:
        return {
          backgroundColor: "#fffbeb",
          borderColor: "#f59e0b",
          textColor: "#92400e",
          iconColor: "#d97706",
        };
    }
  };

  const variantStyles = getVariantStyles();

  const containerStyle: React.CSSProperties = {
    padding: "16px",
    backgroundColor: variantStyles.backgroundColor,
    borderRadius: "8px",
    border: `1px solid ${variantStyles.borderColor}`,
    marginBottom: "16px",
    ...style,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "1rem",
    fontWeight: "600",
    color: variantStyles.textColor,
    margin: "0 0 8px 0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  const messageStyle: React.CSSProperties = {
    fontSize: "0.9rem",
    lineHeight: "1.5",
    color: variantStyles.textColor,
    margin: 0,
  };

  const iconStyle: React.CSSProperties = {
    color: variantStyles.iconColor,
    fontSize: "1.2rem",
  };

  const getIcon = () => {
    switch (variant) {
      case "error":
        return "⚠️";
      case "info":
        return "ℹ️";
      case "warning":
      default:
        return "⚠️";
    }
  };

  return (
    <div style={containerStyle} className={className}>
      <h4 style={titleStyle}>
        {showIcon && <span style={iconStyle}>{getIcon()}</span>}
        {title}
      </h4>
      <p style={messageStyle}>{message}</p>
    </div>
  );
};

export default WarningCallout;
