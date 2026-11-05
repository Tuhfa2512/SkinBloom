"""Find real, openly licensed product-photo candidates from Wikimedia Commons.
Read-only for existing product images and database. Review all candidates manually.
Run: python find_remaining_real_images.py
Requires: pip install requests pillow
"""
import csv
import json
import re
import time
from pathlib import Path
from io import BytesIO
import requests
from PIL import Image

ROOT = Path(__file__).resolve().parent
INPUT = ROOT / 'remaining_62_products.json'
OUT = ROOT / 'real_image_candidates'
OUT.mkdir(exist_ok=True)
API = 'https://commons.wikimedia.org/w/api.php'
DONE = {'CeraVe Hydrating Cleanser', 'CeraVe Foaming Facial Cleanser', 'Black Girl Sunscreen SPF 30'}
S = requests.Session()
S.headers.update({'User-Agent': 'SkinBloomUniversityProject/1.0 (product photo research; contact: project developer)'})

def clean_html(s):
    return re.sub(r'<[^>]*>', '', s or '').strip()

def search(name, brand):
    for query in [f'"{name}"', f'{brand} skincare product']:
        try:
            j = S.get(API, params={'action':'query','generator':'search','gsrsearch':query+' filetype:bitmap',
                'gsrnamespace':6,'gsrlimit':8,'prop':'imageinfo','iiprop':'url|extmetadata|mime',
                'iiurlwidth':600,'format':'json'}, timeout=18).json()
        except (requests.RequestException, ValueError):
            continue
        for page in j.get('query', {}).get('pages', {}).values():
            info = (page.get('imageinfo') or [{}])[0]
            meta = info.get('extmetadata', {})
            license_name = clean_html(meta.get('LicenseShortName', {}).get('value', ''))
            license_url = meta.get('LicenseUrl', {}).get('value', '')
            if license_name.lower() in {'', 'unknown', 'copyrighted free use', 'fair use'}:
                continue
            title = page.get('title', '')
            words = set(re.findall(r'[a-z0-9]+', (name+' '+brand).lower())) - {'the','and','for','with','spf','cream','gel'}
            hits = sum(w in title.lower() for w in words if len(w) > 3)
            if hits < 2:
                continue
            yield title, info, license_name, license_url
        time.sleep(0.3)

if not INPUT.exists():
    raise SystemExit('Missing remaining_62_products.json. Place it beside this script.')
products = json.loads(INPUT.read_text(encoding='utf-8-sig'))
rows = []
for i, product in enumerate(products, 1):
    name, brand = product['name'], product['brand']
    if name in DONE:
        continue
    saved = 0
    seen = set()
    for title, info, lic, licurl in search(name, brand):
        if title in seen or saved >= 3:
            continue
        seen.add(title)
        url = info.get('thumburl') or info.get('url')
        if not url:
            continue
        filename = f'candidate_{i:02d}_{saved+1}.jpg'
        try:
            response = S.get(url, timeout=20)
            response.raise_for_status()
            img = Image.open(BytesIO(response.content))
            img.thumbnail((600, 600))
            img.convert('RGB').save(OUT / filename, 'JPEG', quality=85)
        except (requests.RequestException, OSError, ValueError):
            continue
        rows.append({'product':name,'brand':brand,'local_preview':str(OUT / filename),
                     'commons_file':title,'image_source':info.get('descriptionurl', ''),
                     'license':lic,'license_url':licurl,'review':'NOT_VERIFIED'})
        saved += 1
    print(f'[{i}/{len(products)}] {name}: {saved} candidate(s)', flush=True)
    time.sleep(0.4)

report = ROOT / 'real_image_candidates_review.csv'
with report.open('w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['product','brand','local_preview','commons_file','image_source','license','license_url','review'])
    writer.writeheader()
    writer.writerows(rows)
print(f'\nFound {len(rows)} candidates for {len(set(r["product"] for r in rows))} products.')
print(f'Preview folder: {OUT}\nReview report: {report}')
print('No existing product images or MongoDB records were changed.')
