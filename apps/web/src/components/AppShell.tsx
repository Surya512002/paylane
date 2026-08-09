import { PageEnter } from "@/components/PageMotion";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell mx-auto w-full min-w-0 max-w-7xl overflow-x-clip px-3 py-6 sm:px-6 sm:py-8 md:py-10 lg:px-8">
      <PageEnter>
        <div className="relative z-[1] space-y-0">{children}</div>
      </PageEnter>
    </div>
  );
}
