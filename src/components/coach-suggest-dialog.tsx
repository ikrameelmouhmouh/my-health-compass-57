import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Sparkles, Plus, Check } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { suggestExercises, type CoachSuggestion } from "@/lib/coach.functions";
import type { Exercise } from "@/lib/workout.functions";

type Props = {
  open: boolean;
  defaultFocus?: string;
  onClose: () => void;
  onAdd: (exercises: Exercise[]) => void;
};

export function CoachSuggestDialog({ open, defaultFocus, onClose, onAdd }: Props) {
  const [focus, setFocus] = useState(defaultFocus ?? "");
  const [notes, setNotes] = useState("");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CoachSuggestion | null>(null);
  const [picked, setPicked] = useState<Set<number>>(new Set());

  const run = useServerFn(suggestExercises);

  const ask = async () => {
    if (!focus.trim()) return;
    setLoading(true); setError(null); setResult(null); setPicked(new Set());
    try {
      const r = await run({ data: { focus: focus.trim(), notes: notes.trim() || undefined, count } });
      setResult(r);
      setPicked(new Set(r.exercises.map((_, i) => i)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Er ging iets mis");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (i: number) => {
    setPicked((c) => { const n = new Set(c); n.has(i) ? n.delete(i) : n.add(i); return n; });
  };

  const add = () => {
    if (!result) return;
    const chosen = result.exercises.filter((_, i) => picked.has(i));
    onAdd(chosen);
    setResult(null); setFocus(""); setNotes(""); setPicked(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90dvh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles className="size-4 text-brand" /> AI Coach</DialogTitle>
        </DialogHeader>

        {!result && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Vertel waar je op wilt focussen. De coach stelt oefeningen, sets, reps en gewicht voor.
            </p>
            <div>
              <Label>Focus / spiergroep</Label>
              <Input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="Bijv. billen en hamstrings" />
            </div>
            <div>
              <Label>Extra wensen (optioneel)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Bijv. ik heb alleen dumbbells, of vermijd kniebuigingen" rows={3} />
            </div>
            <div>
              <Label>Aantal oefeningen</Label>
              <Input type="number" min={1} max={10} value={count} onChange={(e) => setCount(Math.min(10, Math.max(1, Number(e.target.value) || 5)))} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" onClick={ask} disabled={loading || !focus.trim()}>
              {loading ? <><Loader2 className="mr-2 size-4 animate-spin" /> Bezig...</> : <><Sparkles className="mr-2 size-4" /> Vraag de coach</>}
            </Button>
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div className="rounded-xl bg-brand/10 p-3 text-sm">{result.message}</div>
            <p className="text-xs text-muted-foreground">Tik aan om te kiezen welke je wilt toevoegen.</p>
            <div className="space-y-2">
              {result.exercises.map((ex, i) => {
                const on = picked.has(i);
                return (
                  <button
                    key={i}
                    onClick={() => toggle(i)}
                    className={`w-full rounded-xl border p-3 text-left transition ${on ? "border-brand bg-brand/5" : "border-border bg-card/50"}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 ${on ? "border-brand bg-brand text-white" : "border-border"}`}>
                        {on && <Check className="size-3" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{ex.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {ex.sets} × {ex.reps} · rust {ex.restSec}s{ex.suggestedWeight ? ` · ${ex.suggestedWeight}` : ""}
                        </p>
                        {ex.notes && <p className="mt-1 text-xs text-muted-foreground">{ex.notes}</p>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setResult(null); }}>
                Opnieuw
              </Button>
              <Button className="flex-1" onClick={add} disabled={picked.size === 0}>
                <Plus className="mr-1 size-4" /> Voeg {picked.size} toe
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
