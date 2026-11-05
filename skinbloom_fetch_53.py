import json, csv, requests
from pathlib import Path
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from PIL import Image
from io import BytesIO

items = json.load(open("skinbloom_pending_sources.json"))
out = Path("real_image_candidates/pending_53")
out.mkdir(parents=True, exist_ok=True)
rows = []

for i, item in enumerate(items, 1):
    name, url = item["name"], item["source"]
    print(f"[{i}/53] {name}", flush=True)
    status = "NO_IMAGE"
    image_url = ""
    filename = ""

    try:
        response = requests.get(
            url,
            headers={"User-Agent": "Mozilla/5.0"},
            timeout=15
        )
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        tag = soup.select_one(
            'meta[property="og:image"], meta[name="twitter:image"]'
        )

        if tag and tag.get("content"):
            image_url = urljoin(response.url, tag["content"])
            result = requests.get(image_url, timeout=15)
            result.raise_for_status()
            img = Image.open(BytesIO(result.content)).convert("RGB")

            if min(img.size) >= 180:
                filename = f"candidate_{i:02d}.jpg"
                img.thumbnail((900, 900))
                img.save(out / filename)
                status = "REVIEW_REQUIRED"
    except Exception as e:
        print("  Skipped:", str(e)[:90])

    rows.append([name, url, image_url, filename, status])

with open(out / "review.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(
        ["name", "source_page", "image_url", "filename", "status"]
    )
    writer.writerows(rows)

print("DONE")
print("Downloaded:", sum(r[4] == "REVIEW_REQUIRED" for r in rows))
print("Review folder:", out)
print("Existing images and MongoDB unchanged.")
