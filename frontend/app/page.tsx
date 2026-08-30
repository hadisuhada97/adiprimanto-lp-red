import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import HappyClients from "./components/HappyClients";
import About from "./components/About";
import PainPoints from "./components/PainPoints";
import Services from "./components/Services";
import Portfolio from "./components/Portfolio";
import Process from "./components/Process";
import Testimonial from "./components/Testimonial";
import TechStack from "./components/TechStack";
import FAQ from "./components/FAQ";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";

export default function Home() {
  return (
    <div className="selection:bg-blue-500 selection:text-white">
      <Navbar />
      <main id="main-content">
        <Hero />
        <HappyClients />
        <About />
        <TechStack />
        <PainPoints />
        <Services />
        <Portfolio />
        <Process />
        <Testimonial />
        <FAQ />
        <Contact />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
