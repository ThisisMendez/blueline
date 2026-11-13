import { z } from "zod";

import { contactFormId } from "./contact-config";
import {
  CONTACT_LIMITS,
  CONTACT_TOPICS,
  FEEDBACK_ROLES,
  FEEDBACK_SOURCES,
  FEEDBACK_TOPIC,
  USEFULNESS_ANSWERS,
} from "./contact-fields";

const SUBJECT = "[Blue Line] Website Contact";
const MAX_BODY_LENGTH = 16_000;
const email = z.string().trim().max(CONTACT_LIMITS.email).pipe(z.email());
const message = z.string().trim().min(1).max(CONTACT_LIMITS.message);
const website = z.string().max(254).optional();
const submission = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("contact"),
    name: z.string().trim().min(1).max(CONTACT_LIMITS.name),
    email,
    topic: z.enum(CONTACT_TOPICS),
    message,
    website,
  }),
  z.strictObject({
    kind: z.literal("feedback"),
    email: email.optional(),
    message,
    useful: z.enum(USEFULNESS_ANSWERS).optional(),
    source: z.enum(FEEDBACK_SOURCES).optional(),
    role: z.enum(FEEDBACK_ROLES).optional(),
    website,
  }),
]);

type ContactSubmission = z.infer<typeof submission>;

function notification(data: ContactSubmission) {
  const fields = {
    subject: SUBJECT,
    ...(data.email ? { email: data.email } : {}),
  };
  if (data.kind === "contact") {
    return { ...fields, name: data.name, message: `Topic: ${data.topic}\n\n${data.message}` };
  }

  const details = [
    "Topic: Beta feedback",
    data.useful && `Was this useful? ${data.useful}`,
    data.source && `From: ${data.source}`,
    data.source === "report" && data.role && `Side: ${data.role}`,
  ];
  return {
    ...fields,
    category: FEEDBACK_TOPIC,
    message: `${details.filter(Boolean).join("\n")}\n\n${data.message}`,
  };
}

export async function submitContact(request: Request): Promise<Response> {
  const formId = contactFormId();
  if (!formId) return new Response(null, { status: 503 });

  const contentType = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (contentType !== "application/json" || request.headers.get("sec-fetch-site") === "cross-site") {
    return new Response(null, { status: 400 });
  }

  const reader = request.body?.getReader();
  if (!reader) return new Response(null, { status: 400 });

  let raw: unknown;
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let body = "";
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_BODY_LENGTH) {
        await reader.cancel();
        return new Response(null, { status: 413 });
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    raw = JSON.parse(body);
  } catch {
    return new Response(null, { status: 400 });
  } finally {
    reader.releaseLock();
  }

  const parsed = submission.safeParse(raw);
  if (!parsed.success || parsed.data.website) return new Response(null, { status: 400 });

  try {
    const response = await fetch(`https://formspree.io/f/${formId}`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(notification(parsed.data)),
      signal: AbortSignal.timeout(8_000),
      redirect: "error",
    });
    if (response.ok) return new Response(null, { status: 204 });
    if (response.status === 429) return new Response(null, { status: 429 });
  } catch {
    return new Response(null, { status: 502 });
  }
  return new Response(null, { status: 502 });
}
