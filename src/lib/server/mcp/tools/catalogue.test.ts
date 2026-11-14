import { describe, expect, it } from "vitest";
import type { McpServer } from "@modelcontextprotocol/server";
import type { ToolContext } from "./define";
import { categoryTools } from "./categories";
import { deliveryTools } from "./delivery";
import { orderTools } from "./orders";
import { photoTools } from "./photos";
import { productTools } from "./products";
import { reviewTools } from "./reviews";
import { shopTools } from "./shop";
import { variantTools } from "./variants";

/**
 * The tool list as Claude sees it. Guards the safety contract: every delete and
 * every change to an existing price is destructive (two steps), reads are marked
 * read-only, and no tool reaches outside the shop.
 */

type Config = {
  annotations: { readOnlyHint: boolean; destructiveHint: boolean; openWorldHint: boolean };
};

function listTools() {
  const tools = new Map<string, Config>();
  let registered = 0;
  const server = {
    registerTool: (name: string, config: Config) => {
      registered += 1;
      tools.set(name, config);
    },
  } as unknown as McpServer;
  const ctx = {} as ToolContext;
  const all = [
    ...shopTools,
    ...productTools,
    ...variantTools,
    ...photoTools,
    ...categoryTools,
    ...deliveryTools,
    ...orderTools,
    ...reviewTools,
  ];
  for (const register of all) register(server, ctx);
  return { tools, registered };
}

const DESTRUCTIVE = [
  "delete_product",
  "set_price",
  "delete_variant",
  "remove_image",
  "delete_category",
  "update_delivery_price",
  "delete_order",
  "delete_review",
];

describe("tool list", () => {
  const { tools, registered } = listTools();

  it("has the planned tools, uniquely named", () => {
    expect(tools.size).toBe(registered);
    expect(tools.size).toBe(30);
  });

  it("marks every delete and price change destructive", () => {
    for (const name of DESTRUCTIVE)
      expect(tools.get(name)?.annotations.destructiveHint, name).toBe(true);
    for (const [name, config] of tools) {
      if (name.startsWith("delete_")) expect(DESTRUCTIVE, name).toContain(name);
      if (!DESTRUCTIVE.includes(name)) expect(config.annotations.destructiveHint, name).toBe(false);
    }
  });

  it("marks list and get tools read-only", () => {
    for (const [name, config] of tools) {
      const isRead = /^(list_|get_)/.test(name);
      expect(config.annotations.readOnlyHint, name).toBe(isRead);
    }
  });

  it("never reaches outside the shop", () => {
    for (const [name, config] of tools) expect(config.annotations.openWorldHint, name).toBe(false);
  });
});
