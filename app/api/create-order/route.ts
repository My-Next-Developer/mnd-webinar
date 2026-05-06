import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb, DBCollection } from "@/lib/mongo";
import { ApiError, jsonError } from "@/lib/errors";
import { getRazorpay } from "@/lib/razorpay";
import { parseCreateOrderPayload } from "@/lib/validation";
import type { EventRegistration, Payment } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { registrationId, amount, currency } = parseCreateOrderPayload(body);

    if (!ObjectId.isValid(registrationId)) {
      throw new ApiError(400, "Invalid registrationId");
    }

    const db = await getDb();
    const regCol = db.collection<EventRegistration>(DBCollection.EVENT_REGISTRATIONS);
    const payCol = db.collection<Payment>(DBCollection.PAYMENTS);

    const registration = await regCol.findOne({
      _id: new ObjectId(registrationId),
    });
    if (!registration) {
      throw new ApiError(404, "Registration not found");
    }
    if (registration.paymentStatus === "success") {
      throw new ApiError(409, "Payment already completed for this registration");
    }

    const finalAmount =
      amount ?? Number(process.env.DEFAULT_AMOUNT_PAISE ?? 49900);
    const finalCurrency =
      currency ?? process.env.DEFAULT_CURRENCY ?? "INR";

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: finalAmount,
      currency: finalCurrency,
      receipt: registration._id!.toString(),
      payment: {
        capture: "automatic",
        capture_options: {
          automatic_expiry_period: 12,
          manual_expiry_period: 7200,
          refund_speed: "optimum",
        },
      },
      notes: {
        registrationId: registration._id!.toString(),
        eventId: registration.eventId,
        email: registration.email,
        contact: registration.phone,
        name: registration.name,
      },
    });

    const now = new Date();
    const paymentDoc: Payment = {
      registrationId: registration._id!,
      orderId: order.id,
      amount: finalAmount,
      currency: finalCurrency,
      email: registration.email,
      eventId: registration.eventId,
      status: "created",
      createdAt: now,
      updatedAt: now,
    };
    await payCol.insertOne(paymentDoc);

    return NextResponse.json({
      orderId: order.id,
      amount: finalAmount,
      currency: finalCurrency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    return jsonError(err);
  }
}
