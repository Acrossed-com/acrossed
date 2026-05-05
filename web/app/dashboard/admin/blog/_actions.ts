"use server";

import { requireAdmin } from "@/lib/admin";
import { internalFetch } from "@/lib/internalApi";

interface PostInput {
  id?: string;
  slug: string; title: string; excerpt: string; bodyMd: string;
  heroImageUrl: string | null; heroImageAlt: string | null;
  seoTitle: string | null; seoDescription: string | null;
  seoKeywords: string[]; tags: string[];
  status: "draft" | "published";
}

export async function savePost(input: PostInput): Promise<{ ok: true; id: string; slug: string } | { ok: false; error: string }> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "forbidden" };
  try {
    if (input.id) {
      const r = await internalFetch<{ id: string; slug: string }>(`/admin/blog/posts/${input.id}`, { method: "PUT", body: input, actingUserId: admin.userId });
      return { ok: true, id: r.id, slug: r.slug };
    }
    const r = await internalFetch<{ id: string; slug: string }>("/admin/blog/posts", { method: "POST", body: input, actingUserId: admin.userId });
    return { ok: true, id: r.id, slug: r.slug };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deletePost(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "forbidden" };
  try {
    await internalFetch(`/admin/blog/posts/${id}`, { method: "DELETE", actingUserId: admin.userId });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function generateCover(title: string, mode: "svg" | "ai"): Promise<{ url: string; alt: string; source: "svg" | "ai" }> {
  const admin = await requireAdmin();
  if (!admin) throw new Error("forbidden");
  return await internalFetch<{ url: string; alt: string; source: "svg" | "ai" }>("/admin/blog/cover", { method: "POST", body: { title, mode }, actingUserId: admin.userId });
}
