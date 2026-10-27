import type { Metadata } from "next";
import { Geist } from "next/font/google";

import RouteCurtain from "@/components/motion/RouteCurtain";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Adelaide University Volunteers — Admin",
  description: "Club coordinator portal for volunteer events and shifts.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#fafafa] text-[#171717]">
        <RouteCurtain />
        {children}
      </body>
    </html>
  );
}
