import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { defineTool, must, type ToolContext } from "./define";

/**
 * The shop as a whole: today's picture and the settings page.
 * Money settings (flat delivery fee, free-shipping threshold) are left out on
 * purpose: they change what buyers pay and stay in Admin > Settings.
 */

function overview(server: McpServer, ctx: ToolContext) {
  defineTool(server, ctx, {
    name: "get_shop_overview",
    title: "Shop overview",
    kind: "read",
    description:
      "Orders waiting for the confirmation call, orders and confirmed value over the last days, refusal rate by wilaya, best sellers, low stock.",
    input: z.object({ days: z.number().int().min(1).max(365).default(7) }),
    run: async ({ days }) => {
      const pending = await ctx.db
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      if (pending.error) throw new Error(pending.error.message);
      const stats = must(await ctx.db.rpc("admin_analytics", { p_days: days }));
      return {
        text: `${pending.count ?? 0} order(s) waiting for the confirmation call. Figures below cover the last ${days} day(s), in dinar.`,
        data: stats,
      };
    },
  });
}

const SETTINGS_COLUMNS =
  "name, tagline, tagline_fr, description, description_fr, announcement, announcement_enabled, whatsapp, phone, email, instagram_url, facebook_url, tiktok_url, returns_days, returns_note, banner_url";

function getSettings(server: McpServer, ctx: ToolContext) {
  defineTool(server, ctx, {
    name: "get_settings",
    title: "Show shop settings",
    kind: "read",
    description: "Shop name, taglines, announcement bar, contact, social links, returns.",
    input: z.object({}),
    run: async () => ({
      text: "Shop settings.",
      data: must(await ctx.db.from("store_settings").select(SETTINGS_COLUMNS).eq("id", 1).single()),
    }),
  });
}

const URL_OR_NULL = z.string().url().startsWith("https://").max(300).nullable().optional();
const TEXT = (max: number) => z.string().trim().max(max).nullable().optional();

function updateSettings(server: McpServer, ctx: ToolContext) {
  defineTool(server, ctx, {
    name: "update_settings",
    title: "Change shop settings",
    kind: "write",
    description:
      "Changes shop texts and contact: name, tagline (Arabic) and tagline_fr, description, the announcement bar, WhatsApp, phone, email, Instagram/Facebook/TikTok links (full https URLs), returns window and note. Only the fields given change.",
    input: z.object({
      name: z.string().trim().min(1).max(60).optional(),
      tagline: TEXT(160),
      tagline_fr: TEXT(160),
      description: TEXT(1000),
      description_fr: TEXT(1000),
      announcement: TEXT(160),
      announcement_enabled: z.boolean().optional(),
      whatsapp: TEXT(20),
      phone: TEXT(20),
      email: z.string().email().nullable().optional(),
      instagram_url: URL_OR_NULL,
      facebook_url: URL_OR_NULL,
      tiktok_url: URL_OR_NULL,
      returns_days: z.number().int().min(0).max(60).optional(),
      returns_note: TEXT(500),
    }),
    run: async (patch) => {
      if (Object.keys(patch).length === 0) return { text: "Nothing to change." };
      must(await ctx.db.from("store_settings").update(patch).eq("id", 1));
      return {
        text: `Settings updated: ${Object.keys(patch).join(", ")}. Live on the next page load.`,
        target: "settings",
      };
    },
  });
}

export const shopTools = [overview, getSettings, updateSettings];
