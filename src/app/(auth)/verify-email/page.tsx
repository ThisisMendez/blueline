import type { Metadata } from "next";
import Link from "next/link";

import { isAccountsConfigured } from "@/features/auth/config";
import { AuthFrame } from "@/features/auth/components/AuthFrame";
import { VerifySignupLinkForm } from "@/features/auth/components/SignInForm";

export const metadata: Metadata = {
  title: "Confirm your email | Blueline Redline",
  robots: { index: false, follow: false },
};

export default function VerifyEmailPage() {
  return (
    <AuthFrame
      title="Confirm your email"
      description="Verify your email to sign in. If you have a review open, keep that tab open."
      configured={isAccountsConfigured()}
    >
      <VerifySignupLinkForm />
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <Link href="/sign-in" className="underline">Back to sign in</Link>
        <Link href="/sign-up?mode=resend" className="underline">Request a fresh email</Link>
      </div>
    </AuthFrame>
  );
}
