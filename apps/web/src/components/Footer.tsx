import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--ink)] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="lane-rail h-6 w-6 rounded-md" aria-hidden />
            <span className="font-display text-lg font-bold">Paylane</span>
          </div>
          <p className="mt-3 max-w-md text-sm text-white/70">
            USDC payments on Arc — escrow for human work, instant pay for APIs and agents.
            Non-custodial by design.
          </p>
        </div>
        <nav className="grid grid-cols-2 gap-3 text-sm text-white/80 sm:justify-items-end">
          <Link href="/docs" className="hover:text-white">
            Docs
          </Link>
          <Link href="/docs/money-rules" className="hover:text-white">
            Money rules
          </Link>
          <Link href="/docs/dispute-policy" className="hover:text-white">
            Dispute Policy
          </Link>
          <Link href="/docs/risk-disclosure" className="hover:text-white">
            Risk Disclosure
          </Link>
          <Link href="/docs/for-officials" className="hover:text-white">
            For Officials
          </Link>
          <Link href="/trust" className="hover:text-white">
            Trust Center
          </Link>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-white/45 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Paylane · Arc network configurable via env (testnet → mainnet)
        </p>
      </div>
    </footer>
  );
}
