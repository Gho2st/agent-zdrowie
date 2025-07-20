import { ReactNode } from "react"; // Import ReactNode do typowania dzieci

interface ContainerProps {
  children: ReactNode; // Wyraźne typowanie prop children
}

export default function Container({ children }: ContainerProps) {
  return (
    <main className="px-[9%] py-24  min-h-[90vh] rounded-2xl bg-gradient-to-br from-white via-blue-50 to-green-100 shadow-2xl ">
      <div>{children}</div>
    </main>
  );
}
