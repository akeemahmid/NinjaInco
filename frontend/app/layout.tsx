import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import { Toaster } from "sonner";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://ninjainco.app"),
  title: {
    default: "NinjaInco",
    template: "%s | NinjaInco",
  },
  description: "Build a ninja identity, train hidden attributes, duel a Sensei, and progress through confidential on-chain gameplay powered by Inco.",
  applicationName: "NinjaInco",
  openGraph: {
    title: "NinjaInco",
    description: "Confidential on-chain ninja progression powered by Inco.",
    siteName: "NinjaInco",
    type: "website",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <body suppressHydrationWarning className="min-h-screen bg-background font-mono">
        <Providers>
          <Header />
          {children}
          <Footer />
        </Providers>
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: "hsl(var(--card))",
              color: "hsl(var(--foreground))",
              border: "1px solid hsl(var(--border))",
              fontFamily: "var(--font-mono), ui-monospace, monospace",
              fontSize: "14px",
            },
          }}
        />
      </body>
    </html>
  );
}
