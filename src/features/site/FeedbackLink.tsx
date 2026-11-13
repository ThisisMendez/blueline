import Link from "next/link";

import { FEEDBACK_TOPIC, type FeedbackContext } from "./contact-fields";
import { linkClassName } from "./PageShell";

export function FeedbackLink({
  className = linkClassName,
  source = "footer",
  role,
}: FeedbackContext & { readonly className?: string }) {
  const query = new URLSearchParams({ topic: FEEDBACK_TOPIC, source });
  if (source === "report" && role) query.set("role", role);

  return (
    <Link href={`/contact?${query}`} target="_blank" rel="noopener noreferrer" className={className}>
      Give feedback<span className="sr-only"> (opens in a new tab)</span>
    </Link>
  );
}
