import * as THREE from "three";

/* =====================================================================
 * zone-scenery.ts
 * Môi trường 3D + skin chướng ngại vật riêng cho từng map Yōkai Dash.
 * Đặt tại: lib/yokai-dash/zone-scenery.ts
 * ===================================================================== */

export interface ZoneTheme {
  id: string;
  skyTop: number;
  skyMid: number;
  skyBottom: number;
  fogColor: number;
  fogDensity: number;
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  rimColor: number;
  rimIntensity: number;
  dirColor: number;
  dirIntensity: number;
  lanternGlowColor: number;
  accent: number;
  toriiColor: number;
  toriiSpacing: number;
  deck: number;
  deckEmissive: number;
  under: "water" | "clouds";
  underColor: number;
  underEmissive: number;
  celestial: { kind: "moon" | "sun"; color: number; halo: number; x: number; y: number; z: number; r: number };
  stars: number;
  treeBlob: number[];
  petalColor: number;
  lanternWindow: number;
  railColor: number;
  railTrim: number;
  cloudLow: number;
  cloudHigh: number;
  rock: number;
  grass: number;
}

const THEMES: Record<string, ZoneTheme> = {
  torii_path: {
    id: "torii_path",
    skyTop: 0x1a0b3d, skyMid: 0x7a2a8c, skyBottom: 0xf06aa8,
    fogColor: 0x6a2a6e, fogDensity: 0.014,
    hemiSky: 0xc9b8ff, hemiGround: 0x5a1f3a, hemiIntensity: 1.2,
    rimColor: 0xff7ad0, rimIntensity: 1.3, dirColor: 0xffe6d0, dirIntensity: 1.8,
    lanternGlowColor: 0xffa040, accent: 0xff5a3c,
    toriiColor: 0xd8281e, toriiSpacing: 14,
    deck: 0x8a7aa8, deckEmissive: 0x2a1030,
    under: "clouds", underColor: 0x4a2466, underEmissive: 0x1a0830,
    celestial: { kind: "moon", color: 0xfff0dc, halo: 0xff9fd0, x: 70, y: 62, z: -250, r: 17 },
    stars: 120, treeBlob: [0xff8fc4, 0xffb0d6], petalColor: 0xffb7d5, lanternWindow: 0xffc26b,
    railColor: 0xc4231a, railTrim: 0x1a1014,
    cloudLow: 0xb25ad8, cloudHigh: 0xff9ad0, rock: 0x5a3a6a, grass: 0x3a6a4a,
  },
  sakura_grove: {
    id: "sakura_grove",
    skyTop: 0x1d0f4a, skyMid: 0x8a3fa0, skyBottom: 0xff7fb8,
    fogColor: 0x8a3f9a, fogDensity: 0.012,
    hemiSky: 0xe0c8ff, hemiGround: 0x6b2a52, hemiIntensity: 1.25,
    rimColor: 0xff9be0, rimIntensity: 1.4, dirColor: 0xfff0e8, dirIntensity: 2.0,
    lanternGlowColor: 0xffb070, accent: 0xff5fa8,
    toriiColor: 0xe0301f, toriiSpacing: 35,
    deck: 0x9a88b4, deckEmissive: 0x2a1236,
    under: "water", underColor: 0x2a2a7a, underEmissive: 0x120a40,
    celestial: { kind: "moon", color: 0xffc4de, halo: 0xff7fc0, x: 60, y: 58, z: -250, r: 22 },
    stars: 100, treeBlob: [0xff6fb5, 0xff9bd0, 0xffc2e2], petalColor: 0xffb0d0, lanternWindow: 0xffb45c,
    railColor: 0xd42a1c, railTrim: 0x1a1014,
    cloudLow: 0xc070d8, cloudHigh: 0xff9ad0, rock: 0x5a4a7a, grass: 0x3a7a5a,
  },
  moonlight_shrine: {
    id: "moonlight_shrine",
    skyTop: 0x050a2e, skyMid: 0x1a1f6a, skyBottom: 0x4a3a9a,
    fogColor: 0x1e2160, fogDensity: 0.016,
    hemiSky: 0x8fa4ff, hemiGround: 0x1a1a4a, hemiIntensity: 1.05,
    rimColor: 0x7ab8ff, rimIntensity: 1.5, dirColor: 0xb8c8ff, dirIntensity: 1.5,
    lanternGlowColor: 0xffa860, accent: 0x4fe8ff,
    toriiColor: 0xb02218, toriiSpacing: 35,
    deck: 0x6a74a8, deckEmissive: 0x101840,
    under: "water", underColor: 0x0c1450, underEmissive: 0x050a28,
    celestial: { kind: "moon", color: 0xf4f6ff, halo: 0x8fb0ff, x: -45, y: 64, z: -250, r: 20 },
    stars: 220, treeBlob: [0xff8fc4, 0xffb0d6], petalColor: 0xffb0dc, lanternWindow: 0xffb45c,
    railColor: 0x9a1a14, railTrim: 0x120c14,
    cloudLow: 0x3a3f9a, cloudHigh: 0x2a2f78, rock: 0x232a52, grass: 0x1f5a52,
  },
  fuji_summit: {
    id: "fuji_summit",
    skyTop: 0x3d7fd8, skyMid: 0xf6a6c6, skyBottom: 0xffe2a8,
    fogColor: 0xf8c8dc, fogDensity: 0.007,
    hemiSky: 0xfff0ff, hemiGround: 0xd0a0c0, hemiIntensity: 1.5,
    rimColor: 0xffd9a0, rimIntensity: 1.2, dirColor: 0xfff4e0, dirIntensity: 2.4,
    lanternGlowColor: 0xffcc80, accent: 0xffd36b,
    toriiColor: 0xe02a1c, toriiSpacing: 35,
    deck: 0xb8a0c0, deckEmissive: 0x302040,
    under: "clouds", underColor: 0xf0b8d8, underEmissive: 0x402040,
    celestial: { kind: "sun", color: 0xfff6d0, halo: 0xffd080, x: 46, y: 88, z: -285, r: 24 },
    stars: 0, treeBlob: [0xffa6cc, 0xffc8de, 0xffe0ec], petalColor: 0xffc0da, lanternWindow: 0xffd090,
    railColor: 0xd42a1c, railTrim: 0xe8b84a,
    cloudLow: 0xffd8ec, cloudHigh: 0xffffff, rock: 0x7a6a9a, grass: 0x6aa878,
  },
  listening_realm: {
    id: "listening_realm",
    skyTop: 0x120a46, skyMid: 0x6a2ab8, skyBottom: 0xff7ad8,
    fogColor: 0x4a1f90, fogDensity: 0.011,
    hemiSky: 0xc8b8ff, hemiGround: 0x3a1a6a, hemiIntensity: 1.2,
    rimColor: 0x4fe8ff, rimIntensity: 1.5, dirColor: 0xe8e0ff, dirIntensity: 1.7,
    lanternGlowColor: 0xff9a70, accent: 0x4fe8ff,
    toriiColor: 0xe0281e, toriiSpacing: 40,
    deck: 0x6a5a9a, deckEmissive: 0x201050,
    under: "water", underColor: 0x2a1a8a, underEmissive: 0x180a60,
    celestial: { kind: "moon", color: 0xffe8ff, halo: 0xd080ff, x: 0, y: 60, z: -260, r: 24 },
    stars: 110, treeBlob: [0xff7ad0, 0xffa0e0], petalColor: 0xff9be6, lanternWindow: 0xffb06a,
    railColor: 0xc02818, railTrim: 0x120c14,
    cloudLow: 0xa060f0, cloudHigh: 0xff90e0, rock: 0x4a3a8a, grass: 0x2f8a78,
  },
  kansai_festival: {
    id: "kansai_festival",
    skyTop: 0x0b0630, skyMid: 0x4a1458, skyBottom: 0xff5a3c,
    fogColor: 0x5a1a40, fogDensity: 0.015,
    hemiSky: 0xffc8b0, hemiGround: 0x4a1a30, hemiIntensity: 1.2,
    rimColor: 0xff7050, rimIntensity: 1.3, dirColor: 0xffe0c0, dirIntensity: 1.7,
    lanternGlowColor: 0xff8a40, accent: 0xffa040,
    toriiColor: 0xd8281a, toriiSpacing: 35,
    deck: 0x8a6a7a, deckEmissive: 0x301018,
    under: "water", underColor: 0x1a1250, underEmissive: 0x0a0630,
    celestial: { kind: "moon", color: 0xffe8d0, halo: 0xffb090, x: 58, y: 50, z: -240, r: 14 },
    stars: 160, treeBlob: [0xff8fc0, 0xffb0d4], petalColor: 0xffb0c8, lanternWindow: 0xffb050,
    railColor: 0xb81c14, railTrim: 0x120c14,
    cloudLow: 0x6a2a70, cloudHigh: 0x7a2a5a, rock: 0x3a2a4a, grass: 0x2a5a3a,
  },
};

