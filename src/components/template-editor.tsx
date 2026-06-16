import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Sparkles } from "lucide-react";
import type { Exercise } from "@/lib/workout.functions";
import { type WorkoutTemplate } from "@/lib/workout-prefs";
import { CoachSuggestDialog } from "./coach-suggest-dialog";

const DAYS = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"];

type Props = {
  open: boolean;
  initial: WorkoutTemplate;
  onClose: () => void;
  onSave: (t: WorkoutTemplate) => void;
};

export function TemplateEditor({ open, initial, onClose, onSave }: Props) {
  const [name, setName] = useState(initial.name);
  const [day, setDay] = useState(initial.day ?? "");
  const [focus, setFocus] = useState(initial.focus ?? "");
  const [exercises, setExercises] = useState<Exercise[]>(initial.exercises);
  const [coachOpen, setCoachOpen] = useState(false);

  const updateEx = (i: number, patch: Partial<Exercise>) =>
    setExercises((c) => c.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  const removeEx = (i: number) => setExercises((c) => c.filter((_, idx) => idx !== i));
  const addBlank = () =>
    setExercises((c) => [...c, { name: "", sets: 3, reps: "10", restSec: 90, suggestedWeight: "" }]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90dvh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial.exercises.length ? "Training bewerken" : "Nieuwe training"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Naam</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bijv. Maandag - Billen" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Dag</Label>
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger><SelectValue placeholder="Kies dag" /></SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Focus</Label>
              <Input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="Bijv. Billen" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Oefeningen ({exercises.length})</Label>
            <Button type="button" size="sm" variant="outline" onClick={() => setCoachOpen(true)}>
              <Sparkles className="mr-1 size-3.5" /> AI Coach
            </Button>
          </div>

          <div className="space-y-2">
            {exercises.map((ex, i) => (
              <div key={i} className="rounded-xl border border-border bg-card/50 p-3">
                <div className="flex items-start gap-2">
                  <Input
                    value={ex.name}
                    onChange={(e) => updateEx(i, { name: e.target.value })}
                    placeholder="Oefening naam"
                    className="flex-1"
                  />
                  <button onClick={() => removeEx(i)} className="grid size-9 place-items-center rounded-md text-muted-foreground hover:text-destructive" aria-label="Verwijder">
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Sets</Label>
                    <Input type="number" min={1} value={ex.sets} onChange={(e) => updateEx(i, { sets: Number(e.target.value) || 1 })} />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Reps</Label>
                    <Input value={ex.reps} onChange={(e) => updateEx(i, { reps: e.target.value })} placeholder="10" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Kg</Label>
                    <Input value={ex.suggestedWeight ?? ""} onChange={(e) => updateEx(i, { suggestedWeight: e.target.value })} placeholder="40" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Rust s</Label>
                    <Input type="number" min={0} value={ex.restSec} onChange={(e) => updateEx(i, { restSec: Number(e.target.value) || 0 })} />
                  </div>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" className="w-full" onClick={addBlank}>
              <Plus className="mr-1 size-4" /> Oefening toevoegen
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>Annuleer</Button>
          <Button
            onClick={() => onSave({ ...initial, name: name.trim() || "Nieuwe training", day: day || undefined, focus: focus || undefined, exercises })}
            disabled={exercises.length === 0}
          >
            Opslaan
          </Button>
        </DialogFooter>

        <CoachSuggestDialog
          open={coachOpen}
          defaultFocus={focus}
          onClose={() => setCoachOpen(false)}
          onAdd={(items) => { setExercises((c) => [...c, ...items]); setCoachOpen(false); }}
        />
      </DialogContent>
    </Dialog>
  );
}
