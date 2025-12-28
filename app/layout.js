import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import DashboardLayout from "@/components/UI/DashboardLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Agent Zdrowie",
  description: "Zadbaj o zdrowie z pomocą AI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 h-full text-slate-900`}
      >
        <SessionProvider>
          <DashboardLayout>{children}</DashboardLayout>
        </SessionProvider>
      </body>
    </html>
  );
}
