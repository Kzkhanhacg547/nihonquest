import * as THREE from "three";
import { SpiritBeast } from "@/lib/yokai-dash/types";

export interface BeastMeshBundle {
  group: THREE.Group;
  id: string;
  parts: {
    body?: THREE.Mesh;
    head?: THREE.Mesh;
    ears?: THREE.Mesh[];
    tails?: THREE.Mesh[];
    wings?: THREE.Mesh[];
    limbs?: THREE.Mesh[];
    accents?: THREE.Object3D[];
    auraLight?: THREE.PointLight;
    particles?: THREE.Points;
  };
}

/**
 * Creates Japanese anime fantasy 3D models for all 5 Spirit Beasts
 * using stylized geometric compositions, anime palettes, and cultural accessories.
 */
export function createBeast3DModel(beast: SpiritBeast): BeastMeshBundle {
  const root = new THREE.Group();
  const mainColor = new THREE.Color(beast.color);
  const glowColor = new THREE.Color(beast.glowColor);

  switch (beast.id) {
    case "kitsune":
      return buildKitsune(root, beast, mainColor, glowColor);
    case "neko_samurai":
      return buildNekoSamurai(root, beast, mainColor, glowColor);
    case "tanuki":
      return buildTanuki(root, beast, mainColor, glowColor);
    case "yatagarasu":
      return buildYatagarasu(root, beast, mainColor, glowColor);
    case "okami":
      return buildOkami(root, beast, mainColor, glowColor);
    default:
      return buildKitsune(root, beast, mainColor, glowColor);
  }
}

/**
 * 1. KITSUNE (Hồ Ly Chín Đuôi Linh Hỏa)
 * - Slender fox anime silhouette, Kitsune mask markings
 * - 9 glowing tails fanned out behind
 * - Magatama necklace and floating Foxfire orbs
 */

// ============================================================================
//  KITSUNE v2 — Nine-tailed spirit fox
//  Giữ nguyên chữ ký hàm + contract (parts.body/head/ears/tails/accents/limbs/auraLight).
//  Cần có sẵn: import * as THREE from "three";  và type SpiritBeast, BeastMeshBundle.
// ============================================================================

const K_UP = new THREE.Vector3(0, 1, 0);
const K_Z = new THREE.Vector3(0, 0, 1);

// ---------------------------------------------------------------- utilities --
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Bảng nội suy mượt theo u: tbl([[0,.1],[.5,.3],[1,.05]]) */
function tbl(pts: [number, number][]) {
  return (u: number) => {
    for (let i = 1; i < pts.length; i++) {
      if (u <= pts[i][0]) {
        const [u0, v0] = pts[i - 1];
        const [u1, v1] = pts[i];
        const t = (u - u0) / (u1 - u0 || 1);
        return v0 + (v1 - v0) * (t * t * (3 - 2 * t));
      }
    }
    return pts[pts.length - 1][1];
  };
}

type Profile = (u: number) => { rx: number; ry: number };

function capRound(u: number, a: number, b: number) {
  if (u < a) {
    const t = (a - u) / a;
    return Math.sqrt(Math.max(0, 1 - t * t));
  }
  if (u > 1 - b) {
    const t = (u - (1 - b)) / b;
    return Math.sqrt(Math.max(0, 1 - t * t));
  }
  return 1;
}

function rounded(p: Profile, a = 0.1, b = 0.1): Profile {
  return (u) => {
    const r = p(u);
    const k = capRound(u, a, b);
    return { rx: Math.max(r.rx * k, 0.002), ry: Math.max(r.ry * k, 0.002) };
  };
}

function frameAt(curve: THREE.Curve<THREE.Vector3>, u: number, ref: THREE.Vector3) {
  const t = curve.getTangentAt(u).normalize();
  const side = new THREE.Vector3().crossVectors(ref, t).normalize();
  const up = new THREE.Vector3().crossVectors(t, side).normalize();
  return { t, side, up };
}

/**
 * LOFT: kéo một tiết diện ellipse (rx, ry) biến thiên dọc theo đường cong.
 * Đây là thứ thay thế các khối cầu/hình trụ ghép: thân, cổ, chân, tai, đuôi
 * đều là một mặt liền mạch với tỉ lệ cơ bắp thật.
 */
