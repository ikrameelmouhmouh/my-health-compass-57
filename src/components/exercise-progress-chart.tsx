import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { getExerciseHistory } from "@/lib/workout-session";
import { TrendingUp } from "lucide-react";

export function ExerciseProgressChart({ exerciseName }: { exerciseName: string }) {
  const [data, setData] = useState<{ date: string; volume: number; oneRM: number; topWeight: number }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [metric, setMetric] = useState<"volume" | "oneRM" | "topWeight">("topWeight");

  useEffect(() => {
    getExerciseHistory(exerciseName).then((rows) => {
      setData(
        rows.map((r) => ({
          date: new Date(r.date).toLocaleDateString("nl-NL", { day: "2-digit", month: "short" }),
          volume: Math.round(r.volume),
          oneRM: r.top1RM,
          topWeight: r.topWeight,
        })),
      );
      setLoaded(true);
    });
  }, [exerciseName]);

  if (!loaded) return <div className="h-40 animate-pulse rounded-xl bg-muted/40" />;

  if (data.length < 2) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
        <TrendingUp className="size-5 opacity-50" />
        <p>Log nog {2 - data.length} sessie{2 - data.length > 1 ? "s" : ""} om je progressie te zien</p>
      </div>
    );
  }

  const tabs: { id: typeof metric; label: string }[] = [
    { id: "topWeight", label: "Top gewicht" },
    { id: "oneRM", label: "Geschatte 1RM" },
    { id: "volume", label: "Volume" },
  ];

  return (
    <div>
      <div className="mb-2 flex gap-1 rounded-lg bg-muted/40 p-1 text-[11px]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setMetric(t.id)}
            className={`flex-1 rounded-md px-2 py-1 transition ${metric === t.id ? "bg-background font-medium shadow-sm" : "text-muted-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey={metric}
              stroke="hsl(var(--brand))"
              strokeWidth={2}
              dot={{ r: 3, fill: "hsl(var(--brand))" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
