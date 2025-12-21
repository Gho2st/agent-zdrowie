import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import Navigation from "@/components/UI/Navigation";
import { Toaster } from "react-hot-toast";
import Footer from "@/components/UI/Footer";

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-100 h-full`}
      >
        <SessionProvider>
          <div className="flex h-screen overflow-hidden">
            <div className="hidden md:block fixed top-0 left-0 w-72 h-screen z-40">
              <Navigation />
            </div>
            <div className="md:hidden">
              <Navigation />
            </div>
            <main
              id="scrollable"
              className="flex-1 ml-0 md:ml-64 2xl:ml-72 overflow-y-auto h-full"
            >
              {children}
              <Toaster position="top-right" reverseOrder={false} />
              <Footer />
            </main>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
