import * as THREE from "three";

/**
 * Recursively disposes all geometries, materials, and textures
 * in a Three.js Object3D / Scene hierarchy to prevent GPU memory leaks.
 */
export function disposeThreeHierarchy(root: THREE.Object3D) {
  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh || (obj as THREE.Points).isPoints) {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => disposeSingleMaterial(m));
        } else {
          disposeSingleMaterial(mesh.material);
        }
      }
    }
  });

  while (root.children.length > 0) {
    root.remove(root.children[0]);
  }
}

/**
 * Disposes a material and all attached texture maps safely across material types.
 */
export function disposeSingleMaterial(mat: THREE.Material) {
  const m = mat as unknown as Record<string, unknown>;
  const textureKeys = [
    "map",
    "lightMap",
    "bumpMap",
    "normalMap",
    "specularMap",
    "envMap",
    "alphaMap",
    "roughnessMap",
    "metalnessMap",
    "emissiveMap",
    "aoMap",
    "displacementMap",
  ];

  for (const key of textureKeys) {
    const val = m[key];
    if (val && typeof (val as { dispose?: unknown }).dispose === "function") {
      (val as { dispose: () => void }).dispose();
    }
  }

  mat.dispose();
}

