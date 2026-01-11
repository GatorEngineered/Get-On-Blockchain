// src/app/demo-dashboards/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interactive Demo - Customer & Business Dashboards | Get On Blockchain",
  description:
    "Explore interactive demos of both customer and business dashboards. See how the loyalty platform works from both perspectives before signing up.",
  keywords: [
    "loyalty dashboard demo",
    "business rewards demo",
    "merchant dashboard preview",
    "loyalty platform demo",
    "rewards system demo",
    "customer dashboard example",
  ],
  openGraph: {
    title: "Demo Dashboards - See Both Sides of the Platform",
    description: "Interactive demo showing customer rewards tracking and business analytics. Explore before you commit.",
    url: "https://getonblockchain.com/demo-dashboards",
  },
};

export default function DemoDashboardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
