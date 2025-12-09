import "./globals.css";

export const metadata = {
  title: "Mental Health Screening",
  description: "Stress & 2Q plus & 8Q Screening App"
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="flex justify-center">
        <main className="max-w-md w-full min-h-screen bg-white shadow-lg">
          {children}
        </main>
      </body>
    </html>
  );
}
