import { NextResponse } from "next/server";
import { getDb, DBCollection } from "@/lib/mongo";
import { jsonError } from "@/lib/errors";
import { parseRegisterPayload } from "@/lib/validation";
import type { EventRegistration } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = parseRegisterPayload(body);
    const eventId = data.eventId || process.env.EVENT_ID || "default";

    const db = await getDb();
    const col = db.collection<EventRegistration>(DBCollection.EVENT_REGISTRATIONS);

    const now = new Date();
    const doc: EventRegistration = {
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      eventId,
      age: data.age,
      surveyAnswers: data.surveyAnswers,
      paymentStatus: "pending",
      createdAt: now,
      updatedAt: now,
    };

    // Block re-registration when this email OR phone has already PAID for the
    // event. Pending/failed registrations fall through so abandoned-checkout
    // users can still complete payment. Phone is matched on its last 10 digits
    // so +91 / 91 prefixes don't cause false misses.
    const phoneDigits = doc.phone.replace(/\D/g, "").slice(-10);
    const dedupeClauses: Record<string, unknown>[] = [{ email: doc.email }];
    if (phoneDigits.length === 10) {
      dedupeClauses.push({ phone: { $regex: `${phoneDigits}$` } });
    }
    const alreadyPaid = await col.findOne({
      eventId,
      paymentStatus: "success",
      $or: dedupeClauses,
    });
    if (alreadyPaid?._id) {
      return NextResponse.json({
        registrationId: alreadyPaid._id.toString(),
        paymentStatus: "success",
        alreadyRegistered: true,
      });
    }

    try {
      const result = await col.insertOne(doc);
      return NextResponse.json({
        registrationId: result.insertedId.toString(),
        paymentStatus: "pending",
      });
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        const existing = await col.findOne({
          email: doc.email,
          eventId,
        });
        if (existing?._id) {
          return NextResponse.json({
            registrationId: existing._id.toString(),
            paymentStatus: existing.paymentStatus,
          });
        }
      }
      throw err;
    }
  } catch (err) {
    return jsonError(err);
  }
}

function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: number }).code === 11000
  );
}
