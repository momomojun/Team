"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import type { ExpressionSpecification, GeoJSONSource, Map as MapLibreMap, Marker } from "maplibre-gl";
import { useEffect, useEffectEvent, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import {
  bearingOf,
  bounds,
  chapterStep,
  clockText,
  driveDistance,
  drawnGradient,
  fade,
  flyMs,
  followZoom,
  lineFraction,
  locate,
  planDay,
  pointAt,
  seekTarget,
  segmentStarts,
  sentenceAt,
  slotStarts,
  slowness,
  TOUR_SPEEDS,
  tourTimeline,
  turnToward,
  type DayPlan,
  type TourDay,
  type TourNarration,
  type TourSegment,
  type TourStop,
} from "./route-tour";
import { fill } from "@/i18n/format";
import { readingMs, sentences } from "@/lib/narration";
import { Score } from "@/lib/score";
import { Narrator, warmVoices } from "@/lib/speech";
import { tilesAlongPath, tileUrl } from "@/lib/offline-maps";
import { holdClock } from "@/lib/use-now";
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
  /** 播放时旁边的天气卡片：标题、穿衣、雨具 */
  tourWeather: string;
  tourWear: string;
  tourRain: string;
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
// 讲解版：打开 3D 地形，跟车压得更低一点；到站、每天开头讲话时镜头绕着这个地方慢慢转（航拍的环绕镜头）。
// 压得越低看得越远，地图每帧要算、要画的远处瓦片越多：60° 往上每多一度都明显更卖力，环绕最多压到 62°
const NARRATED_PITCH = 56;
const ORBIT_PITCH = 62;
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
/**
 * 一帧最多算这么久（毫秒）：浏览器偶尔卡一下（打开 3D 地形时编译显卡程序、切到别的标签页再回来），
 * 不让车一下子跳出去一大截，宁可那一下慢一点
 */
const MAX_FRAME_MS = 64;
/** 讲解版铺满全屏时画面的清晰度最多是屏幕的 1.5 倍：高分屏、4K 屏上 3D 地形要画的像素少一半以上，帧率稳得多，看不出区别 */
const NARRATED_PIXEL_RATIO = 1.5;
/** 提前下载这一天的地图瓦片时同时发几个请求（浏览器对同一个网站最多也就同时 6 个） */
const PREFETCH_PARALLEL = 6;
/** 开车时地图瓦片跟不上：车慢到原来的三成，等瓦片到了再用半秒左右加速回去 */
const TILE_SLOW = 0.3;
const FLOW_EASE_MS = 500;
/** 一段开车最多为等地图慢这么久（真实的毫秒）：网太慢的，等够了就照常开，不让看的人干等 */
const TILE_WAIT_MAX = 4000;
/** 镜头压低时远处少下载一些瓦片（MapLibre 的 setSourceTileLodParams）：默认倾斜时最多下载平视的 3 倍，播放时 2 倍 */
const DEFAULT_LOD_LEVELS = 9.314;
const DEFAULT_LOD_RATIO = 3;
const TOUR_LOD_RATIO = 2;
/**
 * 朗读的快慢：实际念一句的时间 ÷ 按阅读时间估的（浏览器自带的中文声音大约 1.4 倍）。
 * 边念边量，和排时间线用的差一成以上就按量到的重排进度条；量到的记在这台设备上，下次一开始就准
 */
const PACE_KEY = "nps-tour-pace";
const PACE_SAMPLES = 8;
const PACE_REBUILD = 0.1;

interface TourState {
  days: TourDay[];
  /** 正在播的是第几天（画面上的路线、牌子是这一天的） */
  index: number;
  calm: boolean;
  /** 讲解版：每一站念讲解词 */
  narrated: boolean;
  /** 每天怎么播、进度条上的各段和每段从第几毫秒开始 */
  plans: DayPlan[];
  timeline: TourSegment[];
  starts: number[];
  /** 播到第几毫秒（一倍速下）：一切都按它摆出来，进度条也只看它 */
  position: number;
  /** 现在在第几段（换了段才重新摆这一段的开头） */
  segment: number;
  /** 动画自己的钟（毫秒）：每帧按倍速往前走，暂停时不走；钟等念完一句的时候它照样走（镜头接着转） */
  clock: number;
  /** 上一帧的时间（浏览器的） */
  last: number;
  /** 这一段要念的每一句、每一句从这一段的第几毫秒开始念；spoken 是下一句念第几句，talking 是正在念 */
  speech: { lines: string[]; starts: number[] } | null;
  spoken: number;
  talking: boolean;
  /** 第几次开始念：念完的回调只认最后一次（被拖进度条、退出顶掉的不算） */
  voice: number;
  /** 朗读的快慢（见 PACE_KEY）：时间线按它排；samples 是最近几句量到的，sampleOk 是这一句中间没暂停过（暂停过的不算） */
  pace: number;
  paceSamples: number[];
  sampleOk: boolean;
  /** 车走得多快（1 是正常）：地图瓦片跟不上时慢下来等；waited 是这一段开车已经为等地图慢了多久；loading 是要不要写“地图加载中” */
  flow: number;
  waited: number;
  loading: boolean;
  /** 正在拖进度条：preview 是下一帧要摆到第几毫秒，paused 是开始拖以前是不是暂停着 */
  scrub: { preview: number | null; paused: boolean } | null;
  camera: { center: [number, number]; zoom: number; bearing: number; pitch?: number } | null;
  /** 讲解版自己打开的 3D 地形：结束时关回去 */
  terrainAdded: boolean;
  /** 视线检查的结果：最多能倾斜到几度才不被山挡住（at 是上次查的时间，按 clock） */
  sight: { at: number; cap: number } | null;
  pausedAt: number | null;
  raf: number;
  /** 这一天到过了几站（牌子已经弹出来的） */
  shown: number;
  done: GeoJSON.Feature[];
  markers: Marker[];
  /** 车头：一个跟着镜头走的小圆点（DOM 标记，每帧直接挪，不经过地图的数据源，镜头和车头不会差一两帧） */
  car: Marker | null;
  /** 线在地图上画到百分之几（上一帧的）：没变就不重算渐变 */
  fraction: number;
  /** 这一天开场的卡片收起来了、天色暗下来了：只改一次 */
  cardHidden: boolean;
  dusk: boolean;
  /** 预热：等地图把路线、3D 地形第一次画完（要编译显卡程序，会卡一下）再开始讲、开始走；afterWarm 是等完了要做的事 */
  warming: boolean;
  afterWarm: (() => void) | null;
  /** 讲解版改过画面的清晰度：结束时改回来 */
  pixelRatio: number | null;
  /** 讲解版藏起来的 3D 建筑图层：结束时放回来 */
  hidden: string[];
  /** 进度条上次写的时间文字、百分比：没变就不改，省得每帧重排 */
  clockShown: string;
  percentShown: number;
  /** 提前下载地图瓦片：退出时取消；下载过的天不再下载 */
  prefetch: AbortController;
  prefetched: Set<number>;
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

/**
 * 点、线的内容有没有变（比 JSON 便宜得多）：上面的行程页每次重新渲染都会给新的数组，鼠标在列表上扫过、每 30 秒的时钟都会让它重新渲染，
 * 内容没变还重新交给地图，地图就要把几千个点重新切图、重新传给显卡，地图一卡一卡的（播放路线时也会卡一下）
 */
const pointsKey = (points: MapPoint[] | undefined) =>
  (points ?? [])
    .map((p) => `${p.id}|${p.lat}|${p.lon}|${p.label}|${p.sublabel ?? ""}|${p.color}|${p.emphasis ? 1 : 0}|${p.badge ?? ""}|${p.small ? 1 : 0}|${p.shape ?? ""}`)
    .join(";");
/** 线：按 id、颜色、点数、头尾和中间一个点认（真实道路换掉直线时点数、坐标都会变） */
const linesKey = (lines: { id: string; path: [number, number][]; color?: string; straight?: boolean }[] | undefined) =>
  (lines ?? [])
    .map((line) => {
      const { path } = line;
      const mid = path[path.length >> 1];
      return `${line.id}|${line.color ?? ""}|${line.straight ? 1 : 0}|${path.length}|${path[0]}|${mid}|${path[path.length - 1]}`;
    })
    .join(";");

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
  focusTick = 0,
  narration,
  onCursorReady,
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
  /** 每点一次“在地图上看”加一：同一个景点再点一次，镜头也再飞过去 */
  focusTick?: number;
  /** 有就显示“讲解版”：全屏、逐站讲解、朗读（开头和结尾的话在这里，每一天、每一站的在 tour 里） */
  narration?: TourNarration & { onStart?: () => void };
  /**
   * 地图准备好以后把“放一个小圆点”的函数交给外面（地图换掉时交 null）：外面直接调它放圆点、传 null 拿掉
   * （鼠标在海拔剖面上移动时，地图上同步显示走到了哪）。鼠标每动一下都要挪，不经过 React 重新渲染整个列表
   */
  onCursorReady?: (setCursor: ((at: [number, number] | null) => void) | null) => void;
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
  // 海拔剖面联动的小圆点（onCursorReady）
  const cursorMarker = useRef<Marker | null>(null);
  // 上次交给地图的内容（pointsKey / linesKey）：没变就不再交；地图重新建的时候清空
  const sentRef = useRef({ points: "", trails: "", legs: "", extras: "" });
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
  /** 进度条上方“跳到哪”的提示：悬停、拖动时直接改它的位置和文字（不经过 React，鼠标每动一下都重新渲染整个地图组件，拖起来发涩） */
  const scrubTipRef = useRef<HTMLDivElement>(null);
  const scrubText = useRef("");
  const scrubbing = useRef(false);
  const seekTrackRef = useRef<HTMLDivElement>(null);
  const seekFillRef = useRef<HTMLDivElement>(null);
  const seekKnobRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const [speed, setSpeed] = useState(1);
  const speedRef = useRef(1);
  // 开车时地图瓦片跟不上、车慢下来等的时候，控制条上写“地图加载中”
  const [tilesLoading, setTilesLoading] = useState(false);
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
        // 讲解版的 3D 地形：同样的高程瓦片当成 512 像素的用（地图第 z 级用第 z 级的，不是 z+1 级），
        // 同样的画面只下载四分之一的地形瓦片，跟车、航拍的距离上看不出粗细（10-28 仓库主人：车开过去了地图还没出来）
        instance.addSource("tour-dem", { ...dem, tileSize: 512 });
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
        // 这一天的整条路线一次放进来，每帧只换 line-gradient：画到的部分从尾巴的淡到车头的浓，后面透明（drawnGradient）。
        // lineMetrics：渐变要按“线的百分之几”算。车头是一个 DOM 标记（state.car），不在这里
        instance.addSource("tour-line", { type: "geojson", data: EMPTY, lineMetrics: true });
        instance.addLayer(
          {
            id: "tour-glow",
            type: "line",
            source: "tour-line",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-gradient": drawnGradient("#000000", 0) as ExpressionSpecification, "line-width": 16, "line-blur": 8, "line-opacity": 0.35 },
          },
          firstLabel,
        );
        instance.addLayer(
          {
            id: "tour-line",
            type: "line",
            source: "tour-line",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-gradient": drawnGradient("#000000", 0) as ExpressionSpecification, "line-width": 5, "line-opacity": 0.95 },
          },
          firstLabel,
        );
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
        sentRef.current = { points: "", trails: "", legs: "", extras: "" };
        setReady(true);
      });
    });

    return () => {
      cancelled = true;
      if (tourRef.current) {
        cancelAnimationFrame(tourRef.current.raf);
        holdClock(false);
      }
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
  /** 车头挪到 at（第一次用时放上去）：DOM 标记跟着镜头一起动，不会像数据源那样晚一两帧、一抖一抖 */
  const placeCar = (state: TourState, color: string, at: [number, number]) => {
    const map = mapRef.current;
    if (!map || !markerClass.current) return;
    if (!state.car) {
      const element = document.createElement("div");
      element.className = "tour-car";
      element.style.setProperty("--car", color);
      state.car = new markerClass.current({ element, anchor: "center" }).setLngLat(at).addTo(map);
      return;
    }
    state.car.setLngLat(at);
  };
  const removeCar = (state: TourState) => {
    state.car?.remove();
    state.car = null;
  };
  /** 这一天画到第几公里：两层线（光晕和线本身）换渐变，车头挪过去。线在地图上的百分比没变就不重算渐变 */
  const drawTo = (state: TourState, day: TourDay, plan: DayPlan, distance: number) => {
    const map = mapRef.current;
    if (!map) return;
    const fraction = lineFraction(plan.cum, plan.merc, distance);
    if (Math.abs(fraction - state.fraction) > 1e-6) {
      state.fraction = fraction;
      // validate: false：每帧都换，样式校验没必要（表达式是 drawnGradient 拼的，格式固定）
      map.setPaintProperty("tour-line", "line-gradient", drawnGradient(day.color, fraction) as ExpressionSpecification, { validate: false });
      map.setPaintProperty("tour-glow", "line-gradient", drawnGradient(day.color, fraction, 1) as ExpressionSpecification, { validate: false });
    }
    placeCar(state, day.color, pointAt(day.path, plan.cum, distance));
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
    state.prefetch.abort();
    clearMarkers(state);
    removeCar(state);
    tourRef.current = null;
    holdClock(false);
    setTilesLoading(false);
    map.setSourceTileLodParams(DEFAULT_LOD_LEVELS, DEFAULT_LOD_RATIO);
    ["tour-done", "tour-line"].forEach((id) => setLine(id, []));
    // 预热时开过的路线是淡到看不见的，预热没完就停了也要改回来
    map.setPaintProperty("tour-done", "line-opacity", 0.55);
    if (state.pixelRatio !== null) map.setPixelRatio(state.pixelRatio);
    for (const id of state.hidden) if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", "visible");
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
    if (progressRef.current) progressRef.current.style.transform = "scaleX(0)";
    map.setPadding(NO_PADDING);
    map.easeTo({ pitch: terrainRef.current ? 60 : 0, bearing: 0, duration: 600 });
    fitToPoints(map, pointsRef.current, true);
  };

  // ---------- 一个钟说了算（10-28 仓库主人：进度条要像 YouTube 那样跟着走、拖到哪就从哪播） ----------
  // 整段动画是一条时间线（tourTimeline：开头、每天开场、开车、各站讲解、一天的结尾、结尾），state.position 是播到第几毫秒（一倍速下）。
  // 每一帧只做一件事：钟往前走，再按“现在是第几毫秒”把画面摆出来（车在哪、线画到哪、哪张卡片、念哪一句）。
  // 进度条只看这个钟，所以拖到任何地方都能从那里接着播。讲解词按每句的阅读时间排在这一段里，到点了念下一句；
  // 一句念得比估计的慢，钟在下一句开始前等它念完（像视频缓冲时进度条停一下），不会两句叠在一起

  /** 这一段要念的话（讲解版才有）：开头、某一天的开场、某一站、结尾 */
  const speechOf = (state: TourState, segment: TourSegment): string[] => {
    if (!state.narrated) return [];
    if (segment.kind === "intro") return narration?.intro.speech ?? [];
    if (segment.kind === "outro") return narration?.outro.speech ?? [];
    if (segment.kind === "day") return state.days[segment.day].narration ?? [];
    if (segment.kind === "stop") return state.days[segment.day].stops[segment.stop]?.narration?.speech ?? [];
    return [];
  };

  /** 念一句：念完 talking 放下；被拖进度条、退出顶掉的不管 */
  const sayLine = (state: TourState, sentence: string) => {
    narratorRef.current ??= new Narrator(narration?.lang ?? "zh-CN", setCaption, muted);
    narratorRef.current.rate = speedRef.current;
    // 开口时配乐压低，停下抬回来
    narratorRef.current.onVoice = (speaking) => scoreRef.current?.duck(speaking);
    state.talking = true;
    state.sampleOk = true;
    const voice = ++state.voice;
    // 动画的钟按倍速走、暂停时不走：念了多久直接按它量，就是一倍速下的毫秒数
    const started = state.clock;
    const narrator = narratorRef.current;
    narrator.play([sentence]).then(() => {
      if (tourRef.current !== state || state.voice !== voice) return;
      state.talking = false;
      // 关了声音、没念出声（按阅读时间只出字幕）的不算；中间暂停过的也不算
      if (state.sampleOk && narrator.voiced && !narrator.muted) calibrate(state, (state.clock - started) / readingMs(sentence));
    });
  };
  /** 正在念的停掉（拖进度条、跳段） */
  const hush = (state: TourState) => {
    state.voice += 1;
    state.talking = false;
    narratorRef.current?.stop();
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
  /** 整趟的范围（开头讲怎么看地图、最后拉远看全程） */
  const fitAll = (state: TourState, map: MapLibreMap, duration: number, bottom: number) => {
    const all = state.days.flatMap((day) => [...day.path, ...day.stops.map((stop) => [stop.lon, stop.lat] as [number, number])]);
    if (all.length < 2) return;
    map.setPadding(NO_PADDING);
    map.fitBounds(
      [
        [Math.min(...all.map((p) => p[0])), Math.min(...all.map((p) => p[1]))],
        [Math.max(...all.map((p) => p[0])), Math.max(...all.map((p) => p[1]))],
      ],
      { padding: { top: 64, bottom, left: 64 + sidePanel.current, right: 64 }, maxZoom: 12, duration, pitch: 0, bearing: 0 },
    );
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
  /** 开到第几公里了：到过的站补上牌子（拖进度条跳过来的，只留最近的三个，不一个个弹出来） */
  const reachStops = (state: TourState, distance: number, jumped: boolean) => {
    const day = state.days[state.index];
    const plan = state.plans[state.index];
    let reached = state.shown;
    while (reached < day.stops.length && (plan.stopKm[reached] ?? 0) <= distance + 1e-6) reached += 1;
    if (reached === state.shown) return;
    const from = jumped ? Math.max(state.shown, reached - 3) : state.shown;
    for (let k = from; k < reached; k++) addMarker(state, day, k);
    state.shown = reached;
  };

  /**
   * 提前下载这一天跟车时要用的地图瓦片（底图、地形、开着卫星图时的卫星图）：沿路线按跟车镜头的缩放取瓦片，
   * 浏览器缓存下来，车开到时地图直接从缓存里拿。每天只下载一次，同时最多 6 个请求，退出时全部取消
   */
  const prefetchDay = (state: TourState, index: number) => {
    const map = mapRef.current;
    const day = state.days[index];
    const plan = state.plans[index];
    if (!map || !day || !plan || state.prefetched.has(index) || state.calm) return;
    state.prefetched.add(index);
    // 底图是 512 像素的矢量瓦片（地图第 z 级用第 z 级的），地形、卫星图是 256 像素的（用第 z+1 级）；远处画面用低两级的
    const zoomAt = (i: number) => Math.floor(followZoom(slowness(plan.cum[i] ?? 0, plan.stopKm, plan.total)));
    // 路线点很密（几千个），隔几个取一个就够了：同一块瓦片里的点算出来是同一块
    const path = day.path.filter((_, i) => i % 4 === 0 || i === day.path.length - 1);
    const pick = (i: number) => day.path.indexOf(path[i]);
    const groups: { template: string; tiles: string[] }[] = [];
    const vector = (map.getSource("openmaptiles") as { tiles?: string[] } | undefined)?.tiles?.[0];
    if (vector) groups.push({ template: vector, tiles: tilesAlongPath(path, (i) => [zoomAt(pick(i)), zoomAt(pick(i)) - 2]) });
    const raster = tilesAlongPath(path, (i) => [zoomAt(pick(i)) + 1, zoomAt(pick(i)) - 1]);
    groups.push({ template: TERRAIN_TILES, tiles: raster });
    if (satelliteRef.current) groups.push({ template: imagery === "eox" ? EOX_IMAGERY_TILES : IMAGERY_TILES, tiles: raster });
    // 讲解版的 3D 地形用 512 像素的地形源（tour-dem），第 z 级用第 z 级的
    if (state.terrainAdded) groups.push({ template: TERRAIN_TILES, tiles: tilesAlongPath(path, (i) => [zoomAt(pick(i))]) });
    const urls = [...new Set(groups.flatMap((group) => group.tiles.map((tile) => tileUrl(group.template, tile))))];
    const controller = state.prefetch;
    let next = 0;
    const worker = async () => {
      while (next < urls.length && !controller.signal.aborted) {
        const url = urls[next++];
        await fetch(url, { signal: controller.signal }).then((response) => response.blob()).catch(() => undefined);
      }
    };
    for (let i = 0; i < PREFETCH_PARALLEL; i++) void worker();
  };

  /** 换到第 index 天：这一天的整条路线先放进地图（渐变全透明），之前几天的留成“开过的路线”，别的天的景点淡下去 */
  const setupDay = (state: TourState, index: number, card: boolean, jumped: boolean) => {
    const map = mapRef.current;
    if (!map) return;
    const day = state.days[index];
    const plan = state.plans[index];
    clearMarkers(state);
    state.index = index;
    state.shown = 0;
    state.cardHidden = !card;
    state.dusk = false;
    state.fraction = -1;
    state.done = state.days.slice(0, index).map((item) => lineFeature(item.path, item.color));
    setLine("tour-done", state.done);
    setLine("tour-line", day.path.length > 1 ? [lineFeature(day.path, day.color)] : []);
    state.car?.getElement().style.setProperty("--car", day.color);
    drawTo(state, day, plan, 0);
    focusOn(day.stops.map((stop) => stop.id));
    map.setLayoutProperty("legs", "visibility", "none");
    map.setLayoutProperty("legs-straight", "visibility", "none");
    setTourUi({
      index,
      days: state.days.map(({ day: n, color }) => ({ day: n, color })),
      title: day.title,
      heading: day.heading,
      date: day.date,
      subtitle: day.subtitle,
      color: day.color,
      card,
      finale: false,
      paused: state.pausedAt !== null,
      dusk: false,
    });
    if (state.calm) calmView(map, day, jumped ? 0 : flyMs(state.days.length) / speedRef.current);
    // 这一天每一站的头两张先下载，到站时卡片上的照片不会先空一下；地图瓦片今天的、明天的都先下载
    if (state.narrated) for (const stop of day.stops) preloadPhotos(stop.photos, 2);
    prefetchDay(state, index);
    prefetchDay(state, index + 1);
  };

  /** 跟车的镜头放到第 distance 公里，朝车要开的方向（拖进度条跳过来、每天开头飞到起点） */
  const followAt = (state: TourState, distance: number) => {
    const map = mapRef.current;
    const day = state.days[state.index];
    const plan = state.plans[state.index];
    if (!map) return null;
    const zoom = followZoom(slowness(distance, plan.stopKm, plan.total));
    const head = pointAt(day.path, plan.cum, distance);
    const further = pointAt(day.path, plan.cum, distance + Math.max(0.8, lookAhead(zoom) * 3));
    const bearing = further[0] !== head[0] || further[1] !== head[1] ? bearingOf(head, further) : map.getBearing();
    return { center: head, zoom, bearing, pitch: state.narrated ? NARRATED_PITCH : FOLLOW_PITCH };
  };

  /**
   * 进到第 index 段（offset 是进了这一段多少毫秒）。jumped：拖进度条、跳段过来的，镜头直接摆好、不飞，
   * 到过的站的牌子一次补上；正常播过来的，镜头飞过去、牌子一个个弹出来
   */
  const enter = (state: TourState, index: number, offset: number, jumped: boolean) => {
    const map = mapRef.current;
    const segment = state.timeline[index];
    if (!map || !segment) return;
    state.segment = index;
    state.flow = 1;
    state.waited = 0;
    // 这一段要念的话，按每句的阅读时间排好；跳到一段讲解的中间，从正在念的那一句开始
    const lines = speechOf(state, segment).flatMap((line) => sentences(line));
    state.speech = lines.length ? { lines, starts: slotStarts(lines.map((line) => readingMs(line) * state.pace)) } : null;
    state.spoken = state.speech && jumped ? sentenceAt(state.speech.starts, offset) : 0;
    const day = "day" in segment ? state.days[segment.day] : undefined;
    if (segment.kind === "intro") {
      // 开头：先看整趟的全貌，讲怎么看这张地图（彩色的线是每天的路线）
      clearMarkers(state);
      removeCar(state);
      state.index = 0;
      state.done = [];
      setLine("tour-done", []);
      setLine("tour-line", []);
      focusOn(null);
      map.setLayoutProperty("legs", "visibility", "visible");
      map.setLayoutProperty("legs-straight", "visibility", "visible");
      setBeat({ kind: "intro" });
      setTourUi({
        index: 0,
        days: state.days.map(({ day: n, color }) => ({ day: n, color })),
        title: narration?.intro.title ?? "",
        color: "#1c1b18",
        card: false,
        finale: false,
        paused: state.pausedAt !== null,
        dusk: false,
      });
      const bottom = () => Math.max(150, Math.round(map.getContainer().clientHeight * bottomPanel.current));
      // 刚铺满全屏时要等地图量好新尺寸
      if (jumped) fitAll(state, map, 0, bottom());
      else
        setTimeout(() => {
          map.resize();
          fitAll(state, map, 900, bottom());
        }, 120);
      return;
    }
    if (segment.kind === "outro") {
      // 最后一天画完：所有天的路线都留着，镜头拉远看全程
      clearMarkers(state);
      removeCar(state);
      state.index = state.days.length - 1;
      state.done = state.days.map((item) => lineFeature(item.path, item.color));
      setLine("tour-done", state.done);
      setLine("tour-line", []);
      focusOn(null);
      fitAll(state, map, jumped ? 0 : 1100 / speedRef.current, 64 + (state.narrated ? 72 : 0));
      setTourUi((ui) => (ui ? { ...ui, card: false, finale: true, dusk: false } : ui));
      setBeat(state.narrated ? { kind: "outro" } : null);
      return;
    }
    if (!day) return;
    if (segment.day !== state.index || jumped || !state.car) setupDay(state, segment.day, segment.kind === "day", jumped);
    if (segment.kind === "day") {
      setTourUi((ui) => (ui ? { ...ui, card: true } : ui));
      state.cardHidden = false;
      if (state.narrated) {
        setBeat({ kind: "day", day });
        if (!jumped) scoreRef.current?.swell();
      }
      if (!state.calm) {
        // 跟车：飞到起点，从车后上方朝车要开的方向看；跳过来的直接摆好
        const start = followAt(state, 0);
        if (start) {
          state.camera = { ...start };
          if (jumped) map.jumpTo({ ...start, padding: followPadding(map) });
          else map.flyTo({ ...start, padding: followPadding(map), duration: FOLLOW_FLY_MS / speedRef.current });
        }
      }
      return;
    }
    if (segment.kind === "drive") {
      if (state.narrated) setBeat(null);
      if (!state.cardHidden) {
        state.cardHidden = true;
        setTourUi((ui) => (ui && ui.card ? { ...ui, card: false } : ui));
      }
      if (jumped && !state.calm) {
        const plan = state.plans[segment.day];
        const at = followAt(state, driveDistance(plan, segment, offset / Math.max(1, segment.ms), state.calm));
        if (at) {
          state.camera = { ...at };
          map.jumpTo({ ...at, padding: followPadding(map) });
        }
      }
      return;
    }
    if (segment.kind === "stop") {
      const plan = state.plans[segment.day];
      const at = plan.stopKm[segment.stop] ?? 0;
      drawTo(state, day, plan, at);
      reachStops(state, at, jumped);
      const stop = day.stops[segment.stop];
      if (state.narrated && stop?.narration) {
        preloadPhotos(stop.photos);
        setBeat({ kind: "stop", stop, index: segment.stop + 1, color: day.color });
      }
      if (jumped && !state.calm) {
        const near = followAt(state, at);
        if (near) {
          state.camera = { ...near };
          map.jumpTo({ ...near, padding: followPadding(map) });
        }
      }
      return;
    }
    // 一天开完：镜头拉回来看这一天的全程
    const plan = state.plans[segment.day];
    drawTo(state, day, plan, plan.total);
    reachStops(state, plan.total, jumped);
    if (state.narrated) setBeat(null);
    if (!state.calm) {
      map.setPadding(NO_PADDING);
      const height = map.getContainer().clientHeight;
      map.fitBounds(bounds(day), {
        padding: { top: Math.round(height * 0.12), bottom: Math.round(height * Math.max(0.2, bottomPanel.current)), left: 56 + sidePanel.current, right: 56 },
        maxZoom: 12.5,
        duration: jumped ? 0 : 1200 / speedRef.current,
        pitch: TOUR_PITCH,
        bearing: 0,
      });
      state.camera = null;
    }
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

  /** 环绕镜头的一帧：绕着镜头现在对着的地方（这一站、这一天的起点）慢慢转，拉近、压低（航拍的环绕镜头） */
  const orbit = (state: TourState, map: MapLibreMap, delta: number) => {
    const prev = state.camera ?? { center: map.getCenter().toArray() as [number, number], zoom: map.getZoom(), bearing: map.getBearing() };
    const zoom = prev.zoom + (Math.min(ORBIT_MAX_ZOOM, followZoom(1.2) + ORBIT_ZOOM_IN) - prev.zoom) * (1 - Math.exp(-delta / 2400));
    const prevPitch = prev.pitch ?? map.getPitch();
    const bearing = prev.bearing + delta * ORBIT_DEG_PER_MS;
    // 转到被山挡住的方向时自动抬高，转过去了再压低
    const want = sightCap(state, map, prev.center, bearing, zoom, ORBIT_PITCH);
    const pitch = prevPitch + (want - prevPitch) * (1 - Math.exp(-delta / 900));
    state.camera = { center: prev.center, zoom, bearing, pitch };
    map.jumpTo({ center: prev.center, zoom, bearing, pitch, padding: followPadding(map) });
  };

  /** 跟车的一帧：位置、缩放、方向都慢慢跟过去（按这一帧过了多久算，帧率不同也一样快） */
  const follow = (state: TourState, map: MapLibreMap, distance: number, delta: number) => {
    const day = state.days[state.index];
    const plan = state.plans[state.index];
    const head = pointAt(day.path, plan.cum, distance);
    const prev = state.camera ?? { center: map.getCenter().toArray() as [number, number], zoom: map.getZoom(), bearing: map.getBearing() };
    const zoom = prev.zoom + (followZoom(slowness(distance, plan.stopKm, plan.total)) - prev.zoom) * (1 - Math.exp(-delta / 700));
    const k = 1 - Math.exp(-delta / 140);
    const center: [number, number] = [prev.center[0] + (head[0] - prev.center[0]) * k, prev.center[1] + (head[1] - prev.center[1]) * k];
    // 方向看车前面一段路，免得山路上来回打转；开到终点、前面没有路了就不再转
    const further = pointAt(day.path, plan.cum, distance + Math.max(0.8, lookAhead(zoom) * 3));
    const moving = further[0] !== head[0] || further[1] !== head[1];
    const bearing = moving ? turnToward(prev.bearing, bearingOf(head, further), 1 - Math.exp(-delta / 900)) : prev.bearing;
    // 从环绕镜头出来时慢慢抬回跟车的角度
    const pitchTarget = state.narrated ? sightCap(state, map, head, bearing, zoom, NARRATED_PITCH) : FOLLOW_PITCH;
    const prevPitch = prev.pitch ?? map.getPitch();
    const pitch = prevPitch + (pitchTarget - prevPitch) * (1 - Math.exp(-delta / 900));
    state.camera = { center, zoom, bearing, pitch };
    map.jumpTo({ center, zoom, bearing, pitch, padding: followPadding(map) });
  };

  /** 第 index 段走到 offset 毫秒时的画面（每一帧、拖进度条时都调） */
  const update = (state: TourState, index: number, offset: number, delta: number, jumped: boolean) => {
    const map = mapRef.current;
    const segment = state.timeline[index];
    if (!map || !segment || !("day" in segment)) return;
    const day = state.days[segment.day];
    const plan = state.plans[segment.day];
    if (segment.kind === "day") {
      // 平常版：卡片显示到镜头快到位就收起来；讲解版：飞到起点以后话还没念完，镜头绕着起点慢慢转（像片头的航拍）
      if (!state.narrated && !state.cardHidden && offset >= segment.ms * 0.85) {
        state.cardHidden = true;
        setTourUi((ui) => (ui && ui.card ? { ...ui, card: false } : ui));
      }
      if (state.narrated && !state.calm && !jumped && offset >= FOLLOW_FLY_MS) orbit(state, map, delta);
      return;
    }
    let distance = plan.total;
    if (segment.kind === "drive") {
      distance = driveDistance(plan, segment, offset / Math.max(1, segment.ms), state.calm);
      if (!state.calm && !jumped) follow(state, map, distance, delta);
      drawTo(state, day, plan, distance);
      reachStops(state, distance, jumped);
    } else if (segment.kind === "stop") {
      distance = plan.stopKm[segment.stop] ?? 0;
      // 讲解版停在一站讲话：镜头拉近、压低，绕着这一站慢慢转；平常版停一下，镜头跟着车停住
      if (!state.calm && !jumped) {
        if (state.narrated && day.stops[segment.stop]?.narration) orbit(state, map, delta);
        else follow(state, map, distance, delta);
      }
    }
    // 画到最后天色暗下来（这一天最后看日落、星空的）
    const dusk = Boolean(day.dusk) && plan.total > 0 && distance / plan.total > 0.75;
    if (dusk !== state.dusk) {
      state.dusk = dusk;
      setTourUi((ui) => (ui && ui.dusk !== dusk ? { ...ui, dusk } : ui));
    }
  };

  /** 摆出第 position 毫秒的画面：换了段先进到那一段 */
  const step = (state: TourState, position: number, delta: number, jumped: boolean) => {
    const { segment, offset } = locate(state.starts, position);
    if (segment !== state.segment || jumped) enter(state, segment, offset, jumped);
    update(state, segment, offset, delta, jumped);
  };

  /** 进度条、时间跟着钟走：每帧直接改样式，不经过 React */
  const showProgress = (state: TourState) => {
    if (tourRef.current !== state) return;
    const total = state.starts[state.starts.length - 1] || 1;
    const percent = Math.min(100, (state.position / total) * 100);
    // 只改 transform、clip-path（不改宽度、left），浏览器不用每帧重新排版；时间文字、百分比变了才改
    if (progressRef.current) progressRef.current.style.transform = `scaleX(${percent / 100})`;
    if (!scrubbing.current) {
      if (seekFillRef.current) seekFillRef.current.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
      if (seekKnobRef.current) seekKnobRef.current.style.transform = `translate3d(${percent}%,0,0)`;
    }
    const rounded = Math.round(percent);
    if (rounded !== state.percentShown) {
      state.percentShown = rounded;
      seekTrackRef.current?.setAttribute("aria-valuenow", String(rounded));
    }
    const clock = `${clockText(state.position, speedRef.current)} / ${clockText(total, speedRef.current)}`;
    if (clock !== state.clockShown) {
      state.clockShown = clock;
      if (clockRef.current) clockRef.current.textContent = clock;
    }
  };

  /** 底图（OpenFreeMap 的矢量瓦片）和讲解版的 3D 地形，画面里要的都到了没有 */
  const basemapReady = (map: MapLibreMap, state: TourState) =>
    ["openmaptiles", ...(state.terrainAdded ? ["tour-dem"] : [])].every((id) => !map.getSource(id) || map.isSourceLoaded(id));

  const frame = (stamp: number) => {
    const state = tourRef.current;
    const map = mapRef.current;
    if (!state || !map) return;
    state.raf = requestAnimationFrame(frame);
    const real = Math.min(MAX_FRAME_MS, Math.max(0, stamp - state.last));
    state.last = stamp;
    // 拖进度条时：画面跟着手走（一帧最多摆一次），钟不走、不念
    if (state.scrub) {
      if (state.scrub.preview !== null) {
        seekTo(state.scrub.preview, false);
        state.scrub.preview = null;
      }
      return;
    }
    if (state.pausedAt !== null || state.warming) return;
    // 倍速：钟走得快慢就是倍速；暂停时钟不走
    const delta = real * speedRef.current;
    state.clock += delta;
    const total = state.starts[state.starts.length - 1] ?? 0;
    const current = state.timeline[state.segment];
    // 开车时底图跟不上（车开过去了地图还是空白）：车慢下来等一等（最慢三成），底图到了再慢慢加速回去。
    // 只看底图和讲解版的 3D 地形：地形阴影、远处地平线那边的瓦片总有几块在下载，看所有瓦片的话车一直在慢
    const behind = current?.kind === "drive" && !state.calm && state.waited < TILE_WAIT_MAX && !basemapReady(map, state);
    if (behind) state.waited += real;
    state.flow += ((behind ? TILE_SLOW : 1) - state.flow) * (1 - Math.exp(-real / FLOW_EASE_MS));
    const loading = state.flow < 0.6;
    if (loading !== state.loading) {
      state.loading = loading;
      setTilesLoading(loading);
    }
    let position = Math.min(total, state.position + delta * state.flow);
    // 一句还没念完：钟在下一句开始前（或这一段结束前）等它
    if (state.talking && state.speech) {
      const start = state.starts[state.segment];
      const boundary = state.spoken < state.speech.starts.length ? start + state.speech.starts[state.spoken] : state.starts[state.segment + 1];
      if (position > boundary - 1) position = Math.max(state.position, boundary - 1);
    }
    state.position = position;
    step(state, position, delta, false);
    // 到点了念下一句
    const speech = state.speech;
    if (speech && !state.talking && state.spoken < speech.lines.length && state.starts[state.segment] + speech.starts[state.spoken] <= position) {
      sayLine(state, speech.lines[state.spoken]);
      state.spoken += 1;
    }
    showProgress(state);
    if (position >= total && !state.talking) finishTour();
  };

  /** 跳到第 ms 毫秒（拖进度条、点进度条、上一段 / 下一段）：画面直接摆好；speak 时从那里接着念、接着走，拖动中预览的不念 */
  const seekTo = (ms: number, speak = true) => {
    const state = tourRef.current;
    const map = mapRef.current;
    if (!state || !map) return;
    hush(state);
    setCaption(null);
    const total = state.starts[state.starts.length - 1] ?? 0;
    state.position = Math.min(Math.max(0, ms), Math.max(0, total - 1));
    state.camera = null;
    state.sight = null;
    step(state, state.position, 0, true);
    if (!speak) state.spoken = state.speech?.lines.length ?? 0;
    state.last = performance.now();
    showProgress(state);
  };

  /** 整段时间线：念的部分按每句的阅读时间 × 朗读的快慢排 */
  const buildTimeline = (days: TourDay[], plans: DayPlan[], narrated: boolean, calm: boolean, pace: number) =>
    tourTimeline(days, plans, {
      narrated,
      calm,
      fly: calm ? flyMs(days.length) : FOLLOW_FLY_MS,
      hold: HOLD_MS,
      arrive: ARRIVE_MS,
      finale: FINALE_MS,
      speech: (lines) => lines.flatMap((line) => sentences(line)).reduce((sum, sentence) => sum + readingMs(sentence) * pace, 0),
      intro: narration?.intro.speech,
      outro: narration?.outro.speech,
    });

  /**
   * 念完一句，量一下实际念了多久：最近几句的中位数和时间线用的差一成以上，就按它重排时间线。
   * 各段的先后不变，只是念的段变长、变短；现在播到的地方按在这一段里的比例挪过去，进度条接着走
   */
  const calibrate = (state: TourState, ratio: number) => {
    if (!Number.isFinite(ratio) || ratio < 0.4 || ratio > 3) return;
    state.paceSamples = [...state.paceSamples, ratio].slice(-PACE_SAMPLES);
    const sorted = [...state.paceSamples].sort((a, b) => a - b);
    const pace = Math.min(2, Math.max(0.6, sorted[sorted.length >> 1]));
    if (state.paceSamples.length < 2 || Math.abs(pace - state.pace) / state.pace < PACE_REBUILD) return;
    const before = locate(state.starts, state.position);
    const oldMs = state.timeline[before.segment]?.ms || 1;
    state.pace = pace;
    state.timeline = buildTimeline(state.days, state.plans, state.narrated, state.calm, pace);
    state.starts = segmentStarts(state.timeline);
    state.position = state.starts[before.segment] + (before.offset / oldMs) * (state.timeline[before.segment]?.ms ?? 0);
    if (state.speech) state.speech.starts = slotStarts(state.speech.lines.map((line) => readingMs(line) * pace));
    setTrack({ days: state.days, timeline: state.timeline, starts: state.starts });
    try {
      localStorage.setItem(PACE_KEY, pace.toFixed(2));
    } catch {}
  };

  const startTour = (days: TourDay[], from = 0, narrated = false) => {
    const map = mapRef.current;
    if (!map || days.length === 0) return;
    if (tourRef.current) {
      cancelAnimationFrame(tourRef.current.raf);
      tourRef.current.prefetch.abort();
      clearMarkers(tourRef.current);
      removeCar(tourRef.current);
      if (tourRef.current.pixelRatio !== null) map.setPixelRatio(tourRef.current.pixelRatio);
      for (const id of tourRef.current.hidden) if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", "visible");
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
    const calm = reducedMotion();
    const plans = days.map((day) => planDay(day, days.length, calm));
    let pace = 1;
    try {
      const saved = Number(localStorage.getItem(PACE_KEY));
      if (saved >= 0.6 && saved <= 2) pace = saved;
    } catch {}
    const timeline = buildTimeline(days, plans, narrated, calm, pace);
    const starts = segmentStarts(timeline);
    // 从第 from 天开始的：钟放到那一天开场的地方
    const firstDay = timeline.findIndex((segment) => segment.kind === "day" && segment.day === from);
    const state: TourState = {
      days,
      index: Math.min(from, days.length - 1),
      calm,
      narrated,
      plans,
      timeline,
      starts,
      position: from > 0 && firstDay >= 0 ? starts[firstDay] : 0,
      segment: -1,
      clock: 0,
      last: performance.now(),
      speech: null,
      spoken: 0,
      talking: false,
      voice: 0,
      pace,
      paceSamples: [],
      sampleOk: false,
      flow: 1,
      waited: 0,
      loading: false,
      scrub: null,
      camera: null,
      pausedAt: null,
      raf: 0,
      shown: 0,
      done: days.slice(0, from).map((day) => lineFeature(day.path, day.color)),
      markers: [],
      terrainAdded: false,
      sight: null,
      car: null,
      fraction: -1,
      cardHidden: false,
      dusk: false,
      warming: false,
      afterWarm: null,
      pixelRatio: null,
      hidden: [],
      clockShown: "",
      percentShown: -1,
      prefetch: new AbortController(),
      prefetched: new Set(),
    };
    tourRef.current = state;
    holdClock(true);
    setTilesLoading(false);
    // 远处（镜头压低时地平线那边）少下载一些瓦片：同样的画面，倾斜时最多下载平视时的 2 倍（默认 3 倍），结束时改回来
    map.setSourceTileLodParams(DEFAULT_LOD_LEVELS, TOUR_LOD_RATIO);
    // 讲解版：打开 3D 地形和天空（远处的山带一点雾），镜头压低时像航拍；平常已经开着地形的不动它。
    // 地形用 512 像素的地形源（tour-dem）：同样的画面下载的地形瓦片是原来的四分之一，跟车时看不出差别
    if (narrated && !calm) {
      if (!map.getTerrain()) {
        map.setTerrain({ source: "tour-dem", exaggeration: TERRAIN_EXAGGERATION });
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
    // 先下载开头这一天的瓦片（讲开头、预热的时候就在下载了）
    prefetchDay(state, state.index);
    // 预热：路线的两层线、“开过的路线”第一次画出来时要编译显卡程序（打开 3D 地形、天空后所有图层还要再编一遍），
    // 主线程会卡一会儿（慢的电脑上一秒多），要是赶在镜头飞、车开的时候就会顿一下、跳一截。
    // 所以先把第一天的路线放进去（渐变全透明，看不见）、开过的路线淡到几乎看不见，等地图把它们画出来一帧，再开始讲、开始动
    const first = days[state.index];
    for (const layer of ["tour-line", "tour-glow"]) map.setPaintProperty(layer, "line-gradient", drawnGradient(first.color, 0) as ExpressionSpecification, { validate: false });
    setLine("tour-line", first.path.length > 1 ? [lineFeature(first.path, first.color)] : []);
    setLine("tour-done", [...state.done, lineFeature(first.path, first.color)]);
    map.setPaintProperty("tour-done", "line-opacity", 0.01);
    // 每天开头把别的天的景点淡下去（focusOn）：透明度从固定值换成按每个点算，也要另编一套显卡程序，一起先编好
    focusOn(first.stops.map((stop) => stop.id));
    state.warming = true;
    let loaded = false;
    const warmed = () => {
      map.off("render", onRender);
      if (tourRef.current !== state || !state.warming) return;
      map.setPaintProperty("tour-done", "line-opacity", 0.55);
      setLine("tour-done", state.done);
      focusOn(null);
      state.warming = false;
      state.last = performance.now();
      const next = state.afterWarm;
      state.afterWarm = null;
      next?.();
    };
    // 两个数据源切好图以后再画一帧（那一帧里编译），画完就开始
    const onRender = () => {
      if (loaded) warmed();
      else if (map.isSourceLoaded("tour-line") && map.isSourceLoaded("tour-done")) {
        loaded = true;
        map.triggerRepaint();
      }
    };
    map.on("render", onRender);
    // 地图一直没画（标签页在后台）、瓦片一直没下完，也最多等这么久
    setTimeout(warmed, narrated ? 3000 : 1200);
    map.triggerRepaint();
    if (narrated) {
      // 3D 建筑（底图 14 级以上的 building-3d）：在国家公园里没什么用（镇上的房子还有平面的轮廓），
      // 拉近到站时第一次出现要编译显卡程序（卡一两百毫秒），压在 3D 地形上画也很费显卡，讲解版先藏起来
      for (const layer of map.getStyle().layers) {
        if (layer.type === "fill-extrusion" && map.getLayoutProperty(layer.id, "visibility") !== "none") {
          map.setLayoutProperty(layer.id, "visibility", "none");
          state.hidden.push(layer.id);
        }
      }
      // 高分屏上铺满全屏的 3D 地形像素太多：清晰度最多 1.5 倍，结束时改回来
      const ratio = map.getPixelRatio();
      if (ratio > NARRATED_PIXEL_RATIO) {
        state.pixelRatio = ratio;
        map.setPixelRatio(NARRATED_PIXEL_RATIO);
      }
    }
    setTrack(narrated ? { days, timeline, starts } : null);
    // 预热完从开头（或第 from 天）播起：开头那一段正常进（镜头飞过去），之后每帧按钟走
    state.afterWarm = () => {
      step(state, state.position, 0, false);
      showProgress(state);
    };
    state.raf = requestAnimationFrame(frame);
  };

  const togglePause = () => {
    const state = tourRef.current;
    if (!state) return;
    // 暂停时钟不走，继续时接着走，不用再补时间；念到一半的那句从头再念
    if (state.pausedAt === null) {
      state.pausedAt = performance.now();
      state.sampleOk = false;
      narratorRef.current?.pause();
      scoreRef.current?.pause();
    } else {
      state.pausedAt = null;
      state.last = performance.now();
      if (state.talking) narratorRef.current?.resume();
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

  /** 进度条上第 ratio（0–1）的位置是第几毫秒 */
  const msAt = (ratio: number) => {
    const state = tourRef.current;
    return state ? ratio * (state.starts[state.starts.length - 1] ?? 0) : 0;
  };
  /** 按下进度条：开始拖，画面先停住（像视频播放器），拖到哪画面摆到哪 */
  const beginScrub = (ratio: number) => {
    const state = tourRef.current;
    if (!state) return;
    if (!state.scrub) {
      state.scrub = { preview: null, paused: state.pausedAt !== null };
      narratorRef.current?.pause();
      scoreRef.current?.pause();
    }
    state.scrub.preview = msAt(ratio);
  };
  const moveScrub = (ratio: number) => {
    const state = tourRef.current;
    if (state?.scrub) state.scrub.preview = msAt(ratio);
  };
  /** 松手：跳过去，原来在播的接着播（原来暂停着的还是暂停，继续时从那里念） */
  const endScrub = (ratio: number | null) => {
    const state = tourRef.current;
    if (!state?.scrub) return;
    const { paused } = state.scrub;
    state.scrub = null;
    if (ratio !== null) seekTo(msAt(ratio));
    if (!paused) {
      state.pausedAt = null;
      scoreRef.current?.resume();
    }
    state.last = performance.now();
    showProgress(state);
  };
  /** 往前、往后跳几秒（键盘 J / L，像视频网站） */
  const skipBy = (ms: number) => {
    const state = tourRef.current;
    if (state) seekTo(state.position + ms);
  };
  const stepChapter = (direction: 1 | -1) => {
    const state = tourRef.current;
    if (state) seekTo(state.starts[chapterStep(state.timeline, state.starts, state.position, direction)] ?? 0);
  };

  // 讲解版的键盘：空格（或 K）暂停 / 继续，左右键上一段 / 下一段，J / L 往回、往前 10 秒；不是真全屏（iPhone 那种盖满窗口）时 Esc 退出
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
    } else if (event.key === "j" || event.key === "l") {
      // J / L：往回、往前跳 10 秒（YouTube 的快捷键）
      event.preventDefault();
      skipBy(event.key === "l" ? 10000 : -10000);
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
    const sent = sentRef.current;
    const keys = { points: pointsKey(points), trails: linesKey(trails), legs: linesKey(legs) };
    if (keys.points !== sent.points) (map.getSource("points") as GeoJSONSource).setData(pointsToGeoJSON(points));
    if (keys.trails !== sent.trails) {
      (map.getSource("trails") as GeoJSONSource).setData(
        linesToGeoJSON((trails ?? []).map((trail) => ({ id: trail.id, coordinates: trail.path }))),
      );
    }
    if (keys.legs !== sent.legs) {
      (map.getSource("legs") as GeoJSONSource).setData(
        linesToGeoJSON((legs ?? []).map((leg) => ({ id: leg.id, coordinates: leg.path, color: leg.color, straight: leg.straight }))),
      );
    }
    Object.assign(sent, keys);
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
    const key = pointsKey(extras);
    if (key === sentRef.current.extras) return;
    sentRef.current.extras = key;
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

  // 鼠标停在列表里的某个景点上：地图上那个点亮起来（加一圈），镜头不动；点不在画面里时只平移过去、不拉近，
  // 离开 450 毫秒后回到原来的位置。往下翻列表时鼠标扫过一张张卡片，地图不再一下一下拉到几百米那么近（10-22 仓库主人觉得晕）；
  // 要看清楚就点景点的名字（selectedId），那时才拉近。移开之前点过某个景点（选中了）就停在选中的那个，不回去；播动画的时候不动
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
          if (!map.getBounds().contains([point.lon, point.lat])) map.easeTo({ center: [point.lon, point.lat], duration: 700 });
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
    if (!onCursorReady || !ready) return;
    onCursorReady((at) => {
      const map = mapRef.current;
      const MarkerClass = markerClass.current;
      if (!at || !map || !MarkerClass) {
        cursorMarker.current?.remove();
        cursorMarker.current = null;
        return;
      }
      if (cursorMarker.current) cursorMarker.current.setLngLat(at);
      else {
        const element = document.createElement("div");
        element.className = "map-cursor";
        cursorMarker.current = new MarkerClass({ element }).setLngLat(at).addTo(map);
      }
    });
    return () => {
      cursorMarker.current?.remove();
      cursorMarker.current = null;
      onCursorReady(null);
    };
  }, [onCursorReady, ready]);

  useEffect(() => {
    selectedRef.current = selectedId;
    const map = mapRef.current;
    if (!ready || !map) return;
    map.setFilter("points-selected", ["==", ["get", "id"], selectedId ?? ""]);
    if (map.getLayer("camps")) {
      map.setLayoutProperty("camps", "icon-size", ["case", ["==", ["get", "id"], selectedId ?? ""], 1.35, 1]);
    }
    map.setFilter("trails-highlight", ["==", ["get", "id"], highlightTrailId ?? ""]);
  }, [ready, points, selectedId, highlightTrailId]);

  // 点了名字（或地图上的点）：拉近到看得清这一处、周围的路和景点也还在画面里，不拉到几百米。
  // 只在选中的景点变了、或者又点了一次（focusTick）时动镜头；鼠标在别的卡片上移来移去不会把地图拉回来
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || tourRef.current) return;
    const point = pointsRef.current.find((p) => p.id === selectedId);
    if (point) map.flyTo({ center: [point.lon, point.lat], zoom: Math.min(Math.max(map.getZoom(), 12.5), 14), duration: 900, essential: true });
  }, [ready, selectedId, focusTick]);

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
    if (seekKnobRef.current) seekKnobRef.current.style.transform = `translate3d(${ratio * 100}%,0,0)`;
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
  const showScrub = (ratio: number | null) => {
    const tip = scrubTipRef.current;
    if (!tip) return;
    if (ratio === null || !track) {
      tip.style.display = "none";
      return;
    }
    const ms = ratio * trackTotal;
    // 提示里写这里是哪一段、第几分几秒（像视频网站拖进度条时那样）
    const label = `${segmentLabel(track.timeline[seekTarget(track.timeline, track.starts, ms).segment], track.days)} · ${clockText(ms, speedRef.current)}`;
    if (label !== scrubText.current) {
      scrubText.current = label;
      tip.textContent = label;
    }
    tip.style.left = `${Math.min(85, Math.max(15, ratio * 100))}%`;
    tip.style.display = "block";
  };

  // 讲解卡片顶上的照片窗：车出发时图集可能还没取回来，按最新的 tour 找这一站
  const beatStop = beat?.kind === "stop" ? (tourDays.flatMap((day) => day.stops).find((stop) => stop.id === beat.stop.id) ?? beat.stop) : undefined;
  const stopPhotos = beatStop?.photos?.length ? beatStop.photos : beatStop?.photo ? [beatStop.photo] : [];
  // 每天开头：这一天各站的第一张轮流放，像片头预告今天会看到什么（住处不算）
  const beatDay = beat?.kind === "day" ? (tourDays.find((day) => day.day === beat.day.day) ?? beat.day) : undefined;
  const dayPhotos = beatDay ? beatDay.stops.flatMap((stop) => (!stop.lodging && stop.photos?.[0] ? [stop.photos[0]] : [])).slice(0, 6) : [];
  const beatSpeech = beat?.kind === "stop" ? beat.stop.narration?.speech : beat?.kind === "day" ? beat.day.narration : undefined;
  // 正在播的这一天的天气（开头讲怎么看地图、最后拉远看全程时不放）：按最新的 tour 找，天气数据可能是开播以后才回来的
  const tourWeather =
    tourUi && tourUi.heading && !tourUi.finale ? tourDays.find((day) => day.day === tourUi.days[tourUi.index]?.day)?.weather : undefined;
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
      {/* 播放时旁边的天气卡片（10-28 仓库主人）：这一天的天气、穿什么、带不带伞。电脑上放在右上角（导航按钮左边）；
          讲解版在手机上铺成顶上一条（字幕往下挪），平常版在手机上写进左下的章节字幕 */}
      {tourWeather && (
        <div
          key={tourUi?.index}
          className={`tour-pop pointer-events-none absolute z-20 bg-paper/95 px-3 py-2 text-[12px] leading-5 text-ink shadow-sm lining-nums ${
            immersive ? "inset-x-3 top-3 sm:inset-x-auto sm:right-14 sm:w-[18rem]" : "top-3 right-12 hidden w-[15rem] sm:block"
          }`}
        >
          <p className="eyebrow text-[10px] text-mute">{text.tourWeather}</p>
          <p className="mt-0.5">{tourWeather.summary}</p>
          <p className="mt-1">
            <span className="text-mute">{text.tourWear}</span> {tourWeather.wear}
          </p>
          <p>
            <span className="text-mute">{text.tourRain}</span> {tourWeather.rain}
          </p>
        </div>
      )}
      {/* 字幕：念到哪句出哪句；手机上卡片在下面，字幕放到上面 */}
      {immersive && caption && (
        <div
          className={`pointer-events-none absolute inset-x-0 z-30 flex justify-center pr-14 pl-4 sm:top-auto sm:bottom-28 sm:pr-4 sm:pl-[28rem] lg:pl-[36rem] ${tourWeather ? "top-[6.5rem]" : "top-3"}`}
        >
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
                {/* 手机上右上角放不下天气卡片（左上角是地图的开关），天气和穿衣写在章节字幕里 */}
                {tourWeather && (
                  <p className="mt-1 text-[12px] text-ink-soft lining-nums sm:hidden">
                    {tourWeather.summary} · {text.tourWear} {tourWeather.wear} · {tourWeather.rain}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
      {tourUi && !immersive && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[3px] bg-ink/10">
          <div
            ref={progressRef}
            className="h-full w-full origin-left transition-[background-color] duration-500"
            style={{ transform: "scaleX(0)", backgroundColor: tourUi.color }}
          />
        </div>
      )}
      {ready && tourDays.length > 0 && !immersive && (
        <div className="absolute bottom-9 left-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-x-3 gap-y-1.5 bg-paper/95 px-3 py-2 text-[11px] tracking-[0.08em] shadow-sm">
          {tourUi ? (
            <>
              {/* 章节字幕显示着的时候不重复标题 */}
              {!tourUi.card && !tourUi.finale && <span className="font-serif text-sm tracking-normal lining-nums">{tourUi.title}</span>}
              {tilesLoading && <span className="text-ink-soft">{text.loading}</span>}
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
                      const at = current?.timeline.findIndex((segment) => segment.kind === "day" && segment.day === k) ?? -1;
                      if (current && at >= 0) seekTo(current.starts[at]);
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
              showScrub(ratio);
              previewAt(ratio);
              beginScrub(ratio);
            }}
            onPointerMove={(event) => {
              const ratio = ratioOf(event);
              showScrub(ratio);
              if (!scrubbing.current) return;
              previewAt(ratio);
              moveScrub(ratio);
            }}
            onPointerUp={(event) => {
              if (!scrubbing.current) return;
              scrubbing.current = false;
              showScrub(null);
              endScrub(ratioOf(event));
            }}
            onPointerCancel={() => {
              scrubbing.current = false;
              showScrub(null);
              endScrub(null);
            }}
            onKeyDown={(event) => {
              // 进度条拿到焦点时，左右键像视频播放器一样前后跳 5 秒（全局的左右键是上一段、下一段）
              if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
              event.preventDefault();
              event.stopPropagation();
              skipBy(event.key === "ArrowRight" ? 5000 : -5000);
            }}
            onPointerLeave={() => {
              if (!scrubbing.current) showScrub(null);
            }}
          >
            <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2">{trackBars(false)}</div>
            <div ref={seekFillRef} className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2" style={{ clipPath: "inset(0 100% 0 0)" }}>
              {trackBars(true)}
            </div>
            {/* 外面一层和进度条一样宽，按百分比平移（translate 的百分比是按自己的宽度算的），里面才是圆点：每帧只改 transform */}
            <div ref={seekKnobRef} className="pointer-events-none absolute inset-0" style={{ transform: "translate3d(0%,0,0)" }}>
              <div className="absolute top-1/2 left-0 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper bg-ink shadow" />
            </div>
            <div
              ref={scrubTipRef}
              className="pointer-events-none absolute bottom-full mb-1 max-w-[80vw] -translate-x-1/2 truncate bg-ink px-2 py-1 text-[11px] whitespace-nowrap text-paper lining-nums"
              style={{ display: "none" }}
            />
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
            {tilesLoading && <span className="text-ink-soft">{text.loading}</span>}
            <span ref={clockRef} className="ml-auto h-4 w-full text-right text-ink-soft tabular-nums tracking-normal sm:w-auto" aria-hidden="true" />
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
