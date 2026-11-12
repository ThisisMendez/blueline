import { z } from "zod";

/**
 * A text field the contract allows to be null, read leniently in one way
 * only: an empty or whitespace-only string is taken as the null it stands
 * for. Models given `["string", "null"]` sometimes write `""` for "nothing
 * here"; that carries no content either way, so accepting it saves a retry
 * without letting anything through that means something different. A
 * non-empty string still has to be real text.
 */
export function nullableText() {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim().length === 0 ? null : value),
    z.string().trim().min(1).nullable(),
  );
}
