import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n-context";
import { guessHex, type MatrixColour } from "@/lib/variant-matrix";
import { cn } from "@/lib/utils";

/** The two lists the generator multiplies: colours with a swatch, and sizes. */

const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

export function ColourInput({
  colours,
  onChange,
}: {
  colours: MatrixColour[];
  onChange: React.Dispatch<React.SetStateAction<MatrixColour[]>>;
}) {
  const { t } = useI18n();
  const [colourName, setColourName] = useState("");
  const [colourHex, setColourHex] = useState("#888888");

  const addColour = () => {
    const name = colourName.trim();
    if (!name || colours.some((c) => c.name.toLowerCase() === name.toLowerCase())) return;
    onChange((current) => [...current, { name, hex: colourHex }]);
    setColourName("");
  };
  const setColours = onChange;

  return (
    <>
      <Field label={t("admin.gen.colours")}>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="color"
            value={colourHex}
            onChange={(e) => setColourHex(e.target.value)}
            aria-label={t("store.color")}
            className="size-10 cursor-pointer rounded-full border border-outline bg-transparent"
          />
          <Input
            value={colourName}
            placeholder={t("admin.gen.colourName")}
            className="max-w-56"
            onChange={(e) => {
              setColourName(e.target.value);
              const guess = guessHex(e.target.value);
              if (guess) setColourHex(guess);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addColour();
              }
            }}
          />
          <Button type="button" size="sm" variant="secondary" onClick={addColour}>
            <Plus size={15} aria-hidden="true" />
            {t("admin.gen.addColour")}
          </Button>
        </div>
      </Field>
      {colours.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {colours.map((colour) => (
            <li key={colour.name} className="chip filled flex items-center gap-2">
              <span
                className="size-3.5 rounded-full border border-outline"
                style={{ background: colour.hex }}
              />
              {colour.name}
              <button
                type="button"
                aria-label={`${t("common.delete")} ${colour.name}`}
                onClick={() =>
                  setColours((current) => current.filter((c) => c.name !== colour.name))
                }
              >
                <X size={13} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function SizeInput({
  sizes,
  onChange,
}: {
  sizes: string[];
  onChange: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const { t } = useI18n();
  const [customSize, setCustomSize] = useState("");
  const setSizes = onChange;
  const toggleSize = (size: string) =>
    // Functional updates: two quick taps must not both start from the same list.
    setSizes((current) =>
      current.includes(size) ? current.filter((s) => s !== size) : [...current, size],
    );

  return (
    <Field label={t("admin.gen.sizes")}>
      <div className="flex flex-wrap items-center gap-2">
        {[...PRESET_SIZES, ...sizes.filter((s) => !PRESET_SIZES.includes(s))].map((size) => (
          <button
            key={size}
            type="button"
            aria-pressed={sizes.includes(size)}
            onClick={() => toggleSize(size)}
            className={cn("size-chip", sizes.includes(size) && "active")}
          >
            {size}
          </button>
        ))}
        <Input
          value={customSize}
          placeholder={t("admin.gen.customSize")}
          className="max-w-44"
          onChange={(e) => setCustomSize(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && customSize.trim()) {
              e.preventDefault();
              const size = customSize.trim();
              setSizes((current) => (current.includes(size) ? current : [...current, size]));
              setCustomSize("");
            }
          }}
        />
      </div>
    </Field>
  );
}
