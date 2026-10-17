"""Download model through the loopback-only Ollama service; no cloud inference."""
import json
import time
import urllib.request

req = urllib.request.Request('http://127.0.0.1:11435/api/pull',
    data=json.dumps({'model': 'qwen3:4b', 'stream': True}).encode(),
    headers={'Content-Type': 'application/json'})
last_time = 0
last_status = ''
with urllib.request.urlopen(req, timeout=1800) as response:
    for line in response:
        item = json.loads(line)
        if 'error' in item:
            raise RuntimeError(item['error'])
        status = item.get('status', '')
        now = time.monotonic()
        if status != last_status or now - last_time > 20:
            print(json.dumps(item), flush=True)
            last_time, last_status = now, status
