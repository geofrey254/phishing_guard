import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SidebarNav } from "@/components/sidebar-nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PhisherMan",
  description:
    "Rule-based phishing URL detection dashboard built with Next.js and Tailwind CSS.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#f5f5f3] text-[#101828]">
        <div className="min-h-screen bg-[#f5f5f3]">
          <div className="mx-auto flex max-w-7xl flex-col md:flex-row">
            <SidebarNav />
            <main className="flex-1 p-4 md:p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
