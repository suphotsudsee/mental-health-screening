import { NextResponse } from "next/server";

const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

export async function POST(req) {
  if (!LINE_TOKEN) {
    return NextResponse.json(
      { error: "LINE_CHANNEL_ACCESS_TOKEN is not set" },
      { status: 500 }
    );
  }

  const body = await req.json(); // { text, toUserId? }

  // ตัวอย่าง: ส่งแบบ Broadcast ไปยังกลุ่ม/ผู้รับที่กำหนดเอง
  // ที่ง่ายที่สุดคือใช้ LINE Notify (message 1 ช่อง)
  const res = await fetch("https://notify-api.line.me/api/notify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${LINE_TOKEN}`
    },
    body: new URLSearchParams({ message: body.text || "-" }).toString()
  });

  if (!res.ok) {
    const txt = await res.text();
    return NextResponse.json({ error: txt }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
