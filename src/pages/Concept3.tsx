import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import ProtoNav from '../components/ProtoNav';
import './Concept3.css';

type Item = {
  id: string;
  label: string;
  title: string;
  blurb: string;
  tags: string[];
};

const ITEMS: Item[] = [
  {
    id: 'sketchbook',
    label: 'sketchbook',
    title: 'Daily Marks',
    blurb: 'A daily ink notebook. Loose linework, observational drawings, an occasional spread of color.',
    tags: ['ink', 'daily', 'observational'],
  },
  {
    id: 'monitor',
    label: 'monitor — terminal',
    title: 'kona.dev',
    blurb: 'A small CLI for tracking creative output across mediums. Logs paintings, builds, and drafts in one place.',
    tags: ['cli', 'rust', 'sqlite'],
  },
  {
    id: 'mug',
    label: 'mug',
    title: 'Morning Notes',
    blurb: 'A weekly publication of essays and sketches. Soft, slow, no algorithm. Arrives on Sundays.',
    tags: ['writing', 'newsletter'],
  },
  {
    id: 'camera',
    label: 'camera',
    title: 'Horizon Series',
    blurb: 'Shot at dawn across cities, looking for the same light. An ongoing photo set.',
    tags: ['photography', 'series'],
  },
  {
    id: 'board',
    label: 'breadboard',
    title: 'Field Recorder',
    blurb: 'Hand-soldered ESP32 field recorder. Captures loose audio while drawing in the studio.',
    tags: ['esp32', 'firmware', 'audio'],
  },
  {
    id: 'plant',
    label: 'plant',
    title: 'About',
    blurb: 'Painter and engineering major in equal measure. The duality is the point. Reach out if you want to talk shop.',
    tags: ['contact', 'about'],
  },
];

type Mode = 'wood' | 'blue';

