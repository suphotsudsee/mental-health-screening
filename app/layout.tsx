import type { ReactNode } from "react";
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
      </head>
      <body className="min-h-dvh w-full bg-slate-100">
        <main className="w-full min-h-dvh bg-white md:max-w-md md:mx-auto md:shadow-lg md:border md:border-slate-200">
          {children}
        </main>
      </body>
    </html>
  );
}
