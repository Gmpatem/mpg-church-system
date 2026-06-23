export const churchMotionClasses = {
  content: "church-motion-content",
  tab: "church-motion-tab",
  rail: "church-motion-rail",
  presence: "church-motion-presence",
  updated: "church-updated-highlight",
} as const;

export type ChurchMotionClassName =
  (typeof churchMotionClasses)[keyof typeof churchMotionClasses];
