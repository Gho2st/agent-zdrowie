import { ReactNode } from "react"; // Import ReactNode do typowania dzieci

interface ContainerProps {
  children: ReactNode; // Wyraźne typowanie prop children
}

export default function Container({ children }: ContainerProps) {
  return (
    <main className="px-[9%] py-24  min-h-[100vh] rounded-2xl bg-gradient-to-br from-blue-100 via-blue-200 to-purple-200 shadow-2xl ">
      <div>{children}</div>
    </main>
  );
}
