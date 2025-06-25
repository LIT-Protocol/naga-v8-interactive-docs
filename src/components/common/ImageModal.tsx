import React, { useState } from "react";

interface ImageModalProps {
  src: string;
  alt: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const ImageModal: React.FC<ImageModalProps> = ({
  src,
  alt,
  style,
  children,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const modalStyles = {
    overlay: {
      position: "fixed" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
      cursor: "pointer",
    },
    modal: {
      maxWidth: "90vw",
      maxHeight: "90vh",
      objectFit: "contain" as const,
      borderRadius: "8px",
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
    },
    closeButton: {
      position: "absolute" as const,
      top: "20px",
      right: "20px",
      background: "rgba(255, 255, 255, 0.9)",
      border: "none",
      borderRadius: "50%",
      width: "40px",
      height: "40px",
      fontSize: "20px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1001,
    },
  };

  const handleImageClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div
        onClick={handleImageClick}
        style={{ cursor: "pointer", display: "inline-block" }}
      >
        {children || (
          <img
            src={src}
            alt={alt}
            style={{
              maxWidth: "100%",
              height: "auto",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              ...style,
            }}
          />
        )}
        <div
          style={{
            textAlign: "center",
            marginTop: "8px",
            fontSize: "0.875rem",
            color: "#6b7280",
            fontStyle: "italic",
          }}
        >
          Click to Enlarge
        </div>
      </div>

      {isModalOpen && (
        <div style={modalStyles.overlay} onClick={handleModalClose}>
          <button
            style={modalStyles.closeButton}
            onClick={handleModalClose}
            aria-label="Close modal"
          >
            ×
          </button>
          <img
            src={src}
            alt={alt}
            style={modalStyles.modal}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default ImageModal;
