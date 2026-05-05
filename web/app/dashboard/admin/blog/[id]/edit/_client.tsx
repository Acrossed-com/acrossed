"use client";

import { BlogEditor, type BlogPostForm } from "../../_editor";
import { savePost, deletePost, generateCover } from "../../_actions";

export function EditClient({ initial }: { initial: BlogPostForm }) {
  return (
    <BlogEditor
      initial={initial}
      onSave={savePost}
      onDelete={() => deletePost(initial.id!)}
      onGenerateCover={generateCover}
    />
  );
}
