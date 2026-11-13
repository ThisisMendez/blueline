/**
 * The short name a review goes by: in the report heading and in the library.
 *
 * It comes from one of three places, in order:
 *
 * 1. A clear title at the top of the lease text, such as "Residential Lease
 *    Agreement". Only a heading built entirely from a fixed vocabulary of
 *    lease-type words qualifies, so a heading that carries an address, a
 *    party's name or a date is skipped rather than trimmed.
 * 2. The file name, made readable and without `.pdf`. A file name that looks
 *    like it holds an email address, a phone number, a street address or an
 *    account number is skipped.
 * 3. {@link DEFAULT_REVIEW_TITLE}.
 *
 * Nothing here invents a detail. Every word in a title was in the lease text
 * or the file name the signer chose.
 */

export const DEFAULT_REVIEW_TITLE = "Residential lease";

/** The longest name a review can carry, generated or typed. */
export const MAXIMUM_REVIEW_TITLE_LENGTH = 80;

/** How far into the lease a title heading may sit. */
const HEADING_SEARCH_LINES = 12;
const HEADING_MAXIMUM_WORDS = 10;

/** One of these has to appear for a line to count as the lease's title. */
const TITLE_ANCHORS = [
  /\blease\b/,
  /\bsublease\b/,
  /\brental agreement\b/,
  /\brental contract\b/,
  /\btenancy agreement\b/,
  /\boccupancy agreement\b/,
];

/** A heading is a lease title only when it uses these words and no others. */
const TITLE_WORDS = new Set([
  "a", "and", "agreement", "apartment", "condo", "condominium", "contract",
  "duplex", "dwelling", "family", "fixed", "fixed-term", "for", "furnished",
  "home", "house", "housing", "lease", "long-term", "manufactured", "mobile",
  "month", "month-to-month", "multi-family", "occupancy", "of", "rent",
  "rental", "residential", "room", "roommate", "short-term", "single",
  "single-family", "standard", "studio", "sublease", "tenancy", "term", "the",
  "to", "townhome", "townhouse", "unfurnished", "unit", "year", "yearly",
  // US states and territories. A state is where the form comes from, not
  // who signed it.
  "alabama", "alaska", "arizona", "arkansas", "california", "colorado",
  "connecticut", "delaware", "florida", "georgia", "hawaii", "idaho",
  "illinois", "indiana", "iowa", "kansas", "kentucky", "louisiana", "maine",
  "maryland", "massachusetts", "michigan", "minnesota", "mississippi",
  "missouri", "montana", "nebraska", "nevada", "new", "hampshire", "jersey",
  "mexico", "york", "north", "carolina", "dakota", "ohio", "oklahoma",
  "oregon", "pennsylvania", "rhode", "island", "south", "tennessee", "texas",
  "utah", "vermont", "virginia", "washington", "west", "wisconsin", "wyoming",
  "district", "columbia", "puerto", "rico",
]);

const MINOR_WORDS = new Set(["a", "and", "for", "of", "the", "to"]);

/** File names that say nothing about the document. */
const GENERIC_FILE_NAMES = new Set([
  "document", "doc", "file", "scan", "scanned", "untitled", "download",
  "pdf", "print", "copy", "new", "image", "img",
]);

function capitalise(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function titleCase(words: readonly string[]): string {
  return words
    .map((word, index) =>
      index > 0 && MINOR_WORDS.has(word)
        ? word
        : word
            .split("-")
            .map((part, at) => (at > 0 && MINOR_WORDS.has(part) ? part : capitalise(part)))
            .join("-"),
    )
    .join(" ");
}

/**
 * A title heading near the top of the lease, or null when there isn't one
 * made only of lease-type words.
 */
export function titleFromLeaseText(text: string): string | null {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0)
    .slice(0, HEADING_SEARCH_LINES);

  for (const line of lines) {
    if (line.length > MAXIMUM_REVIEW_TITLE_LENGTH) continue;
    const words = line
      .toLowerCase()
      .replace(/[.:;,]+$/, "")
      .split(" ")
      .filter((word) => word.length > 0);
    if (words.length === 0 || words.length > HEADING_MAXIMUM_WORDS) continue;
    if (!words.every((word) => TITLE_WORDS.has(word))) continue;
    const joined = words.join(" ");
    if (!TITLE_ANCHORS.some((anchor) => anchor.test(joined))) continue;
    return titleCase(words);
  }
  return null;
}

const EMAIL = /[^\s@]+@[^\s@]+/;
const PHONE = /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
const LONG_NUMBER = /\d{6,}/;
const STREET_ADDRESS =
  /\b\d+[a-z]?\s+(?:[a-z0-9.'-]+\s+){0,4}(?:st|street|ave|avenue|rd|road|blvd|boulevard|ln|lane|dr|drive|ct|court|way|pl|place|ter|terrace|pkwy|parkway|hwy|highway|cir|circle|apt|unit|suite|ste)\b/i;
const UNIT_NUMBER = /(?:#|\bapt\.?\s*|\bunit\s+)\d+/i;

/**
 * A file name as a person would write it, or null when it says nothing or
 * looks like it carries contact or address details.
 */
export function readableFileName(fileName: string): string | null {
  const base = fileName.split(/[\\/]/).pop() ?? "";
  let name = base.replace(/\.pdf$/i, "");
  // Slug-style names read better with spaces.
  if (!/\s/.test(name)) name = name.replace(/[_-]+/g, " ");
  name = name.replace(/_+/g, " ").replace(/\s+/g, " ").trim();

  if (!/\p{L}/u.test(name)) return null;
  if (EMAIL.test(name) || PHONE.test(name) || LONG_NUMBER.test(name)) return null;
  if (STREET_ADDRESS.test(name) || UNIT_NUMBER.test(name)) return null;

  const words = name.toLowerCase().split(" ");
  if (words.every((word) => GENERIC_FILE_NAMES.has(word) || /^\d+$/.test(word))) return null;

  return truncate(name);
}

function truncate(title: string): string {
  if (title.length <= MAXIMUM_REVIEW_TITLE_LENGTH) return title;
  const cut = title.slice(0, MAXIMUM_REVIEW_TITLE_LENGTH);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 20 ? cut.slice(0, lastSpace) : cut).trim();
}

export interface ReviewTitleSource {
  /** The lease's extracted text. */
  readonly text: string;
  /** The name of the file the text came from, if there was one. */
  readonly fileName?: string | null;
}

/** The name a review goes by. See the module comment for the order. */
export function generateReviewTitle({ text, fileName }: ReviewTitleSource): string {
  return (
    titleFromLeaseText(text) ??
    (fileName ? readableFileName(fileName) : null) ??
    DEFAULT_REVIEW_TITLE
  );
}

/**
 * A name the signer typed, cleaned up, or null when it can't be used:
 * empty after trimming, longer than {@link MAXIMUM_REVIEW_TITLE_LENGTH}, or
 * holding control characters.
 */
export function normaliseTypedTitle(input: string): string | null {
  if (/[\u0000-\u001f\u007f]/.test(input.replace(/[\t\n\r]/g, " "))) return null;
  const title = input.replace(/\s+/g, " ").trim();
  if (title.length === 0 || title.length > MAXIMUM_REVIEW_TITLE_LENGTH) return null;
  return title;
}
