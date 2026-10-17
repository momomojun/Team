"""Download the explicitly selected local model into the existing Team Ollama store."""
import argparse
import json
import time
import urllib.request

parser = argparse.ArgumentParser()
parser.add_argument("--model", default="qwen3.5:4b-q4_K_M")
args = parser.parse_args()
request = urllib.request.Request("http://127.0.0.1:11435/api/pull", data=json.dumps({"model": args.model, "stream": True}).encode(), headers={"Content-Type": "application/json"})
last_status, last_time = "", 0
with urllib.request.urlopen(request, timeout=1800) as response:
    for line in response:
        item = json.loads(line)
        if "error" in item:
            raise RuntimeError(item["error"])
        now, status = time.monotonic(), item.get("status", "")
        if status != last_status or now - last_time > 20:
            print(json.dumps(item), flush=True)
            last_status, last_time = status, now
