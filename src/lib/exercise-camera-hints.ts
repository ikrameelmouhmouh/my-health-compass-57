// Per-exercise camera, machine and body-orientation instructions so that the
// two generated frames (start + end) look like consecutive stills from the same
// locked-off camera, not two unrelated photos.
//
// Rules we try to lock:
// - exact same room / background / floor
// - exact same camera position, angle, height, distance and focal length
// - exact same side of the body visible (front stays front, side stays side)
// - exact same mannequin proportions, skin, clothing
// - for machine exercises: the machine must appear in the same place in both frames

export type CameraHint = {
  /** Short label shown in the admin UI. */
  label: string;
  /** Camera position relative to the subject. */
  angle: string;
  /** For machine exercises: where the camera looks from and what must stay in frame. */
  machineView?: string;
  /** How the body is oriented in space. */
  bodyOrientation: string;
  /** Description of the START position. */
  startPose: string;
  /** Description of the END position. */
  endPose: string;
};

/** Explicit instructions for the featured/demo exercises we render most often. */
const HINTS: Record<string, CameraHint> = {
  // ===== LEGS =====
  "wide-leg-press": {
    label: "Machine: vaste zijkant, hele leg press zichtbaar",
    angle: "perfect locked-off pure side view from the mannequin's left side, eye level with the seat, camera perpendicular to the leg press rails; never front view, never rear view, never from the opposite side",
    machineView:
      "45-degree leg press machine viewed from one fixed side: complete rectangular base frame, inclined rails, sled/carriage, large foot plate, back pad, seat pad and safety handles all visible from the same side in both frames; the machine occupies the same left-to-right position and must not be replaced by a generic chair or disappear",
    bodyOrientation: "mannequin reclined on its back against the angled back pad, head and torso on the seat at frame-left, hips low, feet placed wide on the foot plate at frame-right; the same left side of the body is visible in both frames",
    startPose: "knees deeply bent about 90°, hips flexed, feet flat and wide on the foot plate, hands on side handles, back pressed into the pad",
    endPose: "legs pressed almost straight while knees remain slightly soft, feet still wide on the same foot plate, back still pressed into the same pad; only the sled/leg angle changes along the rails",
  },
  "barbell-squat": {
    label: "Zijkant, barbell op rug",
    angle: "pure side view, eye level, camera perpendicular to the barbell",
    bodyOrientation: "mannequin standing upright, full body visible from head to feet",
    startPose: "barbell resting on the upper back, feet shoulder-width, knees slightly bent, torso upright",
    endPose: "thighs parallel to the floor, torso still upright, barbell path stays vertical over mid-foot",
  },
  "romanian-deadlift": {
    label: "Zijkant, heupscharnier",
    angle: "pure side view, eye level",
    bodyOrientation: "mannequin standing upright, full body visible",
    startPose: "barbell in front of the thighs, shoulders back, knees slightly bent",
    endPose: "torso hinged forward at the hips to about 45-90°, barbell lowered along the legs, back flat",
  },
  "leg-extension": {
    label: "Machine: zijkant, zittend",
    angle: "pure side view, eye level, camera perpendicular to the seat",
    machineView:
      "full leg-extension machine visible: seat, back pad, shin pad/roller and weight stack on the same side in both frames",
    bodyOrientation: "mannequin sitting upright on the machine, legs hanging down at 90°",
    startPose: "knees bent 90°, lower legs vertical, feet relaxed",
    endPose: "legs fully extended forward, knees straight, feet flexed; shin pad lifted",
  },
  "lying-leg-curl": {
    label: "Machine: zijkant, liggend op buik",
    angle: "pure side view, eye level, camera perpendicular to the bench",
    machineView:
      "full lying leg curl machine visible: bench, ankle roller and weight stack on the same side in both frames",
    bodyOrientation: "mannequin lying face-down on the bench, head toward the left, legs toward the right",
    startPose: "legs straight, heels against the roller, body flat on the bench",
    endPose: "knees bent, heels pulled toward the glutes, hips stay on the bench",
  },
  "hip-thrust": {
    label: "Zijkant, schouders op bank",
    angle: "pure side view, eye level, camera perpendicular to the bench",
    bodyOrientation: "mannequin lying on the floor, upper back against a bench, barbell over hips",
    startPose: "hips lowered near the floor, barbell resting on hips, knees bent, feet flat",
    endPose: "hips lifted so torso forms a straight line from knees to shoulders, barbell stays on hips",
  },
  "calf-raise": {
    label: "Machine: zijkant, staand",
    angle: "pure side view, eye level",
    machineView: "full standing calf raise machine or platform visible, shoulders under pads if present",
    bodyOrientation: "mannequin standing upright, feet on the edge of a platform, full body visible",
    startPose: "heels dropped below the platform, ankles stretched, knees straight",
    endPose: "heels raised as high as possible, body upright, weight on the balls of the feet",
  },

  // ===== CHEST =====
  "barbell-bench-press": {
    label: "Bovenaanzicht, liggen op bank",
    angle: "straight top-down view from above the bench, camera centered on the chest",
    bodyOrientation: "mannequin lying flat on its back on a bench, head at the top of the frame, feet at the bottom",
    startPose: "arms bent, barbell hovering just above the lower chest, elbows tucked",
    endPose: "arms straight, barbell pressed directly above the chest, elbows locked",
  },
  "incline-db-press": {
    label: "Schuine zijkant, bank 45°",
    angle: "three-quarter front-side view, eye level, looking at the upper body from the right side of the bench",
    bodyOrientation: "mannequin reclined on an incline bench, head at the top, feet lower",
    startPose: "dumbbells at chest level, elbows bent about 90°",
    endPose: "dumbbells pressed above the upper chest, arms almost straight, palms facing forward",
  },
  "cable-fly": {
    label: "Vooraanzicht, staand tussen kabels",
    angle: "straight front view, eye level",
    bodyOrientation: "mannequin standing facing the camera, centered between two high cable pulleys",
    startPose: "arms outstretched to the sides at shoulder height, elbows slightly bent, cables pulled wide",
    endPose: "hands brought together in front of the chest in a wide arc, cables crossed low in front",
  },
  "push-up": {
    label: "Zijkant, plank",
    angle: "three-quarter side view slightly from the front, low eye level",
    bodyOrientation: "mannequin in a high plank, body straight from head to heels",
    startPose: "arms straight, chest above the floor, body in one line",
    endPose: "chest lowered close to the floor, elbows bent back at about 45°, body still straight",
  },

  // ===== BACK =====
  "lat-pulldown": {
    label: "Machine: schuin achter, zittend",
    angle: "three-quarter front view from slightly above and in front, eye level",
    machineView: "lat pulldown machine frame visible behind the mannequin, bar/cable coming down from the top",
    bodyOrientation: "mannequin sitting facing the camera, thighs under pads, arms reaching up to the bar",
    startPose: "arms extended overhead gripping the bar, torso upright, shoulders relaxed",
    endPose: "bar pulled down to the upper chest, elbows tucked down, shoulder blades squeezed",
  },
  "barbell-row": {
    label: "Zijkant, heupscharnier",
    angle: "pure side view, eye level",
    bodyOrientation: "mannequin bent forward at the hips, back flat, barbell hanging below the shoulders",
    startPose: "arms straight, barbell in front of the knees, torso hinged about 45°",
    endPose: "barbell pulled to the lower chest/upper stomach, elbows back, shoulder blades squeezed",
  },
  "seated-cable-row": {
    label: "Machine: zijkant, zittend",
    angle: "pure side view, eye level, camera perpendicular to the bench/seat",
    machineView: "full seated row station visible: foot plate, cable and weight stack on the same side in both frames",
    bodyOrientation: "mannequin sitting upright on the bench, legs slightly bent, torso facing the side",
    startPose: "arms extended forward holding the handle, shoulders stretched forward",
    endPose: "handle pulled to the lower stomach, elbows back, torso still upright",
  },
  "pull-up": {
    label: "Vooraanzicht, hangend aan stang",
    angle: "straight front view, eye level, looking directly at the chest",
    bodyOrientation: "mannequin hanging from a horizontal bar, full body visible from head to feet",
    startPose: "arms fully extended, shoulders relaxed, body hanging straight",
    endPose: "chin above the bar, elbows pulled down, chest near the bar",
  },
  "deadlift": {
    label: "Zijkant, barbell vanaf vloer",
    angle: "pure side view, eye level, camera perpendicular to the barbell",
    bodyOrientation: "mannequin standing over a barbell on the floor, full body visible",
    startPose: "hips low, back flat, arms straight gripping the bar just outside the knees",
    endPose: "standing upright with the bar at hip level, shoulders back, knees and hips locked",
  },

  // ===== SHOULDERS =====
  "overhead-press": {
    label: "Vooraanzicht, staand",
    angle: "straight front view, eye level",
    bodyOrientation: "mannequin standing facing the camera, feet hip-width, barbell at shoulder height",
    startPose: "barbell at the upper chest/front shoulders, elbows directly under the bar",
    endPose: "barbell pressed overhead, arms straight, elbows locked, bar over the midline of the body",
  },
  "lateral-raise": {
    label: "Vooraanzicht, dumbbells opzij",
    angle: "straight front view, eye level",
    bodyOrientation: "mannequin standing facing the camera, dumbbells at the sides",
    startPose: "arms straight down at the sides, palms facing the body",
    endPose: "arms lifted out to the sides to shoulder height, elbows slightly bent, palms facing down",
  },
  "face-pull": {
    label: "Vooraanzicht, kabel naar gezicht",
    angle: "straight front view, eye level, camera facing the mannequin's chest and face",
    bodyOrientation: "mannequin standing facing the camera, holding a rope attached to a high pulley",
    startPose: "arms extended forward holding the rope, shoulders protracted",
    endPose: "hands pulled toward the face, elbows high and wide, shoulder blades squeezed back",
  },

  // ===== ARMS =====
  "barbell-curl": {
    label: "Vooraanzicht, barbell",
    angle: "straight front view, eye level",
    bodyOrientation: "mannequin standing facing the camera, barbell in front of the thighs",
    startPose: "arms straight down, barbell gripped with underhand grip, elbows at the sides",
    endPose: "barbell curled up to the front shoulders, elbows stay at the sides, forearms vertical",
  },
  "hammer-curl": {
    label: "Vooraanzicht, dumbbells",
    angle: "straight front view, eye level",
    bodyOrientation: "mannequin standing facing the camera, dumbbells at the sides with palms facing in",
    startPose: "arms straight down, dumbbells at the sides",
    endPose: "dumbbells curled up to shoulder height with palms still facing each other",
  },
  "triceps-pushdown": {
    label: "Zijkant, kabel high pulley",
    angle: "pure side view, eye level, camera perpendicular to the torso",
    machineView: "high pulley and cable visible above the mannequin, bar/rope descending from the same side",
    bodyOrientation: "mannequin standing facing 90° to the camera, elbows tucked at the sides",
    startPose: "forearms angled up about 90°, hands gripping the bar near chest height",
    endPose: "arms fully extended downward, bar/rope pulled down, elbows stay at the sides",
  },
  "skull-crusher": {
    label: "Zijkant, liggend op bank",
    angle: "pure side view, eye level, camera perpendicular to the bench",
    bodyOrientation: "mannequin lying on its back on a flat bench, head to the left, feet to the right",
    startPose: "arms straight up, EZ-bar above the chest/shoulders",
    endPose: "forearms lowered toward the forehead, elbows bent about 90°, upper arms vertical",
  },

  // ===== CORE =====
  plank: {
    label: "Zijkant, plank",
    angle: "pure side view, eye level, camera perpendicular to the body line",
    bodyOrientation: "mannequin in a straight line from head to heels, supported on forearms and toes",
    startPose: "body straight, hips in line with shoulders and heels, core braced",
    endPose: "same straight plank position with a very slight hip dip or brace emphasis — keep it subtle; do not collapse the body",
  },
  "hanging-leg-raise": {
    label: "Vooraanzicht, hangend",
    angle: "straight front view, eye level, camera facing the chest and legs",
    bodyOrientation: "mannequin hanging from a bar with arms extended overhead, body vertical",
    startPose: "legs straight down, body hanging passively",
    endPose: "legs lifted to 90° in front of the body, knees straight or slightly bent, torso stable",
  },
  "cable-crunch": {
    label: "Zijkant, knielend onder kabel",
    angle: "pure side view, eye level, camera perpendicular to the torso",
    machineView: "high pulley and cable visible above and in front of the mannequin",
    bodyOrientation: "mannequin kneeling on the floor, facing away from the camera, rope held behind the head",
    startPose: "torso upright, arms holding the rope near the head, hips extended",
    endPose: "torso crunched forward, elbows near the knees, back rounded",
  },
};

