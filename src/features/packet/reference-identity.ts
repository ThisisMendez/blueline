/**
 * One canonical identity per referenced document.
 *
 * The completeness check asks a model what the lease refers to, and a model
 * names the same document differently from one mention to the next:
 * "Attachment No. 2: Unit Inspection Report" and "Unit Inspection Report";
 * "Graduate & Family Housing Resident Handbook" and "Graduate and Family
 * Housing Handbook". Shown as they come, the signer is asked for one document
 * twice. This module decides, in code and the same way every time, which
 * names are the same document, what that document is called on screen, and
 * nothing else. It never adds or removes a document, only merges names.
 *
 * Two names are the same document when any of these hold:
 *
 *   1. They carry the same form number ("form HUD-50059").
 *   2. They carry the same attachment designation ("Attachment No. 1",
 *      "Exhibit A") in the same citing document.
 *   3. Their names reduce to the same words, once designations, form numbers,
 *      bracketed asides, case, punctuation, "&"/"and", possessives and a
 *      short list of filler words ("the", "of", "resident", "policies"...)
 *      are set aside.
 *   4. One name's words (three or more of them) are all inside the other's,
 *      the extra words are not ones that mark a different document
 *      ("move-out", "pet", "renewal"...), and every name that contains it
 *      is itself a longer form of the next ("Student Code of Conduct" inside
 *      "University Student Code of Conduct" inside "Ohio University Student
 *      Code of Conduct"). A short name that two unrelated longer names both
 *      contain is left alone, so it cannot bridge them into one.
 *
 * Genuinely distinct documents ("Pet Rules" and "House Rules", "VAWA Lease
 * Addendum" and "RAD PBRA Model Lease Addendum") share no key and stay apart.
 */

