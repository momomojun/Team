# 任务：按英文官方资料核对一组公园的景点事实，中英文一起改对

项目在 `D:\LLM\Team`，是一个美国国家公园行程规划网站。中文数据是最早整理的，英文版是后来按中文写的。中文整理时转述、换算的地方难免有误差或写错，现在要**以官方英文资料为准**把事实核对一遍：NPS 官网、Parks Canada、运营方官网、州政府等。

**原则：英文版应该最贴近官方原文。** 官方写 1.4 miles，就用 1.4 miles，不要用中文"约 2 公里"反算出来的数。中文也要改成和官方一致，比如写"约 2.3 公里（1.4 英里）"，或按中文的习惯写法改。

今天是 2026-10-16。

## 每座公园要看的文件

- `src\data\attractions\<代码>.ts`：景点中文数据。
  - 文字：summary、tips、closedNote、permit、start.nameZh。
  - 数字：hike.distanceMi（英里）、hike.gainFt（英尺）、durationMin、openMonths、hours。
- `src\data\suitability\<代码>.ts`：同行适合度。noteZh 里的距离、台阶数、坡度。
- `src\i18n\en\content\attractions-<代码>.ts`：上面这些中文对应的英文，JSON，键是中文原文。

## 怎么核对

1. **每个景点**都对照官方页面核对这些可以核实的事实：
   - 步道长度（往返还是单程）、爬升、海拔、瀑布或岩石高度；
   - 开放月份和时间、季节性关闭；
   - 价格、预约和许可规定、年龄限制；
   - 官方英文名称和拼写；
   - **2026 年当前的关闭和施工**：查公园的 Alerts 和 Current Conditions 页面。
2. **官方来源优先级**：
   1. NPS 该景点或步道的专页、Things To Do 页、Trail 页；
   2. 公园的 Plan Your Visit 页、Accessibility 页、Alerts 页；
   3. 运营方或州政府官网；
   4. 以上都没写的，不改，保持原样。
   - 不要拿第三方网站（AllTrails、博客）当依据去改官方没写的数字。
3. **官方说法和数据不一致时，改成官方的。**
   - 改中文文字：用下面的 `rekey.py`。它会同时改英文表里对应的键，还可以顺便改英文值。
   - 只改英文值、中文不用动（中文本来就对，只是英文换算不准）：直接编辑 `attractions-<代码>.ts` 里那条的值，键一个字都不能动。
   - 改数字字段（distanceMi、gainFt、openMonths 等）：直接编辑数据文件，再检查文字里有没有提到同一个数字，有的话一起改。
4. **同一个事实在几处写法不一致的**（summary 和适合度说明长度不同等）：查官方，几处都统一成官方的说法。
5. **官方查不到、自己也拿不准的**：不改，写进回报。

## 改中文用的工具

```
python C:/Users/ZJ/AppData/Local/Temp/claude/D--LLM-Team/58331798-7ee3-46d6-8a92-c9da01639a6d/scratchpad/rekey.py <数据文件> "<中文旧文字>" "<中文新文字>" --content attractions-<代码> [--en "<英文旧文字>" "<英文新文字>"]
```

- 在 `D:\LLM\Team` 目录下运行。
- 中文旧文字要选能唯一定位的一段，不要太短，避免改到别处。
- 输出 `OK` 才算改成功；报错就什么都没改，要换一段文字重试。
- 绝对不要用 Edit 直接改中文文字：中文一改，英文表里的键就对不上，英文会失效。
- 同行适合度文件 `src\data\suitability\<代码>.ts` 的中文也用这个工具改，`--content` 同样是 `attractions-<代码>`。

## 范围限制

- **只改分配给你的公园**的这三类文件：`attractions\<代码>.ts`、`suitability\<代码>.ts`、`en\content\attractions-<代码>.ts`。
- 问题在别的文件里的，只写进回报，不要改。比如 `parks.ts` 公园介绍、`activities.ts` 特别活动、`lodging.ts`、`bookings.ts`、`closures.ts` 临时关闭、`creators.ts`。
  - 新发现的临时关闭也写进回报，我来加进 `closures.ts`。
- 不要动 git，不要运行 `npm run i18n:en`，不用浏览器面板。用 WebFetch 和 WebSearch 查官网。
- 不要改文风，只改事实。

## 做完自查

在 `D:\LLM\Team` 下运行：

```
node C:/Users/ZJ/AppData/Local/Temp/claude/D--LLM-Team/58331798-7ee3-46d6-8a92-c9da01639a6d/scratchpad/check-en.mjs attractions-<代码1> attractions-<代码2> ...
```

必须输出 `OK`。再运行 `npx tsc --noEmit -p .`，结果里除了 PageProps、LayoutProps、RouteContext 这几类，不能有别的错误。

## 改动记录（必须写）

每座公园写一个记录文件：`C:\Users\ZJ\AppData\Local\Temp\claude\D--LLM-Team\58331798-7ee3-46d6-8a92-c9da01639a6d\scratchpad\audit\<代码>.md`。

每处改动一行，格式：

```
- 景点 id：改了什么（原来 → 现在）。来源：URL
```

最后另起一节"没改、拿不准的"，列出来。

## 回报（简短，用中文）

- 每座公园改了几处；
- 最重要的几处改动，比如原来写错了安全相关的事实、数字差得多的；
- 新发现的临时关闭；
- 不在你范围内、需要我处理的问题。
