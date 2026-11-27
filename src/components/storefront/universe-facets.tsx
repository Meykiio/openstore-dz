import { useI18n } from "@/lib/i18n-context";
import { entryLabel } from "@/lib/universe-sections";
import type { UniverseCatalog, UniverseEntry } from "@/lib/universes";

type Props = {
  catalog: UniverseCatalog;
  selection: string | null;
  onSelect: (value: string | null) => void;
};

/**
 * The declared shelves of a universe.
 *
 * Every shelf is drawn even when nothing sits on it, because the structure is a
 * promise to the buyer: Anime has five series and "Other anime" whether or not
 * the first Naruto piece has arrived. An empty shelf is muted, still readable,
 * and says so with a zero instead of disappearing. Each shelf is a toggle, so a
 * buyer can step into "Barcelona" and back out without losing the universe.
 */
export function UniverseFacets({ catalog, selection, onSelect }: Props) {
  const { t } = useI18n();
  const toggle = (value: string) => onSelect(selection === value ? null : value);

  return (
    <div className="container-page">
      {catalog.sections.map((section) => {
        const filled = section.entries.filter((row) => row.count > 0).length;
        return (
          <section key={section.id} className="store-facet-block">
            <div className="store-facet-head">
              <h2 className="store-facet-title">{t(section.labelKey)}</h2>
              <span
                className="store-facet-count"
                aria-label={`${filled}/${section.entries.length}`}
              >
                {filled}/{section.entries.length}
              </span>
            </div>
            {section.layout === "clubs" ? (
              <ClubRow rows={section.entries} selection={selection} onToggle={toggle} />
            ) : (
              <ChipRow rows={section.entries} selection={selection} onToggle={toggle} />
            )}
          </section>
        );
      })}
    </div>
  );
}

function ChipRow({
  rows,
  selection,
  onToggle,
}: {
  rows: UniverseEntry[];
  selection: string | null;
  onToggle: (value: string) => void;
}) {
  const { t, locale } = useI18n();
  return (
    <div className="flex flex-wrap gap-2">
      {rows.map(({ entry, count }) => (
        <button
          key={entry.id}
          type="button"
          className="store-chip"
          data-active={selection === entry.id || undefined}
          data-empty={count === 0 || undefined}
          onClick={() => onToggle(entry.id)}
        >
          {entryLabel(entry, locale, t)}
          <b>{count}</b>
        </button>
      ))}
    </div>
  );
}

function ClubRow({
  rows,
  selection,
  onToggle,
}: {
  rows: UniverseEntry[];
  selection: string | null;
  onToggle: (value: string) => void;
}) {
  const { t, locale } = useI18n();
  return (
    <div className="store-club-grid">
      {rows.map(({ entry, count }) => (
        <button
          key={entry.id}
          type="button"
          className="store-club-card"
          data-active={selection === entry.id || undefined}
          data-empty={count === 0 || undefined}
          onClick={() => onToggle(entry.id)}
        >
          <span className="cc-name">{entryLabel(entry, locale, t)}</span>
          <span className="cc-count">{count}</span>
        </button>
      ))}
    </div>
  );
}
