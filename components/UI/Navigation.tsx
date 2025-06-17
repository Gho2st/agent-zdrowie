'use client'
import Link from "next/link";
import { signOut } from "next-auth/react";

export default function Navigation() {
  return (
    <aside className="flex flex-col justify-between w-3/12 px-8 py-10 h-screen">
      <div className="text-4xl font-bold">Agent Zdrowie</div>
      <nav>
        <ul className="flex flex-col gap-6">
          <li>
            <Link href={"/profil"}>Profil</Link>
          </li>
          <li>
            <Link href={"/pomiary"}>Pomiary</Link>
          </li>
          <li>
            <Link href={"/statystyki"}>Statystyki</Link>
          </li>
          <li>
            <button
              onClick={() => signOut()}
              className="text-red-500 underline"
            >
              Wyloguj się
            </button>
          </li>
        </ul>
      </nav>
      <div>
        <p className="mb-10 text-2xl font-bold">Raport PDF</p>
        <button className="bg-green-500 w-full py-5 rounded-3xl text-2xl font-bold">
          Pobierz
        </button>
      </div>
    </aside>
  );
}
