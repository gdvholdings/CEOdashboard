import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GDV Holdings - Ticketing System",
  description: "Internal ticketing and support management system for GDV Holdings",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-slate-50">{children}</body>
    </html>
  );
}
