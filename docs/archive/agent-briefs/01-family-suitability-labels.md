# 任务：给一组公园的景点逐个标注“同行适合度”

项目在 `D:\LLM\Team`。这是一个面向中文用户的美国国家公园行程规划网站（Next.js/TypeScript）。我们正在加一个功能：生成攻略时，用户可以说明同行的人有小孩（几岁）、婴儿车、老人（体力一般）或轮椅。不适合的景点不排进行程，需要注意的景点照常排，但会标出提醒。所以每个景点都要有准确的标注。

## 你要做的

只改 `D:\LLM\Team\src\data\suitability\<公园代码>.ts` 里分配给你的那几个文件，别的文件一律不动。不要改景点文件、index.ts、测试，也不要动 git（不要 commit，不要 stash）。

每个文件现在是一份**自动生成的草稿**：文件开头有一行 `// DRAFT`，每个景点上面有一行写着名称、类型和徒步数据的注释，取值是按难度粗估的，很多是错的。你要逐个景点核对并改成准确的值，然后：
- 删掉 `// DRAFT` 那一行和每个景点上面的草稿注释；
- 在文件开头写一段说明，讲清这座公园按哪些来源整理、日期 2026-10-16，写法参考样板；
- 如果多个景点共用同一个来源，在文件里定义一个常量，比如 `const ACCESS = "https://..."`。

**样板：`D:\LLM\Team\src\data\suitability\zion.ts`。** 先读它，你的语气、详细程度和取值尺度都要和它一致。

字段的定义见 `D:\LLM\Team\src\data\attractions\types.ts` 里的 `Suitability` 和 `Hazard`，要先读。

## 每座公园怎么查

1. **读景点数据** `D:\LLM\Team\src\data\attractions\<公园代码>.ts`：看 summary、tips、hike（距离、爬升、难度）、kind、permit、closedNote。原来的提示里常有"老人小孩都能去"、"婴儿车不能带"、"轮椅能到"这类信息，要用上。
2. **游船、导览团、洞穴团、小飞机这类体验**：在 `D:\LLM\Team\src\data\tours.ts` 和 `D:\LLM\Team\src\data\activities.ts` 里搜这个景点的 id，或者公园代码，看有没有年龄限制，比如"12 岁以下不能上船"。必要时上运营方官网查年龄下限、体重限制和健康要求，查到的写进 `minAge`，并附上 `source`。
3. **官方无障碍页面**：先用 WebFetch 查 `https://www.nps.gov/<公园代码>/planyourvisit/accessibility.htm`。如果 404，就用 WebSearch 搜"<公园英文名> accessibility site:nps.gov"。加拿大的班夫、贾斯珀、幽鹤查 Parks Canada 的无障碍或设施页面；羚羊峡谷、纪念碑谷查纳瓦霍部落公园和授权导览团的官网；波浪谷查 BLM；马蹄湾查 NPS 格伦峡谷或佩吉市的页面。官方写了"wheelchair accessible"或"accessible with assistance"的，按官方说法填，并附 `source`。
4. **高风险景点要逐个专门查官方说明**：悬崖窄脊、铁链、梯子、地热、窄缝山洪、高海拔、小飞机。

不用浏览器面板，只用 WebFetch 和 WebSearch。查不到的就按景点数据和常识判断，不要编造来源；没有查到具体页面就不写 `source`。

## 取值尺度

- **kidsFromAge（建议几岁以上）**：
  - 能抱着、背着婴儿去的都填 0：观景点、开车看、游客中心、平坦的短步道、没有年龄限制的游船。
  - 简单短步道 0–3；简单但较长的 4；中等 5–7；困难 8–12；有严重暴露的（悬崖窄脊、铁链）12 以上。
  - 有官方年龄下限的，`kidsFromAge` 不能小于 `minAge`。
- **stroller（婴儿车）**：
  - `yes`：全程铺装或栈道。
  - `partial`：前一段或观景台能推到。
  - `no`：土路、台阶、沙地、要坐小飞机，或在船上没法推的。
  - 观景点：停车场旁铺装的填 `yes`，要走土路小坡的填 `partial`。
- **wheelchair（轮椅）**：
  - `yes`：只给官方写明无障碍的，或者路边停车、在车上就能看的。没有证据不要给步道 `yes`。
  - `assisted`：官方写"有人协助能走"的，或者铺装但有坡的。
  - `partial`：能到观景台或停车场看一眼，但到不了景点本身的。
  - `no`：其他情况。
- **seniors（老人、体力一般）**：
  - `ok`：轻松的。
  - `caution`：中等以上的徒步、高温、高海拔、大量台阶、很长的船程或小飞机。
  - `no`：只给极端的，比如天使降临、半穹顶这类窄脊铁链；需要过夜的；爬升超过约 3,000 英尺或往返超过约 10 英里、还有暴露的。
- **hazards**：只写真实、值得提醒的危险，定义见 types.ts。比如：
  - 黄石的间歇泉区：`thermal`
  - 窄缝峡谷：`flashFlood`
  - 夏天的死亡谷、大峡谷下到谷底：`heat`
  - 海拔超过 9,000 英尺的山口、步道：`altitude`
  - 冰川湾、卡特迈这类坐小飞机或长时间坐船的：`motion` 和 `remote`
  - 有熊、野牛近距离出没、需要特别提醒的：`wildlife`
  - 普通观景台不要硬加危险。
- **noteZh**：以下情况必须写：有 hazards、seniors 不是 `ok`、kidsFromAge 达到 6 或以上、有 minAge。轮椅是 `yes` 或 `assisted` 时，也写一句能到哪里。写法：
  - 简体中文，一两句话，说人话，具体实用；
  - 讲清为什么，再给带孩子或老人的替代玩法，比如"全家可以只走到……就回头"；
  - 和样板的语气一致，不要堆砌，不要写"注意安全"这种空话。
- **source**：用了官方页面就写，必须是 https 开头。

## 做完自查

在 `D:\LLM\Team` 目录下运行（把公园代码换成你负责的几个）：

```
node --disable-warning=ExperimentalWarning --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./tests/register.mjs C:/Users/ZJ/AppData/Local/Temp/claude/D--WebWorkplace/0739a7e7-b947-4c96-a85c-72bd9a047ec9/scratchpad/check.ts <公园代码1> <公园代码2> ...
```

输出 `OK` 才算完成。另外要确认文件是合法的 TypeScript：字符串里的英文双引号要转义，或者改用中文引号“”。

## 最后回报（简短）

- 每座公园各改了几个景点；
- 判断为 `no` 的（不适合小孩、老人或轮椅的）列出来，并说明理由；
- 拿不准、或官方说法和原景点数据矛盾的地方，列出来。
