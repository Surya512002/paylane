export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-8 sm:px-6 md:py-10 lg:px-8">{children}</div>
  );
}
