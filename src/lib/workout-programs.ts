import type { Exercise } from "./workout.functions";

export type ProgramDay = {
  name: string;
  day?: string;
  focus: string;
  exercises: Exercise[];
};

export type Program = {
  id: string;
  name: string;
  short: string;
  level: "Beginner" | "Gemiddeld" | "Gevorderd";
  daysPerWeek: number;
  description: string;
  goal: string;
  accent: string; // tailwind gradient classes
  days: ProgramDay[];
};

const ex = (
  name: string,
  sets: number,
  reps: string,
  restSec = 90,
  suggestedWeight = "",
): Exercise => ({ name, sets, reps, restSec, suggestedWeight });

export const PROGRAMS: Program[] = [
  {
    id: "ppl-6",
    name: "Push / Pull / Legs",
    short: "PPL",
    level: "Gemiddeld",
    daysPerWeek: 6,
    goal: "Hypertrofie",
    description: "Klassiek 6-daags split. Elke spiergroep 2× per week voor maximale groei.",
    accent: "from-rose-500/30 to-orange-500/20",
    days: [
      {
        name: "PPL · Push A",
        day: "Maandag",
        focus: "Borst, schouders, triceps",
        exercises: [
          ex("Bench press", 4, "6-8", 120),
          ex("Incline dumbbell press", 3, "8-10", 90),
          ex("Seated shoulder press", 3, "8-10", 90),
          ex("Lateral raise", 3, "12-15", 60),
          ex("Triceps pushdown", 3, "10-12", 60),
          ex("Overhead triceps extension", 3, "10-12", 60),
        ],
      },
      {
        name: "PPL · Pull A",
        day: "Dinsdag",
        focus: "Rug, biceps",
        exercises: [
          ex("Deadlift", 3, "5", 180),
          ex("Pull-up", 4, "6-10", 120),
          ex("Barbell row", 3, "8-10", 90),
          ex("Face pull", 3, "12-15", 60),
          ex("Barbell curl", 3, "8-10", 60),
          ex("Hammer curl", 3, "10-12", 60),
        ],
      },
      {
        name: "PPL · Legs A",
        day: "Woensdag",
        focus: "Benen, billen",
        exercises: [
          ex("Squat", 4, "6-8", 150),
          ex("Romanian deadlift", 3, "8-10", 120),
          ex("Leg press", 3, "10-12", 90),
          ex("Leg curl", 3, "10-12", 60),
          ex("Calf raise", 4, "12-15", 45),
        ],
      },
      {
        name: "PPL · Push B",
        day: "Donderdag",
        focus: "Schouders, borst, triceps",
        exercises: [
          ex("Overhead press", 4, "6-8", 120),
          ex("Flat dumbbell press", 3, "8-10", 90),
          ex("Cable fly", 3, "12-15", 60),
          ex("Lateral raise", 4, "12-15", 60),
          ex("Skullcrusher", 3, "8-10", 75),
          ex("Triceps rope pushdown", 3, "10-12", 60),
        ],
      },
      {
        name: "PPL · Pull B",
        day: "Vrijdag",
        focus: "Rug, biceps",
        exercises: [
          ex("Lat pulldown", 4, "8-10", 90),
          ex("Seated cable row", 3, "10-12", 90),
          ex("T-bar row", 3, "8-10", 90),
          ex("Reverse fly", 3, "12-15", 60),
          ex("Incline dumbbell curl", 3, "10-12", 60),
          ex("Preacher curl", 3, "10-12", 60),
        ],
      },
      {
        name: "PPL · Legs B",
        day: "Zaterdag",
        focus: "Quads, hamstrings, billen",
        exercises: [
          ex("Front squat", 4, "6-8", 150),
          ex("Hip thrust", 3, "8-10", 120),
          ex("Walking lunge", 3, "12", 90),
          ex("Leg extension", 3, "12-15", 60),
          ex("Seated calf raise", 4, "12-15", 45),
          ex("Hanging leg raise", 3, "10-15", 60),
        ],
      },
    ],
  },
  {
    id: "full-body-3",
    name: "Full Body 3×",
    short: "Full Body",
    level: "Beginner",
    daysPerWeek: 3,
    goal: "Kracht & spiermassa",
    description: "Perfect voor beginners of drukke schema's. 3 sessies per week, hele lichaam.",
    accent: "from-emerald-500/30 to-teal-500/20",
    days: [
      {
        name: "Full Body · A",
        day: "Maandag",
        focus: "Hele lichaam",
        exercises: [
          ex("Squat", 3, "8", 120),
          ex("Bench press", 3, "8", 120),
          ex("Barbell row", 3, "8", 90),
          ex("Overhead press", 3, "10", 90),
          ex("Romanian deadlift", 3, "10", 90),
          ex("Plank", 3, "45s", 45),
        ],
      },
      {
        name: "Full Body · B",
        day: "Woensdag",
        focus: "Hele lichaam",
        exercises: [
          ex("Deadlift", 3, "5", 180),
          ex("Incline dumbbell press", 3, "10", 90),
          ex("Lat pulldown", 3, "10", 90),
          ex("Lunge", 3, "10", 90),
          ex("Lateral raise", 3, "12", 60),
          ex("Hanging knee raise", 3, "12", 60),
        ],
      },
      {
        name: "Full Body · C",
        day: "Vrijdag",
        focus: "Hele lichaam",
        exercises: [
          ex("Front squat", 3, "8", 120),
          ex("Dumbbell bench press", 3, "10", 90),
          ex("Pull-up", 3, "AMRAP", 120),
          ex("Hip thrust", 3, "10", 90),
          ex("Face pull", 3, "15", 60),
          ex("Biceps curl", 3, "12", 60),
        ],
      },
    ],
  },
  {
    id: "upper-lower-4",
    name: "Upper / Lower",
    short: "Upper/Lower",
    level: "Gemiddeld",
    daysPerWeek: 4,
    goal: "Kracht & hypertrofie",
    description: "4-daags split met goede balans tussen volume en herstel. Elke spiergroep 2× per week.",
    accent: "from-indigo-500/30 to-violet-500/20",
    days: [
      {
        name: "Upper · A",
        day: "Maandag",
        focus: "Bovenlichaam — kracht",
        exercises: [
          ex("Bench press", 4, "5-6", 150),
          ex("Barbell row", 4, "5-6", 150),
          ex("Overhead press", 3, "8", 120),
          ex("Pull-up", 3, "8", 120),
          ex("Barbell curl", 3, "8-10", 60),
          ex("Skullcrusher", 3, "8-10", 60),
        ],
      },
      {
        name: "Lower · A",
        day: "Dinsdag",
        focus: "Onderlichaam — kracht",
        exercises: [
          ex("Squat", 4, "5-6", 180),
          ex("Romanian deadlift", 3, "8", 120),
          ex("Leg press", 3, "10", 90),
          ex("Leg curl", 3, "10", 60),
          ex("Calf raise", 4, "12", 45),
          ex("Hanging leg raise", 3, "12", 60),
        ],
      },
      {
        name: "Upper · B",
        day: "Donderdag",
        focus: "Bovenlichaam — volume",
        exercises: [
          ex("Incline dumbbell press", 4, "8-10", 90),
          ex("Lat pulldown", 4, "8-10", 90),
          ex("Seated dumbbell press", 3, "10", 90),
          ex("Seated cable row", 3, "10-12", 90),
          ex("Lateral raise", 3, "12-15", 60),
          ex("Triceps pushdown", 3, "10-12", 60),
        ],
      },
      {
        name: "Lower · B",
        day: "Vrijdag",
        focus: "Onderlichaam — volume",
        exercises: [
          ex("Front squat", 3, "8-10", 120),
          ex("Hip thrust", 4, "10", 120),
          ex("Walking lunge", 3, "12", 90),
          ex("Leg extension", 3, "12-15", 60),
          ex("Seated calf raise", 4, "12-15", 45),
          ex("Cable crunch", 3, "15", 60),
        ],
      },
    ],
  },
  {
    id: "strong-5x5",
    name: "5×5 Strength",
    short: "5×5",
    level: "Beginner",
    daysPerWeek: 3,
    goal: "Maximale kracht",
    description: "Simpel en bewezen. 5 sets van 5 reps op de grote compound lifts. Elke sessie zwaarder.",
    accent: "from-amber-500/30 to-yellow-500/20",
    days: [
      {
        name: "5×5 · Workout A",
        day: "Maandag",
        focus: "Squat + Bench + Row",
        exercises: [
          ex("Squat", 5, "5", 180),
          ex("Bench press", 5, "5", 180),
          ex("Barbell row", 5, "5", 150),
        ],
      },
      {
        name: "5×5 · Workout B",
        day: "Woensdag",
        focus: "Squat + OHP + Deadlift",
        exercises: [
          ex("Squat", 5, "5", 180),
          ex("Overhead press", 5, "5", 180),
          ex("Deadlift", 1, "5", 240),
        ],
      },
      {
        name: "5×5 · Workout A",
        day: "Vrijdag",
        focus: "Squat + Bench + Row",
        exercises: [
          ex("Squat", 5, "5", 180),
          ex("Bench press", 5, "5", 180),
          ex("Barbell row", 5, "5", 150),
        ],
      },
    ],
  },
];
