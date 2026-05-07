import { NextResponse } from "next/server";
import { getDb, DBCollection } from "@/lib/mongo";
import { ApiError, jsonError } from "@/lib/errors";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { parseVerifyPayload } from "@/lib/validation";
import type { EventRegistration, Payment } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      parseVerifyPayload(body);

    const db = await getDb();
    const payCol = db.collection<Payment>(DBCollection.PAYMENTS);
    const regCol = db.collection<EventRegistration>(DBCollection.EVENT_REGISTRATIONS);

    const payment = await payCol.findOne({ orderId: razorpay_order_id });
    if (!payment) {
      throw new ApiError(404, "Order not found");
    }

    const valid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );
    const now = new Date();

    if (!valid) {
      await payCol.updateOne(
        { orderId: razorpay_order_id },
        { $set: { status: "failed", updatedAt: now } }
      );
      await regCol.updateOne(
        { _id: payment.registrationId },
        { $set: { paymentStatus: "failed", updatedAt: now } }
      );
      return NextResponse.json(
        { status: "failed", error: "Invalid signature" },
        { status: 400 }
      );
    }

    await payCol.updateOne(
      { orderId: razorpay_order_id },
      {
        $set: {
          status: "success",
          paymentId: razorpay_payment_id,
          updatedAt: now,
        },
      }
    );
    await regCol.updateOne(
      { _id: payment.registrationId, paymentStatus: { $ne: "success" } },
      {
        $set: {
          paymentStatus: "success",
          paymentId: razorpay_payment_id,
          updatedAt: now,
        },
      }
    );

    return NextResponse.json({ status: "success" });
  } catch (err) {
    return jsonError(err);
  }
}
