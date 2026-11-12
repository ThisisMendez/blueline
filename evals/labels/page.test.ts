import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";

const html = readFileSync("evals/labels/index.html", "utf8");
const script = html.slice(html.indexOf("<script>") + "<script>".length, html.indexOf("</script>"));
const body = html.slice(html.indexOf("<body>") + "<body>".length, html.indexOf("<script>"));

const batch = {
  batch: "batch-test", form: "six-part", title: "Test batch", model: "m", source: "synthetic",
  flags: [
    { number: 1, key: "k1", document: "doc", documentTitle: "Doc", severity: "low", quotedSentence: "Rent is due.", consequence: "You pay rent.", paragraph: "Rent is due. Pets allowed." },
    { number: 2, key: "k2", document: "doc", documentTitle: "Doc", severity: "high", quotedSentence: "Pets allowed.", consequence: "Pets cost money.", paragraph: "Rent is due. Pets allowed." },
  ],
};

function boot(status: { batch: boolean; locked: boolean }, saved: unknown = null) {
  const puts: unknown[] = [];
  document.body.innerHTML = body;
  localStorage.clear();
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === "PUT") {
      puts.push(JSON.parse(String(init.body)));
      return new Response(status.locked ? "locked" : '{"saved":true}', { status: status.locked ? 423 : 200 });
    }
    const map: Record<string, unknown> = { "/flags.json": batch, "/labels.json": saved, "/prd.json": [{ title: "Guide", markdown: "Some text" }], "/status.json": status };
    return new Response(JSON.stringify(map[url] ?? null), { status: 200 });
  }));
  new Function(script)();
  return puts;
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("the labelling page with a six-part batch", () => {
  it("shows six verdict groups with nothing chosen, and saves only what the reviewer picks", async () => {
    const puts = boot({ batch: true, locked: false });
    await settle();
    expect(document.querySelectorAll("#six fieldset")).toHaveLength(6);
    expect(document.querySelectorAll("#six input:checked")).toHaveLength(0);
    expect(document.getElementById("f-consequence")?.textContent).toContain("You pay rent.");

    const materiality = document.querySelector<HTMLInputElement>('input[name="dim-materiality"][value="ordinary"]')!;
    materiality.click();
    document.querySelector<HTMLButtonElement>('.choice[data-label="FAIL"]')!.click();
    await settle();
    const last = puts.at(-1) as { version: number; flags: Record<string, { verdicts: Record<string, string | null>; overall: string | null }> };
    expect(last.version).toBe(2);
    expect(last.flags["1"].verdicts.materiality).toBe("ordinary");
    expect(last.flags["1"].verdicts.quotation).toBeNull();
    expect(last.flags["1"].overall).toBe("FAIL");
    // The other flag is untouched: nothing is pre-filled.
    expect(last.flags["2"].overall).toBeNull();
    expect(Object.values(last.flags["2"].verdicts).every((value) => value === null)).toBe(true);
  });

  it("is read only once the verdicts are locked", async () => {
    const saved = { version: 2, batch: "batch-test", reviewerId: "R1", flags: {}, updatedAt: null };
    const puts = boot({ batch: true, locked: true }, saved);
    await settle();
    expect(document.getElementById("locked")?.hidden).toBe(false);
    document.querySelector<HTMLButtonElement>('.choice[data-label="PASS"]')!.click();
    await settle();
    expect(puts).toEqual([]);
  });
});

describe("the labelling page with the original ten flags", () => {
  it("still records one PASS/FAIL and a note per flag", async () => {
    const tenFlags = JSON.parse(readFileSync("evals/labels/flags.json", "utf8"));
    const puts: unknown[] = [];
    document.body.innerHTML = body;
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === "PUT") { puts.push(JSON.parse(String(init.body))); return new Response('{"saved":true}'); }
      const map: Record<string, unknown> = { "/flags.json": tenFlags, "/labels.json": null, "/prd.json": [], "/status.json": { batch: false, locked: false } };
      return new Response(JSON.stringify(map[url] ?? null));
    }));
    new Function(script)();
    await settle();
    expect(document.getElementById("six")?.hidden).toBe(true);
    document.querySelector<HTMLButtonElement>('.choice[data-label="PASS"]')!.click();
    await settle();
    const last = puts.at(-1) as { version: number; flags: Record<string, { label: string | null }> };
    expect(last.version).toBe(1);
    expect(last.flags["1"].label).toBe("PASS");
  });
});
