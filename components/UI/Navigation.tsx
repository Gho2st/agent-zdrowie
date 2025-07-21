"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import RaportDownloadButton from "./RaportDownloadButton";
import { Menu, X } from "lucide-react";

export default function Navigation() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 🔧 TO: Przycisk HAMBURGERA – zawsze widoczny na mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-50  p-2 rounded"
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>

      {/* 🔧 TO: MENU */}
      <div
        className={`fixed top-0 left-0 h-screen w-72 bg-white px-8 py-10 z-40 flex flex-col justify-between transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static md:flex`}
      >
        {/* Logo */}
        <Link href="/" className="w-fit" onClick={() => setOpen(false)}>
          <Image
            src="/logo.png"
            alt="Logo Agent Zdrowie"
            width={0}
            height={0}
            sizes="100vw"
            className="w-auto h-32 object-contain"
            priority
          />
        </Link>

        {/* Menu */}
        <nav>
          <ul className="flex flex-col gap-6 text-xl font-bold mt-6">
            <li>
              <Link href="/" onClick={() => setOpen(false)}>
                Strona Główna
              </Link>
            </li>
            <li>
              <Link href="/centrum-zdrowia" onClick={() => setOpen(false)}>
                Panel Zdrowia
              </Link>
            </li>
            <li>
              <Link href="/agent" onClick={() => setOpen(false)}>
                Agent
              </Link>
            </li>
            <li>
              <Link href="/profil" onClick={() => setOpen(false)}>
                Profil
              </Link>
            </li>
            <li>
              <Link href="/pomiary" onClick={() => setOpen(false)}>
                Pomiary
              </Link>
            </li>
            <li>
              <Link href="/statystyki" onClick={() => setOpen(false)}>
                Statystyki
              </Link>
            </li>
            {session?.user ? (
              <li>
                <button
                  onClick={() => {
                    signOut();
                    setOpen(false);
                  }}
                  className="text-red-500 cursor-pointer underline"
                >
                  Wyloguj się
                </button>
              </li>
            ) : (
              <li>
                <Link
                  href="/logowanie"
                  className="text-green-500 cursor-pointer underline"
                  onClick={() => setOpen(false)}
                >
                  Zaloguj się
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Raport */}
        <div className="mt-10">
          <p className="mb-3 text-xl font-bold">Raport PDF</p>
          <RaportDownloadButton />
        </div>
      </div>
    </>
  );
}
