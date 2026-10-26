#!/bin/bash
# afterFileEdit hook. Formats a Go file with gofmt, or a TS/TSX file with the
# repo's prettier when that binary is already installed. Fail open: a formatter
# miss or a bad payload still exits 0. Stdout is "{}" because this hook has no
# documented output fields. Details go to stderr so a demo can show them.

tmp=$(mktemp)
cat > "$tmp"

python3 - "$tmp" << 'PY'
import json
import os
import shutil
import subprocess
import sys

payload_path = sys.argv[1]
with open(payload_path, "r", encoding="utf-8") as handle:
    raw = handle.read()

def generated(path):
    norm = path.replace("\\", "/")
    base = norm.rsplit("/", 1)[-1]
    parts = [part for part in norm.split("/") if part]
    if "vendor" in parts or "node_modules" in parts:
        return True
    if "public" in parts and "build" in parts:
        # public/build is webpack output
        try:
            if parts.index("build") == parts.index("public") + 1:
                return True
        except ValueError:
            pass
    if base == "wire_gen.go" or base.endswith("_gen.go") or base.endswith(".gen.go"):
        return True
    if base.endswith(".gen.ts") or base.endswith(".gen.tsx"):
        return True
    if base.startswith("zz_generated"):
        return True
    return False

try:
    data = json.loads(raw) if raw.strip() else {}
except json.JSONDecodeError:
    print("format-edited: ignored unparseable input", file=sys.stderr)
    print("{}")
    sys.exit(0)

path = data.get("file_path") or ""
if not path or not os.path.isfile(path):
    print("format-edited: no file to format", file=sys.stderr)
    print("{}")
    sys.exit(0)

if generated(path):
    print(f"format-edited: skipped generated or vendored file {path}", file=sys.stderr)
    print("{}")
    sys.exit(0)

ext = os.path.splitext(path)[1]
if ext == ".go":
    gofmt = shutil.which("gofmt")
    if not gofmt:
        print("format-edited: gofmt not on PATH", file=sys.stderr)
    else:
        result = subprocess.run([gofmt, "-w", path], capture_output=True, text=True)
        if result.returncode != 0:
            print(result.stderr.strip() or "gofmt failed", file=sys.stderr)
        else:
            print(f"format-edited: gofmt -w {path}", file=sys.stderr)
elif ext in (".ts", ".tsx"):
    candidates = []
    for root in data.get("workspace_roots") or []:
        candidates.append(os.path.join(root, "node_modules", ".bin", "prettier"))
    candidates.append(os.path.join(os.getcwd(), "node_modules", ".bin", "prettier"))
    prettier = next((item for item in candidates if os.path.isfile(item) and os.access(item, os.X_OK)), None)
    if not prettier:
        print(f"format-edited: prettier not installed, skipped {path}", file=sys.stderr)
    else:
        result = subprocess.run([prettier, "--write", "--log-level", "warn", path], capture_output=True, text=True)
        if result.returncode != 0:
            print((result.stderr or result.stdout).strip() or "prettier failed", file=sys.stderr)
        else:
            print(f"format-edited: prettier --write {path}", file=sys.stderr)
else:
    print(f"format-edited: skipped {ext or 'file'} {path}", file=sys.stderr)

print("{}")
PY

status=$?
rm -f "$tmp"
# Formatter problems must not block the agent. afterFileEdit is not a permission hook.
exit 0