const DESIGNATION = /\b(attachment|exhibit|schedule|appendix|annex|addendum|rider)\s+(?:no\.?|number|#)?\s*(\d+|[a-z])\b/gi;

/** A designation used as a label at the start of a name: "Attachment No. 1: ". */
const LEADING_DESIGNATION = /^\s*(?:attachment|exhibit|schedule|appendix|annex|addendum|rider)\s+(?:no\.?|number|#)?\s*(?:\d+|[A-Z])\s*[:.\-–—]\s*/i;

/** A form number: an upper-case agency prefix and at least three digits. */
const FORM_NUMBER = /\b([A-Z]{2,}[A-Z0-9]*)\s*[-–—]?\s*(\d{3,}[A-Za-z]?(?:[-–—][A-Za-z0-9]{1,3})?)\b/g;

/** The form-number phrase as it appears in a name, so it can be cut from the display. */
const FORM_PHRASE = /,?\s*\b(?:[Ff]orm\s+)?[A-Z]{2,}[A-Z0-9]*\s*[-–—]?\s*\d{3,}[A-Za-z]?(?:[-–—][A-Za-z0-9]{1,3})?\b/g;

/** Words that do not tell one document from another. */
const FILLER = new Set([
  "a", "an", "the", "of", "and", "or", "for", "to", "this", "that", "any", "all", "its", "our", "your",
  "form", "document", "documents", "copy",
  "resident", "residents", "tenant", "tenants", "leaseholder", "leaseholders", "lessee", "lessees",
  "policies", "policy", "procedures", "procedure",
]);

/**
 * Words that, added to a name, usually make it a different document: a
 * move-out report is not the move-in report, a pet addendum is not the lease
 * addendum. A longer name carrying one of these is never folded into a
 * shorter one by the containment rule.
 */
const DISTINGUISHING = new Set([
  "move", "in", "out", "pet", "pets", "animal", "parking", "garage", "storage", "smoking",
  "renewal", "amendment", "amended", "revised", "supplemental", "supplementary", "additional",
  "final", "initial", "exit", "entry", "checkout", "checkin", "lead", "mold", "bedbug", "bedbugs",
  "utility", "utilities", "security", "police", "rent", "fee", "fees", "deposit", "guarantor",
  "guaranty", "occupant", "occupants", "aide", "vawa", "rad",
]);

const MINIMUM_CONTAINED_WORDS = 3;

function normaliseQuotes(text: string): string {
  return text.replace(/[‘’ʼ`´]/g, "'").replace(/[“”]/g, '"');
}

function collapse(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Removes bracketed asides, innermost first, then any stray brackets. */
function withoutBrackets(text: string): string {
  let current = text;
  for (;;) {
    const next = current.replace(/\s*\([^()]*\)/g, "").replace(/\s*\[[^[\]]*\]/g, "");
    if (next === current) break;
    current = next;
  }
  return current.replace(/[()[\]]/g, " ");
}

/** The form numbers a name carries, as keys: "HUD–50059" becomes "hud-50059". */
export function formNumbers(name: string): string[] {
  const keys: string[] = [];
  for (const match of normaliseQuotes(name).matchAll(FORM_NUMBER)) {
    const digits = match[2].replace(/\s*[-–—]\s*/g, "-").toLowerCase();
    keys.push(`${match[1].toLowerCase()}-${digits}`);
  }
  return [...new Set(keys)];
}

/** The form number as the signer sees it: "HUD-50059". */
function displayFormNumber(key: string): string {
  const [prefix, ...rest] = key.split("-");
  return `${prefix.toUpperCase()}-${rest.join("-").toUpperCase()}`;
}

/** Attachment designations in a text, as "attachment:1" or "exhibit:A". */
export function designations(text: string): string[] {
  const keys: string[] = [];
  for (const match of normaliseQuotes(text).matchAll(DESIGNATION)) {
    const id = match[2];
    // A single letter only counts in capitals ("Exhibit A"), so ordinary
    // words ("Schedule a viewing") are not read as a designation.
    if (/^[a-z]$/.test(id)) continue;
    keys.push(`${match[1].toLowerCase()}:${id.toUpperCase()}`);
  }
  return [...new Set(keys)];
}

/**
 * The name as the signer should read it: no "Attachment No. 1:" label, no
 * bracketed aside, no form number (it is added back in one fixed format),
 * typographic apostrophes, single spaces. Empty when nothing is left.
 */
export function displayBase(name: string): string {
  let text = normaliseQuotes(name);
  text = text.replace(LEADING_DESIGNATION, "");
  text = withoutBrackets(text);
  text = text.replace(FORM_PHRASE, " ");
  text = collapse(text).replace(/^[,;:.\-–—\s]+|[,;:.\-–—\s]+$/g, "");
  text = text.replace(/^the\s+/i, "");
  return text.replace(/(\w)'(\w)/g, "$1’$2");
}

/** The distinguishing words of a name, filler and punctuation set aside. */
export function nameWords(name: string): string[] {
  // A designation is an identity of its own (rule 2), scoped to its citing
  // document, so it is not a name: "Exhibit A" in two documents is two things.
  const base = normaliseQuotes(displayBase(name))
    .replace(DESIGNATION, (match, _word, id: string) => (/^[a-z]$/.test(id) ? match : " "))
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/'s\b/g, "")
    .replace(/[^a-z0-9]+/g, " ");
  return [...new Set(base.split(" ").filter((word) => word.length > 0 && !FILLER.has(word)))].sort();
}

/** What the identity rules need to know about one reference. */
export interface IdentityInput {
  readonly name: string;
  readonly citingDocumentId: string;
  readonly citingSentence: string;
}

/** Every identity key a reference carries. Two references sharing one are the same document. */
export function identityKeys(input: IdentityInput): string[] {
  const keys = formNumbers(input.name).map((form) => `form:${form}`);

  let marks = designations(input.name);
  if (marks.length === 0) {
    // "Unit Inspection Report, which is Attachment No. 2 of this Agreement":
    // a sentence naming this document and exactly one designation gives it
    // that designation. A sentence listing several gives none.
    const inSentence = designations(input.citingSentence);
    const base = displayBase(input.name).toLowerCase();
    if (
      inSentence.length === 1 &&
      base.length > 0 &&
      collapse(normaliseQuotes(input.citingSentence)).toLowerCase().includes(normaliseQuotes(base).toLowerCase())
    ) {
      marks = inSentence;
    }
  }
  keys.push(...marks.map((mark) => `designation:${input.citingDocumentId}:${mark}`));

  const words = nameWords(input.name);
  if (words.length > 0) keys.push(`name:${words.join(" ")}`);
  return keys;
}

function isStrictSubset(small: readonly string[], large: readonly string[]): boolean {
  if (small.length >= large.length) return false;
  const pool = new Set(large);
  return small.every((word) => pool.has(word));
}

function extraWordsDistinguish(small: readonly string[], large: readonly string[]): boolean {
  const inner = new Set(small);
  return large.some((word) => !inner.has(word) && DISTINGUISHING.has(word));
}

/**
 * Groups references that name the same document. Returns groups of indexes
 * into `inputs`, each group in input order, groups ordered by their first
 * member. The same input always gives the same groups.
 */
export function groupSameDocuments(inputs: readonly IdentityInput[]): number[][] {
  const parent = inputs.map((_, index) => index);
  const find = (index: number): number => {
    while (parent[index] !== index) {
      parent[index] = parent[parent[index]];
      index = parent[index];
    }
    return index;
  };
  const union = (left: number, right: number) => {
    const a = find(left);
    const b = find(right);
    if (a !== b) parent[Math.max(a, b)] = Math.min(a, b);
  };

  // Rules 1 to 3: a shared key.
  const owner = new Map<string, number>();
  inputs.forEach((input, index) => {
    for (const key of identityKeys(input)) {
      const first = owner.get(key);
      if (first === undefined) owner.set(key, index);
      else union(first, index);
    }
  });

  // Rule 4: containment, only along a single chain of longer names.
  const words = inputs.map((input) => nameWords(input.name));
  for (let changed = true; changed;) {
    changed = false;
    for (let index = 0; index < inputs.length; index += 1) {
      const small = words[index];
      if (small.length < MINIMUM_CONTAINED_WORDS) continue;
      const containers = words
        .map((large, other) => ({ large, other }))
        .filter(({ large, other }) =>
          find(other) !== find(index) &&
          isStrictSubset(small, large) &&
          !extraWordsDistinguish(small, large),
        );
      if (containers.length === 0) continue;
      const byLength = [...containers].sort((a, b) => a.large.length - b.large.length);
      const isChain = byLength.every((entry, position) =>
        position === 0 ||
        find(entry.other) === find(byLength[position - 1].other) ||
        isStrictSubset(byLength[position - 1].large, entry.large) ||
        byLength[position - 1].large.join(" ") === entry.large.join(" "),
      );
      if (!isChain) continue;
      for (const { other } of containers) union(index, other);
      changed = true;
    }
  }

  const groups = new Map<number, number[]>();
  inputs.forEach((_, index) => {
    const root = find(index);
    const group = groups.get(root) ?? [];
    group.push(index);
    groups.set(root, group);
  });
  return [...groups.values()].sort((a, b) => a[0] - b[0]);
}

/**
 * The one name the signer sees for a group of names of the same document:
 * the fullest of them (the longest once labels and form numbers are set
 * aside, the earliest on a tie), extended to the fullest form the citing
 * text itself uses (see {@link fullestTitleInText}), with the group's form
 * number, if any, added back as "(form HUD-50059)". Falls back to the first name as given
 * when every name was only a label ("Attachment No. 1").
 */
export function canonicalName(names: readonly string[], citingText = ""): string {
  let best = "";
  for (const name of names) {
    const base = displayBase(name);
    if (base.length > best.length) best = base;
  }
  if (best.length > 0 && citingText.length > 0) best = fullestTitleInText(citingText, best);
  const forms = [...new Set(names.flatMap(formNumbers))].sort();
  const form = forms[0];
  if (best.length === 0) {
    if (form) return `Form ${displayFormNumber(form)}`;
    return collapse(normaliseQuotes(names[0] ?? "")).replace(/(\w)'(\w)/g, "$1’$2");
  }
  return form ? `${best} (form ${displayFormNumber(form)})` : best;
}

/** Title-case words that start a sentence or name a party, never part of a document's title. */
const NOT_TITLE_WORDS = new Set([
  "the", "a", "an", "this", "that", "these", "those", "each", "any", "all", "such", "its", "their",
  "our", "your", "his", "her", "tenant", "tenants", "landlord", "landlords", "lessee", "lessor",
  "resident", "residents", "leaseholder", "owner", "see", "under", "per", "and", "or", "of", "in",
]);
const MAXIMUM_TITLE_EXTENSION = 3;

/**
 * The model may shorten a title ("University Student Code of Conduct") that
 * the lease itself gives in full elsewhere ("Ohio University Student Code of
 * Conduct"). Wherever the name appears in the citing text, this extends it
 * left over the capitalised words that directly precede it on the same line
 * (up to three, never across punctuation, a possessive, or a word such as
 * "the" or "Tenant"), and returns the longest form found. The name the
 * signer sees then comes from the lease, not from how one reply worded it.
 */
export function fullestTitleInText(text: string, name: string): string {
  // A short generic name ("Lease Addendum") could be the tail of another
  // document's title, so only a name of three words or more is extended.
  if (nameWords(name).length < MINIMUM_CONTAINED_WORDS) return name;
  const needle = collapse(normaliseQuotes(name)).toLowerCase();
  let best = name;
  for (const rawLine of normaliseQuotes(text).split("\n")) {
    const line = collapse(rawLine);
    const lower = line.toLowerCase();
    for (let at = lower.indexOf(needle); at >= 0; at = lower.indexOf(needle, at + 1)) {
      const before = line.slice(0, at);
      if (before.length > 0 && !before.endsWith(" ")) continue;
      const words = before.trimEnd().split(" ").filter((word) => word.length > 0);
      const taken: string[] = [];
      while (taken.length < MAXIMUM_TITLE_EXTENSION && words.length > 0) {
        const word = words[words.length - 1];
        const plain = word.toLowerCase();
        if (!/^[A-Z][A-Za-z&-]*$/.test(word) || NOT_TITLE_WORDS.has(plain) || plain.split("-").some((part) => DISTINGUISHING.has(part))) break;
        taken.unshift(word);
        words.pop();
      }
      if (taken.length === 0) continue;
      const candidate = `${taken.join(" ")} ${line.slice(at, at + needle.length)}`.replace(/(\w)'(\w)/g, "$1’$2");
      if (candidate.length > best.length) best = candidate;
    }
  }
  return best;
}

/** A short, stable slug for the id of a group, from its strongest key. */
export function identitySlug(keys: readonly string[]): string {
  const strongest =
    keys.find((key) => key.startsWith("form:")) ??
    keys.find((key) => key.startsWith("designation:"))?.replace(/^designation:[^:]*:/, "designation:") ??
    keys.find((key) => key.startsWith("name:")) ??
    "unnamed";
  return strongest.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

/**
 * Where a name first appears in a text, in original offsets, ignoring case,
 * quote style and spacing. Tries the name as given (without a leading
 * "Attachment No. 1:" label), its display form, and both with "&" and "and"
 * swapped. -1 when none of them appears.
 */
export function firstMention(text: string, name: string): number {
  const forms = [normaliseQuotes(name).replace(LEADING_DESIGNATION, ""), displayBase(name)]
    .map((form) => collapse(normaliseQuotes(form)).toLowerCase())
    .filter((form) => form.length > 0);
  const variants = [...new Set(forms.flatMap((form) => [
    form,
    form.replace(/\s*&\s*/g, " and "),
    form.replace(/\band\b/g, "&"),
  ]))];
  const found = variants.map((variant) => locateLoosely(text, variant)).filter((offset) => offset >= 0);
  return found.length > 0 ? Math.min(...found) : -1;
}

function locateLoosely(text: string, needle: string): number {
  // Build a lower-cased, single-spaced copy of the text with a map back to
  // original offsets. Quote normalisation keeps lengths, so the map holds.
  const source = normaliseQuotes(text);
  let flat = "";
  const offsets: number[] = [];
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (/\s/.test(character)) {
      if (flat.length > 0 && flat[flat.length - 1] !== " ") {
        flat += " ";
        offsets.push(index);
      }
      continue;
    }
    const lower = character.toLowerCase();
    if (lower.length !== 1) return -1;
    flat += lower;
    offsets.push(index);
  }
  const found = flat.indexOf(needle);
  return found === -1 ? -1 : offsets[found];
}
