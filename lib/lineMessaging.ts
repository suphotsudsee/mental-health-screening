type PushTarget = {
  to: string;
  label: string;
};

const cleanEnv = (value?: string | null) =>
  typeof value === "string" ? value.trim() : "";

const enabled =
  (process.env.NEXT_PUBLIC_ENABLE_LINE_NOTIFY || "true").toLowerCase() ===
  "true";

const pushMessage = async ({ to, label }: PushTarget, text: string) => {
  const token = cleanEnv(process.env.LINE_CHANNEL_ACCESS_TOKEN);
  const target = cleanEnv(to);

  if (!enabled) {
    console.log(`[LINE] disabled by NEXT_PUBLIC_ENABLE_LINE_NOTIFY (${label})`);
    return { success: true, disabled: true };
  }

  if (!token) {
    throw new Error("LINE_CHANNEL_ACCESS_TOKEN is missing");
  }

  if (!target) {
    throw new Error(`LINE ${label} target is empty`);
  }

  const body = {
    to: target,
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
    throw new Error(
      `Failed to send LINE message to ${label} (status ${res.status}): ${errText}`
    );
  }

  return { success: true };
};

export async function sendLineAlertToGroup(text: string) {
  const groupId = cleanEnv(process.env.LINE_GROUP_ID);
  if (!groupId) {
    throw new Error("LINE_GROUP_ID is missing or empty");
  }
  return pushMessage({ to: groupId, label: "group" }, text);
}

export async function sendLineAlertToUser(text: string, userId: string) {
  if (!userId) {
    throw new Error("userId is required to send a user alert");
  }
  return pushMessage({ to: userId, label: `user:${userId}` }, text);
}
