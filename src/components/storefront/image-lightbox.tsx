import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

/**
 * Full-screen photos with zoom.
 *
 * Buyers judge fabric and stitching from photos, and a 4:5 frame on a phone is
 * too small for that. A native <dialog> gives focus trapping and Escape for
 * free, as in the cart. Tapping the photo zooms to twice its size around the
 * point tapped; tapping again zooms out.
 */
export function ImageLightbox({
  images,
  index,
  alt,
  onIndex,
  onClose,
}: {
  images: string[];
  index: number | null;
  alt: string;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (index !== null && !el.open) el.showModal();
    if (index === null && el.open) el.close();
  }, [index]);

  useEffect(() => setZoom(null), [index]);

  const step = (delta: number) => {
    if (index === null) return;
    onIndex((index + delta + images.length) % images.length);
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label={alt}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") step(1);
        if (event.key === "ArrowLeft") step(-1);
      }}
      className="m-0 h-dvh max-h-dvh w-screen max-w-none bg-black/95 p-0 text-white backdrop:bg-black/80"
    >
      {index !== null && (
        <div className="relative flex h-full items-center justify-center overflow-hidden">
          <img
            src={images[index]}
            alt={alt}
            onClick={(event) => {
              const box = event.currentTarget.getBoundingClientRect();
              setZoom(
                zoom
                  ? null
                  : {
                      x: ((event.clientX - box.left) / box.width) * 100,
                      y: ((event.clientY - box.top) / box.height) * 100,
                    },
              );
            }}
            style={zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
            className={cn(
              "max-h-full max-w-full object-contain transition-transform duration-200",
              zoom ? "scale-[2.2] cursor-zoom-out" : "cursor-zoom-in",
            )}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="absolute end-3 top-3 grid size-11 place-items-center rounded-full bg-white/15"
          >
            <X aria-hidden="true" />
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label={t("common.previous")}
                className="absolute start-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15"
              >
                <ChevronLeft className="rtl:rotate-180" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label={t("common.next")}
                className="absolute end-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15"
              >
                <ChevronRight className="rtl:rotate-180" aria-hidden="true" />
              </button>
              <p className="absolute bottom-4 font-mono text-xs opacity-80" dir="ltr">
                {index + 1} / {images.length}
              </p>
            </>
          )}
        </div>
      )}
    </dialog>
  );
}
