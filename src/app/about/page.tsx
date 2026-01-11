// src/app/about/page.tsx
import Reveal from "@/app/components/Reveal";
import styles from "@/app/about/about.module.css";
import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "About Us - Modern Loyalty Programs for Local Businesses | Get On Blockchain",
  description:
    "Get On Blockchain helps local businesses increase repeat customers with QR-based loyalty rewards. Built on blockchain for transparency, but simple enough for any business to use.",
  keywords: [
    "about Get On Blockchain",
    "loyalty program company",
    "customer rewards platform",
    "blockchain loyalty",
    "local business loyalty",
    "modern rewards system",
    "small business loyalty software",
  ],
  openGraph: {
    title: "About Get On Blockchain - Loyalty That Feels Modern",
    description: "We help local businesses turn first-time visitors into regulars. QR-based rewards, blockchain transparency, simple setup.",
    url: "https://getonblockchain.com/about",
  },
};

export default function AboutPage() {
  return (
    <>
      {/* HERO */}
      <section className={styles.aboutHero}>
        <div className={styles.aboutHeroInner}>
          <div className={styles.aboutHeroCopy}>
            <Reveal>
              <p className={styles.eyebrow}>WHY GET ON BLOCKCHAIN EXISTS</p>
            </Reveal>

            <Reveal>
              <h1 className={styles.aboutHeroTitle}>
                Loyalty That Finally Feels{" "}
                <span className={styles.highlight}>Modern</span>.
              </h1>
            </Reveal>

            <Reveal>
              <p className={styles.aboutHeroSubtitle}>
                Get On Blockchain was created so local businesses don&apos;t get
                left behind while loyalty and payments move into the blockchain
                era. Instead of plastic punch cards, scattered apps, and
                &quot;maybe it tracked&quot; coupons, you get a simple, unified
                rewards system that lives where your customers already are – in
                their digital wallets.
              </p>
            </Reveal>

            <Reveal>
              <p className={styles.aboutHeroSubtitle}>
                You choose how customers earn and what they unlock. We handle
                the wallets, stablecoins, branded tokens, and NFT perks in the
                background – so it feels like a normal rewards program on the
                front end, with future-ready rails underneath.
              </p>
            </Reveal>
          </div>

          <Reveal>
            <div className={styles.aboutHeroCard}>
              <h3>Built for Real Businesses, Not Crypto Natives</h3>
              <ul>
                <li>No new hardware required.</li>
                <li>Scan a QR, tap a link, or claim at checkout.</li>
                <li>Your customers keep rewards in a wallet they control.</li>
                <li>
                  You keep full control over how points, perks, and tiers work.
                </li>
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* WHY / ROI */}
      <section className={styles.aboutBody}>
        <div className={styles.aboutBodyInner}>
          <Reveal>
            <div className={styles.aboutBodyBlock}>
              <h2>Why Now?</h2>
              <p>
                Customer engagement has changed. Social posts and one-off ads
                aren&apos;t enough to keep people coming back. Today&apos;s
                customers expect rewards that feel instant, digital, and a
                little bit gamified – something they can see, track, and
                actually use.
              </p>
              <p>
                Blockchain gives us a new toolkit: stablecoins, branded tokens,
                NFTs, and on-chain points that are programmable, portable, and
                verifiable. Get On Blockchain wraps that toolkit into a rewards
                system any local business can turn on without becoming a Web3
                expert.
              </p>
            </div>
          </Reveal>

          <Reveal>
            <div className={styles.aboutBodyBlock}>
              <h2>What Makes This Different?</h2>
              <p>
                Most loyalty tools are either rigid, expensive, or locked inside
                someone else&apos;s app. With Get On Blockchain:
              </p>
              <ul>
                <li>You design the earning rules and perks that fit your brand.</li>
                <li>
                  Rewards can be stablecoin, a branded coin, NFTs, or points –
                  all handled under the hood.
                </li>
                <li>
                  Customers don&apos;t need to understand crypto to enjoy the
                  benefits.
                </li>
                <li>
                  You can grow from simple points to on-chain perks over time,
                  without re-platforming.
                </li>
              </ul>
            </div>
          </Reveal>

          <Reveal>
            <div className={styles.aboutBodyBlock}>
              <h2>What Can I Expect in Return?</h2>
              <p>
                While every business is different, loyalty programs similar to
                Get On Blockchain often see double-digit increases in repeat
                visits and revenue when they&apos;re actively promoted.
              </p>
              <p>
                For many local businesses, just a handful of extra visits per
                day can more than cover a $99/month plan – and everything
                beyond that is upside.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* VALUE CARDS – updated copy with points/transparency */}
      <section className={styles.aboutValues}>
        <div className={styles.aboutValuesInner}>
          <Reveal>
            <h2 className={styles.aboutValuesTitle}>
              Four Building Blocks of Your New Rewards System
            </h2>
          </Reveal>

          <div className={styles.aboutValuesGrid}>
            <Reveal>
              <div className={styles.aboutValueCard}>
                <h3>Stablecoin Rewards</h3>
                <p>
                  Reward customers with digital dollars that feel like real
                  value – not points that quietly expire. Stablecoin payouts can
                  mirror a cash discount while staying programmable and
                  trackable on-chain.
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div className={styles.aboutValueCard}>
                <h3>Branded Coins</h3>
                <p>
                  Issue your own store currency that lives in the wallet instead
                  of on a plastic card. You control how it&apos;s earned, where
                  it can be spent, and how it connects in-store, online, and at
                  special events.
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div className={styles.aboutValueCard}>
                <h3>NFT Access &amp; Perks</h3>
                <p>
                  Turn memberships, tiers, or VIP clubs into digital passes that
                  unlock perks automatically. Customers don&apos;t see the NFT
                  complexity – they just see, &quot;I have access.&quot;
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div className={styles.aboutValueCard}>
                <h3>Points &amp; Transparency</h3>
                <p>
                  Every visit, purchase, or action can earn on-chain points so
                  both you and your customers see exactly what&apos;s been
                  earned and redeemed. No more fuzzy punch cards – just clear,
                  auditable rewards.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

     
    </>
  );
}
