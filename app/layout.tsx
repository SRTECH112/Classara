import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Classara",
  description: "Classara App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white">
        <main className="mx-auto max-w-4xl px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
