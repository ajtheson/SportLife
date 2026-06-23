import type { Prisma } from "@prisma/client";
import {
  CommunityPostType,
  ConfigStatus,
  ContentStatus,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import type { CommentFormInput, CommunityPostFormInput, ContentTargetType } from "./community-schemas";

export async function getCommunityFormData() {
  const [sports, areas] = await Promise.all([
    prisma.sport.findMany({
      where: { status: ConfigStatus.ACTIVE },
      orderBy: { name: "asc" },
    }),
    prisma.area.findMany({
      where: { city: "Hanoi", status: ConfigStatus.ACTIVE },
      orderBy: [{ type: "desc" }, { name: "asc" }],
    }),
  ]);

  return { sports, areas, postTypes: Object.values(CommunityPostType) };
}

export async function listCommunityPosts(filters: {
  sportId?: string;
  areaId?: string;
  postType?: CommunityPostType;
  tab?: "all" | "mine";
  viewerId?: string;
  q?: string;
  skip?: number;
  take?: number;
}) {
  const where: Prisma.CommunityPostWhereInput = {
    status: filters.tab === "mine" ? { in: [ContentStatus.PENDING, ContentStatus.VISIBLE] } : ContentStatus.VISIBLE,
    authorId: filters.tab === "mine" ? filters.viewerId : undefined,
    sportId: filters.sportId || undefined,
    areaId: filters.areaId || undefined,
    postType: filters.postType,
    ...(filters.q
      ? { title: { contains: filters.q, mode: "insensitive" as const } }
      : {}),
  };

  const [totalCount, items] = await Promise.all([
    prisma.communityPost.count({ where }),
    prisma.communityPost.findMany({
      where,
      include: {
        author: { select: { email: true, playerProfile: true } },
        sport: true,
        area: true,
        _count: { select: { comments: { where: { status: ContentStatus.VISIBLE } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: filters.skip,
      take: filters.take,
    }),
  ]);

  return { items, totalCount };
}

export async function getCommunityPost(postId: string, viewer?: { id: string; isAdmin: boolean }) {
  const accessConditions: Prisma.CommunityPostWhereInput[] = [{ status: ContentStatus.VISIBLE }];

  if (viewer?.id) {
    accessConditions.push({ authorId: viewer.id });
  }

  if (viewer?.isAdmin) {
    accessConditions.push({});
  }

  return prisma.communityPost.findFirst({
    where: {
      id: postId,
      status: { not: ContentStatus.DELETED },
      OR: accessConditions,
    },
    include: {
      author: { select: { id: true, email: true, playerProfile: true } },
      sport: true,
      area: true,
      comments: {
        where: { status: ContentStatus.VISIBLE },
        include: { author: { select: { id: true, email: true, playerProfile: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function getEditableCommunityPost(postId: string, authorId: string) {
  return prisma.communityPost.findFirst({
    where: {
      id: postId,
      authorId,
      status: { in: [ContentStatus.PENDING, ContentStatus.VISIBLE] },
    },
  });
}

export async function saveCommunityPost(authorId: string, input: CommunityPostFormInput) {
  const [profile, sport, area] = await Promise.all([
    prisma.playerProfile.findUnique({ where: { userId: authorId }, select: { id: true } }),
    prisma.sport.findFirst({
      where: { id: input.sportId, status: ConfigStatus.ACTIVE },
      select: { id: true },
    }),
    input.areaId
      ? prisma.area.findFirst({
          where: { id: input.areaId, city: "Hanoi", status: ConfigStatus.ACTIVE },
          select: { id: true },
        })
      : null,
  ]);

  if (!profile) {
    throw new Error("PROFILE_REQUIRED");
  }

  if (!sport) {
    throw new Error("INVALID_SPORT");
  }

  if (input.areaId && !area) {
    throw new Error("INVALID_AREA");
  }

  if (input.postId) {
    const post = await prisma.communityPost.findFirst({
      where: { id: input.postId, authorId, status: { in: [ContentStatus.PENDING, ContentStatus.VISIBLE] } },
      select: { id: true },
    });

    if (!post) {
      throw new Error("POST_NOT_FOUND");
    }

    await prisma.communityPost.update({
      where: { id: input.postId },
      data: {
        title: input.title,
        sportId: input.sportId,
        postType: input.postType,
        areaId: input.areaId || null,
        content: input.content,
        status: ContentStatus.PENDING,
      },
    });

    return input.postId;
  }

  const post = await prisma.communityPost.create({
    data: {
      authorId,
      title: input.title,
      sportId: input.sportId,
      postType: input.postType,
      areaId: input.areaId || null,
      content: input.content,
    },
    select: { id: true },
  });

  return post.id;
}

export async function deleteCommunityPost(authorId: string, postId: string) {
  const post = await prisma.communityPost.findFirst({
    where: { id: postId, authorId, status: { in: [ContentStatus.PENDING, ContentStatus.VISIBLE] } },
    select: { id: true },
  });

  if (!post) {
    throw new Error("POST_NOT_FOUND");
  }

  await prisma.communityPost.update({
    where: { id: postId },
    data: { status: ContentStatus.DELETED },
  });
}

export async function createComment(authorId: string, input: CommentFormInput) {
  const [profile, post] = await Promise.all([
    prisma.playerProfile.findUnique({ where: { userId: authorId }, select: { id: true } }),
    prisma.communityPost.findFirst({
      where: { id: input.postId, status: ContentStatus.VISIBLE },
      select: { id: true },
    }),
  ]);

  if (!profile) {
    throw new Error("PROFILE_REQUIRED");
  }

  if (!post) {
    throw new Error("POST_NOT_FOUND");
  }

  await prisma.comment.create({
    data: {
      postId: input.postId,
      authorId,
      content: input.content,
    },
  });
}

export async function deleteComment(authorId: string, commentId: string) {
  const comment = await prisma.comment.findFirst({
    where: { id: commentId, authorId, status: ContentStatus.VISIBLE },
    select: { id: true },
  });

  if (!comment) {
    throw new Error("COMMENT_NOT_FOUND");
  }

  await prisma.comment.update({
    where: { id: commentId },
    data: { status: ContentStatus.DELETED },
  });
}

export async function listAdminCommunityContent(filters: {
  status?: ContentStatus;
  sportId?: string;
  q?: string;
  skip?: number;
  take?: number;
} = {}) {
  const where: Prisma.CommunityPostWhereInput = {
    status: filters.status
      ? filters.status
      : { in: [ContentStatus.PENDING, ContentStatus.VISIBLE] },
    sportId: filters.sportId || undefined,
    ...(filters.q
      ? { title: { contains: filters.q, mode: "insensitive" as const } }
      : {}),
  };

  const [totalCount, items] = await Promise.all([
    prisma.communityPost.count({ where }),
    prisma.communityPost.findMany({
      where,
      include: {
        author: { select: { email: true, playerProfile: true } },
        sport: true,
        area: true,
        comments: {
          where: { status: { not: ContentStatus.DELETED } },
          include: { author: { select: { email: true, playerProfile: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip: filters.skip,
      take: filters.take,
    }),
  ]);

  return { items, totalCount };
}

export async function setContentStatus(targetType: ContentTargetType, targetId: string, status: ContentStatus) {
  if (targetType === "POST") {
    await prisma.communityPost.update({
      where: { id: targetId },
      data: { status },
    });
    return;
  }

  await prisma.comment.update({
    where: { id: targetId },
    data: { status },
  });
}
