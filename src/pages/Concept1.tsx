import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import ProtoNav from '../components/ProtoNav';
import './Concept1.css';

type Hot = {
  id: string;
  side: 'left' | 'right';
  label: string;
  title: string;
  blurb: string;
  tags: string[];
};

const HOTS: Hot[] = [
  {
    id: 'easel',
    side: 'left',
    label: 'easel — current piece',
    title: 'Quiet Hours',
    blurb:
      'An ongoing series of small oil studies. Soft, slow paintings made on weeknights when the rest of the work has gone quiet.',
    tags: ['oil', 'study', 'series'],
  },
  {
    id: 'sketchbook',
    side: 'left',
    label: 'sketchbook',
    title: 'Daily Marks',
    blurb:
      'A daily ink notebook. Loose linework, observational drawings, the occasional spread of color. Mostly for me, sometimes shared.',
    tags: ['ink', 'daily', 'observational'],
  },
  {
    id: 'jars',
    side: 'left',
    label: 'palette jars',
    title: 'Pigment Notes',
    blurb:
      'A long-running document of pigments mixed by hand. Color recipes, swatches, and the painters they came from.',
    tags: ['pigment', 'color', 'notes'],
  },
  {
    id: 'monitor',
    side: 'right',
    label: 'monitor — terminal',
    title: 'kona.dev',
    blurb:
      'A small CLI for tracking creative output across mediums. Logs paintings, builds, drafts, and weekly review prompts in one place.',
    tags: ['cli', 'rust', 'sqlite'],
  },
  {
    id: 'board',
    side: 'right',
    label: 'breadboard',
    title: 'Field Recorder',
    blurb:
      'Hand-soldered field recorder built around an ESP32. Records loose audio while drawing in the studio — sound and image, kept together.',
    tags: ['esp32', 'firmware', 'audio'],
  },
  {
    id: 'stack',
    side: 'right',
    label: 'paper stack',
    title: 'Research Notes',
    blurb:
      'Long-form essays on tooling, computer graphics, and the relationship between handcraft and software. Updated when I have something to say.',
    tags: ['writing', 'graphics', 'tools'],
  },
];

