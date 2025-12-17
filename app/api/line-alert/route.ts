import {
  sendLineAlertToGroup,
  sendLineAlertToUser
} from "@/lib/lineMessaging";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, userId } = await req.json();

    if (!text || typeof text !== "string" || text.trim() === "") {
      return NextResponse.json(
        { error: "message text is required" },
        { status: 400 }
      );
    }

    const results: Record<string, unknown> = {};

    results.group = await sendLineAlertToGroup(text);

    if (userId && typeof userId === "string") {
      results.user = await sendLineAlertToUser(text, userId);
    }

    return NextResponse.json(results);
  } catch (err: unknown) {
    console.error("LINE Messaging API error:", err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
