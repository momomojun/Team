# 任务：写英文版的界面文案 `src/i18n/en/dictionary.ts`

项目在 `D:\LLM\Team`，是一个美国国家公园行程规划网站，原来只有中文。我们在加英文版 `/en`，给英语母语的读者用，会拿去做课程展示。**界面英文要像美国一流旅行产品（NPS 官网、AllTrails、Lonely Planet 网站）原生写出来的**，不是翻译腔。

## 先读这些

1. **`D:\LLM\Team\docs\ENGLISH.md`**：英文写法规范，必须遵守。
2. **`D:\LLM\Team\src\i18n\dictionaries.ts`**：中文界面文案 `zhHans`，大约 1,550 行。英文版要覆盖它的全部键。
3. **`D:\LLM\Team\src\i18n\format.ts`**：`fill()` 怎么填占位符，英文模板能用的两种额外写法，以及单位格式化函数。
   - `{n|day|days}`：按 n 是不是 1 选单数或复数的词，只输出这个词，数字要另写 `{n}`。例如 `"{n} {n|day|days}"`。
   - `{m:month}` 输出英文月份全称，`{m:mon}` 输出缩写，`{d:weekday}` 把 0–6 写成星期几。

## 要做的

把 `D:\LLM\Team\src\i18n\en\dictionary.ts` 里的 `export const en: Dictionary | null = null;` 换成完整的英文字典：

```ts
export const en: Dictionary = { ... };
```

要求：
- **结构和 `zhHans` 完全一致**：每个键都要有，数组长度和对象形状都要一样，否则类型检查不过。
- `zhHans` 开头引用了 `creatorLanguages`，在英文文件里另外定义英文版。
- **占位符名字保持不变**（`{n}`、`{date}`、`{park}`……），可以调整它们在句子里的位置，也可以加 `{n|…|…}`、`{m:month}`。
- **不能引入新的占位符名**。代码只传它原来传的那些值；唯一例外是 `units.meters`，代码会另外传 `{ft}`。
- 写好后，在 `D:\LLM\Team` 下运行 `npx tsc --noEmit -p .`。结果里只允许出现 `PageProps`、`LayoutProps`、`RouteContext` 这三类旧错误，英文字典本身不能有错。

## 特别处理

- **`units`**：
  - `km` 写成 `"{mi} mi"`，`meters` 写成 `"{ft} ft gain"`。
  - `listSep` 写成 `", "`，`numberStyle` 写成 `"western"`。
  - `yi` 写成 `"{n} million"`；`wan` 英文版不用，随便写，比如 `"{n}0,000"`。
  - `months` 写成 `"{from:mon}–{to:mon}"`，`month` 写成 `"{m:month}"`，`allYear` 写成 `"Year-round"`。
  - 时长写成 `"{m} min"`、`"{h} hr"`、`"{h} hr {m} min"`。
  - `km2` 的值传进来的是平方公里数，写成 `"{n} km²"`，并在回报里列出来，代码之后会改成平方英里。
- **温度**：模板里同时有 °C 和 °F 两组占位符时，英文只用 °F 那组。
- **双语标题**：中文里像 `"Attractions · 景点"` 这种，英文只写 `"Attractions"`。英文 eyebrow 小标题要短，比如 `"Attractions"`、`"Plan"`、`"Live updates"`。
- **只适用于中文用户的说明**（中文机器翻译、简繁转换、给中国护照的签证提醒、"暂不收录小红书"这类）按 ENGLISH.md 的本地化一节改写或删掉。删掉时值写成空字符串 `""` 不行，要写一句适合英文读者的话，或者留一个合理的英文版本。
- **月份占位符**：中文模板里的 `{m} 月` 这类，英文用 `{m:month}`。
- **复数**：中文的 `{n} 天`、`{n} 个景点`，英文用 `{n} {n|day|days}` 这种写法处理单复数。
- **日期**：中文的 `"{y} 年 {m} 月 {d} 日"` 写成 `"{m:month} {d}, {y}"`。
- **风格**：按钮和标题用 sentence case，比如 `"Plan a trip"`，不要写成 `"Plan A Trip"`；句子要完整，结尾加句号。

文件很长，可以分几次写入：先用 Write 写开头和前几个大块，再用 Edit 往后补。

## 回报（简短，用中文）

- 哪些英文模板需要代码另外传值才写得自然。比如某个模板只拿到月份数字但需要日期，或者拿到的是公制数但英文要写英制。列出键名，并说明需要什么；
- 删掉或改写了哪些只适用于中文用户的说明。
