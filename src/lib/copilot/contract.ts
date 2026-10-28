import { airports } from "../../data/airports";
import { parkZones } from "../../data/park-zones";
import { MAX_TRIP_PARKS } from "../trip-parks";

/**
 * Copilot 和行程引擎之间的契约（v1）。TripRequest 是 Copilot 理解完用户需求后交给 plan_trip 工具的输入，
 * 和网站“自动生成攻略”的表单（WizardInput）一一对应；TripResult 是工具的输出。
 *
 * JSON Schema 写在这里是唯一的来源：`npm run copilot:contracts` 把它写成 copilot/contracts/*.json，
 * 给 Python 那边（jsonschema / pydantic）用；tests/copilot-plan.test.ts 检查两边一致、样例都能通过校验。
 * 改字段要升版本号（trip-request/v2），旧版本的评测记录才对得上。
 */
export const TRIP_REQUEST_CONTRACT = "trip-request/v1";
export const TRIP_RESULT_CONTRACT = "trip-result/v1";

export type Pace = "leisurely" | "relaxed" | "normal" | "packed";
export type LodgingPref = "any" | "hotel" | "rental" | "camp";

/** 出发地 / 回程地：常用机场（三字码），或者任意地点（名字和坐标） */
export type Place = { airport: string } | { name: string; lat: number; lon: number };

/** 每个字段是从哪来的：用户原话、用户确认过的、默认值、模型推断（推断的要在说明里讲清楚） */
export interface FieldSource {
  source: "user" | "user_confirmation" | "default" | "inferred";
  /** 用户原话里的片段 */
  evidence?: string;
}

export interface TripRequest {
  contract: typeof TRIP_REQUEST_CONTRACT;
  /** 按用户说的顺序；一段一段连得起来（常一起玩的，或者开车一天能到，见 trip-parks.ts） */
  parks: string[];
  /** 具体出发日期；和 month 至少给一个 */
  startDate?: string;
  /** 只知道月份时 */
  month?: number;
  days: number;
  origin: Place;
  /** 不给就是回到出发地 */
  destination?: Place;
  pace?: Pace;
  lodgingPref?: LodgingPref;
  party?: { youngestKid?: number; stroller?: boolean; seniors?: boolean; wheelchair?: boolean };
  /** 用户点名一定要去的景点（景点 id）：去得了就一定排；去不了的照样列在没排进去的里，写原因 */
  include?: string[];
  /** 用户说不去的景点 */
  exclude?: string[];
  /** 用户指定的某几晚住处：第 night 晚（第 night 天晚上）住推荐住宿里的哪一家 */
  lodging?: { night: number; id: string }[];
  provenance?: Partial<Record<RequestField, FieldSource>>;
}

export const REQUEST_FIELDS = [
  "parks",
  "startDate",
  "month",
  "days",
  "origin",
  "destination",
  "pace",
  "lodgingPref",
  "party",
  "include",
  "exclude",
  "lodging",
] as const;
export type RequestField = (typeof REQUEST_FIELDS)[number];

export const PACES: Pace[] = ["leisurely", "relaxed", "normal", "packed"];
export const LODGING_PREFS: LodgingPref[] = ["any", "hotel", "rental", "camp"];
export const MAX_TRIP_DAYS = 14;
export { MAX_TRIP_PARKS };

/**
 * 行程里每一站的提醒（planner.ts 的 StopWarning），Critic 按这些代码判断要不要改。
 * familySerious 不是 planner 给的，是同行适合度：能去、但要请用户务必慎重考虑（婴儿要背着爬梯子、带老人走特别累的路线）
 */
export const STOP_WARNINGS = [
  "farTransfer",
  "noService",
  "missDeparture",
  "missSunset",
  "offTime",
  "afterHours",
  "dark",
  "parkingFull",
  "lastShuttle",
  "tempClosed",
  "maybeClosed",
  "familySerious",
  "alertMaybeClosed",
] as const;

/** 没排进去的原因（generate-trip.ts 的 GuideSkipped） */
export const SKIP_REASONS = ["permit", "closed", "tooHard", "noTime", "tooFar", "across", "unsuitable"] as const;

