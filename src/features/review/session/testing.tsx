/**
 * Test support for the intake → processing → report flow. Not imported by
 * any route.
 *
 * `renderReviewFlow` mounts the three review pages behind one session
 * provider and a router that swaps the page on `push` and `replace`, the way
 * the app layout keeps the session alive across those navigations. A test
 * drives the real intake, the real processing page and the real report.
 *
 * `textPdf` and `withTextPdfs` let a flow test choose a "PDF" whose text is
 * exactly a fixture's text, so citation assertions don't depend on how a
 * real PDF lays the text out. The real reader still runs for every other
 * file, and the PDF suites test it on real bytes.
 */

import { act, render, type RenderResult } from "@testing-library/react";
import {
  AppRouterContext,
  type AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useEffect, useState, useSyncExternalStore, type ReactElement } from "react";

import type { PdfExtraction } from "@/features/packet/extract/pdf";

import { ProcessingScreen } from "./ProcessingScreen";
import { ReportScreen } from "./ReportScreen";
import { ReviewSessionProvider } from "./ReviewSessionProvider";
import { createReviewSessionStore, type ReviewSessionStore } from "./store";

const TEST_PDF_MARKER = "%BLUELINE-TEST-PDF\n";
const LOCKED_PDF_MARKER = "%BLUELINE-TEST-LOCKED\n";

/** A file the mocked reader treats as a selectable-text PDF holding exactly `text`. */
export function textPdf(name: string, text: string): File {
  return new File([TEST_PDF_MARKER + text], name, { type: "application/pdf" });
}

/** A file the mocked reader treats as a password-protected PDF. */
export function lockedPdf(name: string): File {
  return new File([LOCKED_PDF_MARKER], name, { type: "application/pdf" });
}

/**
 * Wraps the real PDF module so `textPdf` files read as their text. Use as
 * `vi.mock("@/features/packet/extract/pdf", async (original) =>
 *   (await import("@/features/review/session/testing")).withTextPdfs(await original()))`.
 */
export function withTextPdfs<T extends { extractPdfText: (bytes: ArrayBuffer) => Promise<PdfExtraction> }>(
  actual: T,
): T {
  return {
    ...actual,
    async extractPdfText(bytes: ArrayBuffer): Promise<PdfExtraction> {
      const content = new TextDecoder().decode(bytes);
      if (content.startsWith(LOCKED_PDF_MARKER)) return { kind: "unreadable", reason: "password-protected" };
      if (!content.startsWith(TEST_PDF_MARKER)) return actual.extractPdfText(bytes);
      const text = content.slice(TEST_PDF_MARKER.length);
      return { kind: "text", text, pageCount: 1, characterCount: text.replace(/\s/g, "").length };
    },
  };
}

export interface ReviewFlowOptions {
  /** What `/review/<id>` shows. Without it, a placeholder naming the id. */
  readonly savedReview?: (reviewId: string) => Promise<ReactElement> | ReactElement;
  /** Starts the flow on another path, e.g. a refreshed processing page. */
  readonly initialPath?: string;
  readonly store?: ReviewSessionStore;
}

export interface ReviewFlowRender extends RenderResult {
  /** Every push and replace, in order. */
  readonly navigations: { readonly kind: "push" | "replace"; readonly href: string }[];
  readonly store: ReviewSessionStore;
  currentPath(): string;
  /** Moves to a path the way the browser's back and forward buttons do: no push, no replace. */
  goTo(path: string): Promise<void>;
}

function SavedReview({
  reviewId,
  load,
}: {
  readonly reviewId: string;
  readonly load: NonNullable<ReviewFlowOptions["savedReview"]>;
}) {
  const [page, setPage] = useState<ReactElement | null>(null);
  useEffect(() => {
    let live = true;
    void Promise.resolve(load(reviewId)).then((element) => {
      if (live) setPage(element);
    });
    return () => {
      live = false;
    };
  }, [load, reviewId]);
  return page;
}

export function renderReviewFlow(intake: ReactElement, options: ReviewFlowOptions = {}): ReviewFlowRender {
  const navigations: { kind: "push" | "replace"; href: string }[] = [];
  const store = options.store ?? createReviewSessionStore();
  let current = options.initialPath ?? "/review";
  const listeners = new Set<() => void>();
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const setPath = (path: string) => {
    current = path;
    for (const listener of listeners) listener();
  };

  const navigate = (kind: "push" | "replace") => (href: string) => {
    navigations.push({ kind, href });
    setPath(href);
  };

  const router: AppRouterInstance = {
    bfcacheId: "test",
    back: () => {},
    forward: () => {},
    refresh: () => {},
    push: navigate("push"),
    replace: navigate("replace"),
    prefetch: () => {},
  };

  function Flow() {
    const path = useSyncExternalStore(subscribe, () => current);
    let page: ReactElement;
    if (path === "/review") page = intake;
    else if (path === "/review/processing") page = <ProcessingScreen />;
    else if (path === "/review/report") page = <ReportScreen />;
    else {
      const reviewId = path.replace(/^\/review\//, "");
      page = options.savedReview ? (
        <SavedReview reviewId={reviewId} load={options.savedReview} />
      ) : (
        <p>Saved review {reviewId}</p>
      );
    }
    return <div data-path={path}>{page}</div>;
  }

  const result = render(
    <AppRouterContext.Provider value={router}>
      <ReviewSessionProvider store={store}>
        <Flow />
      </ReviewSessionProvider>
    </AppRouterContext.Provider>,
  );

  return Object.assign(result, {
    navigations,
    store,
    currentPath: () => current,
    async goTo(path: string) {
      await act(async () => {
        setPath(path);
      });
    },
  });
}
