import { ReactNode } from "react"; // Import ReactNode do typowania dzieci

interface ContainerProps {
  children: ReactNode; // Wyraźne typowanie prop children
}

export default function Container({ children }: ContainerProps) {
  return (
    <main className="p-10 flex-1">
      <section className="bg-gray-200 rounded-2xl shadow-2xl p-8 h-full">
        {children}
      </section>
    </main>
  );
}
