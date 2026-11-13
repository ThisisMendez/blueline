import type { Metadata } from "next";

import { ReportScreen } from "@/features/review/session/ReportScreen";

export const metadata: Metadata = {
  title: "Your report | Blueline Redline",
};

/**
 * The report for a review that ran in this tab and wasn't saved. Nothing
 * about the review is in the URL; it is read from the tab's session.
 */
export default function SessionReportPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <ReportScreen />
    </div>
  );
}
