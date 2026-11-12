// Serves the flag labelling page. Node built-ins only.
// npm run label                                  ->  the ten flags, PASS/FAIL (labels.json)
// npm run label -- --batch evals/judge/batch-2   ->  a six-part batch (<batch>/verdicts.json)
// Listens on http://127.0.0.1:4317 (or the next free port).
import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { readFile, writeFile, rename } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");
const batchAt = process.argv.indexOf("--batch");
// A batch folder holds batch.json; verdicts save next to it, and stop saving once verdicts.lock.json exists.
const batchDir = batchAt >= 0 && process.argv[batchAt + 1] ? path.resolve(repoRoot, process.argv[batchAt + 1]) : null;
const flagsPath = batchDir ? path.join(batchDir, "batch.json") : path.join(here, "flags.json");
const labelsPath = batchDir ? path.join(batchDir, "verdicts.json") : path.join(here, "labels.json");
const lockPath = batchDir ? path.join(batchDir, "verdicts.lock.json") : null;
if (batchDir && !existsSync(flagsPath)) {
  console.error(`No batch.json in ${batchDir}`);
  process.exit(1);
}
const HOST = "127.0.0.1";
const FIRST_PORT = 4317;
const MAX_BODY = 1_000_000;

// The two PRD.md sections the page shows, read fresh on every request so the
// page always matches PRD.md word for word.
const PRD_SECTIONS = ["What good looks like", "My red lines"];

// In batch mode the page shows the reviewer guide and the overall rule instead.
async function guideSections() {
  const guide = await readFile(path.join(repoRoot, "evals", "reviewer-guide.md"), "utf8");
  const rubric = await readFile(path.join(repoRoot, "evals", "judge", "rubric-v2.md"), "utf8");
  const lines = rubric.split("\n");
  const start = lines.findIndex((line) => line.trim() === "## The overall verdict");
  let end = lines.findIndex((line, i) => i > start && /^## /.test(line));
  if (end === -1) end = lines.length;
  return [
    { title: "The overall verdict (from evals/judge/rubric-v2.md)", markdown: start === -1 ? null : lines.slice(start + 1, end).join("\n").trim() },
    { title: "Reviewer guide (evals/reviewer-guide.md)", markdown: guide.split("\n").filter((line) => !/^# /.test(line)).join("\n").trim() },
  ];
}

async function prdSections() {
  const prd = await readFile(path.join(repoRoot, "PRD.md"), "utf8");
  const lines = prd.split("\n");
  return PRD_SECTIONS.map((title) => {
    const start = lines.findIndex((line) => line.trim() === `## ${title}`);
    if (start === -1) return { title, markdown: null };
    let end = lines.findIndex((line, i) => i > start && /^#{1,2} /.test(line));
    if (end === -1) end = lines.length;
    return { title, markdown: lines.slice(start + 1, end).join("\n").trim() };
  });
}

function send(res, status, type, body) {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(body);
}

async function readBody(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new Error("too large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function handle(req, res) {
  const url = new URL(req.url, `http://${HOST}`);
  try {
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      return send(res, 200, "text/html; charset=utf-8", await readFile(path.join(here, "index.html")));
    }
    if (req.method === "GET" && url.pathname === "/flags.json") {
      return send(res, 200, "application/json; charset=utf-8", await readFile(flagsPath));
    }
    if (req.method === "GET" && url.pathname === "/prd.json") {
      return send(res, 200, "application/json; charset=utf-8", JSON.stringify(batchDir ? await guideSections() : await prdSections()));
    }
    if (req.method === "GET" && url.pathname === "/status.json") {
      return send(res, 200, "application/json; charset=utf-8", JSON.stringify({ batch: Boolean(batchDir), locked: Boolean(lockPath && existsSync(lockPath)) }));
    }
    if (req.method === "GET" && url.pathname === "/labels.json") {
      try {
        return send(res, 200, "application/json; charset=utf-8", await readFile(labelsPath));
      } catch (error) {
        if (error.code === "ENOENT") return send(res, 200, "application/json; charset=utf-8", "null");
        throw error;
      }
    }
    if (req.method === "PUT" && url.pathname === "/labels.json") {
      if (lockPath && existsSync(lockPath)) {
        return send(res, 423, "text/plain; charset=utf-8", "These verdicts are locked and can't be changed.");
      }
      const parsed = JSON.parse(await readBody(req));
      if (!parsed || typeof parsed !== "object" || typeof parsed.flags !== "object") {
        return send(res, 400, "text/plain; charset=utf-8", "Expected an object with a flags field.");
      }
      // Write to a temporary file first so a crash mid-write can't leave half a file.
      const tmp = `${labelsPath}.tmp`;
      await writeFile(tmp, JSON.stringify(parsed, null, 2) + "\n");
      await rename(tmp, labelsPath);
      return send(res, 200, "application/json; charset=utf-8", '{"saved":true}');
    }
    send(res, 404, "text/plain; charset=utf-8", "Not found");
  } catch (error) {
    send(res, error instanceof SyntaxError ? 400 : 500, "text/plain; charset=utf-8", String(error.message || error));
  }
}

function listen(port) {
  const server = createServer(handle);
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && port < FIRST_PORT + 50) listen(port + 1);
    else {
      console.error(error.message);
      process.exit(1);
    }
  });
  server.listen(port, HOST, () => {
    console.log(`Labelling page: http://${HOST}:${port}`);
    console.log(`Labels save to ${path.relative(repoRoot, labelsPath)}${lockPath && existsSync(lockPath) ? " (locked: read only)" : ""}`);
  });
}

listen(FIRST_PORT);
