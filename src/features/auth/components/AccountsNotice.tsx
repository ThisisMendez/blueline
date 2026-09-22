/**
 * What the signer is told when Supabase is not configured. No account, no
 * library, no saved review — said plainly, in one panel, rather than by
 * showing buttons that quietly do nothing.
 */
export function AccountsNotice() {
  return (
    <section
      aria-labelledby="accounts-notice-heading"
      className="border-2 border-dashed border-[var(--color-navy)] bg-[var(--color-paper-deep)] p-6 sm:p-8"
    >
      <p
        id="accounts-notice-heading"
        className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-navy)]"
      >
        Accounts aren&apos;t running yet
      </p>
      <p className="mt-3 max-w-[var(--measure)] font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
        There is no account to sign in to on this deployment, so nothing you
        paste is kept. You can still run a review and read it here. Close the
        tab and it is gone, with no copy left anywhere.
      </p>
    </section>
  );
}
