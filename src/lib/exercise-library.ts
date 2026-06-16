// Curated gym exercise library. Images are hosted by the open-source
// free-exercise-db project (public-domain GIFs/JPEGs).
// Source: https://github.com/yuhonas/free-exercise-db

export type Equipment =
  | "Machine"
  | "Barbell"
  | "Dumbbell"
  | "Cable"
  | "Bodyweight"
  | "Kettlebell"
  | "Band";

export type MuscleGroup =
  | "Chest"
  | "Back"
  | "Shoulders"
  | "Biceps"
  | "Triceps"
  | "Quads"
  | "Hamstrings"
  | "Glutes"
  | "Calves"
  | "Core"
  | "Full body";

export type LibraryExercise = {
  id: string;
  name: string;
  equipment: Equipment;
  primary: MuscleGroup[];
  secondary: MuscleGroup[];
  image: string;
  /** Frames that, when looped, form a short video preview of the movement. */
  frames?: string[];
  steps: string[];
};

const BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";
const IMG = (slug: string) => `${BASE}/${slug}/images/0.jpg`;

/** Returns the looping preview frames for an exercise (animated GIF-style). */
export function getExerciseFrames(ex: LibraryExercise): string[] {
  if (ex.frames && ex.frames.length > 0) return ex.frames;
  // free-exercise-db hosts two frames per exercise (0.jpg / 1.jpg) — perfect for a loop.
  const m = ex.image.match(/\/exercises\/([^/]+)\/images\//);
  if (!m) return [ex.image];
  const slug = m[1];
  return [`${BASE}/${slug}/images/0.jpg`, `${BASE}/${slug}/images/1.jpg`];
}

export const EXERCISES: LibraryExercise[] = [
  // ===== LEGS =====
  {
    id: "wide-leg-press",
    name: "Wide Leg Press",
    equipment: "Machine",
    primary: ["Quads"],
    secondary: ["Glutes", "Hamstrings", "Calves"],
    image: IMG("Leg_Press"),
    steps: [
      "Ga zitten in de machine met je voeten breed op het platform.",
      "Duw het gewicht weg tot je benen bijna gestrekt zijn (knie licht gebogen).",
      "Laat het gewicht langzaam zakken tot 90°.",
      "Houd je rug tegen het kussen en spier aan in de quads.",
    ],
  },
  {
    id: "barbell-squat",
    name: "Barbell Back Squat",
    equipment: "Barbell",
    primary: ["Quads", "Glutes"],
    secondary: ["Hamstrings", "Core"],
    image: IMG("Barbell_Squat"),
    steps: [
      "Plaats de barbell op je bovenrug, voeten op schouderbreedte.",
      "Zak gecontroleerd tot je dijen parallel zijn aan de grond.",
      "Duw door je hielen omhoog naar de startpositie.",
    ],
  },
  {
    id: "romanian-deadlift",
    name: "Romanian Deadlift",
    equipment: "Barbell",
    primary: ["Hamstrings", "Glutes"],
    secondary: ["Back"],
    image: IMG("Romanian_Deadlift"),
    steps: [
      "Houd de barbell voor je dijen, lichte knie buiging.",
      "Scharnier vanuit de heupen naar voren, rug recht.",
      "Voel de rek in je hamstrings en kom terug omhoog.",
    ],
  },
  {
    id: "leg-extension",
    name: "Leg Extension",
    equipment: "Machine",
    primary: ["Quads"],
    secondary: [],
    image: IMG("Leg_Extensions"),
    steps: [
      "Stel de machine in zodat je knieën gelijk staan met het draaipunt.",
      "Strek je benen volledig en knijp 1 seconde in de top.",
      "Laat gecontroleerd zakken.",
    ],
  },
  {
    id: "lying-leg-curl",
    name: "Lying Leg Curl",
    equipment: "Machine",
    primary: ["Hamstrings"],
    secondary: ["Calves"],
    image: IMG("Lying_Leg_Curls"),
    steps: [
      "Ga op je buik liggen, hielen tegen de roller.",
      "Buig je knieën en breng de hielen richting je billen.",
      "Laat langzaam terug zakken.",
    ],
  },
  {
    id: "hip-thrust",
    name: "Barbell Hip Thrust",
    equipment: "Barbell",
    primary: ["Glutes"],
    secondary: ["Hamstrings"],
    image: IMG("Barbell_Hip_Thrust"),
    steps: [
      "Schouders op een bank, barbell over je heupen.",
      "Duw je heupen omhoog tot je lichaam een rechte lijn vormt.",
      "Knijp je billen aan in de top.",
    ],
  },
  {
    id: "calf-raise",
    name: "Standing Calf Raise",
    equipment: "Machine",
    primary: ["Calves"],
    secondary: [],
    image: IMG("Standing_Calf_Raises"),
    steps: [
      "Plaats je voorvoeten op het platform, hielen vrij.",
      "Druk zo hoog mogelijk op je tenen.",
      "Laat gecontroleerd zakken voor maximale rek.",
    ],
  },

  // ===== CHEST =====
  {
    id: "barbell-bench-press",
    name: "Barbell Bench Press",
    equipment: "Barbell",
    primary: ["Chest"],
    secondary: ["Triceps", "Shoulders"],
    image: IMG("Barbell_Bench_Press_-_Medium_Grip"),
    steps: [
      "Lig plat op de bank, handen iets breder dan schouderbreedte.",
      "Laat de stang gecontroleerd zakken tot je borst.",
      "Druk explosief omhoog.",
    ],
  },
  {
    id: "incline-db-press",
    name: "Incline Dumbbell Press",
    equipment: "Dumbbell",
    primary: ["Chest"],
    secondary: ["Shoulders", "Triceps"],
    image: IMG("Dumbbell_Bench_Press"),
    steps: [
      "Stel de bank in op 30-45°.",
      "Druk de dumbbells boven je borst omhoog.",
      "Laat ze gecontroleerd zakken tot borstniveau.",
    ],
  },
  {
    id: "cable-fly",
    name: "Cable Chest Fly",
    equipment: "Cable",
    primary: ["Chest"],
    secondary: [],
    image: IMG("Cable_Crossover"),
    steps: [
      "Sta tussen twee high pulleys, lichte voorover buiging.",
      "Breng je handen samen voor je borst in een boog.",
      "Houd de spanning vast en ga gecontroleerd terug.",
    ],
  },
  {
    id: "push-up",
    name: "Push Up",
    equipment: "Bodyweight",
    primary: ["Chest"],
    secondary: ["Triceps", "Core"],
    image: IMG("Pushups"),
    steps: [
      "Plank-positie met handen op schouderbreedte.",
      "Zak tot je borst de grond bijna raakt.",
      "Duw jezelf weer omhoog.",
    ],
  },

  // ===== BACK =====
  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    equipment: "Machine",
    primary: ["Back"],
    secondary: ["Biceps"],
    image: IMG("Wide-Grip_Lat_Pulldown"),
    steps: [
      "Pak de stang breder dan schouderbreedte.",
      "Trek de stang naar je bovenborst, ellebogen omlaag.",
      "Laat gecontroleerd terug omhoog gaan.",
    ],
  },
  {
    id: "barbell-row",
    name: "Barbell Bent Over Row",
    equipment: "Barbell",
    primary: ["Back"],
    secondary: ["Biceps"],
    image: IMG("Bent_Over_Barbell_Row"),
    steps: [
      "Heupscharnier, rug recht, stang voor je benen.",
      "Trek de stang naar je onderborst/bovenbuik.",
      "Knijp je schouderbladen samen en laat zakken.",
    ],
  },
  {
    id: "seated-cable-row",
    name: "Seated Cable Row",
    equipment: "Cable",
    primary: ["Back"],
    secondary: ["Biceps"],
    image: IMG("Seated_Cable_Rows"),
    steps: [
      "Zit rechtop, lichte knie buiging, grip in je handen.",
      "Trek de handvatten naar je buik.",
      "Knijp je schouderbladen samen.",
    ],
  },
  {
    id: "pull-up",
    name: "Pull Up",
    equipment: "Bodyweight",
    primary: ["Back"],
    secondary: ["Biceps"],
    image: IMG("Pullups"),
    steps: [
      "Hang aan de stang, handen breder dan schouders.",
      "Trek jezelf op tot je kin boven de stang is.",
      "Laat volledig gecontroleerd zakken.",
    ],
  },
  {
    id: "deadlift",
    name: "Conventional Deadlift",
    equipment: "Barbell",
    primary: ["Back", "Glutes"],
    secondary: ["Hamstrings", "Core"],
    image: IMG("Barbell_Deadlift"),
    steps: [
      "Voeten heupbreedte, stang boven het midden van je voet.",
      "Pak de stang, rug recht, borst omhoog.",
      "Til de stang op door heupen en knieën te strekken.",
    ],
  },

  // ===== SHOULDERS =====
  {
    id: "overhead-press",
    name: "Overhead Press",
    equipment: "Barbell",
    primary: ["Shoulders"],
    secondary: ["Triceps", "Core"],
    image: IMG("Standing_Military_Press"),
    steps: [
      "Stang op schouderhoogte, voeten op heupbreedte.",
      "Druk de stang recht omhoog tot armen gestrekt.",
      "Laat gecontroleerd zakken naar schouders.",
    ],
  },
  {
    id: "lateral-raise",
    name: "Dumbbell Lateral Raise",
    equipment: "Dumbbell",
    primary: ["Shoulders"],
    secondary: [],
    image: IMG("Side_Lateral_Raise"),
    steps: [
      "Dumbbells naast je lichaam, lichte buiging in ellebogen.",
      "Til zijwaarts tot schouderhoogte.",
      "Laat langzaam zakken.",
    ],
  },
  {
    id: "face-pull",
    name: "Face Pull",
    equipment: "Cable",
    primary: ["Shoulders", "Back"],
    secondary: [],
    image: IMG("Face_Pull"),
    steps: [
      "Touw aan een high pulley, pak met overhand.",
      "Trek het touw naar je gezicht, ellebogen hoog.",
      "Knijp je achterste deltoids aan.",
    ],
  },

  // ===== ARMS =====
  {
    id: "barbell-curl",
    name: "Barbell Curl",
    equipment: "Barbell",
    primary: ["Biceps"],
    secondary: [],
    image: IMG("Barbell_Curl"),
    steps: [
      "Stang met ondergreep, ellebogen tegen je lichaam.",
      "Krul de stang omhoog naar je schouders.",
      "Laat gecontroleerd zakken.",
    ],
  },
  {
    id: "hammer-curl",
    name: "Hammer Curl",
    equipment: "Dumbbell",
    primary: ["Biceps"],
    secondary: [],
    image: IMG("Hammer_Curls"),
    steps: [
      "Dumbbells naast je lichaam, palmen naar binnen.",
      "Krul omhoog zonder pols te draaien.",
      "Laat zakken.",
    ],
  },
  {
    id: "triceps-pushdown",
    name: "Triceps Pushdown",
    equipment: "Cable",
    primary: ["Triceps"],
    secondary: [],
    image: IMG("Triceps_Pushdown"),
    steps: [
      "Pak een rechte stang of touw aan een high pulley.",
      "Houd je ellebogen tegen je lichaam.",
      "Druk naar beneden tot armen gestrekt zijn.",
    ],
  },
  {
    id: "skull-crusher",
    name: "Skull Crusher",
    equipment: "Barbell",
    primary: ["Triceps"],
    secondary: [],
    image: IMG("EZ-Bar_Skullcrusher"),
    steps: [
      "Lig op een bank, EZ-bar boven je borst.",
      "Buig alleen je ellebogen, laat de stang naar je voorhoofd zakken.",
      "Strek je armen weer.",
    ],
  },

  // ===== CORE =====
  {
    id: "plank",
    name: "Plank",
    equipment: "Bodyweight",
    primary: ["Core"],
    secondary: [],
    image: IMG("Plank"),
    steps: [
      "Onderarmen op de grond, lichaam recht.",
      "Span je buik en billen aan.",
      "Houd vast voor de gewenste tijd.",
    ],
  },
  {
    id: "hanging-leg-raise",
    name: "Hanging Leg Raise",
    equipment: "Bodyweight",
    primary: ["Core"],
    secondary: [],
    image: IMG("Hanging_Leg_Raise"),
    steps: [
      "Hang aan een pull-up stang.",
      "Til je benen gestrekt naar boven tot 90°.",
      "Laat gecontroleerd zakken.",
    ],
  },
  {
    id: "cable-crunch",
    name: "Cable Crunch",
    equipment: "Cable",
    primary: ["Core"],
    secondary: [],
    image: IMG("Kneeling_Cable_Crunch_With_Alternating_Oblique_Twists"),
    steps: [
      "Kniel onder een high pulley, touw bij je hoofd.",
      "Crunch naar beneden door je buikspieren aan te spannen.",
      "Kom langzaam terug omhoog.",
    ],
  },
];

export const EQUIPMENT_FILTERS: ("All" | Equipment)[] = [
  "All",
  "Machine",
  "Barbell",
  "Dumbbell",
  "Cable",
  "Bodyweight",
];

export const MUSCLE_FILTERS: ("All" | MuscleGroup)[] = [
  "All",
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Core",
];
