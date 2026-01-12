import About from "@/components/homepage/About";
import Audience from "@/components/homepage/Audience";
import Safety from "@/components/homepage/Safety";
import Container from "@/components/UI/Container/Container";
import Cta from "@/components/homepage/Cta";

export default function App() {
  return (
    <Container>
      <About />
      <Safety />
      <Audience />
      <Cta />
    </Container>
  );
}
