export function canUnlockJourney(args: {
  locationOrder: number;
  requirementXp: number;
  totalXP: number;
  previousCompleted: boolean;
}): boolean {
  if (args.locationOrder === 0) return true;
  return args.totalXP >= args.requirementXp;
}

export function resolveJourneyStatus(args: {
  currentStatus?: string | null;
  locationOrder: number;
  requirementXp: number;
  totalXP: number;
  previousCompleted: boolean;
  progress?: number | null;
}): "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "COMPLETED" {
  const status = args.currentStatus ?? "LOCKED";

  if (status === "COMPLETED" || (args.progress !== undefined && args.progress !== null && args.progress >= 100)) {
    return "COMPLETED";
  }

  if (status === "IN_PROGRESS") {
    return "IN_PROGRESS";
  }

  const unlocked = args.locationOrder === 0 || args.totalXP >= args.requirementXp;
  return unlocked ? "AVAILABLE" : "LOCKED";
}
