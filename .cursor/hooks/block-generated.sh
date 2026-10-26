#!/bin/bash
# preToolUse hook. Denies Write/StrReplace/Delete/Edit when the path is generated
# or vendored. Prints a permission JSON object. On a script failure, prints allow
# so a bug here does not freeze the agent (fail-open). Invalid JSON would block
# the edit, because preToolUse is a permission hook.

tmp=$(mktemp)
cat > "$tmp"

if ! python3 - "$tmp" << 'PY'
import json
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

def paths_from(value, found):
    if isinstance(value, str):
        found.append(value)
        return
    if isinstance(value, dict):
        for key in ("path", "file_path", "target_file", "filePath", "target_notebook"):
            item = value.get(key)
            if isinstance(item, str):
                found.append(item)
        return
    if isinstance(value, list):
        for item in value:
            if isinstance(item, str):
                found.append(item)

try:
    data = json.loads(raw) if raw.strip() else {}
except json.JSONDecodeError:
    print(json.dumps({
        "permission": "allow",
        "agent_message": "block-generated hook could not parse its input and failed open.",
    }))
    sys.exit(0)

tool_input = data.get("tool_input")
if isinstance(tool_input, str):
    try:
        tool_input = json.loads(tool_input)
    except json.JSONDecodeError:
        tool_input = {"path": tool_input}

found = []
paths_from(tool_input, found)
blocked = [path for path in found if generated(path)]
if not blocked:
    print(json.dumps({"permission": "allow"}))
    sys.exit(0)

target = blocked[0]
print(json.dumps({
    "permission": "deny",
    "user_message": "Blocked an edit to a generated or vendored file.",
    "agent_message": (
        f"Edit denied for {target}. That path is generated or vendored. "
        "Change the source (CUE, Wire providers, or the feature toggle registry) "
        "and regenerate with make gen-go, make gen-cue, or make gen-feature-toggles. "
        "Do not write the generated file by hand."
    ),
}))
PY
then
  printf '%s\n' '{"permission":"allow","agent_message":"block-generated hook failed open."}'
fi

rm -f "$tmp"
exit 0
