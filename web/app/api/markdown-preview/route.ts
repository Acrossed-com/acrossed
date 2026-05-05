import { NextResponse } from "next/server";
import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: false });

function sanitize(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:\s*/gi, "");
}

export async function POST(req: Request) {
  const { md } = (await req.json()) as { md?: string };
  const html = sanitize(marked.parse(md ?? "", { async: false }) as string);
  return NextResponse.json({ html });
}
