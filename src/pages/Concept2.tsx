import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import ProtoNav from '../components/ProtoNav';
import './Concept2.css';

type LayerDef = {
  id: string;
  name: string;
  sub: string;
  color: number;
  fog: number;
};

const LAYERS: LayerDef[] = [
  { id: 'sky',     name: 'the surface',  sub: 'cloud cover. soft beginnings, the public face of the work.', color: 0xb9d6e8, fog: 0xb9d6e8 },
  { id: 'ink',     name: 'the ink',      sub: 'still water. ideas in solution before they take shape.',     color: 0x0d1018, fog: 0x07090f },
  { id: 'plan',    name: 'the blueprint', sub: 'wireframe scaffolding. the bones under every surface.',      color: 0x0a1322, fog: 0x070d18 },
  { id: 'circuit', name: 'the bedrock',   sub: 'silicon and current. where signals become things.',          color: 0x06090d, fog: 0x03050a },
  { id: 'room',    name: 'the room',      sub: 'the workshop at the bottom. where it actually gets made.',   color: 0x0a0a0c, fog: 0x080809 },
];

type Project = {
  id: string;
  layer: number;
  pos: [number, number, number];
  title: string;
  blurb: string;
  tags: string[];
};

const PROJECTS: Project[] = [
  { id: 'cumulus',   layer: 0, pos: [ 5, -14,  -4], title: 'Field Notes',   blurb: 'A weekly publication of essays and sketches. Soft, slow, no algorithm. Sent on Sundays.',                   tags: ['writing','newsletter'] },
  { id: 'horizon',   layer: 0, pos: [-6, -22,   3], title: 'Horizon Series', blurb: 'A photography set shot at dawn, looking for the same light in different cities.',                          tags: ['photography','series'] },
  { id: 'currents',  layer: 1, pos: [ 4, -50,  -3], title: 'Currents',      blurb: 'Generative ink studies. A small Rust program produces a fresh print every morning. I sign and send some.', tags: ['generative','rust','print'] },
  { id: 'tideline',  layer: 1, pos: [-5, -62,   4], title: 'Tideline',      blurb: 'Audio diary. One sound per day, mixed into a slow-evolving track. Currently on day 412.',                  tags: ['audio','daily'] },
  { id: 'truss',     layer: 2, pos: [ 6, -86,  -2], title: 'Truss',         blurb: 'A small wireframe modeling tool I built for sketching architecture in the browser. Open source.',          tags: ['webgl','tooling','open-source'] },
  { id: 'lattice',   layer: 2, pos: [-4, -98,   3], title: 'Lattice',       blurb: 'A typesetting engine for technical drawings. Lays out blueprints from a tiny declarative DSL.',            tags: ['typesetting','dsl'] },
  { id: 'pulse',     layer: 3, pos: [ 5,-122,  -3], title: 'Pulse',         blurb: 'Hand-soldered MIDI controller. Sixteen pads, eight knobs, one screen. Plays nicely with everything.',     tags: ['hardware','midi'] },
  { id: 'bedrock',   layer: 3, pos: [-5,-134,   4], title: 'Bedrock',       blurb: 'A small embedded OS for a fleet of weather stations I keep at family farms.',                              tags: ['firmware','iot'] },
  { id: 'atelier',   layer: 4, pos: [ 0,-160,  -1], title: 'The Workshop',  blurb: 'The room everything is made in. If you want to talk shop, this is where to find me.',                       tags: ['contact'] },
];

const LAYER_HEIGHT = 36;
const TOTAL_DEPTH = LAYERS.length * LAYER_HEIGHT;

