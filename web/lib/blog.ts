// File-based blog: each .md in /content/blog is a post.
// Frontmatter parsed by gray-matter, body rendered by marked.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

export interface Post {
  slug: string;
  title: string;
  description: string;
  author: string;
  date: string;
  readingMins: number;
  bodyHtml: string;
}

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  author: string;
  date: string;
  readingMins: number;
}

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function safeReadDir(): string[] {
  try {
    return fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));
  } catch {
    return [];
  }
}

export function listPosts(): PostMeta[] {
  return safeReadDir()
    .map((file) => {
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
      const { data, content } = matter(raw);
      const slug = file.replace(/\.(md|mdx)$/, "");
      const words = content.trim().split(/\s+/).length;
      return {
        slug,
        title: String(data.title ?? slug),
        description: String(data.description ?? ""),
        author: String(data.author ?? "Acrossed Team"),
        date: String(data.date ?? new Date().toISOString().slice(0, 10)),
        readingMins: Math.max(1, Math.round(words / 220)),
      };
    })
    .sort((a, b) => (a.date > b.date ? -1 : 1));
}

export function getPost(slug: string): Post | null {
  const file = safeReadDir().find((f) => f.replace(/\.(md|mdx)$/, "") === slug);
  if (!file) return null;
  const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
  const { data, content } = matter(raw);
  const words = content.trim().split(/\s+/).length;
  const bodyHtml = marked.parse(content, { async: false }) as string;
  return {
    slug,
    title: String(data.title ?? slug),
    description: String(data.description ?? ""),
    author: String(data.author ?? "Acrossed Team"),
    date: String(data.date ?? new Date().toISOString().slice(0, 10)),
    readingMins: Math.max(1, Math.round(words / 220)),
    bodyHtml,
  };
}
