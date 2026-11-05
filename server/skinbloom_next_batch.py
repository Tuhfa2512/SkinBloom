"""SkinBloom review-only product image discovery.
Run from project root: python skinbloom_next_batch.py
Needs: pip install requests beautifulsoup4 pillow
Never writes MongoDB or website product images.
"""
import csv
import io
import json
import re
import time
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlparse, urljoin, urlencode

import requests
from bs4 import BeautifulSoup
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
SOURCE_JSON = ROOT / 'remaining_62_products.json'
OLD_REPORT = ROOT / 'real_image_candidates' / 'batch_review.csv'
OUT = ROOT / 'real_image_candidates' / 'next_batch'
OUT.mkdir(parents=True, exist_ok=True)
REPORT = OUT / 'review.csv'
DONE = {'cerave hydrating cleanser', 'cerave foaming facial cleanser',
        'black girl sunscreen spf 30', 'cerave moisturizing cream',
        'cerave pm facial moisturizing lotion', 'bioré deep pore charcoal strips'}
HEADERS = {'User-Agent': 'Mozilla/5.0 (compatible; SkinBloomEducationalProductResearch/1.0)'}
SESSION = requests.Session()
SESSION.headers.update(HEADERS)

def norm(s):
    return re.sub(r'[^a-z0-9]+', ' ', str(s).lower()).strip()

def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', norm(s)).strip('-')[:85]

def get_products():
    if SOURCE_JSON.exists():
        data = json.loads(SOURCE_JSON.read_text(encoding='utf-8-sig'))
        if isinstance(data, dict):
            data = data.get('products', [])
        return [(p.get('name', ''), p.get('source', '')) for p in data]
    if OLD_REPORT.exists():
        with OLD_REPORT.open(encoding='utf-8-sig', newline='') as f:
            return [(r['name'], r['source_page']) for r in csv.DictReader(f)]
    raise FileNotFoundError('Need remaining_62_products.json or real_image_candidates/batch_review.csv')

def discover_page(name, source):
    """Try Bing public RSS search for a current page on the original brand domain."""
    host = urlparse(source).hostname or ''
    if not host:
        return None, 'missing original domain'
    host = host.removeprefix('www.')
    q = f'"{name}" site:{host}'
    try:
        r = SESSION.get('https://www.bing.com/search', params={'q': q, 'format': 'rss'}, timeout=18)
        r.raise_for_status()
        root = ET.fromstring(r.content)
        for item in root.findall('.//item')[:8]:
            link = (item.findtext('link') or '').strip()
            parsed = urlparse(link)
            if parsed.scheme not in ('http', 'https'):
                continue
            domain = (parsed.hostname or '').removeprefix('www.')
            if domain == host or domain.endswith('.' + host):
                return link, 'search result; verify product match'
        return None, 'no matching official-domain search result'
    except (requests.RequestException, ET.ParseError) as e:
        return None, f'search unavailable: {type(e).__name__}'

def collect_urls(soup, page):
    found = []
    def add(v):
        if not isinstance(v, str) or not v.strip() or v.startswith('data:'):
            return
        u = urljoin(page, v.strip())
        if urlparse(u).scheme in ('http', 'https') and u not in found:
            found.append(u)
    for meta in soup.find_all('meta'):
        k = (meta.get('property') or meta.get('name') or '').lower()
        if k in ('og:image', 'twitter:image', 'twitter:image:src'):
            add(meta.get('content'))
    for script in soup.find_all('script', type='application/ld+json'):
        try:
            data = json.loads(script.string or script.get_text())
        except (ValueError, TypeError):
            continue
        def walk(x):
            if isinstance(x, list):
                for y in x: walk(y)
            elif isinstance(x, dict):
                types = x.get('@type', [])
                if types == 'Product' or (isinstance(types, list) and 'Product' in types):
                    imgs = x.get('image', [])
                    for y in imgs if isinstance(imgs, list) else [imgs]:
                        if isinstance(y, str): add(y)
                        elif isinstance(y, dict): add(y.get('url') or y.get('contentUrl'))
                for y in x.values():
                    if isinstance(y, (dict, list)): walk(y)
        walk(data)
    for img in soup.find_all('img'):
        for attr in ('src', 'data-src', 'data-original', 'data-zoom-image'):
            add(img.get(attr))
        for attr in ('srcset', 'data-srcset'):
            for item in (img.get(attr) or '').split(','):
                if item.strip(): add(item.strip().split()[0])
    return found

