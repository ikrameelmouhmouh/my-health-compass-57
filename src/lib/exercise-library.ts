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


function resolveFrames(ex: LibraryExercise): string[] | undefined {
  if (ex.frames && ex.frames.length > 0) return ex.frames;
  return undefined;
}

/**
 * Returns the looping preview frames for an exercise.
 * The optional `_gender` parameter is kept for backward compatibility
 * but is ignored — all demos use a single neutral mannequin.
 *
 * Oefeningen zonder eigen AI-demo krijgen de neutrale placeholder in plaats
 * van een misleidend fallback-plaatje (bv. een plank voor "Ab Crunch Machine").
 *
 * `generatedIds` (optional): set of exercise ids that have AI frames rendered
 * in the Cloud Storage `exercise-frames` bucket. When the exercise doesn't
 * have curated bundled frames but IS in this set, we return the two storage
 * URLs (served through the /api/exercise-frame proxy) instead of the neutral
 * placeholder — so the workout UI shows the freshly-generated demo.
 */
export function getExerciseFrames(
  ex: LibraryExercise,
  _gender?: AppGender,
  generatedIds?: ReadonlySet<string>,
): string[] {
  // ALWAYS prefer freshly-generated storage frames when available, so
  // regenerated/approved frames override any legacy bundled assets. This
  // prevents "old picture reappears after refresh" bugs (e.g. wide-leg-press).
  if (generatedIds?.has(ex.id)) {
    return [
      `/api/exercise-frame/${encodeURIComponent(ex.id)}/0`,
      `/api/exercise-frame/${encodeURIComponent(ex.id)}/1`,
    ];
  }
  const frames = resolveFrames(ex);
  if (frames && frames.length > 0) return frames;
  return [ex.image];
}


