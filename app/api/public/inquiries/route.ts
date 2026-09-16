import { InquiryError, submitInquiry, type SubmitInquiryInput } from "../../../admin/inquiry-store";
import { isSameOriginCommandRequest } from "../../../admin/request-policy";

export const dynamic = "force-dynamic";

// Very small in-memory per-source rate limit, same spirit as
// app/staff/session.ts's staffLoginRateLimit — this is a single-process
// deployment, so an in-memory map is fine, and inquiries are low-volume by
// nature (this isn't a high-traffic public form).
type Bucket = { submissions: number[] };
const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60 * 60 * 1000;
const LIMIT = 5;

function rateLimited(key: string, now = Date.now()) {
  const bucket = buckets.get(key) ?? { submissions: [] };
  bucket.submissions = bucket.submissions.filter((time) => now - time < WINDOW_MS);
  buckets.set(key, bucket);
  if (bucket.submissions.length >= LIMIT) return true;
  bucket.submissions.push(now);
  return false;
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readHeadcount(value: unknown) {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) ? parsed : 0;
}

export async function POST(request: Request) {
  if (
    !isSameOriginCommandRequest({
      origin: request.headers.get("origin"),
      requestUrl: request.url,
    })
  ) {
    return Response.json(
      { error: "Cross-origin inquiry submissions are blocked.", code: "cross_origin_blocked" },
      { status: 403 },
    );
  }

  const source = request.headers.get("x-forwarded-for")?.split(",").pop()?.trim() || "local";
  if (rateLimited(source)) {
    return Response.json(
      { error: "Too many inquiries submitted. Please try again later.", code: "rate_limited" },
      { status: 429 },
    );
  }

  let payload: Record<string, unknown>;
  try {
    const value = await request.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    payload = value as Record<string, unknown>;
  } catch {
    return Response.json(
      { error: "Request body must be JSON.", code: "invalid_request" },
      { status: 400 },
    );
  }

  const input: SubmitInquiryInput = {
    companyName: readString(payload.companyName),
    contactName: readString(payload.contactName),
    email: readString(payload.email),
    phone: readString(payload.phone),
    eventName: readString(payload.eventName),
    eventDate: readString(payload.eventDate),
    eventLocation: readString(payload.eventLocation),
    headcount: readHeadcount(payload.headcount),
    message: readString(payload.message),
  };

  try {
    const record = await submitInquiry(input);
    return Response.json({ id: record.id }, { status: 201 });
  } catch (error) {
    if (error instanceof InquiryError && error.code === "invalid_input") {
      return Response.json(
        { error: "Required inquiry fields are missing or invalid.", code: "invalid_input" },
        { status: 400 },
      );
    }
    return Response.json(
      { error: "Inquiry could not be saved.", code: "database_error" },
      { status: 503 },
    );
  }
}
