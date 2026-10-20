"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { SpiritBeast } from "@/lib/yokai-dash/types";
import { createBeast3DModel, animateBeastMotion, BeastMeshBundle } from "./models/YokaiBeast3D";
import { disposeThreeHierarchy } from "@/lib/yokai-dash/three-utils";

interface YokaiBeastShowcaseProps {
  beast: SpiritBeast;
  isUnlocked: boolean;
}

export function YokaiBeastShowcase({ beast, isUnlocked }: YokaiBeastShowcaseProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const bundleRef = useRef<BeastMeshBundle | null>(null);
  const isDraggingRef = useRef(false);
  const prevMouseXRef = useRef(0);
  const rotationYRef = useRef(Math.PI * 0.15); // Initial attractive 3/4 anime portrait angle

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 320;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 4.4);
    camera.lookAt(0, 0.9, 0);

    // Lights
    const ambientLight = new THREE.HemisphereLight(0xcfd8ff, 0x2a1030, 1.15);
    scene.add(ambientLight);

    // Ánh sáng ma thuật toả lên từ bệ thờ, tạo cảm giác linh thú đang được "triệu hồi"
    const summonLight = new THREE.PointLight(new THREE.Color(beast.glowColor), 6, 6, 1.6);
    summonLight.position.set(0, 0.25, 0);
    scene.add(summonLight);

    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    keyLight.position.set(4, 6, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(new THREE.Color(beast.glowColor), 2.5);
    rimLight.position.set(-4, 3, -3);
    scene.add(rimLight);

    // Sacred Shrine Stone Pedestal (Bệ thờ đá linh thiêng)
    const pedestalGroup = new THREE.Group();
    scene.add(pedestalGroup);

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x1f242d,
      roughness: 0.65,
      metalness: 0.15,
    });

    const baseGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.25, 24);
    const baseMesh = new THREE.Mesh(baseGeo, stoneMat);
    baseMesh.position.y = -0.125;
    baseMesh.receiveShadow = true;
    pedestalGroup.add(baseMesh);

    // Glowing Magatama / Runes Ring on Pedestal
    const runeRingGeo = new THREE.TorusGeometry(1.4, 0.04, 6, 32);
    runeRingGeo.rotateX(Math.PI / 2);
    const runeMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(beast.glowColor),
      transparent: true,
      opacity: 0.8,
    });
    const runeRing = new THREE.Mesh(runeRingGeo, runeMat);
    runeRing.position.y = 0.02;
    pedestalGroup.add(runeRing);

    const topTier = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.55, 0.1, 32), stoneMat);
    topTier.position.y = 0.03;
    pedestalGroup.add(topTier);

    const innerRingGeo = new THREE.TorusGeometry(0.95, 0.025, 6, 32);
    innerRingGeo.rotateX(Math.PI / 2);
    const innerRing = new THREE.Mesh(
      innerRingGeo,
      new THREE.MeshBasicMaterial({ color: new THREE.Color(beast.glowColor), transparent: true, opacity: 0.5 })
    );
    innerRing.position.y = 0.09;
    pedestalGroup.add(innerRing);

    // Floating Petals / Wisps around Beast
    const particleCount = 35;
    const partGeo = new THREE.BufferGeometry();
    const partPos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      partPos[i * 3 + 0] = (Math.random() - 0.5) * 3;
      partPos[i * 3 + 1] = Math.random() * 2.5;
      partPos[i * 3 + 2] = (Math.random() - 0.5) * 3;
    }
    partGeo.setAttribute("position", new THREE.BufferAttribute(partPos, 3));
    const partMat = new THREE.PointsMaterial({
      color: new THREE.Color(beast.glowColor),
      size: 0.08,
      transparent: true,
      opacity: 0.75,
    });
    const particles = new THREE.Points(partGeo, partMat);
    scene.add(particles);

    // Build Character Model
    const bundle = createBeast3DModel(beast);
    bundleRef.current = bundle;
    scene.add(bundle.group);

    if (!isUnlocked) {
      // Greyscale silhouette look for locked beasts
      bundle.group.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          if (m.material) {
            (m.material as THREE.MeshStandardMaterial).color?.setHex(0x374151);
          }
        }
      });
    }

    // Animation Loop
    let animId: number;
    let lastTime = performance.now();

    const renderLoop = (time: number) => {
      animId = requestAnimationFrame(renderLoop);
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      // Auto rotation when not dragging
      if (!isDraggingRef.current) {
        rotationYRef.current += dt * 0.45;
      }

      bundle.group.rotation.y = rotationYRef.current;
      pedestalGroup.rotation.y = rotationYRef.current * 0.3;

      // Idle breathing and tail animation
      animateBeastMotion(bundle, time, {
        speed: 0,
        currentX: 0,
        targetX: 0,
        playerY: 0,
        isJumping: false,
        isSliding: false,
        isIdle: true,
      });

      const pulse = 0.5 + 0.5 * Math.sin(time * 0.002);
      summonLight.intensity = 4.5 + pulse * 3;
      runeMat.opacity = 0.65 + pulse * 0.3;

      // Float particles upward
      const positions = partGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += dt * 0.35;
        if (positions[i * 3 + 1] > 2.8) {
          positions[i * 3 + 1] = 0;
          positions[i * 3 + 0] = (Math.random() - 0.5) * 2.5;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 2.5;
        }
      }
      partGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(renderLoop);

    // Drag to inspect controls
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMouseXRef.current = e.clientX;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - prevMouseXRef.current;
      rotationYRef.current += dx * 0.01;
      prevMouseXRef.current = e.clientX;
    };
    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        isDraggingRef.current = true;
        prevMouseXRef.current = e.touches[0].clientX;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length === 0) return;
      const dx = e.touches[0].clientX - prevMouseXRef.current;
      rotationYRef.current += dx * 0.012;
      prevMouseXRef.current = e.touches[0].clientX;
    };
    const onTouchEnd = () => {
      isDraggingRef.current = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    dom.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    // Resize
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      dom.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("resize", onResize);

      // Thorough GPU memory disposal
      disposeThreeHierarchy(scene);
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [beast, isUnlocked]);

  const accent = beast.color;
  return (
    <div
      className="relative w-full h-[220px] sm:h-[300px] md:h-[360px] select-none overflow-hidden rounded-[1.5rem] border-2 shadow-[0_0_44px_-8px_var(--yk-accent),inset_0_0_60px_rgba(0,0,0,0.55)]"
      style={
        {
          "--yk-accent": `${accent}88`,
          borderColor: `${accent}`,
          background:
            "radial-gradient(ellipse at 50% 38%, rgba(88,28,135,0.45), transparent 55%), radial-gradient(ellipse at 50% 100%, rgba(244,63,94,0.22), transparent 55%), linear-gradient(170deg,#0b0820,#1a1033 55%,#2a0f2b)",
        } as React.CSSProperties
      }
    >
      {/* Trăng + hoạ tiết đền xa làm nền cho sân khấu */}
      <div className="absolute top-5 left-6 w-16 h-16 rounded-full bg-amber-100/80 blur-[1px] shadow-[0_0_60px_14px_rgba(253,230,138,0.25)]" aria-hidden />
      <svg
        viewBox="0 0 400 120"
        className="absolute bottom-24 inset-x-0 w-full text-[#1b1238] opacity-90 pointer-events-none"
        preserveAspectRatio="none"
        fill="currentColor"
        aria-hidden
      >
        <path d="M0 120V80l40-20 30 25 50-45 40 40 40-30 50 38 50-48 40 36 60-30v94z" />
      </svg>

      <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* Nhãn hệ */}
      <div
        className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold backdrop-blur-md"
        style={{
          backgroundColor: `${accent}26`,
          color: "#fff",
          border: `1px solid ${accent}`,
          boxShadow: `0 0 16px -2px ${accent}`,
        }}
      >
        <span aria-hidden>{beast.avatarIcon}</span>
        HỆ {String(beast.element).toUpperCase()}
      </div>

      {!isUnlocked && (
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-extrabold bg-black/65 text-rose-200 border border-rose-400/50">
          🔒 Chưa mở khoá
        </div>
      )}

      {/* Gợi ý xoay 360° */}
      <div className="absolute bottom-2.5 sm:bottom-3 inset-x-0 mx-auto w-max pointer-events-none px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-black/65 backdrop-blur-xl border border-white/15 text-[10px] sm:text-[11px] text-slate-100 flex items-center gap-1.5 sm:gap-2 shadow-lg">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <rect x="6" y="2.5" width="12" height="19" rx="6" />
          <path d="M12 7v4" />
        </svg>
        Vuốt để xoay 360° linh thú
      </div>
    </div>
  );
}