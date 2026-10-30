import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";

/**
 * Copy text to the clipboard, including inside the Instagram and Facebook
 * in-app browsers, where `navigator.clipboard` is often missing or refused. The
 * fallback selects a hidden field and uses the legacy copy command.
 */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Falls through to the legacy path.
  }
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  field.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  field.remove();
  return ok;
}

/** The order number, with a copy button that confirms in place for two seconds. */
export function CopyBox({ value }: { value: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <div className="copy-box">
      <code dir="ltr">{value}</code>
      <button
        type="button"
        onClick={() => void copyText(value).then(setCopied)}
        className="btn btn-primary btn-sm shrink-0"
        aria-live="polite"
      >
        {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
        {copied ? t("copy.copied") : t("copy.copy")}
      </button>
    </div>
  );
}
