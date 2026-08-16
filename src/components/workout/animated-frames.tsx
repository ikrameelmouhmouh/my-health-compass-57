import { useEffect, useState } from "react";

/**
 * Shared frame animation used everywhere an exercise demo is shown
 * (library, workout preview, active workout detail sheet).
 * Cross-fades through the frames to mimic a short looping demo video.
 */
export function AnimatedFrames({
  frames,
  alt,
  className,
  intervalMs = 650,
}: {
  frames: string[];
  alt: string;
  className?: string;
  intervalMs?: number;
}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (frames.length < 2) return;
    const id = window.setInterval(() => setI((v) => (v + 1) % frames.length), intervalMs);
    return () => window.clearInterval(id);
  }, [frames, intervalMs]);

  return (
    <div className="relative w-full overflow-hidden">
      {frames.map((src, idx) => (
        <img
          key={src}
          src={src}
          alt={alt}
          loading="lazy"
          className={`${className ?? ""} ${idx === 0 ? "" : "absolute inset-0"} transition-opacity duration-300 ${idx === i ? "opacity-100" : "opacity-0"}`}
        />
      ))}
    </div>
  );
}
