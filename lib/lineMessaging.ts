type PushTarget = {
  to: string;
  label: string;
};

const enabled =
  (process.env.NEXT_PUBLIC_ENABLE_LINE_NOTIFY || "true").toLowerCase() ===
  "true";

const pushMessage = async ({ to, label }: PushTarget, text: string) => {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!enabled) {
    console.log(`[LINE] disabled by NEXT_PUBLIC_ENABLE_LINE_NOTIFY (${label})`);
    return { success: true, disabled: true };
  }

  if (!token) {
    throw new Error("LINE_CHANNEL_ACCESS_TOKEN is missing");
  }

  const body = {
    to,
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
    console.error(`[LINE] push error (${label}):`, res.status, errText);
    throw new Error(`Failed to send LINE message to ${label}`);
  }

  return { success: true };
};

export async function sendLineAlertToGroup(text: string) {
  const groupId = process.env.LINE_GROUP_ID;
  if (!groupId) {
    throw new Error("LINE_GROUP_ID is missing");
  }
  return pushMessage({ to: groupId, label: "group" }, text);
}

export async function sendLineAlertToUser(text: string, userId: string) {
  if (!userId) {
    throw new Error("userId is required to send a user alert");
  }
  return pushMessage({ to: userId, label: `user:${userId}` }, text);
}
