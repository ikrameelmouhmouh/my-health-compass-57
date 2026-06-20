// Curated gym exercise library.
// - Every featured exercise has 2 AI-rendered neutral 3D-anatomy frames
//   (start + end position) stored in src/assets/exercises/.
// - The mannequin is androgynous so the same image works for everyone.

import type { AppGender } from "@/lib/gender";

// ===== AI-rendered 3D anatomy frames (neutral mannequin) =====
// Legs
import wlp0 from "@/assets/exercises/wide-leg-press-0.jpg";
import wlp1 from "@/assets/exercises/wide-leg-press-1.jpg";
import sq0 from "@/assets/exercises/barbell-squat-0.jpg";
import sq1 from "@/assets/exercises/barbell-squat-1.jpg";
import rdl0 from "@/assets/exercises/romanian-deadlift-0.jpg";
import rdl1 from "@/assets/exercises/romanian-deadlift-1.jpg";
import legExt0 from "@/assets/exercises/leg-extension-0.jpg";
import legExt1 from "@/assets/exercises/leg-extension-1.jpg";
import legCurl0 from "@/assets/exercises/lying-leg-curl-0.jpg";
import legCurl1 from "@/assets/exercises/lying-leg-curl-1.jpg";
import hip0 from "@/assets/exercises/hip-thrust-0.jpg";
import hip1 from "@/assets/exercises/hip-thrust-1.jpg";
import calf0 from "@/assets/exercises/calf-raise-0.jpg";
import calf1 from "@/assets/exercises/calf-raise-1.jpg";
// Chest
import bench0 from "@/assets/exercises/barbell-bench-press-0.jpg";
import bench1 from "@/assets/exercises/barbell-bench-press-1.jpg";
import incline0 from "@/assets/exercises/incline-db-press-0.jpg";
import incline1 from "@/assets/exercises/incline-db-press-1.jpg";
import fly0 from "@/assets/exercises/cable-fly-0.jpg";
import fly1 from "@/assets/exercises/cable-fly-1.jpg";
import pu0 from "@/assets/exercises/push-up-0.jpg";
import pu1 from "@/assets/exercises/push-up-1.jpg";
// Back
import lat0 from "@/assets/exercises/lat-pulldown-0.jpg";
import lat1 from "@/assets/exercises/lat-pulldown-1.jpg";
import row0 from "@/assets/exercises/barbell-row-0.jpg";
import row1 from "@/assets/exercises/barbell-row-1.jpg";
import scr0 from "@/assets/exercises/seated-cable-row-0.jpg";
import scr1 from "@/assets/exercises/seated-cable-row-1.jpg";
import pull0 from "@/assets/exercises/pull-up-0.jpg";
import pull1 from "@/assets/exercises/pull-up-1.jpg";
import dl0 from "@/assets/exercises/deadlift-0.jpg";
import dl1 from "@/assets/exercises/deadlift-1.jpg";
// Shoulders
import ohp0 from "@/assets/exercises/overhead-press-0.jpg";
import ohp1 from "@/assets/exercises/overhead-press-1.jpg";
import lr0 from "@/assets/exercises/lateral-raise-0.jpg";
import lr1 from "@/assets/exercises/lateral-raise-1.jpg";
import fp0 from "@/assets/exercises/face-pull-0.jpg";
import fp1 from "@/assets/exercises/face-pull-1.jpg";
// Arms
import bc0 from "@/assets/exercises/barbell-curl-0.jpg";
import bc1 from "@/assets/exercises/barbell-curl-1.jpg";
import hc0 from "@/assets/exercises/hammer-curl-0.jpg";
import hc1 from "@/assets/exercises/hammer-curl-1.jpg";
import tpd0 from "@/assets/exercises/triceps-pushdown-0.jpg";
import tpd1 from "@/assets/exercises/triceps-pushdown-1.jpg";
import sc0 from "@/assets/exercises/skull-crusher-0.jpg";
import sc1 from "@/assets/exercises/skull-crusher-1.jpg";
// Core
import plank0 from "@/assets/exercises/plank-0.jpg";
import plank1 from "@/assets/exercises/plank-1.jpg";
import hlr0 from "@/assets/exercises/hanging-leg-raise-0.jpg";
import hlr1 from "@/assets/exercises/hanging-leg-raise-1.jpg";
import cc0 from "@/assets/exercises/cable-crunch-0.jpg";
import cc1 from "@/assets/exercises/cable-crunch-1.jpg";

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

