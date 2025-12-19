
# -*- coding: utf-8 -*-
import os, json, fitz
from PIL import Image

ROOT = os.path.dirname(__file__) + '/../'
ASSETS = os.path.join(ROOT, 'assets')
PDF = os.path.join(ROOT, '../2025年12月04日11時25分21秒.pdf')
PROBLEMS = os.path.join(ROOT, 'problems.json')

# Load overrides
ov_path = os.path.join(ROOT, 'overrides.json')
if not os.path.exists(ov_path):
    print('overrides.json が見つかりません。tools/override.html で作成し、数学アプリ/ に配置してください。')
    exit(1)
with open(ov_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

overrides = { item['page']: item for item in data.get('overrides', []) }
if not overrides:
    print('overrides が空です。')
    exit(1)

# Helper: render page image
DPI = 200
_doc = fitz.open(PDF)

for page_idx, ov in overrides.items():
    page = _doc[page_idx-1]
    pix = page.get_pixmap(dpi=DPI)
    img = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
    left, top, right, bottom = ov['bbox']
    margin = int(ov.get('margin', 12))
    q_img = img.crop((left, top, right, bottom))
    s_img = img.crop((0, bottom + margin, img.size[0], img.size[1]))
    q_png = os.path.join(ASSETS, f'q_{page_idx:03d}.png')
    s_png = os.path.join(ASSETS, f's_{page_idx:03d}.png')
    q_img.save(q_png)
    s_img.save(s_png)
    print(f'page {page_idx:03d}: updated by overrides')

_doc.close()

# Update problems.json detect_status
with open(PROBLEMS, 'r', encoding='utf-8') as f:
    problems = json.load(f)
for p in problems:
    # extract page from filename q_###.png
    q = p.get('question_img','')
    try:
        page_idx = int(os.path.basename(q)[2:5])
    except:
        page_idx = None
    if page_idx in overrides:
        p['detect_status'] = 'override'
with open(PROBLEMS, 'w', encoding='utf-8') as f:
    json.dump(problems, f, ensure_ascii=False, indent=2)

print('problems.json を更新しました。')
