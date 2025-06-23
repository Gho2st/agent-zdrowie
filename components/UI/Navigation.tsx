"use client";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import Image from "next/image";

export default function Navigation() {
  const { data: session } = useSession();

  return (
    <aside className="fixed top-0 left-0 h-screen w-72 px-8 py-10 z-50 flex flex-col justify-between">
      <Link href="/" className="w-fit">
        <Image
          src="/logo.png"
          alt="Logo Agent Zdrowie"
          width={0}
          height={0}
          sizes="100vw"
          className="w-auto h-40 object-contain"
          priority
        />
      </Link>
      <nav>
        <ul className="flex flex-col gap-6 text-xl font-bold">
          <li>
            <Link href={"/centrum-zdrowia"}>Centrum Zdrowia</Link>
          </li>
          <li>
            <Link href={"/agent"}>Agent</Link>
          </li>
          <li>
            <Link href={"/profil"}>Profil</Link>
          </li>
          <li>
            <Link href={"/pomiary"}>Pomiary</Link>
          </li>
          <li>
            <Link href={"/statystyki"}>Statystyki</Link>
          </li>
          {session?.user ? (
            <li>
              <button
                onClick={() => signOut()}
                className="text-red-500 underline"
              >
                Wyloguj się
              </button>
            </li>
          ) : (
            <li>
              <Link className="text-green-500 underline" href={"/logowanie"}>Zaloguj się</Link>
            </li>
          )}
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
