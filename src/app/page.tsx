// src/app/page.tsx
"use client";

import { lazy, Suspense } from "react";
import SmoothScroll from "./components/SmoothScroll";
import Reveal from "./components/Reveal";

// Above the fold - load immediately
import HeroNew from "./components/HeroNew";
import WhatYouCanDo from "./components/WhatYouCanDo";

// Below the fold - lazy load for better performance
const Faq = lazy(() => import("./components/Faq"));
const FinalCta = lazy(() => import("./components/FinalCta"));

export default function Home() {
  return (
    <SmoothScroll>
      <main>
        <Reveal selector=".section" y={40} stagger={0.16}>
          {/* Above the fold - loaded immediately */}
          <HeroNew />
          <WhatYouCanDo />

          {/* Below the fold - lazy loaded with Suspense */}
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
