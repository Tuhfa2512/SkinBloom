"""Collect review-only real image candidates from product page URLs in remaining_62_products.json.
No database writes, no Git changes, no overwrites of existing website images.
Run from SkinBloom repository root: python collect_skinbloom_candidates.py
"""
import csv
import io
import json
import re
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from PIL import Image

ROOT = Path(__file__).resolve().parent
INPUT = ROOT / 'remaining_62_products.json'
OUT = ROOT / 'real_image_candidates' / 'batch_review.csv'
DONE = {'cerave hydrating cleanser', 'cerave foaming facial cleanser', 'black girl sunscreen spf 30', 'cerave moisturizing cream'}
HEADERS = {'User-Agent': 'Mozilla/5.0 (compatible; SkinBloomUniversityDemo/1.0)'}

def normalize(s):
    return re.sub(r'[^a-z0-9]+', ' ', str(s).lower()).strip()

def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', str(s).lower()).strip('-')[:90]

def image_urls(soup, page):
    urls = []
    def add(value):
        if not isinstance(value, str) or not value.strip(): return
        u = urljoin(page, value.strip())
        if urlparse(u).scheme in ('https', 'http') and u not in urls:
            urls.append(u)
    for tag in soup.find_all('meta'):
        k = (tag.get('property') or tag.get('name') or '').lower()
        if k in ('og:image', 'twitter:image', 'twitter:image:src'):
            add(tag.get('content'))
    for tag in soup.find_all('script', type='application/ld+json'):
        try: data = json.loads(tag.string or tag.get_text())
        except (ValueError, TypeError): continue
        def walk(x):
            if isinstance(x, list):
                for v in x: walk(v)
            elif isinstance(x, dict):
                kind = x.get('@type', '')
                if kind == 'Product' or (isinstance(kind, list) and 'Product' in kind):
                    imgs = x.get('image', [])
                    for v in (imgs if isinstance(imgs, list) else [imgs]):
                        add(v if isinstance(v, str) else v.get('url', '') if isinstance(v, dict) else '')
                for v in x.values():
                    if isinstance(v, (dict, list)): walk(v)
        walk(data)
    for img in soup.find_all('img'):
        for key in ('src', 'data-src', 'data-original', 'data-zoom-image'):
            add(img.get(key))
        srcset = img.get('srcset') or img.get('data-srcset')
        if srcset:
            for item in srcset.split(','):
                add(item.strip().split(' ')[0])
    return urls

def rank(url, name):
    p = normalize(urlparse(url).path.replace('-', ' ').replace('_', ' '))
    tokens = [w for w in normalize(name).split() if len(w) > 2 and w not in ('the', 'with', 'and', 'spf', 'for')]
    score = sum(2 for w in tokens if w in p)
    if any(x in p for x in ('front', 'hero', 'product', 'packshot', 'main')): score += 2
    if any(x in p for x in ('logo', 'icon', 'flag', 'privacy', 'banner', 'sprite', 'social')): score -= 12
    return score

def main():
    if not INPUT.exists():
        print('Missing remaining_62_products.json in project root. No files changed.')
        return
    products = json.loads(INPUT.read_text(encoding='utf-8-sig'))
    if isinstance(products, dict):
        products = products.get('products', [])
    OUT.parent.mkdir(exist_ok=True)
    session = requests.Session()
    session.headers.update(HEADERS)
    rows = []
    for i, product in enumerate(products, 1):
        name = str(product.get('name', '')).strip()
        page = str(product.get('source', '')).strip()
        if normalize(name) in DONE or (ROOT / 'client/public/products' / (slug(name) + '.jpg')).exists():
            print(f'[{i}/{len(products)}] SKIP already completed: {name}', flush=True)
            continue
        if not page.startswith(('https://', 'http://')):
            print(f'[{i}/{len(products)}] NO PRODUCT PAGE: {name}', flush=True)
            rows.append([name, page, '', '', 'no source page'])
            continue
        try:
            resp = session.get(page, timeout=20)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, 'html.parser')
            candidates = sorted(image_urls(soup, resp.url), key=lambda u: rank(u, name), reverse=True)
            saved = 0
            for j, url in enumerate(candidates[:18], 1):
                if rank(url, name) < 1: continue
                try:
                    r = session.get(url, timeout=15)
                    r.raise_for_status()
                    if len(r.content) > 8_000_000: continue
                    im = Image.open(io.BytesIO(r.content))
                    if min(im.size) < 220: continue
                    if im.width / im.height > 2.3 or im.height / im.width > 2.3: continue
                    target = OUT.parent / f'{slug(name)}-{saved+1}.jpg'
                    if target.exists():
                        rows.append([name, page, url, str(target.relative_to(ROOT)), 'existing preview - review manually'])
                    else:
                        im.convert('RGB').save(target, quality=88)
                        rows.append([name, page, url, str(target.relative_to(ROOT)), 'review manually; source usage rights not verified'])
                    saved += 1
                    if saved >= 3: break
                except (requests.RequestException, OSError, ValueError):
                    continue
            if saved == 0: rows.append([name, page, '', '', 'no usable candidates; check page manually'])
            print(f'[{i}/{len(products)}] {name}: {saved} preview(s)', flush=True)
        except requests.RequestException as e:
            rows.append([name, page, '', '', f'page fetch failed: {type(e).__name__}'])
            print(f'[{i}/{len(products)}] {name}: page blocked/unavailable', flush=True)
        time.sleep(0.3)
    with OUT.open('w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerow(['name', 'source_page', 'image_url', 'preview_file', 'status'])
        writer.writerows(rows)
    print('\nReview report:', OUT.relative_to(ROOT))
if __name__ == "__main__":
    main()
