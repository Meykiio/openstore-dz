import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/form";
import { SizeGuideGrid } from "./size-guide-grid";
import { useI18n } from "@/lib/i18n-context";
import { deleteSizeGuide, fetchAdminSizeGuide, saveSizeGuide } from "@/lib/admin-content";
import {
  EMPTY_GUIDE_GRID,
  clothingTemplateGrid,
  type SizeGuideGridValue,
} from "@/lib/size-guide-grid";

/**
 * Size guide editor for one product.
 *
 * Asks for the table, the unit and how the measurements were taken. The reasoning
 * for all three, and what happens when one is missing, is in `docs/DECISIONS.md`
 * entry 11. The short version: a chart with no method is the single most common
 * reason a buyer still guesses.
 */
export function SizeGuideEditor({ productId }: { productId: string }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { data: guide, isPending } = useQuery({
    queryKey: ["admin_size_guide", productId],
    queryFn: () => fetchAdminSizeGuide(productId),
  });

  const [name, setName] = useState("");
  const [grid, setGrid] = useState<SizeGuideGridValue>(EMPTY_GUIDE_GRID);
  const [note, setNote] = useState("");
  const [noteFr, setNoteFr] = useState("");

  useEffect(() => {
    if (!guide) return;
    setName(guide.name);
    setGrid({ headers: guide.headers, rows: guide.rows });
    setNote(guide.note ?? "");
    setNoteFr(guide.note_fr ?? "");
  }, [guide]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin_size_guide", productId] });
    void queryClient.invalidateQueries({ queryKey: ["size_guides", productId] });
  };

  const save = useMutation({
    mutationFn: () =>
      saveSizeGuide({
        id: guide?.id,
        product_id: productId,
        name: name.trim() || t("admin.sizeGuide.defaultName"),
        headers: grid.headers,
        rows: grid.rows,
        note: note.trim() || null,
        note_fr: noteFr.trim() || null,
      }),
    onSuccess: () => {
      invalidate();
      toast.success(t("admin.settings.saved"));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: () => deleteSizeGuide(guide!.id),
    onSuccess: () => {
      setName("");
      setGrid(EMPTY_GUIDE_GRID);
      setNote("");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const applyClothingTemplate = () => {
    setGrid(
      clothingTemplateGrid({
        size: t("admin.sizeGuide.dimSize"),
        chest: t("admin.sizeGuide.dimChest"),
        waist: t("admin.sizeGuide.dimWaist"),
        length: t("admin.sizeGuide.dimLength"),
      }),
    );
    if (!name.trim()) setName(t("admin.sizeGuide.defaultName"));
    if (!note.trim()) setNote(t("admin.sizeGuide.templateNote"));
  };

  if (isPending) return null;

  const hasTable = grid.headers.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("store.sizeGuide")}</CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <p className="rounded-[10px] bg-surface-mid px-4 py-3 text-xs text-on-surface-muted">
          {t("admin.sizeGuide.intro")}
        </p>

        <Field label={t("common.name")}>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("admin.sizeGuide.defaultName")}
            maxLength={80}
          />
        </Field>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={applyClothingTemplate}>
            {t("admin.sizeGuide.useTemplate")}
          </Button>
          {hasTable && (
            <span className="text-xs text-on-surface-muted">
              {t("admin.sizeGuide.templateHint")}
            </span>
          )}
        </div>

        <SizeGuideGrid value={grid} onChange={setGrid} />

        <GuideNotes note={note} noteFr={noteFr} onNote={setNote} onNoteFr={setNoteFr} />

        <div className="flex flex-wrap gap-2">
          <Button disabled={!hasTable || save.isPending} onClick={() => save.mutate()}>
            <Save size={16} aria-hidden="true" />
            {save.isPending ? t("common.saving") : t("common.save")}
          </Button>
          {guide && (
            <Button
              variant="ghost"
              className="text-error"
              disabled={remove.isPending}
              onClick={() => remove.mutate()}
            >
              <Trash2 size={16} aria-hidden="true" />
              {t("common.delete")}
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

/** How the guide was measured, in Arabic and optionally in French. */
function GuideNotes({
  note,
  noteFr,
  onNote,
  onNoteFr,
}: {
  note: string;
  noteFr: string;
  onNote: (value: string) => void;
  onNoteFr: (value: string) => void;
}) {
  const { t } = useI18n();
  return (
    <>
      <Field label={t("admin.sizeGuide.methodLabel")} hint={t("admin.sizeGuide.methodHint")}>
        <Textarea
          value={note}
          onChange={(event) => onNote(event.target.value)}
          rows={2}
          maxLength={300}
          placeholder={t("admin.sizeGuide.methodPlaceholder")}
        />
      </Field>
      <Field label={t("admin.sizeGuide.noteLatin")}>
        <Textarea
          value={noteFr}
          onChange={(event) => onNoteFr(event.target.value)}
          rows={2}
          maxLength={300}
          dir="ltr"
        />
      </Field>
    </>
  );
}
