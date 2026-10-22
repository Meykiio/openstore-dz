import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

/**
 * Page controls.
 *
 * Numbered pages with previous and next, not a "load more" button. Load more is
 * not pagination: the page keeps growing, so a shop with eight hundred orders ends
 * up with eight hundred rows in the DOM and no way to reach page 30 without
 * clicking thirty times. Real pages bound what is rendered and make any page
 * directly reachable.
 *
 * Previous and next are text, not chevrons. A left or right arrow is a direction,
 * and the correct direction inverts between Arabic and French; two words do not
 * have that problem and need no direction-aware flipping.
 *
 * The window is capped at five numbers with ellipses, so a shop with two hundred
 * pages gets a usable control rather than two hundred buttons.
 */
export function Pagination({
  page,
  pageCount,
  onPageChange,
  testId,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  testId?: string;
}) {
  const { t } = useI18n();

  // Nothing to page. Rendering a disabled control would suggest otherwise.
  if (pageCount <= 1) return null;

  const window = pageWindow(page, pageCount);

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-1"
      aria-label={t("common.pagination")}
      data-testid={testId}
    >
      <PageButton
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        testId={testId ? `${testId}-prev` : undefined}
      >
        {t("common.previous")}
      </PageButton>

      {window.map((entry, index) =>
        entry === null ? (
          <span key={`gap-${index}`} className="px-1 text-on-surface-muted" aria-hidden="true">
            …
          </span>
        ) : (
          <PageButton
            key={entry}
            current={entry === page}
            onClick={() => onPageChange(entry)}
            testId={testId ? `${testId}-page-${entry}` : undefined}
          >
            {entry}
          </PageButton>
        ),
      )}

      <PageButton
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
        testId={testId ? `${testId}-next` : undefined}
      >
        {t("common.next")}
      </PageButton>
    </nav>
  );
}

function PageButton({
  children,
  onClick,
  disabled,
  current,
  testId,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  current?: boolean;
  testId?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={current ? "page" : undefined}
      data-testid={testId}
      className={cn(
        // min-h-9 keeps every control a real tap target on a phone, which is where
        // an owner actually pages through orders.
        "inline-flex min-h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm transition-colors",
        current
          ? "bg-primary font-medium text-on-primary"
          : "border border-outline text-on-surface-muted hover:bg-surface-mid hover:text-on-surface",
        disabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Which page numbers to show: the first, the last, the current and its
 * neighbours, with `null` marking a gap.
 *
 * Exported and pure so the arithmetic is unit-tested rather than clicked through.
 * The off-by-one here is the classic one, and a pager that skips page 2 is the
 * kind of thing nobody notices until they need page 2.
 */
export function pageWindow(page: number, pageCount: number, span = 1): (number | null)[] {
  // Short enough to show in full, so show it in full. Windowing a five-page
  // catalogue into "1 2 … 5" hides two pages for no gain.
  const FULL_LIMIT = 7;
  if (pageCount <= FULL_LIMIT) {
    return Array.from({ length: Math.max(pageCount, 1) }, (_, index) => index + 1);
  }

  const wanted = new Set<number>([1, pageCount]);
  for (let offset = -span; offset <= span; offset++) {
    const candidate = page + offset;
    if (candidate >= 1 && candidate <= pageCount) wanted.add(candidate);
  }

  const sorted = [...wanted].sort((a, b) => a - b);
  const result: (number | null)[] = [];
  let previous = 0;
  for (const value of sorted) {
    // A gap of exactly one is shown as the number, not as an ellipsis.
    if (previous && value - previous === 2) result.push(previous + 1);
    else if (previous && value - previous > 2) result.push(null);
    result.push(value);
    previous = value;
  }
  return result;
}
