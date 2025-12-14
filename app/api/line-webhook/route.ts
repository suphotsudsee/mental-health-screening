import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || "";

// Keep this handler on the Node.js runtime so we can use the built-in crypto module.
export const runtime = "nodejs";

function verifySignature(body: Buffer, signature: string | null): boolean {
  if (!CHANNEL_SECRET) {
    console.warn("[LINE] LINE_CHANNEL_SECRET is not set, skip verification");
    return true;
  }

  if (!signature) {
    console.warn("[LINE] Missing X-Line-Signature header");
    return false;
  }

  const hmac = crypto
    .createHmac("sha256", CHANNEL_SECRET)
    .update(body)
    .digest("base64");

  return hmac === signature;
}

export async function POST(req: NextRequest) {
  try {
    // Use the raw request body for signature verification.
    const bodyBuffer = Buffer.from(await req.arrayBuffer());
    const bodyText = bodyBuffer.toString("utf-8");
    const signature = req.headers.get("x-line-signature");

    const isValid = verifySignature(bodyBuffer, signature);
    if (!isValid) {
      // Respond 200 so LINE stops retrying, but log the invalid signature.
      console.warn("[LINE] Invalid signature, ignoring payload");
      return NextResponse.json(
        { success: false, error: "Invalid LINE signature" },
        { status: 200 }
      );
    }

    const body = JSON.parse(bodyText);

    console.log("===== LINE Webhook Event =====");
    console.log(JSON.stringify(body, null, 2));

    const events = body.events || [];
    for (const ev of events) {
      const source = ev.source || {};
      if (source.groupId) {
        console.log("[LINE] groupId:", source.groupId);
      } else if (source.roomId) {
        console.log("[LINE] roomId:", source.roomId);
      } else if (source.userId) {
        console.log("[LINE] userId (1:1 chat):", source.userId);
      }
    }

    // LINE needs HTTP 200 to treat the webhook as delivered.
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[LINE] Webhook error:", err);
    // Still respond 200 to avoid a retry storm from LINE; the error is logged for debugging.
    return NextResponse.json({ error: "Webhook error" }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", message: "LINE webhook endpoint" });
}
