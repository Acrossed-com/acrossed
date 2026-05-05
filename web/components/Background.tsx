// A single, lightweight, zero-JS backdrop for the entire site.
// Two layered CSS gradients + a pinned dot grid — no JS, no animation loops,
// no canvas. Total cost: a single fixed div with two background-image rules.
export function Background() {
  return (
    <div
      aria-hidden
      className="bg-grid bg-vignette pointer-events-none fixed inset-0 z-0"
    />
  );
}
