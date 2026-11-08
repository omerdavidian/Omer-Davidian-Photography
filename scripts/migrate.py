"""Reproducible public-site migration. Never downloads WordPress scripts or secrets."""
from bs4 import BeautifulSoup, Comment
from pathlib import Path
from urllib.parse import urljoin, urlsplit
from urllib.request import Request, urlopen
from concurrent.futures import ThreadPoolExecutor
import hashlib, json, re

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public'; OUT.mkdir(exist_ok=True)
ASSETS=OUT/'assets'; ASSETS.mkdir(exist_ok=True)
s=BeautifulSoup((ROOT/'migration/original.html').read_text(encoding='utf-8'),'html.parser')
mapping={}; failures=[]
def local(url):
    url=urljoin('https://omerdavidian.com/',url)
    if not url.startswith('https://'): return url
    if url not in mapping:
        ext=Path(urlsplit(url).path).suffix or '.css'
        mapping[url]='/assets/'+hashlib.sha256(url.encode()).hexdigest()[:16]+ext
    return mapping[url]
def css_urls(text,base='https://omerdavidian.com/'):
    def sub(m):
        u=m.group(1).strip(' \"\'')
        if u.startswith(('data:','#')): return m.group(0)
        return 'url("'+local(urljoin(base,u))+'")'
    return re.sub(r'url\(([^)]+)\)',sub,text)

# Keep theme typography and layout, discard plugin runtime and admin metadata.
for x in list(s.select('script,noscript,link,meta,style')):
    if x.name=='link' and 'stylesheet' in x.get('rel',[]):
        href=x.get('href','')
        if any(a in href for a in ['js_composer.min.css','/parallelus-vellum/','fonts.googleapis.com']):
            x['href']=local(href); continue
    if x.name=='style' and not x.get('id') and ('vc_custom_' in x.text or 'body.boxed' in x.text):
        x.string=css_urls(x.text); continue
    if x.name=='meta' and x.get('name') in ['description','viewport']: continue
    x.decompose()
for x in s.find_all(string=lambda t:isinstance(t,Comment)): x.extract()
for x in s.select('#FadeInContent,body > .hidden,#BackToTop,.ubermenu-responsive-toggle'):
    x.decompose()
for x in s.find_all(True):
    for a in list(x.attrs):
        if a.startswith('on'): del x[a]
    if x.has_attr('style'): x['style']=css_urls(x['style'])
    if x.name=='a':
        href=x.get('href','')
        if href.rstrip('/')=='https://omerdavidian.com': x['href']='#page'
        elif '/wp-content/uploads/' in href: x['href']=local(href)
        if x.get('target')=='_blank': x['rel']='noopener noreferrer'
    if x.name=='img':
        src=x.get('data-src') or x.get('data-lazyload') or x.get('src','')
        if src and not src.startswith('data:'): x['src']=local(src)
        x['loading']='lazy'; x['decoding']='async'
        for a in ['srcset','sizes','data-src','data-srcset','data-lazyload']: x.attrs.pop(a,None)
        x['class']=[c for c in x.get('class',[]) if c!='lazy']
    if x.name=='iframe': x['loading']='lazy'; x['title']='Interactive virtual property tour'; x['referrerpolicy']='strict-origin-when-cross-origin'

# Native carousel replaces Revolution Slider, retaining all five original photos.
old=s.select_one('rs-module-wrap')
hero=s.new_tag('section',attrs={'class':'hero','aria-label':'Photography portfolio'})
labels=['Real Estate','Weddings','Events','Portraits','Custom Made Prints']
links=['realestate','weddings','events','portraits','prints']
for i,slide in enumerate(old.select('rs-slide')):
    figure=s.new_tag('figure',attrs={'class':'hero-slide','data-slide':str(i)})
    if i: figure['hidden']=''
    image=slide.find('img'); image['loading']='eager' if i==0 else 'lazy'
    image['alt']=labels[i]+' photography by Omer Davidian'
    if i==0: image['fetchpriority']='high'
    figure.append(image)
    cap=s.new_tag('figcaption'); a=s.new_tag('a',href='#'+links[i]); a.string=labels[i]; cap.append(a); figure.append(cap); hero.append(figure)
controls=BeautifulSoup('<div class="hero-controls"><button type="button" data-hero="prev" aria-label="Previous photograph">&#8592;</button><span id="slide-count" aria-live="polite">1 / 5</span><button type="button" data-hero="next" aria-label="Next photograph">&#8594;</button></div>','html.parser')
hero.append(controls); old.replace_with(hero)
for x in s.select('rs-fullwidth-wrap'): x.unwrap()

for x in s.select('.wpb_image_grid_ul'):
    x['class']=['photo-grid']
    for a in x.select('a'):
        a['class']=['gallery-link']; a['aria-label']='Enlarge '+a.img.get('title',a.img.get('alt','photograph'))
