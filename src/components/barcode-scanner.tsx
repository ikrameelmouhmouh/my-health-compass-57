import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, ScanLine, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isBarcodeScanSupported } from "@/lib/food";
import { useT } from "@/lib/i18n";



type Props = {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
};

export function BarcodeScanner({ open, onClose, onDetected }: Props) {
  const t = useT();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [supported] = useState(() => isBarcodeScanSupported());
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [showManual, setShowManual] = useState(false);


  useEffect(() => {
    if (!open) return;
    if (!supported) {
      setShowManual(true);
      return;
    }
    let cancelled = false;
    const detector = new (window as any).BarcodeDetector({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"],
    });

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const tick = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes && codes.length > 0) {
              onDetected(codes[0].rawValue);
              return;
            }
          } catch {}
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch (e: any) {
        setError(e?.message ?? t("scan.camera_denied"));
        setShowManual(true);
      }
    })();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open, supported, onDetected]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/90 p-4" style={{ pointerEvents: "auto" }}>

      {supported && !showManual && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/15 text-white"
          aria-label={t("scan.close")}
        >
          <X className="size-5" />
        </button>
      )}



      {supported && !showManual ? (
        <div className="relative aspect-[3/4] w-full max-w-sm overflow-hidden rounded-3xl bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            className="size-full object-cover"
          />
          {/* Reticle */}
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="relative h-32 w-3/4 rounded-2xl border-2 border-white/80">
              <div className="absolute inset-x-4 top-1/2 h-px animate-pulse bg-brand" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
            <p className="flex items-center gap-1.5 text-xs">
              <ScanLine className="size-4" /> {t("scan.point")}
            </p>
            <button
              className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs"
              onClick={() => setShowManual(true)}
            >
              <Keyboard className="size-3.5" /> {t("scan.type_code")}
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-sm rounded-3xl bg-card p-6">
          <h3 className="font-display text-base font-semibold">{t("scan.enter_title")}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {error
              ? error
              : !supported
              ? t("scan.unsupported")
              : t("scan.type_below")}
          </p>
          <Input
            autoFocus
            inputMode="numeric"
            placeholder={t("scan.placeholder")}
            value={manual}
            onChange={(e) => setManual(e.target.value.replace(/\D/g, ""))}
            className="mt-4"
          />
          <div className="mt-4 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              {t("scan.cancel")}
            </Button>
            <Button
              className="flex-1"
              disabled={manual.length < 6}
              onClick={() => onDetected(manual)}
            >
              {t("scan.lookup")}
            </Button>
          </div>
        </div>

      )}
    </div>
  );
}
