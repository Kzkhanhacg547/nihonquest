import {
  ObstacleType,
  ObstacleAction,
  SpawnedObstacleSpec,
  SpawnedCollectibleSpec,
} from "./types";

export const JUMP_OBSTACLES: ObstacleType[] = [
  "LANTERN_LOW",
  "BAMBOO_HURDLE",
  "VOID_PIT",
];

export const SLIDE_OBSTACLES: ObstacleType[] = [
  "SHIMENAWA_HIGH",
  "WOODEN_BEAM",
  "LOW_GATE",
];

export const SWITCH_LANE_OBSTACLES: ObstacleType[] = [
  "SEAL_ROCK",
  "FALLEN_TREE",
  "COLLAPSED_ROAD",
];

export const ALL_ACTIVE_OBSTACLES: ObstacleType[] = [
  ...JUMP_OBSTACLES,
  ...SLIDE_OBSTACLES,
  ...SWITCH_LANE_OBSTACLES,
];

/**
 * Returns the required evasion action for a given obstacle type.
 */
export function getObstacleAction(type: ObstacleType): ObstacleAction {
  if (JUMP_OBSTACLES.includes(type) || type === "BAMBOO_BARRIER") {
    return "JUMP";
  }
  if (SLIDE_OBSTACLES.includes(type)) {
    return "SLIDE";
  }
  return "SWITCH_LANE";
}

/**
 * Returns localized Vietnamese metadata for HUD feedback & tutorials.
 */
export function getObstacleMeta(type: ObstacleType): {
  name: string;
  dodgeTip: string;
  action: ObstacleAction;
} {
  switch (type) {
    case "LANTERN_LOW":
      return {
        name: "Đèn lồng thấp",
        dodgeTip: "Nhảy lên (W / Space / Vuốt lên)",
        action: "JUMP",
      };
    case "BAMBOO_HURDLE":
      return {
        name: "Rào chắn tre thấp",
        dodgeTip: "Nhảy lên (W / Space / Vuốt lên)",
        action: "JUMP",
      };
    case "VOID_PIT":
      return {
        name: "Hố sụt linh giới",
        dodgeTip: "Nhảy vọt qua hố (W / Space / Vuốt lên)",
        action: "JUMP",
      };
    case "SHIMENAWA_HIGH":
      return {
        name: "Dây thừng Shimenawa",
        dodgeTip: "Trượt cúi người (S / Vuốt xuống)",
        action: "SLIDE",
      };
    case "WOODEN_BEAM":
      return {
        name: "Xà gỗ đền cổ",
        dodgeTip: "Trượt cúi dưới xà (S / Vuốt xuống)",
        action: "SLIDE",
      };
    case "LOW_GATE":
      return {
        name: "Cổng chắn tầm thấp",
        dodgeTip: "Trượt cúi qua cổng (S / Vuốt xuống)",
        action: "SLIDE",
      };
    case "SEAL_ROCK":
      return {
        name: "Tảng đá phong ấn",
        dodgeTip: "Đổi làn sang bên (A/D hoặc ◀/▶)",
        action: "SWITCH_LANE",
      };
    case "FALLEN_TREE":
      return {
        name: "Thân cây cổ thụ đổ",
        dodgeTip: "Đổi sang làn trống (A/D hoặc ◀/▶)",
        action: "SWITCH_LANE",
      };
    case "COLLAPSED_ROAD":
      return {
        name: "Đoạn đường sập chắn lối",
        dodgeTip: "Đổi sang làn an toàn (A/D hoặc ◀/▶)",
        action: "SWITCH_LANE",
      };
    default:
      return {
        name: "Chướng ngại linh giới",
        dodgeTip: "Đổi làn sang bên",
        action: "SWITCH_LANE",
      };
  }
}

