#!/usr/bin/env python3
"""Search and preview real product photo candidates; never touch database or existing images."""
import csv, io, json, re, sys, time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from PIL import Image, ImageOps, ImageDraw

ROOT = Path.cwd()
INPUT = ROOT / 'skinbloom_pending_sources.json'
OUT = ROOT / 'real_image_candidates' / 'search_53'
OUT.mkdir(parents=True, exist_ok=True)
if not INPUT.exists():
    sys.exit('Missing skinbloom_pending_sources.json in repository root.')
items = json.loads(INPUT.read_text(encoding='utf-8'))
try:
    from ddgs import DDGS
except ImportError:
    sys.exit('Missing ddgs package. Run: python -m pip install ddgs')

session = requests.Session()
session.headers.update({'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36'})

def get_images(name):
    try:
        with DDGS(timeout=12) as engine:
            return list(engine.images(query=f'"{name}" product bottle jar tube packaging white background', max_results=12, safesearch='moderate'))
    except Exception as exc:
        return [{'error': str(exc)[:100]}]

def fetch_candidate(url):
    try:
        res = session.get(url, timeout=12, stream=True)
        res.raise_for_status()
        data = bytearray()
        for chunk in res.iter_content(32768):
            data.extend(chunk)
            if len(data) > 6_000_000: return None
        image = Image.open(io.BytesIO(data))
        image.load()
        if min(image.size) < 180: return None
        return ImageOps.exif_transpose(image).convert('RGB')
    except Exception:
        return None

def process(idx, item):
    name = item['name']
    results = get_images(name)
    saved = []
    for entry in results:
        url = entry.get('image') or entry.get('thumbnail')
        if not url or not url.startswith('http'): continue
        im = fetch_candidate(url)
        if im is None: continue
        file = f'{idx:02d}_{len(saved)+1}.jpg'
        im.thumbnail((900, 900))
        im.save(OUT / file, quality=86)
        saved.append((name, file, url, entry.get('url',''), 'REVIEW_REQUIRED'))
        if len(saved) == 3: break
    return idx, name, saved, results[0].get('error', '') if results else ''

print(f'Searching {len(items)} products. No MongoDB or existing image changes.', flush=True)
all_rows=[]
with ThreadPoolExecutor(max_workers=4) as pool:
    futures = [pool.submit(process, i, item) for i,item in enumerate(items,1)]
    for f in as_completed(futures):
        idx, name, saved, error = f.result()
        print(f'[{idx}/{len(items)}] {name}: {len(saved)} candidates' + (f' ({error})' if error else ''), flush=True)
        all_rows.extend(saved or [(name,'','','','NO_CANDIDATE')])

with (OUT/'review.csv').open('w', newline='', encoding='utf-8-sig') as f:
    writer=csv.writer(f)
    writer.writerow(['name','filename','image_url','source_page','status'])
    writer.writerows(all_rows)

# Contact sheets: one sheet per 12 products, three image columns per product.
by_name = {item['name']: [] for item in items}
for name, file, *_ in all_rows:
    if file: by_name[name].append(file)
for start in range(0,len(items),12):
    batch=items[start:start+12]
    sheet=Image.new('RGB',(1050,len(batch)*250),'white')
    draw=ImageDraw.Draw(sheet)
    for row,item in enumerate(batch):
        name=item['name']; y=row*250
        draw.text((12,y+8),f'{start+row+1}. {name[:67]}',fill='black')
        for col,file in enumerate(by_name[name][:3]):
            im=Image.open(OUT/file)
            im.thumbnail((300,200))
            sheet.paste(im,(12+col*345+(300-im.width)//2,y+38))
            draw.text((12+col*345,y+236),file,fill='black')
    sheet.save(OUT/f'comparison_{start//12+1}.jpg',quality=83)

print('\nDONE')
print('Products with candidates:',sum(bool(by_name[n]) for n in by_name),'/',len(items))
print('Total candidate photos:',sum(len(v) for v in by_name.values()))
print('Review CSV:',OUT/'review.csv')
print('Comparison sheets:',len(list(OUT.glob('comparison_*.jpg'))))
print('Existing product images and MongoDB unchanged.')
