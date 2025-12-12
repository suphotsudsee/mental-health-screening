import { sendLineAlertToGroup } from "@/lib/lineMessaging";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string" || text.trim() === "") {
      return NextResponse.json(
        { error: "message text is required" },
        { status: 400 }
      );
    }

    const result = await sendLineAlertToGroup(text);

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("LINE Messaging API error:", err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
