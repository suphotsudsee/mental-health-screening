import type { ReactNode } from "react";
import Script from "next/script";
import LiffInitializer from "@/components/LiffInitializer";
import PwaRegister from "@/components/PwaRegister";
import "./globals.css";

export const metadata = {
  title: "Mental Health Screening",
  description: "Stress & 2Q plus & 8Q Screening App"
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#047857"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
        <Script
          src="https://static.line-scdn.net/liff/edge/2/sdk.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="min-h-dvh w-full bg-white">
        <main className="min-h-dvh w-full bg-white">
          {children}
        </main>
        {/* <LiffInitializer />
        <PwaRegister /> */}
      </body>
    </html>
  );
}
