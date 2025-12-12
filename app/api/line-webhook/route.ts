// app/api/line-webhook/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    console.log("===== LINE Webhook Raw Body =====");
    console.log(bodyText);

    // พยายาม parse JSON ถ้าได้
    try {
      const body = JSON.parse(bodyText);
      console.log("===== LINE Webhook Parsed =====");
      console.log(JSON.stringify(body, null, 2));

      const events = body.events || [];
      for (const ev of events) {
        const source = ev.source || {};
        if (source.groupId) {
          console.log(">>> groupId:", source.groupId);
        } else if (source.roomId) {
          console.log(">>> roomId:", source.roomId);
        } else if (source.userId) {
          console.log(">>> userId:", source.userId);
        }
      }
    } catch (e) {
      console.warn("Cannot parse JSON body:", e);
    }

    // ต้องตอบ 200 ให้ LINE เสมอ
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Webhook error:", err);
    // ถึงจะ error ก็ยังตอบ 200 กลับ LINE เพื่อให้ Verify ผ่านไปก่อน
    return NextResponse.json({ success: true, error: "handled" });
  }
}

// optional GET ใช้เช็คเองใน browser
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
