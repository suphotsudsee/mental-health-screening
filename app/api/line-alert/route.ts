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
    let hasError = false;

    try {
      results.group = await sendLineAlertToGroup(text);
    } catch (err) {
      hasError = true;
      results.groupError = err instanceof Error ? err.message : String(err);
    }

    if (userId && typeof userId === "string") {
      try {
        results.user = await sendLineAlertToUser(text, userId);
      } catch (err) {
        hasError = true;
        results.userError = err instanceof Error ? err.message : String(err);
      }
    }

    return NextResponse.json(results, { status: hasError ? 207 : 200 });
  } catch (err: unknown) {
    console.error("LINE Messaging API error:", err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
