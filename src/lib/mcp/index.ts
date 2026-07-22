import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getProfile from "./tools/get-profile";
import listRecentWorkouts from "./tools/list-recent-workouts";
import listRecentActivities from "./tools/list-recent-activities";
import logActivity from "./tools/log-activity";
import setCurrentWeight from "./tools/set-weight";

// OAuth issuer must be the direct Supabase host (not the .lovable.cloud proxy).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "alyva-mcp",
  title: "Alyva",
  version: "0.1.0",
  instructions:
    "Alyva health & fitness tools. Use `get_profile` to read the user's goals and macro targets. Use `list_recent_workouts` and `list_recent_activities` to review recent training. Use `log_activity` to record a completed cardio session, and `set_current_weight` to update body weight.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getProfile, listRecentWorkouts, listRecentActivities, logActivity, setCurrentWeight],
});
