"use server";

import { ContentStatus, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

import {
  commentFormSchema,
  commentIdSchema,
  communityPostFormSchema,
  moderationStatusSchema,
  postIdSchema,
} from "./community-schemas";
import {
  createComment,
  deleteComment,
  deleteCommunityPost,
  saveCommunityPost,
  setContentStatus,
} from "./community-service";

async function requireRole(role: UserRole) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== role) {
    redirect("/");
  }

  return session.user;
}

function redirectWith(path: string, key: "error" | "status", value: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(value)}`);
}

function postFormTarget(formData: FormData) {
  const postId = String(formData.get("postId") ?? "");
  return postId ? `/community/${postId}/edit` : "/community/new";
}

export async function saveCommunityPostAction(formData: FormData) {
  const user = await requireRole(UserRole.PLAYER);
  const parsed = communityPostFormSchema.safeParse({
    postId: String(formData.get("postId") ?? "") || undefined,
    title: formData.get("title"),
    sportId: formData.get("sportId"),
    postType: formData.get("postType"),
    areaId: formData.get("areaId") || undefined,
    content: formData.get("content"),
  });
  const target = postFormTarget(formData);

  if (!parsed.success) {
    redirectWith(target, "error", "invalid_input");
  }

  let postId: string;

  try {
    postId = await saveCommunityPost(user.id, parsed.data);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "PROFILE_REQUIRED") {
        redirect("/player/profile");
      }

      if (["INVALID_AREA", "INVALID_SPORT", "POST_NOT_FOUND"].includes(error.message)) {
        redirectWith(target, "error", "invalid_input");
      }
    }

    throw error;
  }

  revalidatePath("/community");
  revalidatePath(`/community/${postId}`);
  revalidatePath("/admin/community");
  redirectWith(`/community/${postId}`, "status", parsed.data.postId ? "updated_pending" : "created_pending");
}

export async function deleteCommunityPostAction(formData: FormData) {
  const user = await requireRole(UserRole.PLAYER);
  const parsed = postIdSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirectWith("/community", "error", "invalid_input");
  }

  try {
    await deleteCommunityPost(user.id, parsed.data.postId);
  } catch (error) {
    if (error instanceof Error) {
      redirectWith(`/community/${parsed.data.postId}`, "error", error.message.toLowerCase());
    }

    throw error;
  }

  revalidatePath("/community");
  redirectWith("/community", "status", "deleted");
}

export async function createCommentAction(formData: FormData) {
  const user = await requireRole(UserRole.PLAYER);
  const parsed = commentFormSchema.safeParse(Object.fromEntries(formData));
  const postId = String(formData.get("postId") ?? "");
  const target = postId ? `/community/${postId}` : "/community";

  if (!parsed.success) {
    redirectWith(target, "error", "invalid_input");
  }

  try {
    await createComment(user.id, parsed.data);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "PROFILE_REQUIRED") {
        redirect("/player/profile");
      }

      redirectWith(target, "error", error.message.toLowerCase());
    }

    throw error;
  }

  revalidatePath(target);
  redirectWith(target, "status", "commented");
}

export async function deleteCommentAction(formData: FormData) {
  const user = await requireRole(UserRole.PLAYER);
  const parsed = commentIdSchema.safeParse(Object.fromEntries(formData));
  const postId = String(formData.get("postId") ?? "");
  const target = postId ? `/community/${postId}` : "/community";

  if (!parsed.success) {
    redirectWith(target, "error", "invalid_input");
  }

  try {
    await deleteComment(user.id, parsed.data.commentId);
  } catch (error) {
    if (error instanceof Error) {
      redirectWith(target, "error", error.message.toLowerCase());
    }

    throw error;
  }

  revalidatePath(target);
  redirectWith(target, "status", "comment_deleted");
}

export async function setContentStatusAction(formData: FormData) {
  await requireRole(UserRole.ADMIN);
  const parsed = moderationStatusSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirectWith("/admin/community", "error", "invalid_input");
  }

  await setContentStatus(parsed.data.targetType, parsed.data.targetId, parsed.data.status);
  revalidatePath("/admin/community");
  revalidatePath("/community");
  redirectWith("/admin/community", "status", parsed.data.status === ContentStatus.VISIBLE ? "approved" : "deleted");
}

export async function approveContentAction(formData: FormData) {
  formData.set("status", ContentStatus.VISIBLE);
  await setContentStatusAction(formData);
}

export async function deleteContentAction(formData: FormData) {
  formData.set("status", ContentStatus.DELETED);
  await setContentStatusAction(formData);
}
