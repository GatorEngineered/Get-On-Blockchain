// src/app/blog/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import styles from "./blog.module.css";
import { prisma } from "@/app/lib/prisma";

export const metadata: Metadata = {
  title: "Blog - Loyalty Program Tips & Guides | Get On Blockchain",
  description:
    "Expert guides on customer retention, loyalty programs, and increasing foot traffic. Learn how to grow your business with proven strategies.",
  keywords: [
    "loyalty program tips",
    "customer retention strategies",
    "increase foot traffic",
    "small business marketing",
    "loyalty program guide",
    "QR code loyalty",
    "repeat customers",
  ],
  openGraph: {
    title: "Loyalty Program Resources & Guides",
    description: "Expert tips on customer retention and loyalty programs for local businesses.",
    url: "https://getonblockchain.com/blog",
  },
};

// Static fallback posts for when DB is empty or has errors
const fallbackPosts = [
  {
    slug: "increase-restaurant-foot-traffic-2025",
    title: "10 Ways to Increase Restaurant Foot Traffic in 2025",
    description: "Proven strategies to attract more diners and fill your tables. From loyalty programs to local SEO, discover what actually works.",
    category: "Restaurant Marketing",
    readTimeMinutes: 8,
    publishedAt: new Date("2024-12-28"),
  },
  {
    slug: "loyalty-program-roi-guide",
    title: "Loyalty Program ROI: Complete Guide for Small Businesses",
    description: "Calculate exact returns from customer loyalty programs. Real numbers, real examples, and how to measure what matters.",
    category: "Business Growth",
    readTimeMinutes: 10,
    publishedAt: new Date("2024-12-27"),
  },
  {
    slug: "qr-code-loyalty-vs-punch-cards",
    title: "QR Code Loyalty Programs vs Traditional Punch Cards",
    description: "Modern QR-based rewards crush old-school punch cards. Here's why digital loyalty wins every time.",
    category: "Technology",
    readTimeMinutes: 6,
    publishedAt: new Date("2024-12-26"),
  },
  {
    slug: "customer-retention-strategies-local-businesses",
    title: "7 Customer Retention Strategies That Actually Work",
    description: "Stop chasing new customers. Learn how to keep the ones you have coming back more often.",
    category: "Customer Retention",
    readTimeMinutes: 7,
    publishedAt: new Date("2024-12-25"),
  },
];

async function getBlogPosts() {
  try {
    // Fetch published blog posts from database
    const posts = await prisma.blogPost.findMany({
      where: {
        status: "PUBLISHED",
      },
      select: {
        slug: true,
        title: true,
        description: true,
        category: true,
        readTimeMinutes: true,
        publishedAt: true,
      },
      orderBy: {
        publishedAt: "desc",
      },
    });

    // Return DB posts if available, otherwise fallback
    return posts.length > 0 ? posts : fallbackPosts;
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    // Return fallback posts if DB error
    return fallbackPosts;
  }
}

export default async function BlogPage() {
  const blogPosts = await getBlogPosts();
  return (
    <main className={styles.blogPage}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>
            Resources & Guides
          </h1>
          <p className={styles.heroSubtitle}>
            Expert tips on customer retention, loyalty programs, and growing your local business.
          </p>
        </div>
      </section>

      <section className={styles.articles}>
        <div className={styles.articlesInner}>
          <div className={styles.articlesGrid}>
            {blogPosts.map((post) => (
              <article key={post.slug} className={styles.articleCard}>
                <div className={styles.articleMeta}>
                  <span className={styles.articleCategory}>{post.category}</span>
                  <span className={styles.articleReadTime}>
                    {post.readTimeMinutes} min read
                  </span>
                </div>
                <h2 className={styles.articleTitle}>
                  <Link href={`/blog/${post.slug}`}>
                    {post.title}
                  </Link>
                </h2>
                <p className={styles.articleDescription}>
                  {post.description}
                </p>
                <div className={styles.articleFooter}>
                  <span className={styles.articleDate}>
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }) : ""}
                  </span>
                  <Link href={`/blog/${post.slug}`} className={styles.readMore}>
                    Read Article →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <h2>Ready to Boost Customer Retention?</h2>
          <p>Start your loyalty program today and see real ROI within 30 days.</p>
          <div className={styles.ctaButtons}>
            <Link href="/roi-calculator" className={styles.ctaPrimary}>
              Calculate Your ROI
            </Link>
            <Link href="/pricing" className={styles.ctaSecondary}>
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