export interface PlayerHitboxState {
  lane: 0 | 1 | 2;
  playerY: number;
  isJumping: boolean;
  isSliding: boolean;
  jumpProgress?: number;   // 0..1
  slideProgress?: number;  // 0..1
  timeSinceLaneSwitch?: number; // seconds
  isFlying?: boolean;      // True when using flying spirit beast like Yatagarasu
  flightBaseY?: number;    // Baseline cruising altitude for airborne beasts (e.g. 8.5)
}

export interface EncounterEvaluation {
  collided: boolean;
  avoided: boolean;
  perfectDodge: boolean;
  requiredAction: ObstacleAction;
}

/**
 * Pure hitbox & evasion evaluation function.
 * Ensures no single action can bypass all obstacle types:
 * - JUMP obstacles hit standing & sliding players; only cleared when airborne.
 * - SLIDE obstacles hit standing & jumping players; only cleared when sliding / diving low.
 * - SWITCH_LANE obstacles block the entire vertical column in their lane; jumping or sliding in that lane still collides!
 */
export function evaluateObstacleEncounter(
  obsType: ObstacleType,
  obsLane: 0 | 1 | 2,
  player: PlayerHitboxState
): EncounterEvaluation {
  const requiredAction = getObstacleAction(obsType);

  // If player is in a different lane
  if (obsLane !== player.lane) {
    // Check if player just performed a timely lane switch away from a SWITCH_LANE obstacle
    const justSwitched =
      requiredAction === "SWITCH_LANE" &&
      typeof player.timeSinceLaneSwitch === "number" &&
      player.timeSinceLaneSwitch > 0 &&
      player.timeSinceLaneSwitch <= 0.48;

    return {
      collided: false,
      avoided: true,
      perfectDodge: justSwitched,
      requiredAction,
    };
  }

  // Player is in the SAME lane as the obstacle:
  if (requiredAction === "JUMP") {
    const baseY = player.flightBaseY ?? 5.0;
    const clearedJump = player.isFlying
      ? player.isJumping && !player.isSliding && (player.playerY >= baseY + 0.8 || player.playerY >= 5.8)
      : player.isJumping && !player.isSliding && player.playerY >= 1.15;
    if (clearedJump) {
      const isSweetSpot = player.isFlying
        ? player.playerY >= baseY + 1.5 || player.playerY >= 6.5
        : player.playerY >= 1.55;
      return {
        collided: false,
        avoided: true,
        perfectDodge: isSweetSpot,
        requiredAction,
      };
    }
    return {
      collided: true,
      avoided: false,
      perfectDodge: false,
      requiredAction,
    };
  }

  if (requiredAction === "SLIDE") {
    const baseY = player.flightBaseY ?? 5.0;
    const clearedSlide = player.isFlying
      ? player.isSliding && !player.isJumping && (player.playerY <= baseY - 1.0 || player.playerY <= 3.8)
      : player.isSliding && !player.isJumping && player.playerY < 0.4;
    if (clearedSlide) {
      const sp = player.slideProgress ?? 0.5;
      const isSweetSpot = sp >= 0.08 && sp <= 0.85;
      return {
        collided: false,
        avoided: true,
        perfectDodge: isSweetSpot,
        requiredAction,
      };
    }
    return {
      collided: true,
      avoided: false,
      perfectDodge: false,
      requiredAction,
    };
  }

  // SWITCH_LANE obstacle in the player's current lane:
  // Cannot be jumped over or slid under!
  return {
    collided: true,
    avoided: false,
    perfectDodge: false,
    requiredAction,
  };
}

/**
 * Validates that a list of obstacle specs is 100% physically traversable.
 * Checks:
 * 1. Never blocks all 3 lanes with SWITCH_LANE obstacles within a 5m Z window.
 * 2. Obstacles on the same lane have at least `minSameLaneSpacing` (15m) so jump->slide transitions are possible.
 * 3. No overlapping obstacles in the same lane within 4m.
 */
