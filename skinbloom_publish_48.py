#!/usr/bin/env python3
"""SkinBloom: safe image asset staging from selected_manifest.csv.
Default dry-run. --apply copies missing assets and generates DB mapping CSV.
Does NOT change MongoDB, commit or push Git. Existing images are never overwritten.
"""
import argparse,csv,re,shutil,unicodedata
from pathlib import Path

ROOT=Path(__file__).resolve().parent
if not (ROOT/'client').exists() and Path('/workspaces/SkinBloom/client').exists():
    ROOT=Path('/workspaces/SkinBloom')
SOURCE=ROOT/'real_image_candidates/selected_for_final_review'
DEST=ROOT/'client/public/products'

def slug(s):
    s=unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode('ascii').lower()
    return re.sub(r'-+','-',re.sub(r'[^a-z0-9]+','-',s)).strip('-')

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--apply',action='store_true',help='Copy missing images, generate mapping')
    args=ap.parse_args()
    manifest=SOURCE/'selected_manifest.csv'
    if not manifest.exists():
        raise SystemExit(f'Cannot find manifest: {manifest}')
    with manifest.open(encoding='utf-8-sig',newline='') as f: rows=list(csv.DictReader(f))
    if len(rows)!=48 or len({r['name'] for r in rows})!=48:
        raise SystemExit('Safety stop: expected exactly 48 unique products')
    plan=[]
    for r in rows:
        src=ROOT/r['staged_file']
        if not src.is_file():raise SystemExit(f'Missing staged image: {src}')
        if src.resolve().parent!=SOURCE.resolve():raise SystemExit(f'Unexpected source path: {src}')
        filename=slug(r['name'])+'.jpg'
        dst=DEST/filename
        plan.append((r,src,dst))
    if len({str(x[2]) for x in plan})!=48:raise SystemExit('Safety stop: filename collision')
    print('Root:',ROOT)
    print('Products:',len(plan))
    print('Existing target files (SKIP):',sum(dst.exists() for _,_,dst in plan))
    print('New files:',sum(not dst.exists() for _,_,dst in plan))
    print('Mode:','APPLY' if args.apply else 'DRY RUN')
    if not args.apply:
        print('No changes made. Run python skinbloom_publish_48.py --apply to copy.')
        return
    DEST.mkdir(parents=True,exist_ok=True)
    copied=0
    for r,src,dst in plan:
        if dst.exists():continue
        # Exclusive creation guarantees no overwrite even if a file appears mid-run.
        with src.open('rb') as inp, dst.open('xb') as out:shutil.copyfileobj(inp,out)
        copied+=1
    mapping=ROOT/'skinbloom_image_publish_mapping.csv'
    with mapping.open('w',encoding='utf-8',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=['product_name','filename','public_path','image_url','status','source_page'])
        writer.writeheader()
        for r,src,dst in plan:
            writer.writerow({'product_name':r['name'],'filename':dst.name,'public_path':'/products/'+dst.name,'image_url':'https://skin-bloom.vercel.app/products/'+dst.name,'status':'ASSET_COPIED_DB_NOT_UPDATED','source_page':r['source_page']})
    print('Copied:',copied,'Skipped existing:',len(plan)-copied)
    print('Mapping:',mapping)
    print('MongoDB NOT updated. Git NOT changed. Images require Git add -f before Vercel deployment.')

if __name__=='__main__':main()
