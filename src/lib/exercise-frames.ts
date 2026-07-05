// Client helper: build the URL for an AI-generated exercise frame stored in the
// `exercise-frames` Cloud Storage bucket. Frames are served through our own
// proxy route so we can keep the bucket private and set long-cache headers.

export function getExerciseFrameUrl(exerciseId: string, frameIndex: 0 | 1): string {
  return `/api/exercise-frame/${encodeURIComponent(exerciseId)}/${frameIndex}`;
}

export function getExerciseFrameUrls(exerciseId: string): [string, string] {
  return [getExerciseFrameUrl(exerciseId, 0), getExerciseFrameUrl(exerciseId, 1)];
}
