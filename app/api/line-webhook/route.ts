// app/api/line-webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || "";

/**
 * ตรวจสอบ X-Line-Signature (ป้องกันคนอื่นยิงมั่ว ๆ)
 * ถ้าช่วงแรกอยากเทสง่าย ๆ จะปิดฟังก์ชันนี้ก็ได้
 */
function verifySignature(body: string, signature: string | null): boolean {
  if (!CHANNEL_SECRET) {
    console.warn("[LINE] LINE_CHANNEL_SECRET is not set, skip verify");
    return true; // ถ้าไม่ตั้ง secret จะอนุญาตหมด (สำหรับ dev เท่านั้น)
  }
  if (!signature) return false;

  const hmac = crypto
    .createHmac("sha256", CHANNEL_SECRET)
    .update(body)
    .digest("base64");

  return hmac === signature;
}

export async function POST(req: NextRequest) {
  try {
    // ต้องอ่านเป็น raw text ก่อน เพื่อตรวจ signature
    const bodyText = await req.text();
    const signature = req.headers.get("x-line-signature");

    const ok = verifySignature(bodyText, signature);
    if (!ok) {
      console.error("[LINE] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(bodyText);

    console.log("===== LINE Webhook Event =====");
    console.log(JSON.stringify(body, null, 2));

    // ดึง groupId / roomId / userId ออกมาชัด ๆ
    const events = body.events || [];
    for (const ev of events) {
      const source = ev.source || {};
      if (source.groupId) {
        console.log(">>> groupId ที่ได้จาก event นี้:", source.groupId);
      } else if (source.roomId) {
        console.log(">>> roomId ที่ได้จาก event นี้:", source.roomId);
      } else if (source.userId) {
        console.log(">>> userId (1:1 chat):", source.userId);
      }
    }

    // LINE ต้องการ HTTP 200 เสมอ เพื่อถือว่ารับ event แล้ว
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[LINE] Webhook error:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}

// optional: เอาไว้เช็คว่า endpoint ยังอยู่
export async function GET() {
  return NextResponse.json({ status: "ok", message: "LINE webhook endpoint" });
}
