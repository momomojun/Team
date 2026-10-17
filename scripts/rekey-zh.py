# 改中文原文里的一段文字，同时改英文内容表里对应的键，可以顺便改英文值。
# 用法（在仓库根目录下）：
#   python scripts/rekey-zh.py <数据文件> <中文旧文字> <中文新文字> --content <组名> [--en <英文旧文字> <英文新文字>]
# 例：python scripts/rekey-zh.py src/data/attractions/romo.ts "约 1.1 公里" "约 1.3 公里" --content attractions-romo --en "0.7 mile" "0.8 mile"
# 只改 --content 指定的那一个英文文件（多个助手同时改不同公园时不会互相覆盖）。
# 中文旧文字必须在数据文件里出现，且英文表里要有包含它的键，否则报错、什么都不改。
import sys, json

args = sys.argv[1:]
if "--content" not in args:
    sys.exit("缺少 --content <组名>")
data, old, new = args[0], args[1], args[2]
group = args[args.index("--content") + 1]
en_old = en_new = None
if "--en" in args:
    k = args.index("--en")
    en_old, en_new = args[k + 1], args[k + 2]

text = open(data, encoding="utf8").read()
count = text.count(old)
if count == 0:
    sys.exit(f"数据文件里找不到：{old}")

path = f"src/i18n/en/content/{group}.ts"
t = open(path, encoding="utf8").read()
i, j = t.index("{"), t.rindex("}")
entries = json.loads(t[i : j + 1])
out, hit, en_hit = {}, 0, 0
for key, value in entries.items():
    if old in key:
        key = key.replace(old, new)
        hit += 1
        if en_old is not None:
            if en_old in value:
                value = value.replace(en_old, en_new)
                en_hit += 1
    out[key] = value
if hit == 0:
    sys.exit(f"{group} 里没有包含这段中文的键；英文可能在别的组，或者这段中文本身不显示")
if en_old is not None and en_hit == 0:
    sys.exit(f"英文值里找不到：{en_old}（什么都没改）")

lines = [f"  {json.dumps(k, ensure_ascii=False)}: {json.dumps(v, ensure_ascii=False)}," for k, v in out.items()]
lines[-1] = lines[-1].rstrip(",")
# 先写英文，再写中文；写中文失败就把英文退回原样，两边不会对不上
open(path, "w", encoding="utf8").write(t[:i] + "{\n" + "\n".join(lines) + "\n}" + t[j + 1 :])
try:
    open(data, "w", encoding="utf8").write(text.replace(old, new))
except OSError:
    open(path, "w", encoding="utf8").write(t)
    raise
print(f"OK：数据文件改了 {count} 处，{group} 改了 {hit} 个键" + (f"、{en_hit} 个英文值" if en_old else ""))
