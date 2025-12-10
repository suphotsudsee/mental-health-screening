import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Mental Health Screening",
  description: "Stress & 2Q plus & 8Q Screening App"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen w-full bg-slate-100">
        <main className="w-full min-h-screen bg-white md:max-w-md md:mx-auto md:shadow-lg md:border md:border-slate-200">
          {children}
        </main>
      </body>
    </html>
  );
}
