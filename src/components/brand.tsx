import { Crown } from "lucide-react";

/**
 * Thin, elegant leaf icon for the ALYVA wordmark.
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
      <path d="M14.5 4c3.5 1.5 6 5 5.5 9.5s-4.5 7-9 6.5c-3.5-.5-6.5-3-7-7C3.5 8 7 4.5 12 4c0 0 1.5-.5 2.5 0z" />
      <path d="M12 4v11.5" />
      <path d="M9 9.5c1 1 2.5 1 3.5 0" />
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
