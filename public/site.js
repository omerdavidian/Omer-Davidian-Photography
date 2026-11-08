const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
function measurePage(){
  const root=document.documentElement;
  const sidebar=$('#masthead');
  const contentStart=matchMedia('(min-width:768px)').matches?Math.ceil(sidebar.getBoundingClientRect().right)+36:0;
  root.style.setProperty('--page-width',`${root.clientWidth}px`);
  root.style.setProperty('--content-start',`${contentStart}px`);
  root.style.setProperty('--content-half',`${contentStart/2}px`);
}
measurePage();window.addEventListener('resize',measurePage,{passive:true});
const menu=$('#menu-toggle');
menu.addEventListener('click',()=>{const open=$('#masthead').classList.toggle('menu-open');menu.setAttribute('aria-expanded',String(open));});
$$('#MainNav a').forEach(a=>a.addEventListener('click',()=>{$('#masthead').classList.remove('menu-open');menu.setAttribute('aria-expanded','false');}));
// Keep semantic section links and legacy bookmarks, without fragments in the bar.
function scrollToSection(id, smooth=true){
  const target=document.getElementById(id);if(!target)return false;
  target.scrollIntoView({behavior:smooth&&!matchMedia('(prefers-reduced-motion: reduce)').matches?'smooth':'instant',block:'start'});
  if(location.hash)history.replaceState(history.state,'',location.pathname+location.search);
  return true;
}
document.addEventListener('click',event=>{
  const link=event.target.closest('a[href^="#"]');
  if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const id=decodeURIComponent(link.getAttribute('href').slice(1));
  if(document.getElementById(id)){event.preventDefault();scrollToSection(id);}
});
if(location.hash){const id=decodeURIComponent(location.hash.slice(1));scrollToSection(id,false);window.addEventListener('load',()=>scrollToSection(id,false),{once:true});}
const dialog=$('#lightbox');let group=[],current=0;

function showPhoto(){const link=group[current];$('#lightbox img').src=link.href;$('#lightbox img').alt=link.querySelector('img').alt;$('#lightbox figcaption').textContent=`${link.querySelector('img').title || link.querySelector('img').alt} · ${current+1} / ${group.length}`;}
$$('a[data-lightbox],a[data-rel*="prettyPhoto"],.gallery-link').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();group=$$('a',link.closest('.photo-grid')||link.parentElement.parentElement).filter(a=>/\.(jpg|jpeg|png|webp)$/i.test(a.href));if(!group.includes(link))group=[link];current=group.indexOf(link);showPhoto();dialog.showModal();}));
$('.lightbox-close').addEventListener('click',()=>dialog.close());
function movePhoto(delta){current=(current+delta+group.length)%group.length;showPhoto();}
$('.lightbox-prev').addEventListener('click',()=>movePhoto(-1));$('.lightbox-next').addEventListener('click',()=>movePhoto(1));
dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft')movePhoto(-1);if(event.key==='ArrowRight')movePhoto(1);});
// Upgrade the existing before/after images to an accessible native range control.
const pair=$$('[id^="wb_before_after_"]');
pair.forEach(container=>{
  const images=$$('img',container);if(images.length!==2)return;
  const row=container.closest('.vc_row');row?.classList.remove('hidden-phone');row?.classList.add('comparison-row');
  container.className='comparison';
  const stage=document.createElement('div');stage.className='comparison-stage';
  images[0].className='before-image';images[1].className='after-image';
  stage.append(...images);
  for(const [className,text] of [['before','Before'],['after','After']]){
    const label=document.createElement('span');label.className=`comparison-label ${className}`;label.textContent=text;stage.append(label);
  }
  const divider=document.createElement('div');divider.className='comparison-divider';divider.setAttribute('aria-hidden','true');
  const handle=document.createElement('span');handle.textContent='↔';divider.append(handle);stage.append(divider);
  const range=document.createElement('input');range.className='comparison-range';range.type='range';range.min=0;range.max=100;range.value=50;
  range.setAttribute('aria-label','Before and after image comparison');
  const reveal=()=>{stage.style.setProperty('--reveal',`${range.value}%`);range.setAttribute('aria-valuetext',`${range.value}% before, ${100-Number(range.value)}% after`);};
  range.addEventListener('input',reveal);reveal();stage.append(range);
  const moveDivider=event=>{const bounds=stage.getBoundingClientRect();range.value=Math.max(0,Math.min(100,Math.round((event.clientX-bounds.left)/bounds.width*100)));reveal();};
  stage.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();range.focus({preventScroll:true});stage.setPointerCapture(event.pointerId);moveDivider(event);});
  stage.addEventListener('pointermove',event=>{if(stage.hasPointerCapture(event.pointerId))moveDivider(event);});
  stage.addEventListener('pointerup',event=>{if(stage.hasPointerCapture(event.pointerId))stage.releasePointerCapture(event.pointerId);});
  const caption=document.createElement('p');caption.className='comparison-caption';caption.textContent='Drag the divider to compare before and after';
  container.replaceChildren(stage,caption);
});
const form=$('#contact-form'),status=$('#form-status');let widget,configuration;
async function configure(){try{const response=await fetch('/api/config');if(!response.ok)throw Error();configuration=await response.json();if(!configuration.ready){status.textContent='Online inquiries are being configured. Please email or call using the details below.';return;}const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.onload=()=>{widget=window.turnstile.render('#captcha',{sitekey:configuration.siteKey,action:'contact'});};document.head.append(script);}catch{status.textContent='Please email or call if the form is unavailable.';}}
configure();
form.addEventListener('submit',async event=>{event.preventDefault();status.className='';if(!form.reportValidity())return;const data=Object.fromEntries(new FormData(form));if(!configuration?.ready){status.textContent='Online inquiries are being configured. Please email omerdavidian@gmail.com.';return;}if(!data['cf-turnstile-response']){status.textContent='Please complete the spam protection check.';return;}const button=$('button[type="submit"]',form);button.disabled=true;status.textContent='Sending your inquiry…';try{const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const result=await response.json();if(!response.ok)throw Error(result.message||'Unable to send. Please email or call.');status.className='success';status.textContent=result.message;form.reset();}catch(error){status.className='error';status.textContent=error.message;}finally{button.disabled=false;if(window.turnstile&&widget!==undefined)window.turnstile.reset(widget);}});
