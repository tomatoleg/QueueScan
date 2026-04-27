import json
from pathlib import Path

# ============================================================
# CONFIG
# ============================================================

INPUT_FILE = Path("config/talkgroups.json")
OUTPUT_FILE = Path("talkgroups_enhanced.json")

# ============================================================
# DEFAULT METADATA
# ============================================================

DEFAULT_FIELDS = {
    "label": None,
    "agency": None,
    "priority": 1,
    "tv": False,
    "listen": True,
    "record": True,
    "favorite": False,
    "rulesEnabled": True,
    "enabled": True,
    "muted": False,
    "hidden": False,
    "tags": [],
    "department": None,
    "zone": None,
    "icon": None,
    "notes": None,
    "sortOrder": 9999,
    "lastSeen": None,
    "displayMode": "normal",
    "source": "migration",
    "customColor": None,
}

# ============================================================
# LOAD
# ============================================================

if not INPUT_FILE.exists():
    raise FileNotFoundError(f"Missing file: {INPUT_FILE}")

with open(INPUT_FILE, "r") as f:
    talkgroups = json.load(f)

# ============================================================
# MIGRATION
# ============================================================

updated = {}

for tgid, tg in talkgroups.items():
    if not isinstance(tg, dict):
        print(f"Skipping invalid TG {tgid}")
        continue

    merged = tg.copy()

    for field, default_value in DEFAULT_FIELDS.items():
        if field not in merged:
            merged[field] = default_value

    # Optional smart defaults
    if merged.get("label") is None:
        merged["label"] = merged.get("name")

    if merged.get("agency") is None:
        merged["agency"] = merged.get("group")

    updated[tgid] = merged

# ============================================================
# SAVE
# ============================================================

with open(OUTPUT_FILE, "w") as f:
    json.dump(updated, f, indent=2)

print(f"Enhanced talkgroups written to: {OUTPUT_FILE}")
print(f"Total talkgroups processed: {len(updated)}")

