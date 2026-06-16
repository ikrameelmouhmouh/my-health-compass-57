// Curated gym exercise library.
// - Every exercise has gender-specific AI-rendered 3D-anatomy frames
//   (male + female, start + end position) stored in src/assets/exercises/.

import type { AppGender } from "@/lib/gender";

// ===== AI-rendered 3D anatomy frames (male + female) =====
// Legs
import wlpM0 from "@/assets/exercises/wide-leg-press-male-0.jpg";
import wlpM1 from "@/assets/exercises/wide-leg-press-male-1.jpg";
import wlpF0 from "@/assets/exercises/wide-leg-press-female-0.jpg";
import wlpF1 from "@/assets/exercises/wide-leg-press-female-1.jpg";
import sqM0 from "@/assets/exercises/barbell-squat-male-0.jpg";
import sqM1 from "@/assets/exercises/barbell-squat-male-1.jpg";
import sqF0 from "@/assets/exercises/barbell-squat-female-0.jpg";
import sqF1 from "@/assets/exercises/barbell-squat-female-1.jpg";
import rdlM0 from "@/assets/exercises/romanian-deadlift-male-0.jpg";
import rdlM1 from "@/assets/exercises/romanian-deadlift-male-1.jpg";
import rdlF0 from "@/assets/exercises/romanian-deadlift-female-0.jpg";
import rdlF1 from "@/assets/exercises/romanian-deadlift-female-1.jpg";
import legExtM0 from "@/assets/exercises/leg-extension-male-0.jpg";
import legExtM1 from "@/assets/exercises/leg-extension-male-1.jpg";
import legExtF0 from "@/assets/exercises/leg-extension-female-0.jpg";
import legExtF1 from "@/assets/exercises/leg-extension-female-1.jpg";
import legCurlM0 from "@/assets/exercises/lying-leg-curl-male-0.jpg";
import legCurlM1 from "@/assets/exercises/lying-leg-curl-male-1.jpg";
import legCurlF0 from "@/assets/exercises/lying-leg-curl-female-0.jpg";
import legCurlF1 from "@/assets/exercises/lying-leg-curl-female-1.jpg";
import hipM0 from "@/assets/exercises/hip-thrust-male-0.jpg";
import hipM1 from "@/assets/exercises/hip-thrust-male-1.jpg";
import hipF0 from "@/assets/exercises/hip-thrust-female-0.jpg";
import hipF1 from "@/assets/exercises/hip-thrust-female-1.jpg";
import calfM0 from "@/assets/exercises/calf-raise-male-0.jpg";
import calfM1 from "@/assets/exercises/calf-raise-male-1.jpg";
import calfF0 from "@/assets/exercises/calf-raise-female-0.jpg";
import calfF1 from "@/assets/exercises/calf-raise-female-1.jpg";
// Chest
import benchM0 from "@/assets/exercises/barbell-bench-press-male-0.jpg";
import benchM1 from "@/assets/exercises/barbell-bench-press-male-1.jpg";
import benchF0 from "@/assets/exercises/barbell-bench-press-female-0.jpg";
import benchF1 from "@/assets/exercises/barbell-bench-press-female-1.jpg";
import inclineM0 from "@/assets/exercises/incline-db-press-male-0.jpg";
import inclineM1 from "@/assets/exercises/incline-db-press-male-1.jpg";
import inclineF0 from "@/assets/exercises/incline-db-press-female-0.jpg";
import inclineF1 from "@/assets/exercises/incline-db-press-female-1.jpg";
import flyM0 from "@/assets/exercises/cable-fly-male-0.jpg";
import flyM1 from "@/assets/exercises/cable-fly-male-1.jpg";
import flyF0 from "@/assets/exercises/cable-fly-female-0.jpg";
import flyF1 from "@/assets/exercises/cable-fly-female-1.jpg";
import puM0 from "@/assets/exercises/push-up-male-0.jpg";
import puM1 from "@/assets/exercises/push-up-male-1.jpg";
import puF0 from "@/assets/exercises/push-up-female-0.jpg";
import puF1 from "@/assets/exercises/push-up-female-1.jpg";
// Back
import latM0 from "@/assets/exercises/lat-pulldown-male-0.jpg";
import latM1 from "@/assets/exercises/lat-pulldown-male-1.jpg";
import latF0 from "@/assets/exercises/lat-pulldown-female-0.jpg";
import latF1 from "@/assets/exercises/lat-pulldown-female-1.jpg";
import rowM0 from "@/assets/exercises/barbell-row-male-0.jpg";
import rowM1 from "@/assets/exercises/barbell-row-male-1.jpg";
import rowF0 from "@/assets/exercises/barbell-row-female-0.jpg";
import rowF1 from "@/assets/exercises/barbell-row-female-1.jpg";
import scrM0 from "@/assets/exercises/seated-cable-row-male-0.jpg";
import scrM1 from "@/assets/exercises/seated-cable-row-male-1.jpg";
import scrF0 from "@/assets/exercises/seated-cable-row-female-0.jpg";
import scrF1 from "@/assets/exercises/seated-cable-row-female-1.jpg";
import pullM0 from "@/assets/exercises/pull-up-male-0.jpg";
import pullM1 from "@/assets/exercises/pull-up-male-1.jpg";
import pullF0 from "@/assets/exercises/pull-up-female-0.jpg";
import pullF1 from "@/assets/exercises/pull-up-female-1.jpg";
import dlM0 from "@/assets/exercises/deadlift-male-0.jpg";
import dlM1 from "@/assets/exercises/deadlift-male-1.jpg";
import dlF0 from "@/assets/exercises/deadlift-female-0.jpg";
import dlF1 from "@/assets/exercises/deadlift-female-1.jpg";
// Shoulders
import ohpM0 from "@/assets/exercises/overhead-press-male-0.jpg";
import ohpM1 from "@/assets/exercises/overhead-press-male-1.jpg";
import ohpF0 from "@/assets/exercises/overhead-press-female-0.jpg";
import ohpF1 from "@/assets/exercises/overhead-press-female-1.jpg";
import lrM0 from "@/assets/exercises/lateral-raise-male-0.jpg";
import lrM1 from "@/assets/exercises/lateral-raise-male-1.jpg";
import lrF0 from "@/assets/exercises/lateral-raise-female-0.jpg";
import lrF1 from "@/assets/exercises/lateral-raise-female-1.jpg";
import fpM0 from "@/assets/exercises/face-pull-male-0.jpg";
import fpM1 from "@/assets/exercises/face-pull-male-1.jpg";
import fpF0 from "@/assets/exercises/face-pull-female-0.jpg";
import fpF1 from "@/assets/exercises/face-pull-female-1.jpg";
// Arms
import bcM0 from "@/assets/exercises/barbell-curl-male-0.jpg";
import bcM1 from "@/assets/exercises/barbell-curl-male-1.jpg";
import bcF0 from "@/assets/exercises/barbell-curl-female-0.jpg";
import bcF1 from "@/assets/exercises/barbell-curl-female-1.jpg";
import hcM0 from "@/assets/exercises/hammer-curl-male-0.jpg";
import hcM1 from "@/assets/exercises/hammer-curl-male-1.jpg";
import hcF0 from "@/assets/exercises/hammer-curl-female-0.jpg";
import hcF1 from "@/assets/exercises/hammer-curl-female-1.jpg";
import tpdM0 from "@/assets/exercises/triceps-pushdown-male-0.jpg";
import tpdM1 from "@/assets/exercises/triceps-pushdown-male-1.jpg";
import tpdF0 from "@/assets/exercises/triceps-pushdown-female-0.jpg";
import tpdF1 from "@/assets/exercises/triceps-pushdown-female-1.jpg";
import scM0 from "@/assets/exercises/skull-crusher-male-0.jpg";
import scM1 from "@/assets/exercises/skull-crusher-male-1.jpg";
import scF0 from "@/assets/exercises/skull-crusher-female-0.jpg";
import scF1 from "@/assets/exercises/skull-crusher-female-1.jpg";
// Core
import plankM0 from "@/assets/exercises/plank-male-0.jpg";
import plankM1 from "@/assets/exercises/plank-male-1.jpg";
import plankF0 from "@/assets/exercises/plank-female-0.jpg";
import plankF1 from "@/assets/exercises/plank-female-1.jpg";
import hlrM0 from "@/assets/exercises/hanging-leg-raise-male-0.jpg";
import hlrM1 from "@/assets/exercises/hanging-leg-raise-male-1.jpg";
import hlrF0 from "@/assets/exercises/hanging-leg-raise-female-0.jpg";
import hlrF1 from "@/assets/exercises/hanging-leg-raise-female-1.jpg";
import ccM0 from "@/assets/exercises/cable-crunch-male-0.jpg";
import ccM1 from "@/assets/exercises/cable-crunch-male-1.jpg";
import ccF0 from "@/assets/exercises/cable-crunch-female-0.jpg";
import ccF1 from "@/assets/exercises/cable-crunch-female-1.jpg";

