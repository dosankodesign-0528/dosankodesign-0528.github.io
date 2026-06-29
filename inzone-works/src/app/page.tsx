import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero from "@/components/sections/Hero";
import News from "@/components/sections/News";
import Coordinate from "@/components/sections/Coordinate";
import Service from "@/components/sections/Service";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <News />
        <Coordinate />
        <Service />
      </main>
      <Footer />
    </>
  );
}
