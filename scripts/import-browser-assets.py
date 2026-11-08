from pathlib import Path
from urllib.parse import urljoin,urlsplit
from urllib.request import urlopen,Request
import json,hashlib,re
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'public'
manifest=json.loads(Path(r'C:\Users\Omer\AppData\Local\Temp/browser-use/assets/5a436359-4ef4-4e6c-be91-fc6dd5ce5bd6/manifest.json').read_text())
print(type(manifest).__name__)
assets=manifest['assets']
report=json.loads((ROOT/'migration/assets.json').read_text()); mapping=report['assets']; raw={a['url']:Path(a['path']).read_bytes() for a in assets}
done=set()
def local(url):
    if url not in mapping: mapping[url]='/assets/'+hashlib.sha256(url.encode()).hexdigest()[:16]+(Path(urlsplit(url).path).suffix or '.css')
    return mapping[url]
def fetch(url):
    path=local(url); dest=OUT/path.lstrip('/')
    if url in done:return path
    done.add(url)
    try:
        data=raw.get(url)
        if data is None:
            with urlopen(Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=15) as response:data=response.read()
        if dest.suffix=='.css':
            text=data.decode('utf-8')
            def sub(m):
                u=m.group(1).strip(' \"\'')
                if u.startswith(('data:','#')):return m.group(0)
                return 'url("'+fetch(urljoin(url,u))+'")'
            text=re.sub(r'url\(([^)]+)\)',sub,text)
            text=re.sub(r'@import\s+[\"\']([^\"\']+)[\"\']',lambda m:'@import url("'+fetch(urljoin(url,m.group(1)))+'")',text)
            data=text.encode()
        dest.write_bytes(data)
    except Exception as e:
        print('Unavailable optional asset:',url,str(e));dest.write_bytes(b'')
    return path
for url in raw:fetch(url)
report['assets']=mapping;report['failures']=[x for x in report['failures'] if not (OUT/local(x['url']).lstrip('/')).exists()]
(ROOT/'migration/assets.json').write_text(json.dumps(report,indent=2))
