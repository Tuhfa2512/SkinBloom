
import csv
import json
import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

results = []

with open("products_60.csv", encoding="utf-8-sig", newline="") as file:
    products = list(csv.DictReader(file))

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0"
})

for index, product in enumerate(products, 1):
    name = product["name"]
    webpage = product["image"]
    image_url = None

    try:
        response = session.get(webpage, timeout=15)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        for attribute, value in [
            ("property", "og:image"),
            ("property", "twitter:image"),
            ("name", "twitter:image")
        ]:
            tag = soup.find("meta", attrs={attribute: value})

            if tag and tag.get("content"):
                image_url = urljoin(webpage, tag["content"])
                break

        status = "FOUND" if image_url else "MISSING"

    except requests.RequestException as error:
        status = "ERROR"
        print(f"Request failed for {name}: {error}")

    results.append({
        "name": name,
        "image": image_url,
        "status": status
    })

    print(f"[{index}/{len(products)}] {status}: {name}")
    time.sleep(0.5)

with open("product_image_results.json", "w", encoding="utf-8") as file:
    json.dump(results, file, indent=2, ensure_ascii=False)

found = sum(1 for item in results if item["image"])

print(f"\nFound image URLs: {found}/{len(products)}")
print("Saved results to product_image_results.json")