/** Fallback rules for any exercise id that is not in the explicit HINTS map. */
function fallbackHint(id: string, equipment?: string, name?: string): CameraHint {
  const s = (id + " " + (name ?? "")).toLowerCase();

  // Machine lower-body: leg press, extension, curl, calf, etc. — side view usually reads the joint motion best.
  if (equipment === "Machine" && /(leg|press|extension|curl|calf|glute|adductor|abductor|hip)/.test(s)) {
    return {
      label: "Machine onderlichaam: vaste zijkant, hele machine zichtbaar",
      angle: "perfect locked-off pure side view, eye level, full machine in frame; never rotate, never switch to the back or opposite side",
      machineView: "the entire machine, base, pads, rails, handles, rollers and weight stack must be visible from the exact same side in both frames; the machine stays anchored in the same position and does not disappear or transform",
      bodyOrientation: "subject positioned according to the machine (seated or lying), full body visible from head to feet, same side of the body visible in both frames",
      startPose: "ready/start position at the beginning of the range of motion",
      endPose: "end of the range of motion with limbs fully engaged; the machine and camera stay identical",
    };
  }

  // Machine upper-body: chest press, shoulder press, row, pulldown, etc.
  if (equipment === "Machine") {
    return {
      label: "Machine bovenlichaam: vaste hoek, hele machine zichtbaar",
      angle: "locked-off three-quarter front-side view, eye level, full machine in frame; never rotate, never switch to rear view or the opposite side",
      machineView: "the entire machine frame, seat or bench, handles or bar, cables or arms, and weight stack must be visible from the exact same angle in both frames; the machine stays anchored and does not disappear, slide or transform",
      bodyOrientation: "subject seated or standing facing slightly toward the camera, full body visible from head to feet, same side of the body visible in both frames",
      startPose: "ready/start position at the beginning of the range of motion",
      endPose: "end of the range of motion with arms fully engaged; the machine and camera stay identical",
    };
  }

  // Pulling / pressing vertical movements — front view shows symmetry.
  if (/(pulldown|pull-?up|chin-?up|shoulder-?press|overhead-?press|lateral-?raise|front-?raise|face-?pull|shrug|curl|extension|pushdown)/.test(s)) {
    return {
      label: "Verticale beweging: vooraanzicht",
      angle: "straight front view, eye level, locked-off tripod, full body visible from head to feet",
      bodyOrientation: "subject standing facing the camera, full body visible",
      startPose: "ready/start position at the beginning of the range of motion",
      endPose: "end of the range of motion with arms fully engaged; camera stays identical",
    };
  }

  // Push-ups / planks / dips
  if (/(push-?up|plank|dip)/.test(s)) {
    return {
      label: "Lichaamsgewicht: schuine zijkant",
      angle: "three-quarter front view from a slightly low eye level, locked-off tripod",
      bodyOrientation: "subject in a plank or supported position, body line visible from head to feet",
      startPose: "start of the movement (top or bottom position depending on the exercise)",
      endPose: "end of the movement; camera stays identical, only the body moves",
    };
  }

  // Default: side view for everything else (squat, deadlift, row, hinge, lunge, etc.)
  return {
    label: "Standaard: zijkant",
    angle: "pure side view, eye level, locked-off tripod, full body visible from head to feet",
    bodyOrientation: "subject standing or moving side-on to the camera, full body visible",
    startPose: "ready/start position at the beginning of the range of motion",
    endPose: "end of the range of motion; camera stays identical, only the body moves",
  };
}

export function getCameraHint(id: string, equipment?: string, name?: string): CameraHint {
  return HINTS[id] ?? fallbackHint(id, equipment, name);
}

export function hasExplicitCameraHint(id: string): boolean {
  return id in HINTS;
}
