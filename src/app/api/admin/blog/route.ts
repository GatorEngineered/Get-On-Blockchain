// Admin API: Get all blog posts & Create new blog post
import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/app/lib/adminAuth";
import { logAdminAction } from "@/app/lib/adminAudit";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  // Require admin authentication
  const authResult = await requireAdminAuth();
  if ("error" in authResult) {
    return authResult.error;
  }

  try {
    const posts = await prisma.blogPost.findMany({
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Require admin authentication
  const authResult = await requireAdminAuth();
  if ("error" in authResult) {
    return authResult.error;
  }

  try {
    const body = await req.json();
    const {
      title,
      slug,
      description,
      content,
      category,
      readTimeMinutes,
      metaTitle,
      metaDescription,
      metaKeywords,
      status,
    } = body;

    // Validate required fields
    if (!title || !slug || !description || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug },
    });

    if (existingPost) {
      return NextResponse.json(
        { error: "A post with this slug already exists" },
        { status: 400 }
      );
    }

    // Create the blog post
    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        description,
        content,
        category: category || "Marketing",
        readTimeMinutes: readTimeMinutes || 5,
        metaTitle,
        metaDescription,
        metaKeywords,
        status: status || "DRAFT",
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        authorId: authResult.admin.id,
      },
    });

    // Log the action
    await logAdminAction({
      adminId: authResult.admin.id,
      action: "CREATE_BLOG_POST",
      entityType: "BlogPost",
      entityId: post.id,
      changes: {
        after: { title, slug, status },
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Error creating blog post:", error);
    return NextResponse.json(
      { error: "Failed to create blog post" },
      { status: 500 }
    );
  }
}
