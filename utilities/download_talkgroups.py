from zeep import Client
import json

# -----------------------------
# CONFIGURATION
# -----------------------------
RR_USERNAME = "your_username"
RR_PASSWORD = "your_password"
RR_APPKEY  = "your_appkey"   # Required by RR API

SYSTEM_ID = 4532  # Palmetto 800 (South Carolina statewide P25)

OUTPUT_JSON = "sc_talkgroups.json"

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
    "fire": 4,
    "ems": 3,
    "interop": 6,
    "county": 8,
}

# -----------------------------
# HELPERS
# -----------------------------
def normalize_category(rr_category):
    text = rr_category.lower()

    if "fire" in text:
        return "fire"
    if "ems" in text or "med" in text:
        return "ems"
    if "law" in text or "police" in text or "sheriff" in text:
        return "law"
    if "interop" in text:
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

# -----------------------------
# MAIN
# -----------------------------
def main():
    wsdl = "https://api.radioreference.com/soap2/?wsdl"
    client = Client(wsdl)

    auth = {
        "appKey": RR_APPKEY,
        "username": RR_USERNAME,
        "password": RR_PASSWORD,
        "version": "latest",
        "style": "rpc"
    }

    # Fetch talkgroups
    tg_list = client.service.getTrsTalkgroups(SYSTEM_ID, None, None, None, auth)

    output = {}

    for tg in tg_list:
        tgid = str(tg.decimal)
        name = tg.description or tg.alphaTag or f"TG {tgid}"
        rr_category = tg.category or "Unknown"

        category = normalize_category(rr_category)

        # Basic group inference
        if "Kershaw" in name:
            group = "Kershaw County"
        else:
            group = "South Carolina"

        output[tgid] = build_entry(tgid, name, category, group)

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)

    print(f"Saved {OUTPUT_JSON}")

if __name__ == "__main__":
    main()

