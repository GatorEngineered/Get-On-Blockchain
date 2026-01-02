// src/app/page.tsx
"use client";

import { lazy, Suspense } from "react";
import SmoothScroll from "./components/SmoothScroll";
import Reveal from "./components/Reveal";

// Above the fold - load immediately
import Hero from "./components/Hero";
import ResultsSection from "./components/ResultsSection";
import IndustriesSection from "./components/IndustriesSection";
import HowItWorks from "./components/HowItWorks";
import Offerings from "./components/Offerings";

// Below the fold - lazy load for better performance
const DemoSection = lazy(() => import("./components/DemoSection"));
const Pricing = lazy(() => import("./components/Pricing"));
const Faq = lazy(() => import("./components/Faq"));
const FinalCta = lazy(() => import("./components/FinalCta"));

export default function Home() {
  return (
    <SmoothScroll>
      <main>
        <Reveal selector=".section" y={40} stagger={0.16}>
          {/* Above the fold - loaded immediately */}
          <Hero />
          <ResultsSection />
          <IndustriesSection />

          {/* Below the fold - lazy loaded with Suspense */}
          <Suspense fallback={<div className="section" style={{ minHeight: "400px" }} />}>
            <DemoSection />
          </Suspense>

          <HowItWorks />
          <Offerings />

          <Suspense fallback={<div className="section" style={{ minHeight: "500px" }} />}>
            <Pricing />
          </Suspense>

          <Suspense fallback={<div className="section" style={{ minHeight: "400px" }} />}>
            <Faq />
          </Suspense>

          <Suspense fallback={<div className="section" style={{ minHeight: "300px" }} />}>
            <FinalCta />
          </Suspense>
        </Reveal>
      </main>
    </SmoothScroll>
  );
}
