import { NextRequest, NextResponse } from "next/server";

const LINE_NOTIFY_URL = "https://notify-api.line.me/api/notify";

export async function POST(req: NextRequest) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: "LINE_CHANNEL_ACCESS_TOKEN is not set" },
      { status: 500 }
    );
  }

  try {
    const { text } = await req.json();

    if (!text || text.trim() === "") {
      return NextResponse.json(
        { error: "message text is required" },
        { status: 400 }
      );
    }

    // LINE Notify expects an x-www-form-urlencoded payload
    const body = new URLSearchParams({ message: text }).toString();

    const res = await fetch(LINE_NOTIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${token}`
      },
      body
    });

    const responseText = await res.text();

    if (!res.ok) {
      // Return detailed info so the frontend can surface the LINE API error
      return NextResponse.json(
        { error: "LINE API error", status: res.status, detail: responseText },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, detail: responseText });
  } catch (err: unknown) {
    console.error("LINE Notify error:", err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
