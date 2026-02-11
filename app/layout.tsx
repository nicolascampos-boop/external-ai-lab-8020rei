import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Training Platform",
  description: "Curated content for lab-based AI learning experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
