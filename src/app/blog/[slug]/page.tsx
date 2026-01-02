// Dynamic blog post page - fetches from database
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import styles from "../article.module.css";
import { prisma } from "@/app/lib/prisma";

type Props = {
  params: Promise<{ slug: string }>;
};

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { slug, status: "PUBLISHED" },
    select: {
      title: true,
      description: true,
      metaTitle: true,
      metaDescription: true,
      metaKeywords: true,
    },
  });

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.description,
    keywords: post.metaKeywords?.split(",").map((k) => k.trim()),
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.description,
      url: `https://getonblockchain.com/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  // Fetch the blog post from database
  const post = await prisma.blogPost.findUnique({
    where: {
      slug,
      status: "PUBLISHED",
    },
    select: {
      title: true,
      description: true,
      content: true,
      category: true,
      readTimeMinutes: true,
      publishedAt: true,
    },
  });

  // Return 404 if post doesn't exist
  if (!post) {
    notFound();
  }

  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <main className={styles.articlePage}>
      <article className={styles.article}>
        <header className={styles.articleHeader}>
          <div className={styles.articleMeta}>
            <span className={styles.category}>{post.category}</span>
            <span className={styles.readTime}>{post.readTimeMinutes} min read</span>
          </div>
          <h1 className={styles.title}>{post.title}</h1>
          <p className={styles.subtitle}>{post.description}</p>
          <div className={styles.authorDate}>
            <span>{formattedDate}</span>
          </div>
        </header>

        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </main>
  );
}
