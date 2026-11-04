import { useQuery } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n-context";
import { Product3DPreview } from "./product-3d-preview";

type RawSpecs = Record<string, unknown>;

export function ApplianceSpecs({ productId }: { productId: string }) {
  const { t } = useI18n();

  const { data } = useQuery({
    queryKey: ["appliance_specs", productId],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("products")
        .select("model_url, appliance_specs")
        .eq("id", productId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: Boolean(productId),
  });

  const raw = data as { model_url: string | null; appliance_specs: RawSpecs | null } | null;
  const specs = raw?.appliance_specs;
  if (!specs || Object.keys(specs).length === 0) return null;

  const getModelUrl = (): string | null => {
    const url = raw?.model_url ?? null;
    if (!url) return null;
    try { return new URL(url).toString(); } catch { return null; }
  };

  const primaryImageUrl = (specs.primary_image_url as string | null) ?? null;
  const dimensions = (specs.dimensions as string | null) ?? null;

  const fields: Array<{ label: string; key: string }> = [
    { label: "brand", key: "brand" }, { label: "model", key: "model" },
    { label: "capacity", key: "capacity" }, { label: "power", key: "power" },
    { label: "weight", key: "weight" }, { label: "warranty", key: "warranty" },
    { label: "color", key: "color" },
  ];

  const visibleFields = fields.filter(({ key }) => {
    const val = specs[key];
    return val && String(val).trim().length > 0;
  });

  if (visibleFields.length === 0 && !getModelUrl()) return null;

  return (
    <div className="flex flex-col gap-6">
      {getModelUrl() && (
        <Product3DPreview
          modelUrl={getModelUrl()!}
          imageUrl={primaryImageUrl}
          dimensions={dimensions}
          productName={String(specs.name ?? "")}
        />
      )}
      {visibleFields.length > 0 && (
        <section aria-labelledby="specs-table-title">
          <h2 id="specs-table-title" className="mb-3 text-base font-semibold">{t("store.specs")}</h2>
          <div className="overflow-x-auto rounded-[16px] border border-outline">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">{t("store.specs")}</caption>
              <thead>
                <tr>
                  <th scope="col" className="border-b border-outline bg-surface-high px-3 py-2.5 text-start font-medium">
                    {t("common.name")}
                  </th>
                  <th scope="col" className="border-b border-outline bg-surface-high px-3 py-2.5 text-start font-medium">
                    {t("common.value")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleFields.map(({ label, key }) => {
                  const value = specs[key];
                  if (!value || String(value).trim().length === 0) return null;
                  const str = String(value);
                  return (
                    <tr key={label} className="even:bg-surface-mid">
                      <td className="border-b border-outline px-3 py-2.5 font-medium">
                        {t(`store.spec.${label}` as Parameters<typeof t>[0])}
                      </td>
                      <td className="border-b border-outline px-3 py-2.5"
                          dir={/^\d/.test(str) ? "ltr" : undefined}>{str}</td>
                    </tr>
                  );
                })}
                {(typeof specs.specs === "string" && specs.specs.trim().length > 0) && (
                  <tr>
                    <td className="border-b border-outline px-3 py-2.5 font-medium">
                      {t("store.spec.specs" as Parameters<typeof t>[0])}
                    </td>
                    <td className="border-b border-outline px-3 py-2.5 whitespace-pre-line">
                      {String(specs.specs ?? "")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
