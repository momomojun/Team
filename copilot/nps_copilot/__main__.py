"""命令行：
  python -m nps_copilot chat [--reference 2026-10-16] [--writer-model]   对话（默认本机 Ollama）
  python -m nps_copilot serve [--host 127.0.0.1] [--port 8765]           HTTP 服务（要 pip install -e copilot[api]）
  python -m nps_copilot stats [--days 7]                                 看运行日志：按版本统计成功率、耗时、编造、退回模板
  python -m nps_copilot version                                          版本、提示词版本和 hash、模型
  python -m nps_copilot alerts [--snapshot copilot/data/alerts/latest.json]   读公告快照、提取临时关闭（快照用 npm run alerts:fetch 抓）
  python -m nps_copilot vectors sync [--model gemini-embedding-001] [--dry-run]   资料的向量写进 Neon（只算新的、改过的；要 DATABASE_URL）
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
    # Hugging Face Spaces 用 PORT 环境变量（7860）
    serve.add_argument("--port", type=int, default=int(os.environ.get("PORT", 8765)))
    stats = sub.add_parser("stats")
    stats.add_argument("--days", type=int, default=7)
    billing = sub.add_parser("billing", help="计费总账：每个模型调用了多少次、多少 token、花了多少钱、按付费标价折算多少")
    billing.add_argument("--days", type=int, default=7)
    billing.add_argument("--json", action="store_true", help="输出汇总的 JSON（每晚读公告以后发布给后台用）")
    billing.add_argument("--publish", action="store_true", help="把这台机器最近 90 天的账发到 GitHub（data/alerts-live 的 usage-local.json），线上的后台看")
    sub.add_parser("version")
    sub.add_parser("graph", help="把一轮对话的 LangGraph 流程图打成 Mermaid")
    alerts_cmd = sub.add_parser("alerts")
    alerts_cmd.add_argument("--snapshot", default=str(DATA / "alerts" / "latest.json"))
    alerts_cmd.add_argument("--out", default=str(DATA / "alerts" / "closures-latest.json"))
    alerts_cmd.add_argument("--cache", default=str(DATA / "alerts" / "extracted.json"), help="读过的公告记在这里，下次只读新的、改过的")
    vectors_cmd = sub.add_parser("vectors", help="按意思找资料用的向量：写进 Neon（sync），或者只数一下要算几条（--dry-run）")
    vectors_cmd.add_argument("action", choices=["sync"])
    vectors_cmd.add_argument("--model", help="嵌入型号（默认 COPILOT_EMBED_MODEL，再默认 gemini-embedding-2）")
    vectors_cmd.add_argument("--dry-run", action="store_true", help="只数新的、改过的、要删的各几条、要调几次接口，不调接口、不写数据库")
    vectors_cmd.add_argument("--first", help="先算这几座公园的资料（逗号隔开的公园代码，比如跑分要用的）")
    vectors_cmd.add_argument("--limit", type=int, help="这次最多算几条（免费档每个型号每天 1000 条，给别的调用留额度）")
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    # 计费总账（ledger.py）里记成谁调用的：读公告是 alerts，聊天和服务是 chat
    os.environ.setdefault("COPILOT_SOURCE", {"alerts": "alerts", "vectors": "index"}.get(args.command, "chat"))

    if args.command == "serve":
        import uvicorn

        uvicorn.run("nps_copilot.api:app", host=args.host, port=args.port)
        return
    if args.command == "graph":
        from .graph import default_graph

        print(default_graph().mermaid())
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
    if args.command == "vectors":
        from .embeddings import GeminiEmbedder, model_name
        from .vectors import NeonStore, database_url, sync

        if args.model:
            os.environ["COPILOT_EMBED_MODEL"] = args.model
        model = model_name()
        url = database_url()
        if not url:
            raise SystemExit("没有 DATABASE_URL：写进 .env.local 或设成环境变量（Neon 控制台 Connect 里 postgresql:// 开头的那串）")
        store = NeonStore(url)
        embedder = None if args.dry_run else GeminiEmbedder(model=model)
        first = set(args.first.split(",")) if args.first else None
        stats = sync(store, embedder, model, dry_run=args.dry_run, first=first, limit=args.limit,
                     on_batch=lambda done, total: print(f"算向量 {done}/{total}", flush=True))
        print(f"{model}：资料 {stats['docs']} 条，库里原有 {stats['stored']} 条；新的 {stats['new']}、改过的 {stats['changed']}、"
              f"删掉 {stats['removed']}" + ("，要调嵌入接口 {} 次".format(stats["requests"]) if args.dry_run else f"，这次算了 {stats['embedded']} 条、还剩 {stats['left']} 条"))
        if stats.get("stopped") == "quota":
            print("今天这个型号的免费额度（每天 1000 条）用完了，算好的已经存进 Neon；明天再跑同一条命令接着算")
        return
    if args.command == "stats":
        from .monitor import report

        print(report(args.days))
        return
    if args.command == "billing":
        from . import ledger
        from .monitor import billing, billing_report

        if args.publish:
            from .publish import publish

            print(publish())
            return
        print(json.dumps(billing(ledger.load(args.days)), ensure_ascii=False) if args.json else billing_report(args.days))
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
