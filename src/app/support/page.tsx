// src/app/support/page.tsx
import type { Metadata } from "next";
import Reveal from "@/app/components/Reveal";
import SupportForm from "@/app/components/SupportForm";
import styles from "./support.module.css";

export const metadata: Metadata = {
  title: "Support & Help Center | Get On Blockchain",
  description:
    "Get help with your Get On Blockchain loyalty program. Support for merchants setting up rewards and customers using the platform. Contact our team.",
  keywords: [
    "Get On Blockchain support",
    "loyalty program help",
    "customer support",
    "merchant support",
    "rewards program help",
    "contact support",
  ],
  openGraph: {
    title: "Support - Get Help with Your Loyalty Program",
    description: "Need help with your rewards program? Contact our support team for assistance with setup, rewards, or account issues.",
    url: "https://getonblockchain.com/support",
  },
};

export default function SupportPage() {
  return (
    
      <div className={styles.page}>
        <section className={styles.hero}>
          <Reveal>
            <h1 className={styles.title}>Support For Your Rewards</h1>
          </Reveal>
          <Reveal>
            <p className={styles.subtitle}>
              Whether you&apos;re a business running rewards or a customer
              using them, send a note below and we&apos;ll follow up by email.
            </p>
          </Reveal>
        </section>

        <section className={styles.formSection}>
          <Reveal>
            <SupportForm />
          </Reveal>
        </section>
      </div>
    
  )
}
