import React from "react";
import { Link } from "react-router-dom";

interface EoaAuthSectionProps {
  tabName: string;
}

const EoaAuthSection: React.FC<EoaAuthSectionProps> = ({ tabName }) => {
  return (
    <div
      style={{
        border: "1px solid #4b6cb7",
        borderRadius: "8px",
        marginTop: "20px",
        padding: "20px",
        backgroundColor: "#f0f4ff",
        boxShadow: "0 2px 4px rgba(75, 108, 183, 0.15)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "15px",
          borderBottom: "1px solid #4b6cb7",
          paddingBottom: "10px",
        }}
      >
        <div
          style={{
            backgroundColor: "#4b6cb7",
            color: "white",
            padding: "5px 10px",
            borderRadius: "4px",
            marginRight: "10px",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          ✏️ Note
        </div>
        <h3
          style={{
            margin: 0,
            color: "#4b6cb7",
          }}
        >
          EOA-Based Authentications
        </h3>
      </div>

      <strong style={{ color: "#4b6cb7" }}>Key Differences:</strong>
        <ul style={{ margin: "10px 0 0 0", paddingLeft: "20px" }}>
          <li>
            <strong>EOA Native:</strong> Direct EOA ownership and management of
            PKPs with manual permission setup
          </li>
          <li>
            <strong>EOA Auth Method:</strong> EOA used as authentication
            mechanism, similar to Google/Discord auth patterns
          </li>
        </ul>
{/* 
      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          backgroundColor: "rgba(75, 108, 183, 0.1)",
          borderRadius: "5px",
          border: "1px solid #4b6cb7",
        }}
      >

      </div> */}
    </div>
  );
};

export default EoaAuthSection;
