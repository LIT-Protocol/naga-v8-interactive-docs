export default function GreyBoarderWhiteBgContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        marginTop: "20px",
        padding: "20px",
        backgroundColor: "#f9f9f9",
        borderRadius: "6px",
        border: "1px solid #e0e0e0",
      }}
    >
      {children}
    </div>
  );
}