const DATE_PATTERN = "^\\d{4}-\\d{2}-\\d{2}$";
/** NPS 公告（Copilot 提取的关闭清单里的一条）：标题、链接、公告写的重开日期 */
const ALERT_SCHEMA = {
  type: "object",
  required: ["title"],
  properties: { title: { type: "string" }, url: { type: "string" }, reopen: { type: "string", pattern: DATE_PATTERN } },
} as const;
const CLOCK_PATTERN = "^\\d{2}:\\d{2}$";
const parkCodes = Object.keys(parkZones).sort();
const airportCodes = Object.keys(airports).sort();

export const tripRequestSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://github.com/momomojun/Team/blob/main/copilot/contracts/trip-request.v1.schema.json",
  title: "TripRequest",
  description: "Copilot → plan_trip 工具的输入，和网站自动生成攻略的表单一一对应",
  type: "object",
  additionalProperties: false,
  required: ["contract", "parks", "days", "origin"],
  anyOf: [{ required: ["startDate"] }, { required: ["month"] }],
  properties: {
    contract: { const: TRIP_REQUEST_CONTRACT },
    parks: { type: "array", minItems: 1, maxItems: MAX_TRIP_PARKS, uniqueItems: true, items: { enum: parkCodes } },
    startDate: { type: "string", pattern: DATE_PATTERN },
    month: { type: "integer", minimum: 1, maximum: 12 },
    days: { type: "integer", minimum: 1, maximum: MAX_TRIP_DAYS },
    origin: { $ref: "#/$defs/place" },
    destination: { $ref: "#/$defs/place" },
    pace: { enum: PACES },
    lodgingPref: { enum: LODGING_PREFS },
    party: {
      type: "object",
      additionalProperties: false,
      properties: {
        youngestKid: { type: "integer", minimum: 0, maximum: 17 },
        stroller: { type: "boolean" },
        seniors: { type: "boolean" },
        wheelchair: { type: "boolean" },
      },
    },
    include: { type: "array", maxItems: 20, uniqueItems: true, items: { type: "string", pattern: "^[a-z]{4}-[a-z0-9-]+$" } },
    exclude: { type: "array", maxItems: 40, uniqueItems: true, items: { type: "string", pattern: "^[a-z]{4}-[a-z0-9-]+$" } },
    lodging: {
      type: "array",
      maxItems: MAX_TRIP_DAYS - 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["night", "id"],
        properties: {
          night: { type: "integer", minimum: 1, maximum: MAX_TRIP_DAYS - 1 },
          id: { type: "string", pattern: "^[a-z]{4}-stay-[a-z0-9-]+$" },
        },
      },
    },
    provenance: {
      type: "object",
      propertyNames: { enum: [...REQUEST_FIELDS] },
      additionalProperties: { $ref: "#/$defs/fieldSource" },
    },
  },
  $defs: {
    place: {
      oneOf: [
        {
          type: "object",
          additionalProperties: false,
          required: ["airport"],
          properties: { airport: { enum: airportCodes } },
        },
        {
          type: "object",
          additionalProperties: false,
          required: ["name", "lat", "lon"],
          properties: {
            name: { type: "string", minLength: 1, maxLength: 120 },
            lat: { type: "number", minimum: -90, maximum: 90 },
            lon: { type: "number", minimum: -180, maximum: 180 },
          },
        },
      ],
    },
    fieldSource: {
      type: "object",
      additionalProperties: false,
      required: ["source"],
      properties: {
        source: { enum: ["user", "user_confirmation", "default", "inferred"] },
        evidence: { type: "string", maxLength: 200 },
      },
    },
  },
} as const;

const named = { type: "object", required: ["id", "nameZh", "nameEn"] } as const;