export function getZoneTheme(id: string): ZoneTheme {
  return THEMES[id] ?? THEMES.torii_path;
}

/* ------------------------------ helpers ------------------------------ */

class Tracker {
  geos: THREE.BufferGeometry[] = [];
  mats: THREE.Material[] = [];
  texs: THREE.Texture[] = [];
  g<T extends THREE.BufferGeometry>(x: T): T { this.geos.push(x); return x; }
  m<T extends THREE.Material>(x: T): T { this.mats.push(x); return x; }
  t<T extends THREE.Texture>(x: T): T { this.texs.push(x); return x; }
  disposeAll() {
    this.geos.forEach((x) => x.dispose());
    this.mats.forEach((x) => x.dispose());
    this.texs.forEach((x) => x.dispose());
    this.geos = []; this.mats = []; this.texs = [];
  }
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const css = (n: number) => "#" + n.toString(16).padStart(6, "0");

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D | null] {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return [c, c.getContext("2d")];
}

function makeGlowTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(64, 64);
  if (ctx) {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.45)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
  }
  return new THREE.CanvasTexture(c);
}

function makeStoneTexture(rnd: () => number): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(256, 256);
  if (ctx) {
    ctx.fillStyle = "#a9a0bd"; ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1100; i++) {
      const v = Math.floor(120 + rnd() * 110);
      ctx.fillStyle = `rgba(${v},${v - 6},${v + 14},${0.1 + rnd() * 0.2})`;
      ctx.fillRect(rnd() * 256, rnd() * 256, 1 + rnd() * 3, 1 + rnd() * 3);
    }
    ctx.strokeStyle = "rgba(24,12,44,0.62)"; ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(256, 0);
    ctx.moveTo(0, 128); ctx.lineTo(256, 128);
    ctx.moveTo(0, 0); ctx.lineTo(0, 128); ctx.moveTo(128, 0); ctx.lineTo(128, 128);
    ctx.moveTo(64, 128); ctx.lineTo(64, 256); ctx.moveTo(192, 128); ctx.lineTo(192, 256);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.14)"; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 5); ctx.lineTo(256, 5); ctx.moveTo(0, 133); ctx.lineTo(256, 133);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeFacadeTexture(rnd: () => number, variant: number): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(128, 256);
  if (ctx) {
    const bgs = ["#1b0f24", "#220f1c", "#150f2a"];
    ctx.fillStyle = bgs[variant % bgs.length]; ctx.fillRect(0, 0, 128, 256);
    const warm = ["#ffd27a", "#ffb04a", "#ff7ab0", "#7ad8ff", "#ff9a5a"];
    for (let r = 0; r < 13; r++) {
      for (let col = 0; col < 5; col++) {
        const lit = rnd() < 0.58;
        ctx.fillStyle = lit ? warm[Math.floor(rnd() * warm.length)] : "#2a1a34";
        ctx.fillRect(10 + col * 23, 10 + r * 19, 15, 11);
      }
    }
    const neon = ["#ff3a6a", "#ffb02e", "#ff5ad0", "#3ad8ff"];
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = neon[Math.floor(rnd() * neon.length)];
      ctx.globalAlpha = 0.85;
      ctx.fillRect(2 + rnd() * 110, 0, 5, 256);
      ctx.globalAlpha = 1;
    }
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = neon[Math.floor(rnd() * neon.length)];
      ctx.fillRect(8 + rnd() * 50, 20 + rnd() * 200, 40 + rnd() * 40, 14);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeLanternTexture(text: string, bodyA: string, bodyB: string, ink: string): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(512, 384);
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, 384);
    g.addColorStop(0, bodyA); g.addColorStop(0.5, bodyB); g.addColorStop(1, bodyA);
    ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 384);
    ctx.strokeStyle = "rgba(0,0,0,0.22)"; ctx.lineWidth = 3;
    for (let y = 24; y < 384; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke(); }
    const chars = Array.from(text);
    const fs = Math.min(88, 300 / chars.length);
    ctx.font = `900 ${fs}px "Noto Sans JP","Yu Gothic","Hiragino Sans",sans-serif`;
    ctx.fillStyle = ink; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    chars.forEach((ch, i) => {
      const y = 192 + (i - (chars.length - 1) / 2) * fs * 1.08;
      ctx.fillText(ch, 0, y);
      ctx.fillText(ch, 512, y);
    });
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ------------------------ scrolling instanced sets ------------------------ */

type Vec3T = [number, number, number];
interface Part {
  geo: THREE.BufferGeometry;
  mat: THREE.Material | THREE.Material[];
  pos?: Vec3T;
  rot?: Vec3T;
  scl?: Vec3T;
}
interface Placement { x: number; z: number; y?: number; s?: number; ry?: number; phase?: number }
interface ScrollSet { update: (dz: number, time: number) => void }

const Z_MAX = 14;

function createScrollSet(
  root: THREE.Group,
  parts: Part[],
  placements: Placement[],
  period: number,
  bob = 0
): ScrollSet {
  const n = placements.length;
  const meshes = parts.map((p) => {
    const im = new THREE.InstancedMesh(p.geo, p.mat, Math.max(1, n));
    im.frustumCulled = false;
    root.add(im);
    return im;
  });
  const partMats = parts.map((p) => {
    const o = new THREE.Object3D();
    const pos = p.pos ?? [0, 0, 0];
    const rot = p.rot ?? [0, 0, 0];
    const scl = p.scl ?? [1, 1, 1];
    o.position.set(pos[0], pos[1], pos[2]);
    o.rotation.set(rot[0], rot[1], rot[2]);
    o.scale.set(scl[0], scl[1], scl[2]);
    o.updateMatrix();
    return o.matrix.clone();
  });
  const parent = new THREE.Object3D();
  const m = new THREE.Matrix4();
  let offset = 0;

  const apply = (time: number) => {
    for (let i = 0; i < n; i++) {
      const pl = placements[i];
      const z = Z_MAX - ((((Z_MAX - (pl.z + offset)) % period) + period) % period);
      const y = (pl.y ?? 0) + (bob ? Math.sin(time * 1.4 + (pl.phase ?? 0)) * bob : 0);
      const s = pl.s ?? 1;
      parent.position.set(pl.x, y, z);
      parent.rotation.set(0, pl.ry ?? 0, 0);
      parent.scale.set(s, s, s);
      parent.updateMatrix();
      for (let k = 0; k < meshes.length; k++) {
        m.multiplyMatrices(parent.matrix, partMats[k]);
        meshes[k].setMatrixAt(i, m);
      }
    }
    meshes.forEach((im) => { im.instanceMatrix.needsUpdate = true; });
  };
  apply(0);

  return {
    update: (dz: number, time: number) => {
      offset += dz;
      apply(time);
    },
  };
}

/* ============================ SCENERY BUILDER ============================ */