def score(url, name):
    path = norm(urlparse(url).path)
    tokens = [x for x in norm(name).split() if len(x) > 3 and x not in ('with', 'face', 'skin', 'cream', 'lotion')]
    result = sum(2 for x in tokens if x in path)
    if any(x in path for x in ('front', 'product', 'packshot', 'main', 'hero')): result += 2
    if any(x in path for x in ('logo', 'banner', 'icon', 'sprite', 'flag', 'social', 'privacy')): result -= 20
    return result

def fetch_candidates(page, name, index):
    r = SESSION.get(page, timeout=18)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, 'html.parser')
    title = soup.title.get_text(' ', strip=True) if soup.title else ''
    urls = sorted(collect_urls(soup, r.url), key=lambda x: score(x, name), reverse=True)
    results = []
    for url in urls[:16]:
        if score(url, name) < 1: continue
        try:
            ir = SESSION.get(url, timeout=14)
            ir.raise_for_status()
            if len(ir.content) > 6_000_000: continue
            im = Image.open(io.BytesIO(ir.content))
            if min(im.size) < 230: continue
            if max(im.size) / min(im.size) > 2.5: continue
            target = OUT / f'{index:02d}-{slug(name)}-{len(results)+1}.jpg'
            if not target.exists():
                im.convert('RGB').save(target, 'JPEG', quality=87)
            results.append((url, str(target.relative_to(ROOT))))
            if len(results) >= 2: break
        except (requests.RequestException, OSError, ValueError):
            pass
    return title, results

def contact_sheet(rows):
    valid = [r for r in rows if r['preview_file'] and (ROOT / r['preview_file']).exists()]
    if not valid: return None
    w, h, cols = 330, 365, 3
    sheet = Image.new('RGB', (w*cols, h*((len(valid)+cols-1)//cols)), 'white')
    draw = ImageDraw.Draw(sheet)
    for i, row in enumerate(valid):
        img = Image.open(ROOT / row['preview_file']).convert('RGB')
        img.thumbnail((300, 290))
        x, y = (i % cols)*w, (i // cols)*h
        sheet.paste(img, (x+(w-img.width)//2, y+5))
        draw.text((x+8, y+302), row['name'][:44], fill='black')
        draw.text((x+8, y+323), Path(row['preview_file']).name[-42:], fill='black')
    target = OUT / 'comparison.jpg'
    sheet.save(target, quality=87)
    return target

def main():
    products = get_products()
    pending = [(n, s) for n, s in products if norm(n) not in {norm(x) for x in DONE}]
    print(f'Found {len(pending)} pending products. Preview-only; no DB changes.', flush=True)
    rows = []
    for i, (name, original) in enumerate(pending, 1):
        page, search_note = discover_page(name, original)
        attempts = []
        if page: attempts.append((page, search_note))
        if original and original != page: attempts.append((original, 'original source page'))
        result = []
        status = search_note
        title = ''
        used = ''
        for candidate, note in attempts:
            try:
                title, result = fetch_candidates(candidate, name, i)
                used = candidate
                status = note if result else 'page opened; no usable image candidates'
                if result: break
            except requests.RequestException as e:
                status = f'page unavailable: {type(e).__name__}'
        if result:
            for url, filename in result:
                rows.append({'name': name, 'source_page': used, 'page_title': title,
                             'image_url': url, 'preview_file': filename,
                             'status': 'REVIEW IMAGE + USAGE RIGHTS; ' + status})
        else:
            rows.append({'name': name, 'source_page': used or original, 'page_title': title,
                         'image_url': '', 'preview_file': '', 'status': status})
        print(f'[{i}/{len(pending)}] {name}: {len(result)} preview(s) — {status}', flush=True)
        time.sleep(0.25)
        # Save incrementally so interrupted runs still have a report.
        with REPORT.open('w', encoding='utf-8-sig', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=['name','source_page','page_title','image_url','preview_file','status'])
            writer.writeheader(); writer.writerows(rows)
    sheet = contact_sheet(rows)
    print('\nReview CSV:', REPORT.relative_to(ROOT))
    print('Comparison image:', sheet.relative_to(ROOT) if sheet else 'none available')
    print('No existing website images or MongoDB records changed.')

if __name__ == '__main__':
    main()
