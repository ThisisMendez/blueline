import type { Metadata } from "next";

import { ProcessingScreen } from "@/features/review/session/ProcessingScreen";

export const metadata: Metadata = {
  title: "Reading your lease | Blueline Redline",
};

/** The wait after "Read my lease". The review itself lives in the tab's session. */
export default function ReviewProcessingPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <ProcessingScreen />
    </div>
  );
}
