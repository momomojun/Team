"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import type { ExpressionSpecification, GeoJSONSource, Map as MapLibreMap, Marker } from "maplibre-gl";
import { useEffect, useEffectEvent, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import {
  bearingOf,
  bounds,
  chapterStep,
  clockText,
  distanceAt,
  fade,
  flyMs,
  followZoom,
  planDay,
  progressAt,
  seekTarget,
  segmentOf,
  segmentStarts,
  sliceTo,
  slowness,
  TOUR_SPEEDS,
  tourTimeline,
  turnToward,
  type DayPlan,
  type TourDay,
  type TourNarration,
  type TourSegment,
  type TourStop,
  type TourWhere,
} from "./route-tour";
import { fill } from "@/i18n/format";
import { readingMs, sentences } from "@/lib/narration";
import { Score } from "@/lib/score";
import { Narrator, warmVoices } from "@/lib/speech";
import { PhotoReel, preloadPhotos } from "./stop-montage";
import { EOX_ATTRIBUTION, EOX_IMAGERY_TILES, IMAGERY_TILES, STYLE_URL, TERRAIN_TILES, type Imagery } from "./sources";

export interface MapPoint {
  id: string;
  lat: number;
  lon: number;
  label: string;
  /** 第二行小字，一般是英文名，方便对照 Google Maps */
  sublabel?: string;
  color: string;
  /** 必去景点画大一点，标签优先显示 */
  emphasis?: boolean;
  /** 圆点里显示的字：行程序号，或住处的“住” */
  badge?: string;
  /** 小白点（步道口），不显示标签、不能点 */
  small?: boolean;
  /** 营地画成帐篷，和景点的圆点分开 */
  shape?: "camp";
}

export interface MapTrail {
  id: string;
  /** [经度, 纬度] */
  path: [number, number][];
}

/** 一段开车路线：拿到真实道路就画实线，还没拿到时按游览顺序用虚线连起来 */
export interface MapLeg {
  id: string;
  color: string;
  /** [经度, 纬度] */
  path: [number, number][];
  /** 只是按顺序连起来的直线，不是实际道路 */
  straight?: boolean;
}

export interface MapText {
  map: string;
  satellite: string;
  terrain: string;
  routeNote: string;
  loading: string;
  trailLegend: string;
  roadLegend: string;
  campLegend: string;
  /** 路线动画的按钮 */
  tourPlay: string;
  tourPause: string;
  tourResume: string;
  tourSkip: string;
  tourDay: string;
  /** 最后拉远看全程时控制条上的字 */
  tourAll: string;
  /** 讲解卡片照片上的小字“第 3 站” */
  tourStopNo: string;
  /** 讲解版（全屏、逐站讲解、朗读） */
  tourNarrate: string;
  tourMute: string;
  /** 讲解版的配乐 */
  tourMusicOff: string;
  tourMusicOn: string;
  tourUnmute: string;
  /** 讲解版的进度条和按钮 */
  tourSeek: string;
  tourPrev: string;
  tourNext: string;
  tourSpeed: string;
  tourExit: string;
  /** 进度条上开车那一段的提示：“开往{name}” */
  tourToward: string;
}

/** 请地图自动播一次路线动画：key 变了才播；days 是要播的那几天（改了行程只播变了的） */
export interface TourRequest {
  key: string;
  days: number[];
}

// 动画的节奏：每天先出章节字幕、镜头飞到起点，再跟着车沿路线开（进站减速、到站停一下），
// 一天开完镜头拉回来看这一天的全程，最后拉远看整趟
const HOLD_MS = 1600;
const ARRIVE_MS = 900;
const FINALE_MS = 2200;
const FOLLOW_FLY_MS = 2200;
// 跟车的镜头：倾斜着从车后上方看，车在画面中下部，转向车开的方向（像追车的航拍）
const FOLLOW_PITCH = 50;
// 讲解版：打开 3D 地形，跟车压得更低一点；到站、每天开头讲话时镜头绕着这个地方慢慢转（航拍的环绕镜头）
const NARRATED_PITCH = 58;
const ORBIT_PITCH = 66;
/** 环绕的速度：每毫秒转多少度（每秒 3.5 度，一站讲 30 秒转大约 100 度） */
const ORBIT_DEG_PER_MS = 0.0035;
/** 环绕时比跟车拉近多少级，最近到 15 级 */
const ORBIT_ZOOM_IN = 0.9;
const ORBIT_MAX_ZOOM = 15;
const TERRAIN_EXAGGERATION = 1.3;
/** 视线检查多久做一次（毫秒）：每次沿视线查二十几个点的地形高度 */
const SIGHT_EVERY_MS = 250;
/** 山挡视线时最多抬到从这个角度往下看（再低于这个倾角就是几乎正上方） */
const SIGHT_MIN_PITCH = 28;
// 配乐开不开记在这台设备上
const MUSIC_KEY = "nps-tour-music";
// 跟车时设过的焦点偏移，停下来要清掉（MapLibre 会一直记着，之后缩放、拉近都会偏）
const NO_PADDING = { top: 0, bottom: 0, left: 0, right: 0 };
// 系统设了“减少动画”就不跟车、不倾斜，整天一个固定的视角，线照样画
const TOUR_PITCH = 38;
// 播放时其他天的景点淡下去，突出这一天
const DIM = 0.18;
// 路线还没查到真实道路时最多等这么久，再不来就按直线播
const ROUTE_WAIT_MS = 6000;

// 讲解版的倍速记在这台设备上
const SPEED_KEY = "nps-tour-speed";

interface TourState {
  days: TourDay[];
  index: number;
  phase: "intro" | "fly" | "draw" | "hold" | "finale";
  phaseStart: number;
  /** 动画自己的钟（毫秒）：每帧按倍速往前走，暂停时不走；phaseStart、arriveUntil 都按这个钟 */
  clock: number;
  /** 上一帧的时间：到站停一下时把这段时间从画线的进度里扣掉 */
  last: number;
  arriveUntil: number;
  calm: boolean;
  /** 讲解版：到站停下来念完才走；念的时候 speaking 是 true */
  narrated: boolean;
  speaking: boolean;
  /** 第几次开始念：念完要做的事只给最后一次（被新的一段顶掉、拖了进度条的不做） */
  voice: number;
  /** 这一站的卡片还开着（开出这一站就收起来） */
  carded: boolean;
  /** 每天怎么播、进度条上的各段和每段从第几毫秒开始、现在播到第几毫秒、车开到这一天的第几公里 */
  plans: DayPlan[];
  timeline: TourSegment[];
  starts: number[];
  position: number;
  distance: number;
  /** 跟车：每个路线点的累计播放量、这一天播多久、镜头现在的位置、缩放和方向 */
  cost: number[];
  dayMs: number;
  camera: { center: [number, number]; zoom: number; bearing: number; pitch?: number } | null;
  /** 讲解版自己打开的 3D 地形：结束时关回去 */
  terrainAdded: boolean;
  /** 视线检查的结果：最多能倾斜到几度才不被山挡住（at 是上次查的时间） */
  sight: { at: number; cap: number } | null;
  pausedAt: number | null;
  raf: number;
  cum: number[];
  total: number;
  stopKm: number[];
  shown: number;
  done: GeoJSON.Feature[];
  markers: Marker[];
}

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** 车头开到一站时弹出的小牌子（弹一下出来，下面一圈波纹）；用 textContent 填字，不拼 HTML */
function captionElement(label: string, caption: string, lodging: boolean, color: string, badge: string): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.className = "pointer-events-none relative flex flex-col items-center";
  const card = document.createElement("div");
  card.className = `tour-pop flex items-center gap-2 whitespace-nowrap border py-1 pr-2.5 pl-1 text-[11px] leading-4 ${
    lodging ? "border-ink bg-ink text-paper" : "border-ink/15 bg-paper text-ink"
  }`;
  const number = document.createElement("span");
  number.className = "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white";
  number.style.backgroundColor = lodging ? "transparent" : color;
  number.style.border = lodging ? "1px solid rgba(244,239,231,.6)" : "none";
  number.textContent = badge;
  const text = document.createElement("div");
  const name = document.createElement("div");
  name.className = "font-medium";
  name.textContent = label;
  const line = document.createElement("div");
  line.className = lodging ? "text-paper/75" : "text-ink-soft";
  line.textContent = caption;
  text.append(name, line);
  card.append(number, text);
  const ring = document.createElement("span");
  ring.className = "tour-ring absolute -bottom-[22px] size-4 rounded-full";
  ring.style.boxShadow = `0 0 0 2px ${color}`;
  wrap.append(card, ring);
  return wrap;
}

// 播放时淡下去的图层：{图层: 要改的透明度属性}
type PaintName = Parameters<MapLibreMap["setPaintProperty"]>[1];
const DIM_LAYERS: [string, PaintName[]][] = [
  ["points", ["circle-opacity", "circle-stroke-opacity"]],
  ["points-badge", ["text-opacity"]],
  ["points-label", ["text-opacity"]],
  ["camps", ["icon-opacity", "text-opacity"]],
  ["trails", ["line-opacity"]],
];

// worker 文件由 scripts/copy-maplibre-worker.mjs 复制到 public/
const WORKER_URL = "/maplibre/maplibre-gl-worker.mjs";

// 步道用砂岩红，选中的步道加深加粗；开车路线用深石板蓝
const TRAIL_COLOR = "#b85f3c";
const TRAIL_HIGHLIGHT = "#6b2a16";
export const ROAD_COLOR = "#2f4a5a";

const EMPTY: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };
// 景点名字的颜色（maplibre-cartography）：矢量底图上深色字、半透明的浅色描边；卫星图上背景忽明忽暗，白字、半透明的深色描边
const LABEL_PAINT = {
  vector: { text: "#1c1b18", halo: "rgba(244,239,231,0.85)", width: 1.5 },
  imagery: { text: "#ffffff", halo: "rgba(0,0,0,0.75)", width: 1.2 },
};
const LABEL_LAYERS = ["points-label", "camps"];
const CAMP_COLOR = "#3f6b4e";

/** 帐篷图标：营地用这个，景点仍是圆点 */
function campTentImage(): ImageData {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new ImageData(size, size);
  ctx.beginPath();
  ctx.moveTo(32, 6);
  ctx.lineTo(58, 56);
  ctx.lineTo(6, 56);
  ctx.closePath();
  ctx.fillStyle = CAMP_COLOR;
  ctx.fill();
  ctx.lineJoin = "round";
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(32, 56);
  ctx.lineTo(32, 30);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#f4efe7";
  ctx.stroke();
  return ctx.getImageData(0, 0, size, size);
}

function pointsToGeoJSON(points: MapPoint[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: points.map((point) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [point.lon, point.lat] },
      properties: {
        id: point.id,
        label: point.label,
        color: point.color,
        emphasis: point.emphasis ?? false,
        small: point.small ?? false,
        ...(point.sublabel ? { sublabel: point.sublabel } : {}),
        ...(point.badge === undefined ? {} : { badge: point.badge }),
        ...(point.shape === "camp" ? { camp: true } : {}),
      },
    })),
  };
}

