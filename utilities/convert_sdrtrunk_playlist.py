import xml.etree.ElementTree as ET
import json
import re

#Converts the existing sdrtrunk playlist.xml to QueueScan talkgroups.json

#Path to sdrtrunk playlist xml
PLAYLIST_XML = "/home/sdrtrunk/playlist/Regional.xml"

OUTPUT_JSON = "talkgroups.json"

# Category → color mapping
CATEGORY_COLORS = {
    "law": "blue",
    "fire": "red",
    "ems": "green",
    "interop": "purple",
    "county": "gray",
}

# Category → priority mapping
CATEGORY_PRIORITY = {
    "law": 2,
    "fire": 2,
    "ems": 2,
    "interop": 2,
    "county": 2,
}

def normalize_category(name):
    """Infer category from alias name."""
    n = name.lower()

    if "fd" in n or "fire" in n:
        return "fire"
    if "ems" in n or "med" in n:
        return "ems"
    if "pd" in n or "sheriff" in n or "law" in n:
        return "law"
    if "ops" in n or "tac" in n:
        return "interop"

    return "county"

def build_entry(tgid, name, category, group):
    return {
        "name": name,
        "category": category,
        "color": CATEGORY_COLORS.get(category, "gray"),
        "group": group,
        "default": True,
        "label": name,
        "agency": group,
        "priority": CATEGORY_PRIORITY.get(category, 9),
        "tv": True,
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
        "customColor": None
    }

def main():
    tree = ET.parse(PLAYLIST_XML)
    root = tree.getroot()

    output = {}

    for alias in root.iter("alias"):
        name = alias.get("name")
        group = alias.get("group", "South Carolina")

        # Find talkgroup ID inside <id type="talkgroup">
        tgid = None
        for id_tag in alias.findall("id"):
            if id_tag.get("type") == "talkgroup":
                tgid = id_tag.get("value")

        if not tgid:
            continue  # skip non-talkgroup aliases

        category = normalize_category(name)

        output[tgid] = build_entry(tgid, name, category, group)

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)

    print(f"Saved {OUTPUT_JSON}")

if __name__ == "__main__":
    main()