export const tripResultSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://github.com/momomojun/Team/blob/main/copilot/contracts/trip-result.v1.schema.json",
  title: "TripResult",
  description: "plan_trip 工具的输出：每天几点到哪、住哪、提醒，没排进去的景点和原因。时间都是“HH:MM”，按这一天的 timeZone",
  type: "object",
  required: ["contract", "engine", "request", "referenceDate", "days", "skipped", "assumptions"],
  properties: {
    contract: { const: TRIP_RESULT_CONTRACT },
    engine: {
      type: "object",
      required: ["name", "version"],
      properties: { name: { type: "string" }, version: { type: "string" } },
    },
    request: { $ref: "trip-request.v1.schema.json" },
    referenceDate: { type: "string", pattern: DATE_PATTERN },
    days: {
      type: "array",
      items: {
        type: "object",
        required: ["day", "date", "parks", "timeZone", "stops", "lodging", "driveMin", "activeMin", "warnings"],
        properties: {
          day: { type: "integer", minimum: 1 },
          date: { type: "string", pattern: DATE_PATTERN },
          dateIsExact: { type: "boolean" },
          parks: { type: "array", items: { enum: parkCodes } },
          timeZone: { type: ["string", "null"] },
          sunrise: { type: ["string", "null"], pattern: CLOCK_PATTERN },
          sunset: { type: ["string", "null"], pattern: CLOCK_PATTERN },
          departAt: { type: ["string", "null"], pattern: CLOCK_PATTERN },
          returnAt: { type: ["string", "null"], pattern: CLOCK_PATTERN },
          /** 最后一站开回当晚住处（最后一天是回程机场、城市）要多久 */
          returnDriveMin: { type: "integer", minimum: 0 },
          driveMin: { type: "integer", minimum: 0 },
          activeMin: { type: "integer", minimum: 0 },
          warnings: { type: "array", items: { enum: ["overloaded", "lateReturn"] } },
          lodging: {
            oneOf: [
              { type: "null" },
              // airbnbUrl：民宿区（rental）按这一晚的日期搜 Airbnb 的链接
              { ...named, properties: { kind: { enum: ["option", "endpoint"] }, rental: { type: "boolean" }, airbnbUrl: { type: "string" } } },
            ],
          },
          stops: {
            type: "array",
            items: {
              type: "object",
              required: ["id", "park", "nameZh", "nameEn", "kind", "start", "end", "driveMin", "waitMin", "slot", "warnings"],
              properties: {
                id: { type: "string" },
                park: { enum: parkCodes },
                kind: { type: "string" },
                start: { type: "string", pattern: CLOCK_PATTERN },
                end: { type: "string", pattern: CLOCK_PATTERN },
                localStart: { type: "string", pattern: CLOCK_PATTERN },
                timeZone: { type: "string" },
                driveMin: { type: "integer", minimum: 0 },
                waitMin: { type: "integer", minimum: 0 },
                slot: { enum: ["sunrise", "any", "sunset", "night"] },
                shuttle: { type: "string" },
                warnings: { type: "array", items: { enum: [...STOP_WARNINGS] } },
                // alertMaybeClosed：NPS 公告可能让它关了（只有模型读出来的，照排、提醒出发前确认）
                alert: ALERT_SCHEMA,
              },
            },
          },
        },
      },
    },
    skipped: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "park", "nameZh", "nameEn", "reason"],
        // closed 的：openMonths 是一年里开放（出现）的月份，noteZh 是为什么不开的一句话（“火瀑只在 2 月中下旬……出现”）；
        // alert 是 NPS 公告说关了的（Copilot 提取的关闭清单），附公告标题、链接和公告写的重开日期
        properties: {
          reason: { enum: [...SKIP_REASONS] },
          openMonths: { type: "array", items: { type: "integer", minimum: 1, maximum: 12 } },
          noteZh: { type: "string" },
          alert: ALERT_SCHEMA,
        },
      },
    },
    assumptions: { type: "array", items: { type: "string" } },
    // 网站的 Trip（src/lib/trip-store.ts），给行程页的对话框直接用；契约不管它的内部结构
    trip: { type: "object" },
  },
} as const;

export interface ValidationIssue {
  /** JSON Pointer，比如 "/parks/0" */
  path: string;
  message: string;
}

type Schema = Record<string, unknown>;

/**
 * 按 JSON Schema 校验（只实现契约用到的那部分关键字：type、const、enum、required、properties、
 * additionalProperties、propertyNames、items、min/maxItems、uniqueItems、minimum/maximum、min/maxLength、
 * pattern、oneOf、anyOf、本文件里的 $ref）。Python 那边用完整的 jsonschema 库，结果应该一样
 */
