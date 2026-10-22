import { Plus, Trash2, X } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import {
  addGridColumn,
  addGridRow,
  gridFromPaste,
  removeGridColumn,
  removeGridRow,
  setBodyCell,
  setHeaderCell,
  type SizeGuideGridValue,
} from "@/lib/size-guide-grid";
import { cn } from "@/lib/utils";

/**
 * Editable measurement table.
 *
 * A visible grid of inputs, not a textarea of tab-separated text. The textarea
 * existed because pasting from a spreadsheet is faster than typing, which is true
 * and was also the whole problem: an owner with the numbers in their head, or in
 * a photo, was shown a blank monospace box and a placeholder, with no way to tell
 * what a column was or how many they needed.
 *
 * Pasting still works and is still faster. A paste containing a tab or a newline
 * is treated as a whole table and replaces the grid. Anything else pastes into
 * the cell as normal text. Every operation lives in `lib/size-guide-grid`.
 */
export function SizeGuideGrid({
  value,
  onChange,
}: {
  value: SizeGuideGridValue;
  onChange: (next: SizeGuideGridValue) => void;
}) {
  const { t } = useI18n();

  const onPaste = (event: React.ClipboardEvent) => {
    const pasted = gridFromPaste(event.clipboardData.getData("text"));
    if (!pasted) return;
    event.preventDefault();
    onChange(pasted);
  };

  const columnLabel = (column: number) => t("admin.sizeGuide.columnLabel", { index: column + 1 });

  return (
    <div className="flex flex-col gap-3">
      {value.headers.length === 0 ? (
        <p className="rounded-[10px] bg-surface-mid px-4 py-3 text-xs text-on-surface-muted">
          {t("admin.sizeGuide.empty")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {value.headers.map((header, column) => (
                  <th key={column} className="p-1 align-bottom">
                    <span className="flex items-center gap-1">
                      <input
                        value={header}
                        onChange={(event) =>
                          onChange(setHeaderCell(value, column, event.target.value))
                        }
                        onPaste={onPaste}
                        aria-label={columnLabel(column)}
                        placeholder={t("admin.sizeGuide.columnHint")}
                        className={cn(
                          "form-input min-w-20 !px-2 !py-1.5 text-xs font-semibold",
                          header.trim() === "" && "border-dashed",
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => onChange(removeGridColumn(value, column))}
                        aria-label={t("admin.sizeGuide.removeColumn")}
                        className="shrink-0 rounded-full p-1 text-on-surface-muted hover:text-error"
                      >
                        <X size={12} aria-hidden="true" />
                      </button>
                    </span>
                  </th>
                ))}
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {value.rows.map((cells, row) => (
                <tr key={row}>
                  {value.headers.map((header, column) => (
                    <td key={column} className="p-1">
                      <input
                        value={cells[column] ?? ""}
                        onChange={(event) =>
                          onChange(setBodyCell(value, row, column, event.target.value))
                        }
                        onPaste={onPaste}
                        aria-label={`${header || columnLabel(column)} ${row + 1}`}
                        dir="ltr"
                        inputMode="decimal"
                        className="form-input min-w-20 !px-2 !py-1.5 text-center font-mono text-xs"
                      />
                    </td>
                  ))}
                  <td className="p-1">
                    <button
                      type="button"
                      onClick={() => onChange(removeGridRow(value, row))}
                      aria-label={t("admin.sizeGuide.removeRow")}
                      className="rounded-full p-1 text-on-surface-muted hover:text-error"
                    >
                      <Trash2 size={13} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(addGridColumn(value))}
          className="btn btn-ghost btn-sm !border !border-outline"
        >
          <Plus size={13} aria-hidden="true" />
          {t("admin.sizeGuide.addColumn")}
        </button>
        <button
          type="button"
          onClick={() => onChange(addGridRow(value))}
          disabled={value.headers.length === 0}
          className="btn btn-ghost btn-sm !border !border-outline"
        >
          <Plus size={13} aria-hidden="true" />
          {t("admin.sizeGuide.addRow")}
        </button>
      </div>

      <p className="text-xs text-on-surface-muted">{t("admin.sizeGuide.pasteHint")}</p>
    </div>
  );
}
