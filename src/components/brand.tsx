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
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* stem */}
      <path d="M11.4 22c-.2-4 .1-8.4.9-11.2" />
      {/* upper-right leaf */}
      <path d="M12.5 11c.4-5 3.9-7.6 7.5-8 0 4-2.5 7.6-7.5 8z" />
      <path d="M19.4 3.6c-2.8 1.7-5 4.4-6.3 6.9" />
      {/* lower-left leaf */}
      <path d="M11.5 15c-1-3.5-4-5.5-7.5-5.8.2 3.6 3 6.2 7.5 5.8z" />
      <path d="M4.6 9.8c2.8 1.7 5 3.6 6.3 5.1" />
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
