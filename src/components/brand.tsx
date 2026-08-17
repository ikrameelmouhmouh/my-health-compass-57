import { Crown, Leaf } from "lucide-react";

/**
 * Central ALYVA wordmark: small leaf icon + thin, wide-tracked wordmark.
 * Use this everywhere the ALYVA brand name is displayed.
 */
export function AlyvaWordmark({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const text =
    size === "sm" ? "text-[14px]" : size === "lg" ? "text-[24px]" : "text-[18px]";
  const icon = size === "sm" ? "size-3.5" : size === "lg" ? "size-5" : "size-[17px]";
  return (
    <span className={`inline-flex items-center gap-1.5 text-brand ${className}`}>
      <Leaf className={`${icon} -rotate-12`} strokeWidth={1.5} aria-hidden />
      <span className={`font-display ${text} font-light tracking-[0.3em] leading-none`}>
        ALYVA
      </span>
    </span>
  );
}

/**
 * Central ALYVA PLUS badge: subtle light-green pill with a crown icon.
 */
export function AlyvaPlusBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-brand/10 px-2.5 py-1 text-brand ${className}`}
    >
      <Crown className="size-3" strokeWidth={1.75} aria-hidden />
      <span className="font-display text-[10px] font-light uppercase tracking-[0.22em] leading-none">
        Alyva Plus
      </span>
    </span>
  );
}
