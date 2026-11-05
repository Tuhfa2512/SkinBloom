import csv
import json
import re
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

ROOT = Path("/workspaces/SkinBloom")
OUTPUT = ROOT / "client/public/products"
OUTPUT.mkdir(parents=True, exist_ok=True)

DOMAIN = "https://skin-bloom.vercel.app"
CSV_FILE = ROOT / "products_60.csv"
MAPPING_FILE = ROOT / "product_image_mapping.json"

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (compatible; SkinBloomImageImporter/1.0)"
})

with CSV_FILE.open(encoding="utf-8-sig", newline="") as f:
    products = list(csv.DictReader(f))

mapping = []
failed = []

def slugify(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")

def find_image(page_url):
    response = session.get(page_url, timeout=15)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    for attr in [
        {"property": "og:image"},
        {"name": "twitter:image"}
    ]:
        tag = soup.find("meta", attrs=attr)
        if tag and tag.get("content"):
            return urljoin(page_url, tag["content"])

    return None

def download_image(url, filepath):
    response = session.get(url, timeout=20)
    response.raise_for_status()

    content_type = response.headers.get("Content-Type", "").lower()

    if "image/jpeg" not in content_type:
        raise ValueError("Not a JPEG image")

    if len(response.content) < 3000:
        raise ValueError("Image too small")

    if len(response.content) > 8 * 1024 * 1024:
        raise ValueError("Image too large")

    if response.content[:3] != b"\xff\xd8\xff":
        raise ValueError("Invalid JPEG signature")

    filepath.write_bytes(response.content)

for index, product in enumerate(products, 1):
    name = product["name"].strip()
    page_url = product["image"].strip()

    filename = slugify(name) + ".jpg"
    filepath = OUTPUT / filename

    print(f"[{index}/{len(products)}] {name}")

    if filepath.exists():
        mapping.append({
            "name": name,
            "image": f"{DOMAIN}/products/{filename}"
        })
        print("  Existing image")
        continue

    try:
        image_url = find_image(page_url)

        if not image_url:
            raise ValueError("No product image metadata found")

        download_image(image_url, filepath)

        mapping.append({
            "name": name,
            "image": f"{DOMAIN}/products/{filename}"
        })

        print("  Downloaded")

    except Exception as error:
        failed.append({
            "name": name,
            "reason": str(error)
        })
        print("  Failed:", error)

    time.sleep(0.5)

MAPPING_FILE.write_text(
    json.dumps(mapping, indent=2, ensure_ascii=False),
    encoding="utf-8"
)

(ROOT / "failed_product_images.json").write_text(
    json.dumps(failed, indent=2, ensure_ascii=False),
    encoding="utf-8"
)

print("\nFinished!")
print("Images prepared:", len(mapping))
print("Still missing:", len(failed))
print("Mapping saved:", MAPPING_FILE)
