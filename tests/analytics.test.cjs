const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const code=fs.readFileSync(new URL('../analytics.js', 'file:'+__filename),'utf8');
const pref='lifeguardian.website.analytics.v1';
function browser(storage=new Map(), href='https://zpl04.github.io/lifeguardian-site/?utm_source=ageinplacetech',
    referrer='https://example.org/') {
  const scripts=[], handlers={}, cookies=[];
  let reloads=0;
  const location=new URL(href);
  location.reload=()=>reloads++;
  function el(name) {return {addEventListener(type,fn){handlers[name+type]=fn;},setAttribute(){},focus(){}};}
  const panel=el('panel');
  panel.querySelector=sel=>el(sel);
  const doc={...el('doc'),querySelector:sel=>sel==='#analytics-choice'?panel:el(sel),
    referrer,createElement:()=>({}),
    head:{append:s=>scripts.push(s.src)},get cookie(){return 'lgsite_ga=existing';},set cookie(x){cookies.push(x);}};
  const window=el('win');
  vm.runInNewContext(code,{window,document:doc,location,URL,URLSearchParams,
    localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}});
  return {scripts,handlers,window,cookies,storage,reloads:()=>reloads,
    events:()=>Array.from(window.dataLayer||[]).filter(x=>x[0]==='event').map(x=>x[1]),
    click:href=>handlers.docclick({target:{closest:()=>({href})}})};
}
const play='https://play.google.com/store/apps/details?id=com.zplstudio.lifeguardian';
test('default and persistent rejection never insert the Google script',()=>{
  const b=browser();
  b.click(play);
  assert.equal(b.scripts.length,0);
  b.handlers['[data-analytics-reject]click']();
  assert.equal(b.storage.get(pref),'rejected');
  assert.equal(browser(b.storage).scripts.length,0);
});
test('accept sends one sanitized view and only the intended Play event',()=>{
  const b=browser();
  b.handlers['[data-analytics-accept]click']();
  b.handlers.winpageshow();
  b.click(play.replace('lifeguardian','another'));
  b.click(play);
  assert.equal(b.scripts.length,1);
  assert.deepEqual(b.events(),['google_play_download_click']);
  const configs=b.window.dataLayer.filter(x=>x[0]==='config');
  assert.equal(configs.length,1);
  const args=configs[0][2];
  assert.equal(args.send_page_view,true);
  assert.equal(args.page_location,'https://zpl04.github.io/lifeguardian-site/?utm_source=ageinplacetech');
  assert.equal(args.page_referrer,'https://example.org/');
});
test('withdrawal disables the loaded tag before reload and suppresses later clicks',()=>{
  const b=browser(new Map([[pref,'accepted']]));
  b.handlers['[data-analytics-reject]click']();
  b.click(play);
  assert.equal(b.window['ga-disable-G-C91W80LP88'],true);
  assert.deepEqual(b.events(),[]);
  assert.equal(b.reloads(),1);
  assert.ok(b.cookies.some(x=>x.startsWith('lgsite_ga=; Max-Age=0')));
  assert.equal(browser(b.storage).scripts.length,0);
});
test('unknown queries and detailed external referrers block the tag even with consent',()=>{
  const accepted=new Map([[pref,'accepted']]);
  assert.equal(browser(accepted,'https://zpl04.github.io/lifeguardian-site/?email=test').scripts.length,0);
  assert.equal(browser(accepted,'https://zpl04.github.io/lifeguardian-site/#private').scripts.length,0);
  assert.equal(browser(accepted,undefined,'https://example.org/private?q=secret').scripts.length,0);
});
