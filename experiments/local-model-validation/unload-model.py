"""Release the benchmark model from VRAM; keep downloaded weights and server."""
import json
import urllib.request

request = urllib.request.Request('http://127.0.0.1:11435/api/generate',
    data=json.dumps({'model': 'qwen3:4b', 'keep_alive': 0, 'stream': False}).encode(),
    headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(request, timeout=30) as response:
    print(response.read().decode())
