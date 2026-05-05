import { requireAdmin } from "@/lib/admin";
import { internalFetch } from "@/lib/internalApi";
import { redirect } from "next/navigation";
import { EditClient } from "./_client";

export const dynamic = "force-dynamic";

interface RawPost {
  id: string; slug: string; title: string; excerpt: string; bodyMd: string;
  heroImageUrl: string | null; heroImageAlt: string | null;
  seoTitle: string | null; seoDescription: string | null;
  seoKeywords: string[] | null; tags: string[] | null;
  status: "draft" | "published";
}

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireAdmin();
  if (!admin) redirect("/dashboard");
  const raw = await internalFetch<RawPost>(`/admin/blog/posts/${id}`, { actingUserId: admin.userId });
  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow mb-2">Admin · Blog</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Edit post</h1>
      </header>
      <EditClient initial={{
        id: raw.id,
        slug: raw.slug,
        title: raw.title,
        excerpt: raw.excerpt,
        bodyMd: raw.bodyMd,
        heroImageUrl: raw.heroImageUrl,
        heroImageAlt: raw.heroImageAlt,
        seoTitle: raw.seoTitle,
        seoDescription: raw.seoDescription,
        seoKeywords: raw.seoKeywords ?? [],
        tags: raw.tags ?? [],
        status: raw.status,
      }} />
    </div>
  );
}
