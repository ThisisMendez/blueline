"use client";

import { useState } from "react";
import type { ReviewRetention } from "./store";
import type { SaveOutcome } from "./retention-route";

const ERROR_COPY = {
  "sign-in-required": "Sign in again to save this review.",
  "accounts-unavailable": "Saving is unavailable because accounts are not configured.",
  "not-found": "This review has expired or is unavailable. It cannot be saved.",
  "invalid-request": "The save request could not be read. Reload this review and try again.",
  "storage-unavailable": "The review was not saved for longer. Try again.",
};

export function RetentionControls({ reviewId, retention: initial }: { readonly reviewId: string; readonly retention: ReviewRetention }) {
  const [retention, setRetention] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [saved, setSaved] = useState(false);
  const expiry = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" }).format(new Date(retention.expiresAt));

  async function save() {
    if (busy || unavailable) return;
    setBusy(true); setError(null); setSaved(false);
    try {
      const response = await fetch("/api/library/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviewId }) });
      const outcome: SaveOutcome = await response.json();
      if (outcome.status === "saved") { setRetention(outcome.retention); setSaved(true); }
      else { setError(ERROR_COPY[outcome.reason]); setUnavailable(outcome.reason === "not-found"); }
    } catch { setError(ERROR_COPY["storage-unavailable"]); }
    finally { setBusy(false); }
  }

  return <div className="mt-3 flex flex-col items-start gap-3">
    <p className="font-[family-name:var(--font-data)] text-xs uppercase tracking-wide text-[var(--color-navy)]">Expires <time dateTime={retention.expiresAt}>{expiry}</time></p>
    <p className="font-[family-name:var(--font-body)] text-sm leading-relaxed">{retention.savedAt ? "Kept for 90 days from your last save." : "Kept for 30 days from completion."} Access ends at expiry; stored text is deleted by the next scheduled cleanup, which runs every minute.</p>
    <button type="button" onClick={save} disabled={busy || unavailable} className="border-2 border-[var(--color-navy)] px-4 py-2 font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--color-navy)] hover:bg-[var(--color-paper-deep)] disabled:opacity-70">{busy ? "Saving review" : "Save for 90 days from now"}</button>
    <div aria-live="polite" className="font-[family-name:var(--font-body)] text-sm">
      {saved ? <p>Saved. The expiry above has been updated.</p> : null}
      {error ? <p role="alert">{error}</p> : null}
    </div>
  </div>;
}
