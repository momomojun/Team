// 同行适合度：景点 id → 带多大的孩子、推婴儿车、坐轮椅、老人能不能去，有什么危险。每座公园一个文件，景点的写法见 ../attractions/types.ts 的 Suitability
import type { Suitability } from "../attractions/types";
import { suitability as acad } from "./acad";
import { suitability as ante } from "./ante";
import { suitability as arch } from "./arch";
import { suitability as badl } from "./badl";
import { suitability as banf } from "./banf";
import { suitability as bibe } from "./bibe";
import { suitability as bisc } from "./bisc";
import { suitability as blca } from "./blca";
import { suitability as brca } from "./brca";
import { suitability as cany } from "./cany";
import { suitability as care } from "./care";
import { suitability as cave } from "./cave";
import { suitability as chis } from "./chis";
import { suitability as chir } from "./chir";
import { suitability as cong } from "./cong";
import { suitability as crla } from "./crla";
import { suitability as cuva } from "./cuva";
import { suitability as dena } from "./dena";
import { suitability as deva } from "./deva";
import { suitability as drto } from "./drto";
import { suitability as ever } from "./ever";
import { suitability as gaar } from "./gaar";
import { suitability as glac } from "./glac";
import { suitability as glba } from "./glba";
import { suitability as grba } from "./grba";
import { suitability as grca } from "./grca";
import { suitability as grsa } from "./grsa";
import { suitability as grsm } from "./grsm";
import { suitability as grte } from "./grte";
import { suitability as gumo } from "./gumo";
import { suitability as hale } from "./hale";
import { suitability as havo } from "./havo";
import { suitability as hosp } from "./hosp";
import { suitability as hsbd } from "./hsbd";
import { suitability as indu } from "./indu";
import { suitability as isro } from "./isro";
import { suitability as jasp } from "./jasp";
import { suitability as jeff } from "./jeff";
import { suitability as jotr } from "./jotr";
import { suitability as katm } from "./katm";
import { suitability as kefj } from "./kefj";
import { suitability as kova } from "./kova";
import { suitability as lacl } from "./lacl";
import { suitability as lavo } from "./lavo";
import { suitability as maca } from "./maca";
import { suitability as meve } from "./meve";
import { suitability as mora } from "./mora";
import { suitability as mova } from "./mova";
import { suitability as neri } from "./neri";
import { suitability as noca } from "./noca";
import { suitability as npsa } from "./npsa";
import { suitability as olym } from "./olym";
import { suitability as pefo } from "./pefo";
import { suitability as pinn } from "./pinn";
import { suitability as redw } from "./redw";
import { suitability as romo } from "./romo";
import { suitability as sagu } from "./sagu";
import { suitability as seki } from "./seki";
import { suitability as shen } from "./shen";
import { suitability as thro } from "./thro";
import { suitability as viis } from "./viis";
import { suitability as voya } from "./voya";
import { suitability as wave } from "./wave";
import { suitability as whsa } from "./whsa";
import { suitability as wica } from "./wica";
import { suitability as wrst } from "./wrst";
import { suitability as yell } from "./yell";
import { suitability as yoho } from "./yoho";
import { suitability as yose } from "./yose";
import { suitability as zion } from "./zion";

export const suitability: Record<string, Suitability> = {
  ...acad,
  ...ante,
  ...arch,
  ...badl,
  ...banf,
  ...bibe,
  ...bisc,
  ...blca,
  ...brca,
  ...cany,
  ...care,
  ...cave,
  ...chir,
  ...chis,
  ...cong,
  ...crla,
  ...cuva,
  ...dena,
  ...deva,
  ...drto,
  ...ever,
  ...gaar,
  ...glac,
  ...glba,
  ...grba,
  ...grca,
  ...grsa,
  ...grsm,
  ...grte,
  ...gumo,
  ...hale,
  ...havo,
  ...hosp,
  ...hsbd,
  ...indu,
  ...isro,
  ...jasp,
  ...jeff,
  ...jotr,
  ...katm,
  ...kefj,
  ...kova,
  ...lacl,
  ...lavo,
  ...maca,
  ...meve,
  ...mora,
  ...mova,
  ...neri,
  ...noca,
  ...npsa,
  ...olym,
  ...pefo,
  ...pinn,
  ...redw,
  ...romo,
  ...sagu,
  ...seki,
  ...shen,
  ...thro,
  ...viis,
  ...voya,
  ...wave,
  ...whsa,
  ...wica,
  ...wrst,
  ...yell,
  ...yoho,
  ...yose,
  ...zion,
};
