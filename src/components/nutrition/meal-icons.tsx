import type * as React from "react";
import type { SVGProps } from "react";
import type { MealType } from "@/lib/food";

/**
 * Hand-drawn line-art meal icons — one single consistent drawing style
 * (thin strokes, rounded caps, currentColor) used across the Eten page.
 */
type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.3,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function BowlIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 10.5h17a8.5 8.5 0 0 1-8.5 8 8.5 8.5 0 0 1-8.5-8Z" />
      <path d="M8 7.5c0-1.4 1-2 1-3" />
      <path d="M12 7c0-1.7 1.2-2.3 1.2-3.5" />
      <path d="M16 7.5c0-1.2.9-1.8.9-2.8" />
    </svg>
  );
}

export function SaladPlateIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 11.5h17a8.5 8.5 0 0 1-8.5 8 8.5 8.5 0 0 1-8.5-8Z" />
      <path d="M7.5 11.5c-.8-1.4-.3-3 1.2-3.6" />
      <path d="M9.8 11.5c-.6-1.9.4-3.7 2.2-4.2" />
      <path d="M13.6 11.5c.1-2 1.6-3.3 3.3-3.2" />
      <path d="M11.3 8c.5-1.4 1.8-2.2 3.2-2" />
    </svg>
  );
}

export function CutleryPlateIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 12.5h17a8.5 8.5 0 0 1-8.5 8 8.5 8.5 0 0 1-8.5-8Z" />
      <path d="M8.5 9c0-1.3 1-1.8 1-3M12 8.5c0-1.6 1.2-2.1 1.2-3.4M15.5 9c0-1.1.9-1.6.9-2.6" />
      <path d="M2.5 12.5h1M20.5 12.5h1" />
    </svg>
  );
}


export function AppleSnackIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 8.2c1-1 2.2-1.5 3.4-1.3 2.2.4 3.6 2.6 3.2 5.3-.4 2.8-2.3 6.7-4.3 6.7-.9 0-1.4-.5-2.3-.5s-1.4.5-2.3.5c-2 0-3.9-3.9-4.3-6.7-.4-2.7 1-4.9 3.2-5.3 1.2-.2 2.4.3 3.4 1.3Z" />
      <path d="M12 8.2c-.2-1.5.3-2.9 1.6-3.9" />
      <path d="M12.3 5.1c1 .1 1.9-.3 2.6-1.1" />
    </svg>
  );
}

export function ScanMealIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="2.8" y="6.5" width="18.4" height="13.5" rx="3.2" />
      <path d="M8.6 6.5l1.2-2.2c.2-.4.6-.6 1-.6h2.4c.4 0 .8.2 1 .6l1.2 2.2" />
      <circle cx="12" cy="13.4" r="3.5" />
    </svg>
  );
}

export function PlannerIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
      <path d="M7.5 13.5h3M13.5 13.5h3M7.5 17h3M13.5 17h3" />
    </svg>
  );
}

export function TipIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.2c.4 2.2-.6 3.2-1.8 4.4-1.5 1.4-2.9 2.8-2.9 5.4a4.7 4.7 0 0 0 9.4 0c0-1.6-.6-2.8-1.5-3.9-.3 1-.9 1.6-1.7 1.8.4-3-1.5-6.2-1.5-7.7Z" />
      <path d="M12 20.8a2.6 2.6 0 0 0 2.6-2.6c0-1.4-1.3-2.1-2.6-4-1.3 1.9-2.6 2.6-2.6 4a2.6 2.6 0 0 0 2.6 2.6Z" />
    </svg>
  );
}


export const MEAL_ICONS: Record<MealType, (p: IconProps) => React.ReactElement> = {
  breakfast: BowlIcon,
  lunch: SaladPlateIcon,
  dinner: CutleryPlateIcon,
  snack: AppleSnackIcon,
};
