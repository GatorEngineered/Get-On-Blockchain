// Admin API: Get, Update, Delete single blog post
import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/app/lib/adminAuth";
import { logAdminAction } from "@/app/lib/adminAudit";
import { prisma } from "@/app/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require admin authentication
  const authResult = await requireAdminAuth();
  if ("error" in authResult) {
    return authResult.error;
  }

  try {
    const { id } = await params;

    const post = await prisma.blogPost.findUnique({
      where: { id },
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
    });

    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog post" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require admin authentication
  const authResult = await requireAdminAuth();
  if ("error" in authResult) {
    return authResult.error;
  }

  try {
    const { id } = await params;
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

    // Fetch existing post
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    // Check if slug is being changed and if it conflicts
    if (slug !== existingPost.slug) {
      const conflictingPost = await prisma.blogPost.findUnique({
        where: { slug },
      });

      if (conflictingPost) {
        return NextResponse.json(
          { error: "A post with this slug already exists" },
          { status: 400 }
        );
      }
    }

    // Determine if we should update publishedAt
    let publishedAt = existingPost.publishedAt;
    if (status === "PUBLISHED" && !existingPost.publishedAt) {
      publishedAt = new Date();
    }

    // Update the blog post
    const post = await prisma.blogPost.update({
      where: { id },
      data: {
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
        publishedAt,
      },
    });

    // Log the action
    await logAdminAction({
      adminId: authResult.admin.id,
      action: "EDIT_BLOG_POST",
      entityType: "BlogPost",
      entityId: post.id,
      changes: {
        before: {
          title: existingPost.title,
          status: existingPost.status,
        },
        after: {
          title: post.title,
          status: post.status,
        },
      },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Error updating blog post:", error);
    return NextResponse.json(
      { error: "Failed to update blog post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require admin authentication
  const authResult = await requireAdminAuth();
  if ("error" in authResult) {
    return authResult.error;
  }

  try {
    const { id } = await params;

    const post = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    await prisma.blogPost.delete({
      where: { id },
    });

    // Log the action
    await logAdminAction({
      adminId: authResult.admin.id,
      action: "DELETE_BLOG_POST",
      entityType: "BlogPost",
      entityId: id,
      changes: {
        before: {
          title: post.title,
          slug: post.slug,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    return NextResponse.json(
      { error: "Failed to delete blog post" },
      { status: 500 }
    );
  }
}
