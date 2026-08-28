import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import ThemeProvider from "@/components/ThemeProvider";

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
        <div suppressHydrationWarning>
          <ThemeProvider>
            <AppShell>{children}</AppShell>
          </ThemeProvider>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Strip existing attributes immediately
                document.querySelectorAll('[bis_skin_checked]').forEach(function(el) {
                  el.removeAttribute('bis_skin_checked');
                });
                // Keep observing and stripping to beat the extension
                var observer = new MutationObserver(function(mutations) {
                  mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'bis_skin_checked') {
                      mutation.target.removeAttribute('bis_skin_checked');
                    }
                  });
                });
                observer.observe(document.documentElement, {
                  attributes: true,
                  subtree: true,
                  attributeFilter: ['bis_skin_checked']
                });
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
