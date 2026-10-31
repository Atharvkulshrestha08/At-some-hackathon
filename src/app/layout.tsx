import type { Metadata } from "next";
import "./globals.css";
import { SwasthyaShell } from "@/components/SwasthyaShell";

export const metadata: Metadata = {
  title: "SWASTHYA SENSE — Clinical Early Warning & Follow-Up Platform",
  description:
    "Privacy-first follow-up and early-warning coordination platform for frontline workers and clinicians.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen text-teal-950 antialiased selection:bg-teal-600 selection:text-white font-sans">
        <SwasthyaShell>{children}</SwasthyaShell>
      </body>
    </html>
  );
}
