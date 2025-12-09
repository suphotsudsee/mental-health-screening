import { NextResponse } from "next/server";

const LINE_NOTIFY_URL = "https://notify-api.line.me/api/notify";

export async function POST(req) {
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

    // LINE Notify ต้องการ x-www-form-urlencoded
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
      // ส่ง error กลับให้ frontend ดูได้
      return NextResponse.json(
        { error: "LINE API error", status: res.status, detail: responseText },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, detail: responseText });
  } catch (err) {
    console.error("LINE Notify error:", err);
    return NextResponse.json(
      { error: err.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
