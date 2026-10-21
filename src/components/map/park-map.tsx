"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import type { ExpressionSpecification, GeoJSONSource, Map as MapLibreMap, Marker } from "maplibre-gl";
import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from "react";
import {
  bearingOf,
  bounds,
  cumulative,
  distanceAtCost,
  drawMs,
  easeInOut,
  fade,
  flyMs,
  followMs,
  followZoom,
  overallProgress,
  paceCost,
  sliceTo,
  slowness,
  stopDistances,
  turnToward,
  type TourDay,
  type TourNarration,
  type TourStop,
} from "./route-tour";
import { CommonsImage } from "@/components/commons-image";
import { Narrator } from "@/lib/speech";
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
  /** 讲解版（全屏、逐站讲解、朗读） */
  tourNarrate: string;
  tourMute: string;
  tourUnmute: string;
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
// 跟车时设过的焦点偏移，停下来要清掉（MapLibre 会一直记着，之后缩放、拉近都会偏）
const NO_PADDING = { top: 0, bottom: 0, left: 0, right: 0 };
// 系统设了“减少动画”就不跟车、不倾斜，整天一个固定的视角，线照样画
const TOUR_PITCH = 38;
// 播放时其他天的景点淡下去，突出这一天
const DIM = 0.18;
// 路线还没查到真实道路时最多等这么久，再不来就按直线播
const ROUTE_WAIT_MS = 6000;

interface TourState {
  days: TourDay[];
  index: number;
  phase: "intro" | "fly" | "draw" | "hold" | "finale";
  phaseStart: number;
  /** 上一帧的时间：到站停一下时把这段时间从画线的进度里扣掉 */
  last: number;
  arriveUntil: number;
  calm: boolean;
  /** 讲解版：到站停下来念完才走；念的时候 speaking 是 true */
  narrated: boolean;
  speaking: boolean;
  /** 这一站的卡片还开着（开出这一站就收起来） */
  carded: boolean;
  /** 跟车：每个路线点的累计播放量、这一天播多久、镜头现在的位置、缩放和方向 */
  cost: number[];
  dayMs: number;
  camera: { center: [number, number]; zoom: number; bearing: number } | null;
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
    { kind: "intro" } | { kind: "day"; day: TourDay } | { kind: "stop"; stop: TourStop; index: number; color: string } | { kind: "outro" } | null
  >(null);
  const [caption, setCaption] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
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

