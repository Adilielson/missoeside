import { createFileRoute } from "@tanstack/react-router";
import { Helmet } from "react-helmet-async";
import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Causes } from "@/components/sections/Causes";

import { Stats } from "@/components/sections/Stats";
import { Events } from "@/components/sections/Events";
import { Volunteers } from "@/components/sections/Volunteers";

// import { Testimonials } from "@/components/sections/Testimonials";
import { News } from "@/components/sections/News";
import { MarqueeGallery } from "@/components/sections/MarqueeGallery";
import { ContactBar } from "@/components/sections/ContactBar";
import { Footer } from "@/components/sections/Footer";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen selection:bg-brand-orange selection:text-white">
      <Helmet>
        <title>Agência Cristã Missionária IDE | Transformando Vidas no Mundo</title>
        <meta name="description" content="Alcançando vidas através do evangelho e da ação social. Seja um missionário e ajude a transformar realidades globais com sua doação." />
        <meta property="og:title" content="Agência Cristã Missionária IDE | Transformando Vidas no Mundo" />
        <meta property="og:description" content="Levar esperança, dignidade e o amor de DEUS a todos que necessitam, promovendo transformação espiritual e social." />
        <meta name="keywords" content="missões, agência missionária, doação cristã, evangelho, ajuda humanitária, IDE, igreja cristã" />
      </Helmet>
      <Navbar />
      <Hero />
      <About />
      <Causes />
      <Stats />
      {/* <Events /> oculto temporariamente no front — admin/back continua funcionando */}
      <Volunteers />
      
      {/* <Testimonials /> oculto temporariamente */}
      <News />
      <MarqueeGallery />
      <ContactBar />
      <Footer />
    </main>
  );
}