function loft(
  curve: THREE.Curve<THREE.Vector3>,
  profile: Profile,
  segs = 32,
  radial = 18,
  ref: THREE.Vector3 = K_UP,
  colorFn?: (u: number, theta: number) => THREE.Color,
  uvRep: [number, number] = [1, 1]
) {
  const pos: number[] = [];
  const uv: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const white = new THREE.Color(1, 1, 1);

  for (let j = 0; j <= segs; j++) {
    const u = j / segs;
    const p = curve.getPointAt(u);
    const { side, up } = frameAt(curve, u, ref);
    const { rx, ry } = profile(u);
    for (let k = 0; k <= radial; k++) {
      const th = (k / radial) * Math.PI * 2;
      const c = Math.cos(th);
      const s = Math.sin(th);
      pos.push(
        p.x + side.x * c * rx + up.x * s * ry,
        p.y + side.y * c * rx + up.y * s * ry,
        p.z + side.z * c * rx + up.z * s * ry
      );
      uv.push((k / radial) * uvRep[0], u * uvRep[1]);
      const cc = colorFn ? colorFn(u, th) : white;
      col.push(cc.r, cc.g, cc.b);
      if (j < segs && k < radial) {
        const a = j * (radial + 1) + k;
        const b = a + radial + 1;
        idx.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// ------------------------------------------------------ surface sampling ----
interface Sample {
  pos: THREE.Vector3;
  normal: THREE.Vector3;
  tangent: THREE.Vector3;
  u: number;
}
type Sampler = (r: () => number) => Sample | null;

function loftSampler(
  curve: THREE.Curve<THREE.Vector3>,
  profile: Profile,
  ref: THREE.Vector3,
  uMin: number,
  uMax: number,
  thMin = 0,
  thMax = Math.PI * 2
): Sampler {
  return (r) => {
    const u = uMin + r() * (uMax - uMin);
    const th = thMin + r() * (thMax - thMin);
    const { t, side, up } = frameAt(curve, u, ref);
    const { rx, ry } = profile(u);
    const c = Math.cos(th);
    const s = Math.sin(th);
    const pos = curve
      .getPointAt(u)
      .addScaledVector(side, c * rx)
      .addScaledVector(up, s * ry);
    const normal = side
      .clone()
      .multiplyScalar(c / Math.max(rx, 1e-3))
      .addScaledVector(up, s / Math.max(ry, 1e-3))
      .normalize();
    return { pos, normal, tangent: t, u };
  };
}

function ellipsoidSampler(
  radii: THREE.Vector3,
  tangent: THREE.Vector3,
  accept: (n: THREE.Vector3) => boolean
): Sampler {
  return (r) => {
    const z = r() * 2 - 1;
    const a = r() * Math.PI * 2;
    const q = Math.sqrt(1 - z * z);
    const d = new THREE.Vector3(q * Math.cos(a), z, q * Math.sin(a));
    const normal = new THREE.Vector3(d.x / radii.x, d.y / radii.y, d.z / radii.z).normalize();
    if (!accept(normal)) return null;
    return {
      pos: new THREE.Vector3(d.x * radii.x, d.y * radii.y, d.z * radii.z),
      normal,
      tangent,
      u: (d.y + 1) / 2,
    };
  };
}

function ellipsoidPoint(radii: THREE.Vector3, dir: [number, number, number], offset = 0) {
  const d = new THREE.Vector3(...dir).normalize();
  const pos = new THREE.Vector3(d.x * radii.x, d.y * radii.y, d.z * radii.z);
  const normal = new THREE.Vector3(d.x / radii.x, d.y / radii.y, d.z / radii.z).normalize();
  pos.addScaledVector(normal, offset);
  return { pos, normal };
}

/**
 * FUR TUFTS: hàng nghìn "sợi lông" hình nón mảnh (InstancedMesh, 1 draw call)
 * mọc từ bề mặt, xuôi theo chiều lông. Phá vỡ đường viền trơn của khối.
 */
function addTufts(
  parent: THREE.Object3D,
  sampler: Sampler,
  o: {
    count: number;
    radius: number;
    sweep: number;
    lift: number;
    seed: number;
    length: (s: Sample) => number;
    color: (s: Sample) => THREE.Color;
  }
) {
  const rnd = mulberry32(o.seed);
  const geo = new THREE.ConeGeometry(o.radius, 1, 5, 1, true);
  geo.translate(0, 0.5, 0);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.85,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, o.count);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const sc = new THREE.Vector3();
  const d = new THREE.Vector3();
  const p = new THREE.Vector3();
  let n = 0;

  for (let tries = 0; tries < o.count * 5 && n < o.count; tries++) {
    const s = sampler(rnd);
    if (!s) continue;
    d.copy(s.normal).multiplyScalar(o.lift).addScaledVector(s.tangent, o.sweep);
    d.x += (rnd() - 0.5) * 0.4;
    d.y += (rnd() - 0.5) * 0.4;
    d.z += (rnd() - 0.5) * 0.4;
    d.normalize();
    q.setFromUnitVectors(K_UP, d);
    const len = o.length(s) * (0.7 + rnd() * 0.6);
    const w = 0.8 + rnd() * 0.6;
    sc.set(w, len, w);
    p.copy(s.pos).addScaledVector(s.normal, -0.012);
    m.compose(p, q, sc);
    mesh.setMatrixAt(n, m);
    mesh.setColorAt(n, o.color(s));
    n++;
  }
  mesh.count = n;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.frustumCulled = false;
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

// ---------------------------------------------------- procedural textures ----
function drawSwirl(
  g: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  rnd: () => number,
  hex: string
) {
  const dir = rnd() > 0.5 ? 1 : -1;
  const turns = 1.5 + rnd() * 0.8;
  const rot = rnd() * Math.PI * 2;
  const steps = 56;
  g.strokeStyle = hex;
  g.lineCap = "round";
  for (let i = 0; i < steps; i++) {
    const t0 = i / steps;
    const t1 = (i + 1) / steps;
    const a0 = rot + dir * t0 * turns * Math.PI * 2;
    const a1 = rot + dir * t1 * turns * Math.PI * 2;
    const r0 = r * (1 - t0 * 0.86);
    const r1 = r * (1 - t1 * 0.86);
    g.lineWidth = 1.5 + 7 * (1 - t0);
    g.beginPath();
    g.moveTo(cx + Math.cos(a0) * r0, cy + Math.sin(a0) * r0);
    g.lineTo(cx + Math.cos(a1) * r1, cy + Math.sin(a1) * r1);
    g.stroke();
  }
  // đuôi vẫy của hoa văn
  g.lineWidth = 6;
  g.beginPath();
  const sx = cx + Math.cos(rot) * r;
  const sy = cy + Math.sin(rot) * r;
  g.moveTo(sx, sy);
  g.quadraticCurveTo(sx + 26, sy - 6, sx + 46, sy + 22 * dir);
  g.stroke();
}

function makeFurMaps(seed: number, markHex: string, marks: number) {
  if (typeof document === "undefined") {
    return { map: null, bumpMap: null };
  }
  const S = 512;
  const rnd = mulberry32(seed);
  const cMap = document.createElement("canvas");
  const cBump = document.createElement("canvas");
  cMap.width = cMap.height = cBump.width = cBump.height = S;
  const g = cMap.getContext("2d")!;
  const gb = cBump.getContext("2d")!;
  g.fillStyle = "#fff7ec";
  g.fillRect(0, 0, S, S);
  gb.fillStyle = "#808080";
  gb.fillRect(0, 0, S, S);

  for (let i = 0; i < 3600; i++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const len = 10 + rnd() * 34;
    const ang = Math.PI / 2 + (rnd() - 0.5) * 0.5;
    const x2 = x + Math.cos(ang) * len;
    const y2 = y + Math.sin(ang) * len;
    const light = rnd() > 0.45;
    const lw = 0.7 + rnd() * 1.2;
    g.strokeStyle = light
      ? `rgba(255,255,255,${0.25 + rnd() * 0.3})`
      : `rgba(214,188,166,${0.12 + rnd() * 0.22})`;
    g.lineWidth = lw;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x2, y2);
    g.stroke();
    gb.strokeStyle = light ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)";
    gb.lineWidth = lw;
    gb.beginPath();
    gb.moveTo(x, y);
    gb.lineTo(x2, y2);
    gb.stroke();
  }
  for (let m = 0; m < marks; m++) {
    drawSwirl(g, 70 + rnd() * (S - 140), 70 + rnd() * (S - 140), 24 + rnd() * 30, rnd, markHex);
  }
  const mk = (c: HTMLCanvasElement, srgb: boolean) => {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  return { map: mk(cMap, true), bump: mk(cBump, false) };
}

// ------------------------------------------------------------- flame shader --
function makeFlameMaterial(
  uTime: { value: number },
  inner: THREE.Color,
  outer: THREE.Color,
  seed: number,
  intensity: number
) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime,
      uInner: { value: inner },
      uOuter: { value: outer },
      uSeed: { value: seed },
      uI: { value: intensity },
    },
    vertexShader: /* glsl */ `
      uniform float uTime; uniform float uSeed;
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){
        vUv = uv;
        vec3 p = position;
        float w = uv.y;
        p.x += sin(uTime*4.0 + w*7.0 + uSeed) * 0.05 * w;
        p.z += cos(uTime*3.3 + w*6.0 + uSeed*1.7) * 0.05 * w;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uInner; uniform vec3 uOuter;
      uniform float uTime; uniform float uSeed; uniform float uI;
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){
        float h = vUv.y;
        float rim = pow(abs(dot(normalize(vN), normalize(vV))), 1.1);
        float flick = 0.82 + 0.18 * sin(uTime*9.0 + vUv.x*12.566 + h*10.0 + uSeed);
        float a = rim * (1.0 - smoothstep(0.3, 1.0, h)) * flick;
        vec3 c = mix(uInner, uOuter, smoothstep(0.0, 0.8, h));
        gl_FragColor = vec4(c * uI, a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

/** Ngọn lửa hình giọt nước cong, 2 lớp (viền cam + lõi vàng), tự animate theo uTime. */
function addFlame(
  parent: THREE.Object3D,
  pos: THREE.Vector3,
  dir: THREE.Vector3,
  length: number,
  radius: number,
  uTime: { value: number },
  outerCol: THREE.Color,
  innerCol: THREE.Color,
  seed: number
): THREE.Mesh {
  const L = length;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.03 * L, 0.35 * L, 0),
    new THREE.Vector3(-0.05 * L, 0.7 * L, 0.02 * L),
    new THREE.Vector3(0.08 * L, L, 0),
  ]);
  const prof = (r: number): Profile => (u) => {
    const w = r * Math.sin(Math.PI * Math.pow(u, 0.55)) * (1 - 0.35 * u) + 0.002;
    return { rx: w, ry: w };
  };
  const tick = () => {
    uTime.value = performance.now() * 0.001;
  };

  const outer = new THREE.Mesh(
    loft(curve, prof(radius), 20, 12, K_Z),
    makeFlameMaterial(uTime, outerCol.clone().lerp(innerCol, 0.35), outerCol, seed, 1.25)
  );
  const core = new THREE.Mesh(
    loft(curve, prof(radius * 0.55), 20, 10, K_Z),
    makeFlameMaterial(uTime, new THREE.Color(0xfff4c8), innerCol, seed + 3.1, 1.6)
  );
  core.scale.setScalar(0.82);
  outer.add(core);
  outer.onBeforeRender = tick;
  core.onBeforeRender = tick;
  outer.position.copy(pos);
  outer.quaternion.setFromUnitVectors(K_UP, dir.clone().normalize());
  outer.renderOrder = 5;
  parent.add(outer);
  return outer;
}

// ============================================================================
function buildKitsune(
  root: THREE.Group,
  beast: SpiritBeast,
  color: THREE.Color,
  glow: THREE.Color
): BeastMeshBundle {
  const parts: BeastMeshBundle["parts"] = {
    ears: [],
    tails: [],
    accents: [],
    limbs: [],
  };

  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const uTime = { value: 0 };

  // ---- palette (trắng ngà + chu sa + vàng + lửa) ----------------------------
  const whiteC = new THREE.Color(0xfff6ea).lerp(color, 0.06);
  const markC = new THREE.Color(0xc92f2a).lerp(color, 0.25);
  const markBright = new THREE.Color(0xe5432f).lerp(glow, 0.2);
  const markHex = "#" + markC.getHexString();
  const flameOuter = new THREE.Color(0xff4a12).lerp(glow, 0.4);
  const flameInner = new THREE.Color(0xffd36a);

  // ---- 3 bộ texture lông (đổi seed để mỗi đuôi hơi khác nhau) ---------------
  const furMaps = [
    makeFurMaps(11, markHex, 7),
    makeFurMaps(23, markHex, 6),
    makeFurMaps(37, markHex, 8),
  ];
  const furMat = (i: number, vertexColors: boolean, emissive = 0) =>
    new THREE.MeshStandardMaterial({
      map: furMaps[i].map,
      bumpMap: furMaps[i].bump,
      bumpScale: 1.4,
      roughness: 0.78,
      metalness: 0,
      vertexColors,
      emissive: glow,
      emissiveIntensity: emissive,
    });

  const bodyMat = furMat(0, true, 0.03);
  const headMat = furMat(1, false, 0.03);
  const tailMats = [furMat(0, true, 0.1), furMat(1, true, 0.1), furMat(2, true, 0.1)];
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xfff0de, roughness: 0.85 });
  const shadowMat = new THREE.MeshStandardMaterial({ color: 0x2b1830, roughness: 0.5 });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xffd27a,
    metalness: 0.65,
    roughness: 0.26,
    emissive: 0x9b4515,
    emissiveIntensity: 0.28,
  });
  const redMat = new THREE.MeshStandardMaterial({
    color: markC,
    emissive: 0x65101c,
    emissiveIntensity: 0.25,
    roughness: 0.45,
  });
  const earInnerMat = new THREE.MeshStandardMaterial({
    color: 0xe8665a,
    emissive: 0x7a1d1d,
    emissiveIntensity: 0.3,
    roughness: 0.6,
  });
  const gemMat = new THREE.MeshStandardMaterial({
    color: glow,
    emissive: glow,
    emissiveIntensity: 1.4,
    roughness: 0.2,
  });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffc83a });
  const darkMat = new THREE.MeshBasicMaterial({ color: 0x1b0d1e });

  function addMesh(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    parent: THREE.Object3D,
    position: THREE.Vector3,
    scale?: THREE.Vector3
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    if (scale) mesh.scale.copy(scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  /** Nét vẽ hoa văn đỏ bám theo mặt ellipsoid (đầu). Thon hai đầu như nét cọ. */
  function paintStroke(
    parent: THREE.Object3D,
    radii: THREE.Vector3,
    dirs: [number, number, number][],
    width: number,
    closed = false
  ) {
    const pts = dirs.map((d) => ellipsoidPoint(radii, d, -width * 0.35).pos);
    const curve = new THREE.CatmullRomCurve3(pts, closed);
    const prof: Profile = (u) => {
      const w = closed ? width : width * Math.max(0.15, Math.pow(Math.sin(Math.PI * u), 0.5));
      return { rx: w, ry: w };
    };
    const m = new THREE.Mesh(loft(curve, prof, 36, 6, K_UP), redMat);
    parent.add(m);
    return m;
  }

  const tuftColor = (s: Sample) =>
    whiteC.clone().multiplyScalar(0.93 + (s.u * 1.7 - Math.floor(s.u * 1.7)) * 0.07);

  // ==========================================================================
  //  THÂN — loft liền mạch: ngực sâu, eo thon, hông tròn
  // ==========================================================================
  const BODY_C = V(0, 0.82, 0);
  const torsoCurve = new THREE.CatmullRomCurve3([
    V(0, -0.02, -0.56),
    V(0, 0.06, -0.32),
    V(0, 0.03, 0.0),
    V(0, 0.0, 0.3),
    V(0, 0.02, 0.56),
  ]);
  const rxT = tbl([[0, 0.13], [0.2, 0.21], [0.5, 0.19], [0.78, 0.2], [1, 0.17]]);
  const ryT = tbl([[0, 0.24], [0.2, 0.3], [0.5, 0.26], [0.78, 0.24], [1, 0.21]]);
  const torsoProf = rounded((u) => ({ rx: rxT(u), ry: ryT(u) }), 0.14, 0.1);

  const body = new THREE.Mesh(
    loft(torsoCurve, torsoProf, 40, 24, K_UP, undefined, [3, 1.8]),
    bodyMat
  );
  body.position.copy(BODY_C);
  body.castShadow = body.receiveShadow = true;
  root.add(body);
  parts.body = body;

  // lông thân + bờm ngực dày
  addTufts(body, loftSampler(torsoCurve, torsoProf, K_UP, 0.05, 0.98), {
    count: 420, radius: 0.026, sweep: 1.0, lift: 0.45, seed: 101,
    length: () => 0.13, color: tuftColor,
  });
  addTufts(body, loftSampler(torsoCurve, torsoProf, K_UP, 0.0, 0.4), {
    count: 320, radius: 0.03, sweep: 0.8, lift: 0.7, seed: 102,
    length: (s) => 0.2 + 0.1 * (1 - s.u), color: tuftColor,
  });

  // ---- cổ ------------------------------------------------------------------
  const neckCurve = new THREE.CatmullRomCurve3([V(0, 0.95, -0.42), V(0, 1.04, -0.56), V(0, 1.13, -0.66)]);
  const neckProf: Profile = (u) => ({ rx: 0.17 - 0.05 * u, ry: 0.2 - 0.06 * u });
  const neck = new THREE.Mesh(loft(neckCurve, neckProf, 14, 20, K_UP, undefined, [2, 1]), bodyMat);
  neck.castShadow = true;
  root.add(neck);
  addTufts(neck, loftSampler(neckCurve, neckProf, K_UP, 0.0, 0.95), {
    count: 230, radius: 0.03, sweep: -0.9, lift: 0.6, seed: 103,
    length: (s) => 0.22 - 0.08 * s.u, color: tuftColor,
  });

  // ==========================================================================
  //  ĐẦU
  // ==========================================================================
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.15, -0.68);
  headGroup.rotation.x = 0.05;
  root.add(headGroup);

  const SK = V(0.3, 0.27, 0.3); // bán kính hộp sọ
  const head = addMesh(new THREE.SphereGeometry(1, 40, 28), headMat, headGroup, V(0, 0, 0), SK);
  parts.head = head;

  // mõm thon dài (loft thu nhỏ dần) + hàm dưới
  const muzzleCurve = new THREE.CatmullRomCurve3([V(0, -0.03, -0.1), V(0, -0.06, -0.28), V(0, -0.09, -0.42), V(0, -0.105, -0.52)]);
  const muzzleProf = rounded((u) => ({ rx: 0.15 - 0.115 * u, ry: 0.13 - 0.085 * u }), 0.01, 0.14);
  const muzzle = new THREE.Mesh(loft(muzzleCurve, muzzleProf, 20, 18, K_UP), creamMat);
  muzzle.castShadow = true;
  headGroup.add(muzzle);

  const jawCurve = new THREE.CatmullRomCurve3([V(0, -0.14, -0.14), V(0, -0.15, -0.3), V(0, -0.145, -0.44)]);
  const jaw = new THREE.Mesh(
    loft(jawCurve, rounded((u) => ({ rx: 0.1 - 0.06 * u, ry: 0.05 - 0.025 * u }), 0.05, 0.2), 12, 12, K_UP),
    creamMat
  );
  headGroup.add(jaw);

  addMesh(new THREE.SphereGeometry(1, 16, 12), darkMat, headGroup, V(0, -0.09, -0.535), V(0.042, 0.032, 0.034)); // mũi

  // bờm má
  addTufts(headGroup, ellipsoidSampler(SK, V(0, -0.15, 1).normalize(), (n) => n.z > -0.3 && n.y < 0.55 && Math.abs(n.x) > 0.35), {
    count: 150, radius: 0.026, sweep: 1.0, lift: 0.7, seed: 104,
    length: () => 0.17, color: tuftColor,
  });

  // mắt hẹp phượng + eyeliner đỏ
  for (const side of [-1, 1]) {
    const e = ellipsoidPoint(SK, [side * 0.55, 0.12, -0.82], 0.002);
    const eyeG = new THREE.Group();
    eyeG.position.copy(e.pos);
    eyeG.quaternion.setFromUnitVectors(K_Z, e.normal);
    eyeG.rotateZ(-side * 0.28); // nếu mắt xếch ngược, đổi dấu này
    headGroup.add(eyeG);
    const ball = new THREE.SphereGeometry(1, 20, 14);
    addMesh(ball, shadowMat, eyeG, V(0, 0, 0), V(0.072, 0.036, 0.012));
    addMesh(ball, eyeMat, eyeG, V(0, 0, 0.004), V(0.058, 0.03, 0.016));
    addMesh(ball, darkMat, eyeG, V(0, 0, 0.012), V(0.01, 0.026, 0.008));
    addMesh(ball, new THREE.MeshBasicMaterial({ color: 0xffffff }), eyeG, V(0.014, 0.01, 0.017), V(0.007, 0.007, 0.005));

    paintStroke(headGroup, SK, [[side * 0.62, 0.14, -0.77], [side * 0.78, 0.17, -0.58], [side * 0.92, 0.2, -0.34]], 0.01);
    paintStroke(headGroup, SK, [[side * 0.8, -0.08, -0.5], [side * 0.92, -0.05, -0.25], [side * 0.97, -0.2, 0.05]], 0.012);
    paintStroke(headGroup, SK, [[side * 0.74, -0.2, -0.55], [side * 0.88, -0.2, -0.32], [side * 0.93, -0.3, -0.08]], 0.009);
  }

  // vòng tròn + chấm trên trán
  const ringDirs: [number, number, number][] = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    return [Math.cos(a) * 0.16, 0.62 + Math.sin(a) * 0.13, -0.77];
  });
  paintStroke(headGroup, SK, ringDirs, 0.011, true);
  const dot = ellipsoidPoint(SK, [0, 0.62, -0.77], 0);
  addMesh(new THREE.SphereGeometry(1, 12, 10), redMat, headGroup, dot.pos, V(0.02, 0.02, 0.012));

  // ---- tai: loft dẹt, chóp đỏ, lòng tai hồng -------------------------------
  for (const side of [-1, 1]) {
    const earGroup = new THREE.Group();
    earGroup.position.set(side * 0.2, 0.2, 0.02);
    earGroup.rotation.set(-0.12, 0, -side * 0.28);
    headGroup.add(earGroup);

    const earCurve = new THREE.CatmullRomCurve3([V(0, 0, 0), V(0, 0.2, -0.01), V(0, 0.42, -0.05)]);
    const earProf: Profile = (u) => ({
      rx: 0.145 * Math.pow(1 - u, 0.8) + 0.002,
      ry: 0.032 * Math.pow(1 - u, 0.8) + 0.002,
    });
    const ear = new THREE.Mesh(
      loft(earCurve, earProf, 22, 12, K_Z, (u) =>
        whiteC.clone().lerp(markBright, THREE.MathUtils.smoothstep(u, 0.62, 0.95) * 0.9)
      ),
      bodyMat
    );
    ear.castShadow = true;
    earGroup.add(ear);

    const innerProf: Profile = (u) => ({
      rx: 0.1 * Math.pow(1 - u, 0.85) + 0.001,
      ry: 0.012 * (1 - u) + 0.001,
    });
    const inner = new THREE.Mesh(
      loft(new THREE.CatmullRomCurve3([V(0, 0.02, -0.03), V(0, 0.2, -0.04), V(0, 0.37, -0.075)]), innerProf, 18, 10, K_Z),
      earInnerMat
    );
    earGroup.add(inner);
    parts.ears?.push(ear);

    // bông tai vàng + tua đỏ (chỉ bên phải, giống concept)
    if (side === 1) {
      const ring = addMesh(new THREE.TorusGeometry(0.035, 0.008, 8, 20), goldMat, earGroup, V(0.09, 0.1, 0));
      ring.rotation.y = Math.PI / 2;
      addMesh(new THREE.SphereGeometry(0.02, 12, 10), goldMat, earGroup, V(0.095, 0.05, 0));
      const tassel = addMesh(new THREE.ConeGeometry(0.014, 0.1, 8), redMat, earGroup, V(0.095, -0.01, 0));
      tassel.rotation.z = Math.PI;
      parts.accents?.push(ring);
    }
  }

  // ==========================================================================
  //  CHÂN — loft thon, chân sau gập kiểu digitigrade, có móng đỏ + vòng vàng
  // ==========================================================================
  const legDefs = [
    { x: -0.2, front: true, pivot: V(-0.2, 0.7, -0.4) },
    { x: 0.2, front: true, pivot: V(0.2, 0.7, -0.4) },
    { x: -0.21, front: false, pivot: V(-0.21, 0.68, 0.45) },
    { x: 0.21, front: false, pivot: V(0.21, 0.68, 0.45) },
  ];

  for (const L of legDefs) {
    const pts: [number, number, number][] = L.front
      ? [[0, 0, 0], [0, -0.18, 0.01], [0, -0.36, -0.01], [0, -0.5, -0.02], [0, -0.62, -0.03]]
      : [[0, 0, 0], [0, -0.18, -0.1], [0, -0.36, 0.0], [0, -0.5, 0.08], [0, -0.62, 0.02]];
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => V(...p)));
    const prof: Profile = L.front
      ? rounded((u) => ({ rx: 0.1 - 0.052 * u, ry: 0.115 - 0.05 * u }), 0.02, 0.05)
      : rounded((u) => ({ rx: 0.13 * Math.pow(1 - u, 0.7) + 0.045, ry: 0.16 * Math.pow(1 - u, 0.7) + 0.05 }), 0.02, 0.05);

    const leg = new THREE.Mesh(loft(curve, prof, 26, 14, K_Z, undefined, [2, 2]), bodyMat);
    leg.position.copy(L.pivot); // gốc xoay = khớp vai/hông → animation xoay chân vẫn đúng
    leg.castShadow = leg.receiveShadow = true;
    root.add(leg);

    if (!L.front) {
      // bắp đùi sau
      addMesh(new THREE.SphereGeometry(1, 20, 16), bodyMat.clone(), leg, V(0, -0.04, 0), V(0.15, 0.2, 0.21));
    }
    addTufts(leg, loftSampler(curve, prof, K_Z, 0.05, 0.8), {
      count: 36, radius: 0.02, sweep: 1.0, lift: 0.5, seed: 200 + Math.floor(L.x * 100),
      length: () => 0.1, color: tuftColor,
    });

    // bàn chân + móng
    const pawY = L.front ? -0.66 : -0.64;
    const pawZ = L.front ? -0.07 : -0.04;
    addMesh(new THREE.SphereGeometry(1, 18, 14), creamMat, leg, V(0, pawY, pawZ), V(0.065, 0.04, 0.105));
    for (const dx of [-0.03, 0, 0.03]) {
      const claw = addMesh(new THREE.ConeGeometry(0.011, 0.05, 6), redMat, leg, V(dx, pawY - 0.005, pawZ - 0.115));
      claw.rotation.x = -Math.PI / 2 - 0.35; // mũi móng chỉ ra trước, hơi chúc xuống
    }

    // vòng chân vàng
    const anklet = addMesh(new THREE.TorusGeometry(0.063, 0.013, 8, 20), goldMat, leg, V(0, L.front ? -0.5 : -0.52, L.front ? -0.02 : 0.07));
    anklet.rotation.x = Math.PI / 2;
    parts.accents?.push(anklet);
    parts.limbs?.push(leg);
  }

  // ==========================================================================
  //  TRANG SỨC: vòng cổ, mề đay lửa, tua đỏ, chuông, giáp vai
  // ==========================================================================
  const collar = addMesh(new THREE.TorusGeometry(0.27, 0.028, 10, 40, Math.PI * 1.25), goldMat, root, V(0, 0.9, -0.5), V(0.78, 1.05, 1));
  collar.rotation.z = Math.PI * 1.375; // cung mở lên trên, võng xuống ngực
  parts.accents?.push(collar);

  const medalG = new THREE.Group();
  medalG.position.set(0, 0.63, -0.6);
  root.add(medalG);
  const disc = addMesh(new THREE.CylinderGeometry(0.085, 0.085, 0.022, 24), goldMat, medalG, V(0, 0, 0));
  disc.rotation.x = Math.PI / 2;
  const rim = addMesh(new THREE.TorusGeometry(0.088, 0.012, 8, 28), goldMat, medalG, V(0, 0, 0));
  const gem = addMesh(new THREE.SphereGeometry(0.045, 16, 12), gemMat, medalG, V(0, 0, -0.018), V(1, 1, 0.7));
  parts.accents?.push(disc, rim, gem);

  for (const dx of [-0.05, 0, 0.05]) {
    const drop = dx === 0 ? 0.0 : 0.03;
    addMesh(new THREE.SphereGeometry(0.016, 10, 8), goldMat, root, V(dx, 0.545 - drop, -0.605));
    const t = addMesh(new THREE.ConeGeometry(0.019, 0.13, 8), redMat, root, V(dx, 0.465 - drop, -0.605));
    t.rotation.z = Math.PI;
    parts.accents?.push(t);
  }
  for (const side of [-1, 1]) {
    // dây đỏ vắt vai xuống mề đay
    const cord = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([V(side * 0.2, 1.02, -0.4), V(side * 0.16, 0.8, -0.58), V(side * 0.07, 0.66, -0.62)]),
        20, 0.012, 6, false
      ),
      redMat
    );
    root.add(cord);
    // chuông vàng
    const bell = addMesh(new THREE.SphereGeometry(0.03, 12, 10), goldMat, root, V(side * 0.17, 0.62, -0.5));
    parts.accents?.push(bell);
    // giáp vai vàng
    const pad = addMesh(new THREE.SphereGeometry(1, 16, 12), goldMat, root, V(side * 0.21, 1.0, -0.26), V(0.06, 0.05, 0.09));
    pad.rotation.z = -side * 0.5;
    parts.accents?.push(pad);
  }

  // ==========================================================================
  //  CHÍN ĐUÔI — mỗi đuôi: loft dẹt + vertex-color đỏ ở chóp + lông tơ
  //               + ngọn lửa shader ở đầu đuôi
  // ==========================================================================
  const tailCount = 9;
  for (let i = 0; i < tailCount; i++) {
    const s = (i / (tailCount - 1)) * 2 - 1; // -1..1
    const a = s * 1.1;
    const L = 1.05 + 0.3 * (1 - Math.pow(Math.abs(s), 1.5));

    const pts: THREE.Vector3[] = [];
    for (const u of [0, 0.18, 0.4, 0.62, 0.82, 1]) {
      pts.push(
        V(
          Math.sin(a) * L * (0.5 * u + 0.35 * u * u),
          L * (0.12 * u + 0.62 * Math.cos(a) * Math.pow(u, 1.35)),
          L * (0.78 * u - 0.22 * u * u) * (0.85 + 0.15 * Math.cos(a))
        )
      );
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const prof: Profile = (u) => {
      const r = (0.055 + 0.2 * Math.sin(Math.PI * Math.pow(u, 0.65))) * (1 - Math.pow(u, 6)) + 0.004;
      return { rx: r * 1.1, ry: r * 0.85 };
    };

    const tail = new THREE.Mesh(
      loft(
        curve, prof, 48, 20, K_UP,
        (u) => whiteC.clone().lerp(markBright, THREE.MathUtils.smoothstep(u, 0.6, 0.98) * 0.95),
        [2, 2.5]
      ),
      tailMats[i % 3]
    );
    tail.position.set(s * 0.06, 0.84, 0.5); // gốc đuôi = tâm xoay animation
    tail.castShadow = true;
    root.add(tail);

    // lông tơ dài như cánh lông vũ, chóp ửng đỏ
    addTufts(tail, loftSampler(curve, prof, K_UP, 0.05, 0.98), {
      count: 150, radius: 0.028, sweep: 1.0, lift: 0.35, seed: 300 + i,
      length: (sm) => 0.14 + 0.2 * Math.sin(Math.PI * Math.min(1, sm.u * 1.05)),
      color: (sm) => whiteC.clone().lerp(markBright, THREE.MathUtils.smoothstep(sm.u, 0.6, 0.98)),
    });

    // lửa ở chóp đuôi (+ một ngọn nhỏ giữa đuôi cho đuôi chẵn)
    const endP = curve.getPointAt(1);
    const endT = curve.getTangentAt(1);
    const fdir = endT.clone().multiplyScalar(0.7).add(V(0, 0.9, 0)).normalize();
    const flame = addFlame(tail, endP.clone().addScaledVector(endT, -0.06), fdir, 0.42 + 0.1 * (1 - Math.abs(s)), 0.1, uTime, flameOuter, flameInner, i * 1.7);
    parts.accents?.push(flame);

    if (i % 2 === 0) {
      const mid = curve.getPointAt(0.8);
      const f2 = addFlame(tail, mid, V(Math.sin(a) * 0.4, 1, -0.1), 0.26, 0.065, uTime, flameOuter, flameInner, i * 2.3 + 1);
      parts.accents?.push(f2);
    }
    parts.tails?.push(tail);
  }

  // ==========================================================================
  //  HỒ LY HỎA (spirit fire) lơ lửng
  // ==========================================================================
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const radius = 0.9 + (i % 2) * 0.2;
    const orb = addMesh(
      new THREE.SphereGeometry(0.045 + (i % 2) * 0.015, 14, 10),
      new THREE.MeshBasicMaterial({ color: 0xfff0b0 }),
      root,
      V(Math.cos(angle) * radius, 0.95 + Math.sin(angle * 2) * 0.3, -0.15 + Math.sin(angle) * 0.4)
    );
    orb.castShadow = false;
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.1 + (i % 2) * 0.02, 14, 10),
      new THREE.MeshBasicMaterial({ color: glow, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    orb.add(halo);
    addFlame(orb, V(0, 0.02, 0), K_UP, 0.26 + (i % 2) * 0.06, 0.07, uTime, flameOuter, flameInner, i * 3.1);
    parts.accents?.push(orb);
  }

  // ---- aura ---------------------------------------------------------------
  const aura = new THREE.PointLight(glow, 3.0, 12);
  aura.position.set(0, 1.1, 0.2);
  root.add(aura);
  parts.auraLight = aura;

  return { group: root, id: beast.id, parts };
}


// =====================================================================
//  NEKO SAMURAI (侍猫 · NEKOMATA) — bản nâng cấp
//  Giữ nguyên chữ ký hàm + các parts (body, head, ears, tails, accents,
//  limbs, auraLight) nên code animation cũ vẫn chạy.
//  Cần: import * as THREE from "three";
// =====================================================================

const WITH_SHRINE = false; // false nếu scene của bạn đã có nền riêng (Yokai Dash & Showcase đã có sẵn đường chạy & bệ đá)
const FUR_LAYERS = 5;     // số lớp "shell fur" (giảm xuống 3 nếu cần nhẹ hơn)

/* ------------------------------------------------------------------ */
/*  Helpers: texture thủ tục, hình học tùy chỉnh                       */
/* ------------------------------------------------------------------ */

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvasTex(
  size: number,
  draw: (g: CanvasRenderingContext2D, s: number) => void,
  repeat: [number, number] = [1, 1],
  srgb = true
): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 4;
  if (srgb && "colorSpace" in t) (t as any).colorSpace = (THREE as any).SRGBColorSpace;
  return t;
}

/** Texture lông: nền + hàng nghìn sợi lông mảnh + vằn tabby */
function furTexture(
  base: string, light: string, dark: string,
  stripes = false, seed = 1, repeat: [number, number] = [2, 2]
) {
  return canvasTex(256, (g, s) => {
    const r = rng(seed);
    g.fillStyle = base;
    g.fillRect(0, 0, s, s);
    if (stripes) {
      for (let i = 0; i < 9; i++) {
        g.globalAlpha = 0.35;
        g.fillStyle = dark;
        g.beginPath();
        g.ellipse(s / 2, (i / 9) * s + r() * 10, s * 0.7, 7 + r() * 6, 0, 0, Math.PI * 2);
        g.fill();
      }
    }
    for (let i = 0; i < 2600; i++) {
      const x = r() * s, y = r() * s, l = 6 + r() * 12;
      g.strokeStyle = r() > 0.5 ? light : dark;
      g.globalAlpha = 0.12 + r() * 0.25;
      g.lineWidth = 0.6 + r() * 0.8;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + (r() - 0.5) * 4, y + l / 2, x + (r() - 0.5) * 6, y + l);
      g.stroke();
    }
    g.globalAlpha = 1;
  }, repeat);
}

/** alphaMap cho các lớp shell fur (tạo cảm giác lông tơ xung quanh) */
function furAlphaTexture(seed = 7) {
  return canvasTex(256, (g, s) => {
    const r = rng(seed);
    g.fillStyle = "#000";
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 3500; i++) {
      g.fillStyle = `rgba(255,255,255,${0.4 + r() * 0.6})`;
      g.fillRect(r() * s, r() * s, 1 + r() * 1.2, 2 + r() * 3);
    }
  }, [5, 5], false);
}

/** Texture giáp kozane: các hàng vảy sơn mài đỏ + chỉ buộc + đinh vàng */
function kozaneTexture(repeat: [number, number]) {
  return canvasTex(256, (g, s) => {
    g.fillStyle = "#8f1218";
    g.fillRect(0, 0, s, s);
    const rows = 8, h = s / rows;
    for (let r = 0; r < rows; r++) {
      const y = r * h;
      const gr = g.createLinearGradient(0, y, 0, y + h);
      gr.addColorStop(0, "#c8282e");
      gr.addColorStop(1, "#6a0c11");
      g.fillStyle = gr;
      g.fillRect(0, y, s, h - 2);
      g.fillStyle = "#2a0507";
      g.fillRect(0, y + h - 2, s, 2);
      for (let x = 8; x < s; x += 16) {
        g.fillStyle = "#e3b84a";
        g.beginPath();
        g.arc(x, y + h * 0.35, 1.6, 0, 6.3);
        g.fill();
        g.fillStyle = "rgba(0,0,0,.25)";
        g.fillRect(x + 7, y, 1, h - 2);
      }
    }
  }, repeat);
}

/** Cuốn chuôi kiếm (ito) hình thoi */
function itoTexture() {
  return canvasTex(128, (g, s) => {
    g.fillStyle = "#d9d4c8";
    g.fillRect(0, 0, s, s);
    g.strokeStyle = "#16171b";
    g.lineWidth = 14;
    for (let i = -s; i < 2 * s; i += 32) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i + s, s); g.stroke();
      g.beginPath(); g.moveTo(i + s, 0); g.lineTo(i, s); g.stroke();
    }
  }, [1, 3]);
}

/** Đá cổ nứt nẻ */
function stoneTexture() {
  return canvasTex(256, (g, s) => {
    const r = rng(11);
    g.fillStyle = "#5b4b45";
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 4000; i++) {
      g.fillStyle = r() > 0.5 ? "rgba(150,140,130,.25)" : "rgba(30,20,20,.3)";
      g.fillRect(r() * s, r() * s, 1 + r() * 3, 1 + r() * 3);
    }
    g.strokeStyle = "rgba(15,10,10,.8)";
    g.lineWidth = 1.5;
    for (let k = 0; k < 6; k++) {
      let x = r() * s, y = r() * s;
      g.beginPath(); g.moveTo(x, y);
      for (let i = 0; i < 8; i++) { x += (r() - 0.5) * 40; y += (r() - 0.5) * 40; g.lineTo(x, y); }
      g.stroke();
    }
  }, [3, 1]);
}

/** Lớp lông tơ: nhân bản mesh, đẩy đỉnh theo pháp tuyến, alphaMap dạng sợi */
function addFurShells(
  mesh: THREE.Mesh, color: number, alpha: THREE.Texture | null,
  length = 0.03, layers = FUR_LAYERS
) {
  if (!alpha) return;
  for (let i = 1; i <= layers; i++) {
    const k = i / layers;
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color).multiplyScalar(0.8 + 0.35 * k),
      roughness: 1,
      transparent: true,
      opacity: 0.5 * (1 - k * 0.6),
      alphaMap: alpha,
      depthWrite: false,
    });
    mat.onBeforeCompile = (sh: any) => {
      sh.vertexShader = sh.vertexShader.replace(
        "#include <begin_vertex>",
        `vec3 transformed = position + normal * ${(length * k).toFixed(4)};`
      );
    };
    const shell = new THREE.Mesh(mesh.geometry, mat);
    shell.renderOrder = 1;
    mesh.add(shell);
  }
}

/** Ống thon dần theo đường cong (dùng cho đuôi) + màu đỉnh theo t */
function taperedTube(
  curve: THREE.Curve<THREE.Vector3>, segs: number, radial: number,
  radiusAt: (t: number) => number,
  colorAt?: (t: number) => THREE.Color
) {
  const frames = curve.computeFrenetFrames(segs, false);
  const pos: number[] = [], uv: number[] = [], col: number[] = [], idx: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const p = curve.getPointAt(t);
    const N = frames.normals[i], B = frames.binormals[i];
    const rad = radiusAt(t);
    const c = colorAt ? colorAt(t) : new THREE.Color(1, 1, 1);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2, cs = Math.cos(a), sn = Math.sin(a);
      pos.push(
        p.x + rad * (cs * N.x + sn * B.x),
        p.y + rad * (cs * N.y + sn * B.y),
        p.z + rad * (cs * N.z + sn * B.z)
      );
      uv.push(j / radial, t * 3);
      col.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < segs; i++)
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j, b = a + radial + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Tấm giáp cong có viền vàng. Mặt ngoài hướng +Z, mép cong vào trong. */
function curvedPlate(
  w: number, h: number, bend: number,
  mat: THREE.Material, trim: THREE.Material
) {
  const mk = (ww: number, hh: number, zOff: number, m: THREE.Material) => {
    const g = new THREE.PlaneGeometry(ww, hh, 8, 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) / (w / 2);
      p.setZ(i, zOff - bend * x * x);
    }
    g.computeVertexNormals();
    return new THREE.Mesh(g, m);
  };
  const grp = new THREE.Group();
  grp.add(mk(w, h, 0, mat));
  grp.add(mk(w + 0.03, h + 0.03, -0.006, trim));
  return grp;
}

/** Huy hiệu hoa 5 cánh (mon) */
function flowerGeometry(R: number, depth: number) {
  const s = new THREE.Shape();
  const N = 72;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const r = R * (0.55 + 0.45 * Math.abs(Math.cos(a * 2.5)));
    const x = r * Math.cos(a), y = r * Math.sin(a);
    i === 0 ? s.moveTo(x, y) : s.lineTo(x, y);
  }
  return new THREE.ExtrudeGeometry(s, {
    depth, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004,
    bevelSegments: 1, curveSegments: 1,
  });
}

function thinTube(pts: THREE.Vector3[], r: number, mat: THREE.Material, seg = 10) {
  return new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, r, 5, false), mat
  );
}

const V2 = (pts: [number, number][]) => pts.map(([x, y]) => new THREE.Vector2(x, y));

/* ------------------------------------------------------------------ */
/*  Hàm chính                                                          */
/* ------------------------------------------------------------------ */

function buildNekoSamurai(
  root: THREE.Group,
  beast: SpiritBeast,
  color: THREE.Color,
  glow: THREE.Color
): BeastMeshBundle {
  const parts: BeastMeshBundle["parts"] = { ears: [], tails: [], accents: [] };

  const rig = new THREE.Group();
  rig.scale.setScalar(0.8);
  root.add(rig);

  /* ---------- Vật liệu ---------- */
  const furTex = furTexture("#3a4147", "#8d98a0", "#12161a", true, 3, [2, 2]);
  const whiteTex = furTexture("#efefec", "#ffffff", "#c2c7cc", false, 5, [2, 2]);
  const alphaTex = furAlphaTexture();

  const fur = new THREE.MeshStandardMaterial({
    color: furTex ? 0xffffff : 0x3a4147, map: furTex, roughness: 0.9,
  });
  const furWhite = new THREE.MeshStandardMaterial({
    color: whiteTex ? 0xffffff : 0xeeeeee, map: whiteTex, roughness: 0.9,
  });
  const furDark = new THREE.MeshStandardMaterial({ color: 0x232a2f, roughness: 0.9 });
  const cloth = new THREE.MeshStandardMaterial({
    color: 0x15171b, roughness: 0.85, side: THREE.DoubleSide,
  });
  const rope = new THREE.MeshStandardMaterial({ color: 0xb01820, roughness: 0.7 });
  const redCloth = new THREE.MeshStandardMaterial({
    color: 0xc0171d, roughness: 0.55, side: THREE.DoubleSide,
  });
  const redLacquer = new THREE.MeshPhysicalMaterial({
    color: 0xa3141a, roughness: 0.3, metalness: 0.2,
    clearcoat: 1, clearcoatRoughness: 0.2, side: THREE.DoubleSide,
  });
  const gold = new THREE.MeshStandardMaterial({
    color: 0xe2b53c, metalness: 0.7, roughness: 0.28,
    emissive: 0x3a2800, emissiveIntensity: 0.5,
  });
  const kozaneMat = (rx: number, ry: number) => {
    const t = kozaneTexture([rx, ry]);
    return new THREE.MeshPhysicalMaterial({
      color: t ? 0xffffff : 0xa3141a, map: t, roughness: 0.3, metalness: 0.2,
      clearcoat: 1, clearcoatRoughness: 0.2, side: THREE.DoubleSide,
    });
  };
  const black = new THREE.MeshBasicMaterial({ color: 0x050505 });
  const pink = new THREE.MeshStandardMaterial({ color: 0xff7fa0, roughness: 0.4 });

  /* ---------- Thân (vải đen) + giáp ---------- */
  const torsoGeo = new THREE.LatheGeometry(
    V2([[0, 0.5], [0.44, 0.52], [0.52, 0.7], [0.5, 0.95], [0.5, 1.15],
        [0.47, 1.35], [0.38, 1.52], [0, 1.55]]), 32
  );
  torsoGeo.scale(1, 1, 0.8);
  const body = new THREE.Mesh(torsoGeo, cloth);
  rig.add(body);
  parts.body = body;

  // Ngực giáp (dou) kozane
  const douGeo = new THREE.LatheGeometry(
    V2([[0.5, 0.88], [0.52, 1.0], [0.58, 1.2], [0.58, 1.38], [0.54, 1.5]]), 40
  );
  const dou = new THREE.Mesh(douGeo, kozaneMat(4, 1.2));
  dou.scale.z = 0.85;
  body.add(dou);

  // Viền vàng trên/dưới/giữa
  [[0.54, 1.5], [0.5, 0.88], [0.585, 1.32]].forEach(([r, y]) => {
    const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.018, 6, 40), gold);
    t.rotation.x = Math.PI / 2;
    t.scale.set(1, 0.85, 1);
    t.position.y = y;
    body.add(t);
  });

  // Huy hiệu hoa trước ngực
  const chestCrest = new THREE.Group();
  const flower = new THREE.Mesh(flowerGeometry(0.17, 0.03), gold);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.02, 8, 32), gold);
  const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 10), redLacquer);
  jewel.position.z = 0.04;
  chestCrest.add(flower, ring, jewel);
  chestCrest.rotation.y = Math.PI;
  chestCrest.position.set(0, 1.2, -0.51);
  body.add(chestCrest);

  // Cổ lông trắng
  const ruff = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 16), furWhite);
  ruff.scale.set(1.2, 0.9, 0.9);
  ruff.position.set(0, 1.47, -0.2);
  body.add(ruff);
  addFurShells(ruff, 0xffffff, alphaTex, 0.035);

  // Dây cổ + chuông vàng (suzu)
  const cord = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.03, 8, 32), rope);
  cord.rotation.x = Math.PI / 2;
  cord.scale.set(1, 0.9, 1);
  cord.position.set(0, 1.52, -0.12);
  body.add(cord);

  const bell = new THREE.Group();
  bell.add(new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 16), gold));
  const groove = new THREE.Mesh(new THREE.TorusGeometry(0.108, 0.006, 6, 24), black);
  groove.rotation.x = Math.PI / 2;
  groove.position.y = -0.01;
  const slit = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.012, 0.02), black);
  slit.position.set(0, -0.045, -0.1);
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 6, 12), gold);
  loop.position.y = 0.115;
  bell.add(groove, slit, loop);
  bell.position.set(0, 1.4, -0.43);
  body.add(bell);

  // Obi dây thừng + nút thắt + tua rua
  const obi = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 10, 40), rope);
  obi.rotation.x = Math.PI / 2;
  obi.scale.set(1, 0.85, 1);
  obi.position.y = 0.88;
  body.add(obi);

  const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.07, 0.025, 64, 8, 2, 3), rope);
  knot.position.set(0, 0.88, -0.5);
  body.add(knot);

  [-0.08, 0.08].forEach((x) => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6), rope);
    c.position.set(x, 0.7, -0.5);
    const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.1, 8), gold);
    tassel.position.set(x, 0.5, -0.5);
    body.add(c, tassel);
  });

  // Váy giáp (kusazuri): vòng các tấm cong quanh hông
  const skirtN = 14;
  for (let i = 0; i < skirtN; i++) {
    const a = (i / skirtN) * Math.PI * 2;
    const plate = curvedPlate(0.27, 0.3, 0.05, kozaneMat(1.2, 1), gold);
    const g = new THREE.Group();
    g.add(plate);
    g.position.set(Math.sin(a) * 0.58, 0.72, Math.cos(a) * 0.5);
    g.rotation.y = a;
    g.rotation.x = -0.15;
    body.add(g);
  }

  // Vai giáp (sode) 4 lớp
  [-1, 1].forEach((side) => {
    const sode = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const p = curvedPlate(0.5, 0.15, 0.06, kozaneMat(1.5, 1), gold);
      p.position.set(side * i * 0.02, -i * 0.115, 0);
      p.rotation.y = side * Math.PI / 2;
      sode.add(p);
    }
    sode.position.set(side * 0.6, 1.55, 0);
    sode.rotation.z = side * 0.3;
    body.add(sode);
  });

  /* ---------- Hai thanh kiếm bắt chéo sau lưng ---------- */
  const itoTex = itoTexture();
  const makeSword = (len: number) => {
    const g = new THREE.Group();
    const hiltMat = new THREE.MeshStandardMaterial({
      color: itoTex ? 0xffffff : 0x222222, map: itoTex, roughness: 0.6,
    });
    const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.34, 12), hiltMat);
    hilt.scale.x = 0.85;
    hilt.position.y = 0.17;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), gold);
    cap.scale.y = 0.5;
    cap.position.y = 0.35;
    const tsuba = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 24), gold);
    const saya = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.048, len, 10), redLacquer);
    saya.scale.x = 0.75;
    saya.position.y = -len / 2;
    const kuchi = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.06, 10), gold);
    kuchi.scale.x = 0.8;
    kuchi.position.y = -0.04;
    const kojiri = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.12, 10), gold);
    kojiri.scale.x = 0.75;
    kojiri.position.y = -len;
    g.add(hilt, cap, tsuba, saya, kuchi, kojiri);
    [0.3, 0.55].forEach((f) => {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.056, 0.03, 10), gold);
      band.scale.x = 0.78;
      band.position.y = -len * f;
      g.add(band);
    });
    return g;
  };
  const katana = makeSword(1.0);
  katana.position.set(0.1, 1.3, 0.5);
  katana.rotation.z = -0.85;
  const wakizashi = makeSword(0.7);
  wakizashi.position.set(-0.1, 1.3, 0.46);
  wakizashi.rotation.z = 0.95;
  body.add(katana, wakizashi);

  /* ---------- Đầu: mọi chi tiết mặt là con của head ---------- */
  const headGeo = new THREE.SphereGeometry(0.5, 32, 24);
  headGeo.scale(1.08, 0.92, 0.95);
  const head = new THREE.Mesh(headGeo, fur);
  head.position.set(0, 1.95, -0.05);
  rig.add(head);
  parts.head = head;
  addFurShells(head, 0x6b757c, alphaTex, 0.03);

  // Mắt: tròng ngọc lục + đồng tử dọc + ánh sáng + mi trên (vẻ nghiêm nghị)
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x2ee66b, emissive: 0x00c853, emissiveIntensity: 0.8, roughness: 0.2,
  });
  const whiteBasic = new THREE.MeshBasicMaterial({ color: 0xffffff });
  [-1, 1].forEach((side) => {
    const eye = new THREE.Group();
    eye.position.set(side * 0.2, 0.04, -0.43);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 16), eyeMat);
    ball.scale.set(1, 1.08, 0.62);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), black);
    pupil.scale.set(0.38, 1.35, 0.4);
    pupil.position.z = -0.045;
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), whiteBasic);
    hl.position.set(side * 0.028, 0.04, -0.06);
    const lidGeo = new THREE.SphereGeometry(0.108, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.4);
    const lid = new THREE.Mesh(lidGeo, furDark);
    lid.scale.set(1, 1.08, 0.66);
    lid.rotation.z = side * 0.28;
    eye.add(ball, pupil, hl, lid);
    head.add(eye);

    // Lông mày hằn
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.04), furDark);
    brow.position.set(side * 0.2, 0.15, -0.42);
    brow.rotation.z = side * 0.35;
    head.add(brow);

    // Má lông xù
    for (let i = 0; i < 3; i++) {
      const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 5), furWhite);
      tuft.position.set(side * 0.46, -0.1 - i * 0.07, -0.22 + i * 0.02);
      tuft.rotation.z = -side * (Math.PI / 2 + 0.2 * (i - 0.5));
      head.add(tuft);
    }

    // Đệm mõm
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 14), furWhite);
    puff.scale.set(1, 0.85, 0.8);
    puff.position.set(side * 0.075, -0.12, -0.4);
    head.add(puff);

    // Miệng
    head.add(thinTube([
      new THREE.Vector3(0, -0.11, -0.5),
      new THREE.Vector3(side * 0.04, -0.15, -0.48),
      new THREE.Vector3(side * 0.09, -0.145, -0.46),
    ], 0.006, black, 8));

    // Ria mép
    const whisker = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
    for (let k = 0; k < 3; k++) {
      const y0 = -0.08 - k * 0.025;
      head.add(thinTube([
        new THREE.Vector3(side * 0.1, y0, -0.47),
        new THREE.Vector3(side * 0.32, y0 + 0.04 - k * 0.03, -0.5),
        new THREE.Vector3(side * 0.6, y0 + 0.07 - k * 0.08, -0.42),
      ], 0.003, whisker, 8));
    }

    // Tai
    const earGeo = new THREE.ConeGeometry(0.2, 0.5, 3);
    earGeo.translate(0, 0.25, 0);
    earGeo.scale(1, 1, 0.35);
    const ear = new THREE.Mesh(earGeo, furDark);
    ear.position.set(side * 0.3, 0.36, 0);
    ear.rotation.z = -side * 0.35;
    const innerGeo = new THREE.ConeGeometry(0.13, 0.36, 3);
    innerGeo.translate(0, 0.18, 0);
    innerGeo.scale(1, 1, 0.3);
    const inner = new THREE.Mesh(innerGeo, pink);
    inner.position.set(0, 0.02, -0.03);
    ear.add(inner);
    for (let k = 0; k < 2; k++) {
      const hair = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.14, 4), furWhite);
      hair.position.set((k - 0.5) * 0.07, 0.1, -0.05);
      hair.rotation.z = (k - 0.5) * 0.5;
      ear.add(hair);
    }
    head.add(ear);
    parts.ears?.push(ear);
  });

  // Mũi + cằm
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), pink);
  nose.scale.set(1.3, 0.8, 0.8);
  nose.position.set(0, -0.04, -0.5);
  head.add(nose);
  head.add(thinTube([
    new THREE.Vector3(0, -0.07, -0.5),
    new THREE.Vector3(0, -0.11, -0.5),
  ], 0.006, black, 2));
  const chin = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 12), furWhite);
  chin.scale.set(1.1, 0.7, 0.8);
  chin.position.set(0, -0.24, -0.34);
  head.add(chin);

  // Hachimaki: dải vải đỏ buộc trán + huy hiệu vàng
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.54, 0.14, 40, 1, true), redCloth
  );
  band.scale.set(1, 1, 0.9);
  band.position.y = 0.2;
  head.add(band);

  const crest = new THREE.Group();
  const cf = new THREE.Mesh(flowerGeometry(0.085, 0.02), gold);
  const cr = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.012, 8, 28), gold);
  crest.add(cf, cr);
  crest.rotation.y = Math.PI;
  crest.position.set(0, 0.2, -0.472);
  head.add(crest);

  // Nút thắt + hai dải ruy băng bay phía sau
  const bandKnot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), redCloth);
  bandKnot.position.set(0, 0.19, 0.46);
  head.add(bandKnot);
  [
    { len: 0.9, ry: 0.25, rx: -1.15 },
    { len: 0.6, ry: -0.3, rx: -0.95 },
  ].forEach(({ len, ry, rx }) => {
    const g = new THREE.PlaneGeometry(0.11, len, 2, 10);
    g.translate(0, -len / 2, 0); // pivot ở đầu dải để vẫy được
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const v = -p.getY(i) / len;
      p.setX(i, p.getX(i) + Math.sin(v * 5) * 0.03 * v);
      p.setZ(i, p.getZ(i) + Math.sin(v * 4 + 1) * 0.05 * v);
    }
    g.computeVertexNormals();
    const rib = new THREE.Mesh(g, redCloth);
    rib.position.set(0, 0.19, 0.48);
    rib.rotation.set(rx, ry, 0);
    head.add(rib);
    parts.accents?.push(rib);
  });

  /* ---------- Tay: tay áo đen + giáp tay + chân mèo trắng ---------- */
  parts.limbs = [];
  [-1, 1].forEach((side) => {
    const sleeveGeo = new THREE.CylinderGeometry(0.15, 0.19, 0.5, 16);
    sleeveGeo.translate(0, -0.25, 0);
    const arm = new THREE.Mesh(sleeveGeo, cloth);
    arm.position.set(side * 0.58, 1.4, -0.02);
    arm.rotation.set(-0.2, 0, side * 0.1);

    const vambrace = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.145, 0.26, 16, 1, true), kozaneMat(2, 0.8)
    );
    vambrace.position.y = -0.4;
    const vTrim = new THREE.Mesh(new THREE.TorusGeometry(0.165, 0.015, 6, 20), gold);
    vTrim.rotation.x = Math.PI / 2;
    vTrim.position.y = -0.27;
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 12), furWhite);
    paw.scale.set(1, 1.1, 0.9);
    paw.position.y = -0.62;
    for (let i = -1; i <= 1; i++) {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), furWhite);
      f.position.set(i * 0.06, -0.72, -0.05);
      arm.add(f);
    }
    arm.add(vambrace, vTrim, paw);
    addFurShells(paw, 0xffffff, alphaTex, 0.02, 3);
    rig.add(arm);
    parts.limbs?.push(arm);
  });

  [-1, 1].forEach((side) => {
    const hakamaGeo = new THREE.LatheGeometry(
      V2([[0.26, 0], [0.32, -0.12], [0.34, -0.3], [0.28, -0.5], [0.2, -0.6], [0.17, -0.64]]), 20
    );
    const leg = new THREE.Mesh(hakamaGeo, cloth);
    leg.position.set(side * 0.22, 0.8, 0);

    const greave = new THREE.Mesh(
      new THREE.CylinderGeometry(0.215, 0.19, 0.2, 18, 1, true), kozaneMat(2, 0.6)
    );
    greave.position.y = -0.55;
    const gTrim = new THREE.Mesh(new THREE.TorusGeometry(0.215, 0.014, 6, 20), gold);
    gTrim.rotation.x = Math.PI / 2;
    gTrim.position.y = -0.45;
    const wrap = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.022, 6, 20), rope);
    wrap.rotation.x = Math.PI / 2;
    wrap.position.y = -0.64;

    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), furWhite);
    foot.scale.set(1, 0.62, 1.6);
    foot.position.set(0, -0.72, -0.06);
    addFurShells(foot, 0xffffff, alphaTex, 0.02, 3);
    for (let i = -1; i <= 1; i++) {
      const toe = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), furWhite);
      toe.scale.set(1, 0.8, 1.1);
      toe.position.set(i * 0.075, -0.76, -0.27 + Math.abs(i) * 0.02);
      leg.add(toe);
    }
    leg.add(greave, gTrim, wrap, foot);
    rig.add(leg);
    parts.limbs?.push(leg);
  });

  /* ---------- Hai đuôi Bakeneko + linh hỏa ---------- */
  const tailBase = new THREE.Color(0x5d676e);
  const tailRing = new THREE.Color(0x1c2226);
  const tailTip = new THREE.Color(0xeeeeec);
  const band2 = (t: number, a: number, b: number) =>
    Math.max(0, 1 - Math.abs(t - (a + b) / 2) / ((b - a) / 2));
  const tailColor = (t: number) => {
    const c = tailBase.clone();
    c.lerp(tailRing, Math.min(1, band2(t, 0.28, 0.4) * 1.6 + band2(t, 0.52, 0.64) * 1.6));
    c.lerp(tailTip, THREE.MathUtils.smoothstep(t, 0.78, 0.92));
    return c;
  };
  const tailMat = new THREE.MeshStandardMaterial({
    vertexColors: true, bumpMap: furTex ?? undefined, bumpScale: 1.5,
    roughness: 0.9, side: THREE.DoubleSide,
  });
  const flames: THREE.Group[] = [];
  const rnd = rng(42);

  [-1, 1].forEach((side) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(side * 0.12, 0.12, 0.28),
      new THREE.Vector3(side * 0.38, 0.42, 0.5),
      new THREE.Vector3(side * 0.62, 0.85, 0.45),
      new THREE.Vector3(side * 0.55, 1.25, 0.25),
    ]);
    const geo = taperedTube(curve, 28, 14, (t) => {
      const r = 0.08 + 0.11 * Math.sin(Math.min(t * 1.1, 1) * Math.PI * 0.85);
      return t > 0.92 ? r * Math.sqrt((1 - t) / 0.08) : r;
    }, tailColor);
    const tail = new THREE.Mesh(geo, tailMat);
    tail.position.set(side * 0.1, 0.85, 0.38);
    rig.add(tail);
    parts.tails?.push(tail);
    addFurShells(tail, 0x8a9298, alphaTex, 0.04);

    // Chùm lông trắng ở đầu đuôi
    const tip = curve.getPoint(1);
    const tan = curve.getTangent(1);
    for (let k = 0; k < 6; k++) {
      const dir = tan.clone().add(
        new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.9)
      ).normalize();
      const m = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.22, 5), furWhite);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      m.position.copy(tip).addScaledVector(dir, 0.05);
      tail.add(m);
    }

    // Linh hỏa (additive) bốc lên ở đầu đuôi
    const flame = new THREE.Group();
    const outer = new THREE.Mesh(
      new THREE.ConeGeometry(0.11, 0.4, 10).translate(0, 0.2, 0),
      new THREE.MeshBasicMaterial({
        color: glow, transparent: true, opacity: 0.55,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    );
    const innerF = new THREE.Mesh(
      new THREE.ConeGeometry(0.055, 0.26, 8).translate(0, 0.13, 0),
      new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.6,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    );
    flame.add(outer, innerF);
    flame.position.copy(tip).addScaledVector(tan, 0.12);
    tail.add(flame);
    flames.push(flame);
  });

  /* ---------- Gió / linh khí + ánh sáng ---------- */
  const aura = new THREE.PointLight(glow, 2.5, 12);
  aura.position.set(0, 1.2, 0);
  root.add(aura);
  parts.auraLight = aura;

  const wind = new THREE.Group();
  for (let k = 0; k < 2; k++) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const a = t * Math.PI * 5 + k * Math.PI;
      const r = 0.95 + 0.25 * Math.sin(t * 6) + t * 0.2;
      pts.push(new THREE.Vector3(Math.cos(a) * r, 0.15 + t * 2.1, Math.sin(a) * r));
    }
    wind.add(new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.015, 6, false),
      new THREE.MeshBasicMaterial({
        color: glow, transparent: true, opacity: 0.28,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    ));
  }
  root.add(wind);

  /* ---------- Cánh hoa anh đào ---------- */
  const PN = 60;
  const petalPos = new Float32Array(PN * 3);
  const petalSeed = Array.from({ length: PN }, () => ({
    a: rnd() * Math.PI * 2, r: 0.9 + rnd() * 1.4, y: rnd() * 2.6, s: 0.15 + rnd() * 0.25,
  }));
  const petalGeo = new THREE.BufferGeometry();
  petalGeo.setAttribute("position", new THREE.BufferAttribute(petalPos, 3));
  const petals = new THREE.Points(petalGeo, new THREE.PointsMaterial({
    color: 0xff8fb1, size: 0.07, transparent: true, opacity: 0.9, depthWrite: false,
  }));
  petals.frustumCulled = false;
  root.add(petals);

  /* ---------- Đền cổ: nền đá + đèn lồng đá ---------- */
  let lanternLight: THREE.PointLight | null = null;
  if (WITH_SHRINE) {
    const stoneTex = stoneTexture();
    const stone = new THREE.MeshStandardMaterial({
      color: stoneTex ? 0xffffff : 0x5b4b45, map: stoneTex, roughness: 0.95,
    });
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.85, 0.22, 48), stone);
    platform.position.y = -0.11;
    platform.receiveShadow = true;
    root.add(platform);

    const lantern = new THREE.Group();
    const add = (g: THREE.BufferGeometry, m: THREE.Material, y: number) => {
      const mesh = new THREE.Mesh(g, m);
      mesh.position.y = y;
      lantern.add(mesh);
      return mesh;
    };
    add(new THREE.CylinderGeometry(0.26, 0.3, 0.14, 6), stone, 0.07);
    add(new THREE.CylinderGeometry(0.1, 0.12, 0.7, 6), stone, 0.49);
    add(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 6), stone, 0.87);
    add(new THREE.BoxGeometry(0.3, 0.26, 0.3), new THREE.MeshStandardMaterial({
      color: 0xffa040, emissive: 0xff8c2a, emissiveIntensity: 2,
    }), 1.05);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.28, 0.05), stone);
      post.position.set(x * 0.16, 1.05, z * 0.16);
      lantern.add(post);
    });
    add(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 6), stone, 1.2);
    add(new THREE.ConeGeometry(0.42, 0.3, 6), stone, 1.37);
    add(new THREE.SphereGeometry(0.06, 10, 8), stone, 1.56);

    const moss = new THREE.MeshStandardMaterial({ color: 0x3f7a3a, roughness: 1 });
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), moss);
      m.scale.y = 0.5;
      const a = rnd() * Math.PI * 2;
      m.position.set(Math.cos(a) * 0.28, 0.04, Math.sin(a) * 0.28);
      lantern.add(m);
    }
    lanternLight = new THREE.PointLight(0xff9a45, 1.4, 5);
    lanternLight.position.y = 1.05;
    lantern.add(lanternLight);
    lantern.position.set(-1.55, 0, -0.4);
    root.add(lantern);
  }

  /* ---------- Đổ bóng ---------- */
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh && m.material && !(m.material as THREE.Material).transparent) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });

  /* ---------- Hook animation phụ: gọi root.userData.tick(time) mỗi frame ---------- */
  root.userData.tick = (time: number) => {
    wind.rotation.y = time * 0.5;
    for (let i = 0; i < PN; i++) {
      const p = petalSeed[i];
      const y = 2.6 - ((p.y + time * p.s) % 2.6);
      const a = p.a + time * 0.2;
      petalPos[i * 3] = Math.cos(a) * p.r;
      petalPos[i * 3 + 1] = y;
      petalPos[i * 3 + 2] = Math.sin(a) * p.r;
    }
    (petalGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    flames.forEach((f, i) => {
      const s = 1 + 0.18 * Math.sin(time * 9 + i * 2) + 0.08 * Math.sin(time * 17 + i);
      f.scale.set(0.9 + 0.1 * Math.sin(time * 12 + i), s, 0.9 + 0.1 * Math.cos(time * 11 + i));
    });
    if (lanternLight) lanternLight.intensity = 1.3 + 0.25 * Math.sin(time * 7);
  };

  return { group: root, id: beast.id, parts };
}

// ============================================================================
//  Tanuki Trickster (化け狸) – Hồ Ly Biến Hình Thần Bí
//  Thay thế hàm buildTanuki cũ. Giữ nguyên signature + cấu trúc `parts`.
//  Quy ước: mặt hướng -Z, đuôi hướng +Z (giống code cũ).
//  Cần: import * as THREE from "three"; và type SpiritBeast, BeastMeshBundle có sẵn.
// ============================================================================

/* ------------------------------ HELPERS ---------------------------------- */

const hash3 = (x: number, y: number, z: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
};

function noise3(x: number, y: number, z: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  return l(
    l(l(hash3(xi, yi, zi), hash3(xi + 1, yi, zi), u), l(hash3(xi, yi + 1, zi), hash3(xi + 1, yi + 1, zi), u), v),
    l(l(hash3(xi, yi, zi + 1), hash3(xi + 1, yi, zi + 1), u), l(hash3(xi, yi + 1, zi + 1), hash3(xi + 1, yi + 1, zi + 1), u), v),
    w
  );
}

/** Biến dạng hình học theo hàm tuỳ ý rồi tính lại normal */
function deform(geo: THREE.BufferGeometry, fn: (v: THREE.Vector3) => void) {
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    fn(v);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Làm bề mặt hơi gồ ghề, hữu cơ (không còn là cầu trơn) */
function lumpy(geo: THREE.BufferGeometry, amp = 0.02, freq = 3.5, seed = 0) {
  geo.computeVertexNormals();
  const p = geo.attributes.position;
  const n = geo.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const d = (noise3(p.getX(i) * freq + seed, p.getY(i) * freq, p.getZ(i) * freq) - 0.5) * 2 * amp;
    p.setXYZ(i, p.getX(i) + n.getX(i) * d, p.getY(i) + n.getY(i) * d, p.getZ(i) + n.getZ(i) * d);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Ellipsoid đã bake scale vào geometry (để lông shell bám đúng) */
function ell(r: number, sx = 1, sy = 1, sz = 1, seg = 24) {
  const g = new THREE.SphereGeometry(r, seg, Math.max(8, Math.floor(seg * 0.75)));
  g.scale(sx, sy, sz);
  return g;
}

function tanukiCanvasTex(
  w: number,
  h: number,
  draw: (g: CanvasRenderingContext2D, w: number, h: number) => void,
  srgb = true
) {
  if (typeof document === "undefined") return new THREE.CanvasTexture(null as any);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  const T = THREE as any;
  if (srgb && T.SRGBColorSpace) (t as any).colorSpace = T.SRGBColorSpace;
  return t;
}

/** Ống thon: bán kính thay đổi dọc theo đường cong */
function tanukiTaperedTube(
  curve: THREE.Curve<THREE.Vector3>,
  tubular: number,
  radial: number,
  radiusFn: (t: number) => number
) {
  const geo = new THREE.TubeGeometry(curve, tubular, 1, radial, false);
  const p = geo.attributes.position;
  const c = new THREE.Vector3();
  const v = new THREE.Vector3();
  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular;
    curve.getPointAt(t, c);
    const r = radiusFn(t);
    for (let j = 0; j <= radial; j++) {
      const idx = i * (radial + 1) + j;
      v.fromBufferAttribute(p, idx).sub(c).multiplyScalar(r).add(c);
      p.setXYZ(idx, v.x, v.y, v.z);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

/* Texture alpha dạng sợi lông (dùng chung) */
let _furAlpha: THREE.CanvasTexture | null = null;
function furAlpha() {
  if (_furAlpha) return _furAlpha;
  _furAlpha = tanukiCanvasTex(
    128,
    128,
    (g, w, h) => {
      g.fillStyle = "#000";
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 2200; i++) {
        const v = 110 + Math.random() * 145;
        g.fillStyle = `rgb(${v},${v},${v})`;
        g.beginPath();
        g.arc(Math.random() * w, Math.random() * h, 0.9 + Math.random() * 0.9, 0, Math.PI * 2);
        g.fill();
      }
    },
    false
  );
  return _furAlpha;
}

/** Thêm các lớp "vỏ lông" quanh mesh -> cảm giác lông tơ xù mềm */
function addFur(
  parent: THREE.Object3D,
  base: THREE.Mesh,
  opts: { layers?: number; length?: number; tiling?: number; color?: number; vertexColors?: boolean } = {}
) {
  const { layers = 8, length = 0.06, tiling = 12 } = opts;
  const baseCol = new THREE.Color(opts.color ?? 0xffffff);
  const tip = new THREE.Color(0xfff1d0);
  for (let i = 1; i <= layers; i++) {
    const t = i / layers;
    const g = base.geometry.clone();
    const p = g.attributes.position;
    const nn = g.attributes.normal;
    const uv = g.attributes.uv;
    for (let k = 0; k < p.count; k++) {
      p.setXYZ(
        k,
        p.getX(k) + nn.getX(k) * length * t,
        p.getY(k) + nn.getY(k) * length * t - length * t * t * 0.35,
        p.getZ(k) + nn.getZ(k) * length * t
      );
      if (uv) uv.setXY(k, uv.getX(k) * tiling, uv.getY(k) * tiling);
    }
    const mat = new THREE.MeshStandardMaterial({
      color: opts.vertexColors ? 0xffffff : baseCol.clone().lerp(tip, t * 0.25),
      vertexColors: !!opts.vertexColors,
      alphaMap: furAlpha(),
      alphaTest: 0.18 + 0.55 * t,
      roughness: 0.95,
    });
    const shell = new THREE.Mesh(g, mat);
    shell.position.copy(base.position);
    shell.rotation.copy(base.rotation);
    shell.scale.copy(base.scale);
    parent.add(shell);
  }
}

function furMaterial(color: number, sheen = 0xffd9a0) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.85,
    sheen: 1,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color(sheen),
  });
}

/* ------------------------------- TEXTURES --------------------------------- */

function strawTexture() {
  return tanukiCanvasTex(256, 256, (g, w, h) => {
    g.fillStyle = "#c9a66b";
    g.fillRect(0, 0, w, h);
    for (let i = -h; i < w + h; i += 14) {
      g.strokeStyle = "#b5884a";
      g.lineWidth = 6;
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke();
      g.strokeStyle = "#dfc084";
      g.beginPath(); g.moveTo(i + 7, 0); g.lineTo(i - h + 7, h); g.stroke();
    }
    g.strokeStyle = "rgba(70,40,10,0.35)";
    g.lineWidth = 1;
    for (let i = 0; i < w; i += 14) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); }
  });
}

function capeTexture() {
  return tanukiCanvasTex(256, 256, (g, w, h) => {
    g.fillStyle = "#7f9c62";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(235,205,120,0.75)";
    g.lineWidth = 2;
    for (let y = 0; y < h + 16; y += 16) {
      for (let x = (y / 16) % 2 ? 0 : 16; x < w + 32; x += 32) {
        for (let r = 6; r <= 16; r += 5) {
          g.beginPath(); g.arc(x, y, r, Math.PI, 0); g.stroke();
        }
      }
    }
  });
}

function gourdTexture() {
  return tanukiCanvasTex(128, 256, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, "#a8693a");
    grd.addColorStop(0.45, "#b8794a");
    grd.addColorStop(0.55, "#e8c9a0");
    grd.addColorStop(1, "#f1dcba");
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) {
      const x = (i / 9) * w + 8, y = h * (0.6 + 0.25 * Math.random());
      g.fillStyle = "#e57b86";
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        g.beginPath(); g.arc(x + Math.cos(a) * 7, y + Math.sin(a) * 7, 5, 0, Math.PI * 2); g.fill();
      }
      g.fillStyle = "#ffe7a0";
      g.beginPath(); g.arc(x, y, 3, 0, Math.PI * 2); g.fill();
    }
  });
}

function leafTexture() {
  return tanukiCanvasTex(256, 256, (g, w, h) => {
    const grd = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2);
    grd.addColorStop(0, "#e9ffb0");
    grd.addColorStop(1, "#5fd13a");
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(255,255,255,0.85)";
    g.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      g.beginPath();
      g.moveTo(w / 2, h / 2);
      g.lineTo(w / 2 + Math.cos(a) * w * 0.5, h / 2 + Math.sin(a) * h * 0.5);
      g.stroke();
    }
  });
}

/* ------------------------------ SMALL PROPS ------------------------------- */

function makeTassel(len: number, color: number, gold: THREE.Material) {
  const g = new THREE.Group();
  const pink = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, len * 0.5, 6), pink);
  cord.position.y = -len * 0.25;
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), gold);
  knot.position.y = -len * 0.5;
  const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.03, len * 0.5, 10), pink);
  skirt.position.y = -len * 0.78;
  skirt.rotation.x = Math.PI;
  g.add(cord, knot, skirt);
  return g;
}

function makePaw(padMat: THREE.Material, darkMat: THREE.Material, size = 1) {
  const g = new THREE.Group();
  const paw = new THREE.Mesh(ell(0.11 * size, 1, 1, 0.9, 14), darkMat);
  g.add(paw);
  const pad = new THREE.Mesh(ell(0.05 * size, 1.3, 1, 0.5, 10), padMat);
  pad.position.set(0, 0.02 * size, -0.09 * size);
  g.add(pad);
  [-0.055, 0, 0.055].forEach((x, i) => {
    const toe = new THREE.Mesh(ell(0.023 * size, 1, 1.2, 0.6, 8), padMat);
    toe.position.set(x * size, (i === 1 ? -0.07 : -0.055) * size, -0.085 * size);
    g.add(toe);
  });
  return g;
}

/* ============================ MAIN BUILDER ================================= */

function buildTanuki(
  root: THREE.Group,
  beast: SpiritBeast,
  color: THREE.Color,
  glow: THREE.Color
): BeastMeshBundle {
  void color;
  const parts: BeastMeshBundle["parts"] = { ears: [], tails: [], accents: [], limbs: [] };

  /* ---------- Materials ---------- */
  const furBrown = 0x7a5233;
  const tanMat = furMaterial(furBrown);
  const creamMat = furMaterial(0xf6e3bd, 0xffffff);
  const darkMat = furMaterial(0x2b1a0e, 0x6b4a2a);
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xe0b455, metalness: 0.8, roughness: 0.3 });
  const pinkMat = new THREE.MeshStandardMaterial({ color: 0xf08ba5, roughness: 0.55 });
  const padMat = new THREE.MeshStandardMaterial({ color: 0xc98370, roughness: 0.5 });
  const gloss = (c: number) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.1 });

  /* ---------- Thân (hình quả lê, mập tròn) ---------- */
  const bodyGeo = ell(0.65, 1.0, 1.05, 1.25, 40);
  deform(bodyGeo, (v) => {
    const k = 1 - v.y * 0.16;
    v.x *= k;
    v.z *= k;
  });
  lumpy(bodyGeo, 0.015, 3, 1);
  const body = new THREE.Mesh(bodyGeo, tanMat);
  body.castShadow = true;
  body.position.set(0, 0.68, 0);
  root.add(body);
  addFur(root, body, { layers: 9, length: 0.07, color: furBrown });
  parts.body = body;

  /* ---------- Bụng kem ---------- */
  const bellyGeo = lumpy(ell(0.52, 0.9, 0.95, 0.7, 32), 0.012, 3, 4);
  const belly = new THREE.Mesh(bellyGeo, creamMat);
  belly.position.set(0, 0.62, -0.48);
  root.add(belly);
  addFur(root, belly, { layers: 7, length: 0.06, color: 0xf6e3bd });

  /* ---------- Áo choàng xanh (haori) ---------- */
  const capeTex = capeTexture();
  capeTex.repeat.set(3, 1.5);
  const capeMat = new THREE.MeshStandardMaterial({ map: capeTex, roughness: 0.7, side: THREE.DoubleSide });
  const cs = new THREE.Vector3(0.76, 0.8, 0.98);
  const cc = new THREE.Vector3(0, 0.68, 0);
  const th0 = 0.12 * Math.PI, th1 = 0.56 * Math.PI;
  const ph0 = 1.78 * Math.PI, phLen = 1.44 * Math.PI;
  const cape = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 20, ph0, phLen, th0, th1 - th0), capeMat);
  cape.scale.copy(cs);
  cape.position.copy(cc);
  cape.castShadow = true;
  root.add(cape);

  const capePt = (phi: number, th: number) =>
    new THREE.Vector3(
      -Math.cos(phi) * Math.sin(th) * cs.x + cc.x,
      Math.cos(th) * cs.y + cc.y,
      Math.sin(phi) * Math.sin(th) * cs.z + cc.z
    );
  const trim = (pts: THREE.Vector3[]) =>
    root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.016, 6), goldMat));
  const hem: THREE.Vector3[] = [];
  for (let i = 0; i <= 32; i++) hem.push(capePt(ph0 + (i / 32) * phLen, th1));
  trim(hem);
  [ph0, ph0 + phLen].forEach((ph) => {
    const edge: THREE.Vector3[] = [];
    for (let i = 0; i <= 12; i++) edge.push(capePt(ph, th0 + (i / 12) * (th1 - th0)));
    trim(edge);
  });

  /* ---------- Nơ hồng + tua ---------- */
  const bow = new THREE.Group();
  bow.position.set(0, 0.78, -0.86);
  [-1, 1].forEach((s) => {
    const loop = new THREE.Mesh(ell(0.08, 1.4, 0.8, 0.6, 12), pinkMat);
    loop.position.x = s * 0.1;
    loop.rotation.z = s * 0.35;
    bow.add(loop);
  });
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), goldMat);
  bow.add(knot);
  [-0.05, 0.05].forEach((x, i) => {
    const t = makeTassel(0.2 - i * 0.04, 0xf08ba5, goldMat);
    t.position.set(x, -0.03, -0.02);
    bow.add(t);
  });
  root.add(bow);

  /* ---------- Đầu ---------- */
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.05, -0.65);
  root.add(headGroup);

  const headGeo = ell(0.46, 1.15, 0.95, 1.0, 40);
  deform(headGeo, (v) => {
    if (v.y < 0) v.x *= 1 + -v.y * 0.35; // má phình
  });
  lumpy(headGeo, 0.01, 4, 7);
  const head = new THREE.Mesh(headGeo, tanMat);
  head.castShadow = true;
  headGroup.add(head);
  addFur(headGroup, head, { layers: 8, length: 0.055, color: furBrown });
  parts.head = head;

  // Mõm kem + trán kem
  const muzzle = new THREE.Mesh(lumpy(ell(0.27, 1.0, 0.85, 0.85, 24), 0.008, 5, 2), creamMat);
  muzzle.position.set(0, -0.1, -0.34);
  headGroup.add(muzzle);
  addFur(headGroup, muzzle, { layers: 5, length: 0.04, color: 0xf6e3bd });
  const blaze = new THREE.Mesh(ell(0.12, 0.5, 1.3, 0.3, 14), creamMat);
  blaze.position.set(0, 0.2, -0.42);
  headGroup.add(blaze);

  // Túm lông má
  [-1, 1].forEach((s) => {
    for (let k = 0; k < 3; k++) {
      const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.075 - k * 0.012, 0.2, 8), k === 2 ? creamMat : tanMat);
      tuft.position.set(s * (0.5 - k * 0.02), -0.05 - k * 0.075, -0.12 - k * 0.04);
      tuft.rotation.z = -s * (Math.PI / 2 + k * 0.28);
      headGroup.add(tuft);
    }
  });

  // Mảng đen quanh mắt + mắt
  [-1, 1].forEach((s) => {
    const x = s * 0.2;
    const patch = new THREE.Mesh(ell(0.2, 1.15, 0.95, 0.35, 20), darkMat);
    patch.position.set(x, 0.05, -0.4);
    patch.rotation.z = s * 0.4;
    headGroup.add(patch);

    const eye = new THREE.Group();
    eye.position.set(x, 0.05, -0.44);
    const winking = s > 0; // mắt phải nháy
    if (!winking) {
      const ball = new THREE.Mesh(ell(0.085, 1, 1.05, 0.65, 18), gloss(0x24120a));
      const iris = new THREE.Mesh(ell(0.062, 1, 1.05, 0.5, 16), gloss(0xb5651d));
      iris.position.z = -0.03;
      const pupil = new THREE.Mesh(ell(0.036, 1, 1.05, 0.4, 12), new THREE.MeshBasicMaterial({ color: 0x050302 }));
      pupil.position.z = -0.05;
      const h1 = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      h1.position.set(-0.025, 0.035, -0.06);
      const h2 = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      h2.position.set(0.025, -0.025, -0.06);
      eye.add(ball, iris, pupil, h1, h2);
    } else {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.013, 6, 18, Math.PI), new THREE.MeshBasicMaterial({ color: 0x0d0704 }));
      arc.position.z = -0.03;
      eye.add(arc);
    }
    headGroup.add(eye);
  });

  // Mũi + miệng cười
  const snout = new THREE.Mesh(ell(0.19, 1.15, 0.75, 1.0, 20), creamMat);
  snout.position.set(0, -0.1, -0.42);
  headGroup.add(snout);
  const nose = new THREE.Mesh(ell(0.065, 1.25, 0.8, 0.9, 14), gloss(0x120c0a));
  nose.position.set(0, -0.035, -0.6);
  headGroup.add(nose);
  const mouth = new THREE.Mesh(ell(0.1, 1.3, 0.75, 0.5, 14), new THREE.MeshStandardMaterial({ color: 0x5a1218, roughness: 0.4 }));
  mouth.position.set(0, -0.175, -0.55);
  headGroup.add(mouth);
  const tongue = new THREE.Mesh(ell(0.055, 1.2, 0.5, 0.6, 10), new THREE.MeshStandardMaterial({ color: 0xf0707f, roughness: 0.4 }));
  tongue.position.set(0, -0.205, -0.575);
  headGroup.add(tongue);
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.01, 6, 20, Math.PI), new THREE.MeshBasicMaterial({ color: 0x1a0d08 }));
  smile.position.set(0, -0.105, -0.585);
  smile.rotation.z = Math.PI;
  headGroup.add(smile);

  // Tai tròn
  [-1, 1].forEach((s) => {
    const earG = new THREE.Group();
    earG.position.set(s * 0.4, 0.3, 0.08);
    earG.rotation.z = -s * 0.35;
    const outer = new THREE.Mesh(ell(0.16, 0.85, 1.0, 0.55, 16), darkMat);
    const inner = new THREE.Mesh(ell(0.095, 0.8, 0.95, 0.4, 12), new THREE.MeshStandardMaterial({ color: 0xc89a7a, roughness: 0.7 }));
    inner.position.z = -0.045;
    earG.add(outer, inner);
    headGroup.add(earG);
    parts.ears?.push(earG as unknown as THREE.Mesh);
  });

  /* ---------- Nón lá kasa ---------- */
  const hatGroup = new THREE.Group();
  hatGroup.position.set(0, 0.62, 0.02);
  hatGroup.rotation.set(0.08, 0, -0.12);
  headGroup.add(hatGroup);

  const strawTex = strawTexture();
  strawTex.repeat.set(6, 2);
  const strawMat = new THREE.MeshStandardMaterial({ map: strawTex, roughness: 0.85, side: THREE.DoubleSide });
  const hatCone = new THREE.Mesh(new THREE.ConeGeometry(0.82, 0.4, 56, 6, true), strawMat);
  hatCone.castShadow = true;
  hatGroup.add(hatCone);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.018, 8, 64), new THREE.MeshStandardMaterial({ color: 0x9c7440, roughness: 0.8 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = -0.2;
  hatGroup.add(rim);
  const ribbon = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.018, 8, 64), pinkMat);
  ribbon.rotation.x = Math.PI / 2;
  ribbon.position.y = -0.17;
  hatGroup.add(ribbon);
  [-70, -30, 10, 150].forEach((deg, i) => {
    const a = (deg * Math.PI) / 180;
    const t = makeTassel(0.24 + (i % 2) * 0.06, 0xf08ba5, goldMat);
    t.position.set(Math.cos(a) * 0.8, -0.2, Math.sin(a) * 0.8);
    hatGroup.add(t);
  });

  /* ---------- Lá sen thần phát sáng ---------- */
  const lTex = leafTexture();
  const leafGeo = new THREE.CircleGeometry(0.27, 40, 0, Math.PI * 2 - 0.5);
  deform(leafGeo, (v) => {
    v.z = (v.x * v.x + v.y * v.y) * 1.4 + Math.sin(Math.atan2(v.y, v.x) * 7) * 0.012 * Math.hypot(v.x, v.y) * 4;
  });
  const leaf = new THREE.Mesh(
    leafGeo,
    new THREE.MeshStandardMaterial({
      map: lTex,
      emissiveMap: lTex,
      emissive: 0x64dd17,
      emissiveIntensity: 0.9,
      side: THREE.DoubleSide,
      roughness: 0.4,
    })
  );
  leaf.rotation.x = -Math.PI / 2;
  leaf.position.set(0, 0.215, 0);
  hatGroup.add(leaf);
  parts.accents?.push(leaf);

  /* ---------- Khói linh khí xoắn ốc + đốm sáng ---------- */
  const wispMat = new THREE.MeshBasicMaterial({
    color: 0x9cffb8,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const wisps: THREE.Mesh[] = [];
  for (let w = 0; w < 3; w++) {
    const pts: THREE.Vector3[] = [];
    const phase = (w / 3) * Math.PI * 2;
    for (let k = 0; k <= 28; k++) {
      const t = k / 28;
      const a = t * Math.PI * 3.2 + phase;
      const r = 0.06 + 0.2 * t;
      pts.push(new THREE.Vector3(Math.cos(a) * r, t * 1.0, Math.sin(a) * r));
    }
    const wisp = new THREE.Mesh(
      tanukiTaperedTube(new THREE.CatmullRomCurve3(pts), 60, 8, (t) => 0.035 * Math.pow(1 - t, 0.8) * (0.5 + t) + 0.003),
      wispMat
    );
    wisp.position.set(0, 0.25, 0);
    hatGroup.add(wisp);
    parts.accents?.push(wisp);
    wisps.push(wisp);
  }
  const motes = new THREE.Group();
  const moteMat = new THREE.MeshBasicMaterial({ color: 0xc9ffd6, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.85, depthWrite: false });
  for (let i = 0; i < 14; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.012 + Math.random() * 0.018, 6, 6), moteMat);
    const a = Math.random() * Math.PI * 2;
    const r = 0.3 + Math.random() * 0.7;
    m.position.set(Math.cos(a) * r, 0.1 + Math.random() * 1.1, Math.sin(a) * r);
    motes.add(m);
  }
  motes.position.set(0, 1.0, -0.4);
  root.add(motes);
  parts.accents?.push(motes as unknown as THREE.Mesh);

  /* ---------- Bình hồ lô Hyōtan ---------- */
  const gourdGroup = new THREE.Group();
  gourdGroup.position.set(0.7, 0.55, -0.12);
  gourdGroup.rotation.z = -0.25;
  const prof = new THREE.SplineCurve(
    [
      [0, -0.2], [0.1, -0.19], [0.18, -0.1], [0.2, 0], [0.15, 0.08], [0.09, 0.12],
      [0.08, 0.16], [0.11, 0.22], [0.14, 0.3], [0.11, 0.38], [0.05, 0.42], [0.04, 0.46], [0, 0.47],
    ].map(([x, y]) => new THREE.Vector2(x, y))
  ).getPoints(48);
  const gourd = new THREE.Mesh(
    new THREE.LatheGeometry(prof, 32),
    new THREE.MeshStandardMaterial({ map: gourdTexture(), roughness: 0.45 })
  );
  gourd.castShadow = true;
  gourdGroup.add(gourd);
  const rope = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.016, 8, 24), new THREE.MeshStandardMaterial({ color: 0xd9906a, roughness: 0.8 }));
  rope.rotation.x = Math.PI / 2;
  rope.position.y = 0.14;
  gourdGroup.add(rope);
  [-0.04, 0.04].forEach((x, i) => {
    const t = makeTassel(0.22 - i * 0.05, 0xf08ba5, goldMat);
    t.position.set(x + 0.08, 0.12, -0.04);
    gourdGroup.add(t);
  });
  root.add(gourdGroup);
  root.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.68, 0.72, -0.14),
          new THREE.Vector3(0.66, 1.0, -0.22),
          new THREE.Vector3(0.42, 1.3, -0.2),
        ]),
        20,
        0.018,
        6
      ),
      new THREE.MeshStandardMaterial({ color: 0xd9906a, roughness: 0.8 })
    )
  );

  /* ---------- Đuôi xù sọc ---------- */
  const tailGroup = new THREE.Group();
  tailGroup.position.set(0, 0.72, 0.55); // pivot ở gốc đuôi để vẫy tự nhiên
  root.add(tailGroup);
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, -0.1, 0.55),
    new THREE.Vector3(0.22, -0.02, 1.0),
    new THREE.Vector3(0.52, 0.28, 1.2),
  ]);
  const tailGeo = tanukiTaperedTube(tailCurve, 48, 18, (t) => (0.13 + 0.34 * Math.sin(Math.PI * Math.pow(t, 0.75))) * (1 - Math.pow(t, 9)));
  {
    const cols: number[] = [];
    const a = new THREE.Color(0x7d5636);
    const b = new THREE.Color(0x2a180c);
    const c = new THREE.Color();
    const rows = 49, per = 19;
    for (let i = 0; i < rows; i++) {
      const t = i / (rows - 1);
      const s = Math.min(1, Math.max(0, Math.sin(t * Math.PI * 2 * 3.5) * 2.5 + 0.5));
      c.copy(a).lerp(b, s);
      if (t > 0.86) c.lerp(b, Math.min(1, (t - 0.86) * 9));
      for (let j = 0; j < per; j++) cols.push(c.r, c.g, c.b);
    }
    tailGeo.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  }
  lumpy(tailGeo, 0.012, 5, 9);
  const tail = new THREE.Mesh(
    tailGeo,
    new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.85, sheen: 1, sheenColor: new THREE.Color(0xffd9a0) })
  );
  tail.castShadow = true;
  tailGroup.add(tail);
  addFur(tailGroup, tail, { layers: 10, length: 0.09, tiling: 10, vertexColors: true });
  parts.tails?.push(tailGroup as unknown as THREE.Mesh);

  /* ---------- Tay (phải vẫy, trái buông) ---------- */
  [-1, 1].forEach((s) => {
    const arm = new THREE.Group();
    arm.position.set(s * 0.58, 0.92, -0.5);
    arm.rotation.z = s > 0 ? 2.3 : -0.55;
    const limb = new THREE.Mesh(lumpy(ell(0.15, 0.8, 1.6, 0.8, 18), 0.008, 4, s), tanMat);
    limb.position.y = -0.2;
    arm.add(limb);
    addFur(arm, limb, { layers: 5, length: 0.045, color: furBrown });
    const paw = makePaw(padMat, darkMat, 1);
    paw.position.y = -0.42;
    paw.rotation.x = 0.1;
    arm.add(paw);
    root.add(arm);
    parts.limbs?.push(arm as unknown as THREE.Mesh);
  });

  /* ---------- 4 chân mập ---------- */
  const legBase = lumpy(ell(0.16, 0.85, 1.25, 0.9, 16), 0.006, 4, 3);
  const legPos = [
    { x: -0.32, z: -0.32 },
    { x: 0.32, z: -0.32 },
    { x: -0.34, z: 0.32 },
    { x: 0.34, z: 0.32 },
  ];
  legPos.forEach((pos, idx) => {
    const leg = new THREE.Group();
    leg.position.set(pos.x, 0.2, pos.z);
    const thigh = new THREE.Mesh(legBase, tanMat);
    thigh.position.y = 0.06;
    leg.add(thigh);
    addFur(leg, thigh, { layers: 4, length: 0.04, color: furBrown });
    const foot = new THREE.Mesh(ell(0.125, 1, 0.55, 1.35, 14), darkMat);
    foot.position.set(0, -0.14, -0.03);
    leg.add(foot);
    [-0.05, 0, 0.05].forEach((x) => {
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.05, 6), creamMat);
      claw.position.set(x, -0.16, -0.17);
      claw.rotation.x = -Math.PI / 2;
      leg.add(claw);
    });
    if (idx < 2) {
      const pad = new THREE.Mesh(ell(0.04, 1.2, 0.6, 1, 8), padMat);
      pad.position.set(0, -0.2, -0.02);
      leg.add(pad);
    }
    root.add(leg);
    parts.limbs?.push(leg as unknown as THREE.Mesh);
  });

  /* ---------- Aura ngọc lục bảo ---------- */
  const aura = new THREE.PointLight(glow, 2.4, 12);
  aura.position.set(0, 1.2, 0);
  root.add(aura);
  parts.auraLight = aura;

  /* ---------- Animation hook: wisps xoay & motes bay bổng ---------- */
  root.userData.tick = (time: number) => {
    wisps.forEach((wisp, i) => {
      wisp.rotation.y = time * 0.9 + (i * Math.PI * 2) / 3;
    });
    motes.children.forEach((m, i) => {
      m.position.y += Math.sin(time * 3 + i) * 0.0015;
    });
  };

  return { group: root, id: beast.id, parts };
}

// ============================================================================
//  4. YATAGARASU (八咫烏) – Thần Điểu Ba Chân Ánh Dương
//  Procedural build: lông vũ cong xếp lớp (InstancedMesh), chân/vuốt/mỏ dạng
//  tapered-tube, vầng hào quang nhiều lớp, huy hiệu mặt trời trước ngực.
//  Hướng: đầu về phía -Z, đuôi về phía +Z (giống code gốc).
// ============================================================================

// ----------------------------------------------------------------------------
//  Helpers cho Yatagarasu
// ----------------------------------------------------------------------------
const V_YATA = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Texture lông: đen -> vàng ở đầu lông, viền + sống lông vàng, rãnh barb mờ. */
function makeFeatherTexture(goldStart: number): THREE.Texture {
  if (typeof document === "undefined") {
    return new THREE.Texture();
  }
  const W = 256;
  const H = 64;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const g = ctx.createLinearGradient(0, 0, W, 0);
  const gs = goldStart;
  g.addColorStop(0, "#06060b");
  g.addColorStop(Math.max(0.01, gs - 0.12), "#0c0c14");
  g.addColorStop(Math.min(0.97, gs + 0.08), "#4a2c08");
  g.addColorStop(Math.min(0.98, gs + 0.25), "#c27a14");
  g.addColorStop(Math.min(0.99, gs + 0.42), "#ffc93c");
  g.addColorStop(1, "#fff4b0");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // barbs (rãnh chéo nhỏ) – tạo cảm giác lông thật
  ctx.lineWidth = 1;
  for (let i = 0; i < 70; i++) {
    const x = (i / 70) * W;
    ctx.strokeStyle = i % 2 ? "rgba(0,0,0,0.18)" : "rgba(255,210,90,0.10)";
    ctx.beginPath();
    ctx.moveTo(x, H * 0.5);
    ctx.lineTo(x + 26, 0);
    ctx.moveTo(x, H * 0.5);
    ctx.lineTo(x + 26, H);
    ctx.stroke();
  }

  // viền vàng mảnh + sống lông
  ctx.fillStyle = "rgba(255,196,60,0.95)";
  ctx.fillRect(W * 0.12, 0, W, 2);
  ctx.fillRect(W * 0.12, H - 2, W, 2);
  ctx.fillStyle = "rgba(255,214,90,0.75)";
  ctx.fillRect(W * 0.05, H / 2 - 1, W, 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeFeatherMaterial(goldStart: number, glow = 0.95) {
  const tex = makeFeatherTexture(goldStart);
  return new THREE.MeshStandardMaterial({
    map: tex,
    emissiveMap: tex,
    emissive: 0xffffff,
    emissiveIntensity: glow,
    metalness: 0.35,
    roughness: 0.42,
    side: THREE.DoubleSide,
  });
}

/**
 * Một chiếc lông đơn vị: dài 1 theo +X, rộng theo Z, cong theo Y.
 * Lưng lông gồ nhẹ ở giữa, đầu lông nhọn.
 */
function makeFeatherGeometry(width = 0.26, curl = -0.1, segs = 10) {
  const cols = 5;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    let w: number;
    if (t < 0.3) w = 0.18 + 0.82 * Math.sin((t / 0.3) * Math.PI * 0.5);
    else w = Math.pow(Math.cos(((t - 0.3) / 0.7) * Math.PI * 0.5), 0.75);
    w *= width;
    for (let j = 0; j < cols; j++) {
      const s = (j / (cols - 1)) * 2 - 1;
      pos.push(t, curl * t * t + (1 - s * s) * width * 0.22 * (1 - t * 0.6), s * w * 0.5);
      uv.push(t, (s + 1) / 2);
    }
  }
  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < cols - 1; j++) {
      const a = i * cols + j;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/** Ống thon dần dọc theo curve (mỏ, chân, ngón, vuốt, mào, họa tiết vàng). */
function crowTaperedTube(
  curve: THREE.Curve<THREE.Vector3>,
  radiusAt: (t: number) => number,
  segs = 16,
  radial = 8,
  flatN = 1,
  flatB = 1
) {
  const frames = curve.computeFrenetFrames(segs, false);
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const P = new THREE.Vector3();
  const off = new THREE.Vector3();
  const nn = new THREE.Vector3();
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    curve.getPointAt(t, P);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    const r = radiusAt(t);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      off.set(0, 0, 0).addScaledVector(N, c * r * flatN).addScaledVector(B, s * r * flatB);
      pos.push(P.x + off.x, P.y + off.y, P.z + off.z);
      nn.set(0, 0, 0).addScaledVector(N, c * flatB).addScaledVector(B, s * flatN).normalize();
      nor.push(nn.x, nn.y, nn.z);
      uv.push(j / radial, t);
    }
  }
  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = (i + 1) * (radial + 1) + j;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  return geo;
}

// ---- Feather instancing ----------------------------------------------------
interface FeatherSpec {
  pos: THREE.Vector3;
  dir: THREE.Vector3; // hướng chiều dài lông
  up: THREE.Vector3; // hướng "mặt trên" lông (hướng cong)
  len: number;
  wid: number; // hệ số bề rộng
  tint: number; // 0.7 .. 1
  front?: boolean;
}

const _xCrow = new THREE.Vector3();
const _yCrow = new THREE.Vector3();
const _zCrow = new THREE.Vector3();
const _mCrow = new THREE.Matrix4();
const _qCrow = new THREE.Quaternion();
const _sCrow = new THREE.Vector3();
const _matCrow = new THREE.Matrix4();
const _cCrow = new THREE.Color();

function addFeathers(
  parent: THREE.Object3D,
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  specs: FeatherSpec[]
) {
  if (!specs.length) return null;
  const mesh = new THREE.InstancedMesh(geo, mat, specs.length);
  specs.forEach((s, i) => {
    _xCrow.copy(s.dir).normalize();
    _zCrow.crossVectors(_xCrow, s.up);
    if (_zCrow.lengthSq() < 1e-6) _zCrow.set(0, 0, 1);
    _zCrow.normalize();
    _yCrow.crossVectors(_zCrow, _xCrow);
    _mCrow.makeBasis(_xCrow, _yCrow, _zCrow);
    _qCrow.setFromRotationMatrix(_mCrow);
    _sCrow.set(s.len, s.len, s.len * s.wid);
    _matCrow.compose(s.pos, _qCrow, _sCrow);
    mesh.setMatrixAt(i, _matCrow);
    mesh.setColorAt(i, _cCrow.setScalar(s.tint));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = true;
  mesh.frustumCulled = false;
  parent.add(mesh);
  return mesh;
}

/** Phủ lông lên bề mặt ellipsoid, lông xếp ngói theo hướng `flow`. */
function ellipsoidFeathers(
  center: THREE.Vector3,
  radii: THREE.Vector3,
  o: {
    vFrom: number;
    vTo: number;
    rows: number;
    perRow: number;
    len: number;
    wid: number;
    lift: number;
    flow?: THREE.Vector3;
    skip?: (local: THREE.Vector3, n: THREE.Vector3) => boolean;
    seed?: number;
  }
): FeatherSpec[] {
  const rnd = mulberry32(o.seed ?? 7);
  const out: FeatherSpec[] = [];
  const flow0 = o.flow ?? V_YATA(0, -1, 0);
  for (let r = 0; r < o.rows; r++) {
    const f = (r + 0.5) / o.rows;
    const v = o.vFrom + (o.vTo - o.vFrom) * f;
    const sv = Math.sin(v);
    const ring = Math.max(4, Math.round(o.perRow * sv));
    for (let k = 0; k < ring; k++) {
      const u = ((k + (r % 2) * 0.5) / ring) * Math.PI * 2;
      const local = V_YATA(radii.x * sv * Math.sin(u), radii.y * Math.cos(v), -radii.z * sv * Math.cos(u));
      const n = V_YATA(local.x / radii.x ** 2, local.y / radii.y ** 2, local.z / radii.z ** 2).normalize();
      if (o.skip && o.skip(local, n)) continue;
      const flow = flow0.clone();
      flow.addScaledVector(n, -flow.dot(n));
      if (flow.lengthSq() < 1e-4) continue;
      flow.normalize().addScaledVector(n, o.lift).normalize();
      out.push({
        pos: local.clone().add(center),
        dir: flow,
        up: n,
        len: o.len * (0.85 + rnd() * 0.3),
        wid: o.wid,
        tint: 0.78 + rnd() * 0.22,
        front: n.z < -0.4,
      });
    }
  }
  return out;
}

// ============================================================================
//  MAIN YATAGARASU BUILDER
// ============================================================================
function buildYatagarasu(
  root: THREE.Group,
  beast: SpiritBeast,
  color: THREE.Color,
  glow: THREE.Color
): BeastMeshBundle {
  const parts: BeastMeshBundle["parts"] = {
    wings: [],
    accents: [],
    limbs: [],
    tails: [],
  };

  // ---------- Materials ----------
  const crowMat = new THREE.MeshStandardMaterial({
    color: 0x0b0b12,
    metalness: 0.5,
    roughness: 0.35,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xffc928,
    metalness: 0.92,
    roughness: 0.22,
    emissive: 0xff9a00,
    emissiveIntensity: 0.55,
  });
  const talonMat = new THREE.MeshStandardMaterial({
    color: 0x14141c,
    metalness: 0.85,
    roughness: 0.22,
  });
  const sunBasic = new THREE.MeshBasicMaterial({ color: 0xffe066, toneMapped: false });

  const wingFeatherMat = makeFeatherMaterial(0.42, 1.0);
  const bodyFeatherMat = makeFeatherMaterial(0.72, 0.9);
  const breastFeatherMat = makeFeatherMaterial(0.06, 1.05);

  const wingGeo = makeFeatherGeometry(0.26, -0.1);
  const tailGeo = makeFeatherGeometry(0.24, -0.16, 12);
  const bodyGeo = makeFeatherGeometry(0.3, 0.12, 6);

  const mk = (g: THREE.BufferGeometry, m: THREE.Material, parent?: THREE.Object3D) => {
    const mesh = new THREE.Mesh(g, m);
    mesh.castShadow = true;
    (parent ?? root).add(mesh);
    return mesh;
  };

  // ==========================================================================
  //  TORSO – lõi tối + lớp lông xếp ngói (ngực vàng, lưng đen viền vàng)
  // ==========================================================================
  const torsoC = V_YATA(0, 0.92, 0.05);
  const torsoR = V_YATA(0.42, 0.6, 0.5);

  const torsoGeo = new THREE.SphereGeometry(1, 28, 20);
  torsoGeo.scale(torsoR.x * 0.9, torsoR.y * 0.9, torsoR.z * 0.9);
  const body = mk(torsoGeo, crowMat);
  body.position.copy(torsoC);
  parts.body = body;

  const torsoSpecs = ellipsoidFeathers(torsoC, torsoR, {
    vFrom: Math.PI * 0.16,
    vTo: Math.PI * 0.97,
    rows: 12,
    perRow: 28,
    len: 0.38,
    wid: 1.6,
    lift: 0.38,
    seed: 11,
  });
  addFeathers(root, bodyGeo, breastFeatherMat, torsoSpecs.filter((s) => s.front && s.pos.y < 1.35));
  addFeathers(root, bodyGeo, bodyFeatherMat, torsoSpecs.filter((s) => !(s.front && s.pos.y < 1.35)));

  // Cổ / ruff
  addFeathers(
    root,
    bodyGeo,
    bodyFeatherMat,
    ellipsoidFeathers(V_YATA(0, 1.32, -0.3), V_YATA(0.27, 0.32, 0.27), {
      vFrom: Math.PI * 0.2,
      vTo: Math.PI * 0.92,
      rows: 5,
      perRow: 14,
      len: 0.28,
      wid: 1.5,
      lift: 0.4,
      seed: 21,
    })
  );
  const neck = mk(new THREE.SphereGeometry(1, 14, 12).scale(0.2, 0.28, 0.2), crowMat);
  neck.position.set(0, 1.32, -0.3);

  // Huy hiệu mặt trời trước ngực (bánh lái 8 nan như ảnh mẫu)
  const emblem = new THREE.Group();
  emblem.position.set(0, 0.8, -0.56);
  root.add(emblem);
  emblem.add(mk(new THREE.TorusGeometry(0.11, 0.014, 8, 40), goldMat));
  emblem.add(mk(new THREE.TorusGeometry(0.16, 0.007, 6, 40), goldMat));
  const hub = mk(new THREE.SphereGeometry(0.035, 12, 10), sunBasic);
  emblem.add(hub);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const spoke = mk(new THREE.BoxGeometry(0.012, 0.075, 0.012), goldMat);
    spoke.position.set(Math.sin(a) * 0.07, Math.cos(a) * 0.07, 0);
    spoke.rotation.z = -a;
    emblem.add(spoke);
    const tipG = new THREE.ConeGeometry(0.018, 0.06, 4);
    const tip = mk(tipG, goldMat);
    tip.position.set(Math.sin(a) * 0.19, Math.cos(a) * 0.19, 0);
    tip.rotation.z = -a;
    emblem.add(tip);
  }
  parts.accents?.push(hub);

  // ==========================================================================
  //  HEAD – đầu quạ, mỏ khoằm, mào mặt trời, mắt sắc
  // ==========================================================================
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.52, -0.52);
  root.add(headGroup);

  const headR = V_YATA(0.23, 0.25, 0.28);
  const headGeo = new THREE.SphereGeometry(1, 24, 18);
  headGeo.scale(headR.x * 0.92, headR.y * 0.92, headR.z * 0.92);
  const head = mk(headGeo, crowMat, headGroup);
  parts.head = head;

  addFeathers(
    headGroup,
    bodyGeo,
    bodyFeatherMat,
    ellipsoidFeathers(V_YATA(0, 0, 0), headR, {
      vFrom: Math.PI * 0.18,
      vTo: Math.PI * 0.88,
      rows: 6,
      perRow: 16,
      len: 0.2,
      wid: 1.4,
      lift: 0.3,
      flow: V_YATA(0, -0.45, 1),
      skip: (l) => l.z < -0.12,
      seed: 31,
    })
  );

  // Mỏ khoằm vàng: hàm trên cong xuống + hàm dưới ngắn
  const upperBeak = new THREE.CatmullRomCurve3([
    V_YATA(0, 0.0, -0.16),
    V_YATA(0, 0.01, -0.3),
    V_YATA(0, -0.005, -0.44),
    V_YATA(0, -0.06, -0.55),
    V_YATA(0, -0.16, -0.58),
  ]);
  mk(
    crowTaperedTube(upperBeak, (t) => 0.105 * Math.pow(1 - t, 0.85) + 0.004, 18, 10, 0.9, 1.0),
    goldMat,
    headGroup
  );
  const lowerBeak = new THREE.CatmullRomCurve3([
    V_YATA(0, -0.07, -0.16),
    V_YATA(0, -0.075, -0.3),
    V_YATA(0, -0.085, -0.42),
    V_YATA(0, -0.1, -0.5),
  ]);
  mk(
    crowTaperedTube(lowerBeak, (t) => 0.07 * Math.pow(1 - t, 0.9) + 0.004, 12, 8, 0.85, 0.7),
    goldMat,
    headGroup
  );

  // Mắt vàng xếch + lông mày giận dữ
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffe14a, toneMapped: false });
  [-1, 1].forEach((sgn) => {
    const eyeGeo = new THREE.SphereGeometry(0.05, 12, 10);
    eyeGeo.scale(1.5, 0.7, 0.8);
    const eye = mk(eyeGeo, eyeMat, headGroup);
    eye.position.set(sgn * 0.15, 0.06, -0.2);
    eye.rotation.z = sgn * 0.42;
    eye.rotation.y = sgn * 0.5;
    const browGeo = new THREE.SphereGeometry(1, 10, 8);
    browGeo.scale(0.1, 0.022, 0.08);
    const brow = mk(browGeo, crowMat, headGroup);
    brow.position.set(sgn * 0.15, 0.115, -0.19);
    brow.rotation.z = sgn * 0.5;
  });

  // Mào mặt trời: 5 chiếc gai vàng chĩa lên-ra sau
  const crestDefs: [number, number, number][] = [
    [0, 0.62, 0.06],
    [-0.07, 0.5, 0.0],
    [0.07, 0.5, 0.0],
    [-0.12, 0.38, -0.02],
    [0.12, 0.38, -0.02],
  ];
  crestDefs.forEach(([x, h, bend]) => {
    const c = new THREE.CatmullRomCurve3([
      V_YATA(x * 0.5, 0.2, -0.08),
      V_YATA(x, 0.2 + h * 0.45, -0.04 + bend * 0.5),
      V_YATA(x * 1.3, 0.2 + h * 0.8, 0.04 + bend),
      V_YATA(x * 1.6, 0.2 + h, 0.16 + bend * 1.6),
    ]);
    mk(crowTaperedTube(c, (t) => 0.042 * Math.pow(1 - t, 0.8) + 0.003, 12, 6), goldMat, headGroup);
  });

  // ==========================================================================
  //  HALO – vầng hào quang mặt trời nhiều lớp
  // ==========================================================================
  const haloGroup = new THREE.Group();
  haloGroup.position.set(0, 2.08, -0.5);
  haloGroup.rotation.x = Math.PI / 2 - 0.16;
  root.add(haloGroup);

  const haloCore = mk(new THREE.TorusGeometry(0.52, 0.022, 12, 96), sunBasic, haloGroup);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xffb300,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  mk(new THREE.TorusGeometry(0.52, 0.075, 12, 96), glowMat, haloGroup);
  mk(new THREE.TorusGeometry(0.42, 0.008, 8, 80), sunBasic, haloGroup);

  // Ký tự/tia nhỏ quanh vòng
  const tickCount = 36;
  const ticks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 0.05, 0.012), sunBasic, tickCount);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < tickCount; i++) {
    const a = (i / tickCount) * Math.PI * 2;
    const rad = i % 3 === 0 ? 0.6 : 0.58;
    dummy.position.set(Math.cos(a) * rad, Math.sin(a) * rad, 0);
    dummy.rotation.set(0, 0, a - Math.PI / 2);
    dummy.scale.set(1, i % 3 === 0 ? 1.8 : 1, 1);
    dummy.updateMatrix();
    ticks.setMatrixAt(i, dummy.matrix);
  }
  haloGroup.add(ticks);
  parts.accents?.push(haloCore);

  // Quầng sáng mặt trời phía sau lưng
  if (typeof document !== "undefined") {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 256;
    const cx = cv.getContext("2d")!;
    const rg = cx.createRadialGradient(128, 128, 4, 128, 128, 128);
    rg.addColorStop(0, "rgba(255,236,150,0.95)");
    rg.addColorStop(0.3, "rgba(255,170,40,0.45)");
    rg.addColorStop(1, "rgba(255,120,0,0)");
    cx.fillStyle = rg;
    cx.fillRect(0, 0, 256, 256);
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(cv),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.55,
        toneMapped: false,
      })
    );
    sprite.scale.set(4.2, 4.2, 1);
    sprite.position.set(0, 1.3, 0.9);
    root.add(sprite);
  }

  // ==========================================================================
  //  WINGS – 3 lớp lông: primaries (hình quạt), secondaries, coverts
  // ==========================================================================
  [-1, 1].forEach((dir) => {
    const wingGroup = new THREE.Group();
    wingGroup.position.set(dir * 0.4, 1.02, -0.05);

    const arm = new THREE.CatmullRomCurve3([
      V_YATA(0, 0, 0),
      V_YATA(dir * 0.45, 0.18, 0.05),
      V_YATA(dir * 0.95, 0.5, -0.05),
      V_YATA(dir * 1.25, 0.85, -0.12),
    ]);
    const wrist = arm.getPoint(1);
    const up = V_YATA(0, 1, 0);
    const mkDir = (elev: number, yaw: number) =>
      V_YATA(dir * Math.cos(elev) * Math.cos(yaw), Math.sin(elev), Math.cos(elev) * Math.sin(yaw)).normalize();

    const rnd = mulberry32(dir > 0 ? 101 : 202);
    const darkSpecs: FeatherSpec[] = [];
    const flightSpecs: FeatherSpec[] = [];

    // Primaries – quạt từ cổ tay, vươn cao như ảnh mẫu
    const nP = 10;
    for (let i = 0; i < nP; i++) {
      const t = i / (nP - 1);
      const elev = 1.15 - 1.05 * t;
      const yaw = -0.2 + 0.85 * t;
      flightSpecs.push({
        pos: wrist.clone().add(V_YATA(0, i * 0.004, 0)),
        dir: mkDir(elev, yaw),
        up,
        len: 1.75 - 0.75 * Math.abs(t - 0.25) + rnd() * 0.1,
        wid: 1.05,
        tint: 0.9 + rnd() * 0.1,
      });
    }

    // Secondaries – dọc cẳng cánh, xoè ra sau
    const nS = 10;
    for (let i = 0; i < nS; i++) {
      const t = i / (nS - 1);
      flightSpecs.push({
        pos: arm.getPoint(0.95 - t * 0.6).add(V_YATA(0, -0.01 - i * 0.003, 0.02)),
        dir: mkDir(0.4 - 0.5 * t, 0.9 + 0.5 * t),
        up,
        len: 1.25 - 0.3 * t + rnd() * 0.08,
        wid: 1.15,
        tint: 0.88 + rnd() * 0.12,
      });
    }

    // Coverts – 3 hàng lông ngắn che gốc lông bay
    for (let r = 0; r < 3; r++) {
      const n = 11 - r;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        darkSpecs.push({
          pos: arm.getPoint(0.05 + t * 0.92).add(V_YATA(0, 0.03 + r * 0.025, 0.02 + r * 0.03)),
          dir: mkDir(0.55 - 0.25 * (1 - t) - r * 0.08, 0.55 + 0.45 * (1 - t) + r * 0.12),
          up,
          len: 0.78 - r * 0.18 + rnd() * 0.06,
          wid: 1.3,
          tint: 0.8 + rnd() * 0.2,
        });
      }
    }

    addFeathers(wingGroup, wingGeo, wingFeatherMat, flightSpecs);
    addFeathers(wingGroup, wingGeo, bodyFeatherMat, darkSpecs);

    // Cơ vai
    const shoulderGeo = new THREE.SphereGeometry(1, 14, 12);
    shoulderGeo.scale(0.22, 0.16, 0.3);
    mk(shoulderGeo, crowMat, wingGroup);

    // Họa tiết vàng chạy dọc cánh + xoắn ở vai
    const ornament = new THREE.CatmullRomCurve3(
      arm.getPoints(12).map((p) => p.clone().add(V_YATA(0, 0.07, -0.03)))
    );
    mk(crowTaperedTube(ornament, (t) => 0.018 * (1 - t * 0.6), 24, 6), goldMat, wingGroup);
    const scroll = new THREE.CatmullRomCurve3([
      V_YATA(dir * 0.1, 0.1, 0.08),
      V_YATA(dir * 0.3, 0.3, 0.12),
      V_YATA(dir * 0.45, 0.22, 0.14),
      V_YATA(dir * 0.36, 0.1, 0.16),
      V_YATA(dir * 0.26, 0.16, 0.18),
    ]);
    mk(crowTaperedTube(scroll, (t) => 0.014 * (1 - t * 0.7), 20, 6), goldMat, wingGroup);
    const orb = mk(new THREE.SphereGeometry(0.05, 12, 10), sunBasic, wingGroup);
    orb.position.set(dir * 0.1, 0.13, -0.18);

    root.add(wingGroup);
    parts.wings?.push(wingGroup as unknown as THREE.Mesh);
  });

  // ==========================================================================
  //  TAIL – đuôi xoè nhiều lớp, dài và nhọn
  // ==========================================================================
  const tailGroup = new THREE.Group();
  tailGroup.position.set(0, 0.72, 0.38);
  root.add(tailGroup);
  {
    const rnd = mulberry32(303);
    const specs: FeatherSpec[] = [];
    const layers = [
      { n: 13, spread: 0.62, len: 2.0, y: 0.0 },
      { n: 9, spread: 0.42, len: 1.45, y: 0.04 },
    ];
    layers.forEach((L, li) => {
      for (let i = 0; i < L.n; i++) {
        const a = (i / (L.n - 1) - 0.5) * 2 * L.spread;
        const e = 0.3 + Math.abs(a) * 0.3 + li * 0.1;
        const d = V_YATA(Math.sin(a) * Math.cos(e), -Math.sin(e), Math.cos(a) * Math.cos(e));
        specs.push({
          pos: V_YATA(a * 0.16, L.y, 0),
          dir: d,
          up: V_YATA(0, 1, 0),
          len: L.len * (1 - 0.32 * (Math.abs(a) / L.spread)) + rnd() * 0.08,
          wid: 1.1,
          tint: 0.88 + rnd() * 0.12,
        });
      }
    });
    addFeathers(tailGroup, tailGeo, wingFeatherMat, specs);
    // chiếc ghim vàng ở gốc đuôi
    const pin = mk(new THREE.TorusGeometry(0.07, 0.012, 8, 24), goldMat, tailGroup);
    pin.position.set(0, 0.06, 0.02);
  }
  parts.tails?.push(tailGroup as unknown as THREE.Mesh);

  // ==========================================================================
  //  THREE LEGS – 3 chân vàng giáp đốt, mỗi chân 3 ngón trước + 1 ngón sau, vuốt đen
  // ==========================================================================
  const legDefs: [number, number][] = [
    [-0.2, -0.04], // chân trái
    [0.2, -0.04], // chân phải
    [0, 0.26], // chân thứ ba – phía sau, ở giữa
  ];
  legDefs.forEach(([x, z], li) => {
    const leg = new THREE.Group();
    leg.position.set(x, 0, z);
    root.add(leg);

    // đùi lông
    addFeathers(
      leg,
      bodyGeo,
      bodyFeatherMat,
      ellipsoidFeathers(V_YATA(0, 0.56, 0), V_YATA(0.15, 0.2, 0.17), {
        vFrom: Math.PI * 0.2,
        vTo: Math.PI * 0.95,
        rows: 4,
        perRow: 10,
        len: 0.22,
        wid: 1.5,
        lift: 0.35,
        seed: 41 + li,
      })
    );

    const hipY = 0.5;
    const tarsus = new THREE.CatmullRomCurve3([
      V_YATA(0, hipY, 0),
      V_YATA(0, 0.4, -0.07),
      V_YATA(0, 0.26, 0.0),
      V_YATA(0, 0.14, 0.02),
    ]);
    mk(crowTaperedTube(tarsus, (t) => 0.05 - 0.016 * t, 16, 10, 1, 0.9), goldMat, leg);

    // đốt giáp
    [0.3, 0.5, 0.7, 0.88].forEach((t, k) => {
      const ring = mk(new THREE.TorusGeometry(0.052 - 0.014 * t + 0.006, 0.009, 6, 16), goldMat, leg);
      ring.position.copy(tarsus.getPointAt(t));
      ring.rotation.x = Math.PI / 2 - 0.15;
      ring.scale.setScalar(1 + (k % 2) * 0.08);
    });

    const knuckle = mk(new THREE.SphereGeometry(0.048, 10, 8), goldMat, leg);
    knuckle.position.set(0, 0.14, 0.02);

    // ngón + vuốt
    const toes: [number, number, number][] = [
      [0, -1, 0.34],
      [-0.55, -0.85, 0.3],
      [0.55, -0.85, 0.3],
      [0, 0.8, 0.2],
    ];
    toes.forEach(([dx, dz, len]) => {
      const d = V_YATA(dx, 0, dz).normalize();
      const p0 = V_YATA(0, 0.14, 0.02);
      const p1 = p0.clone().addScaledVector(d, len * 0.35).setY(0.1);
      const p2 = p0.clone().addScaledVector(d, len).setY(0.065);
      const toe = new THREE.CatmullRomCurve3([p0, p1, p2]);
      mk(crowTaperedTube(toe, (t) => 0.03 - 0.008 * t, 8, 8), goldMat, leg);
      const talon = new THREE.CatmullRomCurve3([
        p2,
        p2.clone().addScaledVector(d, 0.07).setY(0.06),
        p2.clone().addScaledVector(d, 0.11).setY(0.0),
      ]);
      mk(crowTaperedTube(talon, (t) => 0.03 * Math.pow(1 - t, 0.9) + 0.002, 10, 8), talonMat, leg);
    });

    parts.limbs?.push(leg as unknown as THREE.Mesh);
  });

  // ==========================================================================
  //  LIGHTING / AURA
  // ==========================================================================
  const aura = new THREE.PointLight(0xffea00, 3.2, 16);
  aura.position.set(0, 1.3, 0);
  root.add(aura);
  parts.auraLight = aura;

  const haloLight = new THREE.PointLight(0xffc040, 1.6, 6);
  haloLight.position.set(0, 2.1, -0.5);
  root.add(haloLight);

  // Hiệu ứng xoay nhịp vầng hào quang thái dương
  root.userData.tick = (time: number) => {
    ticks.rotation.z = time * 0.35;
  };

  return { group: root, id: beast.id, parts };
}

/**
 * 5. Okami Shiro (白神狼) – Bạch Lang Núi Tuyết Phú Sĩ
 *
 * Kỹ thuật thay cho "khối ghép":
 *  - Thân / đầu: sphere được nắn dáng bằng hàm profile (ngực nở, eo thon, hông)
 *  - Lông: hàng nghìn chùm lông (InstancedMesh) mọc theo pháp tuyến bề mặt
 *  - 9 đuôi: ống thuôn dần (tapered tube) + lông xù + ngọn lửa đỏ
 *  - Dấu ấn Amaterasu: ống xoắn ốc đỏ bóng (clearcoat)
 *  - Shimenawa: 2 sợi xoắn bện + shide hình thoi
 *  - Linh khí: dải xoắn cyan additive + hạt sáng + point light
 *
 * Hoạt ảnh (tuỳ chọn): trong render loop gọi
 *    bundle.group.userData.animate?.(elapsedSeconds);
 */

// ───────────────────────── Helpers Okami ─────────────────────────
const okamiV3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const OKAMI_UP = okamiV3(0, 1, 0);

function okamiMakeRng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Nội suy mượt qua các mốc [t, r] */
function okamiProfile(stops: [number, number][]) {
  return (t: number) => {
    if (t <= stops[0][0]) return stops[0][1];
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) {
        const [t0, r0] = stops[i - 1];
        const [t1, r1] = stops[i];
        const k = (t - t0) / (t1 - t0);
        const s = k * k * (3 - 2 * k);
        return r0 + (r1 - r0) * s;
      }
    }
    return stops[stops.length - 1][1];
  };
}

const okamiBump = (x: number, c: number, w: number) => {
  const d = (x - c) / w;
  return Math.exp(-d * d);
};

/** Ống có bán kính thay đổi dọc theo đường cong */
function okamiTaperedTube(
  curve: THREE.Curve<THREE.Vector3>,
  segs: number,
  radial: number,
  radiusAt: (t: number) => number
): THREE.BufferGeometry {
  const frames = curve.computeFrenetFrames(segs, false);
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const p = curve.getPointAt(t);
    const r = radiusAt(t);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const nx = c * N.x + s * B.x;
      const ny = c * N.y + s * B.y;
      const nz = c * N.z + s * B.z;
      pos.push(p.x + r * nx, p.y + r * ny, p.z + r * nz);
      nor.push(nx, ny, nz);
      uv.push(t, j / radial);
    }
  }
  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = (i + 1) * (radial + 1) + j;
      const c = b + 1;
      const d = a + 1;
      idx.push(a, b, d, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

// ── Lông: chùm lông nhọn, đáy ở gốc, đỉnh ở +Y ──
function okamiMakeFurGeo() {
  const g = new THREE.ConeGeometry(0.5, 1, 4, 1, true);
  g.translate(0, 0.5, 0);
  return g;
}

interface OkamiTuftSpec {
  pos: THREE.Vector3;
  dir: THREE.Vector3;
  len: number;
  wid: number;
  tint: number;
}

const OKAMI_COOL = new THREE.Color(0xb9d6ff);

function okamiBuildTufts(
  specs: OkamiTuftSpec[],
  geo: THREE.BufferGeometry,
  mat: THREE.Material
): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geo, mat, specs.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const c = new THREE.Color();
  specs.forEach((t, i) => {
    q.setFromUnitVectors(OKAMI_UP, t.dir.clone().normalize());
    s.set(t.wid, t.len, t.wid);
    m.compose(t.pos, q, s);
    mesh.setMatrixAt(i, m);
    c.set(0xffffff).lerp(OKAMI_COOL, t.tint * 0.4);
    mesh.setColorAt(i, c);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.frustumCulled = false;
  return mesh;
}

/** Rải lông lên bề mặt một mesh (đã bake hình dạng vào geometry) */
function okamiSurfaceTufts(
  mesh: THREE.Mesh,
  count: number,
  rand: () => number,
  o: {
    len: [number, number];
    wid: number;
    sweep?: THREE.Vector3;
    sweepAmt?: number;
    droop?: number;
    lenFn?: (p: THREE.Vector3, n: THREE.Vector3) => number;
    skip?: (p: THREE.Vector3, n: THREE.Vector3) => boolean;
  }
): OkamiTuftSpec[] {
  mesh.updateMatrix();
  const g = mesh.geometry;
  const pos = g.attributes.position;
  const nor = g.attributes.normal;
  const idx = g.index;
  const triCount = idx ? idx.count / 3 : pos.count / 3;
  const out: OkamiTuftSpec[] = [];
  const a = okamiV3(0, 0, 0), b = okamiV3(0, 0, 0), c = okamiV3(0, 0, 0);
  const na = okamiV3(0, 0, 0), nb = okamiV3(0, 0, 0), nc = okamiV3(0, 0, 0);
  let guard = 0;
  while (out.length < count && guard++ < count * 5) {
    const tri = Math.floor(rand() * triCount);
    const i0 = idx ? idx.getX(tri * 3) : tri * 3;
    const i1 = idx ? idx.getX(tri * 3 + 1) : tri * 3 + 1;
    const i2 = idx ? idx.getX(tri * 3 + 2) : tri * 3 + 2;
    a.fromBufferAttribute(pos, i0); b.fromBufferAttribute(pos, i1); c.fromBufferAttribute(pos, i2);
    na.fromBufferAttribute(nor, i0); nb.fromBufferAttribute(nor, i1); nc.fromBufferAttribute(nor, i2);
    let u = rand(), v = rand();
    if (u + v > 1) { u = 1 - u; v = 1 - v; }
    const w = 1 - u - v;
    const p = a.clone().multiplyScalar(w).addScaledVector(b, u).addScaledVector(c, v);
    const n = na.clone().multiplyScalar(w).addScaledVector(nb, u).addScaledVector(nc, v).normalize();
    p.applyMatrix4(mesh.matrix);
    n.transformDirection(mesh.matrix);
    if (o.skip && o.skip(p, n)) continue;
    const dir = n.clone().multiplyScalar(0.7);
    if (o.sweep) dir.addScaledVector(o.sweep, o.sweepAmt ?? 0.5);
    dir.y -= o.droop ?? 0.25;
    dir.x += (rand() - 0.5) * 0.35;
    dir.y += (rand() - 0.5) * 0.35;
    dir.z += (rand() - 0.5) * 0.35;
    const lf = o.lenFn ? o.lenFn(p, n) : 1;
    out.push({
      pos: p.addScaledVector(n, -0.012),
      dir,
      len: (o.len[0] + (o.len[1] - o.len[0]) * rand()) * lf,
      wid: o.wid * (0.8 + rand() * 0.6),
      tint: rand(),
    });
  }
  return out;
}

/** Rải lông quanh một ống (đuôi, chân, cổ) */
function okamiTubeTufts(
  curve: THREE.Curve<THREE.Vector3>,
  radiusAt: (t: number) => number,
  count: number,
  rand: () => number,
  o: {
    len: [number, number];
    wid: number;
    along: number;
    out: number;
    tMin?: number;
    tMax?: number;
    lenFn?: (t: number) => number;
  }
): OkamiTuftSpec[] {
  const SEG = 64;
  const frames = curve.computeFrenetFrames(SEG, false);
  const res: OkamiTuftSpec[] = [];
  const t0 = o.tMin ?? 0;
  const t1 = o.tMax ?? 1;
  for (let k = 0; k < count; k++) {
    const t = t0 + rand() * (t1 - t0);
    const fi = Math.round(t * SEG);
    const N = frames.normals[fi];
    const B = frames.binormals[fi];
    const p = curve.getPointAt(t);
    const T = curve.getTangentAt(t);
    const ang = rand() * Math.PI * 2;
    const radial = N.clone().multiplyScalar(Math.cos(ang)).addScaledVector(B, Math.sin(ang));
    const r = radiusAt(t);
    const dir = radial.clone().multiplyScalar(o.out).addScaledVector(T, o.along);
    dir.x += (rand() - 0.5) * 0.3;
    dir.y += (rand() - 0.5) * 0.3;
    dir.z += (rand() - 0.5) * 0.3;
    const lf = o.lenFn ? o.lenFn(t) : 1;
    res.push({
      pos: p.clone().addScaledVector(radial, r * 0.9),
      dir,
      len: (o.len[0] + (o.len[1] - o.len[0]) * rand()) * lf,
      wid: o.wid * (0.8 + rand() * 0.6),
      tint: rand(),
    });
  }
  return res;
}

function okamiGlowTexture(): THREE.Texture {
  if (typeof document === "undefined") {
    return new THREE.Texture();
  }
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d");
  if (!ctx) return new THREE.Texture();
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.3, "rgba(160,245,255,0.7)");
  g.addColorStop(1, "rgba(0,229,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

// ───────────────────────── Okami Shiro ─────────────────────────
function buildOkami(
  root: THREE.Group,
  beast: SpiritBeast,
  color: THREE.Color,
  glow: THREE.Color
): BeastMeshBundle {
  const parts: BeastMeshBundle["parts"] = {
    ears: [],
    tails: [],
    accents: [],
  };

  const rand = okamiMakeRng(0x0ca31);
  const DENSITY = 1; // giảm xuống 0.5 nếu máy yếu / mobile
  const n = (k: number) => Math.max(1, Math.round(k * DENSITY));

  // ── Vật liệu ──
  const furMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0,
    emissive: 0x8fb8ff,
    emissiveIntensity: 0.1,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xdde7f6,
    roughness: 0.95,
    emissive: 0x6f93c8,
    emissiveIntensity: 0.08,
  });
  const vermilion = new THREE.MeshPhysicalMaterial({
    color: 0xe53935,
    emissive: 0xc62828,
    emissiveIntensity: 0.55,
    roughness: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
  });
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xff3d2e, transparent: true, opacity: 0.93 });
  const flameCoreMat = new THREE.MeshBasicMaterial({ color: 0xff8a65, transparent: true, opacity: 0.85 });
  const iceMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
  const ropeMat = new THREE.MeshStandardMaterial({ color: 0xd8c6a0, roughness: 0.95 });
  const paperMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.6,
    side: THREE.DoubleSide,
    emissive: 0x9fb4d0,
    emissiveIntensity: 0.12,
  });
  const auraMat = new THREE.MeshBasicMaterial({
    color: 0x00e5ff,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const furGeo = okamiMakeFurGeo();
  const addTufts = (parent: THREE.Object3D, specs: OkamiTuftSpec[]) =>
    parent.add(okamiBuildTufts(specs, furGeo, furMat));

  // ══════════ THÂN: ellipsoid nắn dáng sói ══════════
  const bodyGeo = new THREE.SphereGeometry(1, 56, 40);
  {
    const bp = bodyGeo.attributes.position;
    for (let i = 0; i < bp.count; i++) {
      const x = bp.getX(i), y = bp.getY(i), z = bp.getZ(i);
      const rx = 0.3 + 0.08 * okamiBump(z, -0.45, 0.4) + 0.05 * okamiBump(z, 0.6, 0.3);
      const ry = 0.32 + 0.12 * okamiBump(z, -0.5, 0.38) + 0.06 * okamiBump(z, 0.6, 0.3);
      let yy = y * ry;
      if (y < 0) yy += -y * 0.07 * okamiBump(z, 0.15, 0.3); // bụng thon
      bp.setXYZ(i, x * rx, yy + 0.04 * okamiBump(z, -0.5, 0.4), z * 0.82);
    }
    bodyGeo.computeVertexNormals();
  }
  const body = new THREE.Mesh(bodyGeo, skinMat);
  body.castShadow = true;
  body.position.set(0, 0.82, 0);
  root.add(body);
  parts.body = body;

  // Lông thân (ngực & cổ dài hơn → bờm lông)
  addTufts(
    root,
    okamiSurfaceTufts(body, n(5200), rand, {
      len: [0.1, 0.2],
      wid: 0.032,
      sweep: okamiV3(0, 0, 1),
      sweepAmt: 0.6,
      droop: 0.3,
      lenFn: (p) => 1 + 0.9 * okamiBump(p.z, -0.55, 0.28) * (p.y < 1.05 ? 1 : 0.6) + 0.4 * okamiBump(p.y, 0.45, 0.2),
    })
  );

  // Vầng sáng mỏng quanh thân (rim glow)
  const rim = new THREE.Mesh(
    bodyGeo,
    new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.07,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  rim.position.copy(body.position);
  rim.scale.setScalar(1.12);
  root.add(rim);

  // ══════════ CỔ ══════════
  const neckCurve = new THREE.CatmullRomCurve3([okamiV3(0, 1.0, -0.42), okamiV3(0, 1.18, -0.68), okamiV3(0, 1.3, -0.86)]);
  const neckR = okamiProfile([[0, 0.31], [0.6, 0.27], [1, 0.24]]);
  const neck = new THREE.Mesh(okamiTaperedTube(neckCurve, 16, 20, neckR), skinMat);
  root.add(neck);
  addTufts(
    root,
    okamiTubeTufts(neckCurve, neckR, n(900), rand, {
      len: [0.1, 0.22],
      wid: 0.032,
      along: -0.2,
      out: 0.8,
      lenFn: (t) => 1.3 - 0.4 * t,
    })
  );

  // ══════════ ĐẦU ══════════
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.36, -0.92);
  headGroup.rotation.x = 0.06;
  root.add(headGroup);

  const crGeo = new THREE.SphereGeometry(1, 40, 28);
  crGeo.scale(0.33, 0.31, 0.36);
  const head = new THREE.Mesh(crGeo, skinMat);
  head.castShadow = true;
  headGroup.add(head);
  parts.head = head;

  // Mõm
  const muzzleCurve = new THREE.CatmullRomCurve3([okamiV3(0, -0.05, -0.2), okamiV3(0, -0.07, -0.42), okamiV3(0, -0.09, -0.62)]);
  const muzzle = new THREE.Mesh(
    okamiTaperedTube(muzzleCurve, 14, 18, (t) => 0.2 - 0.125 * Math.pow(t, 1.1)),
    skinMat
  );
  muzzle.scale.y = 0.8;
  headGroup.add(muzzle);
  addTufts(
    headGroup,
    okamiSurfaceTufts(muzzle, n(160), rand, { len: [0.03, 0.06], wid: 0.016, sweep: okamiV3(0, 0, 1), sweepAmt: 0.8, droop: 0.1 })
  );

  // Hàm dưới
  const jawCurve = new THREE.CatmullRomCurve3([okamiV3(0, -0.14, -0.18), okamiV3(0, -0.17, -0.4), okamiV3(0, -0.16, -0.57)]);
  const jaw = new THREE.Mesh(okamiTaperedTube(jawCurve, 10, 14, (t) => 0.13 - 0.08 * t), skinMat);
  jaw.scale.y = 0.65;
  headGroup.add(jaw);

  // Mũi đen bóng
  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0x15151c, roughness: 0.2, metalness: 0.2 })
  );
  nose.scale.set(1.1, 0.8, 0.9);
  nose.position.set(0, -0.05, -0.64);
  headGroup.add(nose);

  // Bờm má (cheek ruff)
  addTufts(
    headGroup,
    okamiSurfaceTufts(head, n(900), rand, {
      len: [0.07, 0.14],
      wid: 0.026,
      sweep: okamiV3(0, 0, 1),
      sweepAmt: 0.7,
      droop: 0.25,
      lenFn: (p) => 1 + 1.4 * okamiBump(Math.abs(p.x), 0.3, 0.12) * okamiBump(p.y, -0.08, 0.25),
      skip: (p) => p.z < -0.28 && p.y > -0.02 && Math.abs(p.x) < 0.2, // chừa vùng trán/mắt cho dấu đỏ
    })
  );

  // Mắt băng cyan phát sáng
  const glowTex = okamiGlowTexture();
  [-1, 1].forEach((s) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 18, 14), iceMat);
    eye.scale.set(1.15, 0.6, 0.5);
    eye.rotation.z = s * 0.32;
    eye.position.set(s * 0.15, 0.06, -0.305);
    headGroup.add(eye);

    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glowTex, color: 0x66f2ff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    halo.scale.setScalar(0.22);
    halo.position.set(s * 0.15, 0.06, -0.32);
    headGroup.add(halo);
  });

  // Dấu đỏ trên mặt (chiếu lên mặt cầu đầu)
  const onHead = (x: number, y: number, off = 0.008) => {
    const k = 1 - (x / 0.33) ** 2 - (y / 0.31) ** 2;
    return okamiV3(x, y, -0.36 * Math.sqrt(Math.max(k, 0.03)) - off);
  };
  const faceMark = (pts: [number, number][], r: number) => {
    const c = new THREE.CatmullRomCurve3(pts.map(([x, y]) => onHead(x, y)));
    const m = new THREE.Mesh(okamiTaperedTube(c, 24, 6, (t) => r * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.08)))), vermilion);
    headGroup.add(m);
  };
  faceMark([[0, 0.06], [0, 0.13], [0, 0.2]], 0.011);
  { // vòng tròn vương triện
    const ring: [number, number][] = [];
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      ring.push([Math.cos(a) * 0.04, 0.22 + Math.sin(a) * 0.045]);
    }
    const c = new THREE.CatmullRomCurve3(ring.map(([x, y]) => onHead(x, y)), true);
    headGroup.add(new THREE.Mesh(okamiTaperedTube(c, 28, 6, () => 0.008), vermilion));
  }
  faceMark([[0, 0.27], [0, 0.31], [0, 0.34]], 0.01);
  [-1, 1].forEach((s) => {
    faceMark([[s * 0.05, 0.14], [s * 0.1, 0.2], [s * 0.15, 0.27]], 0.011);
    faceMark([[s * 0.06, 0.22], [s * 0.11, 0.28], [s * 0.14, 0.33]], 0.008);
    faceMark([[s * 0.2, 0.0], [s * 0.26, -0.04], [s * 0.3, -0.1]], 0.009); // vệt dưới mắt
    faceMark([[s * 0.19, 0.12], [s * 0.25, 0.14], [s * 0.3, 0.2]], 0.008);
  });

  // Tai nhọn lông xù, lòng tai đỏ
  [-1, 1].forEach((s) => {
    const earG = new THREE.Group();
    earG.position.set(s * 0.17, 0.26, 0.04);
    earG.rotation.z = s > 0 ? -0.28 : 0.28;
    earG.rotation.x = -0.12;
    earG.userData.rx = -0.12;

    const eGeo = new THREE.ConeGeometry(0.14, 0.5, 24, 1);
    eGeo.scale(1, 1, 0.4);
    eGeo.translate(0, 0.25, 0);
    const ear = new THREE.Mesh(eGeo, skinMat);
    earG.add(ear);
    addTufts(earG, okamiSurfaceTufts(ear, n(60), rand, { len: [0.04, 0.09], wid: 0.02, droop: -0.1 }));

    const iGeo = new THREE.ConeGeometry(0.085, 0.4, 20, 1);
    iGeo.scale(1, 1, 0.3);
    iGeo.translate(0, 0.2, 0);
    const inner = new THREE.Mesh(iGeo, vermilion);
    inner.position.set(0, 0.02, -0.03);
    earG.add(inner);

    headGroup.add(earG);
    parts.ears?.push(earG as any);
  });

  // ══════════ 4 CHÂN ══════════
  parts.limbs = [];
  const legs = [
    { x: -0.25, z: -0.42, hipY: 0.66, front: true },
    { x: 0.25, z: -0.42, hipY: 0.66, front: true },
    { x: -0.27, z: 0.42, hipY: 0.8, front: false },
    { x: 0.27, z: 0.42, hipY: 0.8, front: false },
  ];
  legs.forEach((L) => {
    const g = new THREE.Group();
    g.position.set(L.x, L.hipY, L.z);
    const endY = 0.06 - L.hipY;
    const curve = L.front
      ? new THREE.CatmullRomCurve3([okamiV3(0, 0, 0), okamiV3(0, endY * 0.4, 0.01), okamiV3(0, endY * 0.75, -0.01), okamiV3(0, endY, -0.02)])
      : new THREE.CatmullRomCurve3([okamiV3(0, 0, 0), okamiV3(0, endY * 0.28, 0.12), okamiV3(0, endY * 0.55, 0.02), okamiV3(0, endY * 0.75, 0.1), okamiV3(0, endY, 0.07)]);
    const rProf = L.front
      ? okamiProfile([[0, 0.11], [0.4, 0.08], [1, 0.058]])
      : okamiProfile([[0, 0.17], [0.3, 0.12], [0.58, 0.058], [1, 0.062]]);
    g.add(new THREE.Mesh(okamiTaperedTube(curve, 24, 14, rProf), skinMat));
    addTufts(
      g,
      okamiTubeTufts(curve, rProf, n(L.front ? 260 : 360), rand, {
        len: [0.06, 0.14],
        wid: 0.026,
        along: 0.5,
        out: 0.8,
        lenFn: (t) => (L.front ? 1 : 1.5 - 0.8 * t),
      })
    );

    // bàn chân + móng
    const end = curve.getPointAt(1);
    const paw = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), skinMat);
    paw.scale.set(0.085, 0.05, 0.125);
    paw.position.set(end.x, 0.05 - L.hipY, end.z - 0.04);
    g.add(paw);
    [-0.042, 0, 0.042].forEach((tx, i) => {
      const toe = new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 8), skinMat);
      toe.scale.set(1, 0.8, 1.2);
      toe.position.set(end.x + tx, 0.04 - L.hipY, end.z - 0.15 + (i === 1 ? -0.012 : 0));
      g.add(toe);
      const claw = new THREE.Mesh(
        new THREE.ConeGeometry(0.011, 0.055, 6),
        new THREE.MeshStandardMaterial({ color: 0xe8e6e1, roughness: 0.4 })
      );
      claw.rotation.x = -Math.PI / 2 - 0.5;
      claw.position.set(end.x + tx, 0.022 - L.hipY, end.z - 0.2);
      g.add(claw);
    });
    addTufts(
      g,
      okamiSurfaceTufts(paw, n(40), rand, { len: [0.04, 0.08], wid: 0.02, droop: 0.3 })
    );

    // vòng lửa đỏ ở cổ chân: dây xoắn + dải xoắn ốc
    const a = curve.getPointAt(0.8);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.016, 8, 24), vermilion);
    ring.rotation.x = Math.PI / 2;
    ring.position.copy(a);
    g.add(ring);
    const hp: THREE.Vector3[] = [];
    for (let i = 0; i <= 22; i++) {
      const t = i / 22;
      const th = t * Math.PI * 3.2;
      const rr = 0.082 + 0.03 * Math.sin(t * Math.PI);
      hp.push(okamiV3(a.x + Math.cos(th) * rr, a.y - 0.03 + t * 0.12, a.z + Math.sin(th) * rr));
    }
    hp.push(okamiV3(a.x + 0.1, a.y + 0.2, a.z + 0.02), okamiV3(a.x + 0.06, a.y + 0.27, a.z - 0.04));
    g.add(new THREE.Mesh(okamiTaperedTube(new THREE.CatmullRomCurve3(hp), 50, 8, (t) => 0.014 * (1 - t) ** 0.6 + 0.003), vermilion));

    root.add(g);
    parts.limbs?.push(g as any);
  });

  // ══════════ DẤU ẤN THẦN LINH AMATERASU (xoáy đỏ trên vai & hông) ══════════
  const addSwirl = (cx: number, cy: number, cz: number, r0: number, turns: number, rot: number, w: number) => {
    const pts: THREE.Vector3[] = [];
    const N = 30;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const th = rot + t * turns * Math.PI * 2;
      const r = r0 * (1 - 0.8 * t) + 0.01;
      pts.push(okamiV3(cx + 0.02 * Math.sin(t * Math.PI) * Math.sign(cx), cy + r * Math.sin(th), cz + r * Math.cos(th)));
    }
    root.add(new THREE.Mesh(okamiTaperedTube(new THREE.CatmullRomCurve3(pts), 64, 10, (t) => w * (1 - t) ** 0.7 + 0.004), vermilion));
    // đuôi lửa bay của dải
    const s0 = pts[0];
    const wisp = new THREE.CatmullRomCurve3([
      s0.clone(),
      okamiV3(s0.x + Math.sign(cx) * 0.03, s0.y + 0.1, s0.z + 0.06),
      okamiV3(s0.x + Math.sign(cx) * 0.05, s0.y + 0.2, s0.z + 0.2),
      okamiV3(s0.x + Math.sign(cx) * 0.03, s0.y + 0.24, s0.z + 0.34),
    ]);
    root.add(new THREE.Mesh(okamiTaperedTube(wisp, 24, 8, (t) => (w + 0.004) * (1 - t) ** 0.8 + 0.002), vermilion));
  };
  [-1, 1].forEach((s) => {
    addSwirl(s * 0.37, 0.96, -0.4, 0.15, 1.6, 0.4, 0.034);
    addSwirl(s * 0.35, 1.1, -0.18, 0.09, 1.25, 2.0, 0.024);
    addSwirl(s * 0.4, 0.9, 0.4, 0.1, 1.4, 1.0, 0.026);
  });

  // ══════════ SHIMENAWA + SHIDE ══════════
  const ropeBase = new THREE.CatmullRomCurve3(
    Array.from({ length: 40 }, (_, i) => {
      const a = (i / 40) * Math.PI * 2;
      const front = Math.max(0, -Math.sin(a));
      return okamiV3(Math.cos(a) * 0.32, 1.14 - 0.14 * front * front, -0.42 + Math.sin(a) * 0.27);
    }),
    true
  );
  {
    const SEG = 120;
    const fr = ropeBase.computeFrenetFrames(SEG, true);
    [0, 1].forEach((k) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < SEG; i++) {
        const t = i / SEG;
        const ph = t * Math.PI * 2 * 22 + k * Math.PI;
        const p = ropeBase.getPointAt(t);
        p.addScaledVector(fr.normals[i], Math.cos(ph) * 0.02).addScaledVector(fr.binormals[i], Math.sin(ph) * 0.02);
        pts.push(p);
      }
      const c = new THREE.CatmullRomCurve3(pts, true);
      root.add(new THREE.Mesh(okamiTaperedTube(c, 240, 8, () => 0.03), ropeMat));
    });
  }
  const shides: THREE.Group[] = [];
  const dH = 0.085, dW = 0.055;
  const diamond = new THREE.Shape();
  diamond.moveTo(0, dH); diamond.lineTo(dW, 0); diamond.lineTo(0, -dH); diamond.lineTo(-dW, 0); diamond.closePath();
  const diamondGeo = new THREE.ShapeGeometry(diamond);
  [-2, -1, 0, 1, 2].forEach((k) => {
    const a = (3 * Math.PI) / 2 + k * 0.3;
    const pivot = new THREE.Group();
    pivot.position.copy(ropeBase.getPointAt(((a / (Math.PI * 2)) % 1 + 1) % 1));
    pivot.position.z -= 0.02;
    pivot.rotation.y = Math.PI / 2 - a;
    const len = k === 0 ? 4 : Math.abs(k) === 1 ? 3 : 2;
    for (let i = 0; i < len; i++) {
      const d = new THREE.Mesh(diamondGeo, paperMat);
      d.position.set(i % 2 ? 0.012 : -0.012, -dH * (1 + i * 1.9), i * 0.004);
      d.rotation.z = i % 2 ? 0.2 : -0.2;
      pivot.add(d);
    }
    root.add(pivot);
    shides.push(pivot);
    parts.accents?.push(pivot as any);
  });

  // ══════════ 9 ĐUÔI ══════════
  const tailBase = okamiV3(0, 0.98, 0.66);
  const tailR = (t: number) =>
    (0.05 + 0.15 * Math.sin(Math.PI * Math.pow(t, 0.7))) * (1 - 0.55 * Math.pow(t, 4));
  const tailGroups: THREE.Group[] = [];
  const flames: THREE.Mesh[] = [];

  const flameBlade = (curve: THREE.Curve<THREE.Vector3>, w: number, mat: THREE.Material) => {
    const m = new THREE.Mesh(
      okamiTaperedTube(curve, 20, 8, (t) => w * Math.pow(Math.sin(Math.PI * (0.15 + 0.85 * t)), 0.9)),
      mat
    );
    flames.push(m);
    return m;
  };

  for (let i = 0; i < 9; i++) {
    const u = (i / 8) * 2 - 1;
    const ang = u * 1.25;
    const lift = 1 - 0.55 * Math.abs(u);
    const L = 1.2 * (0.75 + 0.25 * lift);
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 6; k++) {
      const t = k / 6;
      const d = L * Math.pow(t, 0.9);
      const h = lift * 1.0 * Math.pow(t, 1.7) + 0.15 * t;
      const wig = Math.sin(t * Math.PI * 2 + i * 1.7) * 0.06 * t;
      pts.push(okamiV3(Math.sin(ang) * d * 0.95 + wig, h, Math.cos(ang) * d));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const g = new THREE.Group();
    g.position.copy(tailBase);
    g.userData.rz = 0;
    g.userData.rx = 0;

    g.add(new THREE.Mesh(okamiTaperedTube(curve, 44, 14, tailR), skinMat));
    addTufts(
      g,
      okamiTubeTufts(curve, tailR, n(620), rand, {
        len: [0.12, 0.26],
        wid: 0.036,
        along: 0.95,
        out: 0.6,
        tMin: 0.02,
        lenFn: (t) => 0.7 + 0.8 * Math.sin(Math.PI * t),
      })
    );

    // ngọn lửa đỏ
    const P = curve.getPointAt(1);
    const T = curve.getTangentAt(1);
    const dir = T.clone().multiplyScalar(0.6).addScaledVector(OKAMI_UP, 0.8).normalize();
    const side = okamiV3(1, 0, 0).cross(dir).normalize();
    [-1, 0, 1].forEach((s) => {
      const len = s === 0 ? 0.5 : 0.36;
      const S = side.clone().multiplyScalar(s * 0.08);
      const bc = new THREE.CatmullRomCurve3([
        P.clone().addScaledVector(T, -0.05),
        P.clone().addScaledVector(dir, len * 0.3).add(S.clone().multiplyScalar(0.5)),
        P.clone().addScaledVector(dir, len * 0.65).add(S),
        P.clone().addScaledVector(dir, len).add(S.clone().multiplyScalar(0.6)).addScaledVector(T, 0.06),
      ]);
      g.add(flameBlade(bc, 0.07, flameMat));
      const core = flameBlade(bc, 0.035, flameCoreMat);
      core.position.y += 0.005;
      g.add(core);
    });

    root.add(g);
    tailGroups.push(g);
    parts.tails?.push(g as any);
  }

  // ══════════ LINH KHÍ BĂNG (aura) ══════════
  const aura = new THREE.PointLight(0x00e5ff, 2.8, 14);
  aura.position.set(0, 1.2, 0);
  root.add(aura);
  parts.auraLight = aura;

  const auraGroup = new THREE.Group();
  auraGroup.position.set(0, 0.5, 0.5);
  for (let r = 0; r < 7; r++) {
    const phase = (r / 7) * Math.PI * 2;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const a = phase + t * Math.PI * 3;
      const rad = 0.95 + 0.3 * Math.sin(t * 6 + phase);
      pts.push(okamiV3(Math.cos(a) * rad, 0.1 + t * 1.5 + 0.1 * Math.sin(t * 9 + phase), Math.sin(a) * rad * 0.8));
    }
    const c = new THREE.CatmullRomCurve3(pts);
    auraGroup.add(new THREE.Mesh(okamiTaperedTube(c, 90, 5, (t) => 0.009 * Math.sin(Math.PI * t) + 0.001), auraMat));
  }
  root.add(auraGroup);

  // hạt sáng lơ lửng
  const PN = 220;
  const pPos = new Float32Array(PN * 3);
  const pBase = new Float32Array(PN * 3);
  for (let i = 0; i < PN; i++) {
    const a = rand() * Math.PI * 2;
    const rr = Math.sqrt(rand());
    pBase[i * 3] = Math.cos(a) * rr * 1.5;
    pBase[i * 3 + 1] = rand() * 2.0;
    pBase[i * 3 + 2] = 0.2 + Math.sin(a) * rr * 1.6;
  }
  pPos.set(pBase);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  const particles = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({
      map: glowTex,
      color: 0x9ff4ff,
      size: 0.1,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
  );
  particles.frustumCulled = false;
  root.add(particles);

  // ══════════ HOẠT ẢNH IDLE / TICK ══════════
  root.userData.animate = (time: number) => {
    tailGroups.forEach((g, i) => {
      const ph = i * 0.65;
      g.rotation.z = g.userData.rz + Math.sin(time * 1.1 + ph) * 0.05;
      g.rotation.x = g.userData.rx + Math.sin(time * 0.8 + ph * 1.3) * 0.035;
    });
    flames.forEach((f, i) => {
      f.scale.y = 1 + Math.sin(time * 7 + i * 1.3) * 0.12;
      f.scale.x = f.scale.z = 1 + Math.sin(time * 9 + i) * 0.06;
    });
    shides.forEach((s, i) => {
      s.rotation.x = Math.sin(time * 1.6 + i) * 0.08;
    });
    (parts.ears as any[])?.forEach((e, i) => {
      e.rotation.x = e.userData.rx + Math.pow(Math.max(0, Math.sin(time * 0.7 + i * 2)), 10) * 0.2;
    });
    auraGroup.rotation.y = time * 0.25;
    auraGroup.position.y = 0.5 + Math.sin(time * 0.9) * 0.05;
    aura.intensity = 2.8 + Math.sin(time * 2) * 0.4;
    for (let i = 0; i < PN; i++) {
      pPos[i * 3 + 1] = (pBase[i * 3 + 1] + time * 0.15 * (0.5 + (i % 5) * 0.2)) % 2.2;
      pPos[i * 3] = pBase[i * 3] + Math.sin(time * 0.6 + i) * 0.04;
    }
    pGeo.attributes.position.needsUpdate = true;
  };

  root.userData.tick = (time: number) => {
    root.userData.animate?.(time);
  };

  return { group: root, id: beast.id, parts };
}

/**
 * Universal Articulated Animation Engine for Spirit Beasts
 * Animates running gallop, limb stride, turning bank, jump tuck, slide flatten,
 * collision stumble reaction, and victory/gate celebration flourishes!
 */
export function animateBeastMotion(
  bundle: BeastMeshBundle,
  time: number,
  state: {
    speed: number;
    currentX: number;
    targetX: number;
    playerY: number;
    isJumping: boolean;
    isSliding: boolean;
    landingSquash?: number; // 0..1 squash factor right after landing
    stumble?: number;       // 0..1 collision recoil / stumble factor
    cheer?: number;         // 0..1 correct gate celebration flourish
    isVictory?: boolean;    // Victory dance state
    isIdle?: boolean;
  }
) {
  const { parts } = bundle;
  const t = time * 0.001;

  // Secondary tick animation hook for models with procedural effects (wind, petals, flames, lanterns)
  if (typeof (bundle.group.userData as any)?.tick === "function") {
    (bundle.group.userData as any).tick(t);
  } else if (typeof (bundle.group.userData as any)?.animate === "function") {
    (bundle.group.userData as any).animate(t);
  }

  if (state.isIdle) {
    // Gentle floating idle breathing for Hub Showcase
    const breath = Math.sin(t * 2.5) * 0.03;
    if (bundle.id === "yatagarasu") {
      bundle.group.position.y = 0.2 + Math.sin(t * 2.5) * 0.05;
    } else {
      bundle.group.position.y = breath;
    }
    bundle.group.rotation.x = 0;
    bundle.group.rotation.z = 0;
    bundle.group.scale.set(1, 1, 1);

    if (parts.head) {
      parts.head.rotation.y = Math.sin(t * 1.2) * 0.15;
    }
    if (parts.tails) {
      parts.tails.forEach((tail, idx) => {
        tail.rotation.y = Math.sin(t * 3 + idx * 0.4) * 0.25;
      });
    }
    if (parts.wings) {
      parts.wings.forEach((wing, idx) => {
        wing.rotation.z = Math.sin(t * 2 + idx * Math.PI) * 0.18;
      });
    }
    if (parts.limbs) {
      parts.limbs.forEach((limb) => {
        limb.rotation.x = bundle.id === "yatagarasu" ? -0.35 : 0;
      });
    }
    if (parts.accents) {
      parts.accents.forEach((accent, idx) => {
        accent.position.y += Math.sin(t * 3 + idx) * 0.002;
      });
    }
    return;
  }

  // Victory Celebration Pose
  if (state.isVictory) {
    bundle.group.position.y = Math.abs(Math.sin(t * 7)) * 0.45;
    bundle.group.rotation.y = t * 4.5;
    bundle.group.rotation.x = -0.15;
    bundle.group.rotation.z = Math.sin(t * 7) * 0.12;
    bundle.group.scale.set(1.06, 1.06, 1.06);
    if (parts.tails) {
      parts.tails.forEach((tail, idx) => {
        tail.rotation.y = Math.sin(t * 14 + idx * 0.6) * 0.55;
      });
    }
    if (parts.wings) {
      parts.wings.forEach((wing, idx) => {
        wing.rotation.z = Math.sin(t * 14 + idx * Math.PI) * 0.6;
      });
    }
    return;
  }

  // Active Gameplay Animation:
  const isYatagarasu = bundle.id === "yatagarasu";
  const runFreq = state.speed * 0.85;
  const cheerBoost = state.cheer ? Math.sin(state.cheer * Math.PI) * 0.22 : 0;
  const turnTilt = (state.targetX - state.currentX) * -0.24;
  const stumbleShake = state.stumble && state.stumble > 0.01 ? Math.sin(t * 38) * 0.35 * state.stumble : 0;

  if (isYatagarasu) {
    // ==========================================
    // YATAGARASU (Thần Điểu Ba Chân Ánh Dương) — Hoạt ảnh bay lượn trên không
    // ==========================================
    const flightBob = Math.sin(t * 7.5) * 0.08 + cheerBoost;
    bundle.group.position.y = flightBob;

    // Nghiêng cánh lượn khi đổi làn
    const airTilt = (state.targetX - state.currentX) * -0.38;
    bundle.group.rotation.z = airTilt + stumbleShake;
    bundle.group.rotation.y = airTilt * 0.42;

    // Đôi cánh vỗ theo từng trạng thái bay (lượn, bay vút, bổ nhào luồn dưới)
    if (parts.wings) {
      if (state.isSliding) {
        // Bổ nhào luồn dưới: khép chặt cánh sát thân khí động học
        parts.wings.forEach((wing, idx) => {
          wing.rotation.z = idx === 0 ? 0.35 : -0.35;
          wing.rotation.y = idx === 0 ? -0.85 : 0.85;
          wing.rotation.x = 0.28;
        });
      } else if (state.isJumping) {
        // Bay vút lên cao: sải cánh vỗ mạnh mẽ xé gió
        const climbFlap = Math.sin(t * 15) * 0.72;
        parts.wings.forEach((wing, idx) => {
          wing.rotation.z = idx === 0 ? climbFlap : -climbFlap;
          wing.rotation.y = idx === 0 ? 0.08 : -0.08;
          wing.rotation.x = -0.15;
        });
      } else {
        // Bay tuần tra uy phong trên tầng mây
        const cruiseFlap = Math.sin(t * 8.5) * 0.52;
        parts.wings.forEach((wing, idx) => {
          wing.rotation.z = idx === 0 ? cruiseFlap : -cruiseFlap;
          wing.rotation.y = idx === 0 ? 0.12 : -0.12;
          wing.rotation.x = Math.sin(t * 8.5) * 0.1;
        });
      }
    }

    // Ba chân thần điểu thu gọn ra sau theo tư thế bay
    if (parts.limbs) {
      parts.limbs.forEach((limb) => {
        limb.rotation.x = -0.52;
      });
    }

    // Góc nghiêng thân chim
    if (state.stumble && state.stumble > 0.05) {
      bundle.group.rotation.x = 0.35 * state.stumble;
    } else if (state.isSliding) {
      bundle.group.rotation.x = 0.48;
      bundle.group.scale.set(0.92, 0.75, 1.25);
    } else if (state.isJumping) {
      bundle.group.rotation.x = -0.28;
      bundle.group.scale.set(1.05, 1.15, 1.05);
    } else {
      bundle.group.rotation.x = 0.1 + Math.sin(t * 4.2) * 0.04;
      bundle.group.scale.set(1, 1, 1);
    }

    if (parts.tails) {
      parts.tails.forEach((tail, idx) => {
        tail.rotation.y = Math.sin(t * 10 + idx * 0.5) * 0.28 + airTilt * 0.5;
        tail.rotation.x = Math.sin(t * 7 + idx * 0.3) * 0.12;
      });
    }

    if (parts.auraLight && state.cheer !== undefined) {
      parts.auraLight.intensity = 2.6 + state.cheer * 3.5;
    }
    return;
  }

  // ==========================================
  // LINH THÚ CHẠY BỘ DƯỚI ĐẤT (Kitsune, Neko Samurai, Tanuki, Okami)
  // ==========================================
  const strideBob =
    (!state.isJumping && !state.isSliding ? Math.abs(Math.sin(t * runFreq)) * 0.09 : 0) + cheerBoost;
  bundle.group.position.y = strideBob;

  // Lateral Banking into turns + Collision Stumble Shake
  bundle.group.rotation.z = turnTilt + stumbleShake;
  bundle.group.rotation.y =
    turnTilt * 0.42 +
    (state.stumble && state.stumble > 0.01 ? Math.cos(t * 30) * 0.24 * state.stumble : 0);

  // Head bobbing & looking forward
  if (parts.head) {
    parts.head.rotation.x = Math.sin(t * runFreq * 0.5) * 0.06 - (state.stumble ? state.stumble * 0.25 : 0);
  }

  // Articulated Limbs / Paws Galloping Cycle
  if (parts.limbs) {
    parts.limbs.forEach((limb, idx) => {
      if (state.isJumping) {
        // Tuck front legs forward, hind legs back during leap
        limb.rotation.x = idx < 2 ? -0.65 : 0.65;
      } else if (state.isSliding) {
        // Streamline limbs flat during slide
        limb.rotation.x = idx < 2 ? -0.85 : 0.85;
      } else {
        // Gallop phase: front pair (0,1) vs back pair (2,3) with slight diagonal offset
        const phase = idx === 0 ? 0 : idx === 1 ? 0.55 : idx === 2 ? Math.PI : Math.PI + 0.55;
        limb.rotation.x = Math.sin(t * runFreq * 1.15 + phase) * 0.58;
      }
    });
  }

  // Tails Swishing dynamically (faster when cheering!)
  if (parts.tails) {
    const tailSpeed = state.cheer && state.cheer > 0.05 ? 16 : 8.5;
    const tailAmp = state.cheer && state.cheer > 0.05 ? 0.52 : 0.36;
    parts.tails.forEach((tail, idx) => {
      tail.rotation.y = Math.sin(t * tailSpeed + idx * 0.5) * tailAmp + turnTilt * 0.5;
      tail.rotation.z = Math.cos(t * 6.5 + idx * 0.3) * 0.12;
    });
  }

  // Wing Flapping for Yatagarasu
  if (parts.wings) {
    parts.wings.forEach((wing, idx) => {
      const flap = Math.sin(t * runFreq * 1.25) * 0.42;
      wing.rotation.z = idx === 0 ? flap : -flap;
    });
  }

  // Ears twitching (droop back when stumbling)
  if (parts.ears) {
    parts.ears.forEach((ear, idx) => {
      const droop = state.stumble ? -0.45 * state.stumble : 0;
      ear.rotation.x = Math.sin(t * 10 + idx) * 0.08 + droop;
    });
  }

  // Aura pulse during cheer
  if (parts.auraLight && state.cheer !== undefined) {
    parts.auraLight.intensity = 2.6 + state.cheer * 3.5;
  }

  // Jumping / Sliding / Landing Squash / Stumble Poses
  if (state.stumble && state.stumble > 0.05) {
    const st = state.stumble;
    bundle.group.rotation.x = 0.32 * st; // Recoil pitch
    bundle.group.scale.set(1 - 0.1 * st, 1 - 0.12 * st, 1 + 0.12 * st);
  } else if (state.isJumping) {
    bundle.group.rotation.x = -0.28; // Dynamic leap arch
    bundle.group.scale.set(0.94, 1.12, 1.06);
  } else if (state.isSliding) {
    bundle.group.rotation.x = 0.36; // Streamlined dive
    bundle.group.scale.set(1.24, 0.42, 1.22);
  } else if (state.landingSquash && state.landingSquash > 0.01) {
    const sq = state.landingSquash;
    bundle.group.rotation.x = 0.08 * sq;
    bundle.group.scale.set(1 + 0.22 * sq, 1 - 0.28 * sq, 1 + 0.16 * sq);
  } else {
    bundle.group.rotation.x = Math.sin(t * runFreq) * 0.04 - (state.cheer ? state.cheer * 0.15 : 0);
    bundle.group.scale.set(1, 1, 1);
  }
}

export interface ChaserYokaiBundle {
  group: THREE.Group;
  eyes: THREE.Mesh[];
  wisps: THREE.Mesh[];
}

/**
 * Creates a stylized Spectral Oni / Shadow Yōkai chaser that pursues the player from behind,
 * adding atmospheric tension without obstructing the forward track view.
 */
export function createChaserYokai3DModel(): ChaserYokaiBundle {
  const group = new THREE.Group();
  const eyes: THREE.Mesh[] = [];
  const wisps: THREE.Mesh[] = [];

  // Spectral dark mist core
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x12081f,
    emissive: 0x311b92,
    emissiveIntensity: 0.5,
    roughness: 0.7,
    transparent: true,
    opacity: 0.75,
  });
  const maskMesh = new THREE.Mesh(new THREE.SphereGeometry(0.68, 12, 12), coreMat);
  maskMesh.scale.set(1.15, 0.95, 0.85);
  maskMesh.position.set(0, 1.15, 0);
  group.add(maskMesh);

  // Crimson Oni Horns
  const hornMat = new THREE.MeshStandardMaterial({
    color: 0xb71c1c,
    emissive: 0xff1744,
    emissiveIntensity: 0.65,
  });
  [-0.36, 0.36].forEach((hx) => {
    const hornGeo = new THREE.ConeGeometry(0.14, 0.58, 6);
    const horn = new THREE.Mesh(hornGeo, hornMat);
    horn.position.set(hx, 1.65, -0.1);
    horn.rotation.z = hx > 0 ? -0.35 : 0.35;
    horn.rotation.x = -0.25;
    group.add(horn);
  });

  // Glowing Menacing Eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });
  [-0.24, 0.24].forEach((ex) => {
    const eyeGeo = new THREE.SphereGeometry(0.09, 8, 8);
    eyeGeo.scale(1.3, 0.65, 0.6);
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(ex, 1.22, -0.56);
    eye.rotation.z = ex > 0 ? 0.25 : -0.25;
    group.add(eye);
    eyes.push(eye);
  });

  // Swirling Shadow Flame Wisps around the Oni
  const wispMat = new THREE.MeshBasicMaterial({
    color: 0xd500f9,
    transparent: true,
    opacity: 0.6,
  });
  for (let i = 0; i < 4; i++) {
    const wisp = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), wispMat);
    const angle = (i * Math.PI) / 2;
    wisp.position.set(Math.cos(angle) * 0.95, 1.0 + (i % 2) * 0.35, Math.sin(angle) * 0.45);
    group.add(wisp);
    wisps.push(wisp);
  }

  return { group, eyes, wisps };
}

export function animateChaserYokai(
  chaser: ChaserYokaiBundle,
  time: number,
  playerX: number,
  hearts: number,
  combo: number
) {
  const t = time * 0.001;
  // Chaser follows playerX with slight eerie lag
  chaser.group.position.x += (playerX - chaser.group.position.x) * 0.08;
  chaser.group.position.y = -0.45 + Math.sin(t * 4.2) * 0.12;

  // Target Z behind player: runs on the track behind player without blocking camera lens
  const targetZ =
    (hearts === 1 ? 3.4 : hearts === 2 ? 4.2 : 5.0) + Math.min(1.5, combo * 0.25);
  chaser.group.position.z += (targetZ - chaser.group.position.z) * 0.06;

  chaser.wisps.forEach((w, idx) => {
    const a = t * 3.5 + (idx * Math.PI) / 2;
    w.position.x = Math.cos(a) * 0.95;
    w.position.y = 1.05 + Math.sin(t * 5 + idx) * 0.25;
    w.rotation.y = a;
  });
}


