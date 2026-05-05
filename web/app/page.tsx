import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { PerfStrip } from "@/components/PerfStrip";
import { HowItWorks } from "@/components/HowItWorks";
import { SecuritySection } from "@/components/SecuritySection";
import { Pricing } from "@/components/Pricing";
import { CTA } from "@/components/CTA";
import { Testimonials } from "@/components/Testimonials";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <PerfStrip />
        <HowItWorks />
        <SecuritySection />
        <Testimonials />
        <Pricing compact />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
