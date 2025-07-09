export default function LinkExternal({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: "#3b82f6", textDecoration: "underline" }}
    >
      {children}
    </a>
  );
}