export function validateTrackSegmentTraversable(
  obstacles: SpawnedObstacleSpec[],
  minSameLaneSpacing = 15
): { valid: boolean; reason?: string } {
  // Check 1: No 3-lane full blockades within a 5.5m Z window
  for (let i = 0; i < obstacles.length; i++) {
    const zCenter = obstacles[i].z;
    const nearby = obstacles.filter((o) => Math.abs(o.z - zCenter) <= 5.5);

    const blockedBySwitch = new Set<number>();
    nearby.forEach((o) => {
      if (o.action === "SWITCH_LANE") {
        blockedBySwitch.add(o.lane);
      }
    });

    if (blockedBySwitch.size >= 3) {
      return {
        valid: false,
        reason: `All 3 lanes blocked by impassable SWITCH_LANE obstacles near z=${zCenter}`,
      };
    }
  }

  // Check 2: Same-lane spacing
  const byLane: Record<0 | 1 | 2, SpawnedObstacleSpec[]> = { 0: [], 1: [], 2: [] };
  obstacles.forEach((o) => byLane[o.lane].push(o));

  for (const lane of [0, 1, 2] as const) {
    const list = byLane[lane].sort((a, b) => b.z - a.z); // descending z (e.g. -30 down to -85)
    for (let i = 0; i < list.length - 1; i++) {
      const dist = Math.abs(list[i].z - list[i + 1].z);
      if (dist < minSameLaneSpacing) {
        return {
          valid: false,
          reason: `Same-lane obstacles on lane ${lane} too close (${dist.toFixed(1)}m < ${minSameLaneSpacing}m)`,
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Generates a structured, rhythmic segment of obstacle clusters and spirit collectibles
 * between `startZ` (e.g. -30) and `gateZ` (e.g. -105).
 * Leaves a clear 22m buffer before `gateZ` so the player can read the Torii Question Gate clearly.
 */
export function generateTrackSegment(
  startZ: number,
  gateZ: number,
  speed = 15.0,
  rand: () => number = Math.random
): {
  obstacles: SpawnedObstacleSpec[];
  collectibles: SpawnedCollectibleSpec[];
} {
  const obstacles: SpawnedObstacleSpec[] = [];
  const collectibles: SpawnedCollectibleSpec[] = [];

  const safeEndZ = gateZ + 26; // Stop spawning 26m before gate so players have a calm reading & lane-choice corridor
  const minClusterGap = Math.max(16, Math.round(speed * 1.15));

  const pickFrom = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
  const lanes: (0 | 1 | 2)[] = [0, 1, 2];

  let cursorZ = startZ;
  let patternCounter = 0;

  while (cursorZ > safeEndZ) {
    const remainingDist = cursorZ - safeEndZ;
    const roll = rand();

    if (remainingDist >= minClusterGap + 18 && roll < 0.32) {
      // CLUSTER 1: Jump -> Slide Rhythm Sequence (Chuỗi Nhảy -> Cúi)
      const activeLane = pickFrom(lanes);
      const jumpType = pickFrom(JUMP_OBSTACLES);
      const slideType = pickFrom(SLIDE_OBSTACLES);
      const stepZ = Math.max(16, Math.round(speed * 1.12));

      obstacles.push({
        type: jumpType,
        action: "JUMP",
        lane: activeLane,
        z: cursorZ,
      });

      // Reward jumping with a high Magatama jewel right above the jump obstacle
      collectibles.push({
        type: "MAGATAMA_JEWEL",
        lane: activeLane,
        y: 2.35,
        z: cursorZ,
        points: 50,
      });

      // Second obstacle in sequence: Slide under
      const secondZ = cursorZ - stepZ;
      if (secondZ > safeEndZ) {
        obstacles.push({
          type: slideType,
          action: "SLIDE",
          lane: activeLane,
          z: secondZ,
        });

        // Low Spirit Orb under the slide beam
        collectibles.push({
          type: "SPIRIT_ORB",
          lane: activeLane,
          y: 0.55,
          z: secondZ,
          points: 50,
        });

        // Optional side block on one of the other lanes so it feels like a rich cluster
        const otherLane = ((activeLane + 1) % 3) as 0 | 1 | 2;
        obstacles.push({
          type: pickFrom(SWITCH_LANE_OBSTACLES),
          action: "SWITCH_LANE",
          lane: otherLane,
          z: cursorZ - Math.round(stepZ * 0.5),
        });

        cursorZ = secondZ - minClusterGap;
      } else {
        cursorZ -= minClusterGap;
      }
    } else if (roll < 0.62) {
      // CLUSTER 2: Double-Lane Blockade Funnel (Chắn 2 làn hoặc kết hợp Đổi làn + Nhảy/Trượt)
      const openLane = pickFrom(lanes);
      const blockedLanes = lanes.filter((l) => l !== openLane) as (0 | 1 | 2)[];

      // Block 1st lane with SWITCH_LANE obstacle
      obstacles.push({
        type: pickFrom(SWITCH_LANE_OBSTACLES),
        action: "SWITCH_LANE",
        lane: blockedLanes[0],
        z: cursorZ,
      });

      // 2nd lane either gets a SWITCH_LANE obstacle or a JUMP/SLIDE tactical obstacle
      if (rand() < 0.55) {
        obstacles.push({
          type: pickFrom(SWITCH_LANE_OBSTACLES),
          action: "SWITCH_LANE",
          lane: blockedLanes[1],
          z: cursorZ,
        });
      } else {
        const altAction = rand() < 0.5 ? "JUMP" : "SLIDE";
        const altType =
          altAction === "JUMP" ? pickFrom(JUMP_OBSTACLES) : pickFrom(SLIDE_OBSTACLES);
        obstacles.push({
          type: altType,
          action: altAction,
          lane: blockedLanes[1],
          z: cursorZ,
        });
      }

      // Place a guiding Magatama jewel in the safe open lane
      collectibles.push({
        type: "MAGATAMA_JEWEL",
        lane: openLane,
        y: 1.0,
        z: cursorZ,
        points: 50,
      });

      cursorZ -= minClusterGap;
    } else {
      // CLUSTER 3: Tri-Tactical Choice or Single Challenge with Collectible Trail
      const shuffledLanes = [...lanes].sort(() => rand() - 0.5) as [0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2];
      const primaryAction: ObstacleAction =
        patternCounter % 3 === 0
          ? "JUMP"
          : patternCounter % 3 === 1
          ? "SLIDE"
          : "SWITCH_LANE";

      const primaryType =
        primaryAction === "JUMP"
          ? pickFrom(JUMP_OBSTACLES)
          : primaryAction === "SLIDE"
          ? pickFrom(SLIDE_OBSTACLES)
          : pickFrom(SWITCH_LANE_OBSTACLES);

      obstacles.push({
        type: primaryType,
        action: primaryAction,
        lane: shuffledLanes[0],
        z: cursorZ,
      });

      // Add a complementary obstacle in second lane (never blocking all 3 lanes)
      const secondAction: ObstacleAction = primaryAction === "JUMP" ? "SLIDE" : "JUMP";
      const secondType =
        secondAction === "JUMP" ? pickFrom(JUMP_OBSTACLES) : pickFrom(SLIDE_OBSTACLES);

      obstacles.push({
        type: secondType,
        action: secondAction,
        lane: shuffledLanes[1],
        z: cursorZ,
      });

      // Collectible in either the jump arc or the open third lane
      if (primaryAction === "JUMP") {
        collectibles.push({
          type: "MAGATAMA_JEWEL",
          lane: shuffledLanes[0],
          y: 2.35,
          z: cursorZ,
          points: 50,
        });
      } else {
        collectibles.push({
          type: "SPIRIT_ORB",
          lane: shuffledLanes[2],
          y: 1.0,
          z: cursorZ,
          points: 50,
        });
      }

      cursorZ -= minClusterGap;
    }

    patternCounter++;
  }

  return { obstacles, collectibles };
}

