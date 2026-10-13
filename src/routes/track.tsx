import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { StoreLayout } from "@/components/storefront/store-layout";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n-context";
import { isTokenShaped } from "@/lib/order";

export const Route = createFileRoute("/track")({
  head: () => ({ meta: [{ title: "تتبع الطلب" }] }),
  component: TrackPage,
});

/**
 * Order lookup.
 *
 * Validates the shape of the token before navigating. A malformed string would
 * make the tracking RPC's `::uuid` cast fail and surface as a confusing database
 * error, so it is rejected here with a sentence the buyer can act on.
 */
function TrackPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = token.trim();
    if (!isTokenShaped(trimmed)) {
      setError(t("order.notFound"));
      return;
    }
    setError(null);
    void navigate({ to: "/order/$token", params: { token: trimmed } });
  };

  return (
    <StoreLayout>
      <div className="container-page flex max-w-xl flex-col gap-6 py-12 sm:py-20">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">
            {t("order.lookupTitle")}
          </h1>
          <p className="text-sm text-on-surface-muted">{t("order.lookupBody")}</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label={t("order.tokenLabel")} error={error}>
            <Input
              value={token}
              onChange={(event) => setToken(event.target.value)}
              dir="ltr"
              className="font-mono"
              placeholder="00000000-0000-0000-0000-000000000000"
              autoComplete="off"
              spellCheck={false}
            />
          </Field>
          <Button type="submit" size="lg" className="self-start">
            <Search size={18} aria-hidden="true" />
            {t("order.lookup")}
          </Button>
        </form>
      </div>
    </StoreLayout>
  );
}
