"""Stage visually preselected SkinBloom images; never touches existing images or MongoDB."""
import csv, json, shutil, re
from pathlib import Path

ROOT = Path('/workspaces/SkinBloom') if Path('/workspaces/SkinBloom').exists() else Path.cwd()
SOURCE = ROOT / 'real_image_candidates' / 'search_53'
DEST = ROOT / 'real_image_candidates' / 'selected_for_final_review'
DEST.mkdir(parents=True, exist_ok=True)
# Visually inspected against the five comparison sheets supplied in chat.
CHOICES = {
 1:1,2:3,3:2,4:1,6:1,7:1,8:1,9:2,10:2,11:3,12:2,
 13:1,14:3,15:2,16:1,17:2,18:1,19:1,20:1,21:1,22:2,
 23:2,24:2,25:2,26:2,27:1,28:3,29:2,30:1,31:2,
 33:3,34:2,35:1,36:2,37:2,38:1,39:2,
 41:2,42:3,43:3,44:1,45:1,46:2,47:1,48:2,
 50:1,51:1,52:1
}
RECHECK = {5:'All three are football images',32:'All three are unrelated skincare products',40:'Effaclar Duo regional/formula variant ambiguous',49:'All three are other brands',53:'Original B5 vs B5+ packaging ambiguity'}
review = SOURCE / 'review.csv'
if not review.exists():
    raise SystemExit(f'Missing {review}; nothing changed.')
with review.open(encoding='utf-8-sig',newline='') as f:
    records = list(csv.DictReader(f))
byfile = {r['filename']:r for r in records}
rows=[]; staged=0; missing=[]
for number, candidate in sorted(CHOICES.items()):
    filename=f'{number:02d}_{candidate}.jpg'
    item=byfile.get(filename)
    src=SOURCE/filename
    if not item or not src.is_file():
        missing.append(filename)
        continue
    dst=DEST/filename
    shutil.copy2(src,dst)
    rows.append({'name':item['name'],'candidate':filename,'image_url':item['image_url'],'source_page':item['source_page'],'staged_file':str(dst.relative_to(ROOT)),'status':'PRESELECTED_NEEDS_FINAL_CHECK'})
    staged+=1
with (DEST/'selected_manifest.csv').open('w',encoding='utf-8',newline='') as f:
    w=csv.DictWriter(f,fieldnames=['name','candidate','image_url','source_page','staged_file','status'])
    w.writeheader();w.writerows(rows)
with (DEST/'needs_new_sources.txt').open('w',encoding='utf-8') as f:
    for n,reason in sorted(RECHECK.items()):
        name=byfile.get(f'{n:02d}_1.jpg',{}).get('name','Unknown')
        f.write(f'{n:02d}. {name}: {reason}\n')
print('DONE')
print('Preselected image files staged:',staged)
print('Need new sources / exact variant checks:',len(RECHECK))
print('Missing candidate files:',missing)
print('Manifest:',DEST/'selected_manifest.csv')
print('Unresolved:',DEST/'needs_new_sources.txt')
print('No client/public/products, Git, or MongoDB changes.')
