"use client";

import { useActionState } from "react";

import { PASSWORD_MIN_LENGTH } from "@/features/auth/password-validation";
import { changePasswordAction, updateDisplayNameAction } from "./actions";

const LABEL = "font-[family-name:var(--font-data)] text-xs font-semibold uppercase tracking-wide text-[var(--color-navy)]";
const INPUT = "w-full border-2 border-[var(--color-navy)] bg-[var(--color-paper)] px-3 py-2 font-[family-name:var(--font-body)] text-base";
const SUBMIT = "self-start bg-[var(--color-navy)] px-5 py-3 font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--color-paper)] hover:bg-[var(--color-navy-ink)] disabled:opacity-60";

export function DisplayNameForm({ name }: { readonly name: string }) {
  const [result, submit, pending] = useActionState(updateDisplayNameAction, null);

  return (
    <form action={submit} className="flex max-w-sm flex-col gap-3">
      <label htmlFor="display-name" className={LABEL}>Display name</label>
      <input id="display-name" name="displayName" autoComplete="nickname" defaultValue={name} required maxLength={80} className={INPUT} />
      <button type="submit" disabled={pending} className={SUBMIT}>{pending ? "Saving name…" : "Save name"}</button>
      <p role="status" className="font-[family-name:var(--font-body)] text-sm">{result?.message}</p>
    </form>
  );
}

export function ChangePasswordForm() {
  const [result, submit, pending] = useActionState(changePasswordAction, null);

  return (
    <form action={submit} className="flex max-w-sm flex-col gap-3">
      <label htmlFor="current-password" className={LABEL}>Current password</label>
      <input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required className={INPUT} />
      <label htmlFor="new-password" className={LABEL}>New password</label>
      <input id="new-password" name="newPassword" type="password" autoComplete="new-password" required minLength={PASSWORD_MIN_LENGTH} className={INPUT} />
      <label htmlFor="confirm-password" className={LABEL}>Confirm new password</label>
      <input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" required minLength={PASSWORD_MIN_LENGTH} className={INPUT} />
      <button type="submit" disabled={pending} className={SUBMIT}>{pending ? "Changing password…" : "Change password"}</button>
      <p role="status" className="font-[family-name:var(--font-body)] text-sm">{result?.message}</p>
    </form>
  );
}
