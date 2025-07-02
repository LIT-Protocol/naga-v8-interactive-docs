import React from "react";
import { DisplayCode } from "../DisplayCode";
import GreyBoarderWhiteBgContainer from "../layout/GreyboardWhiteBgContainer";
import { pageStyles } from "../../styles/pageStyles";

interface Package {
  name: string;
  description: string;
}

interface RequiredPackagesProps {
  title?: string;
  description?: string;
  packages: Package[];
  installationCode: string;
  installationLanguage?: string;
  style?: React.CSSProperties;
}

const RequiredPackages: React.FC<RequiredPackagesProps> = ({
  title = "Required Packages",
  description = "To get started, you'll need to install the following essential packages:",
  packages,
  installationCode,
  installationLanguage = "bash",
  style = {},
}) => {
  return (
    <GreyBoarderWhiteBgContainer style={style}>
      <h2 style={pageStyles.h2}>{title}</h2>
      <p style={pageStyles.p}>{description}</p>

      <div style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          {packages.map((pkg, index) => (
            <div
              key={index}
              style={{
                padding: "20px",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            >
              <h4
                style={{
                  margin: "0 0 8px 0",
                  color: "#1f2937",
                  fontSize: "1.1rem",
                }}
              >
                📦 {pkg.name}
              </h4>
              <p
                style={{
                  margin: "0",
                  fontSize: "0.9rem",
                  color: "#4b5563",
                }}
              >
                {pkg.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <DisplayCode code={installationCode} language={installationLanguage} />
    </GreyBoarderWhiteBgContainer>
  );
};

export default RequiredPackages;
