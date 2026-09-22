/**
 * The one text-normalisation rule in the product. Storage and citation
 * verification both run through it, so a sentence that verifies today still
 * verifies after a round trip through the database.
 *
 * The rule is deliberately small: every run of whitespace becomes one space,
 * and leading and trailing whitespace is dropped. Nothing else changes — no
 * case folding, no punctuation or quote rewriting, no accent stripping. A
 * citation has to survive being read back against the signer's own document,
 * and every extra liberty taken here is a way for a quotation to "match"
 * text the signer cannot find.
 */

const WHITESPACE = /\s/;

/** Normalised text paired with the origin of each character in the source. */
export interface NormalizedText {
  /** The normalised string. */
  readonly value: string;
  /**
   * `sourceOffsets[i]` is the index in the original text of the character that
   * produced `value[i]`. A collapsed run of whitespace points at the first
   * character of that run.
   */
  readonly sourceOffsets: readonly number[];
}

/** Normalises text and records where each surviving character came from. */
export function normalizeWithOffsets(text: string): NormalizedText {
  let value = "";
  const sourceOffsets: number[] = [];
  let index = 0;

  while (index < text.length) {
    const character = text[index];

    if (WHITESPACE.test(character)) {
      let runEnd = index;
      while (runEnd < text.length && WHITESPACE.test(text[runEnd])) {
        runEnd += 1;
      }
      // Leading whitespace produces nothing; trailing whitespace ends the string.
      if (value.length > 0 && runEnd < text.length) {
        value += " ";
        sourceOffsets.push(index);
      }
      index = runEnd;
      continue;
    }

    value += character;
    sourceOffsets.push(index);
    index += 1;
  }

  return { value, sourceOffsets };
}

/** Normalises text. Same rule as {@link normalizeWithOffsets}, without the map. */
export function normalizeText(text: string): string {
  return normalizeWithOffsets(text).value;
}

/** A located quotation, in character offsets into the *original* text. */
export interface TextLocation {
  readonly start: number;
  readonly end: number;
}

/**
 * Finds `quotation` inside `text`, comparing both in normalised form, and maps
 * the match back to offsets in the original text. Returns null when the
 * quotation is not in the text.
 */
export function locateQuotation(
  text: string,
  quotation: string,
): TextLocation | null {
  const needle = normalizeText(quotation);
  if (needle.length === 0) return null;

  const haystack = normalizeWithOffsets(text);
  const matchIndex = haystack.value.indexOf(needle);
  if (matchIndex === -1) return null;

  const start = haystack.sourceOffsets[matchIndex];
  const lastCharacterIndex = haystack.sourceOffsets[matchIndex + needle.length - 1];
  return { start, end: lastCharacterIndex + 1 };
}
