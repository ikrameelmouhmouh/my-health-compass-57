import type { LucideIcon } from "lucide-react";

export function ModulePage({
  icon: Icon,
  title,
  subtitle,
  description,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
}) {
  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-5 pb-32 pt-10">
      <div className="flex items-center gap-3">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand/15 text-brand">
          <Icon className="size-6" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="truncate text-[12px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-dashed border-border bg-card/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </main>
  );
}
