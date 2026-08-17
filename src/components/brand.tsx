import { Crown } from "lucide-react";

/**
 * Elegant, thin leaf icon for the ALYVA wordmark.
 */
function AlyvaLeaf({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20c-5-3-7.5-7-6-11 1.5-3.5 6-5 6-5s4.5 1.5 6 5c1.5 4-1 8-6 11z" />
      <path d="M12 4v16" />
    </svg>
  );
}

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
      <AlyvaLeaf className={`${icon} -rotate-12`} />
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
