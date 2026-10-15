import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "School Management System — St. Xavier Academy",
  description: "Enterprise Academic, Financial and Operational Administration Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
