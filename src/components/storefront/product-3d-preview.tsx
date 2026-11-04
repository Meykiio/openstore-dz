import { useEffect, useState } from "react";
import { Box, Camera, Info, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";

type Props = {
  modelUrl: string;
  imageUrl: string | null;
  dimensions?: string | null;
  productName: string;
};

declare global {
  interface Window {
    "model-viewer-injected"?: boolean;
  }
  interface Navigator {
    xr?: { isSessionSupported: (s: string) => Promise<boolean> };
  }
}

export function Product3DPreview({ modelUrl, imageUrl, dimensions, productName }: Props) {
  const { t } = useI18n();
  const [arSupported, setArSupported] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const mountedRef = { current: true };

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.xr) {
      navigator.xr.isSessionSupported("immersive-ar").then((s) => { if (mountedRef.current) setArSupported(s); }).catch(() => {});
    }
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    if (window["model-viewer-injected"]) { setLoaded(true); return; }
    const s = document.createElement("script");
    s.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js";
    s.async = true;
    s.onload = () => { window["model-viewer-injected"] = true; setLoaded(true); };
    s.onerror = () => setLoaded(false);
    document.head.appendChild(s);
    return () => { mountedRef.current = false; };
  }, [modelUrl]);

  const handleAR = () => {
    const el = document.querySelector("model-viewer") as unknown as HTMLElement;
    // @ts-ignore activate is a method on model-viewer custom element
    void el?.activate?.();
  };

  return (
    <section className="flex flex-col gap-3" aria-labelledby="3d-preview-title">
      <h2 id="3d-preview-title" className="flex items-center gap-2 text-base font-semibold">
        <Box size={16} className="text-primary" aria-hidden="true" />
        {t("store.view3d")}
      </h2>
      <div className="relative overflow-hidden rounded-[16px] border border-outline bg-surface-mid">
        {loaded ? (
          <div
            className="aspect-[4/3] w-full rounded-[12px] bg-surface-mid relative"
            style={{ minHeight: "200px" }}
            data-model-viewer-src={modelUrl}
          >
            {/* model-viewer will be rendered by the script when it detects the attribute */}
            {arSupported && (
              <button
                className="absolute bottom-3 end-3 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow"
                onClick={handleAR}
              >
                <Info size={14} aria-hidden="true" />{t("store.arView")}
              </button>
            )}
          </div>
        ) : modelUrl ? (
          <div className="grid aspect-[4/3] w-full place-items-center">
            <Loader2 size={24} className="animate-spin text-primary" aria-hidden="true" />
          </div>
        ) : imageUrl ? (
          <img src={imageUrl} alt={productName} className="aspect-[4/3] w-full object-contain" />
        ) : (
          <div className="grid aspect-[4/3] w-full place-items-center text-on-surface-muted">
            <Camera size={24} aria-hidden="true" />
            <p className="mt-2 text-sm">{t("admin.applianceSpecs.noModel")}</p>
          </div>
        )}
      </div>
      {dimensions && (
        <p className="text-xs text-on-surface-muted">{t("store.dimensions")}: {dimensions}</p>
      )}
    </section>
  );
}
