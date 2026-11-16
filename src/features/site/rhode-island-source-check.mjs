import { createHash } from "node:crypto";

const REVIEW_INTERVAL = 30 * 24 * 60 * 60 * 1000;
const DAY_FORMAT = /^\d{4}-\d{2}-\d{2}$/;
const OFFICIAL_ORIGIN = "https://webserver.rilegislature.gov";
const OFFICIAL_PATH = /^(?:\/Statutes\/TITLE34\/34-18\/(?:index|34-18-\d+(?:\.\d+)?)\.htm|\/Lawrevision\/plshort\/pl\d{4}sub\.htm|\/PublicLaws\/law\d{2}\/law\d{5}\.htm)$/i;

/**
 * @typedef {{id: string, url: string, reviewedOn?: string, reviewBy?: string,
 *   reviewer?: string, sha256?: string, amendmentEffectiveOn?: string}} Source
 */

/** @param {string | undefined} date */
function parseDay(date) {
  if (!date || !DAY_FORMAT.test(date)) return NaN;
  const value = Date.parse(date);
  return Number.isFinite(value) && new Date(value).toISOString().startsWith(date) ? value : NaN;
}

/** @param {Source} source @param {number} now */
export function sourceReviewProblem(source, now) {
  const reviewedAt = parseDay(source.reviewedOn);
  const deadline = parseDay(source.reviewBy);
  if (!/^[a-f0-9]{64}$/.test(source.sha256 ?? "") || !source.reviewer?.trim() ||
      !Number.isFinite(reviewedAt) || !Number.isFinite(deadline) || reviewedAt > now ||
      deadline <= reviewedAt || deadline > reviewedAt + REVIEW_INTERVAL) {
    return "Missing or invalid reviewed baseline";
  }
  if (source.amendmentEffectiveOn) {
    const effectiveAt = parseDay(source.amendmentEffectiveOn);
    if (!Number.isFinite(effectiveAt)) return "Invalid amendment effective date";
    if (now >= effectiveAt) return "Recorded amendment took effect and needs review";
  }
  return now >= deadline ? "Review deadline passed" : null;
}

/** @param {Source} source @param {number} now @param {typeof fetch} [fetchSource] @param {number} [timeout] */
export async function checkSource(source, now, fetchSource = fetch, timeout = 10_000) {
  const issues = [];
  const problem = sourceReviewProblem(source, now);
  if (problem) issues.push(problem);

  try {
    const url = new URL(source.url);
    if (url.origin !== OFFICIAL_ORIGIN || url.username || url.password || url.search || url.hash ||
        !OFFICIAL_PATH.test(url.pathname)) {
      issues.push("Source URL is outside the official Rhode Island allowlist");
      return issues;
    }
    const response = await fetchSource(url.href, {
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(timeout),
    });
    if (!response.ok) {
      issues.push(`Source returned HTTP ${response.status}`);
    } else {
      const contentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
      if (response.redirected || contentType !== "text/html") {
        issues.push("Source redirected or returned a non-HTML response");
      } else {
        const bytes = Buffer.from(await response.arrayBuffer());
        const sha256 = createHash("sha256").update(bytes).digest("hex");
        if (!bytes.length) issues.push("Source returned no content");
        else if (source.sha256 && sha256 !== source.sha256) issues.push("Source changed");
        else if (!source.sha256) issues.push(`Candidate fingerprint ${sha256}`);
      }
    }
  } catch {
    issues.push("Source could not be fetched");
  }
  return issues;
}
