import { useQuery } from "@tanstack/react-query";
import { getSupabase } from "./supabase/client";

/*
 * The pack-contents picker's data.
 *
 * Split out of `admin-products.ts` at the 250-line limit, and because it is a
 * separate concern: the admin product form reads everything about a product, and
 * the picker only needs enough to label a variant and remember its id. Keeping the
 * two in one file is how the picker ended up reusing the heavy admin query in the
 * first place.
 */
/**
 * A variant as the pack picker needs it.
 *
 * Deliberately narrower than `AdminVariant`: no images, no price, no stock. The
 * picker only labels a variant and remembers its id, and declaring that is how the
 * query stays small. If the picker ever needs a price it should say so here.
 */
export type PickerVariant = {
  id: string;
  size: string | null;
  color_name: string | null;
  sku: string | null;
};

type PickerProduct = {
  id: string;
  name: string;
  slug: string;
  kind: string;
  product_variants: PickerVariant[];
};

const PICKER_SELECT = `
  id, name, slug, kind,
  product_variants ( id, size, color_name, sku )
`;

/**
 * Products and variants for the pack-contents picker.
 *
 * Not paginated, and deliberately far narrower than the admin list: no images, no
 * prices, no stock. It exists because the picker used to reuse the list query, so
 * opening one product pulled the whole admin payload with every image nested
 * inside it, purely to populate a dropdown.
 *
 * A shop with thousands of products wants a typeahead here rather than a full
 * list. At a few hundred this is a few kilobytes.
 */
async function fetchProductPicker(): Promise<PickerProduct[]> {
  const { data, error } = await getSupabase()
    .from("products")
    .select(PICKER_SELECT)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PickerProduct[];
}

export function useProductPicker() {
  return useQuery({ queryKey: ["product_picker"] as const, queryFn: fetchProductPicker });
}
