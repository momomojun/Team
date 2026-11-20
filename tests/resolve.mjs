// 模块解析钩子：@/xxx → src/xxx；没写扩展名的依次试 .ts、/index.ts（测试只引用 .ts，不引用带 JSX 的 .tsx）；
// server-only 直接换成空模块（它在服务端组件里本来就是空的），只在服务端用的文件（简繁转换、季节）也能跑。
// 不去 node_modules 里找这个包：Copilot 的镜像里没装 npm 包，11-20 查询工具加了季节打分以后在 staging 上全部报错
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC = new URL("../src/", import.meta.url);
const HAS_EXTENSION = /\.(?:[cm]?[jt]s|json)$/;

export async function resolve(specifier, context, next) {
  if (specifier === "server-only") return { url: "data:text/javascript,", shortCircuit: true };
  const target = specifier.startsWith("@/") ? new URL(specifier.slice(2), SRC).href : specifier;
  const local = target.startsWith(".") || target.startsWith("file:");
  if (local && !HAS_EXTENSION.test(target) && context.parentURL) {
    const base = new URL(target, context.parentURL).href;
    for (const suffix of [".ts", "/index.ts"]) {
      if (existsSync(fileURLToPath(base + suffix))) return next(base + suffix, context);
    }
  }
  return next(target, context);
}
