"""命令行：
  python -m nps_copilot chat [--reference 2026-10-16] [--writer-model]   对话（默认本机 Ollama）
  python -m nps_copilot serve [--port 8765]                              HTTP 服务（要 pip install -e copilot[api]）
"""
from __future__ import annotations

import argparse
import datetime as dt
import sys

from .pipeline import Session
from .providers import ProviderError, from_env


def main() -> None:
    parser = argparse.ArgumentParser(prog="nps_copilot")
    sub = parser.add_subparsers(dest="command", required=True)
    chat = sub.add_parser("chat")
    chat.add_argument("--reference", default=dt.date.today().isoformat())
    chat.add_argument("--writer-model", action="store_true", help="让模型改写说明（会检查有没有编造，对不上就用模板）")
    serve = sub.add_parser("serve")
    serve.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()

    if args.command == "serve":
        import uvicorn

        uvicorn.run("nps_copilot.api:app", host="127.0.0.1", port=args.port)
        return

    sys.stdout.reconfigure(encoding="utf-8")
    session = Session(from_env(), args.reference, writer_model=args.writer_model)
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
