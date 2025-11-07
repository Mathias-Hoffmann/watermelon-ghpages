import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

const App = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // === SCENE ===
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#ff0095ff");

    // === CAMERA ===
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 1.4, 6);

    // === RENDERER ===
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // === LIGHTS ===
    const hemi = new THREE.HemisphereLight(0xffffff, 0xcccccc, 1.0);
    scene.add(hemi);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 8, 6);
    scene.add(dirLight);

    // === FLOOR ===
    const floorGeo = new THREE.CircleGeometry(6, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: "#ff009dff",
      roughness: 1,
      metalness: 0
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.8;
    scene.add(floor);

    // === STRIPED TEXTURE (GREEN / DARK GREEN) ===
    const texSize = 512;
    const canvas = document.createElement("canvas");
    canvas.width = texSize;
    canvas.height = texSize;
    const ctx = canvas.getContext("2d");

    const stripeCount = 14;
    for (let i = 0; i < stripeCount; i++) {
      ctx.fillStyle = i % 2 === 0 ? "#0b8a25" : "#033d0b";
      const y1 = (i * texSize) / stripeCount;
      const y2 = ((i + 1) * texSize) / stripeCount;
      ctx.fillRect(0, y1, texSize, y2 - y1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);

    const stripedMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.6,
      metalness: 0.2
    });

    // === WATERMELON GROUP ===
    const watermelonGroup = new THREE.Group();
    scene.add(watermelonGroup);

    // === LOAD OBJ ===
    const objUrl = import.meta.env.BASE_URL + "watermelon.obj";
    console.log("[Watermelon] Loading from", objUrl);

    const loader = new OBJLoader();
    loader.load(
      objUrl,
      (obj) => {
        console.log("[Watermelon] OBJ loaded ✔");

        obj.traverse((child) => {
          if (child.isMesh) {
            child.material = stripedMat;
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Normalisation
        const box = new THREE.Box3().setFromObject(obj);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scale = 3 / maxDim;
        obj.scale.setScalar(scale);

        // Centrage & position
        box.setFromObject(obj);
        const center = new THREE.Vector3();
        box.getCenter(center);
        obj.position.sub(center);
        obj.position.y = -0.5;

        watermelonGroup.add(obj);
      },
      undefined,
      (err) => console.error("[Watermelon] Load error:", err)
    );

    // === DRAG / TOUCH ===
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    const getXY = (e) =>
      e.touches
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
        : { x: e.clientX, y: e.clientY };

    const onPointerDown = (e) => {
      isDragging = true;
      const { x, y } = getXY(e);
      lastX = x;
      lastY = y;
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const { x, y } = getXY(e);
      const dx = x - lastX;
      const dy = y - lastY;

      watermelonGroup.rotation.y += dx * 0.01;
      watermelonGroup.rotation.x += dy * 0.005;

      watermelonGroup.rotation.x = Math.max(
        -Math.PI / 3,
        Math.min(Math.PI / 3, watermelonGroup.rotation.x)
      );

      lastX = x;
      lastY = y;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    renderer.domElement.addEventListener("mousedown", onPointerDown);
    renderer.domElement.addEventListener("mousemove", onPointerMove);
    renderer.domElement.addEventListener("mouseup", onPointerUp);
    renderer.domElement.addEventListener("mouseleave", onPointerUp);
    renderer.domElement.addEventListener("touchstart", onPointerDown, { passive: true });
    renderer.domElement.addEventListener("touchmove", onPointerMove, { passive: true });
    renderer.domElement.addEventListener("touchend", onPointerUp);
    renderer.domElement.addEventListener("touchcancel", onPointerUp);

    // === RESIZE ===
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // === ANIMATE ===
    const animate = () => {
      if (!isDragging) {
        watermelonGroup.rotation.y += 0.005;
      }
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    // === CLEANUP ===
    return () => {
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("mousedown", onPointerDown);
      renderer.domElement.removeEventListener("mousemove", onPointerMove);
      renderer.domElement.removeEventListener("mouseup", onPointerUp);
      renderer.domElement.removeEventListener("mouseleave", onPointerUp);
      renderer.domElement.removeEventListener("touchstart", onPointerDown);
      renderer.domElement.removeEventListener("touchmove", onPointerMove);
      renderer.domElement.removeEventListener("touchend", onPointerUp);
      renderer.domElement.removeEventListener("touchcancel", onPointerUp);
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        touchAction: "none",
        position: "relative",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
      }}
    >
      {/* Texte RDV */}
      <div
        style={{
          position: "absolute",
          bottom: "72px",
          left: "50%",
          transform: "translateX(-50%)",
          padding: "12px 18px",
          borderRadius: "999px",
          background: "rgba(0,0,0,0.78)",
          color: "#fff",
          fontSize: "14px",
          textAlign: "center",
          lineHeight: 1.4,
          backdropFilter: "blur(6px)",
          whiteSpace: "nowrap"
        }}
      >
        Bonjour Madame Louise
        RDV <br />
        09/11<br />
        20h10<br />
        Lat 47.21363449 · Lon -1.56244636
      </div>

      {/* BONUS lien cliquable */}
      <a
        href="https://goldengloberace.com/fr/wp-content/uploads/2022/08/Kit_de_noeuds_marins.pdf"
        target="_blank"
        rel="noreferrer"
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          padding: "8px 16px",
          borderRadius: "999px",
          background: "#0b8a25",
          color: "#fff",
          fontSize: "12px",
          textDecoration: "none",
          boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px"
        }}
      >
        <span>🎁 BONUS : Kit de nœuds marins</span>
        <span style={{ fontSize: "14px" }}>↗</span>
      </a>
    </div>
  );
};

export default App;
