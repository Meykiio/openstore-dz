import { originValidationResponse } from "@modelcontextprotocol/server";
import { callerClient, verifyOwnerSession } from "./mcp/auth";
import { botName, findChat, LINK_CODE, sendText, TelegramError, TOKEN } from "./telegram";

/**
 * POST /api/telegram: connect the owner's Telegram bot (Admin > Integrations).
 *
 *   { action: "check", token }        the token works? answers the bot's username
 *   { action: "link", token, code, lang }   finds the owner's "/start <code>" message,
 *                                     saves token and chat in the database, and
 *                                     sends a first message
 *
 * Owner signed in normally only (never an assistant). The token is passed
 * through once and stored by the database, which never gives it back.
 */

const json = (status: number, body: Record<string, unknown>) => Response.json(body, { status });

const LANGS = ["ar", "fr", "en"] as const;
type Lang = (typeof LANGS)[number];

/** The first message, in the language the owner chose (schema.sql telegram_words). */
const HELLO: Record<Lang, string> = {
  ar: "الإشعارات مفعّلة. ستصلك هنا كل طلبية جديدة.",
  fr: "Notifications activées. Chaque nouvelle commande arrivera ici.",
  en: "Notifications are on. Every new order will arrive here.",
};

export async function handleTelegram(request: Request): Promise<Response> {
  const rejected = originValidationResponse(request, [new URL(request.url).hostname]);
  if (rejected) return rejected;

  const session = /^Bearer (.+)$/.exec(request.headers.get("authorization") ?? "")?.[1];
  if (!session || !(await verifyOwnerSession(session))) {
    return json(401, { error: "Owner sign-in required." });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  if (!TOKEN.test(token)) return json(400, { error: "bad_token" });

  try {
    const username = await botName(token);
    if (body?.action === "check") return json(200, { username });
    if (body?.action !== "link") return json(400, { error: "Unknown action." });

    const code = typeof body.code === "string" ? body.code : "";
    if (!LINK_CODE.test(code)) return json(400, { error: "Bad code." });
    const chatId = await findChat(token, code);
    if (chatId === null) return json(404, { error: "not_started" });

    const lang = LANGS.includes(body.lang as Lang) ? (body.lang as Lang) : "ar";
    const db = callerClient(session);
    const { error } = await db.rpc("telegram_save", {
      p_bot_token: token,
      p_bot_username: username,
      p_chat_id: chatId,
      p_site_url: new URL(request.url).origin,
      p_lang: lang,
    });
    if (error) return json(500, { error: error.message });
    const { data: shop } = await db.from("store_settings").select("name").eq("id", 1).maybeSingle();
    await sendText(token, chatId, `${shop?.name.trim() || "OpenStore"}: ${HELLO[lang]}`);
    return json(200, { username });
  } catch (failure) {
    const message =
      failure instanceof TelegramError ? failure.message : "Telegram could not be reached.";
    return json(502, { error: message });
  }
}
