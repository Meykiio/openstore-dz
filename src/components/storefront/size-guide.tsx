import { Ruler } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { pickGuide, useSizeGuides } from "@/lib/size-guides";

/**
 * Size guide table.
 *
 * Renders nothing at all when there is no guide, rather than showing an empty
 * panel or a disabled button. A store that has not filled one in should look
 * like a store without a size guide, not like a broken feature.
 */
export function SizeGuide({ productId }: { productId: string }) {
  const { t } = useI18n();
  const { data: guides } = useSizeGuides(productId);
  const guide = guides ? pickGuide(guides, productId) : null;

  if (!guide || guide.headers.length === 0) return null;

  return (
    <section className="flex flex-col gap-3" aria-labelledby="size-guide-title">
      <h2 id="size-guide-title" className="flex items-center gap-2 text-base font-semibold">
        <Ruler size={16} className="text-primary" aria-hidden="true" />
        {guide.name || t("store.sizeGuide")}
      </h2>

      <div className="overflow-x-auto rounded-[16px] border border-outline">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{guide.name || t("store.sizeGuide")}</caption>
          <thead>
            <tr>
              {guide.headers.map((header, index) => (
                <th
                  key={`${header}-${index}`}
                  scope="col"
                  className="border-b border-outline bg-surface-high px-3 py-2.5 text-start font-medium"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {guide.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="even:bg-surface-mid">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="border-b border-outline px-3 py-2.5 last:border-b-0"
                    // Numbers read correctly in an RTL table.
                    dir={/^[\d.\s,]+$/.test(cell) ? "ltr" : undefined}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {guide.note && <p className="text-xs text-on-surface-muted">{guide.note}</p>}
    </section>
  );
}
