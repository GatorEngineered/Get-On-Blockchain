// src/app/support/page.tsx
import type { Metadata } from "next";
import Reveal from "@/app/components/Reveal";
import SupportForm from "@/app/components/SupportForm";
import styles from "./support.module.css";

export const metadata: Metadata = {
  title: "Support – Get On Blockchain",
  description:
    "Support for merchants and customers using Get On Blockchain rewards.",
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
