import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Causes } from "@/components/sections/Causes";
import { CustomDonation } from "@/components/sections/CustomDonation";
import { Stats } from "@/components/sections/Stats";
import { Events } from "@/components/sections/Events";
import { Volunteers } from "@/components/sections/Volunteers";
import { Team } from "@/components/sections/Team";
import { Testimonials } from "@/components/sections/Testimonials";
import { Blog } from "@/components/sections/Blog";
import { MarqueeGallery } from "@/components/sections/MarqueeGallery";
import { ContactBar } from "@/components/sections/ContactBar";
import { Footer } from "@/components/sections/Footer";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen selection:bg-brand-orange selection:text-white">
      <Navbar />
      <Hero />
      <About />
      <Causes />
      <CustomDonation />
      <Stats />
      <Events />
      <Volunteers />
      <Team />
      <Testimonials />
      <Blog />
      <MarqueeGallery />
      <ContactBar />
      <Footer />
    </main>
  );
}