export type LibraryExercise = {
  id: string;
  name: string;
  equipment: Equipment;
  primary: MuscleGroup[];
  secondary: MuscleGroup[];
  image: string;
  /** Default frames that, when looped, form a short video preview. */
  frames?: string[];
  steps: string[];
};

const pair = (a: string, b: string): string[] => [a, b];

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


/**
 * Fallback neutral 3D-anatomy demo frames per primary muscle group.
 * Used for catalog exercises that don't yet have a dedicated AI demo,
 * so every exercise still shows a start/end animation.
 */
const FALLBACK_BY_MUSCLE: Record<MuscleGroup, string[]> = {
  Chest: pair(bench0, bench1),
  Back: pair(lat0, lat1),
  Shoulders: pair(ohp0, ohp1),
  Biceps: pair(bc0, bc1),
  Triceps: pair(tpd0, tpd1),
  Quads: pair(sq0, sq1),
  Hamstrings: pair(rdl0, rdl1),
  Glutes: pair(hip0, hip1),
  Calves: pair(calf0, calf1),
  Core: pair(plank0, plank1),
  "Full body": pair(dl0, dl1),
};

function resolveFrames(ex: LibraryExercise): string[] | undefined {
  if (ex.frames && ex.frames.length > 0) return ex.frames;
  const primary = ex.primary[0];
  return primary ? FALLBACK_BY_MUSCLE[primary] : undefined;
}

/**
 * Returns the looping preview frames for an exercise.
 * The optional `_gender` parameter is kept for backward compatibility
 * but is ignored — all demos use a single neutral mannequin.
 */
export function getExerciseFrames(ex: LibraryExercise, _gender?: AppGender): string[] {
  const frames = resolveFrames(ex);
  if (frames && frames.length > 0) return frames;
  return [ex.image];
}

/** Returns true when the exercise has AI-rendered demo frames available. */
export function hasGenderVariants(ex: LibraryExercise): boolean {
  const frames = resolveFrames(ex);
  return !!(frames && frames.length > 0);
}

export const EXERCISES: LibraryExercise[] = [
  // ===== LEGS =====
  {
    id: "wide-leg-press",
    name: "Wide Leg Press",
    equipment: "Machine",
    primary: ["Quads"],
    secondary: ["Glutes", "Hamstrings", "Calves"],
    image: wlp0,
    frames: pair(wlp0, wlp1),
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
    image: sq0,
    frames: pair(sq0, sq1),
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
    image: rdl0,
    frames: pair(rdl0, rdl1),
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
    image: legExt0,
    frames: pair(legExt0, legExt1),
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
    image: legCurl0,
    frames: pair(legCurl0, legCurl1),
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
    image: hip0,
    frames: pair(hip0, hip1),
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
    image: calf0,
    frames: pair(calf0, calf1),
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
    image: bench0,
    frames: pair(bench0, bench1),
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
    image: incline0,
    frames: pair(incline0, incline1),
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
    image: fly0,
    frames: pair(fly0, fly1),
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
    image: pu0,
    frames: pair(pu0, pu1),
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
    image: lat0,
    frames: pair(lat0, lat1),
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
    image: row0,
    frames: pair(row0, row1),
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
    image: scr0,
    frames: pair(scr0, scr1),
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
    image: pull0,
    frames: pair(pull0, pull1),
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
    image: dl0,
    frames: pair(dl0, dl1),
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
    image: ohp0,
    frames: pair(ohp0, ohp1),
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
    image: lr0,
    frames: pair(lr0, lr1),
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
    image: fp0,
    frames: pair(fp0, fp1),
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
    image: bc0,
    frames: pair(bc0, bc1),
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
    image: hc0,
    frames: pair(hc0, hc1),
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
    image: tpd0,
    frames: pair(tpd0, tpd1),
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
    image: sc0,
    frames: pair(sc0, sc1),
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
    image: plank0,
    frames: pair(plank0, plank1),
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
    image: hlr0,
    frames: pair(hlr0, hlr1),
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
    image: cc0,
    frames: pair(cc0, cc1),
    steps: [
      "Kniel onder een high pulley, touw bij je hoofd.",
      "Crunch naar beneden door je buikspieren aan te spannen.",
      "Kom langzaam terug omhoog.",
    ],
  },
