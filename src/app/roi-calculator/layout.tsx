// src/app/roi-calculator/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ROI Calculator - Loyalty Program Return on Investment | Get On Blockchain",
  description:
    "Calculate your exact ROI from a loyalty rewards program. See how much additional revenue you could generate. Interactive calculator for restaurants, retail, fitness, and salons.",
  keywords: [
    "loyalty program ROI calculator",
    "customer retention ROI",
    "loyalty program return on investment",
    "calculate loyalty program ROI",
    "loyalty rewards calculator",
    "customer rewards ROI",
  ],
  openGraph: {
    title: "Free ROI Calculator - See Your Loyalty Program Returns",
    description: "Calculate how much revenue a loyalty program could generate for your business. Adjust numbers to match your business.",
    url: "https://getonblockchain.com/roi-calculator",
  },
};

export default function CalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
