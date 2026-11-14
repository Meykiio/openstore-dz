/**
 * Telegram Bot API calls for connecting the owner's bot (core.telegram.org/bots/api).
 *
 * Only connecting happens here. Sending order messages is done by the database
 * (schema.sql section 14), which holds the token where no browser can read it.
 */

/** BotFather tokens look like 123456789:AA... (digits, colon, 20+ url-safe chars). */
export const TOKEN = /^[0-9]+:[A-Za-z0-9_-]{20,}$/;
/** Deep-link start parameter: up to 64 of A-Z a-z 0-9 _ - (Telegram's rule). */
export const LINK_CODE = /^[A-Za-z0-9_-]{16,64}$/;

type Answer<T> = { ok: true; result: T } | { ok: false; description?: string };

export class TelegramError extends Error {}

async function call<T>(
  token: string,
  method: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const answer = (await response.json().catch(() => null)) as Answer<T> | null;
  if (!answer) throw new TelegramError(`Telegram answered ${response.status}.`);
  if (!answer.ok) throw new TelegramError(answer.description ?? "Telegram refused the request.");
  return answer.result;
}

/** The bot behind a token, or a readable error (wrong or revoked token). */
export async function botName(token: string): Promise<string> {
  const me = await call<{ username?: string }>(token, "getMe");
  if (!me.username) throw new TelegramError("This token does not belong to a bot.");
  return me.username;
}

type Update = {
  update_id: number;
  message?: { text?: string; chat: { id: number; type: string } };
};

/**
 * The private chat that sent the code to the bot in the last 24 hours (Telegram
 * keeps undelivered updates that long), or null. The code arrives either as
 * "/start <code>" from the Start link, or pasted as a plain message by an owner
 * who had already pressed Start before. Fails if the bot has a webhook, since
 * getUpdates then does not work: a fresh bot has none.
 *
 * Updates are deliberately not marked as read: a retry must still see a message
 * sent before the first attempt. The newest match wins.
 */
export async function findChat(token: string, code: string): Promise<number | null> {
  const updates = await call<Update[]>(token, "getUpdates", {
    limit: 100,
    allowed_updates: ["message"],
  });
  const hit = updates.findLast(
    (u) => u.message?.chat.type === "private" && (u.message.text ?? "").includes(code),
  );
  return hit?.message?.chat.id ?? null;
}

export async function sendText(token: string, chatId: number, text: string): Promise<void> {
  await call(token, "sendMessage", { chat_id: chatId, text });
}
