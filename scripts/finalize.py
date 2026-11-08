from pathlib import Path
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]; path=ROOT/'public/index.html';s=BeautifulSoup(path.read_text(encoding='utf-8'),'html.parser')
# Preserve remaining slider photos in usable galleries without the old runtime.
for old in s.select('rs-module-wrap'):
    ul=s.new_tag('ul',attrs={'class':'feature-gallery','aria-label':'Photography gallery'})
    for img in old.select('rs-slide > img'):
        li=s.new_tag('li');a=s.new_tag('a',href=img['src'],attrs={'class':'gallery-link','aria-label':'Enlarge '+img.get('alt','photograph')});img.attrs.pop('style',None);img['class']=[];a.append(img);li.append(a);ul.append(li)
    old.replace_with(ul)
for x in s.select('rs-fullwidth-wrap'):x.unwrap()
for a in s.select('a'):
    if 'Contact Now' in a.get_text():a['href']='#contact'
    if not a.get_text(strip=True) and a.get('href','').startswith('https://'):
        for domain,label in [('facebook.com','Facebook'),('instagram.com','Instagram'),('houzz.com','Houzz')]:
            if domain in a['href']:a['aria-label']=label
for h in s.select('h5'):
    if not h.get_text(strip=True):h.decompose()
for x in s.select('iframe'):
    if x.get('data-src'):x['src']=x['data-src'];del x['data-src']
    x['src']=x.get('src','').replace('http:','https:')
for a in s.select('#MastheadSidebar-2 p'):
    text=a.get_text()
    if '417-448-4362' in text:
        a.clear();a.append(BeautifulSoup('Phone: <a href="tel:+14174484362">417-448-4362</a>','html.parser'))
    if 'OmerDavidian@gmail.com' in text:
        a.clear();a.append(BeautifulSoup('Email: <a href="mailto:omerdavidian@gmail.com">OmerDavidian@gmail.com</a>','html.parser'))
for t in s.find_all(string=lambda t:t and 'Copyright © 2025' in t):t.replace_with(t.replace('2025','2026'))
path.write_text(str(s),encoding='utf-8')
