import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { ImageLightbox } from "./image-lightbox";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

/**
 * Product gallery.
 *
 * One swipeable strip on every screen: a thumb swipe on phones (the gesture
 * every Instagram user knows), a trackpad swipe, arrow buttons or the arrow keys
 * on desktop, where thumbnails also jump straight to a photo. Dots on phones.
 * Tapping a photo opens the zoom. Changing colour returns to the first photo.
 */
export function ProductGallery({
  images,
  alt,
  active,
  onSelect,
}: {
  images: string[];
  alt: string;
  active: number;
  onSelect: (index: number) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState<number | null>(null);
  const track = useRef<HTMLDivElement>(null);

  /** Scroll the strip to a photo. RTL strips scroll towards negative offsets. */
  const go = (index: number, smooth = true) => {
    const el = track.current;
    if (!el) return;
    const target = Math.max(0, Math.min(images.length - 1, index));
    const rtl = getComputedStyle(el).direction === "rtl";
    const left = target * el.clientWidth * (rtl ? -1 : 1);
    el.scrollTo({ left, behavior: smooth ? "smooth" : "auto" });
  };

  // A new colour means a new set of photos: start the strip at the first one.
  // Keyed on the URLs, not the array, which the parent rebuilds on every render
  // (keying on the array snapped every swipe back to the first photo).
  const photoSet = images.join("|");
  useEffect(() => {
    track.current?.scrollTo({ left: 0 });
  }, [photoSet]);

  const onScroll = () => {
    const el = track.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(Math.abs(el.scrollLeft) / el.clientWidth);
    if (index !== active) onSelect(index);
  };

  // Arrow keys follow the reading direction: in Arabic, left is "next".
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const forward = (event.key === "ArrowRight") !== rtl;
    go(active + (forward ? 1 : -1));
  };

  if (images.length === 0) {
    return (
      <div className="gallery-main">
        <ImageOff size={40} aria-hidden="true" />
      </div>
    );
  }

  const many = images.length > 1;

  return (
    <div className="gallery">
      <div className="gallery-stage">
        <div
          ref={track}
          className="gallery-track"
          onScroll={onScroll}
          onKeyDown={onKeyDown}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label={alt}
        >
          {images.map((url, index) => (
            <button
              key={url}
              type="button"
              tabIndex={-1}
              className="cursor-zoom-in"
              onClick={() => setOpen(index)}
              aria-label={`${t("store.zoom")} ${index + 1}`}
            >
              <img
                src={url}
                alt={index === 0 ? alt : ""}
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
                decoding="async"
              />
            </button>
          ))}
        </div>
        {many && <GalleryArrows active={active} count={images.length} go={go} />}
      </div>

      {many && <GalleryNav images={images} active={active} go={go} />}

      <ImageLightbox
        images={images}
        index={open}
        alt={alt}
        onIndex={(index) => {
          setOpen(index);
          onSelect(index);
          go(index, false);
        }}
        onClose={() => setOpen(null)}
      />
    </div>
  );
}

/** Desktop arrows over the photo, and the "2 / 5" counter. */
function GalleryArrows({
  active,
  count,
  go,
}: {
  active: number;
  count: number;
  go: (index: number) => void;
}) {
  const { t } = useI18n();
  return (
    <>
      <button
        type="button"
        className="gallery-arrow start-3"
        onClick={() => go(active - 1)}
        disabled={active === 0}
        aria-label={t("common.previous")}
      >
        <ChevronLeft size={20} className="rtl:rotate-180" aria-hidden="true" />
      </button>
      <button
        type="button"
        className="gallery-arrow end-3"
        onClick={() => go(active + 1)}
        disabled={active === count - 1}
        aria-label={t("common.next")}
      >
        <ChevronRight size={20} className="rtl:rotate-180" aria-hidden="true" />
      </button>
      <span className="gallery-count" dir="ltr" aria-hidden="true">
        {active + 1} / {count}
      </span>
    </>
  );
}

/** Dots on phones; thumbnails that jump to a photo on desktop. */
function GalleryNav({
  images,
  active,
  go,
}: {
  images: string[];
  active: number;
  go: (index: number) => void;
}) {
  const { t } = useI18n();
  return (
    <>
      <div className="lg:hidden">
        <div className="gallery-dots" aria-hidden="true">
          {images.map((url, index) => (
            <span key={url} className={cn(index === active && "on")} />
          ))}
        </div>
      </div>
      <div className="hidden lg:block">
        <div className="gallery-thumbs">
          {images.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => go(index)}
              aria-label={`${t("store.description")} ${index + 1}`}
              aria-current={index === active}
              className={cn("gallery-thumb", index === active && "active")}
            >
              <img src={url} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
