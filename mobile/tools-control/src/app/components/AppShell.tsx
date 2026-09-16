export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-md mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
}