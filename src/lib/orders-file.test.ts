import { describe, expect, it } from "vitest";
import type { AdminOrder } from "./admin";
import { cell, ordersToCsv } from "./orders-file";

const order = {
  id: "1",
  public_token: "abcdef12-0000-4000-8000-000000000000",
  customer_name: 'Amel "Mimi" B.',
  phone: "0555123456",
  wilaya: "Alger",
  commune: null,
  address: "Rue 1, Bab Ezzouar",
  note: null,
  subtotal: 5800,
  delivery_fee: 600,
  total: 6400,
  status: "confirmed",
  created_at: "2026-10-22T09:15:00Z",
  tracking_number: null,
  order_items: [
    { id: "a", product_name: "قميص", variant_label: "M / Noir", quantity: 2, unit_price: 2900 },
  ],
} as unknown as AdminOrder;

describe("ordersToCsv", () => {
  const csv = ordersToCsv([order]);

  it("starts with a byte-order mark so Excel reads Arabic", () => {
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it("quotes fields and escapes quotes inside them", () => {
    expect(csv).toContain('"Amel ""Mimi"" B."');
    expect(csv).toContain('"Rue 1, Bab Ezzouar"');
  });

  it("writes the lines and the money", () => {
    expect(csv).toContain('"قميص (M / Noir) x2"');
    expect(csv).toContain('"6400"');
    expect(csv.split("\r\n")).toHaveLength(3);
  });
});

describe("cell", () => {
  it("keeps typed text that looks like a formula as text", () => {
    expect(cell('=HYPERLINK("http://x","y")')).toBe(`"'=HYPERLINK(""http://x"",""y"")"`);
    expect(cell("+213555")).toBe(`"'+213555"`);
    expect(cell("@SUM(A1)")).toBe(`"'@SUM(A1)"`);
    expect(cell("-1")).toBe(`"'-1"`);
  });

  it("leaves ordinary text and numbers alone", () => {
    expect(cell("محمد")).toBe('"محمد"');
    expect(cell(-600)).toBe('"-600"');
    expect(cell(null)).toBe('""');
  });
});
