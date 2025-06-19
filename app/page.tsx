import About from "@/components/homepage/About";
import Container from "@/components/UI/Container/Container";
import Image from "next/image";

export default function App() {
  return (
    <Container>
      <div className="p-8">
        <About />
      </div>
    </Container>
  );
}
