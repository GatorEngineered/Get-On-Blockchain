// src/app/customer-demo/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customer Rewards Demo - See How Members Use the Platform | Get On Blockchain",
  description:
    "Interactive demo of the customer rewards experience. See how members track points, view rewards, and redeem perks. Try before you buy.",
  keywords: [
    "loyalty program demo",
    "customer rewards demo",
    "loyalty dashboard preview",
    "rewards program example",
    "customer portal demo",
  ],
  openGraph: {
    title: "Customer Demo - Experience the Rewards Platform",
    description: "See what your customers will experience. Interactive demo of points tracking, reward redemption, and member dashboard.",
    url: "https://getonblockchain.com/customer-demo",
  },
};

export default function CustomerDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