/** Returns true when the exercise has AI-rendered demo frames available. */
export function hasGenderVariants(ex: LibraryExercise, generatedIds?: ReadonlySet<string>): boolean {
  const frames = resolveFrames(ex);
  if (frames && frames.length > 0) return true;
  return !!generatedIds?.has(ex.id);
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

  // ===== C-series (extra) =====
  mk("chest-press-machine", "Chest Press", "Machine", ["Chest"], ["Triceps"]),
  mk("chest-press-trx", "Chest Press", "TRX", ["Chest"], ["Triceps"]),
  mk("chin-up", "Chin Up", "Bodyweight", ["Back"], ["Biceps"]),
  mk("clamshell-band", "Clamshell", "Band", ["Glutes"]),
  mk("clean-and-jerk", "Clean and Jerk", "Barbell", ["Full body"], ["Shoulders", "Quads"]),
  mk("clean-and-press-kb", "Clean and Press", "Kettlebell", ["Full body"], ["Shoulders"]),
  mk("clean-barbell", "Clean", "Barbell", ["Full body"], ["Quads", "Back"]),
  mk("clean-deadlift", "Clean Deadlift", "Barbell", ["Hamstrings"], ["Glutes", "Back"]),
  mk("clean-kb", "Clean", "Kettlebell", ["Full body"], ["Shoulders"]),
  mk("clean-pull", "Clean Pull", "Barbell", ["Back"], ["Hamstrings", "Glutes"]),
  mk("clutch-curl-trx", "Clutch Curl", "TRX", ["Biceps"]),
  mk("concentration-curl-barbell", "Concentration Curl", "Barbell", ["Biceps"]),
  mk("concentration-curl-dumbbell", "Concentration Curl", "Dumbbell", ["Biceps"]),
  mk("core-twist-band", "Core Twist", "Band", ["Core"]),
  mk("cross-crunch", "Cross Crunch", "Bodyweight", ["Core"]),
  mk("crossed-curl-trx", "Crossed Curl", "TRX", ["Biceps"]),
  mk("crossing-balance-lunge-trx", "Crossing Balance Lunge", "TRX", ["Quads"], ["Glutes", "Core"]),
  mk("crunch-bodyweight", "Crunch", "Bodyweight", ["Core"]),
  mk("crunch-trx", "Crunch", "TRX", ["Core"]),
  mk("cuban-press", "Cuban Press", "Dumbbell", ["Shoulders"]),
  mk("cross-arm-squat", "Cross Arm Squat", "Barbell", ["Quads"], ["Glutes"]),
  mk("close-grip-lat-pulldown", "Close Grip Lat Pulldown", "Cable", ["Back"], ["Biceps"]),
  mk("close-pull-up", "Close Pull Up", "Bodyweight", ["Back"], ["Biceps"]),
  mk("close-push-up", "Close Push Up", "Bodyweight", ["Triceps"], ["Chest"]),
  mk("close-push-up-trx", "Close Push Up", "TRX", ["Triceps"], ["Chest"]),
  mk("close-squat-dumbbell", "Close Squat", "Dumbbell", ["Quads"], ["Glutes"]),
  mk("copenhagen-plank", "Copenhagen Plank", "Bodyweight", ["Core"]),
  mk("close-grip-bench-press", "Close Grip Bench Press", "Barbell", ["Triceps"], ["Chest"]),
  mk("cossack-squat-bw", "Cossack Squat", "Bodyweight", ["Quads"], ["Glutes"]),
  mk("cossack-squat-db", "Cossack Squat", "Dumbbell", ["Quads"], ["Glutes"]),

  // ===== D =====
  mk("decline-pullover", "Decline Pullover", "Barbell", ["Back"], ["Chest"]),
  mk("decline-bench-press", "Decline Bench Press", "Barbell", ["Chest"], ["Triceps"]),
  mk("decline-bench-press-db", "Decline Bench Press", "Dumbbell", ["Chest"], ["Triceps"]),
  mk("decline-chest-press-machine", "Decline Chest Press", "Machine", ["Chest"], ["Triceps"]),
  mk("decline-bench-press-cable", "Decline Bench Press", "Cable", ["Chest"], ["Triceps"]),
  mk("decline-crunch", "Decline Crunch", "Bodyweight", ["Core"]),
  mk("dead-bug", "Dead Bug", "Bodyweight", ["Core"]),
  mk("deadlift-band", "Deadlift", "Band", ["Hamstrings"], ["Glutes", "Back"]),
  mk("deadlift-barbell", "Deadlift", "Barbell", ["Hamstrings"], ["Glutes", "Back"]),
  mk("deck-squat-kb", "Deck Squat", "Kettlebell", ["Quads"], ["Glutes"]),
  mk("double-lunge-kb", "Double Lunge", "Kettlebell", ["Quads"], ["Glutes"]),
  mk("drag-curl", "Drag Curl", "Barbell", ["Biceps"]),
  mk("dumbbell-row", "Dumbbell Row", "Dumbbell", ["Back"], ["Biceps"]),
  mk("decline-push-up", "Decline Push Up", "Bodyweight", ["Chest"], ["Triceps"]),
  mk("diamond-push-up", "Diamond Push Up", "Bodyweight", ["Triceps"], ["Chest"]),
  mk("drop-jump", "Drop Jump", "Bodyweight", ["Quads"], ["Glutes", "Calves"]),

  // ===== E =====
  mk("external-shoulder-rotation-band", "External Shoulder Rotation", "Band", ["Shoulders"]),
  mk("external-shoulder-rotation-cable", "External Shoulder Rotation", "Cable", ["Shoulders"]),
  mk("external-shoulder-rotation-trx", "External Shoulder Rotation", "TRX", ["Shoulders"]),
  mk("elliptical", "Elliptical", "Bodyweight", ["Full body"]),

  // ===== F =====
  mk("face-pull-band", "Face Pull", "Band", ["Shoulders"], ["Back"]),
  mk("face-pull-cable", "Face Pull", "Cable", ["Shoulders"], ["Back"]),
  mk("farmers-walk", "Farmer's Walk", "Dumbbell", ["Full body"], ["Core"]),
  mk("floor-press-db", "Floor Press", "Dumbbell", ["Chest"], ["Triceps"]),
  mk("flutter-kicks", "Flutter Kicks", "Bodyweight", ["Core"]),
  mk("free-dips-trx", "Free Dips", "TRX", ["Triceps"], ["Chest"]),
  mk("french-press-ez", "French Press", "EZ Bar", ["Triceps"]),
  mk("french-press-barbell", "French Press", "Barbell", ["Triceps"]),
  mk("frog-jump-trx", "Frog Jump", "TRX", ["Quads"], ["Glutes"]),
  mk("front-raise-band", "Front Raise", "Band", ["Shoulders"]),
  mk("front-raise-cable", "Front Raise", "Cable", ["Shoulders"]),
  mk("front-raise-db", "Front Raise", "Dumbbell", ["Shoulders"]),
  mk("front-squat", "Front Squat", "Barbell", ["Quads"], ["Core", "Glutes"]),
  mk("forearm-pike-trx", "Forearm Pike", "TRX", ["Shoulders"], ["Core"]),
  mk("frenchie-pull-up", "Frenchie Pull up", "Bodyweight", ["Back"], ["Biceps"]),

  // ===== G =====
  mk("guillotine-bench-press", "Guillotine Bench Press", "Barbell", ["Chest"], ["Triceps"]),
  mk("glute-bridge-bw", "Glute Bridge", "Bodyweight", ["Glutes"], ["Hamstrings"]),
  mk("glute-bridge-trx", "Glute Bridge", "TRX", ["Glutes"], ["Hamstrings"]),
  mk("glute-bridge-walkout", "Glute Bridge Walkout", "Bodyweight", ["Glutes"], ["Hamstrings"]),
  mk("glute-bridge-band", "Glute Bridge", "Band", ["Glutes"], ["Hamstrings"]),
  mk("glute-kickback-bw", "Glute Kickback", "Bodyweight", ["Glutes"]),
  mk("glute-kickback-cable", "Glute Kickback", "Cable", ["Glutes"]),
  mk("glute-kickback-machine", "Glute Kickback", "Machine", ["Glutes"]),
  mk("glute-kickback-band", "Glute Kickback", "Band", ["Glutes"]),
  mk("goedemorgen-barbell", "Goedemorgen", "Barbell", ["Hamstrings"], ["Glutes", "Back"]),
  mk("goedemorgen-db", "Goedemorgen", "Dumbbell", ["Hamstrings"], ["Glutes", "Back"]),
  mk("goedemorgen-other", "Goedemorgen", "Other", ["Hamstrings"], ["Glutes"]),
  mk("gorilla-crunch", "Gorilla Crunch", "Bodyweight", ["Core"]),
  mk("groiners", "Groiners", "Bodyweight", ["Core"], ["Hamstrings"]),
  mk("glute-ham-raise", "Glute-Ham Raise", "Bodyweight", ["Hamstrings"], ["Glutes"]),
  mk("glute-bridge-other", "Glute Bridge", "Other", ["Glutes"], ["Hamstrings"]),

  // ===== H =====
  mk("hack-squat-barbell", "Hack Squat", "Barbell", ["Quads"], ["Glutes"]),
  mk("hack-squat-machine", "Hack Squat", "Machine", ["Quads"], ["Glutes"]),
  mk("hammer-curl-band", "Hammer Curl", "Band", ["Biceps"]),
  mk("hammer-curl-cable", "Hammer Curl", "Cable", ["Biceps"]),
  mk("halo-kb", "Halo", "Kettlebell", ["Shoulders"], ["Core"]),
  mk("hand-clap-push-ups", "Hand Clap Push Ups", "Bodyweight", ["Chest"], ["Triceps"]),
  mk("hammer-slam", "Hammer Slam", "Other", ["Core"], ["Shoulders"]),
  mk("hamstring-slide", "Hamstring Slide", "Bodyweight", ["Hamstrings"], ["Glutes"]),
  mk("hang-power-clean", "Hang Power Clean", "Barbell", ["Back"], ["Glutes", "Shoulders"]),
  mk("hang-snatch", "Hang Snatch", "Barbell", ["Shoulders"], ["Back", "Glutes"]),
  mk("hanging-knee-raise", "Hanging Knee Raise", "Bodyweight", ["Core"]),
  mk("hanging-pike", "Hanging Pike", "Bodyweight", ["Core"]),
  mk("heel-touches", "Heel Touches", "Bodyweight", ["Core"]),
  mk("high-plank", "High Plank", "Bodyweight", ["Core"], ["Shoulders"]),
  mk("high-pull-kb", "High Pull", "Kettlebell", ["Shoulders"], ["Back"]),
  mk("high-row-band", "High Row", "Band", ["Back"], ["Biceps"]),
  mk("high-row-machine", "High Row", "Machine", ["Back"], ["Biceps"]),
  mk("high-row-squat-trx", "High Row Squat", "TRX", ["Back"], ["Quads"]),
  mk("hip-abduction-bw", "Hip Abduction", "Bodyweight", ["Glutes"]),
  mk("hip-abduction-band", "Hip Abduction", "Band", ["Glutes"]),
  mk("hip-abduction-cable", "Hip Abduction", "Cable", ["Glutes"]),
  mk("hip-abduction-trx", "Hip Abduction", "TRX", ["Glutes"]),
  mk("hip-drop-trx", "Hip Drop", "TRX", ["Core"]),
  mk("hip-thrust-barbell", "Hip Thrust", "Barbell", ["Glutes"], ["Hamstrings"]),
  mk("hip-toss-rope", "Hip Toss", "Other", ["Core"], ["Shoulders"]),
  mk("hollow-hold", "Hollow Hold", "Bodyweight", ["Core"]),
  mk("hundreds", "Hundreds", "Bodyweight", ["Core"]),

  // ===== I =====
  mk("in-and-out-waves", "In and Out Waves", "Other", ["Shoulders"], ["Core"]),
  mk("incline-bench-press-barbell", "Incline Bench Press", "Barbell", ["Chest"], ["Triceps", "Shoulders"]),
  mk("incline-bench-press-cable", "Incline Bench Press", "Cable", ["Chest"], ["Triceps"]),
  mk("incline-bench-press-db", "Incline Bench Press", "Dumbbell", ["Chest"], ["Triceps", "Shoulders"]),
  mk("incline-bench-press-smith", "Incline Bench Press", "Smith Machine", ["Chest"], ["Triceps"]),
  mk("incline-bicep-curl-db", "Incline Bicep Curl", "Dumbbell", ["Biceps"]),
  mk("incline-chest-press-machine", "Incline Chest Press", "Machine", ["Chest"], ["Triceps"]),
  mk("incline-hammer-curl-db", "Incline Hammer Curl", "Dumbbell", ["Biceps"]),
  mk("incline-push-up", "Incline Push Up", "Bodyweight", ["Chest"], ["Triceps"]),
  mk("incline-shoulder-press-db", "Incline Shoulder Press", "Dumbbell", ["Shoulders"], ["Triceps"]),
  mk("incline-shoulder-press-barbell", "Incline Shoulder Press", "Barbell", ["Shoulders"], ["Triceps"]),
  mk("inner-bicep-curl-db", "Inner Bicep Curl", "Dumbbell", ["Biceps"]),
  mk("inner-thigh-machine", "Inner Thigh Machine", "Machine", ["Glutes"]),
  mk("internal-shoulder-rotation-band", "Internal Shoulder Rotation", "Band", ["Shoulders"]),
  mk("internal-shoulder-rotation-cable", "Internal Shoulder Rotation", "Cable", ["Shoulders"]),
  mk("internal-shoulder-rotation-trx", "Internal Shoulder Rotation", "TRX", ["Shoulders"]),
  mk("inverted-row", "Inverted Row", "Bodyweight", ["Back"], ["Biceps"]),
  mk("iron-cross-squat-db", "Iron Cross Squat", "Dumbbell", ["Quads"], ["Shoulders"]),

  // ===== J =====
  mk("jackknife-crunch", "Jackknife Crunch", "Bodyweight", ["Core"]),
  mk("jm-bench-press", "JM Bench Press", "Barbell", ["Triceps"], ["Chest"]),
  mk("jump-squat-bw", "Jump Squat", "Bodyweight", ["Quads"], ["Glutes"]),
  mk("jump-squat-trx", "Jump Squat", "TRX", ["Quads"], ["Glutes"]),
  mk("jumping-jacks-bw", "Jumping Jacks", "Bodyweight", ["Calves"], ["Shoulders"]),
  mk("jumping-jacks-rope", "Jumping Jacks", "Other", ["Calves"], ["Shoulders"]),

  // ===== K =====
  mk("kettlebell-row", "Kettlebell Row", "Kettlebell", ["Back"], ["Biceps"]),
  mk("kneeling-cable-crossover", "Kneeling Cable Crossover", "Cable", ["Chest"]),
  mk("kneeling-crunch-cable", "Kneeling Crunch", "Cable", ["Core"]),
  mk("kneeling-press-kb", "Kneeling Press", "Kettlebell", ["Shoulders"], ["Triceps"]),
  mk("kneeling-squat-barbell", "Kneeling Squat", "Barbell", ["Glutes"], ["Quads"]),

  // ===== L =====
  mk("l-sit-pull-up", "L-sit Pull Up", "Bodyweight", ["Back"], ["Core", "Biceps"]),
  mk("lat-pulldown-machine", "Lat Pulldown", "Machine", ["Back"], ["Biceps"]),
  mk("lateral-raise-band", "Lateral Raise", "Band", ["Shoulders"]),
  mk("lateral-raise-db", "Lateral Raise", "Dumbbell", ["Shoulders"]),
  mk("lateral-raise-machine", "Lateral Raise", "Machine", ["Shoulders"]),
  mk("lateral-swing-kb", "Lateral Swing", "Kettlebell", ["Shoulders"], ["Core"]),
  mk("leg-curl-trx", "Leg Curl", "TRX", ["Hamstrings"]),
  mk("leg-extensions-machine", "Leg Extensions", "Machine", ["Quads"]),
  mk("leg-press-machine", "Leg Press", "Machine", ["Quads"], ["Glutes"]),
  mk("linksom-rope", "Linksom", "Other", ["Shoulders"], ["Core"]),
  mk("low-bicep-curl-cable", "Low Bicep Curl", "Cable", ["Biceps"]),
  mk("low-row-cable", "Low Row", "Cable", ["Back"], ["Biceps"]),
  mk("low-sled-push", "Low Sled Push", "Other", ["Quads"], ["Glutes"]),
  mk("lunge-bw", "Lunge", "Bodyweight", ["Quads"], ["Glutes"]),
  mk("lunge-band", "Lunge Band", "Band", ["Quads"], ["Glutes"]),
  mk("lunge-barbell", "Lunge", "Barbell", ["Quads"], ["Glutes"]),
  mk("lunge-cable", "Lunge", "Cable", ["Quads"], ["Glutes"]),
  mk("lunge-db", "Lunge", "Dumbbell", ["Quads"], ["Glutes"]),
  mk("lunge-landmine", "Lunge", "Landmine", ["Quads"], ["Glutes"]),
  mk("lunge-trx", "Lunge", "TRX", ["Quads"], ["Glutes"]),
  mk("lunge-sandbag", "Lunge", "Other", ["Quads"], ["Glutes"]),
  mk("lunge-and-press-kb", "Lunge and Press", "Kettlebell", ["Quads"], ["Shoulders"]),
  mk("lying-bicep-curl-cable", "Lying Bicep Curl", "Cable", ["Biceps"]),
  mk("lying-chest-fly-cable", "Lying Chest Fly", "Cable", ["Chest"]),
  mk("lying-external-shoulder-rotation-db", "Lying External Shoulder Rotation", "Dumbbell", ["Shoulders"]),
  mk("lying-leg-raise", "Lying Leg Raise", "Bodyweight", ["Core"]),
  mk("lying-tricep-extension-cable", "Lying Tricep Extension", "Cable", ["Triceps"]),

  // ===== M =====
  mk("medicine-ball-slam", "Medicine Ball Slam", "Other", ["Core"], ["Shoulders"]),
  mk("military-press-barbell", "Military Press", "Barbell", ["Shoulders"], ["Triceps"]),
  mk("mountain-climbers", "Mountain Climbers", "Bodyweight", ["Core"], ["Shoulders"]),
  mk("muscle-up", "Muscle Up", "Bodyweight", ["Back"], ["Chest", "Triceps"]),
  mk("mobiliteit", "Mobiliteit", "Bodyweight", ["Core"]),

  // ===== N =====
  mk("narrow-leg-press", "Narrow Leg Press", "Machine", ["Quads"], ["Glutes"]),
  mk("narrow-stance-smith", "Narrow Stance", "Smith Machine", ["Quads"], ["Glutes"]),
  mk("neck-extension", "Neck Extension", "Bodyweight", ["Back"]),
  mk("nordic-curl", "Nordic Curl", "Bodyweight", ["Hamstrings"]),

  // ===== O =====
  mk("oblique-crunch-bw", "Oblique Crunch", "Bodyweight", ["Core"]),
  mk("oblique-crunch-trx", "Oblique Crunch", "TRX", ["Core"]),
  mk("ondersteunde-chin-up", "Ondersteunde Chin Up", "Assisted", ["Back"], ["Biceps"]),
  mk("one-arm-bent-over-row-db", "One Arm Bent Over Row", "Dumbbell", ["Back"], ["Biceps"]),
  mk("one-arm-bicep-curl-band", "One Arm Bicep Curl", "Band", ["Biceps"]),
  mk("one-arm-bicep-curl-cable", "One Arm Bicep Curl", "Cable", ["Biceps"]),
  mk("one-arm-bicep-curl-trx", "One Arm Bicep Curl", "TRX", ["Biceps"]),
  mk("one-arm-cable-crossover", "One Arm Cable Crossover", "Cable", ["Chest"]),
  mk("one-arm-cable-row", "One Arm Cable Row", "Cable", ["Back"], ["Biceps"]),
  mk("one-arm-chest-press-trx", "One Arm Chest Press", "TRX", ["Chest"], ["Triceps"]),
  mk("one-arm-clean-and-press-landmine", "One Arm Clean and Press", "Landmine", ["Shoulders"], ["Back", "Glutes"]),
  mk("one-arm-deadlift-band", "One Arm Deadlift", "Band", ["Back"], ["Glutes", "Hamstrings"]),
  mk("one-arm-deadlift-kb", "One Arm Deadlift", "Kettlebell", ["Back"], ["Glutes", "Hamstrings"]),
  mk("one-arm-lateral-raise-cable", "One Arm Lateral Raise", "Cable", ["Shoulders"]),
  mk("one-arm-lateral-raise-db", "One Arm Lateral Raise", "Dumbbell", ["Shoulders"]),
  mk("one-arm-lat-pulldown-machine", "One Arm Lat Pulldown", "Machine", ["Back"], ["Biceps"]),
  mk("one-arm-low-row-cable", "One Arm Low Row", "Cable", ["Back"], ["Biceps"]),
  mk("one-arm-preacher-curl-db", "One Arm Preacher Curl", "Dumbbell", ["Biceps"]),
  mk("one-arm-push-up-bw", "One Arm Push Up", "Bodyweight", ["Chest"], ["Triceps"]),
  mk("one-arm-push-up-trx", "One Arm Push Up", "TRX", ["Chest"], ["Triceps"]),
  mk("one-arm-reverse-flyes-db", "One Arm Reverse Flyes", "Dumbbell", ["Shoulders"], ["Back"]),
  mk("one-arm-row-trx", "One Arm Row", "TRX", ["Back"], ["Biceps"]),
  mk("one-arm-swing-kb", "One Arm Swing", "Kettlebell", ["Glutes"], ["Hamstrings"]),
  mk("one-arm-tricep-extension-cable", "One Arm Tricep Extension", "Cable", ["Triceps"]),
  mk("one-arm-triceps-extension-db", "One Arm Triceps Extension", "Dumbbell", ["Triceps"]),
  mk("one-arm-triceps-kickback-db", "One Arm Triceps Kickback", "Dumbbell", ["Triceps"]),
  mk("one-arm-upright-row-db", "One Arm Upright Row", "Dumbbell", ["Shoulders"]),
  mk("outer-thigh-machine", "Outer Thigh Machine", "Machine", ["Glutes"]),
  mk("overhead-bicep-curl-cable", "Overhead Bicep Curl", "Cable", ["Biceps"]),
  mk("overhead-press-kb", "Overhead Press", "Kettlebell", ["Shoulders"], ["Triceps"]),
  mk("overhead-squat-barbell", "Overhead Squat", "Barbell", ["Quads"], ["Shoulders", "Core"]),
  mk("overhead-squat-db", "Overhead Squat", "Dumbbell", ["Quads"], ["Shoulders", "Core"]),
  mk("overhead-squat-kb", "Overhead Squat", "Kettlebell", ["Quads"], ["Shoulders", "Core"]),
  mk("overhead-triceps-extension-cable", "Overhead Triceps Extension", "Cable", ["Triceps"]),
  mk("overhead-triceps-extension-db", "Overhead Triceps Extension", "Dumbbell", ["Triceps"]),

  // ===== P =====
  mk("pallof-press-cable", "Pallof Press", "Cable", ["Core"]),
  mk("pec-deck-fly", "Pec Deck Fly", "Machine", ["Chest"]),
  mk("pike-push-up-bw", "Pike Push Up", "Bodyweight", ["Shoulders"], ["Triceps"]),
  mk("pike-push-up-trx", "Pike Push Up", "TRX", ["Shoulders"], ["Triceps"]),
  mk("pistol-squat-bw", "Pistol Squat", "Bodyweight", ["Quads"], ["Glutes"]),
  mk("pistol-squat-trx", "Pistol Squat", "TRX", ["Quads"], ["Glutes"]),
  mk("plank-trx", "Plank", "TRX", ["Core"]),
  mk("plank-rotation", "Plank Rotation", "Bodyweight", ["Core"], ["Shoulders"]),
  mk("plank-row-kb", "Plank Row", "Kettlebell", ["Back"], ["Core"]),
  mk("plie-squat-bw", "Plie Squat", "Bodyweight", ["Quads"], ["Glutes"]),
  mk("plie-squat-db", "Plie Squat", "Dumbbell", ["Quads"], ["Glutes"]),
  mk("plie-squat-trx", "Plie Squat", "TRX", ["Quads"], ["Glutes"]),
  mk("power-clean", "Power Clean", "Barbell", ["Back"], ["Glutes", "Shoulders"]),
  mk("power-pull-trx", "Power Pull", "TRX", ["Back"], ["Core"]),
  mk("power-slam-rope", "Power Slam", "Other", ["Core"], ["Shoulders"]),
  mk("power-snatch", "Power Snatch", "Barbell", ["Shoulders"], ["Back", "Glutes"]),
  mk("preacher-curl-barbell", "Preacher Curl", "Barbell", ["Biceps"]),
  mk("preacher-curl-cable", "Preacher Curl", "Cable", ["Biceps"]),
  mk("preacher-curl-db", "Preacher Curl", "Dumbbell", ["Biceps"]),
  mk("preacher-curl-ez", "Preacher Curl", "EZ Bar", ["Biceps"]),
  mk("preacher-curl-machine", "Preacher Curl", "Machine", ["Biceps"]),
  mk("preacher-hammer-curl-db", "Preacher Hammer Curl", "Dumbbell", ["Biceps"]),
  mk("pseudo-planche-push-up", "Pseudo Planche Push Up", "Bodyweight", ["Chest"], ["Shoulders", "Triceps"]),
  mk("pull-up-trx", "Pull Up", "TRX", ["Back"], ["Biceps"]),
  mk("pullover-db", "Pullover", "Dumbbell", ["Back"], ["Chest"]),
  mk("pullover-machine", "Pullover Machine", "Machine", ["Back"], ["Chest"]),
  mk("punch-trx", "Punch", "TRX", ["Shoulders"], ["Core"]),
  mk("push-jerk", "Push Jerk", "Barbell", ["Shoulders"], ["Triceps", "Glutes"]),
  mk("push-press-barbell", "Push Press", "Barbell", ["Shoulders"], ["Triceps"]),
  mk("push-press-behind-the-neck", "Push Press Behind The Neck", "Barbell", ["Shoulders"], ["Triceps"]),
  mk("push-press-kb", "Push Press", "Kettlebell", ["Shoulders"], ["Triceps"]),
  mk("push-up-band", "Push Up Band", "Band", ["Chest"], ["Triceps"]),
  mk("push-up-trx", "Push Up", "TRX", ["Chest"], ["Triceps"]),

  // ===== R =====
  mk("raised-leg-circle", "Raised Leg Circle", "Bodyweight", ["Core"]),
  mk("raised-leg-plank", "Raised Leg Plank", "Bodyweight", ["Core"]),
  mk("rear-delt-row-barbell", "Rear Delt Row", "Barbell", ["Shoulders"], ["Back"]),
  mk("rear-delt-row-cable", "Rear Delt Row", "Cable", ["Shoulders"], ["Back"]),
  mk("rechtsom-rope", "Rechtsom", "Other", ["Shoulders"], ["Core"]),
  mk("renegade-row-db", "Renegade Row", "Dumbbell", ["Back"], ["Core"]),
  mk("reverse-bench-press", "Reverse Bench Press", "Barbell", ["Chest"], ["Biceps"]),
  mk("reverse-bent-over-row", "Reverse Bent Over Row", "Barbell", ["Back"], ["Biceps"]),
  mk("reverse-bicep-curl-band", "Reverse Bicep Curl", "Band", ["Biceps"]),
  mk("reverse-grip-lat-pulldown", "Reverse Grip Lat Pulldown", "Machine", ["Back"], ["Biceps"]),
  mk("reverse-mountain-climbers", "Reverse Mountain Climbers", "Bodyweight", ["Core"]),
  mk("reverse-bicep-curl-barbell", "Reverse Bicep Curl", "Barbell", ["Biceps"]),
  mk("reverse-bicep-curl-cable", "Reverse Bicep Curl", "Cable", ["Biceps"]),
  mk("reverse-bicep-curl-db", "Reverse Bicep Curl", "Dumbbell", ["Biceps"]),
  mk("reverse-crunch-bw", "Reverse Crunch", "Bodyweight", ["Core"]),
  mk("reverse-crunch-cable", "Reverse Crunch", "Cable", ["Core"]),
  mk("reverse-fly-cable", "Reverse Fly", "Cable", ["Shoulders"], ["Back"]),
  mk("reverse-fly-db", "Reverse Fly", "Dumbbell", ["Shoulders"], ["Back"]),
  mk("reverse-fly-machine", "Reverse Fly", "Machine", ["Shoulders"], ["Back"]),
  mk("reverse-lunge-bw", "Reverse Lunge", "Bodyweight", ["Quads"], ["Glutes", "Hamstrings"]),
  mk("reverse-lunge-db", "Reverse Lunge", "Dumbbell", ["Quads"], ["Glutes", "Hamstrings"]),
  mk("reverse-lunge-kb", "Reverse Lunge", "Kettlebell", ["Quads"], ["Glutes", "Hamstrings"]),
  mk("reverse-lunge-trx", "Reverse Lunge", "TRX", ["Quads"], ["Glutes", "Hamstrings"]),
  mk("reverse-preacher-curl-ez", "Reverse Preacher Curl", "EZ Bar", ["Biceps"]),
  mk("romanian-deadlift-band", "Romanian Deadlift", "Band", ["Hamstrings"], ["Glutes", "Back"]),
  mk("romanian-deadlift-barbell", "Romanian Deadlift", "Barbell", ["Hamstrings"], ["Glutes", "Back"]),
  mk("romanian-deadlift-db", "Romanian Deadlift", "Dumbbell", ["Hamstrings"], ["Glutes", "Back"]),
  mk("romanian-deadlift-smith", "Romanian Deadlift", "Smith Machine", ["Hamstrings"], ["Glutes", "Back"]),
  mk("russian-twist-bw", "Russian Twist", "Bodyweight", ["Core"]),
  mk("reverse-triceps-extension-cable", "Reverse Triceps Extension", "Cable", ["Triceps"]),
  mk("reverse-triceps-extension-trx", "Reverse Triceps Extension", "TRX", ["Triceps"]),
  mk("reverse-wrist-curl-band", "Reverse Wrist Curl", "Band", ["Biceps"]),
  mk("rear-delt-fly-db", "Rear Delt Fly", "Dumbbell", ["Shoulders"], ["Back"]),
  mk("rear-delt-fly-machine", "Rear Delt Fly", "Machine", ["Shoulders"], ["Back"]),
  mk("rear-delt-fly-machine-2", "Rear Delt Fly", "Machine", ["Shoulders"], ["Back"]),
  mk("rear-delt-fly-cable", "Rear Delt Fly", "Cable", ["Shoulders"], ["Back"]),
  mk("reverse-nordic-curl-bw", "Reverse Nordic Curl", "Bodyweight", ["Quads"]),
  mk("roeien-bw", "Roeien", "Bodyweight", ["Back"], ["Full body"]),
  mk("reverse-grip-lat-pulldown-cable", "Reverse Grip Lat Pulldown", "Cable", ["Back"], ["Biceps"]),
  // ===== S =====
  mk("shoulder-shrug-machine", "Shoulder Shrug", "Machine", ["Shoulders"], ["Back"]),
  mk("single-leg-clean-kb", "Single Leg Clean", "Kettlebell", ["Full body"]),
  mk("snatch-deadlift-barbell", "Snatch Deadlift", "Barbell", ["Hamstrings"], ["Back", "Glutes"]),
  mk("seated-hip-toss-rope", "Seated Hip Toss", "Other", ["Core"], ["Shoulders"]),
  mk("straight-arm-lat-pulldown-cable", "Straight Arm Lat Pulldown", "Cable", ["Back"]),
  mk("seated-leg-curl-machine", "Seated Leg Curl", "Machine", ["Hamstrings"]),
  mk("single-leg-curl-trx", "Single Leg Curl", "TRX", ["Hamstrings"]),
  mk("single-leg-press-machine", "Single Leg Press", "Machine", ["Quads"], ["Glutes", "Hamstrings"]),
  mk("standing-oblique-crunches-bw", "Standing Oblique Crunches", "Bodyweight", ["Core"]),
  mk("squat-power-pull-trx", "Squat Power Pull", "TRX", ["Back"], ["Quads", "Core"]),
  mk("scissor-kick-bw", "Scissor Kick", "Bodyweight", ["Core"]),
  mk("seated-leg-tuck-bw", "Seated Leg Tuck", "Bodyweight", ["Core"]),
  mk("shoulder-press-band", "Shoulder Press", "Band", ["Shoulders"], ["Triceps"]),
  mk("shoulder-press-cable", "Shoulder Press", "Cable", ["Shoulders"], ["Triceps"]),
  mk("shoulder-press-db", "Shoulder Press", "Dumbbell", ["Shoulders"], ["Triceps"]),
  mk("shoulder-press-landmine", "Shoulder Press", "Landmine", ["Shoulders"], ["Triceps"]),
  mk("shoulder-press-machine", "Shoulder Press", "Machine", ["Shoulders"], ["Triceps"]),
  mk("shoulder-press-trx", "Shoulder Press", "TRX", ["Shoulders"], ["Triceps"]),
  mk("shoulder-press-smith", "Shoulder Press", "Smith Machine", ["Shoulders"], ["Triceps"]),
  mk("shoulder-shrug-band", "Shoulder Shrug", "Band", ["Shoulders"], ["Back"]),
  mk("shoulder-shrug-barbell", "Shoulder Shrug", "Barbell", ["Shoulders"], ["Back"]),
  mk("shoulder-shrug-cable", "Shoulder Shrug", "Cable", ["Shoulders"], ["Back"]),
  mk("shoulder-shrug-db", "Shoulder Shrug", "Dumbbell", ["Shoulders"], ["Back"]),
  mk("side-bend-band", "Side Bend", "Band", ["Core"]),
  mk("side-bend-db", "Side Bend", "Dumbbell", ["Core"]),
  mk("side-lunge-bw", "Side Lunge", "Bodyweight", ["Quads"], ["Glutes"]),
  mk("side-lunge-cable", "Side Lunge", "Cable", ["Quads"], ["Glutes"]),
  mk("side-lunge-db", "Side Lunge", "Dumbbell", ["Quads"], ["Glutes"]),
  mk("side-lunge-kb", "Side Lunge", "Kettlebell", ["Quads"], ["Glutes"]),
  mk("side-lunge-trx", "Side Lunge", "TRX", ["Quads"], ["Glutes"]),
  mk("side-plank-bw", "Side Plank", "Bodyweight", ["Core"]),
  mk("side-plank-trx", "Side Plank", "TRX", ["Core"]),
  mk("sit-and-press-kb", "Sit and Press", "Kettlebell", ["Shoulders"], ["Core"]),
  mk("sit-up-bw", "Sit Up", "Bodyweight", ["Core"]),
  mk("ski-step-rope", "Ski Step", "Other", ["Full body"]),
  mk("skull-crusher-ez", "Skull Crusher", "EZ Bar", ["Triceps"]),
  mk("sled-pull-other", "Sled Pull", "Other", ["Back"], ["Full body"]),
  mk("sled-push-other", "Sled Push", "Other", ["Quads"], ["Full body"]),
  mk("sled-row-other", "Sled Row", "Other", ["Back"], ["Full body"]),
  mk("squat-smith", "Squat", "Smith Machine", ["Quads"], ["Glutes", "Hamstrings"]),
  mk("snatch-barbell", "Snatch", "Barbell", ["Full body"]),
  mk("snatch-kb", "Snatch", "Kettlebell", ["Full body"]),
  mk("sotts-press-kb", "Sotts Press", "Kettlebell", ["Shoulders"]),
  mk("spider-crawl-bw", "Spider Crawl", "Bodyweight", ["Core"], ["Full body"]),
  mk("split-clean-barbell", "Split Clean", "Barbell", ["Full body"]),
  mk("split-jerk-barbell", "Split Jerk", "Barbell", ["Shoulders"], ["Full body"]),
  mk("split-snatch-barbell", "Split Snatch", "Barbell", ["Full body"]),
  mk("squat-bw", "Squat", "Bodyweight", ["Quads"], ["Glutes", "Hamstrings"]),
  mk("squat-and-press-kb", "Squat and Press", "Kettlebell", ["Full body"]),
  mk("squat-band", "Squat", "Band", ["Quads"], ["Glutes", "Hamstrings"]),
  mk("squat-cable", "Squat", "Cable", ["Quads"], ["Glutes", "Hamstrings"]),
  mk("squat-db", "Squat", "Dumbbell", ["Quads"], ["Glutes", "Hamstrings"]),
  mk("squat-hold-bw", "Squat Hold", "Bodyweight", ["Quads"], ["Glutes"]),
  mk("squat-kb", "Squat", "Kettlebell", ["Quads"], ["Glutes", "Hamstrings"]),
  mk("squat-landmine", "Squat", "Landmine", ["Quads"], ["Glutes", "Hamstrings"]),
  mk("single-leg-squat-trx", "Single Leg Squat", "TRX", ["Quads"], ["Glutes"]),
  mk("step-up-bw", "Step Up", "Bodyweight", ["Quads"], ["Glutes"]),
  mk("step-up-cable", "Step Up", "Cable", ["Quads"], ["Glutes"]),
  mk("step-up-db", "Step Up", "Dumbbell", ["Quads"], ["Glutes"]),
  mk("straight-arm-sit-kb", "Straight Arm Sit", "Kettlebell", ["Core"], ["Shoulders"]),
  mk("sumo-squat-landmine", "Sumo Squat", "Landmine", ["Quads"], ["Glutes"]),
  mk("superman-bw", "Superman", "Bodyweight", ["Back"], ["Glutes"]),
  mk("svend-press-other", "Svend Press", "Other", ["Chest"]),
  mk("side-step-swing-kb", "Side Step Swing", "Kettlebell", ["Full body"]),
  mk("seated-bicep-curl-db", "Seated Bicep Curl", "Dumbbell", ["Biceps"]),
  mk("seated-calf-raise-machine", "Seated Calf Raise", "Machine", ["Calves"]),
  mk("sumo-deadlift-barbell", "Sumo Deadlift", "Barbell", ["Hamstrings"], ["Glutes", "Back"]),
  mk("single-leg-deadlift-bw", "Single Leg Deadlift", "Bodyweight", ["Hamstrings"], ["Glutes"]),
  mk("swiss-ball-plank-bw", "Swiss Ball Plank", "Bodyweight", ["Core"]),
  mk("skull-crusher-db", "Skull Crusher", "Dumbbell", ["Triceps"]),
  mk("shrimp-squat-bw", "Shrimp Squat", "Bodyweight", ["Quads"], ["Glutes"]),
  mk("sissy-squat-bw", "Sissy Squat", "Bodyweight", ["Quads"]),
  mk("split-squat-bw", "Split Squat", "Bodyweight", ["Quads"], ["Glutes"]),
  mk("squat-high-pull-sandbag", "Squat High Pull", "Other", ["Full body"]),
  mk("spider-curl-db", "Spider Curl", "Dumbbell", ["Biceps"]),
  mk("spider-curl-barbell", "Spider Curl", "Barbell", ["Biceps"]),
  mk("sumo-squat-db", "Sumo Squat", "Dumbbell", ["Quads"], ["Glutes"]),
  mk("stationaire-fiets", "Stationaire fiets", "Other", ["Full body"]),
  mk("stretchen", "Stretchen", "Bodyweight", ["Full body"]),
  mk("skierg", "SkiErg", "Other", ["Full body"]),
  // ===== T =====
  mk("two-hands-swing-kb", "Two Hands Swing", "Kettlebell", ["Glutes"], ["Hamstrings", "Back"]),
  mk("tactical-lunge-kb", "Tactical Lunge", "Kettlebell", ["Quads"], ["Glutes", "Core"]),
  mk("tate-press-db", "Tate Press", "Dumbbell", ["Triceps"]),
  mk("t-bar-row-landmine", "T-Bar Row", "Landmine", ["Back"], ["Biceps"]),
  mk("t-bar-row-machine", "T-Bar Row", "Machine", ["Back"], ["Biceps"]),
  mk("thruster-db", "Thruster", "Dumbbell", ["Full body"]),
  mk("thruster-kb", "Thruster", "Kettlebell", ["Full body"]),
  mk("thruster-landmine", "Thruster", "Landmine", ["Full body"]),
  mk("tiptoe-squat-bw", "Tiptoe Squat", "Bodyweight", ["Quads"], ["Calves"]),
  mk("tiptoe-squat-machine", "Tiptoe Squat", "Machine", ["Quads"], ["Calves"]),
  mk("tiptoe-squat-trx", "Tiptoe Squat", "TRX", ["Quads"], ["Calves"]),
  mk("tire-flip-other", "Tire Flip", "Other", ["Full body"]),
  mk("tricep-dip-bw", "Tricep Dip", "Bodyweight", ["Triceps"]),
  mk("tricep-dip-trx", "Tricep Dip", "TRX", ["Triceps"]),
  mk("triceps-extension-band", "Triceps Extension", "Band", ["Triceps"]),
  mk("triceps-extension-machine", "Triceps Extension", "Machine", ["Triceps"]),
  mk("triceps-extension-trx", "Triceps Extension", "TRX", ["Triceps"]),
  mk("triceps-kickback-band", "Triceps Kickback", "Band", ["Triceps"]),
  mk("triceps-kickback-cable", "Triceps Kickback", "Cable", ["Triceps"]),
  mk("triceps-kickback-db", "Triceps Kickback", "Dumbbell", ["Triceps"]),
  mk("typewriter-pull-up-bw", "Typewriter Pull Up", "Bodyweight", ["Back"], ["Biceps"]),
  mk("tricep-pushdown-cable", "Tricep Pushdown", "Cable", ["Triceps"]),
  mk("treadmill-run", "Treadmill Run", "Other", ["Full body"]),
  // ===== U =====
  mk("upright-row-band", "Upright Row", "Band", ["Shoulders"], ["Back"]),
  mk("upright-row-barbell", "Upright Row", "Barbell", ["Shoulders"], ["Back"]),
  mk("upright-row-cable", "Upright Row", "Cable", ["Shoulders"], ["Back"]),
  mk("upright-row-db", "Upright Row", "Dumbbell", ["Shoulders"], ["Back"]),
  mk("upright-row-trx", "Upright Row", "TRX", ["Shoulders"], ["Back"]),
  // ===== V =====
  mk("v-sit-up-bw", "V Sit Up", "Bodyweight", ["Core"]),
  // ===== W =====
  mk("wisselende-golven-rope", "Wisselende golven", "Other", ["Full body"]),
  mk("wide-bicep-curl-barbell", "Wide Bicep Curl", "Barbell", ["Biceps"]),
  mk("wide-chest-press-trx", "Wide Chest Press", "TRX", ["Chest"], ["Triceps"]),
  mk("wide-grip-lat-pulldown-machine", "Wide Grip Lat Pulldown", "Machine", ["Back"], ["Biceps"]),
  mk("wide-grip-lat-pulldown-cable", "Wide Grip Lat Pulldown", "Cable", ["Back"], ["Biceps"]),
  mk("wide-leg-press-machine", "Wide Leg Press", "Machine", ["Quads"], ["Glutes"]),
  mk("wide-pull-up-bw", "Wide Pull Up", "Bodyweight", ["Back"], ["Biceps"]),
  mk("wide-push-up-bw", "Wide Push Up", "Bodyweight", ["Chest"], ["Triceps"]),
  mk("wall-sit-bw", "Wall Sit", "Bodyweight", ["Quads"]),
  mk("windmill-kb", "Windmill", "Kettlebell", ["Core"], ["Shoulders"]),
  mk("wood-chop-cable", "Wood Chop", "Cable", ["Core"]),
  mk("wood-chop-db", "Wood Chop", "Dumbbell", ["Core"]),
  mk("wrist-curl-band", "Wrist Curl", "Band", ["Biceps"]),
  mk("wrist-rotation-barbell", "Wrist Rotation", "Barbell", ["Biceps"]),
  mk("wall-handstand-push-up-bw", "Wall Handstand Push Up", "Bodyweight", ["Shoulders"], ["Triceps"]),
  mk("wall-balls", "Wall Balls", "Other", ["Full body"]),
  // ===== X =====
  mk("xfly-trx", "xFly", "TRX", ["Chest"]),
  // ===== Z =====
  mk("zombie-squat-barbell", "Zombie Squat", "Barbell", ["Quads"], ["Core"]),
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
