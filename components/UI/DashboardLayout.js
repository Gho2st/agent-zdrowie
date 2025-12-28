"use client";

import { useState } from "react";
import Navigation from "@/components/UI/Navigation";
import Footer from "@/components/UI/Footer";
import { Toaster } from "react-hot-toast";

export default function DashboardLayout({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="relative min-h-screen">
      <Navigation
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main
        className={`
          min-h-screen flex flex-col transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"}
        `}
      >
        {children}
        <Footer />
        <Toaster position="top-right" />
      </main>
    </div>
  );
}
