import { describe, it, expect } from "vitest";
import { SPIRIT_BEASTS, GAME_ZONES, INITIAL_DAILY_QUESTS } from "./constants";
import { fetchYokaiQuestions } from "./questions";

describe("Yōkai Dash — Game Configuration & Logic", () => {
  it("defines all spirit beasts with unique IDs, elements, and perks", () => {
    expect(SPIRIT_BEASTS.length).toBeGreaterThanOrEqual(4);
    const ids = SPIRIT_BEASTS.map((b) => b.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);

    SPIRIT_BEASTS.forEach((beast) => {
      expect(beast.name).toBeTruthy();
      expect(beast.perk).toBeTruthy();
      expect(beast.avatarIcon).toBeTruthy();
      expect(beast.bonusType).toMatch(/COMBO_BONUS|EXTRA_TIME|XP_BOOST|SHIELD_ONE|MAGNET/);
    });
  });

  it("defines all game zones covering JLPT levels and Listening", () => {
    expect(GAME_ZONES.length).toBeGreaterThanOrEqual(4);
    const levels = GAME_ZONES.map((z) => z.level);
    expect(levels).toContain("KANA");
    expect(levels).toContain("N5");
    expect(levels).toContain("N4");
    expect(levels).toContain("N3");
    expect(levels).toContain("LISTENING");
  });

  it("verifies daily quests have valid targets and rewards", () => {
    expect(INITIAL_DAILY_QUESTS.length).toBeGreaterThanOrEqual(3);
    INITIAL_DAILY_QUESTS.forEach((q) => {
      expect(q.target).toBeGreaterThan(0);
      expect(q.rewardXP).toBeGreaterThan(0);
      expect(q.title).toBeTruthy();
    });
  });

  it("generates questions with 3 options and valid correct lane for KANA", async () => {
    const questions = await fetchYokaiQuestions("KANA", 5);
    expect(questions.length).toBe(5);
    questions.forEach((q) => {
      expect(q.options.length).toBe(3);
      expect([0, 1, 2]).toContain(q.correctLane);
      expect(q.options[q.correctLane]).toBeTruthy();
      expect(q.prompt).toBeTruthy();
      expect(q.explanation).toBeTruthy();
    });
  }, 15000);

  it("generates questions for N5, N4, and N3 levels", async () => {
    const levels = ["N5", "N4", "N3", "LISTENING"] as const;
    const results = await Promise.all(levels.map((level) => fetchYokaiQuestions(level, 4)));
    for (const questions of results) {
      expect(questions.length).toBe(4);
      questions.forEach((q) => {
        expect(q.options.length).toBe(3);
        expect([0, 1, 2]).toContain(q.correctLane);
        expect(q.prompt).toBeTruthy();
      });
    }
  }, 15000);

  it("builds custom 3D models with distinct parts and limbs for all 5 Spirit Beasts", async () => {
    const { createBeast3DModel, animateBeastMotion } = await import(
      "@/components/yokai-dash/models/YokaiBeast3D"
    );

    for (const beast of SPIRIT_BEASTS) {
      const bundle = createBeast3DModel(beast);
      expect(bundle.group).toBeTruthy();
      expect(bundle.id).toBe(beast.id);
      expect(bundle.parts.body).toBeTruthy();
      expect(bundle.parts.limbs?.length).toBeGreaterThanOrEqual(2);

      // Test active running motion animation
      animateBeastMotion(bundle, 1000, {
        speed: 15.0,
        currentX: 0,
        targetX: 2.6,
        playerY: 0,
        isJumping: false,
        isSliding: false,
      });

      // Test jump animation
      animateBeastMotion(bundle, 1200, {
        speed: 16.0,
        currentX: 2.6,
        targetX: 2.6,
        playerY: 2.0,
        isJumping: true,
        isSliding: false,
      });

      // Test slide animation
      animateBeastMotion(bundle, 1400, {
        speed: 16.0,
        currentX: 2.6,
        targetX: 2.6,
        playerY: 0,
        isJumping: false,
        isSliding: true,
      });

      // Test landing squash recovery animation
      animateBeastMotion(bundle, 1500, {
        speed: 16.0,
        currentX: 2.6,
        targetX: 2.6,
        playerY: 0,
        isJumping: false,
        isSliding: false,
        landingSquash: 0.8,
      });

      // Test collision stumble animation
      animateBeastMotion(bundle, 1550, {
        speed: 15.0,
        currentX: 0,
        targetX: 0,
        playerY: 0,
        isJumping: false,
        isSliding: false,
        stumble: 0.9,
      });

      // Test correct gate cheer animation
      animateBeastMotion(bundle, 1580, {
        speed: 15.0,
        currentX: 0,
        targetX: 0,
        playerY: 0,
        isJumping: false,
        isSliding: false,
        cheer: 0.85,
      });

      // Test victory celebration animation
      animateBeastMotion(bundle, 1590, {
        speed: 15.0,
        currentX: 0,
        targetX: 0,
        playerY: 0,
        isJumping: false,
        isSliding: false,
        isVictory: true,
      });

      // Test idle showcase animation
      animateBeastMotion(bundle, 1600, {
        speed: 0,
        currentX: 0,
        targetX: 0,
        playerY: 0,
        isJumping: false,
        isSliding: false,
        isIdle: true,
      });
    }
  }, 25000);

  it("builds and animates Chaser Yōkai 3D model reacting to combo and hearts", async () => {
    const { createChaserYokai3DModel, animateChaserYokai } = await import(
      "@/components/yokai-dash/models/YokaiBeast3D"
    );

    const chaser = createChaserYokai3DModel();
    expect(chaser.group).toBeTruthy();
    expect(chaser.eyes.length).toBe(2);
    expect(chaser.wisps.length).toBe(4);

    chaser.group.position.set(0, 0, 5.0);
    // Low health -> surges closer
    animateChaserYokai(chaser, 1000, -2.6, 1, 0);
    expect(chaser.group.position.z).toBeLessThan(5.0);

    // High combo -> pushed back
    chaser.group.position.set(0, 0, 5.0);
    animateChaserYokai(chaser, 2000, 2.6, 3, 6);
    expect(chaser.group.position.z).toBeGreaterThan(5.0);
  });

  it("validates 3 distinct obstacle tactical categories (JUMP, SLIDE, SWITCH_LANE) and enforces strict hitboxes", async () => {
    const {
      JUMP_OBSTACLES,
      SLIDE_OBSTACLES,
      SWITCH_LANE_OBSTACLES,
      getObstacleAction,
      getObstacleMeta,
      evaluateObstacleEncounter,
    } = await import("./generator");

    expect(JUMP_OBSTACLES.length).toBeGreaterThanOrEqual(3);
    expect(SLIDE_OBSTACLES.length).toBeGreaterThanOrEqual(3);
    expect(SWITCH_LANE_OBSTACLES.length).toBeGreaterThanOrEqual(3);

    // 1. JUMP Obstacles: cleared ONLY by jumping; sliding or standing collides
    for (const obsType of JUMP_OBSTACLES) {
      expect(getObstacleAction(obsType)).toBe("JUMP");
      expect(getObstacleMeta(obsType).name).toBeTruthy();

      // Standing -> collides
      const standRes = evaluateObstacleEncounter(obsType, 1, {
        lane: 1,
        playerY: 0,
        isJumping: false,
        isSliding: false,
      });
      expect(standRes.collided).toBe(true);

      // Sliding -> collides (cannot slide through low hurdle/pit)
      const slideRes = evaluateObstacleEncounter(obsType, 1, {
        lane: 1,
        playerY: 0,
        isJumping: false,
        isSliding: true,
      });
      expect(slideRes.collided).toBe(true);

      // Jumping high -> avoided + perfect dodge at apex
      const jumpRes = evaluateObstacleEncounter(obsType, 1, {
        lane: 1,
        playerY: 2.1,
        isJumping: true,
        isSliding: false,
      });
      expect(jumpRes.collided).toBe(false);
      expect(jumpRes.avoided).toBe(true);
      expect(jumpRes.perfectDodge).toBe(true);
    }

    // 2. SLIDE Obstacles: cleared ONLY by sliding; jumping or standing collides
    for (const obsType of SLIDE_OBSTACLES) {
      expect(getObstacleAction(obsType)).toBe("SLIDE");
      expect(getObstacleMeta(obsType).name).toBeTruthy();

      // Standing -> collides
      const standRes = evaluateObstacleEncounter(obsType, 0, {
        lane: 0,
        playerY: 0,
        isJumping: false,
        isSliding: false,
      });
      expect(standRes.collided).toBe(true);

      // Jumping -> collides (jumping into overhead beam!)
      const jumpRes = evaluateObstacleEncounter(obsType, 0, {
        lane: 0,
        playerY: 2.0,
        isJumping: true,
        isSliding: false,
      });
      expect(jumpRes.collided).toBe(true);

      // Sliding -> avoided + perfect dodge
      const slideRes = evaluateObstacleEncounter(obsType, 0, {
        lane: 0,
        playerY: 0,
        isJumping: false,
        isSliding: true,
        slideProgress: 0.4,
      });
      expect(slideRes.collided).toBe(false);
      expect(slideRes.avoided).toBe(true);
      expect(slideRes.perfectDodge).toBe(true);
    }

    // 3. SWITCH_LANE Obstacles: neither jump nor slide works in same lane; must switch lane
    for (const obsType of SWITCH_LANE_OBSTACLES) {
      expect(getObstacleAction(obsType)).toBe("SWITCH_LANE");
      expect(getObstacleMeta(obsType).name).toBeTruthy();

      // Standing in same lane -> collides
      expect(
        evaluateObstacleEncounter(obsType, 2, {
          lane: 2,
          playerY: 0,
          isJumping: false,
          isSliding: false,
        }).collided
      ).toBe(true);

      // Jumping in same lane -> collides
      expect(
        evaluateObstacleEncounter(obsType, 2, {
          lane: 2,
          playerY: 2.4,
          isJumping: true,
          isSliding: false,
        }).collided
      ).toBe(true);

      // Sliding in same lane -> collides
      expect(
        evaluateObstacleEncounter(obsType, 2, {
          lane: 2,
          playerY: 0,
          isJumping: false,
          isSliding: true,
        }).collided
      ).toBe(true);

      // Switched to different lane -> avoided + perfectDodge when timely
      const switchedRes = evaluateObstacleEncounter(obsType, 2, {
        lane: 1,
        playerY: 0,
        isJumping: false,
        isSliding: false,
        timeSinceLaneSwitch: 0.25,
      });
      expect(switchedRes.collided).toBe(false);
      expect(switchedRes.avoided).toBe(true);
      expect(switchedRes.perfectDodge).toBe(true);
    }
  });

  it("generates 100% traversable obstacle clusters with safe gate buffer and collectibles", async () => {
    const { generateTrackSegment, validateTrackSegmentTraversable } = await import(
      "./generator"
    );

    for (let run = 0; run < 60; run++) {
      const speed = 14 + (run % 7);
      const gateZ = -100 - (run % 15);
      const segment = generateTrackSegment(-30, gateZ, speed);

      expect(segment.obstacles.length).toBeGreaterThan(0);
      expect(segment.collectibles.length).toBeGreaterThan(0);

      // Validate traversability (never 3 lanes blocked by impassable wall, valid same-lane spacing)
      const check = validateTrackSegmentTraversable(segment.obstacles, 15);
      expect(check.valid).toBe(true);

      // Verify 20m+ safe buffer before Question Gate
      segment.obstacles.forEach((obs) => {
        expect(obs.z).toBeGreaterThan(gateZ + 20);
        expect([0, 1, 2]).toContain(obs.lane);
      });

      // Verify collectibles
      segment.collectibles.forEach((col) => {
        expect([0, 1, 2]).toContain(col.lane);
        expect(col.points).toBeGreaterThan(0);
        expect(col.type).toMatch(/MAGATAMA_JEWEL|SPIRIT_ORB/);
      });
    }
  });

  it("exposes all procedural sound methods on yokaiSound without throwing", async () => {
    const { yokaiSound } = await import("./sound");
    yokaiSound.setMuted(true);
    expect(yokaiSound.getMuted()).toBe(true);

    expect(() => {
      yokaiSound.playJump();
      yokaiSound.playDash();
      yokaiSound.playTaikoHit();
      yokaiSound.playCorrectGate();
      yokaiSound.playHyoshigiClap();
      yokaiSound.playCollectOrb();
      yokaiSound.playPerfectDodge();
      yokaiSound.playLandDust();
      yokaiSound.playChaserGrowl();
      yokaiSound.playVictory();
      yokaiSound.playDefeat();
    }).not.toThrow();

    yokaiSound.setMuted(false);
  });

  it("safely disposes Three.js scenes, meshes, and materials without throwing", async () => {
    const THREE = await import("three");
    const { disposeThreeHierarchy } = await import("./three-utils");

    const scene = new THREE.Scene();
    const mesh1 = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0xff0000 })
    );
    const mesh2 = new THREE.Mesh(
      new THREE.SphereGeometry(1, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    const subGroup = new THREE.Group();
    subGroup.add(mesh2);
    scene.add(mesh1);
    scene.add(subGroup);

    expect(scene.children.length).toBe(2);

    // Call disposal
    disposeThreeHierarchy(scene);

    // Confirm scene is cleared and children removed
    expect(scene.children.length).toBe(0);
  });

  it("filters questions accurately by custom question modes", async () => {
    const wordQuestions = await fetchYokaiQuestions("N5", 3, "WORD_TO_MEANING");
    expect(wordQuestions.length).toBeGreaterThan(0);
    wordQuestions.forEach((q) => {
      expect(["WORD_TO_MEANING", "VOCAB", undefined]).toContain(q.questionType);
    });

    const grammarQuestions = await fetchYokaiQuestions("N5", 3, "LESSON_GRAMMAR");
    expect(grammarQuestions.length).toBeGreaterThan(0);
    grammarQuestions.forEach((q) => {
      expect(["LESSON_GRAMMAR", "GRAMMAR", undefined]).toContain(q.questionType);
    });
  }, 15000);

  it("evaluates Yatagarasu airborne flight mechanics accurately for JUMP, SLIDE, and SWITCH_LANE", async () => {
    const { evaluateObstacleEncounter } = await import("./generator");

    // 1. JUMP in the sky: Yatagarasu cruises at 5.0m; jumping soars to 6.8m -> clears
    const jumpAirRes = evaluateObstacleEncounter("LANTERN_LOW", 1, {
      lane: 1,
      playerY: 6.8,
      isJumping: true,
      isSliding: false,
      isFlying: true,
    });
    expect(jumpAirRes.collided).toBe(false);
    expect(jumpAirRes.avoided).toBe(true);

    // Cruising without jumping into low air hurdle -> collides
    const cruiseHitRes = evaluateObstacleEncounter("LANTERN_LOW", 1, {
      lane: 1,
      playerY: 5.0,
      isJumping: false,
      isSliding: false,
      isFlying: true,
    });
    expect(cruiseHitRes.collided).toBe(true);

    // 2. SLIDE in the sky: Falcon dive drops to <= 3.8m -> clears overhead shimenawa
    const diveAirRes = evaluateObstacleEncounter("SHIMENAWA_HIGH", 2, {
      lane: 2,
      playerY: 3.2,
      isJumping: false,
      isSliding: true,
      slideProgress: 0.4,
      isFlying: true,
    });
    expect(diveAirRes.collided).toBe(false);
    expect(diveAirRes.avoided).toBe(true);

    // Cruising without diving into high shimenawa -> collides
    const cruiseHighHit = evaluateObstacleEncounter("SHIMENAWA_HIGH", 2, {
      lane: 2,
      playerY: 5.0,
      isJumping: false,
      isSliding: false,
      isFlying: true,
    });
    expect(cruiseHighHit.collided).toBe(true);

    // 3. SWITCH_LANE in the sky: lane dodge clears
    const switchAirRes = evaluateObstacleEncounter("SEAL_ROCK", 0, {
      lane: 1,
      playerY: 5.0,
      isJumping: false,
      isSliding: false,
      timeSinceLaneSwitch: 0.2,
      isFlying: true,
    });
    expect(switchAirRes.collided).toBe(false);
    expect(switchAirRes.avoided).toBe(true);
    expect(switchAirRes.perfectDodge).toBe(true);

    // 4. High-altitude flight (Y = 8.5m): Yatagarasu soaring to 11.3m or diving to 6.0m
    const highJumpRes = evaluateObstacleEncounter("LANTERN_LOW", 1, {
      lane: 1,
      playerY: 11.3,
      flightBaseY: 8.5,
      isJumping: true,
      isSliding: false,
      isFlying: true,
    });
    expect(highJumpRes.collided).toBe(false);
    expect(highJumpRes.avoided).toBe(true);
    expect(highJumpRes.perfectDodge).toBe(true);

    const highDiveRes = evaluateObstacleEncounter("SHIMENAWA_HIGH", 2, {
      lane: 2,
      playerY: 6.0,
      flightBaseY: 8.5,
      isJumping: false,
      isSliding: true,
      slideProgress: 0.45,
      isFlying: true,
    });
    expect(highDiveRes.collided).toBe(false);
    expect(highDiveRes.avoided).toBe(true);
    expect(highDiveRes.perfectDodge).toBe(true);
  });
});




