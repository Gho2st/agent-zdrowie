"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import {
  Menu,
  X,
  Home,
  LayoutDashboard,
  Bot,
  Activity,
  BarChart2,
  User,
  LogOut,
  LogIn,
  HeartPulse,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function Navigation({ isCollapsed, toggleSidebar }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();

  const menuItems = [
    { href: "/", label: "Start", icon: Home },
    { href: "/centrum-zdrowia", label: "Panel Zdrowia", icon: LayoutDashboard },
    { href: "/agent", label: "Asystent AI", icon: Bot },
    { href: "/pomiary", label: "Pomiary", icon: Activity },
    { href: "/statystyki", label: "Statystyki", icon: BarChart2 },
    { href: "/profil", label: "Twój Profil", icon: User },
  ];

  useEffect(() => {
    if (window.innerWidth < 1024 && isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMobileOpen]);

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white/90 backdrop-blur-md rounded-xl shadow-sm border border-slate-200 text-slate-700 active:scale-95 transition-all"
      >
        <Menu className="w-6 h-6" />
      </button>

      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-screen bg-white border-r border-slate-200 z-50 flex flex-col 
          transition-all duration-300 ease-in-out
          /* Mobile styles */
          ${
            isMobileOpen
              ? "translate-x-0 w-64 shadow-2xl"
              : "-translate-x-full w-64"
          }
          /* Desktop styles (override mobile) */
          lg:translate-x-0 lg:shadow-none
          ${isCollapsed ? "lg:w-20" : "lg:w-64"}
        `}
      >
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex absolute -right-3 top-9 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-colors shadow-sm z-50"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div
          className={`h-20 flex items-center ${
            isCollapsed ? "lg:justify-center" : "px-6 justify-between"
          } border-b border-slate-100 transition-all`}
        >
          <Link
            href="/"
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center gap-2 group overflow-hidden whitespace-nowrap"
          >
            <div className="shrink-0 w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <HeartPulse className="w-5 h-5" />
            </div>
            <span
              className={`font-bold text-lg text-slate-800 tracking-tight transition-opacity duration-200 ${
                isCollapsed ? "lg:opacity-0 lg:w-0" : "opacity-100"
              }`}
            >
              Agent Zdrowie
            </span>
          </Link>

          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1 text-slate-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-2 custom-scrollbar overflow-x-hidden">
          {!isCollapsed && (
            <p className="px-4 text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 transition-opacity duration-200 whitespace-nowrap">
              Aplikacja
            </p>
          )}

          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                title={isCollapsed ? item.label : ""}
                className={`
                  group flex items-center gap-4 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200
                  ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  }
                  ${isCollapsed ? "lg:justify-center lg:px-0" : ""}
                `}
              >
                <Icon
                  className={`w-6 h-6 shrink-0 transition-colors ${
                    isActive
                      ? "text-emerald-600"
                      : "text-slate-500 group-hover:text-emerald-600"
                  }`}
                />

                <span
                  className={`whitespace-nowrap transition-all duration-200 text-base ${
                    isCollapsed
                      ? "lg:w-0 lg:opacity-0 lg:overflow-hidden"
                      : "w-auto opacity-100"
                  }`}
                >
                  {item.label}
                </span>

                {isActive && !isCollapsed && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-5 border-t border-slate-100 bg-slate-50/60">
          {session?.user ? (
            <div
              className={`flex items-center gap-4 ${
                isCollapsed ? "lg:justify-center lg:p-2" : "p-3"
              } rounded-xl bg-white border border-slate-200 shadow-sm transition-all`}
            >
              <div className="relative shrink-0">
                <Image
                  src={session.user?.image || "/images/placeholder-avatar.png"}
                  alt="Avatar"
                  width={44}
                  height={44}
                  className="rounded-full bg-slate-100 object-cover"
                />
              </div>

              <div
                className={`flex-1 min-w-0 transition-all duration-200 ${
                  isCollapsed ? "lg:w-0 lg:opacity-0 lg:hidden" : "block"
                }`}
              >
                <p className="text-base font-bold text-slate-900 truncate">
                  {session.user.name?.split(" ")[0]}
                </p>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {session.user.email}
                </p>
              </div>

              {!isCollapsed && (
                <button
                  onClick={() => signOut()}
                  className="p-2 text-slate-500 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              )}
            </div>
          ) : (
            <Link
              href="/logowanie"
              className={`flex items-center justify-center ${
                isCollapsed ? "w-12 h-12 p-0" : "w-full py-3 gap-3"
              } bg-slate-900 text-white rounded-xl transition-all text-base font-medium`}
            >
              <LogIn className="w-5 h-5" />
              {!isCollapsed && <span>Zaloguj się</span>}
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
