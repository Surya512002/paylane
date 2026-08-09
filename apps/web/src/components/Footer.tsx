import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer mt-auto text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="lane-rail h-6 w-6 rounded-md" aria-hidden />
            <span className="font-display text-lg font-bold tracking-tight">Paylane</span>
          </div>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/65">
            USDC payments on Arc — escrow for human work, instant pay for APIs and agents.
            Non-custodial by design.
          </p>
        </div>
        <nav className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm text-white/75 sm:justify-items-end">
          {[
            ["/docs", "Docs"],
            ["/docs/money-rules", "Money rules"],
            ["/docs/dispute-policy", "Dispute Policy"],
            ["/docs/risk-disclosure", "Risk Disclosure"],
            ["/docs/for-officials", "For Officials"],
            ["/trust", "Trust Center"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="transition hover:text-white"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-white/40 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Paylane · Built on Arc · Network via env (testnet → mainnet)
        </p>
      </div>
    </footer>
  );
}