function linesToGeoJSON(
  lines: { id: string; coordinates: [number, number][]; color?: string; straight?: boolean }[],
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: lines
      .filter((line) => line.coordinates.length > 1)
      .map((line) => ({
        type: "Feature",
        geometry: { type: "LineString", coordinates: line.coordinates },
        properties: { id: line.id, color: line.color ?? ROAD_COLOR, straight: line.straight ?? false },
      })),
  };
}

function fitToPoints(map: MapLibreMap, points: MapPoint[], animate: boolean) {
  if (points.length === 0) return;
  const duration = animate ? 600 : 0;
  if (points.length === 1) {
    map.easeTo({ center: [points[0].lon, points[0].lat], zoom: 11, duration });
    return;
  }
  const lons = points.map((p) => p.lon);
  const lats = points.map((p) => p.lat);
  map.fitBounds(
    [
      [Math.min(...lons), Math.min(...lats)],
      [Math.max(...lons), Math.max(...lats)],
    ],
    { padding: 64, maxZoom: 13, duration },
  );
}

/** 讲解卡片里的几行：小标题（看点、怎么玩……）+ 一句大白话 */
function NarrationLines({ lines }: { lines: { label: string; text: string }[] }) {
  return (
    <dl className="mt-4 space-y-3">
      {lines.map((line) => (
        <div key={line.label + line.text}>
          {line.label && <dt className="text-[11px] tracking-[0.08em] text-mute">{line.label}</dt>}
          <dd className="mt-0.5 text-[14px] leading-6 text-ink lining-nums">{line.text}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ParkMap({
  points,
  selectedId = null,
  onSelect,
  trails,
  highlightTrailId = null,
  legs,
  legend,
  fitKey = "",
  extras,
  extrasLegend,
  imagery = "usgs",
  tour,
  tourRequest = null,
  tourSummary,
  hoverId = null,
  narration,
  text,
  className = "",
  children,
}: {
  points: MapPoint[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** 徒步路线 */
  trails?: MapTrail[];
  /** 高亮哪条步道（一般是选中的景点） */
  highlightTrailId?: string | null;
  /** 开车路线（行程模式），整个行程时每天一段、各用一种颜色 */
  legs?: MapLeg[];
  /** 图例：每天的颜色；不填时有实线路线就显示“开车路线” */
  legend?: { color: string; label: string }[];
  /** 变了就重新缩放到全部点（比如切换显示哪一天），点的集合变了也会重新缩放 */
  fitKey?: string;
  /** 额外叠加的一层小点（比如补给点）：不参与缩放、不能点，放大后才显示名字 */
  extras?: MapPoint[];
  /** 这层小点的图例 */
  extrasLegend?: { color: string; label: string }[];
  /** 卫星图：美国用 USGS，加拿大的公园用 EOX（USGS 不覆盖加拿大） */
  imagery?: Imagery;
  /** 路线动画用的每一天（排好的行程才有）；有就显示“播放路线” */
  tour?: TourDay[];
  /** 请地图自动播一次（第一次排出行程、改了行程时） */
  tourRequest?: TourRequest | null;
  /** 动画最后拉远看全程时的一句总结，比如“4 天，14 个景点，开车约 9 小时 40 分” */
  tourSummary?: string;
  /** 鼠标停在列表里的哪个景点上：地图拉近到它，移开以后回到原来的范围 */
  hoverId?: string | null;
  /** 有就显示“讲解版”：全屏、逐站讲解、朗读（开头和结尾的话在这里，每一天、每一站的在 tour 里） */
  narration?: TourNarration & { onStart?: () => void };
  text: MapText;
  className?: string;
  /** 叠在地图上的内容，比如选中景点的卡片 */
  children?: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  // 只有点的集合变了才重新缩放，改状态、切选中不会让地图乱跳
  const fittedKeyRef = useRef("");
  const [ready, setReady] = useState(false);
  const [satellite, setSatellite] = useState(false);
  const [terrain, setTerrain] = useState(false);
  const terrainRef = useRef(false);
  const satelliteRef = useRef(false);
  const markerClass = useRef<typeof Marker | null>(null);
  const tourRef = useRef<TourState | null>(null);
  const pointsRef = useRef(points);
  const [tourUi, setTourUi] = useState<{
    index: number;
    days: { day: number; color: string }[];
    title: string;
    heading?: string;
    date?: string;
    subtitle?: string;
    color: string;
    /** 每天开头的大字卡片显示着 */
    card: boolean;
    /** 最后拉远看全程 */
    finale: boolean;
    paused: boolean;
    dusk: boolean;
  } | null>(null);
  // 底下那条细细的进度条：每帧直接改宽度，不经过 React
  const progressRef = useRef<HTMLDivElement>(null);
  // 讲解版：铺满全屏、旁边的卡片（开头、某一天、某一站、结尾）、底部字幕、朗读
  const rootRef = useRef<HTMLDivElement>(null);
  const narratorRef = useRef<Narrator | null>(null);
  const [immersive, setImmersive] = useState(false);
  // 帧循环里要知道左边（电脑）、下面（手机）有没有讲解卡片（闭包里的 state 是开始那一刻的，用 ref）
  const sidePanel = useRef(0);
  const bottomPanel = useRef(0);
  const [beat, setBeat] = useState<
    | { kind: "intro" }
    | { kind: "day"; day: TourDay }
    | { kind: "stop"; stop: TourStop; index: number; color: string }
    | { kind: "outro" }
    | null
  >(null);
  const [caption, setCaption] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  // 配乐（src/lib/score.ts，浏览器里现场合成）：开不开记在这台设备上，默认开
  const scoreRef = useRef<Score | null>(null);
  // 只在讲解版的控制条（点了才有）上用到，服务端渲染时不出现，直接读本机设置不会对不上
  const [music, setMusic] = useState(() => {
    try {
      return typeof window === "undefined" || localStorage.getItem(MUSIC_KEY) !== "off";
    } catch {
      return true;
    }
  });
  // 讲解版的进度条：分成哪几段（开头、每天开场、开车、各站、结尾），拖动时手指 / 鼠标在哪；倍速
  const [track, setTrack] = useState<{ days: TourDay[]; timeline: TourSegment[]; starts: number[] } | null>(null);
  const [scrub, setScrub] = useState<number | null>(null);
  const scrubbing = useRef(false);
  const seekTrackRef = useRef<HTMLDivElement>(null);
  const seekFillRef = useRef<HTMLDivElement>(null);
  const seekKnobRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const [speed, setSpeed] = useState(1);
  const speedRef = useRef(1);
  // 悬停拉近以前的视角，移开以后回到这里
  const beforeHover = useRef<{ center: [number, number]; zoom: number; bearing: number; pitch: number } | null>(null);
  const selectedRef = useRef(selectedId);
  // 地图在不在屏幕上：自动播放要等看得见了再播
  const [visible, setVisible] = useState(false);
  const playedKey = useRef("");
  // 这次自动播放的请求是什么时候来的（等路线查到最多等 6 秒）；tick 用来到点了再看一次
  const requestStart = useRef<{ key: string; at: number } | null>(null);
  const [tick, setTick] = useState(0);

  const handleSelect = useEffectEvent((id: string) => onSelect?.(id));

  // 地图快滚到屏幕里（上下 800 像素以内）才加载：maplibre-gl 有 1 MB，公园页的地图在很下面，一打开就加载手机上要卡好几秒
  const [near, setNear] = useState(false);
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // 地图只初始化一次；maplibre-gl 依赖浏览器环境，动态加载
  useEffect(() => {
    if (!near) return;
    let cancelled = false;
    let map: MapLibreMap | undefined;

    import("maplibre-gl").then(({ Map, Marker: MarkerClass, NavigationControl, ScaleControl, AttributionControl, setWorkerUrl }) => {
      if (cancelled || !containerRef.current) return;
      setWorkerUrl(WORKER_URL);
      markerClass.current = MarkerClass;
      const instance = new Map({
        container: containerRef.current,
        style: STYLE_URL,
        center: [-116, 37.5],
        zoom: 5,
        attributionControl: false,
      });
      map = instance;
      instance.addControl(new NavigationControl({ visualizePitch: true }), "top-right");
      instance.addControl(new ScaleControl({ unit: "metric" }), "bottom-left");
      instance.addControl(new AttributionControl({ compact: true }), "bottom-right");

      instance.on("load", () => {
        // 地形阴影和卫星图插在文字标注下面
        const firstLabel = instance.getStyle().layers.find((layer) => layer.type === "symbol")?.id;
        const dem = {
          type: "raster-dem" as const,
          tiles: [TERRAIN_TILES],
          encoding: "terrarium" as const,
          tileSize: 256,
          maxzoom: 14,
          attribution: "Terrain: Mapzen / AWS Open Data",
        };
        instance.addSource("hillshade-dem", dem);
        instance.addSource("terrain-dem", dem);
        instance.addLayer(
          {
            id: "hillshade",
            type: "hillshade",
            source: "hillshade-dem",
            paint: { "hillshade-exaggeration": 0.35, "hillshade-shadow-color": "#473b24" },
          },
          firstLabel,
        );
        instance.addSource("imagery", {
          type: "raster",
          tiles: [IMAGERY_TILES],
          tileSize: 256,
          maxzoom: 16,
          attribution: "USGS The National Map",
        });
        instance.addLayer(
          { id: "imagery", type: "raster", source: "imagery", layout: { visibility: "none" } },
          firstLabel,
        );
        instance.addSource("imagery-eox", {
          type: "raster",
          tiles: [EOX_IMAGERY_TILES],
          tileSize: 256,
          maxzoom: 14,
          attribution: EOX_ATTRIBUTION,
        });
        instance.addLayer(
          { id: "imagery-eox", type: "raster", source: "imagery-eox", layout: { visibility: "none" } },
          firstLabel,
        );
        // 播放路线时给底图蒙一层淡淡的纸色：底图的橙色公路、绿地退到后面，我们的路线才是主角（maplibre-cartography：
        // 主角饱和、背景安静）；蒙在底图文字下面，地名照样清楚
        instance.addSource("veil", {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]]] } },
        });
        instance.addLayer(
          {
            id: "tour-veil",
            type: "fill",
            source: "veil",
            paint: { "fill-color": "#f4efe7", "fill-opacity": 0, "fill-opacity-transition": { duration: 700, delay: 0 } },
          },
          firstLabel,
        );

        instance.addSource("legs", { type: "geojson", data: EMPTY });
        instance.addLayer({
          id: "legs",
          type: "line",
          source: "legs",
          filter: ["==", ["get", "straight"], false],
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": ["get", "color"], "line-width": 4, "line-opacity": 0.8 },
        }, firstLabel);
        instance.addLayer({
          id: "legs-straight",
          type: "line",
          source: "legs",
          filter: ["==", ["get", "straight"], true],
          paint: { "line-color": ["get", "color"], "line-width": 2, "line-dasharray": [2, 2] },
        }, firstLabel);
        instance.addSource("trails", { type: "geojson", data: EMPTY });
        instance.addLayer({
          id: "trails",
          type: "line",
          source: "trails",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": TRAIL_COLOR, "line-width": 2.5, "line-dasharray": [2, 1.2] },
        }, firstLabel);
        instance.addLayer({
          id: "trails-highlight",
          type: "line",
          source: "trails",
          filter: ["==", ["get", "id"], ""],
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": TRAIL_HIGHLIGHT, "line-width": 4.5 },
        }, firstLabel);
        instance.addSource("extras", { type: "geojson", data: EMPTY });
        instance.addLayer({
          id: "extras",
          type: "circle",
          source: "extras",
          paint: {
            "circle-radius": 4.5,
            "circle-color": ["get", "color"],
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#ffffff",
          },
        });
        instance.addLayer({
          id: "extras-label",
          type: "symbol",
          source: "extras",
          minzoom: 11,
          layout: {
            "text-field": ["get", "label"],
            "text-font": ["Noto Sans Regular"],
            "text-size": 11,
            "text-offset": [0, 0.8],
            "text-anchor": "top",
            "text-optional": true,
          },
          paint: { "text-color": "#44403c", "text-halo-color": "#f4efe7", "text-halo-width": 1.4 },
        });
        instance.addSource("points", { type: "geojson", data: EMPTY });
        instance.addLayer({
          id: "points-selected",
          type: "circle",
          source: "points",
          filter: ["==", ["get", "id"], ""],
          paint: {
            "circle-radius": 15,
            "circle-color": "rgba(0,0,0,0)",
            "circle-stroke-width": 3,
            "circle-stroke-color": "#1c1b18",
          },
        });
        instance.addLayer({
          id: "points-hover",
          type: "circle",
          source: "points",
          filter: ["==", ["get", "id"], ""],
          paint: {
            "circle-radius": 17,
            "circle-color": "rgba(184,95,60,0.14)",
            "circle-stroke-width": 2.5,
            "circle-stroke-color": TRAIL_COLOR,
          },
        });
        instance.addLayer({
          id: "points",
          type: "circle",
          source: "points",
          filter: ["!=", ["get", "camp"], true],
          paint: {
            "circle-radius": [
              "case",
              ["==", ["get", "small"], true],
              3.5,
              ["has", "badge"],
              10,
              ["==", ["get", "emphasis"], true],
              8,
              6,
            ],
            "circle-color": ["get", "color"],
            "circle-stroke-width": ["case", ["==", ["get", "small"], true], 1.5, 2],
            "circle-stroke-color": ["case", ["==", ["get", "small"], true], "#57534e", "#ffffff"],
          },
        });
        instance.addLayer({
          id: "points-badge",
          type: "symbol",
          source: "points",
          filter: ["all", ["has", "badge"], ["!=", ["get", "camp"], true]],
          layout: {
            "text-field": ["get", "badge"],
            "text-font": ["Noto Sans Bold"],
            "text-size": 11,
            "text-allow-overlap": true,
          },
          paint: { "text-color": "#ffffff" },
        });
        instance.addLayer({
          id: "points-label",
          type: "symbol",
          source: "points",
          filter: ["all", ["!=", ["get", "small"], true], ["!=", ["get", "camp"], true]],
          layout: {
            // 中文名一行，英文名小一号放第二行
            "text-field": [
              "case",
              ["has", "sublabel"],
              ["format", ["get", "label"], {}, "\n", {}, ["get", "sublabel"], { "font-scale": 0.8 }],
              ["get", "label"],
            ],
            "text-font": ["Noto Sans Regular"],
            "text-size": 12,
            "text-offset": [0, 1.1],
            "text-anchor": "top",
            "text-optional": true,
            "symbol-sort-key": ["case", ["==", ["get", "emphasis"], true], 0, 1],
          },
          paint: { "text-color": LABEL_PAINT.vector.text, "text-halo-color": LABEL_PAINT.vector.halo, "text-halo-width": LABEL_PAINT.vector.width },
        });
        instance.addSource("tour-done", { type: "geojson", data: EMPTY });
        instance.addLayer(
          {
            id: "tour-done",
            type: "line",
            source: "tour-done",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": ["get", "color"], "line-width": 3.5, "line-opacity": 0.55 },
          },
          firstLabel,
        );
        // lineMetrics：线要按“画到百分之几”上渐变色（尾巴淡、车头浓）
        instance.addSource("tour-line", { type: "geojson", data: EMPTY, lineMetrics: true });
        instance.addLayer(
          {
            id: "tour-glow",
            type: "line",
            source: "tour-line",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": ["get", "color"], "line-width": 16, "line-blur": 8, "line-opacity": 0.35 },
          },
          firstLabel,
        );
        instance.addLayer(
          {
            id: "tour-line",
            type: "line",
            source: "tour-line",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": ["get", "color"], "line-width": 5, "line-opacity": 0.95 },
          },
          firstLabel,
        );
        instance.addSource("tour-head", { type: "geojson", data: EMPTY });
        instance.addLayer({
          id: "tour-pulse",
          type: "circle",
          source: "tour-head",
          paint: { "circle-radius": 14, "circle-color": ["get", "color"], "circle-opacity": 0.22, "circle-blur": 0.5 },
        });
        instance.addLayer({
          id: "tour-head",
          type: "circle",
          source: "tour-head",
          paint: { "circle-radius": 7, "circle-color": ["get", "color"], "circle-stroke-width": 3, "circle-stroke-color": "#ffffff" },
        });
        if (!instance.hasImage("camp-tent")) instance.addImage("camp-tent", campTentImage(), { pixelRatio: 2 });
        instance.addLayer({
          id: "camps",
          type: "symbol",
          source: "points",
          filter: ["==", ["get", "camp"], true],
          layout: {
            "icon-image": "camp-tent",
            "icon-size": 1,
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
            "text-field": [
              "case",
              ["has", "sublabel"],
              ["format", ["get", "label"], {}, "\n", {}, ["get", "sublabel"], { "font-scale": 0.8 }],
              ["get", "label"],
            ],
            "text-font": ["Noto Sans Regular"],
            "text-size": 12,
            "text-offset": [0, 1.5],
            "text-anchor": "top",
            "text-optional": true,
          },
          paint: { "text-color": LABEL_PAINT.vector.text, "text-halo-color": LABEL_PAINT.vector.halo, "text-halo-width": LABEL_PAINT.vector.width },
        });

        const selectPoint = (event: { features?: { properties?: Record<string, unknown> | null }[] }) => {
          const properties = event.features?.[0]?.properties;
          const id = properties?.id;
          if (typeof id === "string" && properties?.small !== true) handleSelect(id);
        };
        instance.on("click", "points", selectPoint);
        instance.on("click", "camps", selectPoint);
        instance.on("mouseenter", "points", () => {
          instance.getCanvas().style.cursor = "pointer";
        });
        instance.on("mouseleave", "points", () => {
          instance.getCanvas().style.cursor = "";
        });
        instance.on("mouseenter", "camps", () => {
          instance.getCanvas().style.cursor = "pointer";
        });
        instance.on("mouseleave", "camps", () => {
          instance.getCanvas().style.cursor = "";
        });

        mapRef.current = instance;
        setReady(true);
      });
    });

    return () => {
      cancelled = true;
      if (tourRef.current) cancelAnimationFrame(tourRef.current.raf);
      tourRef.current = null;
      map?.remove();
      mapRef.current = null;
    };
  }, [near]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.5), {
      threshold: [0, 0.5, 1],
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // ---------- 路线动画 ----------
  const setLine = (id: string, features: GeoJSON.Feature[]) =>
    (mapRef.current?.getSource(id) as GeoJSONSource | undefined)?.setData({ type: "FeatureCollection", features });
  const lineFeature = (line: [number, number][], color: string): GeoJSON.Feature => ({
    type: "Feature",
    geometry: { type: "LineString", coordinates: line },
    properties: { color },
  });
  const clearMarkers = (state: TourState) => {
    state.markers.forEach((marker) => marker.remove());
    state.markers = [];
  };

  /** ids 里的景点照常显示，别的淡下去；ids 是 null 时全部恢复 */
  const focusOn = (ids: string[] | null) => {
    const map = mapRef.current;
    if (!map) return;
    const value: ExpressionSpecification | number = ids ? ["case", ["in", ["get", "id"], ["literal", ids]], 1, DIM] : 1;
    for (const [layer, properties] of DIM_LAYERS) {
      if (!map.getLayer(layer)) continue;
      for (const property of properties) map.setPaintProperty(layer, property, layer === "trails" && ids ? DIM : value);
    }
  };

  const finishTour = () => {
    const state = tourRef.current;
    const map = mapRef.current;
    if (!state || !map) return;
    cancelAnimationFrame(state.raf);
    clearMarkers(state);
    tourRef.current = null;
    ["tour-done", "tour-line", "tour-head"].forEach((id) => setLine(id, []));
    map.setLayoutProperty("legs", "visibility", "visible");
    map.setLayoutProperty("legs-straight", "visibility", "visible");
    map.setPaintProperty("tour-veil", "fill-opacity", 0);
    focusOn(null);
    setTourUi(null);
    setTrack(null);
    narratorRef.current?.stop();
    setBeat(null);
    setCaption(null);
    if (state.narrated) {
      setImmersive(false);
      sidePanel.current = 0;
      bottomPanel.current = 0;
      scoreRef.current?.stop();
      scoreRef.current = null;
      if (state.terrainAdded && !terrainRef.current) map.setTerrain(null);
      map.setSky({ "atmosphere-blend": 0, "sky-horizon-blend": 0, "horizon-fog-blend": 0, "fog-ground-blend": 0 });
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    }
    if (progressRef.current) progressRef.current.style.width = "0%";
    map.setPadding(NO_PADDING);
    map.easeTo({ pitch: terrainRef.current ? 60 : 0, bearing: 0, duration: 600 });
    fitToPoints(map, pointsRef.current, true);
  };

  /** 最后一天画完：所有天的路线都留着，镜头拉远看全程，停一会儿再回到平常的地图 */
  const beginFinale = (state: TourState, now: number) => {
    const map = mapRef.current;
    if (!map) return;
    clearMarkers(state);
    map.setPadding(NO_PADDING);
    state.phase = "finale";
    state.phaseStart = now;
    focusOn(null);
    const all = state.days.flatMap((day) => [...day.path, ...day.stops.map((stop) => [stop.lon, stop.lat] as [number, number])]);
    if (all.length > 1) {
      const lons = all.map((p) => p[0]);
      const lats = all.map((p) => p[1]);
      map.fitBounds(
        [
          [Math.min(...lons), Math.min(...lats)],
          [Math.max(...lons), Math.max(...lats)],
        ],
        {
          padding: { top: 64, bottom: 64 + (state.narrated ? 72 : 0), left: 64 + sidePanel.current, right: 64 },
          maxZoom: 12,
          duration: 1100 / speedRef.current,
          pitch: 0,
          bearing: 0,
        },
      );
    }
    setTourUi((ui) => (ui ? { ...ui, card: false, finale: true, dusk: false } : ui));
    if (state.narrated) setBeat({ kind: "outro" });
    speak(state, narration?.outro.speech);
  };

  /** 讲解版念一段话：念完时 speaking 放下，then 里的事接着做；被新的一段顶掉、拖了进度条的，then 不再做 */
  const speak = (state: TourState, lines: string[] | undefined, then?: () => void) => {
    if (!state.narrated || !lines?.length) {
      then?.();
      return;
    }
    narratorRef.current ??= new Narrator(narration?.lang ?? "zh-CN", setCaption, muted);
    narratorRef.current.rate = speedRef.current;
    // 开口时配乐压低，停下抬回来
    narratorRef.current.onVoice = (speaking) => scoreRef.current?.duck(speaking);
    state.speaking = true;
    const voice = ++state.voice;
    narratorRef.current.play(lines).then(() => {
      if (tourRef.current !== state || state.voice !== voice) return;
      state.speaking = false;
      then?.();
    });
  };

  /** 跟车时看车前方多远的路定方向（公里）：拉得越远看得越前 */
  const lookAhead = (zoom: number) => 0.25 * 2 ** (13 - zoom);
  /** 跟车时把焦点往下挪：车停在画面偏下三分之一，前面的路留在上面 */
  const followPadding = (map: MapLibreMap) => ({
    top: Math.round(map.getContainer().clientHeight * 0.12),
    bottom: Math.round(map.getContainer().clientHeight * bottomPanel.current),
    left: sidePanel.current,
    right: 0,
  });
  /** 不跟车（减少动画）时整天一个视角：左下有章节字幕，底部多留一点 */
  const calmView = (map: MapLibreMap, day: TourDay, duration: number) => {
    const height = map.getContainer().clientHeight;
    map.fitBounds(bounds(day), {
      padding: { top: Math.round(height * 0.14), bottom: Math.round(height * 0.34), left: 56 + sidePanel.current, right: 56 },
      maxZoom: 12.5,
      duration,
      pitch: 0,
      bearing: 0,
    });
  };

  /** 一天开完：镜头拉回来看这一天的全程 */
  const reviewDay = (state: TourState) => {
    const map = mapRef.current;
    if (!map || state.calm) return;
    map.setPadding(NO_PADDING);
    const height = map.getContainer().clientHeight;
    map.fitBounds(bounds(state.days[state.index]), {
      padding: { top: Math.round(height * 0.12), bottom: Math.round(height * Math.max(0.2, bottomPanel.current)), left: 56 + sidePanel.current, right: 56 },
      maxZoom: 12.5,
      duration: 1200 / speedRef.current,
      pitch: TOUR_PITCH,
      bearing: 0,
    });
  };

  /** 车开到第 k 站：弹出小牌子（一天最多同时留三个，免得挤成一团；旧的先淡下去） */
  const addMarker = (state: TourState, day: TourDay, k: number) => {
    const map = mapRef.current;
    const stop = day.stops[k];
    if (!map || !stop || !markerClass.current) return;
    const badge = stop.lodging ? "住" : String(k + 1);
    const marker = new markerClass.current({
      element: captionElement(stop.label, stop.caption, stop.lodging ?? false, day.color, badge),
      anchor: "bottom",
      offset: [0, -14],
    })
      .setLngLat([stop.lon, stop.lat])
      .addTo(map);
    state.markers.push(marker);
    if (state.markers.length > 3) state.markers.shift()?.remove();
    state.markers.slice(0, -1).forEach((old) => (old.getElement().style.opacity = "0.55"));
  };

  /** 开始播第 index 天；quiet 是拖进度条跳到这一天的路上：不飞、不出开场卡片、不念开场的话 */
  const beginDay = (state: TourState, index: number, now: number, quiet = false) => {
    const map = mapRef.current;
    if (!map) return;
    const day = state.days[index];
    const plan = state.plans[index];
    clearMarkers(state);
    state.index = index;
    state.phase = "fly";
    state.phaseStart = now;
    state.cum = plan.cum;
    state.total = plan.total;
    state.stopKm = plan.stopKm;
    state.cost = plan.cost;
    state.dayMs = plan.dayMs;
    state.shown = 0;
    state.distance = 0;
    state.arriveUntil = 0;
    state.camera = null;
    state.carded = false;
    setLine("tour-line", []);
    setLine("tour-head", []);
    focusOn(day.stops.map((stop) => stop.id));
    // 线从尾巴的淡到车头的浓
    map.setPaintProperty("tour-line", "line-gradient", ["interpolate", ["linear"], ["line-progress"], 0, fade(day.color, 0.35), 1, day.color]);
    setTourUi({
      index,
      days: state.days.map(({ day: n, color }) => ({ day: n, color })),
      title: day.title,
      heading: day.heading,
      date: day.date,
      subtitle: day.subtitle,
      color: day.color,
      card: !quiet,
      finale: false,
      paused: false,
      dusk: false,
    });
    if (quiet) return;
    if (state.calm) calmView(map, day, flyMs(state.days.length) / speedRef.current);
    else {
      // 跟车：飞到起点，从车后上方朝车要开的方向看
      const zoom = followZoom(slowness(0, state.stopKm, state.total));
      const from = sliceTo(day.path, state.cum, 0).head;
      const to = sliceTo(day.path, state.cum, Math.max(0.8, lookAhead(zoom) * 3)).head;
      map.flyTo({
        center: from,
        zoom,
        pitch: state.narrated ? NARRATED_PITCH : FOLLOW_PITCH,
        bearing: bearingOf(from, to),
        padding: followPadding(map),
        duration: FOLLOW_FLY_MS / speedRef.current,
      });
    }
    if (state.narrated) {
      setBeat({ kind: "day", day });
      scoreRef.current?.swell();
      // 这一天每一站的头两张先下载，到站时卡片上的照片不会先空一下
      for (const stop of day.stops) preloadPhotos(stop.photos, 2);
    }
    speak(state, day.narration);
  };

  /** 进度条、时间跟着动画走：帧循环里的状态换成进度条上的第几段、这一段走了百分之几（每帧直接改样式，不经过 React） */
  const showProgress = (state: TourState) => {
    if (tourRef.current !== state) return;
    const clamp = (value: number) => Math.min(1, Math.max(0, value));
    const talking = state.speaking && narratorRef.current ? narratorRef.current.progress : null;
    const elapsed = state.clock - state.phaseStart;
    const day = state.days[state.index];
    let where: TourWhere;
    let fraction = 0;
    if (state.phase === "intro") {
      where = { kind: "intro" };
      fraction = talking ?? clamp(elapsed / 1500);
    } else if (state.phase === "fly") {
      where = { kind: "day", day: state.index };
      fraction = talking ?? clamp(elapsed / (state.calm ? flyMs(state.days.length) : FOLLOW_FLY_MS));
    } else if (state.phase === "draw" && state.clock < state.arriveUntil && state.shown > 0) {
      where = { kind: "stop", day: state.index, stop: state.shown - 1 };
      const talked = state.narrated && day.stops[state.shown - 1]?.narration;
      fraction = talking ?? (talked ? 1 : clamp(1 - (state.arriveUntil - state.clock) / ARRIVE_MS));
    } else if (state.phase === "draw") {
      where = { kind: "drive", day: state.index, distance: state.distance };
    } else if (state.phase === "hold") {
      where = { kind: "end", day: state.index };
      fraction = clamp(elapsed / HOLD_MS);
    } else {
      where = { kind: "outro" };
      fraction = talking ?? clamp(elapsed / FINALE_MS);
    }
    let index = segmentOf(state.timeline, where);
    if (index < 0 && where.kind === "stop") index = segmentOf(state.timeline, { kind: "drive", day: state.index, distance: state.distance });
    if (index < 0) return;
    const segment = state.timeline[index];
    if (segment.kind === "drive") fraction = segment.to > segment.from ? clamp((state.distance - segment.from) / (segment.to - segment.from)) : 1;
    state.position = state.starts[index] + segment.ms * fraction;
    const total = state.starts[state.starts.length - 1] || 1;
    const percent = Math.min(100, (state.position / total) * 100);
    if (progressRef.current) progressRef.current.style.width = `${percent}%`;
    if (!scrubbing.current) {
      if (seekFillRef.current) seekFillRef.current.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
      if (seekKnobRef.current) seekKnobRef.current.style.left = `${percent}%`;
    }
    seekTrackRef.current?.setAttribute("aria-valuenow", String(Math.round(percent)));
    if (clockRef.current) clockRef.current.textContent = `${clockText(state.position, speedRef.current)} / ${clockText(total, speedRef.current)}`;
  };

  /**
   * 镜头倾斜到几度还看得见 target（车、这一站）：从 target 往镜头那边（方向的反面）沿地面查十几个点的地形高度，
   * 有哪座山高过视线，就算出最多能倾斜多少（倾斜越大视线越平，越容易被前面的山挡住），再留 4° 余量。
   * 优胜美地这种深谷里，压低的航拍镜头常被山脊挡住，车和站牌被山盖得半透明。没开地形时不管
   */
  const sightCap = (state: TourState, map: MapLibreMap, target: [number, number], bearing: number, zoom: number, want: number) => {
    if (state.sight && state.clock - state.sight.at < SIGHT_EVERY_MS) return Math.min(want, state.sight.cap);
    const base = map.queryTerrainElevation(target);
    let cap = want;
    if (base !== null) {
      const lat = target[1] * (Math.PI / 180);
      // 镜头离 target 多远（米）：MapLibre 默认视角下大约是画面高度的 1.5 倍像素，再按这一级缩放的米每像素换算
      const metersPerPixel = (156543.03 * Math.cos(lat)) / 2 ** zoom;
      const reach = 1.5 * map.getContainer().clientHeight * metersPerPixel * Math.sin(want * (Math.PI / 180));
      const back = (bearing + 180) * (Math.PI / 180);
      // 离 target 越近查得越密（d 按平方分布）：挡住视线的多半是站旁边的山包，窄，隔太远会跳过去
      for (let i = 1; i <= 24; i++) {
        const d = reach * (i / 24) ** 2;
        const point: [number, number] = [
          target[0] + (d * Math.sin(back)) / (111320 * Math.cos(lat)),
          target[1] + (d * Math.cos(back)) / 111320,
        ];
        const rise = (map.queryTerrainElevation(point) ?? base) - base + 60;
        if (rise > 0) cap = Math.min(cap, (Math.atan(d / rise) * 180) / Math.PI - 4);
      }
    }
    cap = Math.max(SIGHT_MIN_PITCH, cap);
    state.sight = { at: state.clock, cap };
    return Math.min(want, cap);
  };

  /** 环绕镜头的一帧：绕着镜头现在对着的地方（这一站）慢慢转，拉近、压低 */
  const orbit = (state: TourState, map: MapLibreMap, delta: number) => {
    const prev = state.camera!;
    const zoom = prev.zoom + (Math.min(ORBIT_MAX_ZOOM, followZoom(1.2) + ORBIT_ZOOM_IN) - prev.zoom) * (1 - Math.exp(-delta / 2400));
    const prevPitch = prev.pitch ?? map.getPitch();
    const bearing = prev.bearing + delta * ORBIT_DEG_PER_MS;
    // 转到被山挡住的方向时自动抬高，转过去了再压低
    const want = sightCap(state, map, prev.center, bearing, zoom, ORBIT_PITCH);
    const pitch = prevPitch + (want - prevPitch) * (1 - Math.exp(-delta / 900));
    state.camera = { center: prev.center, zoom, bearing, pitch };
    map.jumpTo({ center: prev.center, zoom, bearing, pitch, padding: followPadding(map) });
  };

  /** 动画往前走一帧：now 是动画自己的钟（倍速就是这个钟走得快慢），delta 是这一帧钟走了多久 */
  const advance = (state: TourState, map: MapLibreMap, now: number, delta: number) => {
    const day = state.days[state.index];
    if (state.phase === "draw" && now < state.arriveUntil) {
      // 到站停一下（讲解版念完才走）：这段时间不算进画线的进度
      state.phaseStart += delta;
      // 讲解版停在一站讲话时：镜头拉近、压低，绕着这一站慢慢转（航拍的环绕镜头）；讲完接着跟车，方向慢慢转回车开的方向
      if (state.narrated && !state.calm && state.camera && state.arriveUntil === Infinity) orbit(state, map, delta);
      return;
    }
    if (state.carded) {
      state.carded = false;
      setBeat(null);
    }
    const elapsed = now - state.phaseStart;
    if (state.phase === "intro") {
      // 讲解版开头：讲完怎么看这张地图再开始第一天
      if (elapsed >= 1500 && !state.speaking) {
        map.setLayoutProperty("legs", "visibility", "none");
        map.setLayoutProperty("legs-straight", "visibility", "none");
        beginDay(state, state.index, now);
      }
      return;
    }
    if (state.phase === "fly") {
      // 卡片显示到镜头快到位，再收起来开始画；讲解版要等这一天开头的话念完
      const fly = state.calm ? flyMs(state.days.length) : FOLLOW_FLY_MS;
      if (elapsed >= fly * 0.85 && !state.speaking) setTourUi((ui) => (ui && ui.card ? { ...ui, card: false } : ui));
      // 讲解版：飞到起点以后这一天开头的话还没念完，镜头就绕着起点慢慢转、压低一点（像片头的航拍）；开车时从这里接着跟
      if (state.narrated && !state.calm && elapsed >= fly && state.speaking) {
        const prevPitch = map.getPitch();
        const bearing = map.getBearing() + delta * ORBIT_DEG_PER_MS;
        const center = map.getCenter().toArray() as [number, number];
        const pitch = prevPitch + (sightCap(state, map, center, bearing, map.getZoom(), ORBIT_PITCH) - prevPitch) * (1 - Math.exp(-delta / 900));
        map.jumpTo({ bearing, pitch });
        state.camera = { center: map.getCenter().toArray() as [number, number], zoom: map.getZoom(), bearing, pitch };
      }
      if (elapsed >= fly && !state.speaking) {
        if (state.narrated) setBeat(null);
        state.phase = "draw";
        state.phaseStart = now;
      }
      return;
    }
    if (state.phase === "draw") {
      const plan = state.plans[state.index];
      const progress = Math.min(1, elapsed / state.dayMs);
      // 不跟车：整天慢慢起步、慢慢停下；跟车：按播放量匀速走，进站前自然减速、长途时加速
      const distance = distanceAt(plan, progress, state.calm);
      state.distance = distance;
      const { line, head } = sliceTo(day.path, state.cum, distance);
      if (!state.calm) {
        // 镜头跟着车：位置、缩放、方向都慢慢跟过去（按这一帧过了多久算，帧率不同也一样快）
        const prev = state.camera ?? { center: map.getCenter().toArray() as [number, number], zoom: map.getZoom(), bearing: map.getBearing() };
        const zoom = prev.zoom + (followZoom(slowness(distance, state.stopKm, state.total)) - prev.zoom) * (1 - Math.exp(-delta / 700));
        const ahead = lookAhead(zoom);
        const k = 1 - Math.exp(-delta / 140);
        const center: [number, number] = [prev.center[0] + (head[0] - prev.center[0]) * k, prev.center[1] + (head[1] - prev.center[1]) * k];
        // 方向看车前面一段路，免得山路上来回打转；开到终点、前面没有路了就不再转
        const further = sliceTo(day.path, state.cum, distance + Math.max(0.8, ahead * 3)).head;
        const moving = further[0] !== head[0] || further[1] !== head[1];
        const bearing = moving ? turnToward(prev.bearing, bearingOf(head, further), 1 - Math.exp(-delta / 900)) : prev.bearing;
        // 从环绕镜头出来时慢慢抬回跟车的角度
        const pitchTarget = state.narrated ? sightCap(state, map, head, bearing, zoom, NARRATED_PITCH) : FOLLOW_PITCH;
        const prevPitch = prev.pitch ?? map.getPitch();
        const pitch = prevPitch + (pitchTarget - prevPitch) * (1 - Math.exp(-delta / 900));
        state.camera = { center, zoom, bearing, pitch };
        map.jumpTo({ center, zoom, bearing, pitch, padding: followPadding(map) });
      }
      setLine("tour-line", line.length > 1 ? [lineFeature(line, day.color)] : []);
      setLine("tour-head", [{ type: "Feature", geometry: { type: "Point", coordinates: head }, properties: { color: day.color } }]);
      while (state.shown < day.stops.length && state.stopKm[state.shown] <= distance + 1e-6) {
        const stop = day.stops[state.shown];
        addMarker(state, day, state.shown);
        state.shown += 1;
        // 起点那一站（前一晚的住处）不停
        if (state.stopKm[state.shown - 1] > 0.05) state.arriveUntil = now + ARRIVE_MS;
        // 讲解版：停下来，旁边出这一站的卡片，念完再停 0.6 秒才走；同一个地方的下一站等这一站讲完再讲
        if (state.narrated && stop.narration) {
          state.arriveUntil = Infinity;
          state.carded = true;
          preloadPhotos(stop.photos);
          setBeat({ kind: "stop", stop, index: state.shown, color: day.color });
          speak(state, stop.narration.speech, () => {
            state.arriveUntil = state.clock + 600;
          });
          break;
        }
      }
      if (day.dusk && progress > 0.75) setTourUi((ui) => (ui && !ui.dusk ? { ...ui, dusk: true } : ui));
      // 最后一站（当晚住处）讲完才算这一天开完
      if (progress >= 1 && state.shown >= day.stops.length && now >= state.arriveUntil) {
        state.phase = "hold";
        state.phaseStart = now;
        reviewDay(state);
      }
      return;
    }
    if (state.phase === "hold") {
      if (elapsed >= HOLD_MS && !state.speaking) {
        state.done.push(lineFeature(day.path, day.color));
        setLine("tour-done", state.done);
        setLine("tour-line", []);
        setLine("tour-head", []);
        if (state.index + 1 < state.days.length) beginDay(state, state.index + 1, now);
        else beginFinale(state, now);
      }
      return;
    }
    if (elapsed >= FINALE_MS && !state.speaking) finishTour();
  };

  const frame = (stamp: number) => {
    const state = tourRef.current;
    const map = mapRef.current;
    if (!state || !map) return;
    state.raf = requestAnimationFrame(frame);
    const real = stamp - state.last;
    state.last = stamp;
    if (state.pausedAt !== null) return;
    // 倍速：动画按自己的钟走，钟走得快慢就是倍速；暂停时钟不走
    const delta = real * speedRef.current;
    state.clock += delta;
    advance(state, map, state.clock, delta);
    showProgress(state);
  };

  /** 拖进度条、上一段 / 下一段：跳到第 segment 段（开车的段跳到 fraction 的位置），从那里接着播 */
  const seekTo = (segment: number, fraction = 0) => {
    const state = tourRef.current;
    const map = mapRef.current;
    const target = state?.timeline[segment];
    if (!state || !map || !target) return;
    if (target.kind === "intro") {
      startTour(state.days, 0, state.narrated);
      return;
    }
    // 正在念的停掉，它念完以后要做的事也不做了
    state.voice += 1;
    narratorRef.current?.stop();
    state.speaking = false;
    state.carded = false;
    state.pausedAt = null;
    setBeat(null);
    map.setLayoutProperty("legs", "visibility", "none");
    map.setLayoutProperty("legs-straight", "visibility", "none");
    const through = target.kind === "outro" ? state.days.length : target.day;
    state.done = state.days.slice(0, through).map((day) => lineFeature(day.path, day.color));
    setLine("tour-done", state.done);
    if (target.kind === "outro") {
      state.index = state.days.length - 1;
      setLine("tour-line", []);
      setLine("tour-head", []);
      beginFinale(state, state.clock);
      return;
    }
    beginDay(state, target.day, state.clock, target.kind !== "day");
    if (target.kind === "day") return;
    const day = state.days[target.day];
    const plan = state.plans[target.day];
    const distance =
      target.kind === "drive"
        ? target.from + (target.to - target.from) * Math.min(1, Math.max(0, fraction))
        : target.kind === "stop"
          ? (plan.stopKm[target.stop] ?? 0)
          : plan.total;
    // 这一站以前的都算到过了（牌子补上最近的三个）；跳到某一站的，下一帧车一到就停下来讲这一站
    state.shown = target.kind === "end" ? day.stops.length : target.stop;
    for (let k = Math.max(0, state.shown - 3); k < state.shown; k++) addMarker(state, day, k);
    state.phase = "draw";
    state.phaseStart = state.clock - progressAt(plan, distance, state.calm) * plan.dayMs;
    state.distance = distance;
    const { line, head } = sliceTo(day.path, plan.cum, distance);
    setLine("tour-line", line.length > 1 ? [lineFeature(line, day.color)] : []);
    setLine("tour-head", [{ type: "Feature", geometry: { type: "Point", coordinates: head }, properties: { color: day.color } }]);
    if (state.calm) calmView(map, day, 0);
    else {
      // 镜头直接跳到车的位置，不从别处飞过来
      const zoom = followZoom(slowness(distance, plan.stopKm, plan.total));
      const further = sliceTo(day.path, plan.cum, distance + Math.max(0.8, lookAhead(zoom) * 3)).head;
      const bearing = further[0] !== head[0] || further[1] !== head[1] ? bearingOf(head, further) : map.getBearing();
      state.camera = { center: head, zoom, bearing };
      map.jumpTo({ center: head, zoom, bearing, pitch: FOLLOW_PITCH, padding: followPadding(map) });
    }
    showProgress(state);
  };

  const startTour = (days: TourDay[], from = 0, narrated = false) => {
    const map = mapRef.current;
    if (!map || days.length === 0) return;
    if (tourRef.current) {
      cancelAnimationFrame(tourRef.current.raf);
      clearMarkers(tourRef.current);
    }
    narratorRef.current?.stop();
    // 倍速只给讲解版（记在这台设备上）；平常自动播的那一段总是一倍速
    let rate = 1;
    if (narrated) {
      try {
        const saved = Number(localStorage.getItem(SPEED_KEY));
        if (TOUR_SPEEDS.includes(saved)) rate = saved;
      } catch {}
    }
    speedRef.current = rate;
    setSpeed(rate);
    // 左边讲解卡片占的宽度（26rem，1024 以上 34rem，再加边距）：镜头往右让出这么多，车和这一站留在看得见的地方
    sidePanel.current = narrated && window.innerWidth >= 640 ? (window.innerWidth >= 1024 ? 576 : 448) : 0;
    // 手机上卡片在下面（最高 44%，再加控制条）：镜头往上让，这一站停在卡片上面
    bottomPanel.current = narrated && window.innerWidth < 640 ? 0.58 : 0;
    if (narrated && !immersive) {
      // 铺满全屏：浏览器支持的用真的全屏（要在点击里调用），iPhone 这种不支持的就盖满整个窗口
      setImmersive(true);
      rootRef.current?.requestFullscreen?.().catch(() => {});
      narration?.onStart?.();
      // 配乐也要在点击里开始（浏览器只允许这时候出声）
      if (!scoreRef.current) {
        scoreRef.current = new Score();
        scoreRef.current.muted = !music;
        scoreRef.current.start();
      }
    }
    // 底图压下去（卫星图上蒙得淡一点，免得照片发灰）
    map.setPaintProperty("tour-veil", "fill-opacity", satelliteRef.current ? 0.22 : 0.45);
    // 平常的彩色路线先藏起来，跟着车一段段画出来；讲解版开头讲“彩色的线是每天的路线”时先留着，进到第一天再藏
    const keepLegs = narrated && from === 0 && Boolean(narration?.intro.speech.length);
    map.setLayoutProperty("legs", "visibility", keepLegs ? "visible" : "none");
    map.setLayoutProperty("legs-straight", "visibility", keepLegs ? "visible" : "none");
    const calm = reducedMotion();
    const plans = days.map((day) => planDay(day, days.length, calm));
    const timeline = tourTimeline(days, plans, {
      narrated,
      calm,
      fly: calm ? flyMs(days.length) : FOLLOW_FLY_MS,
      hold: HOLD_MS,
      arrive: ARRIVE_MS,
      finale: FINALE_MS,
      speech: (lines) => lines.flatMap((line) => sentences(line)).reduce((sum, sentence) => sum + readingMs(sentence), 0),
      intro: narration?.intro.speech,
      outro: narration?.outro.speech,
    });
    const starts = segmentStarts(timeline);
    const state: TourState = {
      days,
      index: from,
      phase: "fly",
      phaseStart: 0,
      clock: 0,
      last: performance.now(),
      arriveUntil: 0,
      calm,
      narrated,
      speaking: false,
      voice: 0,
      carded: false,
      plans,
      timeline,
      starts,
      position: 0,
      distance: 0,
      cost: [],
      dayMs: 0,
      camera: null,
      pausedAt: null,
      raf: 0,
      cum: [],
      total: 0,
      stopKm: [],
      shown: 0,
      done: days.slice(0, from).map((day) => lineFeature(day.path, day.color)),
      markers: [],
      terrainAdded: false,
      sight: null,
    };
    tourRef.current = state;
    // 讲解版：打开 3D 地形和天空（远处的山带一点雾），镜头压低时像航拍；平常已经开着地形的不动它
    if (narrated && !reducedMotion()) {
      if (!map.getTerrain()) {
        map.setTerrain({ source: "terrain-dem", exaggeration: TERRAIN_EXAGGERATION });
        state.terrainAdded = true;
      }
      map.setSky({
        "sky-color": "#b9cad6",
        "horizon-color": "#efe6d8",
        "fog-color": "#efe6d8",
        "sky-horizon-blend": 0.55,
        "horizon-fog-blend": 0.75,
        "fog-ground-blend": 0.55,
        "atmosphere-blend": 0.6,
      });
    }
    setTrack(narrated ? { days, timeline, starts } : null);
    setLine("tour-done", state.done);
    if (narrated && from === 0 && narration?.intro.speech.length) {
      // 开头：先看整趟的全貌，讲怎么看这张地图
      state.phase = "intro";
      setBeat({ kind: "intro" });
      setTourUi({
        index: from,
        days: days.map(({ day: n, color }) => ({ day: n, color })),
        title: narration.intro.title,
        color: "#1c1b18",
        card: false,
        finale: false,
        paused: false,
        dusk: false,
      });
      // 先看整趟的全貌（给左边的卡片让出位置；全屏铺开要一点时间，等地图量好新尺寸）
      setTimeout(() => {
        const all = days.flatMap((day) => [...day.path, ...day.stops.map((stop) => [stop.lon, stop.lat] as [number, number])]);
        if (all.length < 2) return;
        map.resize();
        map.setPadding(NO_PADDING);
        map.fitBounds(
          [
            [Math.min(...all.map((p) => p[0])), Math.min(...all.map((p) => p[1]))],
            [Math.max(...all.map((p) => p[0])), Math.max(...all.map((p) => p[1]))],
          ],
          {
            padding: { top: 64, bottom: Math.max(150, Math.round(map.getContainer().clientHeight * bottomPanel.current)), left: 64 + sidePanel.current, right: 64 },
            maxZoom: 12,
            duration: 900,
            pitch: 0,
            bearing: 0,
          },
        );
      }, 120);
      speak(state, narration.intro.speech);
    } else beginDay(state, from, state.clock);
    state.raf = requestAnimationFrame(frame);
  };

  const togglePause = () => {
    const state = tourRef.current;
    if (!state) return;
    // 暂停时动画的钟不走，继续时接着走，不用再补时间
    if (state.pausedAt === null) {
      state.pausedAt = performance.now();
      narratorRef.current?.pause();
      scoreRef.current?.pause();
    } else {
      state.pausedAt = null;
      narratorRef.current?.resume();
      scoreRef.current?.resume();
    }
    setTourUi((ui) => (ui ? { ...ui, paused: state.pausedAt !== null } : ui));
  };

  /** 倍速换下一档：朗读从下一句起变快，动画马上变快 */
  const nextSpeed = () => {
    const rate = TOUR_SPEEDS[(TOUR_SPEEDS.indexOf(speedRef.current) + 1) % TOUR_SPEEDS.length];
    speedRef.current = rate;
    setSpeed(rate);
    if (narratorRef.current) narratorRef.current.rate = rate;
    try {
      localStorage.setItem(SPEED_KEY, String(rate));
    } catch {}
    const state = tourRef.current;
    if (state) showProgress(state);
  };

  /** 进度条上第 ratio（0–1）的位置跳到哪 */
  const seekRatio = (ratio: number) => {
    const state = tourRef.current;
    if (!state) return;
    const target = seekTarget(state.timeline, state.starts, ratio * (state.starts[state.starts.length - 1] ?? 0));
    seekTo(target.segment, target.fraction);
  };
  const stepChapter = (direction: 1 | -1) => {
    const state = tourRef.current;
    if (state) seekTo(chapterStep(state.timeline, state.starts, state.position, direction));
  };

  // 讲解版的键盘：空格（或 K）暂停 / 继续，左右键上一段 / 下一段；不是真全屏（iPhone 那种盖满窗口）时 Esc 退出
  const onTourKey = useEffectEvent((event: KeyboardEvent) => {
    if (!tourRef.current?.narrated || event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("input, textarea, select")) return;
    if (event.key === " " || event.key === "k") {
      // 像视频播放器一样，空格总是暂停 / 继续（刚点过倍速、声音按钮，焦点还在按钮上时也是，不再按一次那个按钮）
      event.preventDefault();
      togglePause();
    } else if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      stepChapter(event.key === "ArrowRight" ? 1 : -1);
    } else if (event.key === "Escape" && !document.fullscreenElement) finishTour();
  });
  useEffect(() => {
    if (!immersive) return;
    const listener = (event: KeyboardEvent) => onTourKey(event);
    // 按钮是松开空格时才“按下去”的，松开这一下也拦住
    const release = (event: KeyboardEvent) => {
      if (event.key === " " && (event.target as HTMLElement | null)?.tagName === "BUTTON") event.preventDefault();
    };
    window.addEventListener("keydown", listener);
    window.addEventListener("keyup", release);
    return () => {
      window.removeEventListener("keydown", listener);
      window.removeEventListener("keyup", release);
    };
  }, [immersive]);

  // 自动播放：请求的 key 变了、地图看得见、要播的那几天路线都查到了（最多等 6 秒）才播；系统设了“减少动画”的不自动播
  const tourDays = tour ?? [];
  const wanted = tourRequest ? tourDays.filter((day) => tourRequest.days.includes(day.day)) : [];
  const waitingRoads = wanted.some((day) => day.straight);
  const startRequested = useEffectEvent(() => {
    if (!tourRequest || wanted.length === 0) return;
    playedKey.current = tourRequest.key;
    startTour(wanted);
  });
  useEffect(() => {
    if (!tourRequest || tourRequest.key === playedKey.current) return;
    if (requestStart.current?.key !== tourRequest.key) requestStart.current = { key: tourRequest.key, at: Date.now() };
    if (reducedMotion()) {
      playedKey.current = tourRequest.key;
      return;
    }
    if (!ready || !visible || wanted.length === 0) return;
    const waited = Date.now() - requestStart.current.at;
    if (waitingRoads && waited < ROUTE_WAIT_MS) {
      const timer = setTimeout(() => setTick((n) => n + 1), ROUTE_WAIT_MS - waited);
      return () => clearTimeout(timer);
    }
    startRequested();
  }, [tourRequest, ready, visible, wanted.length, waitingRoads, tick]);
  const stopTour = useEffectEvent(() => finishTour());

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    (map.getSource("points") as GeoJSONSource).setData(pointsToGeoJSON(points));
    (map.getSource("trails") as GeoJSONSource).setData(
      linesToGeoJSON((trails ?? []).map((trail) => ({ id: trail.id, coordinates: trail.path }))),
    );
    (map.getSource("legs") as GeoJSONSource).setData(
      linesToGeoJSON((legs ?? []).map((leg) => ({ id: leg.id, coordinates: leg.path, color: leg.color, straight: leg.straight }))),
    );
    pointsRef.current = points;
    const key = `${fitKey}#${points.map((p) => p.id).join("|")}`;
    if (key !== fittedKeyRef.current && tourRef.current) {
      // 播放中换了显示的内容（点了某一天、营地地图）：停掉动画，按新的内容缩放
      stopTour();
    }
    if (key !== fittedKeyRef.current) {
      // 第一次直接跳过去，之后换点集再用动画
      fitToPoints(map, points, fittedKeyRef.current !== "");
      fittedKeyRef.current = key;
    }
  }, [ready, points, trails, legs, fitKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    (map.getSource("extras") as GeoJSONSource).setData(pointsToGeoJSON(extras ?? []));
  }, [ready, extras]);

  useEffect(() => {
    const timer = setTimeout(() => mapRef.current?.resize(), 60);
    return () => clearTimeout(timer);
  }, [immersive]);
  const leftFullscreen = useEffectEvent(() => {
    if (!document.fullscreenElement && immersive && tourRef.current?.narrated && rootRef.current?.requestFullscreen) finishTour();
  });
  useEffect(() => {
    const onChange = () => leftFullscreen();
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // 鼠标停在列表里的某个景点上：停够 250 毫秒才拉近（鼠标扫过一串景点时地图不乱跳），离开 450 毫秒后回到原来的视角；
  // 移开之前点过某个景点（选中了）就停在选中的那个，不回去；播动画的时候不动
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const timer = setTimeout(
      () => {
        if (tourRef.current) return;
        const point = hoverId ? pointsRef.current.find((p) => p.id === hoverId) : undefined;
        map.setFilter("points-hover", ["==", ["get", "id"], point?.id ?? ""]);
        if (point) {
          beforeHover.current ??= {
            center: map.getCenter().toArray() as [number, number],
            zoom: map.getZoom(),
            bearing: map.getBearing(),
            pitch: map.getPitch(),
          };
          map.flyTo({ center: [point.lon, point.lat], zoom: Math.max(14, map.getZoom()), duration: 900, essential: true });
        } else if (beforeHover.current) {
          if (!selectedRef.current) map.easeTo({ ...beforeHover.current, duration: 800 });
          beforeHover.current = null;
        }
      },
      hoverId ? 250 : 450,
    );
    return () => clearTimeout(timer);
  }, [ready, hoverId]);

  useEffect(() => {
    selectedRef.current = selectedId;
    const map = mapRef.current;
    if (!ready || !map) return;
    map.setFilter("points-selected", ["==", ["get", "id"], selectedId ?? ""]);
    if (map.getLayer("camps")) {
      map.setLayoutProperty("camps", "icon-size", ["case", ["==", ["get", "id"], selectedId ?? ""], 1.35, 1]);
    }
    map.setFilter("trails-highlight", ["==", ["get", "id"], highlightTrailId ?? ""]);
    const point = points.find((p) => p.id === selectedId);
    if (point) map.easeTo({ center: [point.lon, point.lat], zoom: Math.max(map.getZoom(), 12), duration: 800 });
  }, [ready, points, selectedId, highlightTrailId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    map.setLayoutProperty("imagery", "visibility", satellite && imagery === "usgs" ? "visible" : "none");
    map.setLayoutProperty("imagery-eox", "visibility", satellite && imagery === "eox" ? "visible" : "none");
    const paint = satellite ? LABEL_PAINT.imagery : LABEL_PAINT.vector;
    for (const layer of LABEL_LAYERS) {
      if (!map.getLayer(layer)) continue;
      map.setPaintProperty(layer, "text-color", paint.text);
      map.setPaintProperty(layer, "text-halo-color", paint.halo);
      map.setPaintProperty(layer, "text-halo-width", paint.width);
    }
    satelliteRef.current = satellite;
  }, [ready, satellite, imagery]);

  useEffect(() => {
    const map = mapRef.current;
    // 只在开关真正变化时动，免得打断刚开始的缩放动画
    terrainRef.current = terrain;
    if (!ready || !map || terrain === (map.getTerrain() !== null)) return;
    map.setTerrain(terrain ? { source: "terrain-dem", exaggeration: 1.3 } : null);
    map.easeTo({ pitch: terrain ? 60 : 0, duration: 800 });
  }, [ready, terrain]);

  // 有讲解版就先叫浏览器准备声音列表，点开讲解版时第一句就有声音
  const hasNarration = Boolean(narration);
  useEffect(() => {
    if (hasNarration) warmVoices();
  }, [hasNarration]);

  /** 进度条上某一段叫什么（拖动、悬停时的提示）：“第 2 天 · 第 3 站 · 冰川点”“第 2 天 · 开往冰川点” */
  const segmentLabel = (segment: TourSegment, days: TourDay[]) => {
    if (segment.kind === "intro") return narration?.intro.title ?? "";
    if (segment.kind === "outro") return text.tourAll;
    const day = days[segment.day];
    const heading = day.heading ?? day.title;
    const stop = segment.kind === "stop" || segment.kind === "drive" ? day.stops[segment.stop] : undefined;
    if (segment.kind === "stop" && stop) return `${heading} · ${stop.narration?.title ?? stop.label}`;
    if (segment.kind === "drive" && stop) return `${heading} · ${fill(text.tourToward, { name: stop.label })}`;
    return heading;
  };
  const ratioOf = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return rect.width > 0 ? Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)) : 0;
  };
  /** 拖动时进度条先跟着手走，松手才真的跳过去 */
  const previewAt = (ratio: number) => {
    if (seekFillRef.current) seekFillRef.current.style.clipPath = `inset(0 ${100 - ratio * 100}% 0 0)`;
    if (seekKnobRef.current) seekKnobRef.current.style.left = `${ratio * 100}%`;
  };
  const trackTotal = track ? (track.starts[track.starts.length - 1] ?? 0) || 1 : 1;
  const trackBars = (solid: boolean) =>
    track?.timeline.map((segment, index) => {
      const color = segment.kind === "intro" || segment.kind === "outro" ? "#1c1b18" : track.days[segment.day].color;
      return (
        <span
          key={index}
          className={`absolute inset-y-0 ${segment.kind === "day" ? "border-l-2 border-paper" : segment.kind === "stop" ? "border-l border-paper/80" : ""}`}
          style={{
            left: `${(track.starts[index] / trackTotal) * 100}%`,
            width: `${(segment.ms / trackTotal) * 100}%`,
            backgroundColor: solid ? color : fade(color, segment.kind === "stop" ? 0.5 : 0.22),
          }}
        />
      );
    });
  const scrubLabel =
    track && scrub !== null ? segmentLabel(track.timeline[seekTarget(track.timeline, track.starts, scrub * trackTotal).segment], track.days) : "";

  // 讲解卡片顶上的照片窗：车出发时图集可能还没取回来，按最新的 tour 找这一站
  const beatStop = beat?.kind === "stop" ? (tourDays.flatMap((day) => day.stops).find((stop) => stop.id === beat.stop.id) ?? beat.stop) : undefined;
  const stopPhotos = beatStop?.photos?.length ? beatStop.photos : beatStop?.photo ? [beatStop.photo] : [];
  // 每天开头：这一天各站的第一张轮流放，像片头预告今天会看到什么（住处不算）
  const beatDay = beat?.kind === "day" ? (tourDays.find((day) => day.day === beat.day.day) ?? beat.day) : undefined;
  const dayPhotos = beatDay ? beatDay.stops.flatMap((stop) => (!stop.lodging && stop.photos?.[0] ? [stop.photos[0]] : [])).slice(0, 6) : [];
  const beatSpeech = beat?.kind === "stop" ? beat.stop.narration?.speech : beat?.kind === "day" ? beat.day.narration : undefined;
  const beatMs = (beatSpeech ?? []).reduce((sum, line) => sum + readingMs(line), 0);
  const toggle = (active: boolean) =>
    `px-3 py-1.5 transition-colors ${active ? "bg-ink text-paper" : "text-ink hover:bg-paper-deep"}`;
  const hasTrails = (trails?.length ?? 0) > 0;
  const hasCamps = points.some((point) => point.shape === "camp");
  const hasRoad = legs?.some((leg) => !leg.straight && leg.path.length > 1) ?? false;
  const showStraightRoute = legs?.some((leg) => leg.straight && leg.path.length > 1) ?? false;
  const legendItems = legend ?? (hasRoad ? [{ color: legs?.find((leg) => !leg.straight)?.color ?? ROAD_COLOR, label: text.roadLegend }] : []);

  return (
    <div
      ref={rootRef}
      className={`overflow-hidden bg-paper-deep ${immersive ? "fixed inset-0 z-[80] h-[100dvh] w-screen" : `relative ${className}`}`}
    >
      {/* maplibre 的 CSS 会把容器设成 position: relative，所以用 h-full 而不是 inset-0 撑满 */}
      {/* z-0：地图（连同上面的站牌、到站的波纹）自成一层，讲解版到站的照片能整个盖住它 */}
      <div ref={containerRef} className={`z-0 h-full w-full transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`} />
      {!ready && (
        <div className="eyebrow absolute inset-0 flex items-center justify-center text-ink-soft">
          {text.loading}
        </div>
      )}
      <div className={`absolute top-3 left-3 space-y-2 ${immersive ? "hidden" : ""}`}>
        <div className="flex bg-paper/95 text-[11px] tracking-[0.12em] shadow-sm">
          <button type="button" className={toggle(!satellite)} onClick={() => setSatellite(false)}>
            {text.map}
          </button>
          <button type="button" className={toggle(satellite)} onClick={() => setSatellite(true)}>
            {text.satellite}
          </button>
          <button
            type="button"
            className={toggle(terrain)}
            aria-pressed={terrain}
            onClick={() => setTerrain((value) => !value)}
          >
            {text.terrain}
          </button>
        </div>
        {(hasTrails || hasCamps || legendItems.length > 0 || showStraightRoute || (extras?.length ?? 0) > 0) && (
          <div className="flex w-fit max-w-[14rem] flex-col gap-1 bg-paper/90 px-3 py-2 text-[11px] text-ink-soft shadow-sm">
            {legendItems.map((item) => (
              <span key={item.label} className="flex items-center gap-1.5">
                <span className="inline-block h-[3px] w-5 shrink-0" style={{ backgroundColor: item.color }} />
                {item.label}
              </span>
            ))}
            {hasCamps && (
              <span className="flex items-center gap-1.5">
                <svg width="14" height="12" viewBox="0 0 14 12" aria-hidden="true" className="shrink-0">
                  <path d="M7 0.5 L13.2 11.5 L0.8 11.5 Z" fill={CAMP_COLOR} stroke="#ffffff" strokeWidth="1.2" />
                </svg>
                {text.campLegend}
              </span>
            )}
            {hasTrails && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-5 border-t-2 border-dashed" style={{ borderColor: TRAIL_COLOR }} />
                {text.trailLegend}
              </span>
            )}
            {(extras?.length ?? 0) > 0 &&
              extrasLegend?.map((item) => (
                <span key={item.label} className="flex items-center gap-1.5">
                  <span className="ml-1.5 inline-block size-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="ml-1.5">{item.label}</span>
                </span>
              ))}
            {showStraightRoute && <span>{text.routeNote}</span>}
          </div>
        )}
      </div>
      {/* 黄昏：画到最后天色慢慢暗下来，上面暖一点 */}
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-b from-clay-900/15 via-ink/20 to-ink/40 transition-opacity duration-1000 ${
          tourUi?.dusk ? "opacity-100" : "opacity-0"
        }`}
      />
      {/* 讲解版：旁边的卡片（电脑上在左边，手机上在下面）。一次只讲一件事：开头讲怎么看地图，每天开头讲这一天，每一站讲看点、怎么玩、什么时候、注意 */}
      {immersive && beat && (
        <aside
          key={beat.kind === "stop" ? beat.stop.id : beat.kind === "day" ? `day-${beat.day.day}` : beat.kind}
          className="tour-pop absolute inset-x-3 bottom-36 z-20 max-h-[44%] overflow-y-auto bg-paper shadow-[0_18px_50px_-12px_rgb(28_27_24/0.45)] sm:inset-x-auto sm:top-4 sm:bottom-auto sm:left-4 sm:max-h-[calc(100%-8rem)] sm:w-[26rem] lg:w-[34rem]"
        >
          {/* 照片窗：这一站的几张轮流放，片名压在照片左下；地图在卡片外面一直看得见 */}
          {beat.kind === "stop" && stopPhotos.length > 0 && (
            <PhotoReel
              photos={stopPhotos}
              eyebrow={[fill(text.tourStopNo, { n: beat.index }), beat.stop.caption].filter(Boolean).join(" · ")}
              title={beat.stop.narration?.title.split(" · ").slice(1).join(" · ") || beat.stop.label}
              color={beat.color}
              durationMs={beatMs}
              paused={Boolean(tourUi?.paused)}
              speed={speed}
            />
          )}
          {beat.kind === "day" && dayPhotos.length > 0 && (
            <PhotoReel
              photos={dayPhotos}
              eyebrow={[beat.day.date, beat.day.subtitle].filter(Boolean).join(" · ")}
              title={beat.day.heading ?? beat.day.title}
              color={beat.day.color}
              durationMs={beatMs}
              paused={Boolean(tourUi?.paused)}
              speed={speed}
            />
          )}
          {/* 每天开头有照片时片名已经在照片上，下面不用再写一遍 */}
          {!(beat.kind === "day" && dayPhotos.length > 0) && (
          <div className="border-l-[3px] px-5 py-4 sm:py-5" style={{ borderColor: beat.kind === "stop" ? beat.color : beat.kind === "day" ? beat.day.color : "#1c1b18" }}>
            {beat.kind === "intro" && narration && (
              <>
                <p className="font-serif text-2xl leading-tight">{narration.intro.title}</p>
                <NarrationLines lines={narration.intro.lines} />
              </>
            )}
            {beat.kind === "day" && (
              <>
                <p className="font-serif text-[2rem] leading-none lining-nums">{beat.day.heading ?? beat.day.title}</p>
                {beat.day.date && <p className="mt-2 text-[13px] text-ink lining-nums">{beat.day.date}</p>}
                {beat.day.subtitle && <p className="mt-1 text-[13px] text-ink-soft lining-nums">{beat.day.subtitle}</p>}
              </>
            )}
            {beat.kind === "stop" && beat.stop.narration && (
              <>
                {stopPhotos.length === 0 && <p className="font-serif text-2xl leading-tight lining-nums">{beat.stop.narration.title}</p>}
                <NarrationLines lines={beat.stop.narration.lines} />
              </>
            )}
            {beat.kind === "outro" && narration && (
              <>
                <p className="font-serif text-[2rem] leading-none">{text.tourAll}</p>
                {tourSummary && <p className="mt-2 text-[13px] text-ink-soft lining-nums">{tourSummary}</p>}
                <NarrationLines lines={narration.outro.lines} />
              </>
            )}
          </div>
          )}
        </aside>
      )}
      {/* 字幕：念到哪句出哪句；手机上卡片在下面，字幕放到上面 */}
      {immersive && caption && (
        <div className="pointer-events-none absolute inset-x-0 top-3 z-30 flex justify-center pr-14 pl-4 sm:top-auto sm:bottom-28 sm:pr-4 sm:pl-[28rem] lg:pl-[36rem]">
          <p className="max-w-2xl bg-ink/85 px-4 py-2 text-center text-[15px] leading-7 text-paper lining-nums">{caption}</p>
        </div>
      )}
      {/* 章节字幕：每天开头在左下出一行大字（像纪录片换章），最后一天画完换成全程的总结；不挡地图中间（讲解版用旁边的卡片） */}
      {tourUi && !immersive && (
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 pt-16 pb-24 pl-5 pr-6 transition-opacity duration-500 sm:pl-8 ${
            tourUi.card || tourUi.finale ? "opacity-100" : "opacity-0"
          }`}
          style={{ background: "linear-gradient(to top, rgba(244,239,231,0.92) 0%, rgba(244,239,231,0.7) 55%, rgba(244,239,231,0) 100%)" }}
          aria-hidden={!(tourUi.card || tourUi.finale)}
        >
          <div
            className={`border-l-[3px] pl-4 transition-transform duration-700 ${tourUi.card || tourUi.finale ? "translate-x-0" : "-translate-x-2"}`}
            style={{ borderColor: tourUi.finale ? "#1c1b18" : tourUi.color }}
          >
            {tourUi.finale ? (
              <>
                <p className="font-serif text-[clamp(1.75rem,5vw,3rem)] leading-none lining-nums">{text.tourAll}</p>
                {tourSummary && <p className="mt-2 text-[13px] text-ink-soft lining-nums">{tourSummary}</p>}
              </>
            ) : (
              <>
                <p className="font-serif text-[clamp(1.75rem,5vw,3rem)] leading-none lining-nums">{tourUi.heading ?? tourUi.title}</p>
                {(tourUi.date || tourUi.subtitle) && (
                  <p className="mt-2 text-[13px] text-ink-soft lining-nums">
                    {tourUi.date && <span className="mr-3 text-ink">{tourUi.date}</span>}
                    {tourUi.subtitle}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
      {tourUi && !immersive && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[3px] bg-ink/10">
          <div ref={progressRef} className="h-full transition-[background-color] duration-500" style={{ width: "0%", backgroundColor: tourUi.color }} />
        </div>
      )}
      {ready && tourDays.length > 0 && !immersive && (
        <div className="absolute bottom-9 left-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-x-3 gap-y-1.5 bg-paper/95 px-3 py-2 text-[11px] tracking-[0.08em] shadow-sm">
          {tourUi ? (
            <>
              {/* 章节字幕显示着的时候不重复标题 */}
              {!tourUi.card && !tourUi.finale && <span className="font-serif text-sm tracking-normal lining-nums">{tourUi.title}</span>}
              <button type="button" className="link-line" onClick={togglePause}>
                {tourUi.paused ? text.tourResume : text.tourPause}
              </button>
              <button type="button" className="link-line" onClick={finishTour}>
                {text.tourSkip}
              </button>
              <span className="flex gap-1" role="group" aria-label={text.tourPlay}>
                {tourUi.days.map((day, k) => (
                  <button
                    key={day.day}
                    type="button"
                    aria-label={text.tourDay.replace("{n}", String(day.day + 1))}
                    aria-current={k === tourUi.index}
                    onClick={() => {
                      const current = tourRef.current;
                      if (current) startTour(current.days, k, current.narrated);
                    }}
                    className="flex size-6 items-center justify-center"
                  >
                    <span
                      className={`block rounded-full border border-ink/40 transition-all duration-300 ${k === tourUi.index ? "size-3" : "size-2.5"}`}
                      style={{ backgroundColor: k <= tourUi.index || tourUi.finale ? day.color : "transparent" }}
                    />
                  </button>
                ))}
              </span>
            </>
          ) : (
            <>
              <button type="button" className="link-line" onClick={() => startTour(tourDays)}>
                ▶ {text.tourPlay}
              </button>
              {narration && (
                <button type="button" className="link-line" onClick={() => startTour(tourDays, 0, true)}>
                  {text.tourNarrate}
                </button>
              )}
            </>
          )}
        </div>
      )}
      {/* 讲解版的控制条：进度条（按天上色，深一点的小段是在某一站讲解；拖动、点击跳过去，开车的段跳到点的位置，其他的从这一段开头讲起）、
          上一段 / 暂停 / 下一段、倍速、声音、退出和大概的时间 */}
      {immersive && tourUi && track && (
        <div className="absolute inset-x-3 bottom-8 z-30 bg-paper/95 px-3 pt-1 pb-2 shadow-sm sm:inset-x-4 sm:px-4">
          <div
            ref={seekTrackRef}
            role="slider"
            tabIndex={0}
            aria-label={text.tourSeek}
            title={text.tourSeek}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={0}
            className="relative h-6 cursor-pointer touch-none outline-none select-none focus-visible:ring-1 focus-visible:ring-ink/40"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              scrubbing.current = true;
              const ratio = ratioOf(event);
              setScrub(ratio);
              previewAt(ratio);
            }}
            onPointerMove={(event) => {
              const ratio = ratioOf(event);
              setScrub(ratio);
              if (scrubbing.current) previewAt(ratio);
            }}
            onPointerUp={(event) => {
              if (!scrubbing.current) return;
              scrubbing.current = false;
              setScrub(null);
              seekRatio(ratioOf(event));
            }}
            onPointerCancel={() => {
              scrubbing.current = false;
              setScrub(null);
            }}
            onPointerLeave={() => {
              if (!scrubbing.current) setScrub(null);
            }}
          >
            <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2">{trackBars(false)}</div>
            <div ref={seekFillRef} className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2" style={{ clipPath: "inset(0 100% 0 0)" }}>
              {trackBars(true)}
            </div>
            <div
              ref={seekKnobRef}
              className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper bg-ink shadow"
              style={{ left: "0%" }}
            />
            {scrub !== null && (
              <div
                className="pointer-events-none absolute bottom-full mb-1 max-w-[80vw] -translate-x-1/2 truncate bg-ink px-2 py-1 text-[11px] whitespace-nowrap text-paper lining-nums"
                style={{ left: `${Math.min(85, Math.max(15, scrub * 100))}%` }}
              >
                {scrubLabel}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] tracking-[0.08em]">
            <button type="button" className="link-line" onClick={() => stepChapter(-1)}>
              {text.tourPrev}
            </button>
            <button type="button" className="link-line" onClick={togglePause}>
              {tourUi.paused ? text.tourResume : text.tourPause}
            </button>
            <button type="button" className="link-line" onClick={() => stepChapter(1)}>
              {text.tourNext}
            </button>
            <button type="button" className="link-line lining-nums" aria-label={`${text.tourSpeed} ${speed}×`} title={text.tourSpeed} onClick={nextSpeed}>
              {speed}×
            </button>
            <button
              type="button"
              className="link-line"
              aria-pressed={muted}
              onClick={() => {
                setMuted(!muted);
                narratorRef.current?.setMuted(!muted);
              }}
            >
              {muted ? text.tourUnmute : text.tourMute}
            </button>
            <button
              type="button"
              className="link-line"
              aria-pressed={!music}
              onClick={() => {
                setMusic(!music);
                scoreRef.current?.setMuted(music);
                try {
                  localStorage.setItem(MUSIC_KEY, music ? "off" : "on");
                } catch {}
              }}
            >
              {music ? text.tourMusicOff : text.tourMusicOn}
            </button>
            <button type="button" className="link-line" onClick={finishTour}>
              {text.tourExit}
            </button>
            <span ref={clockRef} className="ml-auto h-4 w-full text-right text-ink-soft tabular-nums tracking-normal sm:w-auto" aria-hidden="true" />
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
