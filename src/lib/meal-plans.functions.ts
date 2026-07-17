import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type PlannedMeal = {
  id: string;
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type MealPlanDay = {
  dayIndex: number; // 0-6
  meals: PlannedMeal[];
};

const MealSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(120),
  kcal: z.number().min(0).max(10000),
  protein: z.number().min(0).max(1000),
  carbs: z.number().min(0).max(1000),
  fat: z.number().min(0).max(1000),
});

export const listMealPlan = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MealPlanDay[]> => {
    const { data, error } = await context.supabase
      .from("meal_plans")
      .select("day_index, meals")
      .eq("user_id", context.userId)
      .order("day_index", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: { day_index: number; meals: unknown }) => ({
      dayIndex: r.day_index,
      meals: Array.isArray(r.meals) ? (r.meals as PlannedMeal[]) : [],
    }));
  });

export const saveMealPlanDay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      dayIndex: z.number().int().min(0).max(6),
      meals: z.array(MealSchema).max(20),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("meal_plans")
      .upsert(
        {
          user_id: context.userId,
          day_index: data.dayIndex,
          meals: data.meals,
        },
        { onConflict: "user_id,day_index" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
