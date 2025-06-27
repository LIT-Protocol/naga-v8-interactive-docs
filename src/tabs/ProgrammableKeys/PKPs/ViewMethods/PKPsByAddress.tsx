import { useState } from "react";
import { DisplayCode } from "../../../../components/DisplayCode";
import GreyBoarderWhiteBgContainer from "../../../../components/layout/GreyboardWhiteBgContainer";
import { useAppContext } from "../../../../router";
import { NoteCallout } from "../../../../components/common";
import { Link } from "react-router-dom";

export default function PKPsByAddressTab() {
  const { setStatus, assertDependenciesLoaded, showError } = useAppContext();

  const [ownerAddress, setOwnerAddress] = useState("");
  const [limit, setLimit] = useState<string>("10");
  const [offset, setOffset] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(false);
  const [pkps, setPkps] = useState<any>(null);
  const [success, setSuccess] = useState(false);

  // Utility function to format error messages properly
  const formatErrorMessage = (prefix: string, error: unknown): string => {
    let errorMessage = prefix;
    if (error && typeof error === "object" && "message" in error) {
      errorMessage += (error as { message: string }).message;
    } else if (typeof error === "object") {
      errorMessage += JSON.stringify(error, null, 2);
    } else {
      errorMessage += String(error);
    }
    return errorMessage;
  };

  const fetchPKPs = async () => {
    if (!ownerAddress) {
      setStatus("Please enter an owner address.");
      return;
    }
    try {
      setIsLoading(true);
      setStatus("Fetching PKPs by address...");
      setSuccess(false);
      setPkps(null);
      const { litClient } = assertDependenciesLoaded();
      const result = await (litClient as any).viewPKPsByAddress({
        ownerAddress,
        pagination: { limit: Number(limit), offset: Number(offset) },
      });
      setPkps(result);
      setStatus("PKPs fetched successfully!");
      setSuccess(true);
    } catch (error: unknown) {
      console.error("Error fetching PKPs by address:", error);
      const errorMessage = formatErrorMessage("Failed to fetch PKPs: ", error);
      setStatus(errorMessage);
      showError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const pageStyles = {
    h1: {
      fontSize: "2.5rem",
      fontWeight: "700",
      color: "#1f2937",
      marginBottom: "24px",
    },
    h2: {
      fontSize: "2rem",
      fontWeight: "600",
      color: "#1f2937",
      marginBottom: "16px",
      borderBottom: "1px solid #e5e7eb",
      paddingBottom: "8px",
    },
    p: {
      fontSize: "1rem",
      lineHeight: "1.6",
      color: "#4b5563",
      marginBottom: "16px",
    },
    label: {
      fontWeight: 500,
      marginBottom: 4,
      display: "block",
    },
    input: {
      padding: "8px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "4px",
      fontSize: "1rem",
      marginBottom: "12px",
      width: "100%",
      boxSizing: "border-box" as const,
    },
    inputRow: {
      display: "flex",
      gap: "12px",
      marginBottom: "12px",
    },
    button: {
      padding: "10px 18px",
      backgroundColor: isLoading ? "#cccccc" : "#007bff",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: isLoading ? "not-allowed" : "pointer",
      fontWeight: 500,
      fontSize: "1rem",
    },
  };

  // Dynamically generate the code example based on current input
  const codeExample = `const pkps = await litClient.viewPKPsByAddress({
  ownerAddress: '${ownerAddress || "0x..."}',
  pagination: { limit: ${limit}, offset: ${offset} },
});
console.log(pkps);
`;

  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>View PKPs by Owner Address</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Intro</h2>
        <p style={pageStyles.p}>
          The{" "}
          <strong>
            <code>viewPKPsByAddress</code>
          </strong>{" "}
          utility function allows you to fetch all PKPs owned by a specific
          Ethereum address. You can optionally provide pagination parameters to
          control the number of results and offset.
        </p>
        <ul style={{ marginBottom: "16px" }}>
          <li>
            <code>ownerAddress</code> - The Ethereum address to query for PKP
            ownership.
          </li>
          <li>
            <code>pagination</code> - An optional parameter used to set the{" "}
            <code>limit</code> and <code>offset</code> for paginated results.
          </li>
        </ul>
        <p style={pageStyles.p}>
          The returned result includes a list of PKPs owned by the address, and
          includes additional pagination metadata.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Query PKPs by Address</h2>

        <NoteCallout
          message={
            <>
              <p>
                PKPs are represented by ERC-721 tokens. The{" "}
                <code>viewPKPsByAddress</code> function will only return PKPs
                for which the provided <code>ownerAddress</code> is the current
                owner of the ERC-721 token.
              </p>
              <p>
                If you minted a PKP using an Auth Method other than{" "}
                <Link
                  to="/programmable-keys/pkps/auth-methods/eoa-native"
                  style={{ color: "#3b82f6", textDecoration: "underline" }}
                >
                  EOA Native
                </Link>
                , the PKP may not appear in the results.
              </p>
              <p>
                This is because when using non-EOA Native Auth Method
                interactive code examples in these docs, the PKP ERC-721 token
                is minted and is assigned ownership to the PKP itself.
              </p>
            </>
          }
          variant="note"
          style={{ marginBottom: "16px" }}
        />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchPKPs();
          }}
        >
          <label style={pageStyles.label} htmlFor="ownerAddress">
            Owner Address
          </label>
          <input
            id="ownerAddress"
            type="text"
            style={pageStyles.input}
            value={ownerAddress}
            onChange={(e) => setOwnerAddress(e.target.value)}
            placeholder="0x..."
            autoComplete="off"
            required
          />
          <div style={pageStyles.inputRow}>
            <div style={{ flex: 1 }}>
              <label style={pageStyles.label} htmlFor="limit">
                Limit
              </label>
              <input
                id="limit"
                type="number"
                min={1}
                max={100}
                style={pageStyles.input}
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={pageStyles.label} htmlFor="offset">
                Offset
              </label>
              <input
                id="offset"
                type="number"
                min={0}
                style={pageStyles.input}
                value={offset}
                onChange={(e) => setOffset(e.target.value)}
              />
            </div>
          </div>
          <button
            type="submit"
            onClick={fetchPKPs}
            disabled={
              isLoading ||
              !ownerAddress ||
              limit.trim() === "" ||
              offset.trim() === ""
            }
            style={{
              padding: "10px 18px",
              width: "100%",
              backgroundColor:
                isLoading ||
                !ownerAddress ||
                limit.trim() === "" ||
                offset.trim() === ""
                  ? "#f0f0f0"
                  : "#007bff",
              color:
                isLoading ||
                !ownerAddress ||
                limit.trim() === "" ||
                offset.trim() === ""
                  ? "#333"
                  : "#fff",
              border: "1px solid #ddd",
              borderRadius: "4px",
              cursor:
                isLoading ||
                !ownerAddress ||
                limit.trim() === "" ||
                offset.trim() === ""
                  ? "not-allowed"
                  : "pointer",
              fontWeight: 500,
              fontSize: "1rem",
              marginBottom: "16px",
            }}
          >
            {isLoading ? "Fetching..." : "Fetch PKPs"}
          </button>
        </form>

        <DisplayCode
          code={codeExample}
          language="typescript"
          resultData={pkps}
          resultLabel="PKPs Result"
          useSideBySide={true}
          theme="dracula"
          isSuccess={success}
        />
      </GreyBoarderWhiteBgContainer>
    </div>
  );
}
