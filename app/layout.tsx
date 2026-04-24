import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ClerkProvider } from "@clerk/nextjs";

import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/providers/query-provider";
import { SheetProvider } from "@/providers/sheet-provider";

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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  title: {
    default: "Finance | Manage Your Wealth",
    template: "%s | Finance",
  },
  description:
    "Track your income and expenses, categorize transactions and assign them to specific accounts with ease.",
  openGraph: {
    title: "Finance Dashboard",
    description:
      "Track your income and expenses, categorize transactions and assign them to specific accounts.",
    url: "/",
    siteName: "Finance",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Finance | Manage Your Wealth",
    description:
      "Track your income and expenses, categorize transactions and assign them to specific accounts.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      lang="en"
    >
      <body>
        <ClerkProvider>
          <QueryProvider>
            <SheetProvider />
            <Toaster />
            {children}
          </QueryProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
