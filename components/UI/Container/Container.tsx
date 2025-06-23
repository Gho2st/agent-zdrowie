import { ReactNode } from "react"; // Import ReactNode do typowania dzieci

interface ContainerProps {
  children: ReactNode; // Wyraźne typowanie prop children
}

export default function Container({ children }: ContainerProps) {
  return (
    <main className="p-10">
      <div className="rounded-2xl bg-gradient-to-br from-white via-blue-50 to-green-100 shadow-2xl p-8 h-full">
        {children}
      </div>
    </main>
  );
}
