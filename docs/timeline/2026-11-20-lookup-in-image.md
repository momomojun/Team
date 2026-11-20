# 11-20：查询工具在 Copilot 镜像里全部报错（分支 `fix/lookup-in-image`）

- 为什么做：staging 打开 `COPILOT_QA_AGENT` 以后，“自己查”在线上答不出来，本机用同样的话重放却是对的。后台（#117 加的细节）显示每次查询都是 `lookup returned 0 of 1`，一共只花 1.6 秒，不是超时。原因：11-13 查询工具加了季节打分（`lookup-tool.ts` 引用 `src/lib/seasons.ts`），`seasons.ts` 第一行是 `import "server-only"`（Next.js 网站用的 npm 包）。本机和 CI 都装着 npm 包，所以测试都过；Copilot 的镜像里没装 npm 包，查询程序一启动就报 `ERR_MODULE_NOT_FOUND`，**所有查询**（开没开、车程、找景点……）都失败，不只是季节打分。正式环境还是 v0.5.0（那时查询工具不引用 `seasons.ts`），没受影响；发 v0.6.0 之前查出来了。
- 做了什么：`tests/resolve.mjs` 把 `server-only` 直接换成空模块，不再去 node_modules 里找；`tools.call` 查询程序报错退出时不再悄悄返回空，把 node 的报错带出来，两条回答问题的路都会记进记录、后台看得到；新加 `copilot/scripts/smoke_lookup.py`，在镜像里把 8 种查询各跑一次，CI、staging 部署、发版的镜像冒烟测试都加上这一步。原来的冒烟测试只排行程，没拦住。
- 验证：在一个模仿镜像、没有 npm 包的目录里，旧的解析钩子复现了 `Cannot find package 'server-only'`，新的 8 种查询都有结果；网站 216 个、Copilot 501 个测试通过，Ruff 干净。
