import { ORDER_SELECT, type AdminOrder } from "./admin";
import { getSupabase } from "./supabase/client";

/**
 * Orders leaving the dashboard: as a spreadsheet, or as packing slips.
 *
 * Fetched in pages of a thousand, the most PostgREST returns per request, until
 * the set is complete. A capped single request would quietly drop the oldest
 * orders from an export, and nothing would say so.
 */
const BATCH = 1000;

export async function fetchOrders(filter: {
  id?: string;
  status?: "confirmed";
}): Promise<AdminOrder[]> {
  const rows: AdminOrder[] = [];
  for (let from = 0; ; from += BATCH) {
    let request = getSupabase()
      .from("orders")
      .select(ORDER_SELECT)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });
    if (filter.id) request = request.eq("id", filter.id);
    if (filter.status) request = request.eq("status", filter.status);
    const { data, error } = await request.range(from, from + BATCH - 1);
    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as unknown as AdminOrder[]));
    if (!data || data.length < BATCH) return rows;
  }
}

const COLUMNS = [
  "date",
  "order",
  "status",
  "customer",
  "phone",
  "wilaya",
  "commune",
  "address",
  "delivery",
  "items",
  "subtotal",
  "delivery_fee",
  "total",
  "note",
  "tracking_number",
] as const;

/** RFC 4180 quoting: wrap every field, double any quote inside it. */
function cell(value: string | number | null): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

/**
 * CSV for Excel and Google Sheets. Starts with a byte-order mark because Excel
 * otherwise reads UTF-8 as Windows-1252, and every Arabic name becomes noise.
 */
const BOM = String.fromCharCode(0xfeff);

export function ordersToCsv(orders: AdminOrder[]): string {
  const lines = orders.map((o) =>
    [
      o.created_at.slice(0, 16).replace("T", " "),
      o.public_token.slice(0, 8),
      o.status,
      o.customer_name,
      o.phone,
      o.wilaya,
      o.commune,
      o.address,
      o.delivery_method === "stopdesk"
        ? `stopdesk${o.stopdesk_name ? `: ${o.stopdesk_name}` : ""}`
        : "home",
      o.order_items
        .map(
          (i) =>
            `${i.product_name}${i.variant_label ? ` (${i.variant_label})` : ""} x${i.quantity}`,
        )
        .join("; "),
      o.subtotal,
      o.delivery_fee,
      o.total,
      o.note,
      o.tracking_number,
    ]
      .map(cell)
      .join(","),
  );
  return BOM + [COLUMNS.join(","), ...lines].join("\r\n") + "\r\n";
}

export function downloadText(filename: string, text: string, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
