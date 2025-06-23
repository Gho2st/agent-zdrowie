import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import Navigation from "@/components/UI/Navigation";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agent Zdrowie",
  description: "Zadbaj o zdrowie z pomocą AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-100`}
      >
        <SessionProvider>
          <div className="flex">
            <Navigation />
            <div className="xl:pl-72 2xl:pl-100 w-full">
              {children}
              <Toaster position="top-right" reverseOrder={false} />
            </div>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
