import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Camera, ChefHat, Dumbbell, Apple, LineChart, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/ai-coach")({
  component: AiCoachPage,
});

const capabilities = [
  { icon: Camera, title: "Food photo analysis", desc: "Snap a meal and get an instant breakdown." },
  { icon: Apple, title: "Calorie estimation", desc: "Estimate calories from a single photo." },
  { icon: ChefHat, title: "Meal & recipe ideas", desc: "Personalized recipes that fit your plan." },
  { icon: Dumbbell, title: "Workout recommendations", desc: "Routines tailored to your goal and level." },
  { icon: LineChart, title: "Progress analysis", desc: "Insights from your nutrition, fasting and weight." },
  { icon: MessageCircle, title: "Personalized advice", desc: "Ask anything about your health journey." },
];

function AiCoachPage() {
  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-5 pb-32 pt-10">
      <div className="flex items-center gap-3">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand/15 text-brand">
          <Sparkles className="size-6" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-semibold tracking-tight">AI Coach</h1>
          <p className="text-[12px] text-muted-foreground">Your personal health assistant</p>
        </div>
      </div>

      <p className="mt-5 text-sm text-muted-foreground">
        Get expert guidance whenever you need it. The AI Coach helps you with photos, recipes, workouts and progress —
        without replacing the quick logging in your modules.
      </p>

      <section className="mt-6 grid grid-cols-1 gap-2.5">
        {capabilities.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3.5">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-foreground">
              <Icon className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-sm font-semibold">{title}</div>
              <div className="text-[12px] text-muted-foreground">{desc}</div>
            </div>
          </div>
        ))}
      </section>

      <button
        type="button"
        disabled
        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-sm font-semibold text-brand-foreground opacity-70"
      >
        <MessageCircle className="size-4" />
        Chat with your coach — coming soon
      </button>
    </main>
  );
}
