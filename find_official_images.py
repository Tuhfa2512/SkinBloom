"""SkinBloom: discover official product page and image candidates.
Read-only: no images downloaded and no MongoDB or Git changes.
Run from project root: python find_official_images.py
Requires: pip install requests beautifulsoup4
"""
import csv
import json
import re
import time
from pathlib import Path
from urllib.parse import quote, urlparse, parse_qs, unquote, urljoin

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent
INPUT = ROOT / 'image_source_candidates.csv'
if not INPUT.exists():
    INPUT = ROOT / 'image_source_review.csv'
OUTPUT = ROOT / 'official_image_candidates.csv'
SESSION = requests.Session()
SESSION.headers.update({'User-Agent': 'Mozilla/5.0 (compatible; SkinBloomSourceReview/1.0)'})
TIMEOUT = 12

# Hand-checked official pages; these are NOT permissions to reuse imagery.
KNOWN = {
    'CeraVe Hydrating Cleanser': 'https://www.cerave.com/skincare/cleansers/hydrating-facial-cleanser/',
    'Black Girl Sunscreen SPF 30': 'https://blackgirlsunscreen.com/product/black-girl-sunscreen-spf-30/',
}

def host(url):
    h = urlparse(url).hostname or ''
    return h.removeprefix('www.').lower()

def official_host(candidate, original):
    a, b = host(candidate), host(original)
    if not a or not b:
        return False
    return a == b or a.endswith('.' + b) or b.endswith('.' + a)

def search_links(name, brand, original):
    # Search is a discovery aid only; results are never marked verified automatically.
    query = f'{brand} {name} official product'
    url = 'https://www.google.com/search?q=' + quote(query)
    results = []
    try:
        resp = SESSION.get('https://www.google.com/search', params={'q': query, 'num': 12}, timeout=TIMEOUT)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')
        for a in soup.select('a[href]'):
            href = a.get('href', '')
            if href.startswith('/url?'):
                href = parse_qs(urlparse(href).query).get('q', [''])[0]
            if not href.startswith('https://'):
                continue
            if not official_host(href, original):
                continue
            if any(t in href.lower() for t in ('/search', '/collections/', '/category/', 'javascript:')):
                continue
            if href not in results:
                results.append(href)
            if len(results) >= 3:
                break
    except requests.RequestException:
        pass
    return results, url

def images_from_page(page):
    try:
        r = SESSION.get(page, timeout=TIMEOUT)
        if r.status_code != 200:
            return str(r.status_code), '', ''
        soup = BeautifulSoup(r.text, 'html.parser')
        title = soup.title.get_text(' ', strip=True) if soup.title else ''
        imgs = []
        for meta in soup.select('meta[property="og:image"],meta[name="twitter:image"]'):
            src = meta.get('content', '').strip()
            if src:
                imgs.append(urljoin(r.url, src))
        for script in soup.select('script[type="application/ld+json"]'):
            try:
                data = json.loads(script.string or script.get_text())
            except (ValueError, TypeError):
                continue
            stack = [data]
            while stack:
                x = stack.pop()
                if isinstance(x, list):
                    stack.extend(x)
                elif isinstance(x, dict):
                    types = x.get('@type', [])
                    if isinstance(types, str):
                        types = [types]
                    if 'Product' in types:
                        img = x.get('image', [])
                        for v in (img if isinstance(img, list) else [img]):
                            if isinstance(v, str):
                                imgs.append(urljoin(r.url, v))
                            elif isinstance(v, dict) and v.get('url'):
                                imgs.append(urljoin(r.url, v['url']))
                    stack.extend(v for v in x.values() if isinstance(v, (list, dict)))
        return '200', next((x for x in imgs if x.startswith('http')), ''), title[:180]
    except requests.RequestException:
        return 'request_error', '', ''

with INPUT.open(encoding='utf-8-sig', newline='') as f:
    rows = list(csv.DictReader(f))

fields = ['name','brand','original_page','suggested_official_page','page_http_status','page_title','candidate_image_url','google_search','review_status','permission_status']
with OUTPUT.open('w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    for i, row in enumerate(rows, 1):
        name, brand = row['name'], row['brand']
        original = row.get('original_page') or row.get('source') or ''
        found, search_url = search_links(name, brand, original)
        options = ([KNOWN[name]] if name in KNOWN else []) + found + ([original] if original else [])
        options = list(dict.fromkeys(options))
        chosen = status = image = title = ''
        for page in options[:5]:
            status, image, title = images_from_page(page)
            if status == '200' and image:
                chosen = page
                break
            if status == '200' and not chosen:
                chosen = page
        writer.writerow({
            'name': name, 'brand': brand, 'original_page': original,
            'suggested_official_page': chosen,
            'page_http_status': status, 'page_title': title,
            'candidate_image_url': image,
            'google_search': search_url,
            'review_status': 'candidate_needs_visual_review' if image else 'no_image_found',
            'permission_status': 'not_checked',
        })
        print(f'[{i}/{len(rows)}] {name}: {"candidate" if image else "not found"}', flush=True)
        time.sleep(0.5)
print(f'\nSaved: {OUTPUT.name} ({len(rows)} products)')
print('No images downloaded, no database changes. Review image match and usage rights before importing.')
