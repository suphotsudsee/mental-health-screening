export async function sendLineAlertToGroup(text: string) {
  const enabled =
    (process.env.NEXT_PUBLIC_ENABLE_LINE_NOTIFY || "true").toLowerCase() ===
    "true";

  if (!enabled) {
    console.log("[LINE] disabled by NEXT_PUBLIC_ENABLE_LINE_NOTIFY");
    return { success: true, disabled: true };
  }

  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const groupId = process.env.LINE_GROUP_ID;

  if (!token) {
    throw new Error("LINE_CHANNEL_ACCESS_TOKEN is missing");
  }
  if (!groupId) {
    throw new Error("LINE_GROUP_ID is missing");
  }

  const body = {
    to: groupId, // send to LINE group
    messages: [
      {
        type: "text",
        text
      }
    ]
  };

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[LINE] push error:", res.status, errText);
    throw new Error("Failed to send LINE group message");
  }

  return { success: true };
}
