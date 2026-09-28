const button=document.querySelector('.menu');
const nav=document.querySelector('#nav');

button?.addEventListener('click',()=>{const open=nav.classList.toggle('open');button.setAttribute('aria-expanded',String(open))});
document.querySelectorAll('.nav-group>button').forEach(trigger=>trigger.addEventListener('click',event=>{event.stopPropagation();const group=trigger.parentElement;document.querySelectorAll('.nav-group.open').forEach(item=>{if(item!==group){item.classList.remove('open');item.querySelector('button')?.setAttribute('aria-expanded','false')}});const open=group.classList.toggle('open');trigger.setAttribute('aria-expanded',String(open))}));
document.addEventListener('click',event=>{if(!event.target.closest('.nav-group'))document.querySelectorAll('.nav-group.open').forEach(item=>{item.classList.remove('open');item.querySelector('button')?.setAttribute('aria-expanded','false')})});
document.addEventListener('keydown',event=>{
  if(event.key!=='Escape') return;
  document.querySelectorAll('.nav-group.open').forEach(item=>{item.classList.remove('open');item.querySelector('button')?.setAttribute('aria-expanded','false')});
  if(nav?.classList.contains('open')){nav.classList.remove('open');button?.setAttribute('aria-expanded','false');button?.focus()}
});

const pageName=(location.pathname.split('/').filter(Boolean).pop()||'index').replace(/\.html$/,'');
if(pageName!=='index'){
  const h1=document.querySelector('h1')?.textContent?.trim();
  const description=document.querySelector('meta[name="description"]')?.content;
  const serviceMap={
    'patent-services':'Patent drafting, prosecution, SEP analysis, claim chart, infringement and licensing services',
    'trademark-services':'Trademark search, registration, prosecution and opposition services',
    'international-patent-support':'US, EP, PCT and international patent support',
    'technology-sectors':'Technology-focused patent services',
    'additional-ip-services':'Copyright, industrial design, geographical indication, semiconductor layout-design and trade-secret services',
    'legal-business-services':'Legal advisory, immigration, incorporation, incubation and intellectual-property training services'
  };
  const graph=[{
    '@type':'BreadcrumbList','itemListElement':[
      {'@type':'ListItem','position':1,'name':'Home','item':'https://www.prasaip.com/'},
      {'@type':'ListItem','position':2,'name':h1||document.title,'item':document.querySelector('link[rel="canonical"]')?.href||location.href}
    ]
  }];
  const hasServiceSchema=[...document.querySelectorAll('script[type="application/ld+json"]')].some(script=>/"@type"\s*:\s*"Service"/.test(script.textContent));
  if(serviceMap[pageName]&&!hasServiceSchema) graph.push({'@type':'Service','name':serviceMap[pageName],'description':description,'url':document.querySelector('link[rel="canonical"]')?.href||location.href,'provider':{'@type':'LegalService','name':'PRASA IP','url':'https://www.prasaip.com/','telephone':'+91-9113214395'},'areaServed':['India','United States','Europe','International']});
  const structured=document.createElement('script');structured.type='application/ld+json';structured.textContent=JSON.stringify({'@context':'https://schema.org','@graph':graph});document.head.appendChild(structured);
}

// Measure contact intent without treating a click as a completed enquiry.
document.addEventListener('click',event=>{
  const link=event.target.closest('a[href^="mailto:"],a[href^="tel:"]');
  if(!link||typeof window.gtag!=='function') return;
  const method=link.protocol==='mailto:'?'email':'phone';
  window.gtag('event','contact_click',{contact_method:method,page_location:location.href});
});

// Calm, progressive motion as content enters the viewport.
// Content remains fully visible when JavaScript is unavailable or reduced motion is preferred.
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!reduceMotion&&'IntersectionObserver' in window){
  document.documentElement.classList.add('motion-ready');

  const revealGroups=[
    '.section-intro','.process-title','.seo-intro','.faq-heading','.recognition>div',
    '.cards article','.steps article','.service-list article','.testimonial-grid blockquote',
    '.founder-grid article','.experience-strip>div','.recognition-items>article',
    '.page-cards article','.evidence-grid article','.timeline article','.sector-grid article','.awards-grid article',
    '.blog-card','.key-points','.author-card','.technology-photo','.details>div',
    '.article>h2','.article>h3','.page-footer-cta'
  ];

  const elements=[...document.querySelectorAll(revealGroups.join(','))];
  document.querySelectorAll('.profile-grid').forEach((profile,index)=>{
    profile.classList.add(index%2===0?'reveal-left':'reveal-right');
    elements.push(profile);
  });

  const siblingCounts=new Map();
  elements.forEach(element=>{
    element.classList.add('reveal-on-scroll');
    const parent=element.parentElement;
    const position=siblingCounts.get(parent)||0;
    element.style.setProperty('--reveal-delay',`${Math.min(position,5)*70}ms`);
    siblingCounts.set(parent,position+1);
  });

  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },{threshold:.12,rootMargin:'0px 0px -7%'});

  elements.forEach(element=>observer.observe(element));
}
