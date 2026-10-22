import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Switch, Textarea } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n-context";
import type { SettingsDraft, SettingsSetter } from "./settings-cards";

/**
 * Everything a buyer sees before they buy: the announcement line, the social
 * links, and the returns policy text.
 *
 * Split out of `settings-cards.tsx` when that file passed the 250-line limit. The
 * seam is by audience rather than by size: those cards hold the shop's own
 * identity and rules, and this one holds what the shop says to buyers.
 *
 * The social fields are full URLs rather than handles, because a handle cannot be
 * turned into a correct link for every platform, and guessing wrong sends a buyer
 * to a stranger's profile.
 */
export function MarketingCard({ form, set }: { form: SettingsDraft; set: SettingsSetter }) {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.settings.marketing")}</CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <Field label={t("admin.settings.announcement")} hint={t("admin.settings.announcementHint")}>
          <Input
            value={form.announcement ?? ""}
            onChange={(e) => set("announcement", e.target.value || null)}
            maxLength={160}
          />
        </Field>
        <Switch
          label={t("admin.settings.announcementEnabled")}
          checked={form.announcement_enabled}
          onChange={(e) => set("announcement_enabled", e.target.checked)}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Instagram">
            <Input
              value={form.instagram_url ?? ""}
              onChange={(e) => set("instagram_url", e.target.value || null)}
              dir="ltr"
              type="url"
            />
          </Field>
          <Field label="Facebook">
            <Input
              value={form.facebook_url ?? ""}
              onChange={(e) => set("facebook_url", e.target.value || null)}
              dir="ltr"
              type="url"
            />
          </Field>
          <Field label="TikTok">
            <Input
              value={form.tiktok_url ?? ""}
              onChange={(e) => set("tiktok_url", e.target.value || null)}
              dir="ltr"
              type="url"
            />
          </Field>
        </div>

        <Field label={t("admin.settings.returnsNote")} hint={t("admin.settings.returnsNoteHint")}>
          <Textarea
            value={form.returns_note ?? ""}
            onChange={(e) => set("returns_note", e.target.value || null)}
            rows={2}
            maxLength={300}
          />
        </Field>
      </CardBody>
    </Card>
  );
}
