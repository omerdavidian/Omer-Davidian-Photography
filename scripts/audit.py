"""Check shipped HTML and recursively referenced assets without network access."""
from pathlib import Path
from bs4 import BeautifulSoup
import re,json
root=Path(__file__).resolve().parents[1]/'public';s=BeautifulSoup((root/'index.html').read_text(encoding='utf-8'),'html.parser')
missing=[];seen=set()
def visit(url):
    url=url.split('#')[0].split('?')[0]
    if not url.startswith('/') or url in seen:return
    seen.add(url);p=root/url.lstrip('/')
    if p.is_dir():p=p/'index.html'
    if not p.is_file():missing.append(url);return
    if p.suffix=='.css':
        for value in re.findall(r'url\([\"\']?([^\)\"\']+)',p.read_text(encoding='utf-8')):visit(value)
for e in s.select('[src],[href]'):
    visit(e.get('src') or e.get('href'))
for e in s.select('[style],style'):
    for u in re.findall(r'url\([\"\']?([^\)\"\']+)',e.get('style',e.get_text())):visit(u)
assert not s.select('script:not([src]),rs-module,form[action*=wp-admin]'),'Old runtime remains'
assert all(e.get('src','').startswith('/') for e in s.select('img[src]')),'Nonlocal image'
assert len(s.select('.section-banner'))==7
assert len(s.select('.feature-gallery'))==5
print(json.dumps({'referenced_assets':len(seen),'images':len(s.select('img')),'missing':missing},indent=2))
assert not missing
