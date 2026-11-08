"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export function Geofence3DViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Dimensions
    const width = container.clientWidth || 140;
    const height = container.clientHeight || 140;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.4, 4.2);
    camera.lookAt(0, 0.25, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xd1fae5, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(3, 5, 4);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x10b981, 2.5, 6);
    pointLight.position.set(0, 0.8, 0);
    scene.add(pointLight);

    // Master Pivot Group
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // ==========================================
    // 3. Realistic 3D Low-Poly Urban Tree
    // ==========================================
    const treeGroup = new THREE.Group();

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.09, 0.16, 0.9, 8);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x4a3728,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: true,
    });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = -0.25;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Branches
    const branchGeo1 = new THREE.CylinderGeometry(0.04, 0.07, 0.4, 6);
    const branch1 = new THREE.Mesh(branchGeo1, trunkMat);
    branch1.position.set(0.12, -0.05, 0.08);
    branch1.rotation.set(-0.3, 0.2, -0.6);
    treeGroup.add(branch1);

    const branch2 = new THREE.Mesh(branchGeo1, trunkMat);
    branch2.position.set(-0.11, 0.05, -0.06);
    branch2.rotation.set(0.4, -0.2, 0.65);
    treeGroup.add(branch2);

    // Foliage Clusters - Beautiful faceted polygonal canopy
    const foliageMatPrimary = new THREE.MeshStandardMaterial({
      color: 0x059669,
      roughness: 0.35,
      metalness: 0.15,
      flatShading: true,
    });

    const foliageMatSecondary = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.3,
      metalness: 0.2,
      flatShading: true,
    });

    const foliageMatDark = new THREE.MeshStandardMaterial({
      color: 0x047857,
      roughness: 0.45,
      metalness: 0.1,
      flatShading: true,
    });

    const foliageMatHighlight = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      roughness: 0.25,
      metalness: 0.25,
      flatShading: true,
    });

    // Central Main Crown
    const crown1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 1), foliageMatPrimary);
    crown1.position.set(0, 0.5, 0);
    crown1.castShadow = true;
    treeGroup.add(crown1);

    // Upper Top Peak
    const crown2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.38, 0), foliageMatHighlight);
    crown2.position.set(0.05, 0.9, 0.02);
    crown2.castShadow = true;
    treeGroup.add(crown2);

    // Left/Back Cluster
    const crown3 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), foliageMatDark);
    crown3.position.set(-0.28, 0.38, -0.18);
    crown3.castShadow = true;
    treeGroup.add(crown3);

    // Right/Front Cluster
    const crown4 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.44, 0), foliageMatSecondary);
    crown4.position.set(0.26, 0.32, 0.16);
    crown4.castShadow = true;
    treeGroup.add(crown4);

    masterGroup.add(treeGroup);

    // ==========================================
    // 4. Holographic 3D Geofence RLS Boundary Dome
    // ==========================================
    const geofenceGroup = new THREE.Group();

    // 8-Sided Spatial Ward Polygon Prism
    const geofenceGeo = new THREE.CylinderGeometry(1.25, 1.4, 2.0, 8, 4, true);
    const geofenceWireMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    });
    const geofenceMesh = new THREE.Mesh(geofenceGeo, geofenceWireMat);
    geofenceMesh.position.y = 0.25;
    geofenceGroup.add(geofenceMesh);

    // Translucent Inner Shield Shell
    const geofenceSolidMat = new THREE.MeshBasicMaterial({
      color: 0x059669,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
    });
    const geofenceSolid = new THREE.Mesh(geofenceGeo, geofenceSolidMat);
    geofenceSolid.position.y = 0.25;
    geofenceGroup.add(geofenceSolid);

    // Dynamic 3D Laser Scanning Ring
    const scanRingGeo = new THREE.TorusGeometry(1.32, 0.022, 8, 32);
    const scanRingMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.85,
    });
    const scanRing = new THREE.Mesh(scanRingGeo, scanRingMat);
    scanRing.rotation.x = Math.PI / 2;
    scanRing.position.y = 0.2;
    geofenceGroup.add(scanRing);

    masterGroup.add(geofenceGroup);

    // ==========================================
    // 5. PostGIS Ground Spatial Reticle Grid
    // ==========================================
    const groundGroup = new THREE.Group();
    groundGroup.position.y = -0.7;

    // Concentric Reticle Rings
    const ringMat1 = new THREE.LineBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.35 });
    const ringMat2 = new THREE.LineBasicMaterial({ color: 0x059669, transparent: true, opacity: 0.2 });

    const createRing = (radius: number, mat: THREE.Material) => {
      const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, 2 * Math.PI, false, 0);
      const points = curve.getPoints(48);
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, mat);
      line.rotation.x = Math.PI / 2;
      return line;
    };

    groundGroup.add(createRing(0.6, ringMat1));
    groundGroup.add(createRing(1.05, ringMat2));
    groundGroup.add(createRing(1.4, ringMat1));

    // Reticle Crosshairs
    const crossPoints = [
      new THREE.Vector3(-1.45, 0, 0),
      new THREE.Vector3(1.45, 0, 0),
      new THREE.Vector3(0, 0, -1.45),
      new THREE.Vector3(0, 0, 1.45),
    ];
    const crossGeo = new THREE.BufferGeometry().setFromPoints(crossPoints);
    const crossLine = new THREE.LineSegments(crossGeo, ringMat2);
    groundGroup.add(crossLine);

    masterGroup.add(groundGroup);

    // ==========================================
    // 6. Orbiting Inspector Fleet Probes
    // ==========================================
    const probesGroup = new THREE.Group();

    interface ProbeData {
      mesh: THREE.Mesh;
      radius: number;
      speed: number;
      phase: number;
      inclination: number;
    }

    const probes: ProbeData[] = [
      {
        mesh: new THREE.Mesh(
          new THREE.SphereGeometry(0.055, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0x10b981 })
        ),
        radius: 1.55,
        speed: 1.2,
        phase: 0,
        inclination: 0.2,
      },
      {
        mesh: new THREE.Mesh(
          new THREE.SphereGeometry(0.045, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0x34d399 })
        ),
        radius: 1.75,
        speed: 0.85,
        phase: 2.1,
        inclination: -0.35,
      },
      {
        mesh: new THREE.Mesh(
          new THREE.SphereGeometry(0.048, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0x6ee7b7 })
        ),
        radius: 1.35,
        speed: 1.4,
        phase: 4.2,
        inclination: 0.45,
      },
    ];

    probes.forEach((p) => {
      probesGroup.add(p.mesh);
    });
    masterGroup.add(probesGroup);

    // ==========================================
    // 7. Mouse Tilt Interaction & Animation Loop
    // ==========================================
    let mouseX = 0;
    let mouseY = 0;
    let targetRotY = 0;
    let targetRotX = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotY = mouseX * 0.45;
      targetRotX = -mouseY * 0.35;
    };

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => {
      setIsHovered(false);
      targetRotY = 0;
      targetRotX = 0;
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("mouseleave", handleMouseLeave);

    // Animation Frame Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Continuous gentle rotation + interactive mouse damping
      masterGroup.rotation.y += 0.007;
      masterGroup.rotation.y += (targetRotY - masterGroup.rotation.y * 0.1) * 0.05;
      masterGroup.rotation.x += (targetRotX - masterGroup.rotation.x) * 0.05;

      // Vertical laser scan ring sweep (smooth sine oscillation)
      scanRing.position.y = 0.2 + Math.sin(elapsedTime * 2.2) * 0.75;

      // Soft breathing scale on foliage clusters
      const breathe = 1 + Math.sin(elapsedTime * 1.8) * 0.015;
      treeGroup.scale.set(breathe, breathe, breathe);

      // Orbit inspector probes
      probes.forEach((p) => {
        const angle = elapsedTime * p.speed + p.phase;
        const x = Math.cos(angle) * p.radius;
        const z = Math.sin(angle) * p.radius;
        const y = Math.sin(angle * 1.5) * p.inclination * p.radius;
        p.mesh.position.set(x, y + 0.2, z);
      });

      // Ground reticle counter-rotation
      groundGroup.rotation.y = -elapsedTime * 0.15;

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 140;
      const h = container.clientHeight || 140;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseenter", handleMouseEnter);
      container.removeEventListener("mouseleave", handleMouseLeave);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      // Dispose resources
      renderer.dispose();
      trunkGeo.dispose();
      trunkMat.dispose();
      branchGeo1.dispose();
      foliageMatPrimary.dispose();
      foliageMatSecondary.dispose();
      foliageMatDark.dispose();
      foliageMatHighlight.dispose();
      geofenceGeo.dispose();
      geofenceWireMat.dispose();
      geofenceSolidMat.dispose();
      scanRingGeo.dispose();
      scanRingMat.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-32 h-32 sm:w-36 sm:h-36 relative flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
      title="Interactive 3D Urban Tree with Holographic RLS Geofence"
    >
      {/* Subtle Ambient Radial Glow Behind 3D Object */}
      <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl pointer-events-none -z-10" />
    </div>
  );
}

