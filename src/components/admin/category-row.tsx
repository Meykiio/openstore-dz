import { useState } from "react";
import { ArrowDown, ArrowUp, Check, Eye, EyeOff, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n-context";
import type { AdminCategory } from "@/lib/admin-categories";

/**
 * One category, editable in place. Names save on an explicit tick rather than
 * on every keystroke, so a half-typed rename never reaches the storefront.
 */
export function CategoryRow({
  category,
  first,
  last,
  busy,
  onRename,
  onToggle,
  onMove,
  onDelete,
}: {
  category: AdminCategory;
  first: boolean;
  last: boolean;
  busy: boolean;
  onRename: (name: string, nameFr: string | null) => void;
  onToggle: () => void;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
}) {
  const { t } = useI18n();
  const [name, setName] = useState(category.name);
  const [nameFr, setNameFr] = useState(category.name_fr ?? "");
  const dirty = name.trim() !== category.name || nameFr.trim() !== (category.name_fr ?? "");

  return (
    <li className="flex flex-col gap-3 rounded-[16px] border border-outline bg-surface p-4 sm:flex-row sm:items-center">
      <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label={t("admin.categories.name")}
          dir="rtl"
        />
        <Input
          value={nameFr}
          onChange={(e) => setNameFr(e.target.value)}
          aria-label={t("admin.categories.nameLatin")}
          dir="ltr"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={category.is_active ? "positive" : "neutral"}>
          {category.is_active ? t("admin.categories.visible") : t("admin.categories.hidden")}
        </Badge>
        <span className="font-mono text-xs text-on-surface-muted">
          {t("admin.categories.count", { count: category.product_count })}
        </span>

        {dirty && (
          <Button
            size="sm"
            disabled={busy || name.trim().length < 2}
            onClick={() => onRename(name.trim(), nameFr.trim() || null)}
          >
            <Check size={15} aria-hidden="true" />
            {t("common.save")}
          </Button>
        )}

        <span className="ms-auto flex items-center gap-1">
          <IconButton
            label={t("admin.categories.moveUp")}
            disabled={busy || first}
            onClick={() => onMove(-1)}
          >
            <ArrowUp size={15} />
          </IconButton>
          <IconButton
            label={t("admin.categories.moveDown")}
            disabled={busy || last}
            onClick={() => onMove(1)}
          >
            <ArrowDown size={15} />
          </IconButton>
          <IconButton
            label={
              category.is_active ? t("admin.categories.hidden") : t("admin.categories.visible")
            }
            disabled={busy}
            onClick={onToggle}
          >
            {category.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
          </IconButton>
          <IconButton label={t("common.delete")} disabled={busy} onClick={onDelete} danger>
            <Trash2 size={15} />
          </IconButton>
        </span>
      </div>
    </li>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  danger,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={
        "inline-flex size-9 items-center justify-center rounded-full border border-outline text-on-surface-muted transition-colors hover:bg-surface-mid disabled:opacity-40 " +
        (danger ? "hover:text-error" : "hover:text-on-surface")
      }
    >
      <span aria-hidden="true" className="contents">
        {children}
      </span>
    </button>
  );
}