export function validateSchema(value: unknown, schema: Schema, root: Schema = schema, path = ""): ValidationIssue[] {
  if (typeof schema.$ref === "string") {
    if (!schema.$ref.startsWith("#/$defs/")) return [];
    const defs = root.$defs as Record<string, Schema>;
    return validateSchema(value, defs[schema.$ref.slice("#/$defs/".length)], root, path);
  }
  const issues: ValidationIssue[] = [];
  const fail = (message: string, at = path) => issues.push({ path: at || "/", message });
  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const ok = types.some((type) =>
      type === "null"
        ? value === null
        : type === "array"
          ? Array.isArray(value)
          : type === "object"
            ? typeof value === "object" && value !== null && !Array.isArray(value)
            : type === "integer"
              ? Number.isInteger(value)
              : typeof value === type,
    );
    if (!ok) {
      fail(`应该是 ${types.join(" / ")}`);
      return issues;
    }
  }
  if ("const" in schema && value !== schema.const) fail(`应该是 ${JSON.stringify(schema.const)}`);
  if (Array.isArray(schema.enum) && !schema.enum.includes(value)) fail(`不在可选值里：${JSON.stringify(value)}`);
  if (typeof value === "string") {
    if (typeof schema.minLength === "number" && value.length < schema.minLength) fail(`至少 ${schema.minLength} 个字符`);
    if (typeof schema.maxLength === "number" && value.length > schema.maxLength) fail(`最多 ${schema.maxLength} 个字符`);
    if (typeof schema.pattern === "string" && !new RegExp(schema.pattern).test(value)) fail(`格式不对（${schema.pattern}）`);
  }
  if (typeof value === "number") {
    if (typeof schema.minimum === "number" && value < schema.minimum) fail(`不能小于 ${schema.minimum}`);
    if (typeof schema.maximum === "number" && value > schema.maximum) fail(`不能大于 ${schema.maximum}`);
  }
  if (Array.isArray(value)) {
    if (typeof schema.minItems === "number" && value.length < schema.minItems) fail(`至少 ${schema.minItems} 项`);
    if (typeof schema.maxItems === "number" && value.length > schema.maxItems) fail(`最多 ${schema.maxItems} 项`);
    if (schema.uniqueItems && new Set(value.map((item) => JSON.stringify(item))).size !== value.length) fail("有重复项");
    if (schema.items) value.forEach((item, i) => issues.push(...validateSchema(item, schema.items as Schema, root, `${path}/${i}`)));
  }
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    // 值是 undefined 的键当作没写（JSON 里本来就不会有）
    const record = Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
    const properties = (schema.properties ?? {}) as Record<string, Schema>;
    for (const key of (schema.required ?? []) as string[]) {
      if (!(key in record)) fail(`缺少 ${key}`, `${path}/${key}`);
    }
    for (const [key, item] of Object.entries(record)) {
      if (schema.propertyNames) {
        issues.push(...validateSchema(key, schema.propertyNames as Schema, root, `${path}/${key}`));
      }
      if (key in properties) issues.push(...validateSchema(item, properties[key], root, `${path}/${key}`));
      else if (schema.additionalProperties === false) fail(`不认识的字段 ${key}`, `${path}/${key}`);
      else if (typeof schema.additionalProperties === "object") {
        issues.push(...validateSchema(item, schema.additionalProperties as Schema, root, `${path}/${key}`));
      }
    }
  }
  if (Array.isArray(schema.oneOf)) {
    const passing = (schema.oneOf as Schema[]).filter((option) => validateSchema(value, option, root, path).length === 0);
    if (passing.length !== 1) fail(passing.length === 0 ? "不符合任何一种写法" : "同时符合好几种写法");
  }
  if (Array.isArray(schema.anyOf)) {
    const passing = (schema.anyOf as Schema[]).some((option) => validateSchema(value, option, root, path).length === 0);
    if (!passing) fail("startDate 和 month 至少要给一个");
  }
  return issues;
}

/** 契约以外、要查数据或日历才知道的检查：日期是不是真的存在，startDate 和 month 对不对得上 */
export function validateTripRequest(input: unknown): ValidationIssue[] {
  const issues = validateSchema(input, tripRequestSchema as unknown as Schema);
  if (issues.length > 0) return issues;
  const request = input as TripRequest;
  if (request.startDate) {
    const parsed = new Date(`${request.startDate}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== request.startDate) {
      issues.push({ path: "/startDate", message: `没有这一天：${request.startDate}` });
    } else if (request.month !== undefined && Number(request.startDate.slice(5, 7)) !== request.month) {
      issues.push({ path: "/month", message: `和 startDate 的月份对不上` });
    }
  }
  return issues;
}
