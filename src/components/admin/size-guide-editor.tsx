import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n-context";
import { getSupabase } from "@/lib/supabase/client";
import {
  deleteSizeGuide,
  formatGuideTable,
  parseGuideTable,
  saveSizeGuide,
  type SizeGuideRow,
} from "@/lib/admin-content";

async function fetchGuide(productId: string): Promise<SizeGuideRow | null> {
  const { data, error } = await getSupabase()
    .from("size_guides")
    .select("id, product_id, name, headers, rows, note, sort_order")
    .eq("product_id", productId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const rows = Array.isArray(data.rows)
    ? (data.rows as unknown[])
        .filter((row): row is unknown[] => Array.isArray(row))
        .map((row) => row.map((cell) => String(cell ?? "")))
    : [];
  return {
    id: data.id,
    product_id: data.product_id,
    name: data.name,
    headers: (data.headers as string[]) ?? [],
    rows,
    note: data.note,
    sort_order: data.sort_order,
  };
}

/**
 * Size guide editor for one product.
 *
 * The editor is a plain textarea of tab- or comma-separated values rather than a
 * grid widget, because a shop owner's measurements live in a spreadsheet and
 * pasting is faster than typing into cell inputs. `parseGuideTable` accepts
 * either separator, so a paste from Sheets, Excel or a CSV all work.
 */
export function SizeGuideEditor({ productId }: { productId: string }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { data: guide, isPending } = useQuery({
    queryKey: ["admin_size_guide", productId],
    queryFn: () => fetchGuide(productId),
  });

  const [name, setName] = useState("");
  const [table, setTable] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!guide) return;
    setName(guide.name);
    setTable(formatGuideTable(guide.headers, guide.rows));
    setNote(guide.note ?? "");
  }, [guide]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin_size_guide", productId] });
    void queryClient.invalidateQueries({ queryKey: ["size_guides", productId] });
  };

  const save = useMutation({
    mutationFn: () => {
      const parsed = parseGuideTable(table);
      return saveSizeGuide({
        id: guide?.id,
        product_id: productId,
        name: name.trim() || "دليل المقاسات",
        headers: parsed.headers,
        rows: parsed.rows,
        note: note.trim() || null,
      });
    },
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
      setTable("");
      setNote("");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isPending) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("store.sizeGuide")}</CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <p className="rounded-[10px] bg-surface-mid px-4 py-3 text-xs text-on-surface-muted">
          الصق الجدول من Excel أو Google Sheets مباشرة. السطر الأول عناوين الأعمدة، والأسطر الموالية
          القياسات.
        </p>

        <Field label={t("common.name")}>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="دليل المقاسات"
            maxLength={80}
          />
        </Field>

        <Field label="الجدول">
          <Textarea
            value={table}
            onChange={(event) => setTable(event.target.value)}
            rows={6}
            dir="ltr"
            className="font-mono text-xs"
            placeholder={"المقاس\tالصدر\tالطول\nS\t96\t68\nM\t100\t70"}
          />
        </Field>

        <Field label={t("checkout.note")}>
          <Input value={note} onChange={(event) => setNote(event.target.value)} maxLength={200} />
        </Field>

        <div className="flex flex-wrap gap-2">
          <Button disabled={!table.trim() || save.isPending} onClick={() => save.mutate()}>
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
