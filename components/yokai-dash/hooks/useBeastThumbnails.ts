"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { SpiritBeast } from "@/lib/yokai-dash/types";
import { createBeast3DModel, animateBeastMotion } from "../models/YokaiBeast3D";
import { disposeThreeHierarchy } from "@/lib/yokai-dash/three-utils";

/**
 * Render ảnh 3D tĩnh (dataURL) cho từng linh thú đứng trên bệ đá phát sáng.
 * Chỉ dùng MỘT WebGL context, render lần lượt rồi giải phóng ngay,
 * nên danh sách thẻ linh thú không tạo nhiều canvas 3D như trước.
 */
export function useBeastThumbnails(beasts: SpiritBeast[], size = 420) {
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    } catch {
      return; // WebGL không khả dụng: UI dùng emoji dự phòng
    }
    renderer.setPixelRatio(1);
    renderer.setSize(size, size);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    const out: Record<string, string> = {};

    const renderOne = (beast: SpiritBeast) => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
      camera.position.set(0, 1.9, 5.2);
      camera.lookAt(0, 0.85, 0);

      scene.add(new THREE.HemisphereLight(0xcfd8ff, 0x2a1030, 1.15));
      const key = new THREE.DirectionalLight(0xfff4e0, 2.4);
      key.position.set(3.5, 6, 5);
      scene.add(key);
      const rim = new THREE.DirectionalLight(new THREE.Color(beast.glowColor), 3.2);
      rim.position.set(-4, 3, -3);
      scene.add(rim);

      // Bệ đá + vòng rune phát sáng
      const stone = new THREE.MeshStandardMaterial({ color: 0x232a35, roughness: 0.6, metalness: 0.2 });
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.95, 0.32, 40), stone);
      base.position.y = -0.16;
      scene.add(base);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.6, 0.1, 40), stone);
      top.position.y = 0.02;
      scene.add(top);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.32, 0.045, 8, 64),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(beast.glowColor) })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.08;
      scene.add(ring);
      const ring2 = new THREE.Mesh(
        new THREE.TorusGeometry(1.0, 0.02, 8, 64),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(beast.glowColor), transparent: true, opacity: 0.55 })
      );
      ring2.rotation.x = Math.PI / 2;
      ring2.position.y = 0.08;
      scene.add(ring2);

      const bundle = createBeast3DModel(beast);
      bundle.group.rotation.y = Math.PI * 0.18;
      bundle.group.position.y = 0.07;
      scene.add(bundle.group);
      animateBeastMotion(bundle, 600, {
        speed: 0,
        currentX: 0,
        targetX: 0,
        playerY: 0,
        isJumping: false,
        isSliding: false,
        isIdle: true,
      });

      renderer!.render(scene, camera);
      const url = renderer!.domElement.toDataURL("image/png");
      disposeThreeHierarchy(scene);
      return url;
    };

    // Render lần lượt từng frame để không khoá luồng chính
    let i = 0;
    const step = () => {
      if (cancelled || !renderer) return;
      if (i >= beasts.length) {
        renderer.dispose();
        renderer = null;
        return;
      }
      try {
        out[beasts[i].id] = renderOne(beasts[i]);
        setThumbs({ ...out });
      } catch {
        /* bỏ qua, dùng emoji dự phòng */
      }
      i++;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);

    return () => {
      cancelled = true;
      renderer?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beasts.map((b) => b.id).join("|"), size]);

  return thumbs;
}