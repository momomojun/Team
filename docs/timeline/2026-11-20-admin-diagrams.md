# 11-20：后台的架构图扩成四张（分支 `feature/admin-diagrams`）

- 为什么做：仓库主人要把新的架构图都放进后台，不只是模型调用，还有整个网站、search agent 这些。原来后台只有一张“模型调用架构”，而且有几处过时了（写的是“BM25 检索”“8 组评测”，也没有 search agent）。
- 做了什么：新组件 `src/components/admin/system-diagrams.tsx`，上面四个标签切换，中英文两套字：
  - 整体架构：用户（浏览器、手机装到主屏）→ Vercel 上的 Next.js（页面、在浏览器里跑的行程引擎、数据接口、Copilot 中转和后台、访问密码和账号）→ Modal 上的 Copilot（服务、模型、同一份引擎、Volume；staging 和正式两个环境），底下是 Neon（账号、行程和对话、资料向量）、仓库里预先生成的数据、实时外部接口、GitHub Actions 定时任务；
  - 一句话怎么走：原来那张，改了过时的几处（回答问题写“自己查或找一次就答”、查资料写按意思找、评测写 10 组）；
  - search agent 的一圈：问题和上下文 → 模型这一步 → 代码核对 → 网站查询工具 / 网站资料 → 查到的结果 → 回到模型，最多 4 次、20 秒；回答 → 检查 → 回复，没过、出错、超时时怎么退；
  - 开发到上线：分支 → PR → 三项必需的检查和旁边的 CodeRabbit、Vercel Preview → 合并 → Vercel Production 和 Modal staging；打 tag → Copilot release → Modal 正式；预览配预览、正式配正式，怎么回滚。
  - `architecture-diagram.tsx` 的框、箭头、颜色改成导出给新图用，框里可以写三四行小字。
- 验证：在浏览器里看过中文、英文四张（文字没出框、箭头没压字，挪了 search agent 那张的两行说明、缩短了一个英文标签），手机宽度下页面不被撑宽（375 像素，图在自己的框里左右滑）；`tsc`、`eslint` 干净。
