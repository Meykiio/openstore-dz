import { useState } from "react";
import { ImageOff } from "lucide-react";
import { ImageLightbox } from "./image-lightbox";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

/**
 * Product gallery: 4:3 main image plus an active-ringed thumbnail strip.
 *
 * The main frame is 4:3 while the catalogue card is 1:1, matching the reference
 * (it locks both, deliberately different: a card is a teaser, a gallery is a
 * product). Thumbnails only appear when there is more than one image, so a
 * single-image product shows no dead strip of one thumbnail.
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

  if (images.length === 0) {
    return (
      <div className="gallery-main">
        <ImageOff size={40} aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="gallery">
      <button
        type="button"
        className="gallery-main cursor-zoom-in"
        onClick={() => setOpen(active)}
        aria-label={t("store.zoom")}
      >
        <img src={images[active] ?? images[0]} alt={alt} decoding="async" />
      </button>
      <ImageLightbox
        images={images}
        index={open}
        alt={alt}
        onIndex={(index) => {
          setOpen(index);
          onSelect(index);
        }}
        onClose={() => setOpen(null)}
      />

      {images.length > 1 && (
        <div className="gallery-thumbs">
          {images.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => onSelect(index)}
              aria-label={`${t("store.description")} ${index + 1}`}
              aria-current={index === active}
              className={cn("gallery-thumb", index === active && "active")}
            >
              <img src={url} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