export default function Concept2() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null);
  const [open, setOpen] = useState<Project | null>(null);
  const [activeLayer, setActiveLayer] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const w = () => wrap.clientWidth;
    const h = () => wrap.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w(), h());
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(LAYERS[0].color, 1);
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(LAYERS[0].fog, 18, 80);
    scene.background = new THREE.Color(LAYERS[0].color);

    const camera = new THREE.PerspectiveCamera(55, w() / h(), 0.1, 400);
    camera.position.set(0, 4, 10);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(8, 12, 6);
    scene.add(sun);

    // a soft moving point light that follows the camera so it feels alive
    const camLight = new THREE.PointLight(0xffffff, 0.6, 40, 1.5);
    scene.add(camLight);

    // ============================================================
    // CAMERA PATH — gently weaving curve from top to bottom
    // ============================================================
    const pathPoints: THREE.Vector3[] = [];
    const yTop = 4;
    const yBottom = -TOTAL_DEPTH - 8;
    const N = 24;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const y = yTop + (yBottom - yTop) * t;
      // gentle s-curve drift in xz
      const x = Math.sin(t * Math.PI * 2.2) * 4;
      const z = 8 + Math.cos(t * Math.PI * 1.6) * 3;
      pathPoints.push(new THREE.Vector3(x, y, z));
    }
    const path = new THREE.CatmullRomCurve3(pathPoints, false, 'catmullrom', 0.4);

    // visual rope — a thin tube along the camera path
    const ropeGeo = new THREE.TubeGeometry(path, 200, 0.03, 6, false);
    const ropeMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.25,
    });
    const rope = new THREE.Mesh(ropeGeo, ropeMat);
    scene.add(rope);

    // ============================================================
    // LAYER 0 — SKY: cloud puffs (clusters of spheres)
    // ============================================================
    const cloudGroup = new THREE.Group();
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 1, transparent: true, opacity: 0.92,
    });
    for (let i = 0; i < 22; i++) {
      const cluster = new THREE.Group();
      const center = new THREE.Vector3(
        (Math.random() - 0.5) * 50,
        -Math.random() * LAYER_HEIGHT,
        (Math.random() - 0.5) * 30,
      );
      const puffs = 4 + Math.floor(Math.random() * 4);
      for (let j = 0; j < puffs; j++) {
        const r = 1.4 + Math.random() * 1.6;
        const s = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), cloudMat);
        s.position.set(
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 1.2,
          (Math.random() - 0.5) * 3,
        );
        cluster.add(s);
      }
      cluster.position.copy(center);
      cluster.userData.drift = (Math.random() - 0.5) * 0.02;
      cloudGroup.add(cluster);
    }
    scene.add(cloudGroup);

    // a faint sun in the sky layer (decorative)
    const sunDisc = new THREE.Mesh(
      new THREE.CircleGeometry(2.2, 32),
      new THREE.MeshBasicMaterial({ color: 0xfff1d6, transparent: true, opacity: 0.9 })
    );
    sunDisc.position.set(-10, -8, -16);
    cloudGroup.add(sunDisc);

    // ============================================================
    // LAYER 1 — INK OCEAN: wavy plane + rising bubbles
    // ============================================================
    const inkGroup = new THREE.Group();
    inkGroup.position.y = -LAYER_HEIGHT;

    const inkSurface = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80, 60, 60),
      new THREE.MeshStandardMaterial({
        color: 0x1a1f2c,
        roughness: 0.4,
        metalness: 0.3,
        side: THREE.DoubleSide,
      })
    );
    inkSurface.rotation.x = -Math.PI / 2;
    inkSurface.position.y = 0;
    inkGroup.add(inkSurface);

    // a darker ceiling so the camera passes between two surfaces
    const inkCeiling = inkSurface.clone();
    inkCeiling.position.y = -LAYER_HEIGHT;
    (inkCeiling.material as THREE.MeshStandardMaterial) = new THREE.MeshStandardMaterial({
      color: 0x080a10, roughness: 0.9, side: THREE.DoubleSide,
    });
    inkGroup.add(inkCeiling);

    // bubbles
    const bubbleMat = new THREE.MeshBasicMaterial({
      color: 0x6ab3d8, transparent: true, opacity: 0.55,
    });
    const bubbles: THREE.Mesh[] = [];
    for (let i = 0; i < 60; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.1 + Math.random() * 0.18, 8, 6), bubbleMat);
      b.position.set(
        (Math.random() - 0.5) * 50,
        -Math.random() * LAYER_HEIGHT,
        (Math.random() - 0.5) * 30,
      );
      b.userData.speed = 0.02 + Math.random() * 0.03;
      bubbles.push(b);
      inkGroup.add(b);
    }
    scene.add(inkGroup);

    // ============================================================
    // LAYER 2 — BLUEPRINT CAVERN: wireframe geometry hovering
    // ============================================================
    const planGroup = new THREE.Group();
    planGroup.position.y = -LAYER_HEIGHT * 2;

    const wireMat = new THREE.LineBasicMaterial({
      color: 0x6ab3ff, transparent: true, opacity: 0.7,
    });
    const wireMatDim = new THREE.LineBasicMaterial({
      color: 0x3a6f99, transparent: true, opacity: 0.4,
    });

    function addWire(geom: THREE.BufferGeometry, x: number, y: number, z: number, scale: number, dim?: boolean) {
      const lines = new THREE.LineSegments(new THREE.EdgesGeometry(geom), dim ? wireMatDim : wireMat);
      lines.position.set(x, y, z);
      lines.scale.setScalar(scale);
      lines.userData.spinX = (Math.random() - 0.5) * 0.003;
      lines.userData.spinY = (Math.random() - 0.5) * 0.005;
      planGroup.add(lines);
      geom.dispose();
    }

    addWire(new THREE.IcosahedronGeometry(1, 0), -7, -8, -4, 2.5);
    addWire(new THREE.OctahedronGeometry(1, 0), 6, -14, 2, 2.2);
    addWire(new THREE.BoxGeometry(2, 2, 2), 0, -22, -6, 1.6);
    addWire(new THREE.TorusGeometry(1, 0.32, 8, 16), -5, -28, 3, 1.8, true);
    addWire(new THREE.DodecahedronGeometry(1, 0), 4, -32, -3, 1.4);
    addWire(new THREE.ConeGeometry(1, 2, 6), -3, -10, 5, 1.5, true);
    addWire(new THREE.CylinderGeometry(1, 1, 2, 6), 5, -26, 5, 1.2, true);

    // grid floor (tech blueprint feel)
    const gridGeo = new THREE.BufferGeometry();
    const gridPts: number[] = [];
    for (let i = -20; i <= 20; i += 2) {
      gridPts.push(i, 0, -20, i, 0, 20);
      gridPts.push(-20, 0, i, 20, 0, i);
    }
    gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gridPts, 3));
    const grid = new THREE.LineSegments(
      gridGeo,
      new THREE.LineBasicMaterial({ color: 0x2a4f78, transparent: true, opacity: 0.4 })
    );
    grid.position.y = -LAYER_HEIGHT;
    planGroup.add(grid);
    scene.add(planGroup);

    // ============================================================
    // LAYER 3 — CIRCUIT BEDROCK: dark plane with glowing nodes/lines
    // ============================================================
    const circuitGroup = new THREE.Group();
    circuitGroup.position.y = -LAYER_HEIGHT * 3;

    const traceMat = new THREE.LineBasicMaterial({
      color: 0x6aff8a, transparent: true, opacity: 0.55,
    });
    const traceGeo = new THREE.BufferGeometry();
    const tracePts: number[] = [];
    const rng = (n: number) => Math.floor((Math.sin(n * 9.18) * 4321) % 1 * 8) - 4;
    for (let i = 0; i < 80; i++) {
      const sx = (Math.random() - 0.5) * 40;
      const sz = (Math.random() - 0.5) * 30;
      const sy = -Math.random() * LAYER_HEIGHT;
      const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
      let cx = sx, cz = sz;
      for (let s = 0; s < 4; s++) {
        const d = dirs[Math.floor(Math.random() * dirs.length)];
        const len = 1 + Math.random() * 4;
        const nx = cx + d[0] * len;
        const nz = cz + d[1] * len;
        tracePts.push(cx, sy, cz, nx, sy, nz);
        cx = nx; cz = nz;
      }
    }
    traceGeo.setAttribute('position', new THREE.Float32BufferAttribute(tracePts, 3));
    circuitGroup.add(new THREE.LineSegments(traceGeo, traceMat));

    // nodes — glowing dots scattered
    const nodes: THREE.Mesh[] = [];
    const nodeColors = [0xff6a6a, 0x6aff8a, 0xffe26a, 0x6ab3ff];
    for (let i = 0; i < 50; i++) {
      const c = nodeColors[i % nodeColors.length];
      const node = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 8, 6),
        new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.85 })
      );
      node.position.set(
        (Math.random() - 0.5) * 40,
        -Math.random() * LAYER_HEIGHT,
        (Math.random() - 0.5) * 30,
      );
      node.userData.phase = Math.random() * Math.PI * 2;
      nodes.push(node);
      circuitGroup.add(node);
    }

    // floor circuit plane
    const circuitFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshStandardMaterial({ color: 0x05080d, roughness: 0.9 })
    );
    circuitFloor.rotation.x = -Math.PI / 2;
    circuitFloor.position.y = -LAYER_HEIGHT - 0.1;
    circuitGroup.add(circuitFloor);

    scene.add(circuitGroup);

    // ============================================================
    // LAYER 4 — WORKSHOP: a tiny isometric room at the bottom
    // ============================================================
    const roomGroup = new THREE.Group();
    roomGroup.position.y = -LAYER_HEIGHT * 4 - 8;

    const roomFloor = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.2, 14),
      new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 0.9 })
    );
    roomFloor.position.y = 0;
    roomGroup.add(roomFloor);

    const wallM = new THREE.MeshStandardMaterial({ color: 0x2a201a, roughness: 0.9 });
    const wallBack = new THREE.Mesh(new THREE.BoxGeometry(20, 8, 0.2), wallM);
    wallBack.position.set(0, 4, -7);
    roomGroup.add(wallBack);
    const wallSide = new THREE.Mesh(new THREE.BoxGeometry(0.2, 8, 14), wallM);
    wallSide.position.set(-10, 4, 0);
    roomGroup.add(wallSide);
    const wallSide2 = wallSide.clone();
    wallSide2.position.x = 10;
    roomGroup.add(wallSide2);

    // a glowing window / monitor that signals "workshop"
    const winMat = new THREE.MeshStandardMaterial({
      color: 0xfff1b0, emissive: 0xfff1b0, emissiveIntensity: 0.9,
    });
    const win = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.4), winMat);
    win.position.set(-4, 5, -6.85);
    roomGroup.add(win);
    const winLight = new THREE.PointLight(0xffe4a0, 1.4, 14, 1.6);
    winLight.position.set(-4, 4.5, -3);
    roomGroup.add(winLight);

    // mini easel
    const eMat = new THREE.MeshStandardMaterial({ color: 0x4b3320 });
    const easelLeg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.5, 0.1), eMat);
    easelLeg.position.set(2, 2.25, 0);
    roomGroup.add(easelLeg);
    const easelLeg2 = easelLeg.clone();
    easelLeg2.position.x = 2.6;
    roomGroup.add(easelLeg2);
    const eCanv = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.6, 0.06),
      new THREE.MeshStandardMaterial({ color: 0xe8d8b8 })
    );
    eCanv.position.set(2.3, 3, 0.05);
    roomGroup.add(eCanv);

    // mini table + monitor
    const tT = new THREE.Mesh(
      new THREE.BoxGeometry(5, 0.12, 2),
      new THREE.MeshStandardMaterial({ color: 0x1a212c })
    );
    tT.position.set(-3, 1.6, 2);
    roomGroup.add(tT);
    for (const [x, z] of [[-5, 1], [-1, 1], [-5, 3], [-1, 3]]) {
      const lg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 0.1), new THREE.MeshStandardMaterial({ color: 0x10141a }));
      lg.position.set(x, 0.8, z);
      roomGroup.add(lg);
    }
    const monBack = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.4, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x0c1018 })
    );
    monBack.position.set(-3, 2.6, 1.6);
    roomGroup.add(monBack);
    const monScr = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x33ff88, emissive: 0x33ff88, emissiveIntensity: 0.7 })
    );
    monScr.position.set(-3, 2.6, 1.65);
    roomGroup.add(monScr);

    scene.add(roomGroup);

    // ============================================================
    // PROJECT NODES (interactive orbs along the path)
    // ============================================================
    const projectGroup = new THREE.Group();
    const projectMeshes: THREE.Mesh[] = [];
    const projectIdMap = new Map<THREE.Object3D, string>();

    PROJECTS.forEach((p) => {
      const g = new THREE.Group();
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.55, 24, 18),
        new THREE.MeshStandardMaterial({
          color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.4, roughness: 0.4,
        })
      );
      g.add(orb);
      // halo
      const halo = new THREE.Mesh(
        new THREE.RingGeometry(0.95, 1.05, 32),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
      );
      halo.rotation.x = -Math.PI / 2;
      g.add(halo);
      g.position.set(...p.pos);
      g.userData.basePos = g.position.clone();
      projectGroup.add(g);
      projectMeshes.push(orb);
      projectIdMap.set(orb, p.id);
      projectIdMap.set(halo, p.id);
      projectMeshes.push(halo);
    });
    scene.add(projectGroup);

    // ============================================================
    // SCROLL STATE
    // ============================================================
    let scrollTarget = 0;          // 0..1 along path
    let scrollCurrent = 0;
    const SCROLL_SPEED = 0.0009;
    const TOUCH_SPEED = 0.0035;

    function clampScroll(v: number) { return Math.max(0, Math.min(1, v)); }

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      scrollTarget = clampScroll(scrollTarget + e.deltaY * SCROLL_SPEED);
    }
    let touchY: number | null = null;
    function onTouchStart(e: TouchEvent) {
      touchY = e.touches[0].clientY;
    }
    function onTouchMove(e: TouchEvent) {
      if (touchY == null) return;
      e.preventDefault();
      const dy = touchY - e.touches[0].clientY;
      touchY = e.touches[0].clientY;
      scrollTarget = clampScroll(scrollTarget + dy * TOUCH_SPEED);
    }
    function onTouchEnd() { touchY = null; }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        scrollTarget = clampScroll(scrollTarget + 0.04);
        e.preventDefault();
      }
      if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        scrollTarget = clampScroll(scrollTarget - 0.04);
        e.preventDefault();
      }
    }
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('keydown', onKey);

    // ============================================================
    // INTERACTION (raycaster on project orbs)
    // ============================================================
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function onPointerMove(e: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(projectMeshes, false);
      if (hits.length > 0) {
        const id = projectIdMap.get(hits[0].object);
        if (id) {
          setHover({ id, x: e.clientX, y: e.clientY });
          renderer.domElement.style.cursor = 'pointer';
          return;
        }
      }
      setHover(null);
      renderer.domElement.style.cursor = 'grab';
    }
    function onClick(e: MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(projectMeshes, false);
      if (hits.length > 0) {
        const id = projectIdMap.get(hits[0].object);
        const p = PROJECTS.find((x) => x.id === id);
        if (p) setOpen(p);
      }
    }
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('click', onClick);

    function onResize() {
      camera.aspect = w() / h();
      camera.updateProjectionMatrix();
      renderer.setSize(w(), h());
    }
    window.addEventListener('resize', onResize);

    // ============================================================
    // ANIMATE
    // ============================================================
    let raf = 0;
    let t = 0;

    const tmpPos = new THREE.Vector3();
    const tmpLookAhead = new THREE.Vector3();

    const layerColors = LAYERS.map((L) => new THREE.Color(L.color));
    const layerFogs   = LAYERS.map((L) => new THREE.Color(L.fog));
    const tmpBg = new THREE.Color();
    const tmpFog = new THREE.Color();

    function tick() {
      t += 0.016;

      // smooth scroll
      scrollCurrent += (scrollTarget - scrollCurrent) * 0.08;

      // camera position along path
      path.getPointAt(scrollCurrent, tmpPos);
      camera.position.copy(tmpPos);

      // look slightly ahead along the path so descent feels intentional
      const lookT = Math.min(1, scrollCurrent + 0.02);
      path.getPointAt(lookT, tmpLookAhead);
      tmpLookAhead.y -= 4;
      camera.lookAt(tmpLookAhead);

      camLight.position.copy(tmpPos).add(new THREE.Vector3(0, 1, -2));

      // background + fog interpolation between layers
      const layerF = scrollCurrent * (LAYERS.length - 1);
      const li = Math.floor(layerF);
      const lf = layerF - li;
      const ci = Math.min(li, LAYERS.length - 1);
      const cn = Math.min(li + 1, LAYERS.length - 1);
      tmpBg.copy(layerColors[ci]).lerp(layerColors[cn], lf);
      tmpFog.copy(layerFogs[ci]).lerp(layerFogs[cn], lf);
      (scene.background as THREE.Color).copy(tmpBg);
      (scene.fog as THREE.Fog).color.copy(tmpFog);
      renderer.setClearColor(tmpBg, 1);

      // active layer label
      const al = Math.min(LAYERS.length - 1, Math.round(layerF));
      setActiveLayer(al);
      setProgress(scrollCurrent);

      // animate clouds drift
      cloudGroup.children.forEach((c) => {
        if (c.userData.drift !== undefined) c.position.x += c.userData.drift;
        if (c.position.x > 30) c.position.x = -30;
        if (c.position.x < -30) c.position.x = 30;
      });

      // bubbles rise within their layer
      bubbles.forEach((b) => {
        b.position.y += b.userData.speed;
        if (b.position.y > 0) {
          b.position.y = -LAYER_HEIGHT + Math.random() * 2;
          b.position.x = (Math.random() - 0.5) * 50;
          b.position.z = (Math.random() - 0.5) * 30;
        }
      });

      // ink wave
      const surf = inkSurface.geometry as THREE.PlaneGeometry;
      const pos = surf.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        pos.setZ(i, Math.sin(x * 0.3 + t) * 0.3 + Math.cos(y * 0.3 + t * 1.3) * 0.25);
      }
      pos.needsUpdate = true;
      surf.computeVertexNormals();

      // wireframe spin
      planGroup.children.forEach((c) => {
        if (c.userData.spinX !== undefined) {
          c.rotation.x += c.userData.spinX;
          c.rotation.y += c.userData.spinY;
        }
      });

      // node pulses
      nodes.forEach((n) => {
        const m = n.material as THREE.MeshBasicMaterial;
        m.opacity = 0.55 + Math.sin(t * 2 + n.userData.phase) * 0.4;
      });

      // project orbs bob + rotate halos
      projectGroup.children.forEach((g) => {
        const base = g.userData.basePos as THREE.Vector3;
        g.position.y = base.y + Math.sin(t + base.x) * 0.4;
        g.rotation.y += 0.005;
      });

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('wheel', onWheel as EventListener);
      window.removeEventListener('touchstart', onTouchStart as EventListener);
      window.removeEventListener('touchmove', onTouchMove as EventListener);
      window.removeEventListener('touchend', onTouchEnd as EventListener);
      window.removeEventListener('keydown', onKey);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        if (m.material) {
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          mats.forEach((mt) => mt.dispose());
        }
      });
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  const hovered = hover ? PROJECTS.find((p) => p.id === hover.id) : null;
  const heroOpacity = Math.max(0, 1 - progress * 6);

  return (
    <div className="descent" ref={wrapRef}>
      <a className="exit" href="/">← back</a>
      <ProtoNav active="/2" />

      <div
        className="hero"
        style={{ opacity: heroOpacity, transform: `translateX(-50%) translateY(${-progress * 60}px)` }}
      >
        <div className="who">jason kona — descent</div>
        <h1>fall through the work</h1>
      </div>

      <div className="scrollhint" style={{ opacity: heroOpacity }}>
        scroll <span className="arrow" />
      </div>

      <div className="layer-label" key={activeLayer}>
        <span className="num">stratum {String(activeLayer + 1).padStart(2, '0')} / 05</span>
        {LAYERS[activeLayer].name}
        <span className="sub">{LAYERS[activeLayer].sub}</span>
      </div>

      <div className="ribbon">
        {LAYERS.map((L, i) => (
          <div key={L.id} className={'stop' + (i === activeLayer ? ' active' : '')}>
            <span>{L.id}</span>
            <span className="bar" />
          </div>
        ))}
      </div>

      {hovered && hover && (
        <div className="tip" style={{ left: hover.x, top: hover.y }}>
          {hovered.title}
        </div>
      )}

      {open && (
        <div className="card">
          <div className="id">project · {open.id}</div>
          <h2>{open.title}</h2>
          <p>{open.blurb}</p>
          <ul>{open.tags.map((t) => <li key={t}>{t}</li>)}</ul>
          <button className="close" onClick={() => setOpen(null)}>close</button>
        </div>
      )}
    </div>
  );
}
