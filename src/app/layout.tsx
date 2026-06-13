import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GDV Holdings Help Desk",
  description: "Internal support ticketing system for GDV Holdings",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-slate-50 antialiased">{children}</body>
    </html>
  );
}
