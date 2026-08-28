import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import ThemeProvider from "@/components/ThemeProvider";
import BisAttributeCleaner from "@/components/BisAttributeCleaner";
import ExtensionErrorSuppressor from "@/components/ExtensionErrorSuppressor";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FinePrint — AI Contract Risk Monitor",
  description:
    "Enterprise-grade AI contract risk monitoring and automated approval system. Evaluate, route, and execute decisions on third-party vendor contracts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans min-h-screen`}
        style={{ background: "var(--bg-canvas)", color: "var(--text-primary)" }}
      >
        <ExtensionErrorSuppressor />
        <div suppressHydrationWarning>
          <ThemeProvider>
            <AppShell>{children}</AppShell>
          </ThemeProvider>
        </div>
        {/* BisAttributeCleaner runs client-side to remove browser extension attribute injections
            that cause React hydration mismatches */}
        <BisAttributeCleaner />
      </body>
    </html>
  );
}
