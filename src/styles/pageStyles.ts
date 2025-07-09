import { CSSProperties } from 'react';

export interface PageStyles {
    container: CSSProperties;
    h1: CSSProperties;
    h2: CSSProperties;
    h3: CSSProperties;
    h4: CSSProperties;
    p: CSSProperties;
    label: CSSProperties;
    input: CSSProperties;
    inputRow: CSSProperties;
    button: (isLoading?: boolean) => CSSProperties;
    ul: CSSProperties;
    ol: CSSProperties;
    li: CSSProperties;
    table: CSSProperties;
    th: CSSProperties;
    td: CSSProperties;
    link: CSSProperties;
}

export const pageStyles: PageStyles = {
    container: {
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "20px",
    },
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
    h3: {
        fontSize: "1.5rem",
        fontWeight: "600",
        color: "#1f2937",
        marginBottom: "12px",
    },
    h4: {
        fontSize: "1.25rem",
        fontWeight: "600",
        color: "#374151",
        marginTop: "24px",
        marginBottom: "12px",
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
    button: (isLoading = false) => ({
        padding: "10px 18px",
        backgroundColor: isLoading ? "#cccccc" : "#007bff",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: isLoading ? "not-allowed" : "pointer",
        fontWeight: 500,
        fontSize: "1rem",
    }),
    ul: {
        listStyleType: "disc",
        paddingLeft: "20px",
        marginBottom: "16px",
    },
    ol: {
        listStyleType: "decimal",
        paddingLeft: "20px",
        marginBottom: "16px",
    },
    li: {
        marginBottom: "8px",
        color: "#4b5563",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse" as const,
        marginBottom: "24px",
    },
    th: {
        backgroundColor: "#f8fafc",
        padding: "12px",
        textAlign: "left" as const,
        borderBottom: "2px solid #e2e8f0",
        fontWeight: "600",
        color: "#1f2937",
    },
    td: {
        padding: "12px",
        borderBottom: "1px solid #e2e8f0",
        color: "#4b5563",
    },
    link: {
        color: "#007bff",
        textDecoration: "underline",
    },
};