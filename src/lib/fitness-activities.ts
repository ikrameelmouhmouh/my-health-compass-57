import { Activity, Bike, Footprints, HeartPulse, Mountain, Trees, Waves } from "lucide-react";

export type ActivityCategory = "Cardio" | "Outdoor" | "Sport" | "Wellness";

export type ActivityItem = {
  id: string;
  icon: typeof Activity;
  kcalPerHour: number;
  category: ActivityCategory;
};

export const ACTIVITIES: ActivityItem[] = [
  { id: "swim", icon: Waves, kcalPerHour: 500, category: "Cardio" },
  { id: "bike", icon: Bike, kcalPerHour: 450, category: "Outdoor" },
  { id: "run-outdoor", icon: Footprints, kcalPerHour: 600, category: "Outdoor" },
  { id: "walk", icon: Trees, kcalPerHour: 250, category: "Outdoor" },
  { id: "hike", icon: Mountain, kcalPerHour: 400, category: "Outdoor" },
  { id: "football", icon: Activity, kcalPerHour: 550, category: "Sport" },
  { id: "basketball", icon: Activity, kcalPerHour: 500, category: "Sport" },
  { id: "tennis", icon: Activity, kcalPerHour: 450, category: "Sport" },
  { id: "padel", icon: Activity, kcalPerHour: 420, category: "Sport" },
  { id: "boxing", icon: Activity, kcalPerHour: 650, category: "Sport" },
  { id: "yoga", icon: HeartPulse, kcalPerHour: 250, category: "Wellness" },
  { id: "hiit", icon: Activity, kcalPerHour: 700, category: "Cardio" },
];