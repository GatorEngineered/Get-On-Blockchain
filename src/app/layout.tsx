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
    default: "Loyalty Program Software for Local Businesses | Get On Blockchain",
    template: "%s | Get On Blockchain",
  },
  description:
    "Increase foot traffic and repeat customers with our QR-based loyalty rewards platform. Easy setup, crypto payments (USDC), proven ROI. Starting at $49/month.",
  keywords: [
    "loyalty program software",
    "customer retention platform",
    "increase foot traffic",
    "repeat customer rewards",
    "loyalty program ROI",
    "QR code rewards",
    "USDC crypto payments",
    "local business loyalty program",
    "customer rewards system",
    "digital loyalty cards",
  ],
  openGraph: {
    title: "Loyalty Program That Increases Foot Traffic & Repeat Customers",
    description:
      "Launch a QR-based loyalty program in 30 minutes. Customers earn rewards, you see more repeat visits. Starting at $49/month with proven ROI.",
    url: "https://getonblockchain.com",
    siteName: "Get On Blockchain",
    images: [
      {
        url: "/social-card-resized.png",
        width: 1200,
        height: 630,
        alt: "Get On Blockchain loyalty rewards dashboard showing customer analytics",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Loyalty Program Software for Local Businesses",
    description: "Increase foot traffic with QR-based rewards. Easy setup, proven ROI.",
    images: ["/social-card-resized.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/getonblockchain-favicon-resized.png",
    shortcut: "/getonblockchain-favicon-resized.png",
    apple: "/getonblockchain-favicon-resized.png",
  },
};
// Structured data for SEO
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://getonblockchain.com/#organization",
      name: "Get On Blockchain",
      url: "https://getonblockchain.com",
      logo: "https://getonblockchain.com/getonblockchain-logo-resized.png",
      description:
        "Loyalty program software for local businesses. QR-based rewards, crypto payments, and customer retention tools.",
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
      "@type": "SoftwareApplication",
      "@id": "https://getonblockchain.com/#software",
      name: "Get On Blockchain Loyalty Platform",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "USD",
        lowPrice: "99",
        highPrice: "149",
        priceSpecification: [
          {
            "@type": "UnitPriceSpecification",
            price: "99.00",
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
        ],
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        reviewCount: "127",
      },
      description:
        "Complete loyalty program software for local businesses. Increase foot traffic and repeat customers with QR-based rewards, crypto payments (USDC), and real-time analytics.",
      featureList: [
        "QR code loyalty rewards",
        "Customer retention analytics",
        "USDC cryptocurrency payments",
        "Email and wallet-based rewards",
        "Customizable points and milestones",
        "Real-time dashboard",
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
      </body>
    </html>
  );
}