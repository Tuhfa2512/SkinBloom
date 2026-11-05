#!/usr/bin/env python3
"""Review-first bulk product image collector. Never writes to MongoDB or published images."""
import csv, io, json, re, sys, time
from pathlib import Path
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup
from PIL import Image, ImageDraw, ImageOps

ROOT = Path.cwd()
INPUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'skinbloom_approved_images.csv'
OUT = ROOT / 'real_image_candidates' / 'approved_batch'
OUT.mkdir(parents=True, exist_ok=True)
HEADERS = {'User-Agent':'Mozilla/5.0 (compatible; SkinBloomProductReview/1.0)'}
s = requests.Session(); s.headers.update(HEADERS)

def clean_url(u, base):
    if not isinstance(u, str) or not u.strip(): return ''
    u = u.strip().split(' ')[0]
    if u.startswith('//'): u = 'https:' + u
    if u.startswith('data:'): return ''
    u = urljoin(base, u)
    return u if urlparse(u).scheme in ('http','https') else ''

def get_image_urls(page, html):
    soup = BeautifulSoup(html, 'html.parser')
    candidates=[]
    def add(u, priority=0):
        u=clean_url(u,page)
        if u and u not in [x[1] for x in candidates]: candidates.append((priority,u))
    for m in soup.select('meta[property="og:image"],meta[name="twitter:image"],meta[property="product:image"]'):
        add(m.get('content'), 10)
    for el in soup.select('script[type="application/ld+json"]'):
        try: data=json.loads(el.string or el.get_text())
        except Exception: continue
        def walk(obj):
            if isinstance(obj,list):
                for x in obj: walk(x)
            elif isinstance(obj,dict):
                kind=obj.get('@type','')
                if kind=='Product' or (isinstance(kind,list) and 'Product' in kind):
                    im=obj.get('image',[])
                    for v in (im if isinstance(im,list) else [im]): add(v.get('url') if isinstance(v,dict) else v, 15)
                for v in obj.values():
                    if isinstance(v,(dict,list)): walk(v)
        walk(data)
    for img in soup.select('img'):
        for key in ('data-zoom-image','data-src','src'):
            add(img.get(key),0)
        if img.get('srcset'):
            add(img['srcset'].split(',')[-1].strip().split(' ')[0],0)
    return [u for _,u in sorted(candidates,key=lambda x:-x[0])]

def slug(x):
    return re.sub(r'[^a-z0-9]+','-',x.lower()).strip('-')[:75]

with INPUT.open(encoding='utf-8-sig',newline='') as f: rows=list(csv.DictReader(f))
print('Products in CSV:',len(rows),flush=True)
results=[]; tiles=[]
for i,row in enumerate(rows,1):
    name=(row.get('name') or '').strip(); url=(row.get('image_url') or '').strip()
    approved=(row.get('approved') or '').strip().lower()
    status=''; saved=''; actual=''; candidates=[]
    if not name or not url or approved not in ('yes','true','1','approved'):
        status='not approved / missing input'
    else:
        try:
            resp=s.get(url,timeout=18); resp.raise_for_status()
            typ=resp.headers.get('Content-Type','').lower()
            if 'image/' in typ: candidates=[url]
            elif 'html' in typ or resp.text.lstrip().startswith('<'):
                candidates=get_image_urls(resp.url,resp.text)
            else: status='unsupported response content type'
            for candidate in candidates[:8]:
                try:
                    r=s.get(candidate,timeout=12);r.raise_for_status()
                    if not r.headers.get('Content-Type','').lower().startswith('image/'):continue
                    if len(r.content)>12_000_000:continue
                    im=Image.open(io.BytesIO(r.content)); im.load()
                    if im.width<180 or im.height<180:continue
                    im=im.convert('RGB')
                    filename=f'{i:02d}-{slug(name)}.jpg'
                    path=OUT/filename
                    im.save(path,quality=90)
                    saved=str(path.relative_to(ROOT));actual=candidate
                    tiles.append((name,im.copy(),filename));status='CANDIDATE ONLY - VISUAL REVIEW REQUIRED'
                    break
                except (requests.RequestException,OSError,ValueError):continue
            if not saved and not status:status='no downloadable candidate (blocked or no suitable image)'
        except (requests.RequestException,ValueError) as e:
            status=f'page blocked/unavailable: {type(e).__name__}'
    results.append({'name':name,'source_url':url,'candidate_image_url':actual,'preview_file':saved,'review_status':status,'approved_for_database':'NO'})
    print(f'[{i}/{len(rows)}] {name}: {status}',flush=True)
with (OUT/'review.csv').open('w',newline='',encoding='utf-8-sig') as f:
    w=csv.DictWriter(f,fieldnames=list(results[0]));w.writeheader();w.writerows(results)
if tiles:
    W,H=300,355;cols=4;sheet=Image.new('RGB',(W*cols,H*((len(tiles)+cols-1)//cols)),'white');draw=ImageDraw.Draw(sheet)
    for j,(name,im,fn) in enumerate(tiles):
        x=(j%cols)*W;y=(j//cols)*H
        thumb=ImageOps.contain(im,(280,285))
        sheet.paste(thumb,(x+(W-thumb.width)//2,y+5))
        draw.text((x+8,y+295),name[:39],fill='black')
        draw.text((x+8,y+315),fn[:39],fill='black')
    sheet.save(OUT/'comparison.jpg',quality=90)
print('\nDONE',len(tiles),'previews from',len(rows),'products',flush=True)
print('Review:',OUT/'review.csv')
print('Comparison:',OUT/'comparison.jpg' if tiles else 'none')
print('No MongoDB records or existing product images changed.')
