"use client";

import { BlogEditor } from "../_editor";
import { savePost, generateCover } from "../_actions";

export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow mb-2">Admin · Blog</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">New post</h1>
      </header>
      <BlogEditor onSave={savePost} onGenerateCover={generateCover} />
    </div>
  );
}
