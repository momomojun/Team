# 10-26：本机一键启动（分支 `feature/local-launcher`）

- 为什么做：仓库主人要一个自己在本机就能直接运行的入口，不用记网站、Copilot、本机模型分别怎么开。
- 做了什么：根目录的 `start.cmd`（双击）调 `scripts/start-local.ps1`，按顺序检查 Node、Python 和依赖（缺了就装），找到或打开本机 Ollama，开 Copilot 服务（8765，被占了换 8766、8767；已经开着的直接用）、开网站（把这次的 Copilot 地址通过 `COPILOT_URL` 传给它），两个都起来后打开行程页。`-LocalModel` 只用本机模型，`-Stop`（`stop.cmd`）按 `.local-run/pids.txt` 关掉这次开的进程。写法见 [GUIDE.md](../GUIDE.md#一键启动windows)。
- 踩到的坑：Windows PowerShell 5.1 读不带 BOM 的 UTF-8 脚本会把中文读乱，脚本存成带 BOM 的；用管道接便携版 Ollama 启动脚本的输出会一直等（Ollama 继承了管道），改成 `Start-Process -Wait`；PowerShell 5.1 里把外部程序的报错重定向会被当成脚本出错，检查 Python 依赖那一句先放宽。
- 检查：在新的 worktree 里从头跑了一遍（自动 `npm install`），Copilot 和网站都起来了；行程页的 Copilot 对话框用本机模型回了一句（“6 月从拉斯维加斯出发去锡安玩 3 天” → 追问节奏）；`-Stop` 以后 3000、8765 端口都关了。