for x in s.select('[class*=wpb_animate]'):
    x['class']=[c for c in x.get('class',[]) if 'animate' not in c and c not in ['fadeIn','wpb_fadeIn']]
form=s.select_one('#wpforms-46516')
form.replace_with(BeautifulSoup('''<form id="contact-form" action="/api/contact" method="post">
<div class="name-fields"><label>First name *<input name="firstName" autocomplete="given-name" required maxlength="80"></label><label>Last name<input name="lastName" autocomplete="family-name" maxlength="80"></label></div>
<label>Phone<input name="phone" type="tel" autocomplete="tel" maxlength="40"></label>
<label>Email *<input name="email" type="email" autocomplete="email" required maxlength="254"></label>
<label>Photography service<select name="service"><option>General inquiry</option><option>Real Estate</option><option>Weddings</option><option>Events</option><option>Portraits</option><option>Prints</option></select></label>
<label>Comment or Message *<textarea name="message" rows="6" required minlength="10" maxlength="5000"></textarea></label>
<div class="honeypot" aria-hidden="true"><label>Leave this empty<input name="website" tabindex="-1" autocomplete="off"></label></div>
<p class="form-note">Your details are used only to respond to your inquiry. <a href="/privacy/">Privacy notice</a>.</p>
<div id="captcha"></div><button type="submit">Submit</button><p id="form-status" role="status" aria-live="polite"></p>
<p>You can also <a href="mailto:omerdavidian@gmail.com">email</a> or <a href="tel:+14174484362">call 417-448-4362</a>.</p></form>''','html.parser'))
for x in s.select('[class*=twentytwenty]'): x.attrs.pop('style',None)
# Remove only obsolete form heading and loading overlays.
for x in s.select('.wpforms-container,.wpforms-head-container'): x.decompose()
for x in s.select('.fa'): x['aria-hidden']='true'
s.html['lang']='en'
for key,value in [('charset','utf-8')]: s.head.insert(0,s.new_tag('meta',attrs={key:value}))
s.head.append(s.new_tag('link',rel='canonical',href='https://omerdavidian.com/'))
s.head.append(s.new_tag('link',rel='stylesheet',href='/site.css'))
s.head.append(s.new_tag('script',src='/site.js',defer=''))
skip=s.new_tag('a',href='#content',attrs={'class':'skip-link'}); skip.string='Skip to content'; s.body.insert(0,skip)
menu=s.new_tag('button',attrs={'id':'menu-toggle','type':'button','aria-expanded':'false','aria-controls':'MainNav'}); menu.string='Menu'; s.select_one('#masthead').insert(0,menu)
s.body.append(BeautifulSoup('<dialog id="lightbox" aria-label="Photograph viewer"><button type="button" class="lightbox-close" aria-label="Close photograph">&#215;</button><button type="button" class="lightbox-prev" aria-label="Previous photograph">&#8592;</button><figure><img alt=""><figcaption></figcaption></figure><button type="button" class="lightbox-next" aria-label="Next photograph">&#8594;</button></dialog>','html.parser'))
(OUT/'index.html').write_text(str(s),encoding='utf-8')

# Recursively vendor CSS fonts and image dependencies. Bounded concurrent downloads.
done=set()
def download(item):
    url,path=item; dest=OUT/path.lstrip('/')
    try:
        if dest.exists(): data=dest.read_bytes()
        else:
            fetch_url=url.split('?')[0] if 'omerdavidian.com' in url else url
            with urlopen(Request(fetch_url,headers={'User-Agent':'Mozilla/5.0','Referer':'https://omerdavidian.com/'}),timeout=45) as r: data=r.read()
            dest.write_bytes(data)
        if dest.suffix=='.css': return url,path,data.decode('utf-8',errors='replace')
    except Exception as e: failures.append({'url':url,'error':str(e)})
    return None
while pending:=[(u,p) for u,p in mapping.items() if u not in done]:
    done.update(u for u,p in pending)
    with ThreadPoolExecutor(max_workers=12) as pool: results=list(pool.map(download,pending))
    for result in results:
        if result:
            url,path,css=result; css=css_urls(css,url)
            # Resolve theme imports as local stylesheets as well.
            css=re.sub(r'@import\s+[\"\']([^\"\']+)[\"\']',lambda m:'@import url("'+local(urljoin(url,m.group(1)))+'")',css)
            (OUT/path.lstrip('/')).write_text(css,encoding='utf-8')
(ROOT/'migration/assets.json').write_text(json.dumps({'assets':mapping,'failures':failures},indent=2),encoding='utf-8')
print(f'Migrated {len(mapping)} assets; {len(failures)} failures')