export interface ZoneSceneryHandle {
  update: (dt: number, speed: number, time: number, reduced: boolean) => void;
  dispose: () => void;
}

type Animator = (time: number, dt: number, reduced: boolean) => void;

export function buildZoneScenery(
  scene: THREE.Scene,
  zoneId: string,
  opts: { mobile: boolean; reduced: boolean }
): ZoneSceneryHandle {
  const theme = getZoneTheme(zoneId);
  const tk = new Tracker();
  const rnd = mulberry32(hashString(zoneId));
  const k = opts.mobile ? 0.6 : 1;
  const root = new THREE.Group();
  scene.add(root);

  scene.background = new THREE.Color(theme.skyMid);
  scene.fog = new THREE.FogExp2(theme.fogColor, theme.fogDensity);

  const scrollSets: ScrollSet[] = [];
  const animators: Animator[] = [];
  const addSet = (parts: Part[], pl: Placement[], period: number, bob = 0) => {
    if (pl.length === 0) return;
    scrollSets.push(createScrollSet(root, parts, pl, period, bob));
  };

  const glowTex = tk.t(makeGlowTexture());
  const unitBox = tk.g(new THREE.BoxGeometry(1, 1, 1));
  const unitCone4 = tk.g(new THREE.ConeGeometry(1, 1, 4, 1));
  unitCone4.rotateY(Math.PI / 4);
  const unitSphere = tk.g(new THREE.SphereGeometry(1, 12, 10));
  const blobGeo = tk.g(new THREE.IcosahedronGeometry(1, 1));
  const rockGeo = tk.g(new THREE.DodecahedronGeometry(1, 0));

  const addMat = (color: number, opacity: number) =>
    tk.m(new THREE.MeshBasicMaterial({
      color, map: glowTex, transparent: true, opacity,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));

  const scatter = (
    n: number, xMin: number, xMax: number, zMin: number, zMax: number, sMin = 0.85, sMax = 1.3
  ): Placement[] => {
    const out: Placement[] = [];
    for (let i = 0; i < n; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      out.push({
        x: side * (xMin + rnd() * (xMax - xMin)),
        z: zMin + rnd() * (zMax - zMin),
        s: sMin + rnd() * (sMax - sMin),
        ry: rnd() * Math.PI * 2,
        phase: rnd() * 6.28,
      });
    }
    return out;
  };

  /* ---------- 1. Sky dome, celestial body, stars ---------- */
  const skyMat = tk.m(new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      top: { value: new THREE.Color(theme.skyTop) },
      mid: { value: new THREE.Color(theme.skyMid) },
      bottom: { value: new THREE.Color(theme.skyBottom) },
    },
    vertexShader: `varying vec3 vPos; void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; varying vec3 vPos;
      void main(){
        float h = normalize(vPos).y;
        vec3 c = mix(bottom, mid, smoothstep(-0.05, 0.3, h));
        c = mix(c, top, smoothstep(0.22, 0.9, h));
        gl_FragColor = vec4(c, 1.0);
      }`,
  }));
  const skyDome = new THREE.Mesh(tk.g(new THREE.SphereGeometry(300, 24, 16)), skyMat);
  root.add(skyDome);

  const cel = theme.celestial;
  const celBody = new THREE.Mesh(
    tk.g(new THREE.CircleGeometry(cel.r, 48)),
    tk.m(new THREE.MeshBasicMaterial({ color: cel.color, fog: false }))
  );
  celBody.position.set(cel.x, cel.y, cel.z);
  root.add(celBody);
  const celHalo = new THREE.Mesh(
    tk.g(new THREE.CircleGeometry(cel.r * 2.6, 48)),
    tk.m(new THREE.MeshBasicMaterial({
      color: cel.halo, map: glowTex, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
    }))
  );
  celHalo.position.set(cel.x, cel.y, cel.z - 1);
  root.add(celHalo);

  if (theme.stars > 0) {
    const count = Math.round(theme.stars * k);
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const e = 0.25 + Math.random() * 0.7;
      const r = 280;
      pos[i * 3] = Math.cos(a) * Math.cos(e) * r;
      pos[i * 3 + 1] = Math.sin(e) * r;
      pos[i * 3 + 2] = -Math.abs(Math.sin(a) * Math.cos(e) * r) - 20;
    }
    const sg = tk.g(new THREE.BufferGeometry());
    sg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    root.add(new THREE.Points(sg, tk.m(new THREE.PointsMaterial({
      color: 0xffffff, size: 1.3, sizeAttenuation: false, transparent: true, opacity: 0.8, fog: false,
    }))));
  }

  /* ---------- 2. Distant mountains / Fuji ---------- */
  const addMountains = (layers: { z: number; color: number; scale: number; seg?: number }[]) => {
    layers.forEach((layer) => {
      const mat = tk.m(new THREE.MeshBasicMaterial({ color: layer.color, fog: false }));
      for (let i = -6; i <= 6; i++) {
        const h = (26 + ((i * 37) % 17) + Math.abs(i) * 2.2) * layer.scale;
        const geo = tk.g(new THREE.ConeGeometry(18 * layer.scale, h, layer.seg ?? 5));
        const m = new THREE.Mesh(geo, mat);
        m.position.set(i * 34 * layer.scale + (i % 2 ? 9 : -6), h / 2 - 2, layer.z);
        root.add(m);
      }
    });
  };

  if (zoneId === "fuji_summit") {
    addMountains([{ z: -230, color: 0xc88ab8, scale: 0.8 }, { z: -190, color: 0xa070b0, scale: 0.55 }]);
    const fujiBody = new THREE.Mesh(
      tk.g(new THREE.ConeGeometry(88, 120, 22)),
      tk.m(new THREE.MeshBasicMaterial({ color: 0x6a6aa8, fog: false }))
    );
    fujiBody.position.set(64, 54, -255);
    root.add(fujiBody);
    const snow = new THREE.Mesh(
      tk.g(new THREE.ConeGeometry(30, 42, 22)),
      tk.m(new THREE.MeshBasicMaterial({ color: 0xfff2f6, fog: false }))
    );
    snow.position.set(64, 93, -255);
    root.add(snow);
  } else if (zoneId === "moonlight_shrine") {
    addMountains([
      { z: -235, color: 0x1a2050, scale: 1.2, seg: 6 },
      { z: -175, color: 0x121638, scale: 0.85, seg: 6 },
    ]);
  } else {
    addMountains([
      { z: -230, color: zoneId === "kansai_festival" ? 0x2a1240 : 0x2a1c58, scale: 1.0 },
      { z: -170, color: zoneId === "kansai_festival" ? 0x1e0c30 : 0x1c1240, scale: 0.7 },
    ]);
  }

  /* ---------- 3. Clouds (instanced) ---------- */
  const addClouds = (
    count: number, xMin: number, xMax: number, yMin: number, yMax: number,
    zMin: number, zMax: number, sMin: number, sMax: number, color: number, opacity: number
  ) => {
    const n = Math.max(1, Math.round(count * k));
    const mat = tk.m(new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false }));
    const im = new THREE.InstancedMesh(blobGeo, mat, n);
    im.frustumCulled = false;
    const o = new THREE.Object3D();
    for (let i = 0; i < n; i++) {
      const side = rnd() < 0.5 ? -1 : 1;
      const s = sMin + rnd() * (sMax - sMin);
      o.position.set(side * (xMin + rnd() * (xMax - xMin)), yMin + rnd() * (yMax - yMin), zMin + rnd() * (zMax - zMin));
      o.scale.set(s * (1.5 + rnd() * 0.9), s * 0.38, s);
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
    }
    root.add(im);
  };

  if (theme.under === "clouds") {
    const floor = new THREE.Mesh(
      tk.g(new THREE.PlaneGeometry(400, 520).rotateX(-Math.PI / 2)),
      tk.m(new THREE.MeshStandardMaterial({ color: theme.underColor, emissive: theme.underEmissive, roughness: 1 }))
    );
    floor.position.set(0, -9, -150);
    root.add(floor);
    addClouds(80, 6, 100, -9, -2, -280, -8, 6, 14, theme.cloudLow, 0.6);
    addClouds(44, 8, 90, -5, 0, -280, -20, 5, 11, theme.cloudHigh, 0.42);
  } else {
    const water = new THREE.Mesh(
      tk.g(new THREE.PlaneGeometry(220, 520).rotateX(-Math.PI / 2)),
      tk.m(new THREE.MeshStandardMaterial({
        color: theme.underColor, emissive: theme.underEmissive, roughness: 0.12, metalness: 0.65,
      }))
    );
    water.position.set(0, -0.7, -150);
    root.add(water);
    addClouds(24, 10, 80, -1, 3, -280, -120, 8, 16, theme.cloudLow, 0.32);
  }
  addClouds(16, 40, 140, 28, 90, -290, -200, 14, 30, theme.cloudHigh, zoneId === "moonlight_shrine" ? 0.7 : 0.5);

  /* ---------- 4. Track deck, bridge edges, railing ---------- */
  const stoneTex = tk.t(makeStoneTexture(rnd));
  const DECK_REPEAT_Y = 90;
  stoneTex.repeat.set(3, DECK_REPEAT_Y);
  const deck = new THREE.Mesh(
    tk.g(new THREE.PlaneGeometry(9.8, 420).rotateX(-Math.PI / 2)),
    tk.m(new THREE.MeshStandardMaterial({
      map: stoneTex, color: theme.deck, roughness: 0.34, metalness: 0.22,
      emissive: theme.deckEmissive, emissiveIntensity: 0.6,
    }))
  );
  deck.position.set(0, 0, -130);
  deck.receiveShadow = true;
  root.add(deck);

  const curbMat = tk.m(new THREE.MeshStandardMaterial({ color: 0x3a3048, roughness: 0.8 }));
  const railMat = tk.m(new THREE.MeshStandardMaterial({ color: theme.railColor, roughness: 0.45, emissive: theme.railColor, emissiveIntensity: 0.12 }));
  const trimMat = tk.m(new THREE.MeshStandardMaterial({ color: theme.railTrim, roughness: 0.4 }));
  const curbGeo = tk.g(new THREE.BoxGeometry(0.5, 0.4, 420));
  const railGeo = tk.g(new THREE.BoxGeometry(0.14, 0.12, 420));
  [-4.85, 4.85].forEach((x) => {
    const curb = new THREE.Mesh(curbGeo, curbMat);
    curb.position.set(x, 0.18, -130);
    root.add(curb);
    [0.62, 0.98].forEach((y) => {
      const r = new THREE.Mesh(railGeo, y > 0.8 ? trimMat : railMat);
      r.position.set(x, y, -130);
      root.add(r);
    });
  });

  const postGeo = tk.g(new THREE.BoxGeometry(0.2, 1.15, 0.2));
  const capGeo = tk.g(new THREE.BoxGeometry(0.32, 0.12, 0.32));
  const postPlacements: Placement[] = [];
  const postStep = 4;
  const postCount = Math.floor(284 / postStep);
  for (let i = 0; i < postCount; i++) {
    postPlacements.push({ x: -4.85, z: Z_MAX - i * postStep });
    postPlacements.push({ x: 4.85, z: Z_MAX - i * postStep });
  }
  addSet(
    [
      { geo: postGeo, mat: railMat, pos: [0, 0.58, 0] },
      { geo: capGeo, mat: trimMat, pos: [0, 1.2, 0] },
    ],
    postPlacements,
    postStep * postCount
  );

  if (zoneId === "listening_realm" || zoneId === "kansai_festival") {
    const neonGeo = tk.g(new THREE.BoxGeometry(0.12, 0.08, 420));
    const neonA = tk.m(new THREE.MeshBasicMaterial({ color: zoneId === "listening_realm" ? 0xd45bff : 0xffa040 }));
    const neonB = tk.m(new THREE.MeshBasicMaterial({ color: zoneId === "listening_realm" ? 0x4fe8ff : 0xff5a3c }));
    [-4.5, 4.5].forEach((x, i) => {
      const n = new THREE.Mesh(neonGeo, i === 0 ? neonA : neonB);
      n.position.set(x, 0.42, -130);
      root.add(n);
    });
  }

  /* ---------- 5. Torii gates along the track ---------- */
  const toriiMat = tk.m(new THREE.MeshStandardMaterial({
    color: theme.toriiColor, roughness: 0.4, emissive: theme.toriiColor, emissiveIntensity: 0.18,
  }));
  const toriiBlack = tk.m(new THREE.MeshStandardMaterial({ color: 0x151015, roughness: 0.3 }));
  const ropeMat = tk.m(new THREE.MeshStandardMaterial({ color: 0xe8c878, roughness: 0.7 }));
  const shideMat = tk.m(new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.25 }));
  const chochinMat = tk.m(new THREE.MeshBasicMaterial({ color: 0xff6a2a }));
  const pillarGeo = tk.g(new THREE.CylinderGeometry(0.25, 0.3, 6.5, 10));
  const plinthGeo = tk.g(new THREE.CylinderGeometry(0.38, 0.42, 0.8, 10));
  const ropeGeo = tk.g(new THREE.CylinderGeometry(0.12, 0.12, 11.4, 6).rotateZ(Math.PI / 2));
  const shideGeo = tk.g(new THREE.BoxGeometry(0.16, 0.5, 0.04));
  const chochinGeo = tk.g(new THREE.SphereGeometry(0.42, 10, 8));

  const toriiParts: Part[] = [
    { geo: pillarGeo, mat: toriiMat, pos: [-5.6, 3.25, 0] },
    { geo: pillarGeo, mat: toriiMat, pos: [5.6, 3.25, 0] },
    { geo: plinthGeo, mat: toriiBlack, pos: [-5.6, 0.4, 0] },
    { geo: plinthGeo, mat: toriiBlack, pos: [5.6, 0.4, 0] },
    { geo: unitBox, mat: toriiMat, pos: [0, 6.2, 0], scl: [13.2, 0.55, 0.65] },
    { geo: unitBox, mat: toriiBlack, pos: [0, 6.55, 0], scl: [14.4, 0.2, 0.9] },
    { geo: unitBox, mat: toriiMat, pos: [0, 5.2, 0], scl: [11.8, 0.38, 0.4] },
    { geo: ropeGeo, mat: ropeMat, pos: [0, 4.85, 0.1] },
  ];
  [-3.6, -2.4, 2.4, 3.6].forEach((x) => toriiParts.push({ geo: shideGeo, mat: shideMat, pos: [x, 4.45, 0.1] }));
  if (zoneId === "torii_path" || zoneId === "kansai_festival") {
    [-4.4, -3.3, 3.3, 4.4].forEach((x) =>
      toriiParts.push({ geo: chochinGeo, mat: chochinMat, pos: [x, 4.3, 0], scl: [1, 1.25, 1] })
    );
  }
  if (zoneId === "fuji_summit") {
    const goldMat = tk.m(new THREE.MeshStandardMaterial({ color: 0xe8b84a, metalness: 0.6, roughness: 0.3, emissive: 0x6a4a10, emissiveIntensity: 0.4 }));
    [-5.6, 5.6].forEach((x) => toriiParts.push({ geo: unitBox, mat: goldMat, pos: [x, 5.7, 0], scl: [0.7, 0.18, 0.7] }));
  }

  const toriiSpacing = theme.toriiSpacing;
  const toriiCount = Math.floor(280 / toriiSpacing);
  const toriiPeriod = toriiSpacing * toriiCount;
  const toriiPl: Placement[] = [];
  for (let i = 0; i < toriiCount; i++) toriiPl.push({ x: 0, z: -20 - i * toriiSpacing, s: 0.95 });
  addSet(toriiParts, toriiPl, toriiPeriod);

  /* ---------- 6. Stone lanterns with light pools ---------- */
  const stoneMat = tk.m(new THREE.MeshStandardMaterial({ color: 0x4a4658, roughness: 0.85 }));
  const lampMat = tk.m(new THREE.MeshBasicMaterial({ color: theme.lanternWindow }));
  const toroPostGeo = tk.g(new THREE.CylinderGeometry(0.2, 0.26, 1.3, 8));
  const toroCapGeo = tk.g(new THREE.SphereGeometry(0.13, 8, 6));
  const poolGeo = tk.g(new THREE.PlaneGeometry(6, 6).rotateX(-Math.PI / 2));
  const streakGeo = tk.g(new THREE.PlaneGeometry(1.4, 7).rotateX(-Math.PI / 2));
  const lampHaloGeo = tk.g(new THREE.SphereGeometry(1.0, 10, 8));
  const poolMat = addMat(theme.lanternGlowColor, 0.5);
  const haloMat = tk.m(new THREE.MeshBasicMaterial({
    color: theme.lanternGlowColor, transparent: true, opacity: 0.16,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));

  const toroParts: Part[] = [
    { geo: unitBox, mat: stoneMat, pos: [0, 0.25, 0], scl: [0.95, 0.5, 0.95] },
    { geo: toroPostGeo, mat: stoneMat, pos: [0, 1.1, 0] },
    { geo: unitBox, mat: stoneMat, pos: [0, 1.85, 0], scl: [1.05, 0.16, 1.05] },
    { geo: unitBox, mat: lampMat, pos: [0, 2.3, 0], scl: [0.74, 0.74, 0.74] },
    { geo: unitCone4, mat: stoneMat, pos: [0, 3.02, 0], scl: [1.15, 0.7, 1.15] },
    { geo: toroCapGeo, mat: stoneMat, pos: [0, 3.45, 0] },
    { geo: lampHaloGeo, mat: haloMat, pos: [0, 2.3, 0], scl: [1.2, 1.2, 1.2] },
    { geo: poolGeo, mat: poolMat, pos: [-2.6, 0.04, 0] },
  ];
  if (theme.under === "water") {
    toroParts.push({ geo: streakGeo, mat: addMat(theme.lanternGlowColor, 0.55), pos: [0.2, -0.62, 0] });
  }
  const toroPl: Placement[] = [];
  for (let i = 0; i < toriiCount; i++) {
    [0.25, 0.75].forEach((f) => {
      const z = -20 - i * toriiSpacing - f * toriiSpacing;
      toroPl.push({ x: 5.6, z, ry: 0 });
      toroPl.push({ x: -5.6, z, ry: Math.PI });
    });
  }
  addSet(toroParts, toroPl, toriiPeriod);

  /* ---------- 7. Cherry blossom trees on islets ---------- */
  const trunkMat = tk.m(new THREE.MeshStandardMaterial({ color: 0x3b2230, roughness: 0.9 }));
  const trunkGeo = tk.g(new THREE.CylinderGeometry(0.35, 0.6, 4.2, 7));
  const isletMat = tk.m(new THREE.MeshStandardMaterial({ color: theme.rock, roughness: 0.95 }));
  const mossMat = tk.m(new THREE.MeshStandardMaterial({ color: theme.grass, roughness: 0.9 }));
  const blobMats = theme.treeBlob.map((c) =>
    tk.m(new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.38, roughness: 0.8 }))
  );
  const treeCountMap: Record<string, number> = {
    torii_path: 14, sakura_grove: 22, moonlight_shrine: 9, fuji_summit: 12, listening_realm: 10, kansai_festival: 8,
  };
  const treeParts: Part[] = [
    { geo: rockGeo, mat: isletMat, pos: [0, -0.3, 0], scl: [4.2, 0.9, 4.0] },
    { geo: unitSphere, mat: mossMat, pos: [0, 0.35, 0], scl: [3.4, 0.35, 3.2] },
    { geo: trunkGeo, mat: trunkMat, pos: [0, 2.1, 0] },
    { geo: blobGeo, mat: blobMats[0], pos: [0, 4.4, 0], scl: [2.6, 2.1, 2.6] },
    { geo: blobGeo, mat: blobMats[1 % blobMats.length], pos: [1.7, 3.6, 0.6], scl: [1.9, 1.6, 1.9] },
    { geo: blobGeo, mat: blobMats[2 % blobMats.length], pos: [-1.6, 3.9, -0.5], scl: [2.0, 1.7, 2.0] },
    { geo: blobGeo, mat: blobMats[0], pos: [0.2, 5.6, 0.2], scl: [1.7, 1.3, 1.7] },
  ];
  addSet(treeParts, scatter(Math.round((treeCountMap[zoneId] ?? 10) * k), 9, 20, -275, -10, 0.9, 1.5), 290);

  /* ---------- 8. Zone specific features ---------- */
  const shrineBodyMat = tk.m(new THREE.MeshStandardMaterial({ color: 0x7a1f1f, emissive: theme.lanternWindow, emissiveIntensity: 0.35, roughness: 0.7 }));
  const shrineRoofMat = tk.m(new THREE.MeshStandardMaterial({ color: 0x1d1a2b, roughness: 0.6 }));

  const pagodaParts = (): Part[] => {
    const parts: Part[] = [];
    for (let t = 0; t < 3; t++) {
      const bw = 4.6 - t * 1.1;
      const y0 = t * 3.2;
      const roofR = (bw / 2 + 0.95) * 1.414;
      parts.push({ geo: unitBox, mat: shrineBodyMat, pos: [0, y0 + 1.2, 0], scl: [bw, 2.4, bw] });
      parts.push({ geo: unitCone4, mat: shrineRoofMat, pos: [0, y0 + 3.0, 0], scl: [roofR, 1.2, roofR] });
    }
    parts.push({ geo: unitBox, mat: shrineRoofMat, pos: [0, 10.6, 0], scl: [0.18, 2.0, 0.18] });
    parts.push({ geo: rockGeo, mat: isletMat, pos: [0, -0.6, 0], scl: [5.2, 1.2, 5.0] });
    return parts;
  };

  // --- Floating islands w/ shrine + waterfall (far, slow parallax) ---
  const islands: { g: THREE.Group; baseY: number; phase: number }[] = [];
  const buildIslands = (count: number, withShrine: boolean) => {
    const rockMat2 = tk.m(new THREE.MeshStandardMaterial({ color: theme.rock, roughness: 0.95 }));
    const grassMat2 = tk.m(new THREE.MeshStandardMaterial({ color: theme.grass, roughness: 0.9 }));
    const rockCone = tk.g(new THREE.ConeGeometry(5, 10.4, 8).rotateX(Math.PI));
    const topGeo = tk.g(new THREE.CylinderGeometry(5, 4.8, 0.4, 12));
    const fallGeo = tk.g(new THREE.CylinderGeometry(0.55, 0.9, 18, 8, 1, true));
    const fallMat = tk.m(new THREE.MeshBasicMaterial({
      color: 0xd8f4ff, transparent: true, opacity: 0.42, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    const n = Math.max(1, Math.round(count * k));
    for (let i = 0; i < n; i++) {
      const g = new THREE.Group();
      const rock = new THREE.Mesh(rockCone, rockMat2); rock.position.y = -5.2; g.add(rock);
      const top = new THREE.Mesh(topGeo, grassMat2); top.position.y = 0.1; g.add(top);
      if (withShrine) {
        const base = new THREE.Mesh(unitBox, shrineBodyMat); base.position.set(0, 1.35, 0); base.scale.set(3, 1.6, 3); g.add(base);
        const roof = new THREE.Mesh(unitCone4, shrineRoofMat); roof.position.set(0, 3.0, 0); roof.scale.set(3.4, 1.5, 3.4); g.add(roof);
      }
      const bl = new THREE.Mesh(blobGeo, blobMats[i % blobMats.length]); bl.position.set(-3, 1.9, 1); bl.scale.set(1.5, 1.2, 1.5); g.add(bl);
      const fall = new THREE.Mesh(fallGeo, fallMat); fall.position.set(4.3, -9, 0); g.add(fall);
      const side = i % 2 === 0 ? 1 : -1;
      const s = 1.5 + rnd() * 1.0;
      const baseY = (zoneId === "fuji_summit" ? 2 : 0) + rnd() * 16;
      g.position.set(side * (28 + rnd() * 26), baseY, -50 - i * (200 / n) - rnd() * 20);
      g.scale.setScalar(s);
      g.rotation.y = rnd() * 6.28;
      root.add(g);
      islands.push({ g, baseY, phase: rnd() * 6.28 });
    }
  };

  switch (zoneId) {
    case "torii_path": {
      buildIslands(5, true);
      addSet(pagodaParts(), scatter(Math.round(5 * k), 18, 28, -270, -40, 0.7, 1.0), 290);
      break;
    }
    case "sakura_grove": {
      buildIslands(4, true);
      // Kitsune guardian statues on pedestals
      const statueStone = tk.m(new THREE.MeshStandardMaterial({ color: 0x6e6a7a, roughness: 0.9 }));
      const bibMat = tk.m(new THREE.MeshStandardMaterial({ color: 0xd8281e, roughness: 0.7 }));
      const earGeo = tk.g(new THREE.ConeGeometry(0.11, 0.45, 5));
      const statueParts: Part[] = [
        { geo: unitBox, mat: statueStone, pos: [0, 0.5, 0], scl: [1.1, 1.0, 1.1] },
        { geo: unitSphere, mat: mossMat, pos: [0, 1.02, 0], scl: [0.7, 0.1, 0.7] },
        { geo: unitSphere, mat: statueStone, pos: [0, 1.65, 0], scl: [0.38, 0.6, 0.34] },
        { geo: unitSphere, mat: statueStone, pos: [0, 2.35, 0.08], scl: [0.27, 0.27, 0.3] },
        { geo: earGeo, mat: statueStone, pos: [-0.13, 2.68, 0.05] },
        { geo: earGeo, mat: statueStone, pos: [0.13, 2.68, 0.05] },
        { geo: unitBox, mat: bibMat, pos: [0, 2.0, 0.22], scl: [0.5, 0.2, 0.3] },
      ];
      const stPl: Placement[] = [];
      const n = Math.floor(280 / 40);
      for (let i = 0; i < n; i++) {
        stPl.push({ x: 7.4, z: -40 - i * 40, ry: -0.35 });
        stPl.push({ x: -7.4, z: -40 - i * 40, ry: 0.35 });
      }
      addSet(statueParts, stPl, 40 * n);
      addSet(pagodaParts(), scatter(Math.round(4 * k), 20, 30, -270, -40, 0.7, 0.95), 290);
      break;
    }
    case "moonlight_shrine": {
      buildIslands(3, true);
      const flameCore = tk.m(new THREE.MeshBasicMaterial({ color: 0x7ff6ff }));
      const flameHalo = tk.m(new THREE.MeshBasicMaterial({
        color: 0x3ad8ff, transparent: true, opacity: 0.24, blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      const tipGeo = tk.g(new THREE.ConeGeometry(0.15, 0.55, 6));
      const flameParts: Part[] = [
        { geo: unitSphere, mat: flameCore, pos: [0, 0.5, 0], scl: [0.22, 0.34, 0.22] },
        { geo: tipGeo, mat: flameCore, pos: [0, 1.0, 0] },
        { geo: unitSphere, mat: flameHalo, pos: [0, 0.65, 0], scl: [0.65, 0.8, 0.65] },
      ];
      addSet(flameParts, scatter(Math.round(26 * k), 6.2, 16, -275, -10, 0.8, 1.4), 290, 0.12);
      // Mossy rocks with flames on top
      const rockParts: Part[] = [
        { geo: rockGeo, mat: isletMat, pos: [0, 0.3, 0], scl: [1.9, 1.1, 1.6] },
        { geo: unitSphere, mat: mossMat, pos: [0, 1.0, 0], scl: [1.5, 0.22, 1.3] },
        ...flameParts.map((p) => ({ ...p, pos: [p.pos![0], p.pos![1] + 1.0, p.pos![2]] as Vec3T })),
      ];
      addSet(rockParts, scatter(Math.round(12 * k), 8, 16, -275, -10, 0.8, 1.5), 290);
      addSet(pagodaParts(), scatter(Math.round(3 * k), 22, 30, -270, -60, 0.8, 1.0), 290);
      animators.push((t) => { flameHalo.opacity = 0.22 + Math.sin(t * 3.1) * 0.07; });
      break;
    }
    case "fuji_summit": {
      buildIslands(9, true);
      // golden "sun rays" fan behind Fuji
      const rayMat = tk.m(new THREE.MeshBasicMaterial({
        color: 0xffe9a8, map: glowTex, transparent: true, opacity: 0.55,
        blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
      }));
      const ray = new THREE.Mesh(tk.g(new THREE.PlaneGeometry(260, 260)), rayMat);
      ray.position.set(46, 88, -284);
      root.add(ray);
      break;
    }
    case "listening_realm": {
      buildIslands(5, true);
      // Neon sound-wave ribbons across the sky
      const ribbonColors = [0xff4fd8, 0xb066ff, 0x4fe8ff, 0xff7ad9, 0x7affd8];
      const ribbons: THREE.Mesh[] = [];
      ribbonColors.forEach((col, i) => {
        const pts: THREE.Vector3[] = [];
        for (let x = -110; x <= 110; x += 10) {
          pts.push(new THREE.Vector3(x, 20 + i * 4 + Math.sin(x * 0.07 + i * 1.3) * 9, -90 - i * 14));
        }
        const tube = tk.g(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, 0.18, 6, false));
        const mat = tk.m(new THREE.MeshBasicMaterial({
          color: col, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
        }));
        const mesh = new THREE.Mesh(tube, mat);
        root.add(mesh);
        ribbons.push(mesh);
      });
      // Equalizer bars
      const barGeo = tk.g(new THREE.BoxGeometry(0.7, 1, 0.7));
      const bars: { m: THREE.Mesh; ph: number }[] = [];
      [-1, 1].forEach((side, si) => {
        const barMat = tk.m(new THREE.MeshBasicMaterial({
          color: si === 0 ? 0x4fe8ff : 0xff5ad0, transparent: true, opacity: 0.8,
          blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        for (let i = 0; i < 9; i++) {
          const m = new THREE.Mesh(barGeo, barMat);
          m.position.set(side * (26 + i * 1.6), 0, -85 - (i % 3) * 3);
          root.add(m);
          bars.push({ m, ph: rnd() * 6.28 });
        }
      });
      // Floating music notes (3 colours)
      const headGeo = tk.g(new THREE.SphereGeometry(0.3, 10, 8));
      const stemGeo = tk.g(new THREE.CylinderGeometry(0.045, 0.045, 1.4, 6));
      const flagGeo = tk.g(new THREE.BoxGeometry(0.5, 0.13, 0.05));
      [0xff7ad9, 0xffffff, 0x6aeeff].forEach((col) => {
        const nm = tk.m(new THREE.MeshBasicMaterial({ color: col }));
        const parts: Part[] = [
          { geo: headGeo, mat: nm, pos: [0, 0, 0], scl: [1.3, 1, 1], rot: [0, 0, 0.4] },
          { geo: stemGeo, mat: nm, pos: [0.36, 0.7, 0] },
          { geo: flagGeo, mat: nm, pos: [0.6, 1.3, 0], rot: [0, 0, -0.5] },
        ];
        const pl = scatter(Math.round(8 * k), 6.5, 20, -270, -12, 1.0, 1.7).map((p) => ({ ...p, y: 3 + rnd() * 7, ry: 0 }));
        addSet(parts, pl, 290, 0.45);
      });
      animators.push((t, _dt, reduced) => {
        if (reduced) return;
        ribbons.forEach((r, i) => { r.position.y = Math.sin(t * 0.9 + i) * 1.6; });
        bars.forEach((b) => {
          const h = 3 + Math.abs(Math.sin(t * 2.4 + b.ph)) * 11;
          b.m.scale.y = h; b.m.position.y = h / 2 - 1;
        });
      });
      break;
    }
    case "kansai_festival": {
      // City buildings with neon facades
      const variants = [
        { w: 7, h: 17, d: 8 }, { w: 6, h: 12, d: 7 }, { w: 8, h: 8.5, d: 7 },
      ];
      variants.forEach((v, i) => {
        const tex = tk.t(makeFacadeTexture(rnd, i));
        const mat = tk.m(new THREE.MeshBasicMaterial({ map: tex }));
        const geo = tk.g(new THREE.BoxGeometry(v.w, v.h, v.d));
        const roofMat = tk.m(new THREE.MeshStandardMaterial({ color: 0x1d1a2b }));
        const parts: Part[] = [
          { geo, mat, pos: [0, v.h / 2, 0] },
          { geo: unitBox, mat: roofMat, pos: [0, v.h + 0.15, 0], scl: [v.w + 0.6, 0.3, v.d + 0.6] },
        ];
        const pl: Placement[] = [];
        const per = Math.round(7 * k);
        for (let n = 0; n < per; n++) {
          [1, -1].forEach((side) => {
            pl.push({ x: side * (13.5 + rnd() * 5), z: -20 - (n * 280) / per - i * 30 - rnd() * 8, ry: 0, s: 0.9 + rnd() * 0.2 });
          });
        }
        addSet(parts, pl, 290);
      });
      // Giant text lanterns
      const sets: { text: string; a: string; b: string; ink: string; n: number }[] = [
        { text: "なんば", a: "#ff2a2a", b: "#ff7a3a", ink: "#101010", n: 3 },
        { text: "祭", a: "#ff3a2a", b: "#ffb040", ink: "#ffffff", n: 3 },
        { text: "京都", a: "#f8f0e0", b: "#ffd9a0", ink: "#7a1010", n: 3 },
        { text: "大阪", a: "#ff3a3a", b: "#ff8a40", ink: "#ffe8b0", n: 3 },
      ];
      const capMat = tk.m(new THREE.MeshBasicMaterial({ color: 0x151010 }));
      const poleMat = tk.m(new THREE.MeshStandardMaterial({ color: 0x2a1a1a }));
      const poleGeo = tk.g(new THREE.CylinderGeometry(0.08, 0.08, 8, 6));
      sets.forEach((s, si) => {
        const tex = tk.t(makeLanternTexture(s.text, s.a, s.b, s.ink));
        const lamp = tk.m(new THREE.MeshBasicMaterial({ map: tex }));
        const geo = tk.g(new THREE.CylinderGeometry(1.05, 1.05, 3.0, 20, 1));
        const parts: Part[] = [
          { geo, mat: [lamp, capMat, capMat], pos: [0, 4.4, 0] },
          { geo: poleGeo, mat: poleMat, pos: [0, 4.2, 0] },
        ];
        const pl: Placement[] = [];
        const per = Math.round(s.n * k) || 1;
        for (let n = 0; n < per; n++) {
          pl.push({
            x: (n % 2 ? -1 : 1) * (10.6 + rnd() * 1.2),
            z: -30 - ((n + si * 0.27) * 280) / per - rnd() * 14,
            ry: 0,
          });
        }
        addSet(parts, pl, 290);
      });
      // Castle / pagoda skyline
      addSet(pagodaParts(), scatter(Math.round(4 * k), 26, 34, -270, -80, 1.2, 1.7), 290);
      // Floating paper lanterns on the water
      const floatMat = tk.m(new THREE.MeshBasicMaterial({ color: 0xffa040 }));
      const floatParts: Part[] = [
        { geo: unitBox, mat: floatMat, pos: [0, -0.35, 0], scl: [0.5, 0.6, 0.5] },
        { geo: poolGeo, mat: addMat(0xffa040, 0.5), pos: [0, -0.62, 0], scl: [0.35, 1, 0.35] },
      ];
      addSet(floatParts, scatter(Math.round(36 * k), 6.8, 30, -275, -8, 0.8, 1.5), 290);
      break;
    }
    default:
      break;
  }

  /* ---------- 9. Floating petals / sparkles ---------- */
  const petalCount = Math.round((opts.mobile ? 95 : 150));
  const petalGeo = tk.g(new THREE.BufferGeometry());
  const petalPos = new Float32Array(petalCount * 3);
  const petalVel: { x: number; y: number; z: number }[] = [];
  for (let i = 0; i < petalCount; i++) {
    petalPos[i * 3] = (Math.random() - 0.5) * 30;
    petalPos[i * 3 + 1] = Math.random() * 9 + 0.5;
    petalPos[i * 3 + 2] = -Math.random() * 140;
    petalVel.push({ x: (Math.random() - 0.5) * 1.5, y: -(Math.random() * 0.7 + 0.3), z: Math.random() * 3 + 2 });
  }
  petalGeo.setAttribute("position", new THREE.BufferAttribute(petalPos, 3));
  root.add(new THREE.Points(petalGeo, tk.m(new THREE.PointsMaterial({
    color: theme.petalColor, size: 0.26, transparent: true, opacity: 0.88,
  }))));

  /* ---------- update / dispose ---------- */
  const deckScrollPerUnit = DECK_REPEAT_Y / 420;

  return {
    update: (dt, speed, time, reduced) => {
      const dz = speed * dt;
      scrollSets.forEach((s) => s.update(dz, time));
      stoneTex.offset.y += dz * deckScrollPerUnit;

      islands.forEach((isl) => {
        isl.g.position.z += dz * 0.35;
        if (isl.g.position.z > 12) isl.g.position.z -= 270;
        isl.g.position.y = isl.baseY + (reduced ? 0 : Math.sin(time * 0.5 + isl.phase) * 0.8);
      });

      const pm = reduced ? 0.2 : 0.6;
      for (let i = 0; i < petalCount; i++) {
        petalPos[i * 3] += petalVel[i].x * dt;
        petalPos[i * 3 + 1] += petalVel[i].y * dt;
        petalPos[i * 3 + 2] += (petalVel[i].z + speed * pm) * dt;
        if (petalPos[i * 3 + 2] > 10 || petalPos[i * 3 + 1] < 0.2) {
          petalPos[i * 3] = (Math.random() - 0.5) * 30;
          petalPos[i * 3 + 1] = Math.random() * 9 + 1;
          petalPos[i * 3 + 2] = -Math.random() * 90 - 40;
        }
      }
      petalGeo.attributes.position.needsUpdate = true;

      animators.forEach((a) => a(time, dt, reduced));
    },
    dispose: () => {
      root.traverse((o) => {
        if ((o as THREE.InstancedMesh).isInstancedMesh) (o as THREE.InstancedMesh).dispose();
      });
      scene.remove(root);
      tk.disposeAll();
    },
  };
}

/* ============================ OBSTACLE SKINS ============================ */

const TOP_Y: Record<string, number> = {
  LANTERN_LOW: 1.5,
  BAMBOO_HURDLE: 1.0,
  VOID_PIT: 0.2,
  SHIMENAWA_HIGH: 2.2,
  WOODEN_BEAM: 2.15,
  LOW_GATE: 2.3,
  SEAL_ROCK: 2.1,
  FALLEN_TREE: 1.9,
  COLLAPSED_ROAD: 1.9,
};
const WIDE = new Set(["BAMBOO_HURDLE", "SHIMENAWA_HIGH", "WOODEN_BEAM", "LOW_GATE"]);
const HOLE = new Set(["VOID_PIT", "COLLAPSED_ROAD"]);
const OVERHEAD = new Set(["SHIMENAWA_HIGH", "WOODEN_BEAM", "LOW_GATE"]);

export interface ObstacleSkin {
  decorate: (group: THREE.Group, type: string) => void;
  dispose: () => void;
}

export function createObstacleSkin(zoneId: string): ObstacleSkin {
  const theme = getZoneTheme(zoneId);
  const tk = new Tracker();

  const ringGeo = tk.g(new THREE.RingGeometry(0.85, 1.12, 28).rotateX(-Math.PI / 2));
  const ringMat = tk.m(new THREE.MeshBasicMaterial({
    color: theme.accent, transparent: true, opacity: 0.6, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  const ring2Mat = tk.m(new THREE.MeshBasicMaterial({
    color: theme.accent, transparent: true, opacity: 0.25, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));

  const sphere = tk.g(new THREE.SphereGeometry(1, 10, 8));
  const cone = tk.g(new THREE.ConeGeometry(0.16, 0.55, 6));
  const cyl = tk.g(new THREE.CylinderGeometry(0.1, 0.1, 0.07, 8));
  const octa = tk.g(new THREE.OctahedronGeometry(0.3, 0));
  const stem = tk.g(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6));

  const pinkMat = tk.m(new THREE.MeshStandardMaterial({ color: 0xff9bd0, emissive: 0xff5fa8, emissiveIntensity: 0.45, roughness: 0.8 }));
  const flameMat = tk.m(new THREE.MeshBasicMaterial({ color: 0x7ff6ff }));
  const flameHaloMat = tk.m(new THREE.MeshBasicMaterial({ color: 0x3ad8ff, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false }));
  const foxFireMat = tk.m(new THREE.MeshBasicMaterial({ color: 0xff8a2a }));
  const foxHaloMat = tk.m(new THREE.MeshBasicMaterial({ color: 0xff5a1a, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false }));
  const mossMat = tk.m(new THREE.MeshStandardMaterial({ color: 0x24503d, roughness: 0.95 }));
  const snowMat = tk.m(new THREE.MeshStandardMaterial({ color: 0xfff6fa, emissive: 0xbfd8ff, emissiveIntensity: 0.25, roughness: 0.6 }));
  const iceMat = tk.m(new THREE.MeshStandardMaterial({ color: 0x9fe8ff, emissive: 0x4fc8ff, emissiveIntensity: 0.6, transparent: true, opacity: 0.8, roughness: 0.1 }));
  const goldMat = tk.m(new THREE.MeshStandardMaterial({ color: 0xffc24b, emissive: 0x805a10, emissiveIntensity: 0.5, metalness: 0.5, roughness: 0.3 }));
  const chochinMat = tk.m(new THREE.MeshBasicMaterial({ color: 0xff5a2b }));
  const noteMats = [0xff7ad9, 0x6aeeff].map((c) => tk.m(new THREE.MeshBasicMaterial({ color: c })));

  const mesh = (g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, sx = 1, sy = sx, sz = sx) => {
    const o = new THREE.Mesh(g, m);
    o.position.set(x, y, z);
    o.scale.set(sx, sy, sz);
    return o;
  };

  const addFlame = (group: THREE.Group, x: number, y: number, blue: boolean) => {
    const core = blue ? flameMat : foxFireMat;
    const halo = blue ? flameHaloMat : foxHaloMat;
    group.add(mesh(sphere, core, x, y, 0, 0.17, 0.27, 0.17));
    group.add(mesh(cone, core, x, y + 0.42, 0));
    group.add(mesh(sphere, halo, x, y + 0.1, 0, 0.5, 0.65, 0.5));
  };

  const decorate = (group: THREE.Group, type: string) => {
    const top = TOP_Y[type] ?? 1.5;
    const wide = WIDE.has(type);
    const isHole = HOLE.has(type);
    const overhead = OVERHEAD.has(type);

    if (!isHole) {
      group.add(mesh(ringGeo, ringMat, 0, 0.03, 0));
      group.add(mesh(ringGeo, ring2Mat, 0, 0.025, 0, 1.4, 1, 1.4));
    }

    switch (zoneId) {
      case "torii_path": {
        addFlame(group, -1.25, 0.2, false);
        addFlame(group, 1.25, 0.2, false);
        if (type !== "LANTERN_LOW" && !isHole) {
          group.add(mesh(sphere, chochinMat, 0, top + 0.28, 0, 0.2, 0.26, 0.2));
          group.add(mesh(cone, goldMat, 0, top - 0.1, 0, 0.6, -0.5, 0.6));
        }
        break;
      }
      case "sakura_grove": {
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2 + 0.4;
          const r = 0.6 + (i % 3) * 0.22;
          group.add(mesh(sphere, pinkMat, Math.cos(a) * r, 0.07, Math.sin(a) * r * 0.7, 0.18, 0.04, 0.14));
        }
        if (!isHole) {
          group.add(mesh(sphere, pinkMat, -0.45, top + 0.12, 0, 0.36, 0.22, 0.34));
          group.add(mesh(sphere, pinkMat, 0.5, top + 0.1, 0, 0.3, 0.2, 0.3));
        }
        break;
      }
      case "moonlight_shrine": {
        group.add(mesh(sphere, mossMat, -0.75, 0.08, 0.1, 0.45, 0.14, 0.35));
        group.add(mesh(sphere, mossMat, 0.8, 0.08, -0.1, 0.4, 0.13, 0.32));
        addFlame(group, -1.25, 0.35, true);
        addFlame(group, 1.25, 0.35, true);
        if (!isHole && !wide) addFlame(group, 0, top + 0.1, true);
        break;
      }
      case "fuji_summit": {
        if (!isHole) {
          if (wide) group.add(mesh(sphere, snowMat, 0, top + 0.05, 0, 1.2, 0.2, 0.3));
          else group.add(mesh(sphere, snowMat, 0, top + 0.02, 0, 0.8, 0.3, 0.75));
        } else {
          group.add(mesh(sphere, snowMat, -1.0, 0.1, 0, 0.5, 0.12, 0.4));
        }
        group.add(mesh(octa, iceMat, -1.25, 0.5, 0, 0.7, 1.9, 0.7));
        group.add(mesh(octa, iceMat, 1.25, 0.42, 0, 0.6, 1.5, 0.6));
        break;
      }
      case "listening_realm": {
        if (!isHole) {
          const nm = noteMats[type.length % 2];
          const y = top + 0.55;
          group.add(mesh(sphere, nm, 0, y, 0, 0.19, 0.14, 0.14));
          group.add(mesh(stem, nm, 0.17, y + 0.4, 0));
          const flag = mesh(sphere, nm, 0.3, y + 0.76, 0, 0.16, 0.05, 0.05);
          flag.rotation.z = -0.5;
          group.add(flag);
        }
        group.add(mesh(ringGeo, ring2Mat, 0, 0.035, 0, 1.8, 1, 1.8));
        break;
      }
      case "kansai_festival": {
        if (!isHole) {
          const y = overhead ? top + 0.4 : top + 0.35;
          group.add(mesh(sphere, chochinMat, 0, y, 0, 0.26, 0.33, 0.26));
          group.add(mesh(cyl, goldMat, 0, y + 0.36, 0));
          group.add(mesh(cyl, goldMat, 0, y - 0.36, 0));
        }
        [-1.25, 1.25].forEach((x) => {
          group.add(mesh(sphere, chochinMat, x, 0.38, 0, 0.2, 0.26, 0.2));
          group.add(mesh(cyl, goldMat, x, 0.12, 0));
        });
        break;
      }
      default:
        break;
    }
  };

  return { decorate, dispose: () => tk.disposeAll() };
}