"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewProjectForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [creds, setCreds] = useState<{ apiKey: string; signingSecret: string; id: string } | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setCreds(data);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (creds) {
    return (
      <div className="surface-strong font-mono max-w-xl rounded-xl p-5 text-xs text-ink-hi">
        <p className="text-[color:var(--warn)]">⚠ Save these now — they will not be shown again.</p>
        <div className="mt-3 break-all">
          <div className="text-ink-low">API key</div>
          <div className="text-ink-hi">{creds.apiKey}</div>
        </div>
        <div className="mt-3 break-all">
          <div className="text-ink-low">Signing secret</div>
          <div className="text-ink-hi">{creds.signingSecret}</div>
        </div>
        <button className="btn btn-ghost mt-4" onClick={() => setCreds(null)}>
          Done
        </button>
      </div>
    );
  }

  return open ? (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input
        autoFocus
        className="rounded-md border border-line bg-bg-elev px-3 py-1.5 text-sm text-ink-hi outline-none focus:border-brand-line"
        placeholder="Project name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button disabled={pending || !name} className="btn btn-primary disabled:opacity-40">
        {pending ? "Creating…" : "Create"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-ink-mid hover:text-ink-hi">
        Cancel
      </button>
    </form>
  ) : (
    <button onClick={() => setOpen(true)} className="btn btn-primary">
      + New project
    </button>
  );
}
