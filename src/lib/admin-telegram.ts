import { useQuery } from "@tanstack/react-query";
import { getSupabase } from "./supabase/client";

/**
 * Admin > Integrations > Telegram: a message for every new order.
 * Connecting goes through /api/telegram (checks the token, finds the owner's
 * chat); the database stores the token and never gives it back.
 */

type TelegramStatus =
  | { connected: false }
  | {
      connected: true;
      bot_username: string;
      lang: TelegramLang;
      enabled: boolean;
      updated_at: string;
    };

/** The languages a message can be written in (schema.sql telegram_words). */
export const TELEGRAM_LANGS = ["ar", "fr", "en"] as const;
export type TelegramLang = (typeof TELEGRAM_LANGS)[number];

export const TELEGRAM_KEY = ["telegram_status"] as const;

async function fetchStatus(): Promise<TelegramStatus> {
  const { data, error } = await getSupabase().rpc("telegram_status");
  if (error) throw new Error(error.message);
  return data as TelegramStatus;
}

export function useTelegramStatus() {
  return useQuery({ queryKey: TELEGRAM_KEY, queryFn: fetchStatus });
}

/** True when the database has not been updated for Telegram yet. */
export function isMissingTelegram(message: string): boolean {
  return message.includes("telegram_status") || message.includes("schema cache");
}

/** A fresh one-time code for t.me/<bot>?start=<code>: 16 hex characters (64 bits). */
export function newLinkCode(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

async function post(body: Record<string, unknown>): Promise<{ username?: string; error?: string }> {
  const { data } = await getSupabase().auth.getSession();
  const session = data.session?.access_token;
  if (!session) return { error: "Sign in again." };
  const response = await fetch("/api/telegram", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${session}` },
    body: JSON.stringify(body),
  });
  return ((await response.json().catch(() => null)) ?? { error: `Error ${response.status}` }) as {
    username?: string;
    error?: string;
  };
}

export const checkBotToken = (token: string) => post({ action: "check", token });
export const linkTelegram = (token: string, code: string, lang: TelegramLang) =>
  post({ action: "link", token, code, lang });

export async function setTelegramLang(lang: TelegramLang): Promise<void> {
  const { error } = await getSupabase().rpc("telegram_set_lang", { p_lang: lang });
  if (error) throw new Error(error.message);
}

export async function setTelegramEnabled(enabled: boolean): Promise<void> {
  const { error } = await getSupabase().rpc("telegram_set_enabled", { p_enabled: enabled });
  if (error) throw new Error(error.message);
}

export async function sendTelegramTest(): Promise<boolean> {
  const { data, error } = await getSupabase().rpc("telegram_test");
  if (error) throw new Error(error.message);
  return data;
}

export async function disconnectTelegram(): Promise<void> {
  const { error } = await getSupabase().rpc("telegram_disconnect");
  if (error) throw new Error(error.message);
}
