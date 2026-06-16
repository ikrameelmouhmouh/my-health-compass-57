import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Calendar, Check, ChevronRight, Dumbbell, Flame, Target, X } from "lucide-react";
import { toast } from "sonner";
import { PROGRAMS, type Program } from "@/lib/workout-programs";
import { useTemplates, newTemplate } from "@/lib/workout-prefs";

export function ProgramLibrary() {
  const [active, setActive] = useState<Program | null>(null);
  const { upsert } = useTemplates();

  function importProgram(p: Program) {
    p.days.forEach((d) => {
      upsert(
        newTemplate({
          name: d.name,
          day: d.day,
          focus: d.focus,
          exercises: d.exercises,
        }),
      );
    });
    toast.success(`${p.name} toegevoegd`, {
      description: `${p.days.length} trainingen opgeslagen in Eigen trainingen.`,
    });
    setActive(null);
  }

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Kant-en-klare programma's</h3>
          <p className="text-xs text-muted-foreground">Bewezen schema's — tik om te bekijken en toe te voegen</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {PROGRAMS.map((p) => (
          <button
            key={p.id}
            onClick={() => setActive(p)}
            className={`group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${p.accent} p-4 text-left transition hover:border-brand/50`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{p.short}</p>
                <h4 className="mt-1 font-display text-lg font-semibold leading-tight">{p.name}</h4>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Pill icon={<Calendar className="size-3" />}>{p.daysPerWeek}× / week</Pill>
                  <Pill icon={<Target className="size-3" />}>{p.goal}</Pill>
                  <Pill icon={<Flame className="size-3" />}>{p.level}</Pill>
                </div>
              </div>
              <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
            </div>
          </button>
        ))}
      </div>

      {active && (
        <ProgramDetailDialog
          program={active}
          onClose={() => setActive(null)}
          onImport={() => importProgram(active)}
        />
      )}
    </section>
  );
}

function Pill({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-background/60 px-2 py-0.5 text-[10px] font-medium text-foreground/80 backdrop-blur">
      {icon}
      {children}
    </span>
  );
}

function ProgramDetailDialog({
  program,
  onClose,
  onImport,
}: {
  program: Program;
  onClose: () => void;
  onImport: () => void;
}) {
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex h-[92dvh] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:rounded-3xl">
        <div className={`relative bg-gradient-to-br ${program.accent} px-5 pb-5 pt-6`}>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-background/60 backdrop-blur hover:bg-background"
            aria-label="Sluiten"
          >
            <X className="size-4" />
          </button>
          <DialogHeader className="space-y-1 text-left">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{program.short}</p>
            <DialogTitle className="font-display text-2xl">{program.name}</DialogTitle>
            <DialogDescription>{program.description}</DialogDescription>
          </DialogHeader>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Pill icon={<Calendar className="size-3" />}>{program.daysPerWeek}× / week</Pill>
            <Pill icon={<Target className="size-3" />}>{program.goal}</Pill>
            <Pill icon={<Flame className="size-3" />}>{program.level}</Pill>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
          {program.days.map((d, i) => {
            const sets = d.exercises.reduce((s, e) => s + e.sets, 0);
            return (
              <div key={i} className="rounded-2xl border border-border bg-card/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{d.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[d.day, d.focus].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="shrink-0 rounded-full bg-background/70 px-2 py-1 text-[10px] font-medium text-muted-foreground">
                    {d.exercises.length} oef · {sets} sets
                  </div>
                </div>
                <ul className="mt-2 space-y-1 border-t border-border/60 pt-2">
                  {d.exercises.map((ex, j) => (
                    <li key={j} className="flex items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-1.5 truncate text-foreground/90">
                        <Dumbbell className="size-3 text-muted-foreground" />
                        {ex.name}
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        {ex.sets} × {ex.reps}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <DialogFooter className="border-t border-border bg-background/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur sm:flex-row">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-full">
            Annuleer
          </Button>
          <Button onClick={onImport} className="flex-1 rounded-full">
            <Check className="mr-1 size-4" /> Voeg toe ({program.days.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
