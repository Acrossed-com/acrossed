"use client";
import { useState } from "react";

export function RulesEditor({ projectId, initial }: { projectId: string; initial: unknown[] }) {
  const [text, setText] = useState(() => JSON.stringify(initial, null, 2));
  const [status, setStatus] = useState<string>("");
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    setStatus("");
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        setStatus("✗ invalid JSON");
        return;
      }
      if (!Array.isArray(parsed)) {
        setStatus("✗ rules must be an array");
        return;
      }
      const res = await fetch(`/api/projects/${projectId}/rules`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rules: parsed }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setStatus(`✓ saved ${data.count} rules`);
    } catch (e) {
      setStatus(`✗ ${(e as Error).message}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="glass rounded-xl p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-medium">Rules</h2>
        <div className="flex items-center gap-3">
          <span className="mono text-xs text-white/50">{status}</span>
          <button
            onClick={save}
            disabled={pending}
            className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-black disabled:opacity-40"
          >
            {pending ? "Saving…" : "Save & deploy"}
          </button>
        </div>
      </div>
      <textarea
        spellCheck={false}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="mono h-[28rem] w-full resize-none rounded-lg border border-white/10 bg-black/30 p-4 text-sm text-white/85 outline-none focus:border-white/30"
      />
      <p className="mt-3 text-xs text-white/40">
        Saved rules are AES-256 encrypted at rest and pushed into the in-memory engine immediately.
      </p>
    </section>
  );
}