export default function Concept3() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>('wood');
  const modeRef = useRef<Mode>('wood');
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null);
  const [open, setOpen] = useState<Item | null>(null);

  useEffect(() => { modeRef.current = mode; }, [mode]);

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
    renderer.setClearColor(0x16100a, 1);
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const ortho = new THREE.OrthographicCamera(-10, 10, 7, -7, 0.1, 80);
    ortho.position.set(0, 24, 5);
    ortho.lookAt(0, 0, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.position.set(6, 18, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -14;
    sun.shadow.camera.right = 14;
    sun.shadow.camera.top = 10;
    sun.shadow.camera.bottom = -10;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 50;
    sun.shadow.bias = -0.0005;
    scene.add(sun);

    // ============================================================
    // BENCH (the table)
    // ============================================================
    const benchWoodMat = new THREE.MeshStandardMaterial({ color: 0x6a4a2c, roughness: 0.85 });
    const benchBlueMat = new THREE.MeshStandardMaterial({ color: 0x0e2336, roughness: 0.6, metalness: 0.1 });
    const bench = new THREE.Mesh(new THREE.BoxGeometry(20, 0.3, 14), benchWoodMat);
    bench.position.y = 0;
    bench.receiveShadow = true;
    scene.add(bench);

    // wood plank lines (visible only in wood mode via opacity swap)
    const plankLines = new THREE.Group();
    const plankMat = new THREE.LineBasicMaterial({ color: 0x3a2614, transparent: true, opacity: 0.7 });
    for (let i = -3; i <= 3; i++) {
      const z = i * 2;
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-10, 0.16, z),
        new THREE.Vector3(10, 0.16, z),
      ]);
      plankLines.add(new THREE.Line(g, plankMat));
    }
    scene.add(plankLines);

    // grid lines (visible only in blueprint mode)
    const gridLines = new THREE.Group();
    const gridMat = new THREE.LineBasicMaterial({ color: 0x6ab3ff, transparent: true, opacity: 0.0 });
    for (let i = -10; i <= 10; i += 1) {
      const g1 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(i, 0.17, -7), new THREE.Vector3(i, 0.17, 7),
      ]);
      gridLines.add(new THREE.Line(g1, gridMat));
    }
    for (let i = -7; i <= 7; i += 1) {
      const g1 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-10, 0.17, i), new THREE.Vector3(10, 0.17, i),
      ]);
      gridLines.add(new THREE.Line(g1, gridMat));
    }
    scene.add(gridLines);

    // ============================================================
    // ITEMS — each is a Group with a paired blueprint material set
    // ============================================================
    type ItemNode = {
      id: string;
      group: THREE.Group;
      meshes: { mesh: THREE.Mesh; wood: THREE.Material; blue: THREE.Material }[];
      edges: THREE.LineSegments[];        // shown only in blue mode
      basePos: THREE.Vector3;
      hoverScale: number;
    };
    const itemNodes: ItemNode[] = [];
    const itemMeshes: THREE.Mesh[] = [];
    const itemIdMap = new Map<THREE.Object3D, string>();

    function addItem(id: string, x: number, z: number, build: (g: THREE.Group, push: (m: THREE.Mesh, wood: THREE.Material, blue: THREE.Material) => void) => void) {
      const group = new THREE.Group();
      const node: ItemNode = {
        id, group, meshes: [], edges: [],
        basePos: new THREE.Vector3(x, 0.16, z),
        hoverScale: 1,
      };
      const push = (m: THREE.Mesh, wood: THREE.Material, blue: THREE.Material) => {
        m.castShadow = true;
        m.receiveShadow = true;
        node.meshes.push({ mesh: m, wood, blue });
        group.add(m);
        const e = new THREE.LineSegments(
          new THREE.EdgesGeometry(m.geometry),
          new THREE.LineBasicMaterial({ color: 0x6ab3ff, transparent: true, opacity: 0 })
        );
        e.position.copy(m.position);
        e.rotation.copy(m.rotation);
        e.scale.copy(m.scale);
        node.edges.push(e);
        group.add(e);
        itemMeshes.push(m);
        itemIdMap.set(m, id);
      };
      build(group, push);
      group.position.copy(node.basePos);
      scene.add(group);
      itemNodes.push(node);
    }

    // helper: paired materials
    const matPair = (woodCol: number) => ({
      wood: new THREE.MeshStandardMaterial({ color: woodCol, roughness: 0.85 }),
      blue: new THREE.MeshStandardMaterial({ color: 0x0a1f33, roughness: 0.55, metalness: 0.15 }),
    });

    // SKETCHBOOK
    addItem('sketchbook', -6.5, -2, (_g, push) => {
      const { wood, blue } = matPair(0xd9c79b);
      const book = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 1.6), wood);
      push(book, wood, blue);
      const { wood: spineW, blue: spineB } = matPair(0x6b4a2c);
      const spine = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.32, 1.6), spineW);
      spine.position.set(-1.16, 0.01, 0);
      push(spine, spineW, spineB);
      // a scribble drawn on the cover
      const scribMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2c, transparent: true, opacity: 0.55, roughness: 1 });
      const scribBlue = new THREE.MeshStandardMaterial({ color: 0x6ab3ff, transparent: true, opacity: 0.6, roughness: 1 });
      const scrib = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.7), scribMat);
      scrib.rotation.x = -Math.PI / 2;
      scrib.position.y = 0.16;
      push(scrib, scribMat, scribBlue);
    });

    // MONITOR (small)
    addItem('monitor', -2.5, -2.4, (_g, push) => {
      const { wood, blue } = matPair(0x14181f);
      const back = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.3, 1.5), wood);
      push(back, wood, blue);
      const screenW = new THREE.MeshStandardMaterial({
        color: 0x0a1410, emissive: 0x33ff88, emissiveIntensity: 0.5,
      });
      const screenB = new THREE.MeshStandardMaterial({
        color: 0x041525, emissive: 0x6ab3ff, emissiveIntensity: 0.6,
      });
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.3), screenW);
      scr.rotation.x = -Math.PI / 2;
      scr.position.y = 0.17;
      push(scr, screenW, screenB);
    });

    // MUG
    addItem('mug', 1.8, -2.6, (_g, push) => {
      const { wood, blue } = matPair(0xe8e0c8);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.5, 1.0, 24), wood);
      body.position.y = 0.5;
      push(body, wood, blue);
      const { wood: handleW, blue: handleB } = matPair(0xe8e0c8);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.07, 8, 16, Math.PI), handleW);
      handle.rotation.y = Math.PI / 2;
      handle.position.set(-0.5, 0.5, 0);
      push(handle, handleW, handleB);
      const { wood: liqW, blue: liqB } = matPair(0x4a2a14);
      const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 24), liqW);
      liq.position.y = 1.0;
      push(liq, liqW, liqB);
    });

    // CAMERA (rectangular body + lens cylinder)
    addItem('camera', 5.5, -2.4, (_g, push) => {
      const { wood, blue } = matPair(0x2a1f18);
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.0, 1.4), wood);
      body.position.y = 0.5;
      push(body, wood, blue);
      const { wood: lensW, blue: lensB } = matPair(0x161310);
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.6, 24), lensW);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(0.4, 0.5, 1.0);
      push(lens, lensW, lensB);
      const { wood: glassW, blue: glassB } = matPair(0x4f6675);
      const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.05, 24), glassW);
      glass.rotation.x = Math.PI / 2;
      glass.position.set(0.4, 0.5, 1.31);
      push(glass, glassW, glassB);
      const { wood: shutterW, blue: shutterB } = matPair(0xc0392b);
      const shutter = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 12), shutterW);
      shutter.position.set(0.7, 1.05, -0.35);
      push(shutter, shutterW, shutterB);
    });

    // BREADBOARD (small electronics)
    addItem('board', -6.0, 2.2, (_g, push) => {
      const boardW = new THREE.MeshStandardMaterial({ color: 0xe8dfc4, roughness: 0.85 });
      const boardB = new THREE.MeshStandardMaterial({ color: 0x12243a, roughness: 0.6 });
      const board = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.2, 1.4), boardW);
      board.position.y = 0.1;
      push(board, boardW, boardB);
      const { wood: chipW, blue: chipB } = matPair(0x111111);
      const chip = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.16, 0.4), chipW);
      chip.position.y = 0.22;
      push(chip, chipW, chipB);
      const ledColors = [0xff5b5b, 0x6aff8a, 0x6ab3ff, 0xffe26a];
      ledColors.forEach((col, i) => {
        const ledW = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.2 });
        const ledB = new THREE.MeshStandardMaterial({ color: 0x6ab3ff, emissive: 0x6ab3ff, emissiveIntensity: 1.2 });
        const led = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), ledW);
        led.position.set(-0.6 + i * 0.3, 0.3, 0.4);
        push(led, ledW, ledB);
      });
    });

    // PLANT
    addItem('plant', 4.5, 2.2, (_g, push) => {
      const { wood, blue } = matPair(0x6e3d28);
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.45, 0.8, 12), wood);
      pot.position.y = 0.4;
      push(pot, wood, blue);
      const leafW = new THREE.MeshStandardMaterial({ color: 0x5a7a3a, roughness: 0.85 });
      const leafB = new THREE.MeshStandardMaterial({ color: 0x6ab3ff, roughness: 0.6 });
      for (let i = 0; i < 8; i++) {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), leafW);
        leaf.position.set(
          (Math.random() - 0.5) * 0.7,
          0.9 + (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.7,
        );
        leaf.scale.set(1, 0.65, 1);
        push(leaf, leafW, leafB);
      }
    });

    // a few decorative scattered items (not interactive)
    function addDeco(x: number, z: number, build: (g: THREE.Group) => void) {
      const g = new THREE.Group();
      build(g);
      g.position.set(x, 0.16, z);
      scene.add(g);
    }

    // pencils
    addDeco(0.5, 1.5, (g) => {
      for (let i = 0; i < 4; i++) {
        const pencil = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.06, 1.6, 6),
          new THREE.MeshStandardMaterial({ color: i === 0 ? 0xff8a4a : 0x8a8278, roughness: 0.8 })
        );
        pencil.rotation.z = Math.PI / 2;
        pencil.rotation.y = (i - 1.5) * 0.05;
        pencil.position.set(0, 0.06, i * 0.16 - 0.24);
        pencil.castShadow = true;
        g.add(pencil);
      }
    });

    // tape roll
    addDeco(-3.0, 1.8, (g) => {
      const tape = new THREE.Mesh(
        new THREE.TorusGeometry(0.4, 0.18, 12, 24),
        new THREE.MeshStandardMaterial({ color: 0xc88a55, roughness: 0.9 })
      );
      tape.rotation.x = Math.PI / 2;
      tape.position.y = 0.18;
      tape.castShadow = true;
      g.add(tape);
    });

    // a paper sheet
    addDeco(2.8, 1.4, (g) => {
      const sheet = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 0.04, 1.4),
        new THREE.MeshStandardMaterial({ color: 0xeae3d2, roughness: 0.95 })
      );
      sheet.rotation.y = 0.15;
      sheet.position.y = 0.04;
      sheet.castShadow = true;
      g.add(sheet);
    });

    // ============================================================
    // CHARACTER — a small pixel "me" hand reaches in occasionally
    // (just a bobbing arm shape from the top edge for life)
    // ============================================================
    const handGroup = new THREE.Group();
    const handMat = new THREE.MeshStandardMaterial({ color: 0xc88c66, roughness: 0.85 });
    const sleeveMat = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.9 });
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.0, 0.5), sleeveMat);
    arm.position.y = 1.5;
    arm.castShadow = true;
    handGroup.add(arm);
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), handMat);
    palm.position.y = 0;
    palm.castShadow = true;
    handGroup.add(palm);
    const finger = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.6, 0.18), handMat);
    finger.position.set(0, -0.45, 0);
    finger.castShadow = true;
    handGroup.add(finger);
    handGroup.position.set(7.5, 0, -8);
    handGroup.rotation.z = -0.5;
    scene.add(handGroup);

    // ============================================================
    // INTERACTION
    // ============================================================
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hoveredId: string | null = null;

    function onPointerMove(e: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, ortho);
      const hits = raycaster.intersectObjects(itemMeshes, false);
      if (hits.length > 0) {
        const id = itemIdMap.get(hits[0].object);
        if (id) {
          hoveredId = id;
          setHover({ id, x: e.clientX, y: e.clientY });
          renderer.domElement.style.cursor = 'pointer';
          return;
        }
      }
      hoveredId = null;
      setHover(null);
      renderer.domElement.style.cursor = 'default';
    }
    function onClick(e: MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, ortho);
      const hits = raycaster.intersectObjects(itemMeshes, false);
      if (hits.length > 0) {
        const id = itemIdMap.get(hits[0].object);
        const it = ITEMS.find((x) => x.id === id);
        if (it) setOpen(it);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space') {
        e.preventDefault();
        setMode((m) => (m === 'wood' ? 'blue' : 'wood'));
      }
    }
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('click', onClick);
    window.addEventListener('keydown', onKey);

    function onResize() {
      const aspect = w() / h();
      const frustum = 7;
      ortho.left = -frustum * aspect;
      ortho.right = frustum * aspect;
      ortho.top = frustum;
      ortho.bottom = -frustum;
      ortho.updateProjectionMatrix();
      renderer.setSize(w(), h());
    }
    onResize();
    window.addEventListener('resize', onResize);

    // ============================================================
    // ANIMATE
    // ============================================================
    let raf = 0;
    let t = 0;
    let modeF = 0; // 0 = wood, 1 = blue (lerped)

    function tick() {
      t += 0.016;

      // mode transition
      const target = modeRef.current === 'blue' ? 1 : 0;
      modeF += (target - modeF) * 0.08;

      // bench color lerp
      const bm = bench.material as THREE.MeshStandardMaterial;
      bm.color.copy(benchWoodMat.color).lerp(benchBlueMat.color, modeF);

      // plank/grid opacity
      plankLines.children.forEach((l) => {
        const m = (l as THREE.Line).material as THREE.LineBasicMaterial;
        m.opacity = 0.7 * (1 - modeF);
      });
      gridLines.children.forEach((l) => {
        const m = (l as THREE.Line).material as THREE.LineBasicMaterial;
        m.opacity = 0.45 * modeF;
      });

      // item materials swap and edges visibility
      itemNodes.forEach((node) => {
        const isHover = hoveredId === node.id;
        const targetScale = isHover ? 1.08 : 1;
        node.hoverScale += (targetScale - node.hoverScale) * 0.18;
        node.group.scale.setScalar(node.hoverScale);
        node.group.position.y = node.basePos.y + (isHover ? 0.4 : 0) + Math.sin(t * 1.2 + node.basePos.x) * 0.04;

        node.meshes.forEach(({ mesh, wood, blue }) => {
          // crossfade: assign the dominant material then tint
          mesh.material = modeF < 0.5 ? wood : blue;
          const m = mesh.material as THREE.MeshStandardMaterial;
          if (m.color && (wood as THREE.MeshStandardMaterial).color && (blue as THREE.MeshStandardMaterial).color) {
            m.color.copy((wood as THREE.MeshStandardMaterial).color).lerp((blue as THREE.MeshStandardMaterial).color, modeF);
          }
          if (m.emissive && (wood as THREE.MeshStandardMaterial).emissive && (blue as THREE.MeshStandardMaterial).emissive) {
            m.emissive.copy((wood as THREE.MeshStandardMaterial).emissive).lerp((blue as THREE.MeshStandardMaterial).emissive, modeF);
          }
        });

        node.edges.forEach((e) => {
          const m = e.material as THREE.LineBasicMaterial;
          m.opacity = 0.85 * modeF;
        });
      });

      // hand bobbing in from off-canvas top right
      const pulse = (Math.sin(t * 0.5) + 1) * 0.5;
      handGroup.position.x = 9 - pulse * 6;
      handGroup.position.z = -7 + pulse * 4;
      handGroup.rotation.z = -0.5 + pulse * 0.3;

      renderer.render(scene, ortho);
      raf = requestAnimationFrame(tick);
    }
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKey);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        if ((m as THREE.Mesh).material) {
          const mats = Array.isArray((m as THREE.Mesh).material) ? (m as THREE.Mesh).material : [(m as THREE.Mesh).material];
          (mats as THREE.Material[]).forEach((mt) => mt.dispose());
        }
      });
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  const hovered = hover ? ITEMS.find((i) => i.id === hover.id) : null;

  return (
    <div className={`workshop ${mode === 'blue' ? 'blue' : ''}`} ref={wrapRef}>
      <a className="exit" href="/">← back</a>
      <ProtoNav active="/3" />

      <div className="hero">
        <div className="who">jason kona — workshop</div>
        <h1>{mode === 'blue' ? 'a bench, blueprinted' : 'a bench, from above'}</h1>
      </div>

      <div className="stamp tl">
        view
        <span className="v">{mode === 'blue' ? 'blueprint' : 'watercolor'}</span>
      </div>
      <div className="stamp tr">
        scale 1:1
        <span className="v">{ITEMS.length} items</span>
      </div>
      <div className="stamp bl">
        rev 04 · 2026
        <span className="v">kona codes</span>
      </div>

      <div className="lens">
        <button className={mode === 'wood' ? 'active' : ''} onClick={() => setMode('wood')}>watercolor</button>
        <button className={mode === 'blue' ? 'active' : ''} onClick={() => setMode('blue')}>blueprint</button>
        <span className="key">space ↹</span>
      </div>

      {hovered && hover && (
        <div className="tip" style={{ left: hover.x, top: hover.y }}>
          {hovered.label}
        </div>
      )}

      {open && (
        <div className="card">
          <div className="id">item · {open.id}</div>
          <h2>{open.title}</h2>
          <p>{open.blurb}</p>
          <ul>{open.tags.map((t) => <li key={t}>{t}</li>)}</ul>
          <button className="close" onClick={() => setOpen(null)}>close</button>
        </div>
      )}
    </div>
  );
}
