import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find the blog post with spaces in slug
  const post = await prisma.blogPost.findFirst({
    where: {
      slug: "What Is This"
    }
  });

  if (!post) {
    console.log('Post not found');
    return;
  }

  // Update to URL-friendly slug
  const updatedPost = await prisma.blogPost.update({
    where: { id: post.id },
    data: {
      slug: "what-is-this"
    }
  });

  console.log('✅ Slug updated successfully!');
  console.log('Old slug:', "What Is This");
  console.log('New slug:', updatedPost.slug);
  console.log('New URL:', `http://localhost:3000/blog/${updatedPost.slug}`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
