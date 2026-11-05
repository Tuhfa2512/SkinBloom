import csv
import json
import re
import time
from io import BytesIO
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from PIL import Image

root = Path("/workspaces/SkinBloom")
output = root / "client/public/products"
output.mkdir(parents=True, exist_ok=True)

with (root / "products_60.csv").open(encoding="utf-8-sig") as f:
    products = list(csv.DictReader(f))

with (root / "product_image_mapping.json").open(encoding="utf-8") as f:
    mapping = json.load(f)

known = {p["name"] for p in mapping}
failed = []
added = 0

session = requests.Session()
session.headers.update({"User-Agent": "Mozilla/5.0"})

for index, product in enumerate(products, 1):
    name = product["name"].strip()

    if name in known:
        continue

    print(f"[{index}/94] {name}", flush=True)

    try:
        page = session.get(product["image"], timeout=15)
        page.raise_for_status()

        soup = BeautifulSoup(page.text, "html.parser")
        image_url = None

        for attrs in [
            {"property": "og:image"},
            {"name": "twitter:image"}
        ]:
            tag = soup.find("meta", attrs=attrs)
            if tag and tag.get("content"):
                image_url = urljoin(page.url, tag["content"])
                break

        if not image_url:
            raise ValueError("No image metadata")

        response = session.get(image_url, timeout=20)
        response.raise_for_status()

        if not response.headers.get(
            "Content-Type", ""
        ).lower().startswith("image/"):
            raise ValueError("Response is not an image")

        if len(response.content) > 8 * 1024 * 1024:
            raise ValueError("Image too large")

        with Image.open(BytesIO(response.content)) as img:
            if img.width < 150 or img.height < 150:
                raise ValueError("Image dimensions too small")

            img = img.convert("RGB")

            slug = re.sub(
                r"[^a-z0-9]+", "-", name.lower()
            ).strip("-")

            filename = slug + ".jpg"
            img.save(output / filename, "JPEG", quality=88)

        mapping.append({
            "name": name,
            "image": (
                "https://skin-bloom.vercel.app/products/"
                + filename
            )
        })

        added += 1
        print("  Downloaded")

    except Exception as error:
        failed.append({
            "name": name,
            "reason": str(error)
        })
        print("  Failed:", error)

    time.sleep(0.5)

(root / "product_image_mapping.json").write_text(
    json.dumps(mapping, indent=2, ensure_ascii=False),
    encoding="utf-8"
)

(root / "failed_product_images.json").write_text(
    json.dumps(failed, indent=2, ensure_ascii=False),
    encoding="utf-8"
)

print("\nNew images:", added)
print("Total mapped:", len(mapping))
print("Still missing:", len(failed))
