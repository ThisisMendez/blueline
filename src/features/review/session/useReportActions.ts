"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { DraftWording } from "@/features/negotiation/ReviewSuggestions";

type Action = "draft" | "save";

export function useReportActions(token: string | undefined) {
  const router = useRouter();
  const [wording, setWording] = useState<DraftWording>();
  const [pendingAction, setPendingAction] = useState<Action>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const resume = useRef<(() => void) | undefined>(undefined);

  const run = useCallback(async (action: Action) => {
    if (!token || inFlight.current) return;
    inFlight.current = true;
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/library/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, token }),
      });
      if (response.status === 401) {
        setPendingAction(action);
        return;
      }
      if (response.status === 410) {
        setPendingAction(undefined);
        setError("This report can still be read here. Run a new review to save it or create a draft.");
        return;
      }
      if (!response.ok) throw new Error("Review action failed");
      const result = await response.json() as {
        wording?: readonly { id: string; counterOffer: string; residualRisk: string }[];
        reviewId?: string;
      };
      if (action === "draft" && result.wording) {
        setWording(new Map(result.wording.map(({ id, ...text }) => [id, text])));
        resume.current?.();
      } else if (action === "save" && result.reviewId) {
        router.push(`/review/${result.reviewId}`);
      } else {
        throw new Error("Unexpected review action response");
      }
      resume.current = undefined;
      setPendingAction(undefined);
    } catch {
      setError("We couldn’t finish that. Try again in a moment.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }, [router, token]);

  function requestDraft(onReady: () => void) {
    if (inFlight.current) return;
    resume.current = onReady;
    void run("draft");
  }

  function cancel() {
    if (inFlight.current) return;
    resume.current = undefined;
    setPendingAction(undefined);
    setError("");
  }

  return { wording, requestDraft, pendingAction, error, busy, run, cancel };
}
