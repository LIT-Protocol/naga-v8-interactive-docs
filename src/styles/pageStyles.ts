import { CSSProperties } from 'react';

export interface PageStyles {
    h1: CSSProperties;
    h2: CSSProperties;
    h3: CSSProperties;
    p: CSSProperties;
    label: CSSProperties;
    input: CSSProperties;
    inputRow: CSSProperties;
    button: (isLoading?: boolean) => CSSProperties;
    ul: CSSProperties;
    ol: CSSProperties;
    li: CSSProperties;
}

export const pageStyles: PageStyles = {
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
}; 