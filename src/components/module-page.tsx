import type { LucideIcon } from "lucide-react";

/**
 * iOS 18 style page shell with large title.
 */
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
    <main className="mx-auto min-h-[100dvh] w-full max-w-md px-4 pb-32 pt-6">
      <div className="flex items-center gap-2 px-1">
        <div className="grid size-7 shrink-0 place-items-center rounded-full bg-brand/15 text-brand">
          <Icon className="size-4" strokeWidth={2} />
        </div>
        <p className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
          {subtitle}
        </p>
      </div>
      <h1 className="mt-1 px-1 text-[34px] font-extrabold leading-tight tracking-tight">
        {title}
      </h1>

      <div className="mt-6 rounded-[14px] bg-card p-6 text-center shadow-sm">
        <p className="text-[15px] text-muted-foreground">{description}</p>
      </div>
    </main>
  );
}
