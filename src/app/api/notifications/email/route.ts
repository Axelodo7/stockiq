import { NextRequest, NextResponse } from "next/server";
import { sendEmail, buildAlertEmail, buildPredictionEmail } from "@/lib/services/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, to, ticker, condition, target, current, signal, confidence, targetPrice } = body;

    if (!to) {
      return NextResponse.json({ success: false, error: "Email address required" }, { status: 400 });
    }

    let emailPayload;
    if (type === "alert") {
      if (!ticker || !condition || !target || !current) {
        return NextResponse.json({ success: false, error: "Missing alert parameters" }, { status: 400 });
      }
      emailPayload = buildAlertEmail(ticker, condition, target, current);
    } else if (type === "prediction") {
      if (!ticker || !signal || !confidence || !targetPrice) {
        return NextResponse.json({ success: false, error: "Missing prediction parameters" }, { status: 400 });
      }
      emailPayload = buildPredictionEmail(ticker, signal, confidence, targetPrice);
    } else {
      return NextResponse.json({ success: false, error: "Invalid notification type" }, { status: 400 });
    }

    const sent = await sendEmail({ ...emailPayload, to });

    if (sent) {
      return NextResponse.json({ success: true, message: "Email sent successfully" });
    } else {
      return NextResponse.json({ success: false, message: "Email service not configured or failed" }, { status: 503 });
    }
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
