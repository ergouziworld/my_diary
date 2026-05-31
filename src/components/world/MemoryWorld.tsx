"use client";

import { useEffect, useMemo, useRef, useState, type RefObject, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import * as THREEImport from "three";
import type { MemoryWorldData, MemoryWorldNode } from "@/server/world";

type MemoryWorldProps = {
  data: MemoryWorldData;
};

type ThreeModule = typeof THREEImport;
type ThreeObject3D = import("three").Object3D;
type ThreeGroup = import("three").Group;
type ThreeMesh = import("three").Mesh;
type MovementMode = "walking" | "swimming" | "flying";

type AnimatedPlayer = ThreeGroup & {
  userData: {
    leftArm?: ThreeGroup;
    rightArm?: ThreeGroup;
    leftLeg?: ThreeGroup;
    rightLeg?: ThreeGroup;
    head?: ThreeGroup;
    scarf?: ThreeGroup;
    wingLeft?: ThreeGroup;
    wingRight?: ThreeGroup;
  };
};

type PlayerMapPoint = {
  x: number;
  y: number;
};

const WATER_CENTER = { x: -14, z: 12 };
const WATER_RADIUS = 8.2;
const MOUNTAIN_CENTER = { x: 12, z: -10 };
const MOUNTAIN_RADIUS = 10.5;
const MOUNTAIN_HEIGHT = 5.4;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function kindLabel(kind: MemoryWorldNode["kind"]) {
  if (kind === "quest") return "提醒";
  if (kind === "mood") return "感受";
  return "记忆";
}

function modeLabel(mode: MovementMode) {
  if (mode === "swimming") return "水中";
  if (mode === "flying") return "飞行";
  return "漫步";
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hexToNumber(value: string) {
  return Number.parseInt(value.replace("#", ""), 16);
}

function toonMaterial(THREE: ThreeModule, color: number, emissive = 0x000000, emissiveIntensity = 0) {
  return new THREE.MeshToonMaterial({
    color,
    emissive,
    emissiveIntensity,
  });
}

function outlinedMesh(
  THREE: ThreeModule,
  geometry: import("three").BufferGeometry,
  material: import("three").Material,
  outlineScale = 1.055
) {
  const group = new THREE.Group();
  const outline = new THREE.Mesh(
    geometry.clone(),
    new THREE.MeshBasicMaterial({ color: 0x151722, side: THREE.BackSide })
  );
  outline.scale.setScalar(outlineScale);
  group.add(outline);

  const mesh = new THREE.Mesh(geometry, material);
  group.add(mesh);

  return { group, mesh };
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function getTerrainHeight(x: number, z: number) {
  const distance = Math.hypot(x - MOUNTAIN_CENTER.x, z - MOUNTAIN_CENTER.z);
  const mountain = Math.pow(1 - smoothstep(0, MOUNTAIN_RADIUS, distance), 1.35) * MOUNTAIN_HEIGHT;
  const shoulder = Math.pow(1 - smoothstep(3, MOUNTAIN_RADIUS + 6, distance), 2) * 1.2;
  return mountain + shoulder;
}

function isInWater(x: number, z: number) {
  return Math.hypot(x - WATER_CENTER.x, z - WATER_CENTER.z) < WATER_RADIUS;
}

export function MemoryWorld({ data }: MemoryWorldProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<WorldControls | null>(null);
  const [selectedId, setSelectedId] = useState(data.nodes[0]?.id ?? "");
  const [nearId, setNearId] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [stamina, setStamina] = useState(100);
  const [movementMode, setMovementMode] = useState<MovementMode>("walking");
  const [playerMap, setPlayerMap] = useState<PlayerMapPoint>({ x: 50, y: 50 });
  const [loadingText, setLoadingText] = useState("正在准备安静空间...");
  const [isTouch, setIsTouch] = useState(false);

  const selected = useMemo(
    () => data.nodes.find((node) => node.id === selectedId) ?? data.nodes[0],
    [data.nodes, selectedId]
  );

  useEffect(() => {
    setIsTouch(
      typeof window !== "undefined" &&
        ("ontouchstart" in window || navigator.maxTouchPoints > 0)
    );
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    setLoadingText("正在加载安静空间...");

    const raf = requestAnimationFrame(() => {
      if (cancelled || !mountRef.current) return;

      try {
        const result = createScene({
          THREE: THREEImport,
          mount: mountRef.current,
          nodes: data.nodes,
          onSelect: (id) => {
            setSelectedId(id);
            setPanelOpen(true);
          },
          onNear: setNearId,
          onStamina: setStamina,
          onMode: setMovementMode,
          onPlayerMove: setPlayerMap,
          onReady: () => setLoadingText(""),
        });
        cleanup = result.cleanup;
        controlsRef.current = result.controls;
      } catch (error) {
        console.error("Memory world scene failed to start", error);
        if (!cancelled) setLoadingText("空间加载失败，请刷新重试。");
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      cleanup?.();
      controlsRef.current = null;
    };
  }, [data.nodes]);

  return (
    <section className="fixed inset-0 z-[100] overflow-hidden bg-slate-950 text-white">
      <div ref={mountRef} className="absolute inset-0" />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-4 p-5">
        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className="pointer-events-auto inline-flex w-fit items-center gap-1 rounded-full border border-white/20 bg-slate-950/55 px-3 py-1.5 text-sm text-white backdrop-blur-md transition hover:bg-white/10"
          >
            <span className="text-base leading-none">←</span> 返回
          </Link>
          <div className="rounded-2xl bg-slate-950/26 px-4 py-3 text-white shadow-[0_18px_70px_rgba(15,23,42,0.18)] backdrop-blur-md">
            <p className="text-xs font-medium uppercase tracking-[0.26em] text-cyan-50/85">Quiet Memory Space</p>
            <h1 className="mt-2 text-2xl font-semibold drop-shadow-[0_2px_10px_rgba(15,23,42,0.45)]">安静空间</h1>
            {!isTouch ? (
              <p className="mt-1 max-w-md text-sm text-white/82">
                拖动屏幕转视角。WASD 移动，Space 跳，F 起飞/落地，E 停留。
              </p>
            ) : null}
          </div>
        </div>
        <div className="hidden gap-2 text-xs text-white/80 sm:flex">
          <span className="rounded-full border border-white/15 bg-slate-950/45 px-3 py-1.5 backdrop-blur">
            记忆 {data.stats.memories}
          </span>
          <span className="rounded-full border border-white/15 bg-slate-950/45 px-3 py-1.5 backdrop-blur">
            提醒 {data.stats.quests}
          </span>
          <span className="rounded-full border border-white/15 bg-slate-950/45 px-3 py-1.5 backdrop-blur">
            感受 {data.stats.moods}
          </span>
        </div>
      </div>

      {!isTouch ? (
        <div className="pointer-events-none absolute left-5 bottom-5 z-10 w-72 rounded-2xl border border-white/15 bg-slate-950/60 p-4 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs text-cyan-100">
            <span>体力</span>
            <span>{Math.round(stamina)}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-white/10">
            <div className="h-full rounded-full bg-cyan-300 transition-[width]" style={{ width: `${stamina}%` }} />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-white/70">
            <span>状态</span>
            <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-cyan-50">
              {modeLabel(movementMode)}
            </span>
          </div>
          <p className="mt-3 text-xs leading-5 text-white/65">
            山坡会抬高角色，进入河流会自动变成游泳，飞行可以越过地形看整个空间。
          </p>
        </div>
      ) : null}

      <div className="pointer-events-none absolute right-5 top-24 z-10 h-36 w-36 rounded-2xl border border-white/15 bg-slate-950/55 p-3 shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-xl">
        <div className="relative h-full w-full rounded-xl border border-white/10 bg-cyan-950/25">
          <span
            className="absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-100/40 bg-emerald-500/25"
            style={{
              left: `${((MOUNTAIN_CENTER.x + 27) / 54) * 100}%`,
              top: `${((MOUNTAIN_CENTER.z + 27) / 54) * 100}%`,
            }}
          />
          <span
            className="absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-100/40 bg-sky-400/25"
            style={{
              left: `${((WATER_CENTER.x + 27) / 54) * 100}%`,
              top: `${((WATER_CENTER.z + 27) / 54) * 100}%`,
            }}
          />
          {data.nodes.map((node) => (
            <span
              key={node.id}
              className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60"
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                backgroundColor: node.color,
                boxShadow: `0 0 12px ${node.color}`,
              }}
            />
          ))}
          <span
            className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-cyan-300 shadow-[0_0_16px_rgba(125,211,252,0.9)]"
            style={{ left: `${playerMap.x}%`, top: `${playerMap.y}%` }}
          />
        </div>
      </div>

      {nearId && !panelOpen ? (
        <div className="pointer-events-none absolute left-1/2 bottom-12 z-10 -translate-x-1/2 rounded-2xl border border-cyan-200/30 bg-slate-950/75 px-5 py-3 text-sm text-cyan-50 shadow-[0_18px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          按 <span className="mx-1 rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs font-semibold">E</span>{" "}
          停留在这里
        </div>
      ) : null}

      {loadingText ? (
        <div className="absolute inset-0 z-20 grid place-items-center bg-slate-950">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_42px_rgba(34,211,238,0.65)]" />
            <p className="text-sm text-slate-300">{loadingText}</p>
          </div>
        </div>
      ) : null}

      {panelOpen ? (
        <aside className="absolute bottom-5 right-5 z-10 w-[min(360px,calc(100%-2.5rem))] rounded-2xl border border-white/15 bg-slate-950/70 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          {selected ? (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-cyan-200">
                    {kindLabel(selected.kind)} · {formatDate(selected.date)}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold leading-tight">{selected.title}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  className="pointer-events-auto rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  关闭
                </button>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>共鸣</span>
                  <span>{Math.round(selected.energy)}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(8, Math.min(selected.energy, 100))}%`,
                      backgroundColor: selected.color,
                    }}
                  />
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-200">{selected.summary}</p>
              <p className="mt-3 max-h-28 overflow-hidden rounded-xl border border-white/10 bg-white/5 p-3 text-xs leading-5 text-slate-300">
                {selected.detail}
              </p>
              <p className="mt-3 rounded-xl border border-cyan-200/15 bg-cyan-200/10 p-3 text-xs leading-5 text-cyan-50/80">
                可以在这里停一会儿。它不需要被立刻解决，只需要被温柔地看见。
              </p>

              {selected.tags.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selected.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </aside>
      ) : null}

      {isTouch ? <TouchControls controls={controlsRef} flying={movementMode === "flying"} /> : null}
    </section>
  );
}

function TouchControls({
  controls,
  flying,
}: {
  controls: RefObject<WorldControls | null>;
  flying: boolean;
}) {
  const padRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const activeId = useRef<number | null>(null);

  function applyVector(clientX: number, clientY: number) {
    const pad = padRef.current;
    if (!pad) return;
    const rect = pad.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = (clientX - cx) / (rect.width / 2);
    let dy = (clientY - cy) / (rect.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    controls.current?.setMove(dx, dy);
    if (knobRef.current) {
      knobRef.current.style.transform = `translate(${dx * 32}px, ${dy * 32}px)`;
    }
  }

  function endMove() {
    activeId.current = null;
    controls.current?.setMove(0, 0);
    if (knobRef.current) knobRef.current.style.transform = "translate(0px, 0px)";
  }

  const holdKey = (key: string) => ({
    onPointerDown: (e: ReactPointerEvent) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      controls.current?.press(key);
    },
    onPointerUp: (e: ReactPointerEvent) => {
      e.preventDefault();
      controls.current?.release(key);
    },
    onPointerCancel: () => controls.current?.release(key),
  });

  const tapKey = (key: string) => ({
    onPointerDown: (e: ReactPointerEvent) => {
      e.preventDefault();
      controls.current?.press(key);
    },
  });

  const btn =
    "pointer-events-auto flex h-14 w-14 select-none items-center justify-center rounded-full border border-white/20 bg-slate-950/55 text-xs font-medium text-white backdrop-blur-md active:bg-cyan-400/30";

  return (
    <>
      {/* 左下摇杆 */}
      <div
        ref={padRef}
        onPointerDown={(e) => {
          e.preventDefault();
          activeId.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          applyVector(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (activeId.current === e.pointerId) applyVector(e.clientX, e.clientY);
        }}
        onPointerUp={endMove}
        onPointerCancel={endMove}
        className="pointer-events-auto absolute left-6 bottom-8 z-20 grid h-32 w-32 touch-none place-items-center rounded-full border border-white/15 bg-slate-950/40 backdrop-blur-md"
      >
        <div
          ref={knobRef}
          className="h-14 w-14 rounded-full border border-cyan-200/40 bg-cyan-300/30 shadow-[0_0_24px_rgba(34,211,238,0.5)]"
        />
      </div>

      {/* 右下动作按钮 */}
      <div className="absolute right-6 bottom-8 z-20 flex flex-col items-end gap-3">
        <button type="button" {...tapKey("e")} className={btn}>
          停留
        </button>
        <div className="flex gap-3">
          <button type="button" {...tapKey("f")} className={btn}>
            {flying ? "落地" : "飞行"}
          </button>
          <button type="button" {...holdKey(" ")} className={btn}>
            {flying ? "上升" : "跳"}
          </button>
        </div>
        {flying ? (
          <button type="button" {...holdKey("control")} className={btn}>
            下降
          </button>
        ) : null}
      </div>
    </>
  );
}

type WorldControls = {
  setMove: (x: number, y: number) => void;
  press: (key: string) => void;
  release: (key: string) => void;
};

function createScene({
  THREE,
  mount,
  nodes,
  onSelect,
  onNear,
  onStamina,
  onMode,
  onPlayerMove,
  onReady,
}: {
  THREE: ThreeModule;
  mount: HTMLDivElement;
  nodes: MemoryWorldNode[];
  onSelect: (id: string) => void;
  onNear: (id: string) => void;
  onStamina: (value: number) => void;
  onMode: (mode: MovementMode) => void;
  onPlayerMove: (point: PlayerMapPoint) => void;
  onReady: () => void;
}) {
  const NOOP_CONTROLS: WorldControls = { setMove: () => {}, press: () => {}, release: () => {} };
  if (mount.dataset.memoryWorldStarted === "1") {
    onReady();
    return { cleanup: () => {}, controls: NOOP_CONTROLS };
  }
  mount.dataset.memoryWorldStarted = "1";

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x78cfff);
  scene.fog = new THREE.Fog(0xa7e7ff, 58, 150);

  const camera = new THREE.PerspectiveCamera(58, mount.clientWidth / mount.clientHeight, 0.1, 180);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  onReady();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.86;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.cursor = "grab";
  renderer.domElement.style.touchAction = "none";
  mount.appendChild(renderer.domElement);

  const skyDome = createGradientSkyDome(THREE);
  scene.add(skyDome);

  scene.add(new THREE.HemisphereLight(0xdff7ff, 0x4e9b62, 1.45));

  const sun = new THREE.DirectionalLight(0xfff0be, 1.65);
  sun.position.set(-18, 30, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -42;
  sun.shadow.camera.right = 42;
  sun.shadow.camera.top = 42;
  sun.shadow.camera.bottom = -42;
  scene.add(sun);

  const sunDisk = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 32, 16),
    new THREE.MeshBasicMaterial({ color: 0xfff3b0 })
  );
  sunDisk.position.set(-34, 36, -38);
  scene.add(sunDisk);

  const sunAura = new THREE.Mesh(
    new THREE.SphereGeometry(4.8, 32, 16),
    new THREE.MeshBasicMaterial({ color: 0xfff0a8, transparent: true, opacity: 0.12, depthWrite: false })
  );
  sunAura.position.copy(sunDisk.position);
  scene.add(sunAura);

  const skyRing = createSkyRing(THREE);
  scene.add(skyRing);

  const clouds = createCloudField(THREE);
  scene.add(clouds);

  const sparkles = createSparkles(THREE);
  scene.add(sparkles);

  const petals = createPetalField(THREE);
  scene.add(petals);

  const goldenWisps = createGoldenWisps(THREE);
  scene.add(goldenWisps);

  const terrain = new THREE.Group();
  scene.add(terrain);

  const backgroundHills = createBackgroundHills(THREE);
  scene.add(backgroundHills);

  const island = createIslandTerrain(THREE);
  terrain.add(island);

  const islandRim = new THREE.Mesh(
    new THREE.CylinderGeometry(34, 35.4, 1.35, 128, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x54ad79, roughness: 0.92 })
  );
  islandRim.position.y = -0.68;
  islandRim.receiveShadow = true;
  terrain.add(islandRim);

  const grassTufts = createGrassAndFlowers(THREE);
  terrain.add(grassTufts);

  const flowerMeadow = createFlowerMeadow(THREE);
  terrain.add(flowerMeadow);

  const mountain = new THREE.Mesh(
    new THREE.ConeGeometry(MOUNTAIN_RADIUS, MOUNTAIN_HEIGHT, 64),
    toonMaterial(THREE, 0x69b66d)
  );
  mountain.position.set(MOUNTAIN_CENTER.x, MOUNTAIN_HEIGHT / 2, MOUNTAIN_CENTER.z);
  mountain.castShadow = true;
  mountain.receiveShadow = true;
  terrain.add(mountain);

  const mountainCap = new THREE.Mesh(
    new THREE.ConeGeometry(MOUNTAIN_RADIUS * 0.42, MOUNTAIN_HEIGHT * 0.48, 48),
    toonMaterial(THREE, 0xf3fbff)
  );
  mountainCap.position.set(MOUNTAIN_CENTER.x, MOUNTAIN_HEIGHT * 0.96, MOUNTAIN_CENTER.z);
  mountainCap.castShadow = true;
  terrain.add(mountainCap);

  const water = new THREE.Mesh(
    new THREE.CircleGeometry(WATER_RADIUS, 64),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x075985,
      emissiveIntensity: 0.14,
      roughness: 0.16,
      metalness: 0.18,
      transparent: true,
      opacity: 0.74,
    })
  );
  water.position.set(WATER_CENTER.x, 0.025, WATER_CENTER.z);
  water.rotation.x = -Math.PI / 2;
  terrain.add(water);

  const waterShimmers = createWaterShimmers(THREE);
  terrain.add(waterShimmers);

  const waterRing = new THREE.Mesh(
    new THREE.TorusGeometry(WATER_RADIUS * 0.96, 0.08, 8, 96),
    new THREE.MeshBasicMaterial({ color: 0xd9fbff, transparent: true, opacity: 0.55 })
  );
  waterRing.position.set(WATER_CENTER.x, 0.08, WATER_CENTER.z);
  waterRing.rotation.x = Math.PI / 2;
  terrain.add(waterRing);

  const bridge = createBridge(THREE);
  terrain.add(bridge);

  const lightColumns = createLightColumns(THREE, nodes);
  scene.add(lightColumns);

  const pathMaterial = new THREE.MeshStandardMaterial({ color: 0xc4a77a, roughness: 0.86 });
  for (let index = 0; index < 9; index += 1) {
    const path = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.05, 1.25), pathMaterial);
    path.position.set(-16 + index * 4, 0.05, Math.sin(index * 0.8) * 2.1);
    path.rotation.y = Math.sin(index * 0.55) * 0.4;
    path.receiveShadow = true;
    terrain.add(path);
  }

  const trunkMaterial = toonMaterial(THREE, 0x8b5a2b);
  const leafMaterials = [0x22c55e, 0x16a34a, 0x65a30d].map(
    (color) => toonMaterial(THREE, color)
  );

  for (let index = 0; index < 34; index += 1) {
    const angle = index * 2.17;
    const radius = 18 + (index % 6) * 2.3;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (Math.hypot(x - WATER_CENTER.x, z - WATER_CENTER.z) < WATER_RADIUS + 1.2) continue;
    if (Math.hypot(x - MOUNTAIN_CENTER.x, z - MOUNTAIN_CENTER.z) < MOUNTAIN_RADIUS + 1.8) continue;

    const tree = new THREE.Group();
    const groundY = getTerrainHeight(x, z);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 1.1, 6), trunkMaterial);
    trunk.position.y = 0.55;
    trunk.castShadow = true;
    tree.add(trunk);

    const leaves = new THREE.Mesh(
      new THREE.ConeGeometry(0.86 + (index % 3) * 0.16, 1.8, 7),
      leafMaterials[index % leafMaterials.length]
    );
    leaves.position.y = 1.72;
    leaves.castShadow = true;
    tree.add(leaves);

    tree.position.set(x, groundY, z);
    tree.rotation.y = angle;
    terrain.add(tree);
  }

  const worldPoints = nodes.map((node, index) => {
    const landmark = createNodeLandmark(THREE, node);
    const position = toWorldPosition(THREE, node, index);
    position.y = getTerrainHeight(position.x, position.z);
    landmark.position.copy(position);
    scene.add(landmark);
    return { node, mesh: landmark, position };
  });

  const player = createPlayer(THREE);
  player.position.set(0, getTerrainHeight(0, 6), 6);
  scene.add(player);

  const cat = createCompanionCat(THREE);
  cat.position.set(-1.4, getTerrainHeight(-1.4, 7.5), 7.5);
  scene.add(cat);

  const keys = new Set<string>();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const target = new THREE.Vector3(0, getTerrainHeight(0, 6), 6);
  let cameraYaw = Math.PI * 0.25;
  let cameraPitch = 0.58;
  let dragging = false;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let frame = 0;
  let animationId = 0;
  let stamina = 100;
  let verticalVelocity = 0;
  let playerHeight = target.y;
  let movementMode: MovementMode = "walking";
  let lastMode: MovementMode = "walking";
  let mapUpdateTimer = 0;

  function setMode(nextMode: MovementMode) {
    movementMode = nextMode;
    if (nextMode !== lastMode) {
      lastMode = nextMode;
      onMode(nextMode);
    }
  }

  function getNearestPoint() {
    let nearest = worldPoints[0] ?? null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    worldPoints.forEach((point) => {
      const distance = player.position.distanceTo(point.position);
      if (distance < nearestDistance) {
        nearest = point;
        nearestDistance = distance;
      }
    });

    return nearest && nearestDistance < 4.2 ? nearest : null;
  }

  const MOVEMENT_KEYS = ["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift", " ", "control"];

  // 统一的"按下某键"逻辑，键盘和触屏按钮都走这里
  function pressKey(key: string, repeat = false) {
    if (MOVEMENT_KEYS.includes(key)) keys.add(key);

    if (key === " " && movementMode === "walking" && playerHeight <= getTerrainHeight(target.x, target.z) + 0.05 && !repeat) {
      verticalVelocity = 7.4;
    }

    if (key === "f" && !repeat) {
      if (movementMode === "flying") {
        const groundY = getTerrainHeight(target.x, target.z);
        playerHeight = Math.max(playerHeight, groundY);
        setMode(isInWater(target.x, target.z) ? "swimming" : "walking");
      } else {
        playerHeight = Math.max(playerHeight, getTerrainHeight(target.x, target.z) + 3.2);
        verticalVelocity = 0;
        setMode("flying");
      }
    }

    if (key === "e" && !repeat) {
      const nearest = getNearestPoint();
      if (nearest) onSelect(nearest.node.id);
    }
  }

  function releaseKey(key: string) {
    keys.delete(key);
  }

  // 摇杆向量 → w/a/s/d。x 右为正，y 上为负（与屏幕坐标一致）
  function setMoveAxis(x: number, y: number) {
    const t = 0.35;
    if (y < -t) keys.add("w"); else keys.delete("w");
    if (y > t) keys.add("s"); else keys.delete("s");
    if (x > t) keys.add("d"); else keys.delete("d");
    if (x < -t) keys.add("a"); else keys.delete("a");
  }

  function handleKeyDown(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    if (MOVEMENT_KEYS.includes(key)) event.preventDefault();
    pressKey(key, event.repeat);
  }

  function handleKeyUp(event: KeyboardEvent) {
    keys.delete(event.key.toLowerCase());
  }

  function handlePointerDown(event: PointerEvent) {
    dragging = true;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    renderer.domElement.style.cursor = "grabbing";
    renderer.domElement.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent) {
    if (dragging) {
      const deltaX = event.clientX - lastPointerX;
      const deltaY = event.clientY - lastPointerY;
      cameraYaw -= deltaX * 0.005;
      cameraPitch = clamp(cameraPitch + deltaY * 0.004, 0.14, 1.16);
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      return;
    }

    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function handlePointerUp(event: PointerEvent) {
    dragging = false;
    renderer.domElement.style.cursor = "grab";
    renderer.domElement.releasePointerCapture(event.pointerId);
  }

  function handleClick(event: MouseEvent) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const intersections = raycaster.intersectObjects(worldPoints.map((point) => point.mesh), true);
    const hit = intersections[0]?.object;
    if (!hit) return;

    const point = worldPoints.find((item) => {
      let current: ThreeObject3D | null = hit;
      while (current) {
        if (current === item.mesh) return true;
        current = current.parent;
      }
      return false;
    });

    if (point) {
      onSelect(point.node.id);
      target.copy(point.position).add(new THREE.Vector3(0, 0, 2.2));
      playerHeight = Math.max(playerHeight, getTerrainHeight(target.x, target.z));
    }
  }

  function handleResize() {
    const width = mount.clientWidth;
    const height = mount.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("resize", handleResize);
  renderer.domElement.addEventListener("pointerdown", handlePointerDown);
  renderer.domElement.addEventListener("pointermove", handlePointerMove);
  renderer.domElement.addEventListener("pointerup", handlePointerUp);
  renderer.domElement.addEventListener("click", handleClick);

  const clock = new THREE.Clock();

  function animate() {
    const delta = Math.min(clock.getDelta(), 0.04);
    frame += delta;

    const forward = new THREE.Vector3(Math.sin(cameraYaw), 0, Math.cos(cameraYaw));
    const right = new THREE.Vector3(-Math.cos(cameraYaw), 0, Math.sin(cameraYaw));
    const direction = new THREE.Vector3();

    if (keys.has("w") || keys.has("arrowup")) direction.add(forward);
    if (keys.has("s") || keys.has("arrowdown")) direction.sub(forward);
    if (keys.has("d") || keys.has("arrowright")) direction.add(right);
    if (keys.has("a") || keys.has("arrowleft")) direction.sub(right);

    const moving = direction.lengthSq() > 0;
    const inWater = isInWater(target.x, target.z);

    if (movementMode !== "flying") {
      setMode(inWater ? "swimming" : "walking");
    }

    const canSprint = movementMode !== "swimming";
    const sprinting = moving && canSprint && keys.has("shift") && stamina > 3;
    const speed = movementMode === "swimming" ? 3.6 : movementMode === "flying" ? (sprinting ? 15 : 9.5) : sprinting ? 14.2 : 7.8;

    if (moving) {
      direction.normalize();
      target.addScaledVector(direction, delta * speed);
      target.x = clamp(target.x, -27, 27);
      target.z = clamp(target.z, -27, 27);
      player.rotation.y = Math.atan2(direction.x, direction.z);
    }

    stamina = clamp(stamina + delta * (sprinting ? -32 : movementMode === "swimming" ? 4 : moving ? 9 : 24), 0, 100);
    onStamina(stamina);

    const groundY = getTerrainHeight(target.x, target.z);
    if (movementMode === "flying") {
      if (keys.has(" ") || keys.has("space")) playerHeight += delta * 7.2;
      if (keys.has("control")) playerHeight -= delta * 7.2;
      playerHeight = clamp(playerHeight, groundY + 2.4, 22);
      verticalVelocity = 0;
    } else if (movementMode === "swimming") {
      playerHeight = 0.22 + Math.sin(frame * 2.2) * 0.1;
      verticalVelocity = 0;
    } else {
      verticalVelocity -= 18 * delta;
      playerHeight += verticalVelocity * delta;
      if (playerHeight < groundY) {
        playerHeight = groundY;
        verticalVelocity = 0;
      }
    }

    const smooth = 1 - Math.pow(0.001, delta);
    player.position.x += (target.x - player.position.x) * smooth;
    player.position.z += (target.z - player.position.z) * smooth;
    player.position.y = playerHeight + (moving ? Math.sin(frame * 10) * 0.04 : Math.sin(frame * 2) * 0.02);

    const gaitSpeed = sprinting ? 13.5 : 9.2;
    const gait = Math.sin(frame * gaitSpeed);
    const counterGait = Math.sin(frame * gaitSpeed + Math.PI);
    const idle = Math.sin(frame * 2.4);
    const walkAmount = movementMode === "walking" && moving ? 1 : movementMode === "swimming" && moving ? 0.45 : 0;
    const flyAmount = movementMode === "flying" ? 1 : 0;

    if (player.userData.leftLeg && player.userData.rightLeg) {
      player.userData.leftLeg.rotation.x = gait * 0.62 * walkAmount - flyAmount * 0.32;
      player.userData.rightLeg.rotation.x = counterGait * 0.62 * walkAmount - flyAmount * 0.32;
      player.userData.leftLeg.rotation.z = flyAmount * 0.16;
      player.userData.rightLeg.rotation.z = -flyAmount * 0.16;
    }

    if (player.userData.leftArm && player.userData.rightArm) {
      player.userData.leftArm.rotation.x = counterGait * 0.52 * walkAmount - flyAmount * 0.78 + idle * 0.04;
      player.userData.rightArm.rotation.x = gait * 0.52 * walkAmount - flyAmount * 0.78 - idle * 0.04;
      player.userData.leftArm.rotation.z = -0.1 - flyAmount * 0.34;
      player.userData.rightArm.rotation.z = 0.1 + flyAmount * 0.34;
    }

    if (player.userData.scarf) {
      player.userData.scarf.rotation.z = Math.sin(frame * (moving ? 7 : 2.2)) * (moving ? 0.08 : 0.035);
    }

    if (player.userData.wingLeft && player.userData.wingRight) {
      const flap = Math.sin(frame * (movementMode === "flying" ? 5.2 : 2.4)) * (movementMode === "flying" ? 0.16 : 0.04);
      player.userData.wingLeft.rotation.z = 0.42 + flyAmount * 0.34 + flap;
      player.userData.wingRight.rotation.z = -0.42 - flyAmount * 0.34 - flap;
    }

    player.rotation.z = movementMode === "flying" ? Math.sin(frame * 2.6) * 0.025 : gait * 0.025 * walkAmount;

    const catOffset = new THREE.Vector3(-Math.cos(player.rotation.y) * 1.45, 0, Math.sin(player.rotation.y) * 1.45);
    const catTarget = player.position.clone().add(catOffset);
    catTarget.y = movementMode === "flying" ? player.position.y - 0.75 : getTerrainHeight(catTarget.x, catTarget.z) + 0.08;
    cat.position.lerp(catTarget, 1 - Math.pow(0.015, delta));
    cat.rotation.y = player.rotation.y + Math.sin(frame * 2.5) * 0.18;
    cat.rotation.z = moving ? Math.sin(frame * 9) * 0.08 : Math.sin(frame * 2) * 0.035;

    worldPoints.forEach((point, index) => {
      point.mesh.rotation.y += delta * (0.18 + (index % 4) * 0.04);
      point.mesh.position.y = point.position.y + Math.sin(frame * 1.2 + index) * 0.1;
    });

    water.position.y = 0.03 + Math.sin(frame * 1.4) * 0.02;
    waterRing.scale.setScalar(1 + Math.sin(frame * 1.8) * 0.014);
    clouds.rotation.y += delta * 0.018;
    skyRing.rotation.y += delta * 0.006;
    sparkles.rotation.y += delta * 0.025;
    petals.rotation.y += delta * 0.012;
    petals.position.y = Math.sin(frame * 0.55) * 0.16;
    goldenWisps.rotation.y -= delta * 0.018;
    goldenWisps.children.forEach((child, index) => {
      child.position.y += Math.sin(frame * 0.9 + index) * 0.0018;
      child.scale.setScalar(0.78 + Math.sin(frame * 1.5 + index) * 0.18);
    });
    waterShimmers.children.forEach((child, index) => {
      child.rotation.z += delta * (0.35 + (index % 5) * 0.07);
      child.scale.setScalar(0.8 + Math.sin(frame * 1.7 + index) * 0.18);
    });
    lightColumns.children.forEach((child, index) => {
      child.rotation.y += delta * (0.16 + index * 0.02);
      child.scale.y = 0.92 + Math.sin(frame * 1.15 + index) * 0.08;
    });
    backgroundHills.rotation.y += delta * 0.0025;

    const nearest = getNearestPoint();
    onNear(nearest?.node.id ?? "");

    mapUpdateTimer += delta;
    if (mapUpdateTimer > 0.08) {
      mapUpdateTimer = 0;
      onPlayerMove({
        x: clamp(((player.position.x + 27) / 54) * 100, 0, 100),
        y: clamp(((player.position.z + 27) / 54) * 100, 0, 100),
      });
    }

    const cameraDistance = movementMode === "flying" ? 16 : 12.2;
    const horizontalDistance = Math.cos(cameraPitch) * cameraDistance;
    const cameraOffset = new THREE.Vector3(
      Math.sin(cameraYaw) * -horizontalDistance,
      Math.sin(cameraPitch) * cameraDistance,
      Math.cos(cameraYaw) * -horizontalDistance
    );
    const desiredCamera = player.position.clone().add(cameraOffset);
    camera.position.lerp(desiredCamera, 1 - Math.pow(0.004, delta));
    const lookHeight = movementMode === "flying" ? 1.9 : 1.45;
    camera.lookAt(player.position.x, player.position.y + lookHeight, player.position.z);

    renderer.render(scene, camera);
    animationId = requestAnimationFrame(animate);
  }

  animate();

  const controls: WorldControls = {
    setMove: setMoveAxis,
    press: (key: string) => pressKey(key, false),
    release: releaseKey,
  };

  const cleanup = () => {
    delete mount.dataset.memoryWorldStarted;
    cancelAnimationFrame(animationId);
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
    window.removeEventListener("resize", handleResize);
    renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
    renderer.domElement.removeEventListener("pointermove", handlePointerMove);
    renderer.domElement.removeEventListener("pointerup", handlePointerUp);
    renderer.domElement.removeEventListener("click", handleClick);
    renderer.dispose();
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      }
    });
    if (renderer.domElement.parentNode === mount) {
      mount.removeChild(renderer.domElement);
    }
  };

  return { cleanup, controls };
}

function toWorldPosition(THREE: ThreeModule, node: MemoryWorldNode, index: number) {
  const angle = index * 1.37;
  const baseX = (node.x - 50) * 0.42;
  const baseZ = (node.y - 50) * 0.42;

  return new THREE.Vector3(
    clamp(baseX + Math.cos(angle) * 2.4, -24, 24),
    0,
    clamp(baseZ + Math.sin(angle) * 2.4, -24, 24)
  );
}

function createNodeLandmark(THREE: ThreeModule, node: MemoryWorldNode) {
  const group = new THREE.Group();
  const color = hexToNumber(node.color);
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.28,
    roughness: 0.58,
    metalness: 0.08,
  });
  const darkMaterial = new THREE.MeshStandardMaterial({
    color: 0x172033,
    roughness: 0.72,
    metalness: 0.1,
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.55, 0.48, 6), darkMaterial);
  base.position.y = 0.24;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  if (node.kind === "quest") {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.52, 3.2, 5), material);
    tower.position.y = 1.95;
    tower.castShadow = true;
    group.add(tower);

    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.72, 0), material);
    crystal.position.y = 3.9;
    crystal.castShadow = true;
    group.add(crystal);
  } else if (node.kind === "mood") {
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.86, 24, 18), material);
    orb.position.y = 1.75;
    orb.castShadow = true;
    group.add(orb);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.25, 0.035, 8, 42),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.55 })
    );
    ring.position.y = 1.75;
    ring.rotation.x = Math.PI / 2.6;
    group.add(ring);
  } else {
    const stone = new THREE.Mesh(new THREE.BoxGeometry(1.34, 2.45, 1.34), material);
    stone.position.y = 1.62;
    stone.rotation.y = Math.PI / 4;
    stone.castShadow = true;
    group.add(stone);

    const cap = new THREE.Mesh(new THREE.ConeGeometry(1.04, 1.1, 4), material);
    cap.position.y = 3.4;
    cap.rotation.y = Math.PI / 4;
    cap.castShadow = true;
    group.add(cap);
  }

  const glow = new THREE.PointLight(color, 1.8, 9);
  glow.position.y = 2.8;
  group.add(glow);

  return group;
}

function createGradientSkyDome(THREE: ThreeModule) {
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(110, 48, 24),
    new THREE.MeshBasicMaterial({
      color: 0x74cdf7,
      side: THREE.BackSide,
      depthWrite: false,
      transparent: true,
      opacity: 0.45,
    })
  );
  dome.position.y = 8;
  return dome;
}

function createIslandTerrain(THREE: ThreeModule) {
  const segments = 144;
  const rings = 28;
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const color = new THREE.Color();

  for (let ring = 0; ring <= rings; ring += 1) {
    const radius = (ring / rings) * 34;
    for (let segment = 0; segment < segments; segment += 1) {
      const angle = (segment / segments) * Math.PI * 2;
      const edgeSoftness = smoothstep(26, 34, radius);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const ripple = Math.sin(x * 0.32) * 0.035 + Math.cos(z * 0.28) * 0.035 + Math.sin((x + z) * 0.18) * 0.04;
      const y = ripple - edgeSoftness * 0.22;
      positions.push(x, y, z);

      const waterFade = 1 - clamp((Math.hypot(x - WATER_CENTER.x, z - WATER_CENTER.z) - WATER_RADIUS) / 5.5, 0, 1);
      const mountainFade = 1 - clamp(Math.hypot(x - MOUNTAIN_CENTER.x, z - MOUNTAIN_CENTER.z) / (MOUNTAIN_RADIUS + 8), 0, 1);
      if (waterFade > 0.18) {
        color.setRGB(0.22, 0.62, 0.56);
      } else if (mountainFade > 0.18) {
        color.setRGB(0.34, 0.58, 0.28);
      } else {
        color.setRGB(0.24 + Math.sin(angle) * 0.035, 0.62, 0.28 + Math.cos(radius) * 0.035);
      }
      colors.push(color.r, color.g, color.b);
    }
  }

  for (let ring = 0; ring < rings; ring += 1) {
    for (let segment = 0; segment < segments; segment += 1) {
      const current = ring * segments + segment;
      const next = ring * segments + ((segment + 1) % segments);
      const above = (ring + 1) * segments + segment;
      const aboveNext = (ring + 1) * segments + ((segment + 1) % segments);
      indices.push(current, above, next, next, above, aboveNext);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const terrain = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.96,
      metalness: 0,
    })
  );
  terrain.receiveShadow = true;
  return terrain;
}

function createSkyRing(THREE: ThreeModule) {
  const group = new THREE.Group();
  const colors = [0xffffff, 0xfff4c7, 0xdff8ff, 0xf7d3ff];

  for (let index = 0; index < 18; index += 1) {
    const angle = (index / 18) * Math.PI * 2;
    const star = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.16 + (index % 3) * 0.04, 0),
      new THREE.MeshBasicMaterial({ color: colors[index % colors.length], transparent: true, opacity: 0.75 })
    );
    star.position.set(Math.cos(angle) * 36, 9 + (index % 4) * 1.2, Math.sin(angle) * 36);
    star.rotation.y = angle;
    group.add(star);
  }

  return group;
}

function createCloudField(THREE: ThreeModule) {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.82 });

  for (let index = 0; index < 9; index += 1) {
    const cloud = new THREE.Group();
    const angle = index * 0.72;
    const radius = 24 + (index % 3) * 5;
    cloud.position.set(Math.cos(angle) * radius, 8.5 + (index % 4), Math.sin(angle) * radius);
    cloud.rotation.y = -angle;

    for (let part = 0; part < 5; part += 1) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.8 + (part % 2) * 0.32, 16, 10), material);
      puff.position.set((part - 2) * 0.72, Math.sin(part) * 0.16, Math.cos(part) * 0.16);
      puff.scale.y = 0.5;
      cloud.add(puff);
    }

    group.add(cloud);
  }

  return group;
}

function createBackgroundHills(THREE: ThreeModule) {
  const group = new THREE.Group();
  const materials = [0x6ebd78, 0x68b99a, 0x7ab7dc].map((color) =>
    new THREE.MeshToonMaterial({ color, transparent: true, opacity: 0.34, depthWrite: false })
  );

  for (let index = 0; index < 18; index += 1) {
    const angle = (index / 18) * Math.PI * 2;
    const radius = 72 + (index % 3) * 9;
    const hill = new THREE.Mesh(
      new THREE.ConeGeometry(6 + (index % 4) * 1.2, 7 + (index % 5) * 1.2, 7),
      materials[index % materials.length]
    );
    hill.position.set(Math.cos(angle) * radius, -2.2, Math.sin(angle) * radius);
    hill.rotation.y = -angle + Math.PI / 7;
    hill.scale.z = 0.62;
    group.add(hill);
  }

  return group;
}

function createWaterShimmers(THREE: ThreeModule) {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({
    color: 0xf0fdff,
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
  });

  for (let index = 0; index < 22; index += 1) {
    const angle = index * 2.41;
    const radius = 1.2 + (index % 9) * 0.72;
    const shimmer = new THREE.Mesh(new THREE.PlaneGeometry(0.55 + (index % 4) * 0.18, 0.035), material);
    shimmer.position.set(
      WATER_CENTER.x + Math.cos(angle) * radius,
      0.095,
      WATER_CENTER.z + Math.sin(angle) * radius
    );
    shimmer.rotation.x = -Math.PI / 2;
    shimmer.rotation.z = angle;
    group.add(shimmer);
  }

  return group;
}

function createBridge(THREE: ThreeModule) {
  const group = new THREE.Group();
  const wood = toonMaterial(THREE, 0xb77944);
  const rail = toonMaterial(THREE, 0x6b3f25);

  for (let index = 0; index < 7; index += 1) {
    const plank = outlinedMesh(THREE, new THREE.BoxGeometry(0.58, 0.12, 2.5), wood, 1.035);
    plank.group.position.set(WATER_CENTER.x - 3.1 + index * 0.62, 0.18 + Math.sin((index / 6) * Math.PI) * 0.36, WATER_CENTER.z - 7.15);
    plank.group.rotation.z = Math.sin((index / 6) * Math.PI) * 0.08;
    group.add(plank.group);
  }

  for (const side of [-1, 1]) {
    const beam = outlinedMesh(THREE, new THREE.BoxGeometry(4.8, 0.1, 0.16), rail, 1.04);
    beam.group.position.set(WATER_CENTER.x - 1.2, 0.72, WATER_CENTER.z - 7.15 + side * 1.22);
    beam.group.rotation.z = 0.08;
    group.add(beam.group);

    for (let index = 0; index < 4; index += 1) {
      const post = outlinedMesh(THREE, new THREE.CylinderGeometry(0.055, 0.065, 0.62, 6), rail, 1.05);
      post.group.position.set(WATER_CENTER.x - 3.0 + index * 1.25, 0.48, WATER_CENTER.z - 7.15 + side * 1.22);
      group.add(post.group);
    }
  }

  group.rotation.y = -0.18;
  return group;
}

function createSparkles(THREE: ThreeModule) {
  const positions: number[] = [];
  const colors: number[] = [];
  const palette = [new THREE.Color(0xffffff), new THREE.Color(0xcffafe), new THREE.Color(0xffedd5)];

  for (let index = 0; index < 180; index += 1) {
    const angle = index * 2.399;
    const radius = 8 + (index % 55) * 0.52;
    positions.push(Math.cos(angle) * radius, 1.8 + ((index * 7) % 80) * 0.08, Math.sin(angle) * radius);
    const color = palette[index % palette.length];
    colors.push(color.r, color.g, color.b);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size: 0.09,
      vertexColors: true,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
    })
  );
}

function createGoldenWisps(THREE: ThreeModule) {
  const group = new THREE.Group();
  const materials = [0xfff7ad, 0xe0fbff, 0xffd6e7].map(
    (color) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.64, depthWrite: false })
  );

  for (let index = 0; index < 54; index += 1) {
    const angle = index * 2.08;
    const radius = 7 + (index % 28) * 0.78;
    const wisp = new THREE.Mesh(new THREE.SphereGeometry(0.055 + (index % 3) * 0.018, 10, 8), materials[index % materials.length]);
    wisp.position.set(Math.cos(angle) * radius, 1.2 + (index % 16) * 0.28, Math.sin(angle) * radius);
    group.add(wisp);
  }

  return group;
}

function createPetalField(THREE: ThreeModule) {
  const group = new THREE.Group();
  const materials = [0xffc7dd, 0xfff0f6, 0xffdfa8].map(
    (color) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72, depthWrite: false })
  );

  for (let index = 0; index < 70; index += 1) {
    const angle = index * 2.31;
    const radius = 5 + (index % 34) * 0.72;
    const petal = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.28), materials[index % materials.length]);
    petal.position.set(Math.cos(angle) * radius, 2.2 + (index % 23) * 0.18, Math.sin(angle) * radius);
    petal.rotation.set(Math.sin(index) * 0.9, angle, Math.cos(index) * 0.8);
    group.add(petal);
  }

  return group;
}

function createFlowerMeadow(THREE: ThreeModule) {
  const group = new THREE.Group();
  const petalMats = [0xff9fcf, 0xffef8a, 0xb3f5ff, 0xffffff, 0xd8b4fe].map((color) => toonMaterial(THREE, color));
  const centerMat = toonMaterial(THREE, 0xffb84d);
  const leafMat = toonMaterial(THREE, 0x42c777);

  for (let index = 0; index < 58; index += 1) {
    const angle = index * 2.399;
    const radius = 6 + (index % 32) * 0.62;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (Math.hypot(x - WATER_CENTER.x, z - WATER_CENTER.z) < WATER_RADIUS + 0.8) continue;
    if (Math.hypot(x - MOUNTAIN_CENTER.x, z - MOUNTAIN_CENTER.z) < MOUNTAIN_RADIUS * 0.72) continue;

    const flower = new THREE.Group();
    const y = getTerrainHeight(x, z) + 0.06;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.44, 5), leafMat);
    stem.position.y = 0.22;
    flower.add(stem);

    for (let petalIndex = 0; petalIndex < 5; petalIndex += 1) {
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), petalMats[(index + petalIndex) % petalMats.length]);
      const petalAngle = (petalIndex / 5) * Math.PI * 2;
      petal.position.set(Math.cos(petalAngle) * 0.065, 0.47 + Math.sin(petalAngle) * 0.012, Math.sin(petalAngle) * 0.065);
      petal.scale.set(1.1, 0.42, 0.82);
      flower.add(petal);
    }

    const center = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), centerMat);
    center.position.y = 0.47;
    flower.add(center);

    flower.position.set(x, y, z);
    flower.rotation.y = angle;
    flower.scale.setScalar(0.72 + (index % 4) * 0.08);
    group.add(flower);
  }

  return group;
}

function createLightColumns(THREE: ThreeModule, nodes: MemoryWorldNode[]) {
  const group = new THREE.Group();
  nodes.forEach((node, index) => {
    const position = toWorldPosition(THREE, node, index);
    const color = hexToNumber(node.color);
    const column = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 1.15, 10, 32, 1, true),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.13,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    column.position.set(position.x, getTerrainHeight(position.x, position.z) + 5.2, position.z);
    group.add(column);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(1.7, 0.035, 8, 72),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.54, depthWrite: false })
    );
    halo.position.set(position.x, getTerrainHeight(position.x, position.z) + 0.18, position.z);
    halo.rotation.x = Math.PI / 2;
    group.add(halo);
  });

  return group;
}

function createGrassAndFlowers(THREE: ThreeModule) {
  const group = new THREE.Group();
  const grassMat = toonMaterial(THREE, 0x2fbf66);
  const flowerMats = [0xffb4d6, 0xfff1a8, 0xbde9ff, 0xffffff].map((color) => toonMaterial(THREE, color));

  for (let index = 0; index < 120; index += 1) {
    const angle = index * 2.17;
    const radius = 4 + (index % 52) * 0.52;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (Math.hypot(x - WATER_CENTER.x, z - WATER_CENTER.z) < WATER_RADIUS + 0.6) continue;
    if (Math.hypot(x - MOUNTAIN_CENTER.x, z - MOUNTAIN_CENTER.z) < MOUNTAIN_RADIUS * 0.68) continue;

    const y = getTerrainHeight(x, z);
    const stem = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.42 + (index % 4) * 0.08, 4), grassMat);
    stem.position.set(x, y + 0.2, z);
    stem.rotation.z = Math.sin(index) * 0.32;
    stem.rotation.y = angle;
    group.add(stem);

    if (index % 5 === 0) {
      const flower = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), flowerMats[index % flowerMats.length]);
      flower.position.set(x, y + 0.48, z);
      group.add(flower);
    }
  }

  return group;
}

function createCompanionCat(THREE: ThreeModule) {
  const group = new THREE.Group();
  const white = toonMaterial(THREE, 0xfffbf0);
  const dark = toonMaterial(THREE, 0x2b2522);
  const pink = toonMaterial(THREE, 0xffb3bf);
  const eye = new THREE.MeshBasicMaterial({ color: 0x101827 });

  const body = outlinedMesh(THREE, new THREE.SphereGeometry(0.34, 18, 12), dark, 1.08);
  body.group.position.y = 0.42;
  body.group.scale.set(1.25, 0.82, 0.72);
  group.add(body.group);

  const chest = outlinedMesh(THREE, new THREE.SphereGeometry(0.22, 16, 10), white, 1.05);
  chest.group.position.set(0, 0.44, 0.27);
  group.add(chest.group);

  const head = outlinedMesh(THREE, new THREE.SphereGeometry(0.26, 18, 12), white, 1.08);
  head.group.position.set(0, 0.78, 0.26);
  group.add(head.group);

  const leftEar = outlinedMesh(THREE, new THREE.ConeGeometry(0.105, 0.26, 3), white, 1.08);
  leftEar.group.position.set(-0.16, 1.0, 0.22);
  leftEar.group.rotation.z = 0.28;
  group.add(leftEar.group);

  const rightEar = outlinedMesh(THREE, new THREE.ConeGeometry(0.105, 0.26, 3), white, 1.08);
  rightEar.group.position.set(0.16, 1.0, 0.22);
  rightEar.group.rotation.z = -0.28;
  group.add(rightEar.group);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), pink);
  nose.position.set(0, 0.75, 0.51);
  group.add(nose);

  const leftEye = new THREE.Mesh(new THREE.CircleGeometry(0.035, 12), eye);
  leftEye.position.set(-0.09, 0.83, 0.49);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(new THREE.CircleGeometry(0.035, 12), eye);
  rightEye.position.set(0.09, 0.83, 0.49);
  group.add(rightEye);

  const tail = outlinedMesh(THREE, new THREE.TorusGeometry(0.22, 0.045, 8, 28, Math.PI * 1.25), dark, 1.06);
  tail.group.position.set(0.42, 0.56, -0.18);
  tail.group.rotation.set(Math.PI * 0.2, -0.4, Math.PI * 0.25);
  group.add(tail.group);

  group.scale.setScalar(0.92);
  return group;
}

function createPlayer(THREE: ThreeModule): AnimatedPlayer {
  const group = new THREE.Group() as AnimatedPlayer;
  const skin = toonMaterial(THREE, 0xffd8bf);
  const hairMat = toonMaterial(THREE, 0x9c866f);
  const shirtMat = toonMaterial(THREE, 0x2563eb);
  const jacketMat = toonMaterial(THREE, 0xf8fbff);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x101827 });
  const blushMat = new THREE.MeshBasicMaterial({ color: 0xf2a3a7, transparent: true, opacity: 0.62 });

  const body = outlinedMesh(THREE, new THREE.CapsuleGeometry(0.4, 0.8, 8, 18), shirtMat, 1.06);
  body.group.position.y = 0.95;
  body.mesh.castShadow = true;
  group.add(body.group);

  const jacketLeft = outlinedMesh(THREE, new THREE.BoxGeometry(0.18, 0.82, 0.12), jacketMat, 1.08);
  jacketLeft.group.position.set(-0.32, 0.98, 0.08);
  jacketLeft.group.rotation.z = -0.08;
  group.add(jacketLeft.group);

  const jacketRight = outlinedMesh(THREE, new THREE.BoxGeometry(0.18, 0.82, 0.12), jacketMat, 1.08);
  jacketRight.group.position.set(0.32, 0.98, 0.08);
  jacketRight.group.rotation.z = 0.08;
  group.add(jacketRight.group);

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.48, 1.23, 0.02);
  const leftSleeve = outlinedMesh(THREE, new THREE.CapsuleGeometry(0.105, 0.54, 5, 10), jacketMat, 1.08);
  leftSleeve.group.position.y = -0.32;
  leftSleeve.group.rotation.z = 0.08;
  leftArm.add(leftSleeve.group);
  const leftHand = outlinedMesh(THREE, new THREE.SphereGeometry(0.105, 12, 8), skin, 1.06);
  leftHand.group.position.y = -0.68;
  leftArm.add(leftHand.group);
  group.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.48, 1.23, 0.02);
  const rightSleeve = outlinedMesh(THREE, new THREE.CapsuleGeometry(0.105, 0.54, 5, 10), jacketMat, 1.08);
  rightSleeve.group.position.y = -0.32;
  rightSleeve.group.rotation.z = -0.08;
  rightArm.add(rightSleeve.group);
  const rightHand = outlinedMesh(THREE, new THREE.SphereGeometry(0.105, 12, 8), skin, 1.06);
  rightHand.group.position.y = -0.68;
  rightArm.add(rightHand.group);
  group.add(rightArm);

  const legMat = toonMaterial(THREE, 0x1d4ed8);
  const shoeMat = toonMaterial(THREE, 0x172033);

  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.17, 0.58, 0);
  const leftPants = outlinedMesh(THREE, new THREE.CapsuleGeometry(0.12, 0.58, 5, 10), legMat, 1.08);
  leftPants.group.position.y = -0.34;
  leftLeg.add(leftPants.group);
  const leftShoe = outlinedMesh(THREE, new THREE.BoxGeometry(0.22, 0.11, 0.36), shoeMat, 1.08);
  leftShoe.group.position.set(0, -0.72, 0.08);
  leftLeg.add(leftShoe.group);
  group.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.17, 0.58, 0);
  const rightPants = outlinedMesh(THREE, new THREE.CapsuleGeometry(0.12, 0.58, 5, 10), legMat, 1.08);
  rightPants.group.position.y = -0.34;
  rightLeg.add(rightPants.group);
  const rightShoe = outlinedMesh(THREE, new THREE.BoxGeometry(0.22, 0.11, 0.36), shoeMat, 1.08);
  rightShoe.group.position.set(0, -0.72, 0.08);
  rightLeg.add(rightShoe.group);
  group.add(rightLeg);

  const head = outlinedMesh(THREE, new THREE.SphereGeometry(0.42, 32, 20), skin, 1.045);
  head.group.position.y = 1.82;
  head.mesh.castShadow = true;
  group.add(head.group);

  const hairCap = outlinedMesh(THREE, new THREE.SphereGeometry(0.45, 32, 12, 0, Math.PI * 2, 0, Math.PI * 0.58), hairMat, 1.04);
  hairCap.group.position.set(0, 1.98, -0.04);
  hairCap.group.rotation.x = -0.3;
  group.add(hairCap.group);

  for (let index = 0; index < 8; index += 1) {
    const strand = outlinedMesh(THREE, new THREE.ConeGeometry(0.08 + (index % 2) * 0.025, 0.52, 5), hairMat, 1.08);
    strand.group.position.set(-0.32 + index * 0.09, 1.9 - Math.abs(index - 3.5) * 0.015, 0.33);
    strand.group.rotation.x = Math.PI * 0.55;
    strand.group.rotation.z = -0.38 + index * 0.11;
    group.add(strand.group);
  }

  const leftEye = new THREE.Mesh(new THREE.CircleGeometry(0.055, 18), eyeMat);
  leftEye.position.set(-0.15, 1.84, 0.395);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(new THREE.CircleGeometry(0.055, 18), eyeMat);
  rightEye.position.set(0.15, 1.84, 0.395);
  group.add(rightEye);

  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.012, 6, 24, Math.PI), eyeMat);
  smile.position.set(0, 1.68, 0.4);
  smile.rotation.z = Math.PI;
  group.add(smile);

  const leftBlush = new THREE.Mesh(new THREE.CircleGeometry(0.06, 16), blushMat);
  leftBlush.position.set(-0.26, 1.73, 0.392);
  group.add(leftBlush);

  const rightBlush = new THREE.Mesh(new THREE.CircleGeometry(0.06, 16), blushMat);
  rightBlush.position.set(0.26, 1.73, 0.392);
  group.add(rightBlush);

  const scarf = outlinedMesh(THREE, new THREE.TorusGeometry(0.34, 0.045, 8, 36), toonMaterial(THREE, 0xf97316), 1.05);
  scarf.group.position.y = 1.42;
  scarf.group.rotation.x = Math.PI / 2;
  group.add(scarf.group);

  const wingLeft = outlinedMesh(THREE, new THREE.ConeGeometry(0.22, 0.95, 4), jacketMat, 1.05);
  wingLeft.group.position.set(-0.46, 0.92, -0.25);
  wingLeft.group.rotation.set(0.62, 0.1, 0.42);
  group.add(wingLeft.group);

  const wingRight = outlinedMesh(THREE, new THREE.ConeGeometry(0.22, 0.95, 4), jacketMat, 1.05);
  wingRight.group.position.set(0.46, 0.92, -0.25);
  wingRight.group.rotation.set(0.62, -0.1, -0.42);
  group.add(wingRight.group);

  group.userData.leftArm = leftArm;
  group.userData.rightArm = rightArm;
  group.userData.leftLeg = leftLeg;
  group.userData.rightLeg = rightLeg;
  group.userData.scarf = scarf.group;
  group.userData.wingLeft = wingLeft.group;
  group.userData.wingRight = wingRight.group;

  return group;
}
