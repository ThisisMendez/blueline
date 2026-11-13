import { extractPdfText, type PdfExtraction } from "./pdf";

/**
 * The largest file the intake will open. A lease with selectable text is
 * rarely more than a few megabytes; a file past this is almost always a scan,
 * and reading it would tie up the signer's browser for nothing.
 */
export const MAXIMUM_PDF_BYTES = 20 * 1024 * 1024;

/** Why a chosen file can't be part of the packet. Each has its own fix. */
export type PdfProblem = "scanned" | "encrypted" | "empty" | "invalid" | "oversized";

export type PdfFileReading =
  | {
      readonly kind: "read";
      readonly text: string;
      readonly pageCount: number;
    }
  | { readonly kind: "problem"; readonly problem: PdfProblem };

/** The bytes and the name of a chosen file. `File` satisfies this. */
export interface ChosenFile {
  readonly name: string;
  readonly size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

/**
 * Opens one chosen file in the signer's browser and returns its text, or the
 * reason it can't be used. The bytes go out of scope here; only characters
 * come back.
 */
export async function readPdfFile(
  file: ChosenFile,
  extract: (bytes: ArrayBuffer) => Promise<PdfExtraction> = extractPdfText,
): Promise<PdfFileReading> {
  if (file.size === 0) return { kind: "problem", problem: "empty" };
  if (file.size > MAXIMUM_PDF_BYTES) return { kind: "problem", problem: "oversized" };

  let extraction;
  try {
    extraction = await extract(await file.arrayBuffer());
  } catch {
    return { kind: "problem", problem: "invalid" };
  }

  if (extraction.kind === "unreadable") {
    return {
      kind: "problem",
      problem: extraction.reason === "password-protected" ? "encrypted" : "invalid",
    };
  }
  if (extraction.kind === "no-usable-text") {
    return { kind: "problem", problem: extraction.pageCount === 0 ? "empty" : "scanned" };
  }
  return { kind: "read", text: extraction.text, pageCount: extraction.pageCount };
}
