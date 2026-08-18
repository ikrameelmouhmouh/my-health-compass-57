import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { localDayKey } from "@/lib/local-date";

type Props = {
  /** Selected day, YYYY-MM-DD */
  value: string;
  /** Days (YYYY-MM-DD) that have logged data → small green dot */
  markedDays: Set<string>;
  locale?: string;
  /** Category accent: Eten = alyva green, Vasten = soft lavender. */
  accent?: "alyva" | "fasting";
  onSelect: (day: string) => void;
};

const ACCENT = {
  alyva: {
    selected: "bg-alyva text-alyva-foreground font-semibold",
    today: "font-semibold text-alyva",
    dot: "bg-alyva",
    dotSelected: "bg-alyva-foreground",
  },
  fasting: {
    selected: "bg-acc-fasting-soft text-acc-fasting font-semibold ring-1 ring-acc-fasting/30",
    today: "font-semibold text-acc-fasting",
    dot: "bg-acc-fasting",
    dotSelected: "bg-acc-fasting",
  },
} as const;

/** Quiet month calendar used by the Eten date selector. */
export function MonthCalendar({ value, markedDays, locale, accent = "alyva", onSelect }: Props) {
  const tone = ACCENT[accent];
  const selected = useMemo(() => new Date(value + "T00:00:00"), [value]);
  const [cursor, setCursor] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  const todayKey = localDayKey();

  const { cells, weekdays } = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    // Monday-first offset
    const offset = (first.getDay() + 6) % 7;
    const list: (Date | null)[] = Array.from({ length: offset }, () => null);
    for (let d = 1; d <= daysInMonth; d++) list.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));

    const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
    const wd = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2024, 0, 1 + i); // 2024-01-01 is a Monday
      return fmt.format(d).replace(".", "").slice(0, 2);
    });
    return { cells: list, weekdays: wd };
  }, [cursor, locale]);

  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(cursor);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          className="grid size-8 place-items-center rounded-full border border-border ios-press"
          aria-label="−1"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-[13px] font-semibold capitalize">{monthLabel}</span>
        <button
          type="button"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          className="grid size-8 place-items-center rounded-full border border-border ios-press"
          aria-label="+1"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {weekdays.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <span key={`e${i}`} />;
          const key = localDayKey(d);
          const isSelected = key === value;
          const isToday = key === todayKey;
          const isFuture = key > todayKey;
          return (
            <button
              key={key}
              type="button"
              disabled={isFuture}
              onClick={() => onSelect(key)}
              className={[
                "relative grid h-10 place-items-center rounded-2xl text-[13px] tabular-nums transition-colors",
                isSelected ? tone.selected : isToday ? tone.today : "text-foreground",
                isFuture ? "opacity-30" : "ios-press",
              ].join(" ")}
            >
              {d.getDate()}
              {markedDays.has(key) && (
                <span
                  className={`absolute bottom-1.5 size-1 rounded-full ${isSelected ? tone.dotSelected : tone.dot}`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
