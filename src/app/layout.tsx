import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppShell from "@/app/components/AppShell"; // 🔹 new
import  SmoothScroll  from "@/app/components/SmoothScroll";
import Reveal from "@/app/components/Reveal";
import { WalletProvider } from "@/app/providers/WalletProviders";
import Footer from "@/app/components/Footer";
import CookieBanner from "@/app/components/CookieBanner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://getonblockchain.com"),
  title: {
    default: "Get On Blockchain | Web3 Rewards for Local Businesses & Brands",
    template: "%s | Get On Blockchain",
  },
  description:
    "QR-based loyalty rewards for local businesses, creators, and brands. Let customers earn and redeem points, accept USDC payments, and boost retention with automated Web3 rewards.",
  keywords: [
    "loyalty program",
    "customer rewards",
    "web3 loyalty",
    "blockchain rewards",
    "USDC payments",
    "local business marketing",
    "customer retention platform",
    "digital loyalty cards",
    "member retention platform",
  ],
  openGraph: {
    title: "Get On Blockchain | Web3 Rewards for Local Businesses & Brands",
    description:
      "Launch a modern rewards program with QR codes, member wallets, and USDC payments — without your team touching on-chain complexity.",
    url: "https://getonblockchain.com",
    siteName: "Get On Blockchain",
    images: [
      {
        url: "/social-card.png", // optional if you haven't added this yet
        width: 1200,
        height: 630,
        alt: "Dashboard and QR claim page for Get On Blockchain loyalty rewards",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/getonblockchain-favicon.png",
    shortcut: "/getonblockchain-favicon.png",
    apple: "/getonblockchain-favicon.png",
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <WalletProvider>
          <SmoothScroll>
            <Reveal selector=".reveal">
              <AppShell>{children}</AppShell>
            </Reveal>
          </SmoothScroll>
        </WalletProvider>
        <CookieBanner />
        <Footer/>
      </body>
    </html>
  );
}