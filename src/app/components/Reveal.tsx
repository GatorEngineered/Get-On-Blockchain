// app/components/Reveal.tsx
"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

type Props = {
    selector?: string;
    y?: number;
    delay?: number;
    stagger?: number;
    duration?: number;       // ⟵ new
    ease?: string;           // ⟵ new (e.g., "power3.out", "expo.out")
    start?: string;          // ⟵ new (ScrollTrigger start)
    once?: boolean;
    children: React.ReactNode;
};

export default function Reveal({
    selector = ".reveal",
    y = 24,
    delay = 0,
    stagger = 0.08,
    duration = 0.7,
    ease = "power2.out",
    start = "top 85%",
    once = true,
    children,
}: Props) {
    const scope = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            const q = gsap.utils.selector(scope);
            const els = q(selector) as HTMLElement[];

            const reduce =
                typeof window !== "undefined" &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches;

            if (reduce) {
                els.forEach((el) => gsap.set(el, { autoAlpha: 1, y: 0 }));
                return;
            }

            els.forEach((el, i) => {
                gsap.fromTo(
                    el,
                    { autoAlpha: 0, y },
                    {
                        autoAlpha: 1,
                        y: 0,
                        duration,
                        ease,                              // ⟵ slower / smoother control
                        delay: delay + i * (stagger ?? 0), // ⟵ stagger in order found
                        scrollTrigger: {
                            trigger: el,
                            start,
                            toggleActions: "play none none reverse",
                            once,
                        },
                    }
                );
            });
        },
        { scope, dependencies: [selector, y, delay, stagger, duration, ease, start, once] }
    );

    return <div ref={scope}>{children}</div>;
}
