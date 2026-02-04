import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppShell from "@/app/components/AppShell";
import SmoothScroll from "@/app/components/SmoothScroll";
import Reveal from "@/app/components/Reveal";
import ClientProviders from "@/app/providers/ClientProviders";
import Footer from "@/app/components/Footer";
import CookieBanner from "@/app/components/CookieBanner";
import ErrorSuppressor from "@/app/components/ErrorSuppressor";
import SkipLink from "@/app/components/SkipLink";
import AccessibilityWidget from "@/app/components/AccessibilityWidget";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || "https://getonblockchain.com"
  ),
  title: {
    default: "Blockchain-Powered Loyalty Rewards Platform | Get On Blockchain",
    template: "%s | Get On Blockchain",
  },
  description:
    "The first blockchain-powered loyalty platform. QR-based rewards, USDC stablecoin payouts, branded loyalty tokens, and non-custodial wallets. Plans from $55-249/month.",
  keywords: [
    "blockchain loyalty program",
    "crypto rewards platform",
    "USDC stablecoin rewards",
    "branded loyalty token",
    "blockchain verified rewards",
    "QR code loyalty",
    "Polygon blockchain rewards",
    "non-custodial wallet loyalty",
    "customer retention blockchain",
    "digital loyalty tokens",
    "POS integration rewards",
    "cryptocurrency loyalty",
  ],
  openGraph: {
    title: "The First Blockchain-Powered Loyalty Platform",
    description:
      "Launch blockchain-verified rewards in minutes. USDC payouts, branded loyalty tokens, and non-custodial wallets. Plans from $55-249/month.",
    url: "https://getonblockchain.com",
    siteName: "Get On Blockchain",
    images: [
      {
        url: "/social-card-resized.png",
        width: 1200,
        height: 630,
        alt: "Get On Blockchain blockchain-powered loyalty rewards platform",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blockchain-Powered Loyalty Rewards Platform",
    description: "USDC payouts, branded tokens, blockchain-verified rewards. The future of loyalty.",
    images: ["/social-card-resized.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};
// Structured data for SEO
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://getonblockchain.com/#website",
      url: "https://getonblockchain.com",
      name: "Get On Blockchain",
      publisher: {
        "@id": "https://getonblockchain.com/#organization",
      },
      potentialAction: {
        "@type": "SearchAction",
        target: "https://getonblockchain.com/blog?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": "https://getonblockchain.com/#organization",
      name: "Get On Blockchain",
      url: "https://getonblockchain.com",
      logo: {
        "@type": "ImageObject",
        url: "https://getonblockchain.com/getonblockchain-logo-resized.png",
        width: 512,
        height: 512,
      },
      description:
        "The first blockchain-powered loyalty platform. USDC payouts, branded loyalty tokens, and blockchain-verified rewards.",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "Customer Support",
        email: "support@getonblockchain.com",
        availableLanguage: "English",
      },
      sameAs: [
        // Add your social media URLs here when available
        // "https://twitter.com/getonblockchain",
        // "https://linkedin.com/company/getonblockchain",
      ],
    },
    {
      "@type": "SiteNavigationElement",
      "@id": "https://getonblockchain.com/#navigation",
      name: "Main Navigation",
      hasPart: [
        {
          "@type": "SiteNavigationElement",
          name: "Pricing",
          url: "https://getonblockchain.com/pricing",
        },
        {
          "@type": "SiteNavigationElement",
          name: "ROI Calculator",
          url: "https://getonblockchain.com/roi-calculator",
        },
        {
          "@type": "SiteNavigationElement",
          name: "Business Login",
          url: "https://getonblockchain.com/dashboard/login",
        },
        {
          "@type": "SiteNavigationElement",
          name: "About",
          url: "https://getonblockchain.com/about",
        },
        {
          "@type": "SiteNavigationElement",
          name: "Blog",
          url: "https://getonblockchain.com/blog",
        },
        {
          "@type": "SiteNavigationElement",
          name: "Support",
          url: "https://getonblockchain.com/support",
        },
      ],
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://getonblockchain.com/#software",
      name: "Get On Blockchain Loyalty Platform",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "USD",
        lowPrice: "0",
        highPrice: "249",
        priceSpecification: [
          {
            "@type": "UnitPriceSpecification",
            price: "0.00",
            priceCurrency: "USD",
            name: "Starter Plan (Free)",
            billingDuration: "P1M",
          },
          {
            "@type": "UnitPriceSpecification",
            price: "55.00",
            priceCurrency: "USD",
            name: "Basic Plan",
            billingDuration: "P1M",
          },
          {
            "@type": "UnitPriceSpecification",
            price: "149.00",
            priceCurrency: "USD",
            name: "Premium Plan",
            billingDuration: "P1M",
          },
          {
            "@type": "UnitPriceSpecification",
            price: "249.00",
            priceCurrency: "USD",
            name: "Growth Plan",
            billingDuration: "P1M",
          },
        ],
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        reviewCount: "127",
      },
      description:
        "The first blockchain-powered loyalty platform. USDC stablecoin payouts, branded loyalty tokens, non-custodial wallets, and blockchain-verified rewards.",
      featureList: [
        "QR code loyalty rewards",
        "Blockchain-verified rewards",
        "USDC stablecoin payouts on Polygon",
        "Branded loyalty tokens",
        "Non-custodial member wallets",
        "POS integration (Square, Toast, Clover, Shopify)",
        "Points per dollar spent",
        "Real-time analytics dashboard",
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ErrorSuppressor />
        {/* Skip navigation for keyboard users - WCAG 2.4.1 */}
        <SkipLink />
        {/* Live region for screen reader announcements - WCAG 4.1.3 */}
        <div
          id="live-announcements"
          className="live-region"
          aria-live="polite"
          aria-atomic="true"
        />
        <ClientProviders>
          <SmoothScroll>
            <Reveal selector=".reveal">
              <AppShell>{children}</AppShell>
            </Reveal>
          </SmoothScroll>
        </ClientProviders>
        <CookieBanner />
        <Footer />
        <AccessibilityWidget />
      </body>
    </html>
  );
}