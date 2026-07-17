import type { LoggedMeal } from "@/lib/food";
import { computeMicros } from "@/lib/food";

type Row = { key: string; label: string; unit: string; value: number };

export function MicroDetailsCard({
  meals,
  title,
  todayLabel,
  labels,
}: {
  meals: LoggedMeal[];
  title: string;
  todayLabel: string;
  labels: {
    vitaminC: string;
    vitaminD: string;
    potassium: string;
    iron: string;
    calcium: string;
  };
}) {
  const totals = meals.reduce(
    (acc, m) => {
      const micro = computeMicros(m.food.per100, m.grams);
      acc.vitaminC += micro.vitaminC;
      acc.vitaminD += micro.vitaminD;
      acc.potassium += micro.potassium;
      acc.iron += micro.iron;
      acc.calcium += micro.calcium;
      return acc;
    },
    { vitaminC: 0, vitaminD: 0, potassium: 0, iron: 0, calcium: 0 },
  );

  const rows: Row[] = [
    { key: "vitaminC", label: labels.vitaminC, unit: "mg", value: Math.round(totals.vitaminC) },
    { key: "vitaminD", label: labels.vitaminD, unit: "µg", value: round1(totals.vitaminD) },
    { key: "potassium", label: labels.potassium, unit: "mg", value: Math.round(totals.potassium) },
    { key: "iron", label: labels.iron, unit: "mg", value: round1(totals.iron) },
    { key: "calcium", label: labels.calcium, unit: "mg", value: Math.round(totals.calcium) },
  ];

  return (
    <section className="mt-4 rounded-3xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold">{title}</h3>
        <span className="text-[11px] text-muted-foreground">{todayLabel}</span>
      </div>
      <ul className="mt-3 divide-y divide-border">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center justify-between py-2.5">
            <span className="text-sm">{r.label}</span>
            <span className="text-sm font-semibold tabular-nums">
              {formatValue(r.value)} {r.unit}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function formatValue(n: number) {
  if (n >= 1000) return n.toLocaleString();
  return n.toString();
}
