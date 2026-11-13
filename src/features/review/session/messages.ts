import type { AnalysisFailure, AnalysisRejection } from "@/features/analysis/types";
import type { PdfProblem } from "@/features/packet/extract/file";

/**
 * What the signer reads when a chosen file can't join the packet. Each one
 * says what went wrong and what to do next. None of them looks like a
 * review: a file we can't read must never pass for a lease with nothing
 * wrong in it.
 */
export const PDF_PROBLEM_MESSAGE: Readonly<Record<PdfProblem, string>> = {
  scanned:
    "This PDF has no text we can select, so it's probably a scan or a photo of the pages. " +
    "Every flag quotes a sentence from your lease, and a picture has no sentences to quote. " +
    "Ask whoever sent it for the original file, or download it again from the signing site.",
  encrypted:
    "This PDF is locked with a password, so we can't read it. " +
    "Open it, save a copy without the password, and choose that copy.",
  empty: "This file is empty. Download the lease again and choose the new copy.",
  invalid:
    "This file didn't open as a PDF. If it's a Word document or a photo, " +
    "save it as a PDF with selectable text and choose that file.",
  oversized:
    "This file is over 20 MB. A lease with selectable text is usually much smaller, " +
    "so this one is probably a scan. Ask for the original file and choose that.",
};

export const FAILURE_MESSAGE: Readonly<Record<AnalysisFailure, string>> = {
  "model-not-configured":
    "The reading service isn't set up on this site, so the review can't run.",
  "model-timeout": "The reading took too long and stopped. Try again.",
  "model-rate-limited": "Too many reviews are running at once. Wait a minute and try again.",
  "model-unavailable": "The reading service didn't answer. Try again in a moment.",
  "model-unreadable": "The answer came back garbled, so there was nothing worth showing you. Try again.",
  "model-verification-failed":
    "We couldn't match the answer to your document, so we didn't finish the review. Try again.",
};

export const REJECTION_MESSAGE: Readonly<Record<AnalysisRejection, string>> = {
  "malformed-request": "That didn't send properly. Try again.",
  "empty-text": "We couldn't find any text in your lease. Choose the file again.",
  "not-signed-in": "Your sign-in has run out. Sign in again, then try again.",
};

export const NETWORK_MESSAGE =
  "Your documents didn't reach us. Check your connection and try again.";
