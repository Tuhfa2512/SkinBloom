"""SkinBloom one-run image candidate collector. Run from repo root.
Reads remaining_62_products.json, optional official_new_candidates.csv.
Outputs review CSV, contact sheet and preview images. Never changes DB/site.
"""
import csv, io, json, re, time, hashlib
from pathlib import Path
from urllib.parse import urlparse, urljoin
import requests
from bs4 import BeautifulSoup
from PIL import Image, ImageDraw

ROOT=Path.cwd()
OUT=ROOT/'real_image_candidates'/'master_batch'
OUT.mkdir(parents=True,exist_ok=True)
S=requests.Session(); S.headers.update({'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36'})
DONE={'cerave hydrating cleanser','cerave foaming facial cleanser','cerave moisturizing cream','cerave pm facial moisturizing lotion','bioré deep pore charcoal strips','black girl sunscreen spf 30','aztec secret indian healing clay'}
def norm(s): return re.sub(r'[^a-z0-9]+',' ',s.lower()).strip()
def slug(s): return re.sub(r'[^a-z0-9]+','-',norm(s)).strip('-')[:65]
def candidates_from_page(page):
    r=S.get(page,timeout=13); r.raise_for_status()
    soup=BeautifulSoup(r.text,'html.parser'); urls=[]
    for tag in soup.find_all(['meta','img','source']):
        for key in ('content','src','data-src','data-original','data-zoom-image','srcset','data-srcset'):
            val=tag.get(key)
            if not val: continue
            if key=='content' and tag.name=='meta' and 'image' not in (tag.get('property','')+' '+tag.get('name','')).lower(): continue
            if key.endswith('srcset'): val=val.split(',')[0].strip().split(' ')[0]
            if val.startswith(('data:','blob:')):continue
            u=urljoin(r.url,val)
            if u.startswith('http') and u not in urls:urls.append(u)
    return urls

def score(u,name):
    path=norm(urlparse(u).path)
    words=[x for x in norm(name).split() if len(x)>3 and x not in ('with','face','skin','cream','lotion','water')]
    score=sum(3 for x in words if x in path)
    if any(x in path for x in ('product','front','hero','packshot','main')):score+=2
    if any(x in path for x in ('logo','banner','sprite','icon','flag','social','footer','header')):score-=25
    return score

def save_image(url,name,index):
    try:
        r=S.get(url,timeout=13);r.raise_for_status()
        if len(r.content)>7_000_000:return None
        im=Image.open(io.BytesIO(r.content)); im.load()
        if min(im.size)<180 or max(im.size)/min(im.size)>3:return None
        dest=OUT/f'{index:02d}-{slug(name)}-{hashlib.sha1(url.encode()).hexdigest()[:7]}.jpg'
        if not dest.exists():im.convert('RGB').save(dest,'JPEG',quality=84)
        return str(dest.relative_to(ROOT))
    except (requests.RequestException,OSError,ValueError):return None

products=json.loads((ROOT/'remaining_62_products.json').read_text(encoding='utf-8-sig'))
if isinstance(products,dict):products=products['products']
products=[p for p in products if norm(p['name']) not in {norm(x) for x in DONE}]
extra={}
f=ROOT/'official_new_candidates.csv'
if f.exists():
    for row in csv.DictReader(f.open(encoding='utf-8-sig')):
        key=norm(row.get('product',''));u=row.get('image_url','')
        if u.startswith('http'):extra.setdefault(key,[]).append(u)
print('Processing',len(products),'products. NO database/site changes.',flush=True)
rows=[]
for i,p in enumerate(products,1):
    name=p['name']; original=p.get('source',''); urls=[]; notes=[]
    for k,values in extra.items():
        if k in norm(name) or norm(name) in k:urls.extend(values);notes.append('existing official CSV')
    try:urls.extend(candidates_from_page(original));notes.append('original page')
    except requests.RequestException:notes.append('original page blocked')
    # Search for alternate current brand page using Bing RSS; may be blocked too.
    try:
        host=(urlparse(original).hostname or '').removeprefix('www.')
        if host:
            r=S.get('https://www.bing.com/search',params={'q':f'"{name}" site:{host}','format':'rss'},timeout=12)
            if r.ok:
                from xml.etree import ElementTree as ET
                root=ET.fromstring(r.content)
                for item in root.findall('.//item')[:4]:
                    link=item.findtext('link','')
                    if urlparse(link).hostname and urlparse(link).hostname.endswith(host):
                        try:urls.extend(candidates_from_page(link));notes.append('current page');break
                        except requests.RequestException:pass
    except (requests.RequestException,ValueError,ET.ParseError):pass
    urls=list(dict.fromkeys(urls))
    urls=sorted(urls,key=lambda u:score(u,name),reverse=True)
    found=0
    for u in urls[:35]:
        if score(u,name)<1:continue
        preview=save_image(u,name,i)
        if preview:
            rows.append({'product':name,'image_url':u,'preview_file':preview,'status':'UNVERIFIED — check exact packaging and image rights'})
            found+=1
        if found>=3:break
    if not found:rows.append({'product':name,'image_url':'','preview_file':'','status':'NO CANDIDATE — '+', '.join(notes)})
    print(f'[{i}/{len(products)}] {name}: {found} candidates',flush=True)
    with (OUT/'review.csv').open('w',encoding='utf-8-sig',newline='') as h:
        w=csv.DictWriter(h,fieldnames=['product','image_url','preview_file','status']);w.writeheader();w.writerows(rows)
    time.sleep(.15)
valid=[r for r in rows if r['preview_file']]
if valid:
    W,H,C=350,370,3
    sheet=Image.new('RGB',(W*C,H*((len(valid)+C-1)//C)),'white');d=ImageDraw.Draw(sheet)
    for j,r in enumerate(valid):
        im=Image.open(ROOT/r['preview_file']).convert('RGB');im.thumbnail((325,290))
        x=(j%C)*W;y=(j//C)*H;sheet.paste(im,(x+(W-im.width)//2,y+5))
        d.text((x+8,y+305),r['product'][:46],fill='black')
        d.text((x+8,y+327),Path(r['preview_file']).name[:48],fill='black')
    sheet.save(OUT/'comparison.jpg',quality=88)
print('DONE:',len(valid),'candidate images for',len(products),'products')
print('REVIEW:',OUT/'review.csv')
print('SHEET:',OUT/'comparison.jpg' if valid else 'none')
print('No MongoDB or published product images changed.')