export default function Concept1() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null);
  const [open, setOpen] = useState<Hot | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const w = () => wrap.clientWidth;
    const h = () => wrap.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w(), h());
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x0a0a0c, 1);
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0a0c, 22, 50);

    const camera = new THREE.PerspectiveCamera(28, w() / h(), 0.1, 100);
    const baseCamPos = new THREE.Vector3(14, 11, 14);
    camera.position.copy(baseCamPos);
    camera.lookAt(0, 2.2, 0);

    scene.add(new THREE.AmbientLight(0x363842, 0.55));

    const warmKey = new THREE.DirectionalLight(0xffd1a0, 1.1);
    warmKey.position.set(-8, 12, 6);
    warmKey.castShadow = true;
    warmKey.shadow.mapSize.set(1024, 1024);
    warmKey.shadow.camera.left = -10;
    warmKey.shadow.camera.right = 10;
    warmKey.shadow.camera.top = 10;
    warmKey.shadow.camera.bottom = -10;
    warmKey.shadow.bias = -0.0008;
    scene.add(warmKey);

    const coolKey = new THREE.DirectionalLight(0x9bd4ff, 0.85);
    coolKey.position.set(8, 12, 6);
    coolKey.castShadow = true;
    coolKey.shadow.mapSize.set(1024, 1024);
    coolKey.shadow.camera.left = -10;
    coolKey.shadow.camera.right = 10;
    coolKey.shadow.camera.top = 10;
    coolKey.shadow.camera.bottom = -10;
    coolKey.shadow.bias = -0.0008;
    scene.add(coolKey);

    const warmFill = new THREE.PointLight(0xff9d5c, 0.7, 18, 1.6);
    warmFill.position.set(-3.5, 4.2, 3);
    scene.add(warmFill);

    const coolFill = new THREE.PointLight(0x6ab3ff, 0.85, 18, 1.6);
    coolFill.position.set(3.5, 4.2, 3);
    scene.add(coolFill);

    const ROOM_W = 14;
    const ROOM_D = 10;
    const ROOM_H = 7;

    const floorMatL = new THREE.MeshStandardMaterial({ color: 0x1d1612, roughness: 0.92 });
    const floorMatR = new THREE.MeshStandardMaterial({ color: 0x10151c, roughness: 0.85 });
    const floorL = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W / 2, 0.2, ROOM_D), floorMatL);
    floorL.position.set(-ROOM_W / 4, -0.1, 0);
    floorL.receiveShadow = true;
    scene.add(floorL);
    const floorR = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W / 2, 0.2, ROOM_D), floorMatR);
    floorR.position.set(ROOM_W / 4, -0.1, 0);
    floorR.receiveShadow = true;
    scene.add(floorR);

    const plankMat = new THREE.LineBasicMaterial({ color: 0x2a1d15, transparent: true, opacity: 0.9 });
    for (let i = 1; i < 5; i++) {
      const x = -ROOM_W / 2 + i * (ROOM_W / 2 / 5);
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0.011, -ROOM_D / 2),
        new THREE.Vector3(x, 0.011, ROOM_D / 2),
      ]);
      scene.add(new THREE.Line(g, plankMat));
    }

    const gridMat = new THREE.LineBasicMaterial({ color: 0x1d2a3a, transparent: true, opacity: 0.75 });
    for (let i = 0; i <= 7; i++) {
      const x = i * (ROOM_W / 2 / 7);
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0.011, -ROOM_D / 2),
        new THREE.Vector3(x, 0.011, ROOM_D / 2),
      ]);
      scene.add(new THREE.Line(g, gridMat));
    }
    for (let i = 0; i <= 5; i++) {
      const z = -ROOM_D / 2 + i * (ROOM_D / 5);
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.011, z),
        new THREE.Vector3(ROOM_W / 2, 0.011, z),
      ]);
      scene.add(new THREE.Line(g, gridMat));
    }

    const wallMatL = new THREE.MeshStandardMaterial({ color: 0x3b2b22, roughness: 0.95 });
    const wallMatR = new THREE.MeshStandardMaterial({ color: 0x131a25, roughness: 0.9 });

    const backL = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W / 2, ROOM_H, 0.2), wallMatL);
    backL.position.set(-ROOM_W / 4, ROOM_H / 2, -ROOM_D / 2);
    backL.receiveShadow = true;
    scene.add(backL);
    const backR = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W / 2, ROOM_H, 0.2), wallMatR);
    backR.position.set(ROOM_W / 4, ROOM_H / 2, -ROOM_D / 2);
    backR.receiveShadow = true;
    scene.add(backR);

    const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.2, ROOM_H, ROOM_D), wallMatL);
    sideL.position.set(-ROOM_W / 2, ROOM_H / 2, 0);
    sideL.receiveShadow = true;
    scene.add(sideL);
    const sideR = new THREE.Mesh(new THREE.BoxGeometry(0.2, ROOM_H, ROOM_D), wallMatR);
    sideR.position.set(ROOM_W / 2, ROOM_H / 2, 0);
    sideR.receiveShadow = true;
    scene.add(sideR);

    const seam = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, ROOM_H, ROOM_D),
      new THREE.MeshStandardMaterial({ color: 0x222226, emissive: 0x111111 })
    );
    seam.position.set(0, ROOM_H / 2, 0);
    scene.add(seam);

    const hotMap = new Map<THREE.Object3D, string>();
    const hotMeshes: THREE.Object3D[] = [];
    function registerHot(obj: THREE.Object3D, id: string) {
      hotMap.set(obj, id);
      hotMeshes.push(obj);
      obj.traverse((c) => { hotMap.set(c, id); });
    }

    // ============================================================
    // LEFT — ARTIST STUDIO
    // ============================================================
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x6b4a32, roughness: 0.7 });
    const canvasMat = (col: number) => new THREE.MeshStandardMaterial({ color: col, roughness: 0.95 });
    function makeFrame(x: number, y: number, w_: number, h_: number, col: number) {
      const g = new THREE.Group();
      const back = new THREE.Mesh(new THREE.BoxGeometry(w_, h_, 0.05), frameMat);
      back.castShadow = true;
      g.add(back);
      const inner = new THREE.Mesh(new THREE.PlaneGeometry(w_ * 0.85, h_ * 0.85), canvasMat(col));
      inner.position.z = 0.03;
      g.add(inner);
      g.position.set(x, y, -ROOM_D / 2 + 0.13);
      return g;
    }
    scene.add(makeFrame(-5.2, 4.4, 1.6, 1.1, 0x9c5b3a));
    scene.add(makeFrame(-3.0, 4.6, 1.2, 1.6, 0xc99764));
    scene.add(makeFrame(-1.4, 4.2, 1.0, 1.0, 0x6b8a6c));

    const easelGroup = new THREE.Group();
    const legMat = new THREE.MeshStandardMaterial({ color: 0x4b3320, roughness: 0.8 });
    const legA = new THREE.Mesh(new THREE.BoxGeometry(0.08, 4.2, 0.08), legMat);
    legA.position.set(-0.3, 2.1, 0);
    legA.rotation.x = 0.18;
    legA.castShadow = true;
    const legB = legA.clone();
    legB.position.set(0.3, 2.1, 0);
    const back2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 4.2, 0.08), legMat);
    back2.position.set(0, 2.1, -0.6);
    back2.rotation.x = -0.16;
    back2.castShadow = true;
    const easelCanvas = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 1.6, 0.06),
      new THREE.MeshStandardMaterial({ color: 0xe8d8b8, roughness: 0.95 })
    );
    easelCanvas.position.set(0, 2.6, -0.05);
    easelCanvas.castShadow = true;
    easelGroup.add(legA, legB, back2, easelCanvas);
    const paint1 = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x7d4f3a, roughness: 1 })
    );
    paint1.position.set(0, 2.6, -0.018);
    easelGroup.add(paint1);
    const paint2 = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 0.4),
      new THREE.MeshStandardMaterial({ color: 0xc7965e, roughness: 1 })
    );
    paint2.position.set(-0.3, 2.85, -0.017);
    easelGroup.add(paint2);
    easelGroup.position.set(-4.2, 0, 0.5);
    easelGroup.rotation.y = 0.35;
    scene.add(easelGroup);
    registerHot(easelGroup, 'easel');

    const tableTopMat = new THREE.MeshStandardMaterial({ color: 0x6a4528, roughness: 0.85 });
    const tableLegMat = new THREE.MeshStandardMaterial({ color: 0x3a2616, roughness: 0.9 });
    const tableL = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 1.4), tableTopMat);
    top.position.y = 1.4; top.castShadow = true; top.receiveShadow = true;
    tableL.add(top);
    for (const [x, z] of [[-1.05, -0.55], [1.05, -0.55], [-1.05, 0.55], [1.05, 0.55]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.4, 0.12), tableLegMat);
      leg.position.set(x, 0.7, z);
      leg.castShadow = true;
      tableL.add(leg);
    }
    tableL.position.set(-1.6, 0, 2.2);
    scene.add(tableL);

    const sketchGroup = new THREE.Group();
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.06, 0.7),
      new THREE.MeshStandardMaterial({ color: 0xcfb88a, roughness: 0.9 })
    );
    book.castShadow = true;
    sketchGroup.add(book);
    const spine = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.07, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x6b4a2c })
    );
    sketchGroup.add(spine);
    const scrib = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x7a6240, roughness: 1, transparent: true, opacity: 0.45 })
    );
    scrib.rotation.x = -Math.PI / 2;
    scrib.position.y = 0.04;
    sketchGroup.add(scrib);
    sketchGroup.position.set(-2.0, 1.46, 2.2);
    sketchGroup.rotation.y = -0.3;
    scene.add(sketchGroup);
    registerHot(sketchGroup, 'sketchbook');

    const jarsGroup = new THREE.Group();
    const jarColors = [0x8b3a2a, 0xc77a3c, 0xd4a85c, 0x6e7c4a, 0x3a5b6a, 0xaa9785];
    jarColors.forEach((col, i) => {
      const angle = (i / jarColors.length) * Math.PI * 2;
      const r = 0.32;
      const jar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.4, 12),
        new THREE.MeshStandardMaterial({ color: 0x8a8276, roughness: 0.5, metalness: 0.1 })
      );
      jar.position.set(Math.cos(angle) * r, 0.2, Math.sin(angle) * r);
      jar.castShadow = true;
      const paint = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.04, 12),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.95 })
      );
      paint.position.set(jar.position.x, 0.39, jar.position.z);
      jarsGroup.add(jar, paint);
    });
    jarsGroup.position.set(-0.7, 1.46, 1.9);
    scene.add(jarsGroup);
    registerHot(jarsGroup, 'jars');

    const brushJar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.5, 12),
      new THREE.MeshStandardMaterial({ color: 0x4f6675, roughness: 0.4 })
    );
    brushJar.position.set(-0.7, 1.71, 2.6);
    brushJar.castShadow = true;
    scene.add(brushJar);
    for (let i = 0; i < 5; i++) {
      const brush = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.7, 6),
        new THREE.MeshStandardMaterial({ color: 0x7c5a32 })
      );
      brush.position.set(-0.7 + (Math.random() - 0.5) * 0.18, 2.05, 2.6 + (Math.random() - 0.5) * 0.18);
      brush.rotation.z = (Math.random() - 0.5) * 0.4;
      brush.rotation.x = (Math.random() - 0.5) * 0.3;
      scene.add(brush);
    }

    const stool = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.4, 0.18, 12),
      new THREE.MeshStandardMaterial({ color: 0x4a3320, roughness: 0.85 })
    );
    stool.position.set(-3.4, 0.95, 2.2);
    stool.castShadow = true;
    scene.add(stool);
    const stoolLegMat = new THREE.MeshStandardMaterial({ color: 0x2d1d10 });
    for (const [x, z] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.95, 0.06), stoolLegMat);
      leg.position.set(-3.4 + x, 0.45, 2.2 + z);
      scene.add(leg);
    }

    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.18, 0.32, 8),
      new THREE.MeshStandardMaterial({ color: 0x6e3d28, roughness: 0.85 })
    );
    pot.position.set(-5.4, 5.1, -3.2);
    scene.add(pot);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x5a6f3a, roughness: 0.8 });
    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), leafMat);
      leaf.position.set(
        -5.4 + (Math.random() - 0.5) * 0.6,
        5.4 + (Math.random() - 0.5) * 0.4,
        -3.2 + (Math.random() - 0.5) * 0.6
      );
      leaf.scale.set(1, 0.55, 1);
      scene.add(leaf);
    }

    // ============================================================
    // RIGHT — ENGINEER BENCH
    // ============================================================
    const benchTopMat = new THREE.MeshStandardMaterial({ color: 0x1a212c, roughness: 0.6, metalness: 0.2 });
    const benchLegMat = new THREE.MeshStandardMaterial({ color: 0x0e131a, roughness: 0.6, metalness: 0.5 });
    const benchR = new THREE.Group();
    const benchTop = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.1, 1.8), benchTopMat);
    benchTop.position.y = 1.6;
    benchTop.castShadow = true; benchTop.receiveShadow = true;
    benchR.add(benchTop);
    for (const [x, z] of [[-2.15, -0.75], [2.15, -0.75], [-2.15, 0.75], [2.15, 0.75]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 0.1), benchLegMat);
      leg.position.set(x, 0.8, z);
      leg.castShadow = true;
      benchR.add(leg);
    }
    benchR.position.set(2.5, 0, 1.6);
    scene.add(benchR);

    const monitorGroup = new THREE.Group();
    const monitorBack = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 1.2, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x0c1018, roughness: 0.5, metalness: 0.4 })
    );
    monitorBack.castShadow = true;
    monitorGroup.add(monitorBack);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.85, 1.05),
      new THREE.MeshStandardMaterial({ color: 0x0a1410, emissive: 0x33ff88, emissiveIntensity: 0.55 })
    );
    screen.position.z = 0.045;
    monitorGroup.add(screen);
    const lineMat = new THREE.MeshStandardMaterial({ color: 0x6affc0, emissive: 0x6affc0, emissiveIntensity: 0.8 });
    for (let i = 0; i < 8; i++) {
      const w_ = 0.4 + Math.random() * 1.2;
      const line = new THREE.Mesh(new THREE.PlaneGeometry(w_, 0.05), lineMat);
      line.position.set(-0.85 + w_ / 2, 0.4 - i * 0.115, 0.05);
      monitorGroup.add(line);
    }
    const stand = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.4, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x222931 })
    );
    stand.position.y = -0.8;
    monitorGroup.add(stand);
    const standBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.06, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x1a1f25 })
    );
    standBase.position.y = -1.02;
    monitorGroup.add(standBase);
    monitorGroup.position.set(2.0, 2.65, 1.4);
    monitorGroup.rotation.y = -0.18;
    scene.add(monitorGroup);
    registerHot(monitorGroup, 'monitor');

    const keyboard = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.06, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x121821, roughness: 0.7 })
    );
    keyboard.position.set(2.0, 1.7, 2.1);
    keyboard.castShadow = true;
    scene.add(keyboard);
    const keyMat = new THREE.MeshStandardMaterial({ color: 0x2a323e });
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 14; c++) {
        const k = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.025, 0.08), keyMat);
        k.position.set(2.0 - 0.6 + c * 0.09, 1.74, 2.1 - 0.16 + r * 0.11);
        scene.add(k);
      }
    }

    const boardGroup = new THREE.Group();
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.06, 0.7),
      new THREE.MeshStandardMaterial({ color: 0xece6d4, roughness: 0.85 })
    );
    board.castShadow = true;
    boardGroup.add(board);
    const chip = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.06, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.6 })
    );
    chip.position.set(-0.1, 0.07, 0);
    boardGroup.add(chip);
    const ledMeshes: THREE.Mesh[] = [];
    const ledColors = [0xff5b5b, 0x6aff8a, 0x6ab3ff, 0xffe26a];
    ledColors.forEach((col, i) => {
      const led = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 6),
        new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.4 })
      );
      led.position.set(0.2 + i * 0.12, 0.09, 0.0);
      boardGroup.add(led);
      ledMeshes.push(led);
    });
    const wireMat = new THREE.MeshStandardMaterial({ color: 0xff5b5b, emissive: 0x551515 });
    for (let i = 0; i < 4; i++) {
      const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 6), wireMat);
      wire.position.set(0.5, 0.18, 0.2 + i * 0.05);
      wire.rotation.z = Math.PI / 2;
      wire.rotation.x = (Math.random() - 0.5) * 0.4;
      boardGroup.add(wire);
    }
    boardGroup.position.set(3.7, 1.66, 1.4);
    boardGroup.rotation.y = 0.25;
    scene.add(boardGroup);
    registerHot(boardGroup, 'board');

    const stackGroup = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const sheet = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.012, 0.5),
        new THREE.MeshStandardMaterial({ color: 0xe3e0d4, roughness: 0.95 })
      );
      sheet.position.y = i * 0.012;
      sheet.position.x = (Math.random() - 0.5) * 0.04;
      sheet.position.z = (Math.random() - 0.5) * 0.04;
      sheet.rotation.y = (Math.random() - 0.5) * 0.06;
      sheet.castShadow = true;
      stackGroup.add(sheet);
    }
    stackGroup.position.set(4.0, 1.66, 2.3);
    scene.add(stackGroup);
    registerHot(stackGroup, 'stack');

    const holder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.36, 12),
      new THREE.MeshStandardMaterial({ color: 0x232b36, roughness: 0.5, metalness: 0.4 })
    );
    holder.position.set(4.7, 1.84, 1.7);
    holder.castShadow = true;
    scene.add(holder);
    for (let i = 0; i < 4; i++) {
      const pen = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.014, 0.6, 6),
        new THREE.MeshStandardMaterial({ color: i === 0 ? 0xff8a4a : 0x9aa6b4 })
      );
      pen.position.set(4.7 + (Math.random() - 0.5) * 0.16, 2.05, 1.7 + (Math.random() - 0.5) * 0.16);
      pen.rotation.z = (Math.random() - 0.5) * 0.5;
      pen.rotation.x = (Math.random() - 0.5) * 0.3;
      scene.add(pen);
    }

    const sheetMat = new THREE.MeshStandardMaterial({
      color: 0x1f2a3a,
      emissive: 0x0a141f,
      emissiveIntensity: 0.4,
      roughness: 0.6,
    });
    function makeSheet(x: number, y: number, w_: number, h_: number) {
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(w_, h_), sheetMat);
      sheet.position.set(x, y, -ROOM_D / 2 + 0.12);
      return sheet;
    }
    scene.add(makeSheet(1.5, 4.6, 1.4, 1.0));
    scene.add(makeSheet(3.4, 4.4, 1.6, 1.4));
    scene.add(makeSheet(5.2, 4.7, 1.0, 0.9));

    const schemMat = new THREE.LineBasicMaterial({ color: 0x6ab3ff, transparent: true, opacity: 0.55 });
    function makeSchem(cx: number, cy: number) {
      const pts: THREE.Vector3[] = [];
      let x = cx - 0.5, y = cy;
      for (let i = 0; i < 6; i++) {
        x += 0.18 + Math.random() * 0.1;
        pts.push(new THREE.Vector3(x, y, -ROOM_D / 2 + 0.13));
        y += (Math.random() - 0.5) * 0.4;
        pts.push(new THREE.Vector3(x, y, -ROOM_D / 2 + 0.13));
      }
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      scene.add(new THREE.Line(g, schemMat));
    }
    makeSchem(1.5, 4.6);
    makeSchem(3.4, 4.4);
    makeSchem(5.2, 4.7);

    const lampArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 1.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x252b35, metalness: 0.6 })
    );
    lampArm.position.set(0.9, 2.4, 1.4);
    lampArm.rotation.z = 0.5;
    scene.add(lampArm);
    const lampHead = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.32, 12, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0x1a1f27, side: THREE.DoubleSide,
        emissive: 0xff8a4a, emissiveIntensity: 0.4,
      })
    );
    lampHead.position.set(0.55, 3.1, 1.4);
    lampHead.rotation.z = -1.2;
    scene.add(lampHead);
    const lampLight = new THREE.PointLight(0xffaa66, 0.8, 6, 2);
    lampLight.position.set(0.6, 2.95, 1.4);
    scene.add(lampLight);

    // ---- INTERACTION ----
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const mouse = new THREE.Vector2();

    function onPointerMove(e: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(hotMeshes, true);
      if (hits.length > 0) {
        const id = hotMap.get(hits[0].object);
        if (id) {
          setHover({ id, x: e.clientX, y: e.clientY });
          renderer.domElement.style.cursor = 'pointer';
          return;
        }
      }
      setHover(null);
      renderer.domElement.style.cursor = 'default';
    }

    function onClick(e: MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(hotMeshes, true);
      if (hits.length > 0) {
        const id = hotMap.get(hits[0].object);
        const hot = HOTS.find((h) => h.id === id);
        if (hot) setOpen(hot);
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

    let raf = 0;
    let t = 0;
    const camTarget = new THREE.Vector3();
    const lookTarget = new THREE.Vector3(0, 2.2, 0);

    function tick() {
      t += 0.016;
      camTarget.copy(baseCamPos);
      camTarget.x += mouse.x * 1.3;
      camTarget.y += -mouse.y * 0.9;
      camera.position.lerp(camTarget, 0.06);
      camera.lookAt(lookTarget);

      ledMeshes.forEach((m, i) => {
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 1.1 + Math.sin(t * 3 + i * 1.2) * 0.5;
      });

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
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

  const hovered = hover ? HOTS.find((h) => h.id === hover.id) : null;

  return (
    <div className="atelier" ref={wrapRef}>
      <a className="exit" href="/">← back</a>
      <ProtoNav active="/1" />

      <div className="seam-line" />

      <div className="label left">
        artist
        <span className="word">studio</span>
      </div>
      <div className="label right">
        engineer
        <span className="word">bench</span>
      </div>

      <div className="hero">
        <div className="who">jason kona — atelier</div>
        <h1>painter <b>×</b> tinkerer</h1>
      </div>

      <div className="hint">
        <span>hover a thing</span>
        <span className="dot" />
        <span>click to open</span>
        <span className="dot" />
        <span>cursor moves the room</span>
      </div>

      {hovered && hover && (
        <div className="tip" style={{ left: hover.x, top: hover.y }}>
          {hovered.label}
        </div>
      )}

      {open && (
        <div className={`card ${open.side}`}>
          <div className="id">specimen · {open.id}</div>
          <h2>{open.title}</h2>
          <p>{open.blurb}</p>
          <ul>
            {open.tags.map((t) => <li key={t}>{t}</li>)}
          </ul>
          <button className="close" onClick={() => setOpen(null)}>close</button>
        </div>
      )}
    </div>
  );
}
