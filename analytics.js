(() => {
  'use strict';
  const id = 'G-C91W80LP88';
  const key = 'lifeguardian.website.analytics.v1';
  const disabled = 'ga-disable-' + id;
  const prefix = 'lgsite';
  const panel = document.querySelector('#analytics-choice');
  if (!panel) return;
  const preferences = document.querySelector('#analytics-preferences');
  const status = document.querySelector('#analytics-status');
  let loaded = false;
  let choice = null;
  const remember = value => {
    try { localStorage.setItem(key, value); return localStorage.getItem(key) === value; }
    catch { return false; }
  };
  const stored = () => {
    try { return localStorage.getItem(key); } catch { return null; }
  };
  window[disabled] = true;

  // Only registered campaign tokens are forwarded; never send arbitrary queries or hashes.
  const campaigns = {
    utm_source: ['ageinplacetech'],
    utm_medium: ['referral'],
    utm_campaign: ['press_release_20261119']
  };
  const page = new URL(location.pathname, location.origin);
  const incoming = new URLSearchParams(location.search);
  // The Google runtime can derive its own URL despite an explicit page_location.
  // Fail closed on unregistered query strings or fragment text.
  let eligible = !location.hash;
  const seen = new Set();
  for (const [name, value] of incoming) {
    if (seen.has(name) || !Object.hasOwn(campaigns, name) || !campaigns[name].includes(value)) eligible = false;
    seen.add(name);
  }
  for (const [name, allowed] of Object.entries(campaigns)) {
    if (allowed.includes(incoming.get(name))) page.searchParams.set(name, incoming.get(name));
  }
  let referrer = '';
  try {
    const from = new URL(document.referrer);
    if (!/^https?:$/.test(from.protocol) || from.username || from.password ||
        from.hash || (from.origin !== location.origin && (from.pathname !== '/' || from.search))) {
      eligible = false;
    } else if (from.origin === location.origin && (from.search ||
        !['/', '/lifeguardian-site/', '/lifeguardian-site/index.html', '/lifeguardian-site/privacy.html'].includes(from.pathname))) {
      eligible = false;
    } else referrer = from.origin + '/';
  } catch { /* no referrer */ }
  const context = {
    page_location: page.href, page_referrer: referrer,
    page_title: page.pathname.endsWith('/privacy.html') ? 'LifeGuardian Privacy Policy' : 'LifeGuardian Website'
  };
  const tag = function () { window.dataLayer.push(arguments); };
  function start() {
    if (!eligible) return;
    window[disabled] = false;
    if (loaded) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = tag;
    const ads = {ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'};
    tag('consent', 'default', {...ads, analytics_storage: 'denied'});
    tag('consent', 'update', {...ads, analytics_storage: 'granted'});
    tag('js', new Date());
    tag('config', id, {
      ...context, send_page_view: true, allow_google_signals: false,
      allow_ad_personalization_signals: false, cookie_prefix: prefix,
      cookie_domain: 'none', cookie_path: '/lifeguardian-site/',
      cookie_flags: 'SameSite=Lax;Secure'
    });
    const script = document.createElement('script');
    script.async = true;
    script.referrerPolicy = 'no-referrer';
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.append(script);
  }
  function clearCookies() {
    const names = new Set([prefix + '_ga', prefix + '_ga_' + id.slice(2)]);
    for (const item of document.cookie.split(';')) {
      const name = item.split('=')[0].trim();
      if (/^lgsite_ga(?:_[A-Z0-9]+)?$/.test(name)) names.add(name);
    }
    for (const name of names) {
      for (const path of ['/lifeguardian-site/', '/lifeguardian-site', '/']) {
        document.cookie = name + '=; Max-Age=0; Path=' + path + '; SameSite=Lax; Secure';
      }
    }
  }
  function sync() {
    choice = stored();
    if (choice === 'accepted') start();
    else {
      window[disabled] = true;
      clearCookies();
      // A loaded third-party runtime cannot be unloaded reliably in place.
      // Replace the document after disabling it, without sending consent pings.
      if (loaded) location.reload();
    }
    panel.hidden = choice === 'accepted' || choice === 'rejected';
    preferences.setAttribute('aria-expanded', String(!panel.hidden));
  }
  function choose(value) {
    if (value === 'rejected') {
      window[disabled] = true;
      clearCookies();
    }
    const saved = remember(value);
    if (!saved) {
      window[disabled] = true;
      choice = null;
      status.textContent = 'Your browser could not save this choice. Analytics is off.';
      return;
    }
    sync();
    preferences.focus();
  }
  panel.querySelector('[data-analytics-accept]').addEventListener('click', () => choose('accepted'));
  panel.querySelector('[data-analytics-reject]').addEventListener('click', () => choose('rejected'));
  preferences.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    preferences.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) panel.querySelector('button').focus();
  });
  document.addEventListener('click', event => {
    if (choice !== 'accepted' || stored() !== 'accepted' || window[disabled] || !loaded) return;
    const anchor = event.target.closest?.('a[href]');
    if (!anchor) return;
    const url = new URL(anchor.href);
    if (url.origin !== 'https://play.google.com' || url.pathname !== '/store/apps/details' ||
        url.searchParams.get('id') !== 'com.zplstudio.lifeguardian') return;
    tag('event', 'google_play_download_click', {...context, send_to: id});
  });
  window.addEventListener('storage', event => { if (event.key === key || event.key === null) sync(); });
  window.addEventListener('pageshow', sync);
  sync();
})();
