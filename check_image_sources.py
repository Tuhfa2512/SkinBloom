import csv
import re
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / 'image_source_review.csv'
OUTPUT = ROOT / 'image_source_candidates.csv'
HEADERS = {'User-Agent': 'SkinBloom product-source-review/1.0 (contact site owner for reuse permission)'}

with SOURCE.open(encoding='utf-8-sig', newline='') as f:
    rows = list(csv.DictReader(f))

fields = list(rows[0].keys()) + ['http_status', 'candidate_image_url', 'check_note']
with OUTPUT.open('w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    for index, row in enumerate(rows, 1):
        url = (row.get('verified_page') or row.get('original_page') or '').strip()
        result = dict(row)
        result.update(http_status='', candidate_image_url='', check_note='')
        if not url.startswith(('https://', 'http://')):
            result['check_note'] = 'Invalid or missing product URL'
        else:
            try:
                response = requests.get(url, headers=HEADERS, timeout=15, allow_redirects=True)
                result['http_status'] = response.status_code
                if response.status_code == 200 and 'html' in response.headers.get('content-type', '').lower():
                    soup = BeautifulSoup(response.text, 'html.parser')
                    image = None
                    for attrs in ({'property':'og:image'}, {'name':'twitter:image'}, {'property':'og:image:secure_url'}):
                        tag = soup.find('meta', attrs=attrs)
                        if tag and tag.get('content'):
                            image = urljoin(response.url, tag['content'].strip())
                            break
                    if image and urlparse(image).scheme in ('http', 'https'):
                        result['candidate_image_url'] = image
                        result['check_note'] = 'Candidate only: confirm exact product, variant and image reuse permission'
                    else:
                        result['check_note'] = 'No social image metadata; manual source search required'
                else:
                    result['check_note'] = 'Page unavailable or not HTML; manual source search required'
            except requests.RequestException as exc:
                result['check_note'] = f'Request failed: {type(exc).__name__}'
        writer.writerow(result)
        print(f"[{index}/{len(rows)}] {row['name']}: {result['http_status'] or '-'} {'candidate' if result['candidate_image_url'] else 'manual review'}")
        time.sleep(0.3)

print(f'\nSaved: {OUTPUT.name}')
print('No product images downloaded; no MongoDB changes.')
