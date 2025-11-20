// src/app/page.tsx
"use client";

import SmoothScroll from "./components/SmoothScroll";
import Reveal from "./components/Reveal";
import Hero from "./components/Hero";
import DemoSection from "./components/DemoSection";
import HowItWorks from "./components/HowItWorks";
import Offerings from "./components/Offerings";
import Pricing from "./components/Pricing";
import Faq from "./components/Faq";
import FinalCta from "./components/FinalCta";

export default function Home() {
  return (
    <SmoothScroll>
      <main>
        <Reveal selector=".section" y={40} stagger={0.16}>
          <Hero />
          <DemoSection />
          <HowItWorks />
          <Offerings />
          <Pricing />
          <Faq />
          <FinalCta />
        </Reveal>
      </main>
    </SmoothScroll>
  );
}
