from ddgs import DDGS
from pathlib import Path
import requests, csv, io
from PIL import Image

products = [
    ("Innisfree Green Tea Hydrating Amino Acid Cleanser",
     "innisfree green tea amino hydrating cleansing foam official product"),
    ("Shiseido Urban Environment Oil-Free UV Protector",
     "Shiseido Urban Environment Oil-Free Sunscreen SPF 42 non mineral bottle"),
    ("La Roche-Posay Effaclar Duo Acne Treatment",
     "La Roche Posay Effaclar Duo acne spot treatment 5.5 benzoyl peroxide USA"),
    ("Kojic Acid Dark Spot Corrector (Naturium)",
     "Naturium kojic acid dark spot corrector official product"),
    ("La Roche-Posay Cicaplast Baume B5",
     "La Roche Posay Cicaplast Baume B5 original not B5 plus")
]

out = Path("real_image_candidates/last_5")
out.mkdir(parents=True, exist_ok=True)
rows = []

with DDGS() as ddgs:
    for i, (name, query) in enumerate(products, 1):
        print(f"[{i}/5] Searching: {name}", flush=True)
        saved = 0
        try:
            results = list(ddgs.images(query, max_results=20))
        except Exception as e:
            print("Search error:", e)
            continue

        for result in results:
            if saved >= 4:
                break
            url = result.get("image")
            if not url:
                continue
            try:
                response = requests.get(
                    url, timeout=12,
                    headers={"User-Agent": "Mozilla/5.0"}
                )
                response.raise_for_status()
                img = Image.open(io.BytesIO(response.content))
                img.load()
                if min(img.size) < 120:
                    continue
                saved += 1
                filename = f"{i:02d}_{saved}.jpg"
                img.convert("RGB").save(
                    out / filename, quality=90
                )
                rows.append([name, filename, url,
                             result.get("url", "")])
            except Exception:
                continue
        print("Downloaded candidates:", saved, flush=True)

with open(out / "review.csv", "w", newline="",
          encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["product", "filename", "image_url", "source_page"])
    writer.writerows(rows)

print("\nDONE —", len(rows), "candidate images")
print("Folder:", out)
print("Existing 89 images and MongoDB unchanged.")
