export function DraftBanner() {
  return (
    <div
      role="note"
      aria-label="Draft for review"
      className="border-2 border-[var(--color-red-ink)] bg-[var(--color-paper-deep)] px-4 py-3"
    >
      <p className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-wide text-[var(--color-red-ink)]">
        Draft for review
      </p>
      <p className="mt-1 text-sm leading-relaxed text-[var(--color-navy-ink)]">
        The owner and a lawyer still need to check this page. It shows only on
        preview and development builds and is not in effect.
      </p>
    </div>
  );
}
