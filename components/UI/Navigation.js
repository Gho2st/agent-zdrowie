"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import RaportDownloadButton from "./RaportDownloadButton";
import {
  Menu,
  X,
  Home,
  LayoutDashboard,
  Bot,
  User,
  Activity,
  BarChart2,
  LogOut,
  FileText,
  LogIn,
} from "lucide-react";

export default function Navigation() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { href: "/", label: "Start", icon: Home },
    { href: "/centrum-zdrowia", label: "Panel Zdrowia", icon: LayoutDashboard },
    { href: "/agent", label: "Asystent AI", icon: Bot },
    { href: "/pomiary", label: "Dziennik", icon: Activity },
    { href: "/statystyki", label: "Statystyki", icon: BarChart2 },
    { href: "/profil", label: "Twój Profil", icon: User },
  ];

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [open]);

  return (
    <>
      {/* HAMBURGER (MOBILE) */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 bg-white/90 backdrop-blur-md rounded-xl shadow-sm border border-gray-200 text-gray-700 hover:text-emerald-600 transition-all active:scale-95"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* BACKDROP (MOBILE) */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${
          open ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* SIDEBAR */}
      <aside
        className={`fixed top-0 left-0 h-screen w-72 bg-white border-r border-gray-100 z-50 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static md:flex`}
      >
        {/* 1. LOGO */}
        <div className="p-6 flex items-center justify-between">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="relative block w-40"
          >
            <Image
              src="/images/logo.png"
              alt="Agent Zdrowie"
              width={160}
              height={50}
              className="object-contain"
              priority
            />
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="md:hidden p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 2. NAWIGACJA - POPRAWIONE ODSTĘPY */}
        {/* space-y-2 dodaje 8px przerwy między każdym elementem Link */}
        <nav className="flex-1 px-4 overflow-y-auto custom-scrollbar space-y-2 mt-2">
          <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Menu
          </p>

          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                // Zmiana: py-2.5 (było py-3) - przycisk jest nieco niższy, zgrabniejszy
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 font-semibold shadow-sm ring-1 ring-emerald-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon
                  className={`w-5 h-5 transition-colors ${
                    isActive
                      ? "text-emerald-600"
                      : "text-gray-400 group-hover:text-emerald-500"
                  }`}
                />
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-300" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* 3. RAPORT */}
        <div className="px-4 mb-4">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4 text-center">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-emerald-600">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-gray-800 text-sm mb-1">
              Twój Raport
            </h4>
            <p className="text-xs text-gray-500 mb-3 leading-snug">
              Pobierz podsumowanie PDF.
            </p>
            <div className="[&>button]:w-full [&>button]:py-2 [&>button]:text-xs">
              <RaportDownloadButton />
            </div>
          </div>
        </div>

        {/* 4. USER PROFIL */}
        <div className="p-4 border-t border-gray-100">
          {session?.user ? (
            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="relative shrink-0">
                <Image
                  src={session.user?.image || "/images/placeholder-avatar.png"}
                  alt="Avatar"
                  width={36}
                  height={36}
                  className="rounded-full border border-gray-200"
                />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {session.user.name?.split(" ")[0]}
                </p>
                <p className="text-[10px] text-gray-500 truncate">
                  {session.user.email}
                </p>
              </div>

              <button
                onClick={() => signOut()}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Wyloguj się"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/logowanie"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg"
            >
              <LogIn className="w-4 h-4" />
              <span className="text-sm">Zaloguj się</span>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
