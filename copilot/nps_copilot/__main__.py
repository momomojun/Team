"""命令行：
  python -m nps_copilot chat [--reference 2026-10-16] [--writer-model]   对话（默认本机 Ollama）
  python -m nps_copilot serve [--host 127.0.0.1] [--port 8765]           HTTP 服务（要 pip install -e copilot[api]）
  python -m nps_copilot stats [--days 7]                                 看运行日志：按版本统计成功率、耗时、编造、退回模板
  python -m nps_copilot version                                          版本、提示词版本和 hash、模型
  python -m nps_copilot alerts [--snapshot copilot/data/alerts/latest.json]   读公告快照、提取临时关闭（快照用 npm run alerts:fetch 抓）
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import sys

from . import __version__, prompts
from .pipeline import Session
from .providers import ProviderError, chat_provider

DATA = __import__("pathlib").Path(__file__).resolve().parents[1] / "data"


def main() -> None:
    parser = argparse.ArgumentParser(prog="nps_copilot")
    sub = parser.add_subparsers(dest="command", required=True)
    chat = sub.add_parser("chat")
    chat.add_argument("--reference", default=dt.date.today().isoformat())
    chat.add_argument("--writer-model", action="store_true", help="让模型改写说明（会检查有没有编造，对不上就用模板）")
    serve = sub.add_parser("serve")
    serve.add_argument("--host", default="127.0.0.1", help="在 Docker 里要用 0.0.0.0")
    serve.add_argument("--port", type=int, default=8765)
    stats = sub.add_parser("stats")
    stats.add_argument("--days", type=int, default=7)
    sub.add_parser("version")
    alerts_cmd = sub.add_parser("alerts")
    alerts_cmd.add_argument("--snapshot", default=str(DATA / "alerts" / "latest.json"))
    alerts_cmd.add_argument("--out", default=str(DATA / "alerts" / "closures-latest.json"))
    alerts_cmd.add_argument("--cache", default=str(DATA / "alerts" / "extracted.json"), help="读过的公告记在这里，下次只读新的、改过的")
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")

    if args.command == "serve":
        import uvicorn

        uvicorn.run("nps_copilot.api:app", host=args.host, port=args.port)
        return
    if args.command == "version":
        print(json.dumps({"version": __version__, "build": os.environ.get("COPILOT_BUILD_SHA"), "prompts": prompts.current(),
                          "provider": os.environ.get("COPILOT_PROVIDER", "ollama"), "model": os.environ.get("COPILOT_MODEL", "qwen3.5:4b-q4_K_M")},
                         ensure_ascii=False, indent=1))
        return
    if args.command == "alerts":
        from pathlib import Path

        from .alerts_live import alerts_provider, closures_file, save_json

        snapshot = json.loads(open(args.snapshot, encoding="utf-8").read())
        provider = alerts_provider()
        out, stats = closures_file(snapshot, provider, Path(args.cache))
        save_json(Path(args.out), out)
        who = getattr(provider, "model", "规则") if provider else "规则"
        print(f"{len(snapshot['alerts'])} 条公告（{who}：新读 {stats['read']} 条，用了缓存 {stats['cached']} 条，按规则算 {stats['rules_only']} 条），"
              f"{len(out['closures'])} 条关了网站上的景点，写到 {args.out}")
        print(f"STATS={json.dumps(stats)}")
        return
    if args.command == "stats":
        from .monitor import report

        print(report(args.days))
        return

    session = Session(chat_provider(), args.reference, writer_model=args.writer_model)
    print("说说你的行程（空行退出）。Describe your trip (blank line to quit).")
    while True:
        try:
            message = input("> ").strip()
        except EOFError:
            break
        if not message:
            break
        try:
            reply = session.send(message)
        except ProviderError as error:
            print(f"[模型出错] {error}")
            continue
        print(reply.text)
        if reply.question and reply.question.get("options"):
            for i, option in enumerate(reply.question["options"], 1):
                note = f" — {option['note']}" if option.get("note") else ""
                print(f"  {i}. {option['label']}{note}")


if __name__ == "__main__":
    main()
