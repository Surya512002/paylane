import type { Metadata } from "next";
import { Figtree, Syne } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Providers } from "@/components/Providers";

const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });
const syne = Syne({ variable: "--font-syne", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Paylane — USDC work escrow & API payments on Arc",
  description:
    "Paylane locks USDC in non-custodial escrow for freelance work, and settles agent API calls via x402 on Circle’s Arc.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full overflow-x-hidden">
      <body
        className={`${figtree.variable} ${syne.variable} h-full antialiased flex min-h-screen w-full max-w-[100vw] flex-col overflow-x-hidden`}
      >
        <Providers>
          <Header />
          <main className="w-full min-w-0 flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
