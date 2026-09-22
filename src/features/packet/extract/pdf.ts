import {
  getDocument,
  GlobalWorkerOptions,
  VerbosityLevel,
} from "pdfjs-dist/legacy/build/pdf.mjs";

/**
 * Reads the text out of a PDF the signer chose, in the signer's own browser.
 *
 * Nothing here uploads, posts or stores the bytes it is handed. The caller
 * gets characters back and the `ArrayBuffer` goes out of scope, which is what
 * keeps the promise that Blueline never holds the original file: there is no
 * code path that could send it anywhere.
 *
 * The module is deliberately free of browser globals so the same function the
 * screen calls is the one the test suite runs under Node. The legacy pdf.js
 * build is used for that reason.
 */

/**
 * The usable-text rule.
 *
 * A PDF is worth reviewing when its extracted text holds at least 100
 * characters that are not whitespace **per page**, and never fewer than 200
 * in the document as a whole.
 *
 * Both halves matter. The per-page weight is what stops a scan from squeaking
 * past: a twelve-page photographed lease that yields a page number here and a
 * stray glyph there can easily clear a flat couple of hundred characters, and
 * reviewing it would produce citations pointing at text nobody can find. The
 * document floor keeps a one-page file from qualifying on a caption.
 *
 * Both numbers sit far below real lease prose — a typed page runs to a couple
 * of thousand characters — so a short but genuine lease clears the bar with
 * room to spare, and ADR 0001's guarantee survives: every sentence a flag
 * quotes is a sentence that was really in the document.
 */
export const MINIMUM_CHARACTERS_PER_PAGE = 100;

/** The floor no document clears on a caption alone. See above. */
export const MINIMUM_CHARACTERS_PER_DOCUMENT = 200;

/** How many non-whitespace characters a document of this length must yield. */
export function usableTextThreshold(pageCount: number): number {
  return Math.max(
    MINIMUM_CHARACTERS_PER_DOCUMENT,
    MINIMUM_CHARACTERS_PER_PAGE * pageCount,
  );
}

/** Characters that are not whitespace. Layout is not evidence of text. */
export function countTextCharacters(text: string): number {
  return text.replace(/\s/g, "").length;
}

/** Why a file could not be opened at all, as opposed to holding no text. */
export type PdfUnreadableReason = "not-a-pdf" | "password-protected";

/**
 * What came back from a file. The three outcomes are distinct on purpose: a
 * signer has to be able to tell "this file cannot be read" from "this lease
 * is clean", and a caller that only handled text would erase the difference.
 */
export type PdfExtraction =
  | {
      readonly kind: "text";
      /** Everything the reader found, pages joined by a newline. */
      readonly text: string;
      readonly pageCount: number;
      /** Non-whitespace characters in `text`. */
      readonly characterCount: number;
    }
  | {
      readonly kind: "no-usable-text";
      readonly pageCount: number;
      readonly characterCount: number;
    }
  | { readonly kind: "unreadable"; readonly reason: PdfUnreadableReason };

/**
 * pdf.js will not start without being told where its worker lives.
 *
 * In a browser that is a real module Worker, so reading a long lease never
 * freezes the page the signer is looking at. Under Node there is no `Worker`
 * to construct and pdf.js loads its worker module itself — that branch is
 * pdf.js's own, not a concession to the test suite, and the browser path is
 * left exactly as it ships.
 */
let workerConfigured = false;

function configureWorker(): void {
  if (workerConfigured) return;
  workerConfigured = true;

  if (typeof Worker === "undefined") return;
  if (GlobalWorkerOptions.workerPort !== null) return;

  GlobalWorkerOptions.workerPort = new Worker(
    new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url),
    { type: "module" },
  );
}

function unreadableReason(error: unknown): PdfUnreadableReason {
  return error instanceof Error && error.name === "PasswordException"
    ? "password-protected"
    : "not-a-pdf";
}

/**
 * Extracts the selectable text from a PDF's bytes.
 *
 * A document whose text clears {@link usableTextThreshold} comes back as
 * `text`; one that does not comes back as `no-usable-text`, which is the
 * outcome a scan produces. Neither is an exception, because neither is a
 * programming error: both are answers the signer needs to be shown.
 */
export async function extractPdfText(bytes: ArrayBuffer): Promise<PdfExtraction> {
  configureWorker();

  const task = getDocument({
    data: new Uint8Array(bytes),
    // Blueline only reads characters, so a missing glyph or an unusual
    // annotation is not news. Errors still surface, as the outcome below.
    verbosity: VerbosityLevel.ERRORS,
  });

  let document;
  try {
    document = await task.promise;
  } catch (error) {
    await task.destroy().catch(() => {});
    return { kind: "unreadable", reason: unreadableReason(error) };
  }

  try {
    const pageCount = document.numPages;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();

      let pageText = "";
      for (const item of content.items) {
        if (!("str" in item)) continue;
        pageText += item.str;
        if (item.hasEOL) pageText += "\n";
      }
      pages.push(pageText);
      page.cleanup();
    }

    const text = pages.join("\n");
    const characterCount = countTextCharacters(text);

    if (characterCount < usableTextThreshold(pageCount)) {
      return { kind: "no-usable-text", pageCount, characterCount };
    }
    return { kind: "text", text, pageCount, characterCount };
  } catch {
    return { kind: "unreadable", reason: "not-a-pdf" };
  } finally {
    await document.destroy();
  }
}
