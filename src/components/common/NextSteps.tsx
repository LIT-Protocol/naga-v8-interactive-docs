import React from "react";

interface NextStepsProps {
  title?: string;
  children: React.ReactNode;
}

const NextSteps: React.FC<NextStepsProps> = ({
  title = "🚀 Next Steps",
  children,
}) => {
  return (
    <div
      style={{
        backgroundColor: "#f0f9ff",
        border: "1px solid #3b82f6",
        borderRadius: "8px",
        padding: "20px",
        marginTop: "20px",
      }}
    >
      <h3
        style={{ margin: "0 0 10px 0", color: "#1e40af", fontSize: "1.2rem" }}
      >
        {title}
      </h3>
      <div style={{ margin: "0", color: "#1e3a8a", lineHeight: "1.5" }}>
        {children}
      </div>
    </div>
  );
};

export default NextSteps;