export type Equipment =
  | "Machine"
  | "Barbell"
  | "Dumbbell"
  | "Cable"
  | "Bodyweight"
  | "Kettlebell"
  | "Band"
  | "Smith Machine"
  | "TRX"
  | "Landmine"
  | "Assisted"
  | "EZ Bar"
  | "Other";

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

export type ExerciseVariants = Partial<Record<AppGender, string[]>>;

export type LibraryExercise = {
  id: string;
  name: string;
  equipment: Equipment;
  primary: MuscleGroup[];
  secondary: MuscleGroup[];
  image: string;
  /** Default frames that, when looped, form a short video preview. */
  frames?: string[];
  /** Gender-specific 3D-anatomy frames. When present, override `frames`. */
  variants?: ExerciseVariants;
  steps: string[];
};

const variants = (m0: string, m1: string, f0: string, f1: string): ExerciseVariants => ({
  male: [m0, m1],
  female: [f0, f1],
});

/** Lightweight inline placeholder for exercises without AI-rendered demos yet. */
const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='12' fill='#f1f1f3'/><g fill='none' stroke='#9a9aa3' stroke-width='3' stroke-linecap='round'><circle cx='32' cy='20' r='6'/><path d='M22 46c0-8 4-14 10-14s10 6 10 14'/></g></svg>`,
  );

/** Quick builder for the many catalog-only exercises (no AI demo yet). */
const mk = (
  id: string,
  name: string,
  equipment: Equipment,
  primary: MuscleGroup[],
  secondary: MuscleGroup[] = [],
  steps: string[] = ["Voer de oefening uit met een gecontroleerde, vloeiende beweging."],
): LibraryExercise => ({ id, name, equipment, primary, secondary, image: PLACEHOLDER_IMG, steps });


/** Returns the looping preview frames for an exercise, gender-aware when available. */
export function getExerciseFrames(ex: LibraryExercise, gender?: AppGender): string[] {
  if (gender && ex.variants?.[gender]?.length) return ex.variants[gender] as string[];
  if (ex.variants) {
    const any = ex.variants.male ?? ex.variants.female;
    if (any?.length) return any;
  }
  if (ex.frames && ex.frames.length > 0) return ex.frames;
  return [ex.image];
}

/** Returns true when the exercise has gender-specific AI-rendered demos. */
export function hasGenderVariants(ex: LibraryExercise): boolean {
  return !!(ex.variants?.male?.length || ex.variants?.female?.length);
}

export const EXERCISES: LibraryExercise[] = [
  // ===== LEGS =====
  {
    id: "wide-leg-press",
    name: "Wide Leg Press",
    equipment: "Machine",
    primary: ["Quads"],
    secondary: ["Glutes", "Hamstrings", "Calves"],
    image: wlpM0,
    variants: variants(wlpM0, wlpM1, wlpF0, wlpF1),
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
    image: sqM0,
    variants: variants(sqM0, sqM1, sqF0, sqF1),
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
    image: rdlM0,
    variants: variants(rdlM0, rdlM1, rdlF0, rdlF1),
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
    image: legExtM0,
    variants: variants(legExtM0, legExtM1, legExtF0, legExtF1),
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
    image: legCurlM0,
    variants: variants(legCurlM0, legCurlM1, legCurlF0, legCurlF1),
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
    image: hipM0,
    variants: variants(hipM0, hipM1, hipF0, hipF1),
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
    image: calfM0,
    variants: variants(calfM0, calfM1, calfF0, calfF1),
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
    image: benchM0,
    variants: variants(benchM0, benchM1, benchF0, benchF1),
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
    image: inclineM0,
    variants: variants(inclineM0, inclineM1, inclineF0, inclineF1),
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
    image: flyM0,
    variants: variants(flyM0, flyM1, flyF0, flyF1),
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
    image: puM0,
    variants: variants(puM0, puM1, puF0, puF1),
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
    image: latM0,
    variants: variants(latM0, latM1, latF0, latF1),
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
    image: rowM0,
    variants: variants(rowM0, rowM1, rowF0, rowF1),
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
    image: scrM0,
    variants: variants(scrM0, scrM1, scrF0, scrF1),
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
    image: pullM0,
    variants: variants(pullM0, pullM1, pullF0, pullF1),
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
    image: dlM0,
    variants: variants(dlM0, dlM1, dlF0, dlF1),
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
    image: ohpM0,
    variants: variants(ohpM0, ohpM1, ohpF0, ohpF1),
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
    image: lrM0,
    variants: variants(lrM0, lrM1, lrF0, lrF1),
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
    image: fpM0,
    variants: variants(fpM0, fpM1, fpF0, fpF1),
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
    image: bcM0,
    variants: variants(bcM0, bcM1, bcF0, bcF1),
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
    image: hcM0,
    variants: variants(hcM0, hcM1, hcF0, hcF1),
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
    image: tpdM0,
    variants: variants(tpdM0, tpdM1, tpdF0, tpdF1),
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
    image: scM0,
    variants: variants(scM0, scM1, scF0, scF1),
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
    image: plankM0,
    variants: variants(plankM0, plankM1, plankF0, plankF1),
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
    image: hlrM0,
    variants: variants(hlrM0, hlrM1, hlrF0, hlrF1),
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
    image: ccM0,
    variants: variants(ccM0, ccM1, ccF0, ccF1),
    steps: [
      "Kniel onder een high pulley, touw bij je hoofd.",
      "Crunch naar beneden door je buikspieren aan te spannen.",
      "Kom langzaam terug omhoog.",
    ],
  },

  // ===== EXTRA CATALOG (no AI demo yet — placeholder image) =====
  // Glutes / lower-body extras
  mk("machine-lower-back-extension", "Machine Lower Back Extension", "Machine", ["Back"], ["Glutes"]),
  mk("hip-thrust-machine", "Hip Thrust Machine", "Machine", ["Glutes"], ["Hamstrings"]),
  mk("cable-pull-through", "Cable Pull-through", "Cable", ["Glutes"], ["Hamstrings"]),
  mk("smith-machine-hip-thrust", "Smith Machine Hip Thrust", "Smith Machine", ["Glutes"], ["Hamstrings"]),
  mk("fire-hydrant", "Fire Hydrant", "Bodyweight", ["Glutes"]),
  mk("banded-lateral-walk", "Banded Lateral Walk", "Band", ["Glutes"]),
  mk("frog-pumps", "Frog Pumps", "Bodyweight", ["Glutes"]),
  mk("walking-lunges", "Walking Lunges", "Bodyweight", ["Quads", "Glutes"]),

  // A
  mk("ab-crunch-machine", "Ab Crunch Machine", "Machine", ["Core"]),
  mk("ab-roller", "Ab Roller", "Other", ["Core"]),
  mk("ab-rollout-trx", "Ab Rollout", "TRX", ["Core"]),
  mk("anti-rotation", "Anti Rotation", "Landmine", ["Core"]),
  mk("arm-bar", "Arm Bar", "Kettlebell", ["Shoulders"], ["Core"]),
  mk("arm-circles", "Arm Circles", "Bodyweight", ["Shoulders"]),
  mk("arnold-press", "Arnold Press", "Dumbbell", ["Shoulders"], ["Triceps"]),
  mk("around-the-worlds", "Around the Worlds", "Dumbbell", ["Chest"], ["Shoulders"]),
  mk("assisted-crunch-trx", "Assisted Crunch", "TRX", ["Core"]),
  mk("assisted-pull-up", "Assisted Pull Up", "Assisted", ["Back"], ["Biceps"]),
  mk("assisted-tricep-dip", "Assisted Tricep Dip", "Assisted", ["Triceps"], ["Chest"]),
  mk("archer-row", "Archer Row", "Band", ["Back"]),
  mk("arch-hold", "Arch Hold", "Bodyweight", ["Back"], ["Glutes"]),
  mk("assisted-pull-up-band", "Assisted Pull Up", "Band", ["Back"], ["Biceps"]),
  mk("archer-push-up", "Archer Push Up", "Bodyweight", ["Chest"], ["Triceps"]),
  mk("assault-bike", "Assault Bike", "Bodyweight", ["Full body"]),

  // B
  mk("back-extension", "Back Extension", "Bodyweight", ["Back"], ["Glutes"]),
  mk("back-plank", "Back Plank", "Bodyweight", ["Core"], ["Glutes"]),
  mk("back-row", "Back Row", "Machine", ["Back"]),
  mk("bench-press-cable", "Bench Press", "Cable", ["Chest"], ["Triceps"]),
  mk("bench-press-dumbbell", "Bench Press", "Dumbbell", ["Chest"], ["Triceps", "Shoulders"]),
  mk("bent-over-row-cable", "Bent Over Row", "Cable", ["Back"], ["Biceps"]),
  mk("bicep-curl-band", "Bicep Curl", "Band", ["Biceps"]),
  mk("bicep-curl-cable", "Bicep Curl", "Cable", ["Biceps"]),
  mk("bicep-curl-dumbbell", "Bicep Curl", "Dumbbell", ["Biceps"]),
  mk("bicep-curl-ez", "Bicep Curl", "EZ Bar", ["Biceps"]),
  mk("bicep-curl-trx", "Bicep Curl", "TRX", ["Biceps"]),
  mk("bicycle-crunches", "Bicycle Crunches", "Bodyweight", ["Core"]),
  mk("bird-dog", "Bird Dog", "Bodyweight", ["Core"], ["Back"]),
  mk("body-up", "Body Up", "Bodyweight", ["Chest"], ["Core"]),
  mk("bodyweight-fly", "Bodyweight Fly", "Bodyweight", ["Chest"]),
  mk("bottoms-up-clean", "Bottoms Up Clean", "Kettlebell", ["Shoulders"], ["Core"]),
  mk("box-jump", "Box Jump", "Bodyweight", ["Quads"], ["Glutes", "Calves"]),
  mk("bulgarian-split-squat-band", "Bulgarian Split Squat", "Band", ["Quads"], ["Glutes"]),
  mk("bulgarian-split-squat-barbell", "Bulgarian Split Squat", "Barbell", ["Quads"], ["Glutes"]),
  mk("bulgarian-split-squat-dumbbell", "Bulgarian Split Squat", "Dumbbell", ["Quads"], ["Glutes"]),
  mk("burpee", "Burpee", "Bodyweight", ["Full body"]),
  mk("burpee-trx", "Burpee", "TRX", ["Full body"]),
  mk("butt-blaster", "Butt Blaster", "Machine", ["Glutes"]),
  mk("butt-kicks", "Butt Kicks", "Bodyweight", ["Hamstrings"]),
  mk("butt-up", "Butt Up", "Bodyweight", ["Glutes"], ["Core"]),
  mk("bent-over-lateral-raise-cable", "Bent Over Lateral Raise", "Cable", ["Shoulders"]),
  mk("behind-the-neck-lat-pulldown", "Behind-the-Neck Lat Pulldown", "Cable", ["Back"]),
  mk("band-pull-apart", "Band Pull Apart", "Band", ["Back"], ["Shoulders"]),
  mk("behind-the-back-shrug-barbell", "Behind-the-Back Shrug", "Barbell", ["Back"], ["Shoulders"]),
  mk("behind-the-neck-shoulder-press-smith", "Behind-the-Neck Shoulder Press", "Smith Machine", ["Shoulders"], ["Triceps"]),
  mk("behind-the-neck-shrug-smith", "Behind-the-Neck Shrug", "Smith Machine", ["Back"], ["Shoulders"]),
  mk("behind-the-back-wrist-curl", "Behind-the-Back Wrist Curl", "Barbell", ["Biceps"]),
  mk("bent-over-deltoid-raise-dumbbell", "Bent Over Deltoid Raise", "Dumbbell", ["Shoulders"], ["Back"]),
  mk("box-push-up", "Box Push Up", "Bodyweight", ["Chest"], ["Triceps"]),

  // C
  mk("close-bicep-curl-barbell", "Close Bicep Curl", "Barbell", ["Biceps"]),
  mk("close-bicep-curl-ez", "Close Bicep Curl", "EZ Bar", ["Biceps"]),
  mk("core-rotation", "Core Rotation", "Cable", ["Core"]),
  mk("cable-crossover", "Cable Crossover", "Cable", ["Chest"]),
  mk("cable-pullover", "Cable Pullover", "Cable", ["Back"]),
  mk("cable-row", "Cable Row", "Cable", ["Back"], ["Biceps"]),
  mk("calf-press-band", "Calf Press", "Band", ["Calves"]),
  mk("calf-press-machine", "Calf Press Machine", "Machine", ["Calves"]),
  mk("calf-raise-band", "Calf Raise", "Band", ["Calves"]),
  mk("calf-raises-dumbbell", "Calf Raises", "Dumbbell", ["Calves"]),
  mk("calf-raises-machine", "Calf Raises", "Machine", ["Calves"]),
  mk("chair-squat", "Chair Squat", "Bodyweight", ["Quads"], ["Glutes"]),
  mk("chest-dip", "Chest Dip", "Bodyweight", ["Chest"], ["Triceps"]),
  mk("chest-fly-dumbbell", "Chest Fly", "Dumbbell", ["Chest"]),
  mk("chest-fly-machine", "Chest Fly", "Machine", ["Chest"]),
  mk("chest-press-dumbbell", "Chest Press", "Dumbbell", ["Chest"], ["Triceps"]),
  mk("chest-press-band", "Chest Press", "Band", ["Chest"], ["Triceps"]),
];

export const EQUIPMENT_FILTERS: ("All" | Equipment)[] = [
  "All",
  "Machine",
  "Barbell",
  "Dumbbell",
  "Cable",
  "Bodyweight",
  "Kettlebell",
  "Band",
  "Smith Machine",
  "TRX",
  "Landmine",
  "Assisted",
  "EZ Bar",
  "Other",
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
