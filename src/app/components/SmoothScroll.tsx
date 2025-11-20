"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    });

    // RAF loop
    let rafId = requestAnimationFrame(function loop(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(loop);
    });

    // Typed listener options
    const addOpts: AddEventListenerOptions = { capture: true, passive: false };
    const removeOpts: EventListenerOptions = { capture: true };

    const onKeyDown = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) {
        return;
      }

      const page = Math.round(window.innerHeight * 0.9);
      let dest: number | null = null;

      switch (e.key) {
        case "ArrowDown": dest = window.scrollY + 100; break;
        case "ArrowUp":   dest = window.scrollY - 100; break;
        case "PageDown":  dest = window.scrollY + page; break;
        case "PageUp":    dest = window.scrollY - page; break;
        case "Home":      dest = 0; break;
        case "End":       dest = document.documentElement.scrollHeight; break;
        case " ":
          dest = window.scrollY + (e.shiftKey ? -page : page);
          break;
        default:
          return;
      }

      e.preventDefault();
      lenis.scrollTo(dest);
    };

    document.addEventListener("keydown", onKeyDown, addOpts);

    return () => {
      document.removeEventListener("keydown", onKeyDown, removeOpts); // ✅ no 'any'
      cancelAnimationFrame(rafId);
      lenis.destroy();
      document.documentElement.style.scrollBehavior = prev;
    };
  }, []);

  return <>{children}</>;
}