        instance.addSource("legs", { type: "geojson", data: EMPTY });
        instance.addLayer({
          id: "legs",
          type: "line",
          source: "legs",
          filter: ["==", ["get", "straight"], false],
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": ["get", "color"], "line-width": 4, "line-opacity": 0.8 },
        });
        instance.addLayer({
          id: "legs-straight",
          type: "line",
          source: "legs",
          filter: ["==", ["get", "straight"], true],
          paint: { "line-color": ["get", "color"], "line-width": 2, "line-dasharray": [2, 2] },
        });
        instance.addSource("trails", { type: "geojson", data: EMPTY });
        instance.addLayer({
          id: "trails",
          type: "line",
          source: "trails",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": TRAIL_COLOR, "line-width": 2.5, "line-dasharray": [2, 1.2] },
        });
        instance.addLayer({
          id: "trails-highlight",
          type: "line",
          source: "trails",
          filter: ["==", ["get", "id"], ""],
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": TRAIL_HIGHLIGHT, "line-width": 4.5 },
        });
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
          paint: { "text-color": "#1c1b18", "text-halo-color": "#f4efe7", "text-halo-width": 1.6 },
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
          "points-selected",
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
          "points-selected",
        );
        instance.addLayer(
          {
            id: "tour-line",
            type: "line",
            source: "tour-line",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": ["get", "color"], "line-width": 5, "line-opacity": 0.95 },
          },
          "points-selected",
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
          paint: { "text-color": "#1c1b18", "text-halo-color": "#f4efe7", "text-halo-width": 1.6 },
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
    focusOn(null);
    setTourUi(null);
    narratorRef.current?.stop();
    setBeat(null);
    setCaption(null);
    if (state.narrated) {
      setImmersive(false);
      sidePanel.current = 0;
      bottomPanel.current = 0;
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
        { padding: { top: 64, bottom: 64, left: 64 + sidePanel.current, right: 64 }, maxZoom: 12, duration: 1100, pitch: 0, bearing: 0 },
      );
    }
    setTourUi((ui) => (ui ? { ...ui, card: false, finale: true, dusk: false } : ui));
    if (state.narrated) setBeat({ kind: "outro" });
    speak(state, narration?.outro.speech);
  };

  /** 讲解版念一段话：念完（或被打断）时 speaking 放下，then 里的事接着做 */
  const speak = (state: TourState, lines: string[] | undefined, then?: () => void) => {
    if (!state.narrated || !lines?.length) {
      then?.();
      return;
    }
    narratorRef.current ??= new Narrator(narration?.lang ?? "zh-CN", setCaption, muted);
    state.speaking = true;
    narratorRef.current.play(lines).then(() => {
      if (tourRef.current !== state) return;
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

  /** 一天开完：镜头拉回来看这一天的全程 */
  const reviewDay = (state: TourState) => {
    const map = mapRef.current;
    if (!map || state.calm) return;
    map.setPadding(NO_PADDING);
    const height = map.getContainer().clientHeight;
    map.fitBounds(bounds(state.days[state.index]), {
      padding: { top: Math.round(height * 0.12), bottom: Math.round(height * Math.max(0.2, bottomPanel.current)), left: 56 + sidePanel.current, right: 56 },
      maxZoom: 12.5,
      duration: 1200,
      pitch: TOUR_PITCH,
      bearing: 0,
    });
  };

  const beginDay = (state: TourState, index: number, now: number) => {
    const map = mapRef.current;
    if (!map) return;
    const day = state.days[index];
    clearMarkers(state);
    state.index = index;
    state.phase = "fly";
    state.phaseStart = now;
    state.cum = cumulative(day.path);
    state.total = state.cum[state.cum.length - 1] ?? 0;
    state.stopKm = stopDistances(day.path, state.cum, day.stops);
    state.shown = 0;
    state.arriveUntil = 0;
    setLine("tour-line", []);
    setLine("tour-head", []);
    focusOn(day.stops.map((stop) => stop.id));
    // 线从尾巴的淡到车头的浓
    map.setPaintProperty("tour-line", "line-gradient", ["interpolate", ["linear"], ["line-progress"], 0, fade(day.color, 0.35), 1, day.color]);
    state.cost = paceCost(state.cum, state.stopKm);
    state.dayMs = state.calm ? drawMs(state.days.length) : followMs(state.cost[state.cost.length - 1] ?? 0, state.days.length);
    state.camera = null;
    if (state.calm) {
      // 左下有章节字幕：底部多留一点，路线不被盖住
      const height = map.getContainer().clientHeight;
      map.fitBounds(bounds(day), {
        padding: { top: Math.round(height * 0.14), bottom: Math.round(height * 0.34), left: 56, right: 56 },
        maxZoom: 12.5,
        duration: flyMs(state.days.length),
        pitch: 0,
        bearing: 0,
      });
    } else {
      // 跟车：飞到起点，从车后上方朝车要开的方向看
      const zoom = followZoom(slowness(0, state.stopKm, state.total));
      const from = sliceTo(day.path, state.cum, 0).head;
      const to = sliceTo(day.path, state.cum, Math.max(0.8, lookAhead(zoom) * 3)).head;
      map.flyTo({ center: from, zoom, pitch: FOLLOW_PITCH, bearing: bearingOf(from, to), padding: followPadding(map), duration: FOLLOW_FLY_MS });
    }
    state.carded = false;
    if (state.narrated) setBeat({ kind: "day", day });
    speak(state, day.narration);
    setTourUi({
      index,
      days: state.days.map(({ day: n, color }) => ({ day: n, color })),
      title: day.title,
      heading: day.heading,
      date: day.date,
      subtitle: day.subtitle,
      color: day.color,
      card: true,
      finale: false,
      paused: false,
      dusk: false,
    });
  };

  const frame = (now: number) => {
    const state = tourRef.current;
    const map = mapRef.current;
    if (!state || !map) return;
    state.raf = requestAnimationFrame(frame);
    const delta = now - state.last;
    state.last = now;
    if (state.pausedAt !== null) return;
    const day = state.days[state.index];
    if (state.phase === "draw" && now < state.arriveUntil) {
      // 到站停一下（讲解版念完才走）：这段时间不算进画线的进度
      state.phaseStart += delta;
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
      if (elapsed >= fly && !state.speaking) {
        if (state.narrated) setBeat(null);
        state.phase = "draw";
        state.phaseStart = now;
      }
      if (progressRef.current) progressRef.current.style.width = `${overallProgress(state.index, state.days.length, 0) * 100}%`;
      return;
    }
    if (state.phase === "draw") {
      const progress = Math.min(1, elapsed / state.dayMs);
      // 不跟车：整天慢慢起步、慢慢停下；跟车：按播放量匀速走，进站前自然减速、长途时加速
      const eased = state.calm ? easeInOut(progress) : progress;
      const distance = state.calm
        ? eased * state.total
        : distanceAtCost(state.cum, state.cost, progress * (state.cost[state.cost.length - 1] ?? 0));
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
        state.camera = { center, zoom, bearing };
        map.jumpTo({ center, zoom, bearing, pitch: FOLLOW_PITCH, padding: followPadding(map) });
      }
      setLine("tour-line", line.length > 1 ? [lineFeature(line, day.color)] : []);
      setLine("tour-head", [{ type: "Feature", geometry: { type: "Point", coordinates: head }, properties: { color: day.color } }]);
      if (progressRef.current) progressRef.current.style.width = `${overallProgress(state.index, state.days.length, eased) * 100}%`;
      while (state.shown < day.stops.length && state.stopKm[state.shown] <= distance + 1e-6) {
        const stop = day.stops[state.shown];
        if (markerClass.current) {
          const badge = stop.lodging ? "住" : String(state.shown + 1);
          const marker = new markerClass.current({
            element: captionElement(stop.label, stop.caption, stop.lodging ?? false, day.color, badge),
            anchor: "bottom",
            offset: [0, -14],
          })
            .setLngLat([stop.lon, stop.lat])
            .addTo(map);
          state.markers.push(marker);
          // 一天最多同时留三个牌子，免得挤成一团；旧的先淡下去
          if (state.markers.length > 3) state.markers.shift()?.remove();
          state.markers.slice(0, -1).forEach((old) => (old.getElement().style.opacity = "0.55"));
        }
        state.shown += 1;
        // 起点那一站（前一晚的住处）不停
        if (state.stopKm[state.shown - 1] > 0.05) state.arriveUntil = now + ARRIVE_MS;
        // 讲解版：停下来，旁边出这一站的卡片，念完再停 0.6 秒才走
        if (state.narrated && stop.narration) {
          state.arriveUntil = Infinity;
          state.carded = true;
          setBeat({ kind: "stop", stop, index: state.shown, color: day.color });
          speak(state, stop.narration.speech, () => {
            state.arriveUntil = performance.now() + 600;
          });
        }
      }
      if (day.dusk && progress > 0.75) setTourUi((ui) => (ui && !ui.dusk ? { ...ui, dusk: true } : ui));
      if (progress >= 1) {
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
    if (progressRef.current) progressRef.current.style.width = "100%";
    if (elapsed >= FINALE_MS && !state.speaking) finishTour();
  };

  const startTour = (days: TourDay[], from = 0, narrated = false) => {
    const map = mapRef.current;
    if (!map || days.length === 0) return;
    if (tourRef.current) {
      cancelAnimationFrame(tourRef.current.raf);
      clearMarkers(tourRef.current);
    }
    narratorRef.current?.stop();
    // 讲解版在电脑上（宽 640 以上）左边有一张 24rem 宽的卡片，镜头给它让出位置
    sidePanel.current = narrated && window.innerWidth >= 640 ? 400 : 0;
    // 手机上卡片在下面，大约占半屏：镜头焦点放到上面那一半
    bottomPanel.current = narrated && window.innerWidth < 640 ? 0.5 : 0;
    if (narrated && !immersive) {
      // 铺满全屏：浏览器支持的用真的全屏（要在点击里调用），iPhone 这种不支持的就盖满整个窗口
      setImmersive(true);
      rootRef.current?.requestFullscreen?.().catch(() => {});
      narration?.onStart?.();
    }
    // 平常的彩色路线先藏起来，跟着车一段段画出来；讲解版开头讲“彩色的线是每天的路线”时先留着，进到第一天再藏
    const keepLegs = narrated && from === 0 && Boolean(narration?.intro.speech.length);
    map.setLayoutProperty("legs", "visibility", keepLegs ? "visible" : "none");
    map.setLayoutProperty("legs-straight", "visibility", keepLegs ? "visible" : "none");
    const state: TourState = {
      days,
      index: from,
      phase: "fly",
      phaseStart: 0,
      last: performance.now(),
      arriveUntil: 0,
      calm: reducedMotion(),
      narrated,
      speaking: false,
      carded: false,
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
    };
    tourRef.current = state;
    setLine("tour-done", state.done);
    if (narrated && from === 0 && narration?.intro.speech.length) {
      // 开头：先看整趟的全貌，讲怎么看这张地图
      state.phase = "intro";
      state.phaseStart = performance.now();
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
        map.fitBounds(
          [
            [Math.min(...all.map((p) => p[0])), Math.min(...all.map((p) => p[1]))],
            [Math.max(...all.map((p) => p[0])), Math.max(...all.map((p) => p[1]))],
          ],
          {
            padding: { top: 64, bottom: Math.max(96, Math.round(map.getContainer().clientHeight * bottomPanel.current)), left: 64 + sidePanel.current, right: 64 },
            maxZoom: 12,
            duration: 900,
            pitch: 0,
            bearing: 0,
          },
        );
      }, 120);
      speak(state, narration.intro.speech);
    } else beginDay(state, from, performance.now());
    state.raf = requestAnimationFrame(frame);
  };

  const togglePause = () => {
    const state = tourRef.current;
    if (!state) return;
    if (state.pausedAt === null) {
      state.pausedAt = performance.now();
      narratorRef.current?.pause();
    } else {
      state.phaseStart += performance.now() - state.pausedAt;
      state.pausedAt = null;
      narratorRef.current?.resume();
    }
    setTourUi((ui) => (ui ? { ...ui, paused: state.pausedAt !== null } : ui));
  };

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
  }, [ready, satellite, imagery]);

  useEffect(() => {
    const map = mapRef.current;
    // 只在开关真正变化时动，免得打断刚开始的缩放动画
    terrainRef.current = terrain;
    if (!ready || !map || terrain === (map.getTerrain() !== null)) return;
    map.setTerrain(terrain ? { source: "terrain-dem", exaggeration: 1.3 } : null);
    map.easeTo({ pitch: terrain ? 60 : 0, duration: 800 });
  }, [ready, terrain]);

  // 讲解卡片上的照片：车出发时图集可能还没取回来，按最新的 tour 找这一站
  const beatPhoto =
    beat?.kind === "stop" ? (tourDays.flatMap((day) => day.stops).find((stop) => stop.id === beat.stop.id)?.photo ?? beat.stop.photo) : undefined;
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
      <div ref={containerRef} className={`h-full w-full transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`} />
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
          className="tour-pop absolute inset-x-3 bottom-24 z-20 max-h-[50%] overflow-y-auto bg-paper shadow-lg sm:inset-x-auto sm:top-4 sm:bottom-auto sm:left-4 sm:max-h-[calc(100%-8rem)] sm:w-[24rem]"
        >
          {beat.kind === "stop" && beatPhoto && (
            <figure className="relative hidden aspect-[3/2] w-full bg-paper-deep sm:block">
              <CommonsImage src={beatPhoto.url} alt="" fill sizes="384px" className="object-cover" />
              <figcaption className="absolute right-0 bottom-0 bg-ink/60 px-2 py-0.5 text-[10px] text-paper/90">{beatPhoto.credit}</figcaption>
            </figure>
          )}
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
                <p className="font-serif text-2xl leading-tight lining-nums">{beat.stop.narration.title}</p>
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
        </aside>
      )}
      {/* 字幕：念到哪句出哪句；手机上卡片在下面，字幕放到上面 */}
      {immersive && caption && (
        <div className="pointer-events-none absolute inset-x-0 top-3 z-30 flex justify-center pr-14 pl-4 sm:top-auto sm:bottom-[5.25rem] sm:pr-4 sm:pl-[26rem]">
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
      {tourUi && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[3px] bg-ink/10">
          <div ref={progressRef} className="h-full transition-[background-color] duration-500" style={{ width: "0%", backgroundColor: tourUi.color }} />
        </div>
      )}
      {ready && tourDays.length > 0 && (
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
              {immersive && (
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
              )}
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
      {children}
    </div>
  );
}
