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
      <circle cx="12" cy="13" r="7.5" />
      <circle cx="12" cy="13" r="4" />
      <path d="M2.5 13h1.6M19.9 13h1.6" />
      <path d="M9.5 6.5c.6-1.6 2.2-2.6 3.9-2.4" />
    </svg>
  );
}

export function CutleryPlateIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="6.2" />
      <circle cx="12" cy="12" r="3.2" />
      <path d="M3.4 4.5v4.2c0 .8.6 1.4 1.3 1.4S6 9.5 6 8.7V4.5M4.7 10.1V19.5" />
      <path d="M19.4 4.5c-1 .8-1.5 2-1.5 3.4 0 1 .5 1.7 1.5 1.9V19.5" />
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
      <path d="M3.5 8V5.5c0-1.1.9-2 2-2H8M16 3.5h2.5c1.1 0 2 .9 2 2V8M20.5 16v2.5c0 1.1-.9 2-2 2H16M8 20.5H5.5c-1.1 0-2-.9-2-2V16" />
      <circle cx="12" cy="12" r="3.4" />
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
      <path d="M9.5 17.5h5M10 20.5h4" />
      <path d="M12 3.5a5.8 5.8 0 0 0-3.4 10.5c.5.4.8 1 .9 1.5h5c.1-.6.4-1.1.9-1.5A5.8 5.8 0 0 0 12 3.5Z" />
    </svg>
  );
}

export const MEAL_ICONS: Record<MealType, (p: IconProps) => JSX.Element> = {
  breakfast: BowlIcon,
  lunch: SaladPlateIcon,
  dinner: CutleryPlateIcon,
  snack: AppleSnackIcon,
};
