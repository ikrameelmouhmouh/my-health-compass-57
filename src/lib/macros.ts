// Macro & calorie calculations.
// Mifflin-St Jeor BMR -> TDEE via activity multiplier -> daily target by goal.

export type Gender = "male" | "female" | "other";
export type Goal = "lose" | "maintain" | "gain";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "very_active"
  | "athlete";

export interface MacroInput {
  gender: Gender;
  age: number;
  heightCm: number;
  currentWeightKg: number;
  goal: Goal;
  weeklyChangeKg: number; // positive number, applied per goal direction
  activityLevel: ActivityLevel;
}

export interface MacroResult {
  bmr: number;
  maintenanceCalories: number;
  dailyCalories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  athlete: 1.9,
};

// 1 kg body fat ≈ 7700 kcal
const KCAL_PER_KG = 7700;

export function calculateMacros(input: MacroInput): MacroResult {
  const { gender, age, heightCm, currentWeightKg, goal, weeklyChangeKg, activityLevel } = input;

  // Mifflin-St Jeor. 'other' uses the average of male and female constants.
  const base = 10 * currentWeightKg + 6.25 * heightCm - 5 * age;
  const genderOffset = gender === "male" ? 5 : gender === "female" ? -161 : -78;
  const bmr = base + genderOffset;

  const maintenance = bmr * ACTIVITY_MULTIPLIERS[activityLevel];

  const dailyDelta = (Math.max(0, weeklyChangeKg) * KCAL_PER_KG) / 7;
  let daily = maintenance;
  if (goal === "lose") daily = maintenance - dailyDelta;
  else if (goal === "gain") daily = maintenance + dailyDelta;

  // Safety floors
  const minFloor = gender === "female" ? 1200 : 1500;
  daily = Math.max(daily, minFloor);

  // Macro split
  // Protein: 2.0 g/kg (lose), 1.6 g/kg (maintain), 1.8 g/kg (gain)
  const proteinPerKg = goal === "lose" ? 2.0 : goal === "gain" ? 1.8 : 1.6;
  const proteinG = Math.round(proteinPerKg * currentWeightKg);
  // Fat: 25% of calories
  const fatG = Math.round((daily * 0.25) / 9);
  // Carbs: remainder
  const remainingKcal = daily - (proteinG * 4 + fatG * 9);
  const carbsG = Math.max(0, Math.round(remainingKcal / 4));

  return {
    bmr: Math.round(bmr),
    maintenanceCalories: Math.round(maintenance),
    dailyCalories: Math.round(daily),
    proteinG,
    fatG,
    carbsG,
  };
}

export const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; description: string; multiplier: string }[] = [
  { value: "sedentary", label: "Sedentary", description: "Desk job, little movement", multiplier: "1.2x" },
  { value: "light", label: "Lightly active", description: "Light walking, 1–2 sessions / week", multiplier: "1.375x" },
  { value: "moderate", label: "Moderately active", description: "Training 3–5 times per week", multiplier: "1.55x" },
  { value: "very_active", label: "Very active", description: "Daily training, physical job", multiplier: "1.725x" },
  { value: "athlete", label: "Athlete", description: "Twice-a-day or competitive training", multiplier: "1.9x" },
];
