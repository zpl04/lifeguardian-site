'use strict';
// No tracking, cookies or persistent visitor identifiers.
const root = document.documentElement;
const menu = document.querySelector('.menu-button');
const nav = document.querySelector('#primary-nav');
function closeMenu() { menu.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); }
menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open); });
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if(event.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); menu.focus(); } });
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
let userReduced = false;
const motionButton = document.querySelector('#motion-toggle');
const ownedAnimations = new Set();
const feedbackAnimations = new WeakMap();
const reducedMotion = () => userReduced || motionQuery.matches;
function animateSafely(element, frames, options) {
  if (reducedMotion() || !element.animate) return;
  try {
    const animation = element.animate(frames, options);
    ownedAnimations.add(animation);
    animation.finished.catch(() => {}).finally(() => ownedAnimations.delete(animation));
    return animation;
  } catch { /* Base styles are visible; an animation failure never hides content. */ }
}
function pulseFeedback(element) {
  feedbackAnimations.get(element)?.cancel();
  const animation = animateSafely(element, [{opacity:.55,transform:'translateY(6px)'},{opacity:1,transform:'none'}], {duration:230,easing:'ease-out'});
  if (animation) feedbackAnimations.set(element,animation);
}
function applyMotion() {
  const reduced = userReduced || motionQuery.matches;
  root.classList.toggle('reduce-motion', reduced);
  motionButton.setAttribute('aria-pressed', String(reduced));
  motionButton.textContent = reduced ? 'Reduced motion on' : 'Reduce motion';
  if (reduced) ownedAnimations.forEach(animation => animation.cancel());
}
motionButton.addEventListener('click', () => { userReduced = !userReduced; applyMotion(); });
motionQuery.addEventListener('change', applyMotion);
applyMotion();
const steps = [
  ['Begin with Protection Setup.', 'On first launch, read the introduction to monitoring, SMS, location, notifications and background reliability. Continue into the app when you understand what it needs.', 'No LifeGuardian account is required. Premium access is required to run protection and SOS. Available plans and any eligible trial are shown by Google Play.'],
  ['Choose the person you trust.', 'Open Settings and enter your emergency contact’s phone number. Check the number carefully and agree with that person how they should respond to an alert.', 'Configure sensitivity, inactivity timing and sleep hours for your routine. A contact number alone does not confirm that SMS delivery will succeed.', 'assets/contact-ui-480.webp', 'Real settings capture: emergency contact entry detail. Example number, not a support line.'],
  ['Understand each permission.', 'Review the app’s explanations for SMS, location, notifications and display over other apps. Grant the permissions needed for protection. You can manage them later in Android settings.', 'This release does not request background-location permission. Android 13+ notification prompts and other system screens vary by device and OS; follow the actual prompt on your phone. Location and SMS availability are still subject to Android and carrier restrictions.', 'assets/android-overlay-480.webp', 'Real Android overlay-permission example from an earlier installation. Exact menus and app version may differ. Other permission prompts are not illustrated here.'],
  ['Give protection a fair chance to run.', 'Review the app’s background-reliability guidance and your manufacturer’s battery or auto-start settings. Keep its foreground notification available and avoid force-stopping protection.', 'There is no universal settings path across Samsung, Pixel and other Android brands. System power saving and unused-app restrictions can interrupt monitoring. Check again after OS changes or a reboot.', 'assets/android-background-480.webp', 'Real Android app-info example from an earlier installation, with existing annotations. This is not a universal settings path or a current-version screen.'],
  ['Start—and check—protection.', 'From the home screen, start protection after setting your contact, permissions and Premium access. Confirm the active status and foreground notification on your phone.', 'After changing monitoring settings, stop and restart protection. After rebooting or force-stopping, reopen LifeGuardian and confirm protection is active. Never assume a stopped app is still guarding.', 'assets/main-ui-480.webp', 'Existing real home-screen capture. Check the active status in your installed version.']
];
document.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => {
  const index = Number(button.dataset.step), step = steps[index];
  document.querySelectorAll('[data-step]').forEach(item => { const active = item === button; item.classList.toggle('active', active); item.setAttribute('aria-expanded', String(active)); });
  document.querySelector('#step-counter').textContent = `0${index + 1} / 05`;
  document.querySelector('#step-title').textContent = step[0];
  document.querySelector('#step-description').textContent = step[1];
  document.querySelector('#step-detail').textContent = step[2];
  const figure = document.querySelector('#step-figure'); figure.hidden = !step[3];
  if (step[3]) { const image = document.querySelector('#step-image'); image.src = step[3]; image.alt = step[4]; document.querySelector('#step-caption').textContent = step[4]; }
  const panel = document.querySelector('#setup-panel');
  feedbackAnimations.get(panel)?.cancel();
  const animation = animateSafely(panel,[{opacity:.3,transform:'translateY(14px)'},{opacity:1,transform:'none'}],{duration:440,easing:'cubic-bezier(.2,.8,.2,1)'});
  if(animation) feedbackAnimations.set(panel,animation);
}));
const fall = document.querySelector('#fall-range');
fall.addEventListener('input', () => {
  const value = Number(fall.value);
  document.querySelector('#fall-value').textContent = `${value} m/s²`;
  const result = document.querySelector('#fall-explanation');
  result.querySelector('strong').textContent = value < 25 ? 'More sensitive' : value < 35 ? 'A middle threshold' : 'More conservative';
  result.querySelector('p').textContent = value < 25 ? 'A lower impact can pass this part of the check. This may catch gentler events, but ordinary movement may produce more false alarms.' : value < 35 ? 'This is between the lower and higher thresholds. The preceding low-acceleration and rotation checks are still required; there is no guaranteed “safe” value.' : 'A higher impact is needed to pass this part of the check. It may reduce false alarms, but can miss gentler falls.';
  pulseFeedback(result);
});
const inactivity = document.querySelector('#inactivity-range');
inactivity.addEventListener('input', () => {
  const value = Number(inactivity.value);
  document.querySelector('#inactivity-value').textContent = `${value} ${value === 1 ? 'minute' : 'minutes'}`;
  const result = document.querySelector('#inactivity-explanation');
  result.querySelector('strong').textContent = value < 30 ? 'An earlier check-in' : value > 120 ? 'More time between check-ins' : 'A routine-aware interval';
  result.querySelector('p').textContent = value < 30 ? `After ${value} ${value === 1 ? 'minute' : 'minutes'} without qualifying activity, an eligible locked phone can start the 30-second warning. Earlier checks can mean more false alarms.` : value > 120 ? `Up to ${value} minutes can pass before an eligible inactivity warning begins. This may reduce false alerts, but also delays a potential alert.` : 'Consider how often you normally move or unlock your phone. A shorter interval checks sooner, but can produce more false alerts.';
  pulseFeedback(result);
});
function updateSleep() {
  const startValue = document.querySelector('#sleep-start').value, endValue = document.querySelector('#sleep-end').value;
  if (!startValue || !endValue) { document.querySelector('#sleep-explanation').textContent = 'Enter both local times to explore the sleep pause.'; return; }
  const minutes = value => Number(value.slice(0,2)) * 60 + Number(value.slice(3));
  const start = minutes(startValue), end = minutes(endValue), track = document.querySelector('#day-track');
  const segments = track.querySelectorAll('.sleep-segment');
  segments.forEach(span => {span.style.width='0%';});
  let segmentIndex=0;
  const segment = (a,b) => { if (a === b) return; const span = segments[segmentIndex++]; span.style.left = `${a/1440*100}%`; span.style.width = `${(b-a)/1440*100}%`; };
  if (start < end) segment(start,end); else if (start > end) { segment(0,end); segment(start,1440); }
  const length = (end-start+1440)%1440;
  const duration = `${Math.floor(length/60) ? `${Math.floor(length/60)} hours` : ''}${length%60 ? ` ${length%60} minutes` : ''}`.trim();
  document.querySelector('#sleep-explanation').textContent = start === end ? 'Identical start and end times: no sleep pause. This is not a 24-hour pause.' : `Inactivity alerts pause from ${startValue} to ${endValue}${start > end ? ', crossing midnight' : ''} (${duration}). Fall detection and SOS are not paused by this setting.`;
  document.querySelector('#sleep-start-range').value = String(start);
  document.querySelector('#sleep-end-range').value = String(end);
  pulseFeedback(document.querySelector('#sleep-explanation'));
}
document.querySelectorAll('.time-fields input').forEach(input => input.addEventListener('input', updateSleep));
const sleepDragControls = document.createElement('div');
sleepDragControls.className='sleep-drag-controls';
[['sleep-start-range','Adjust pause time','sleep-start',1380],['sleep-end-range','Adjust resume time','sleep-end',420]].forEach(([id,labelText,fieldId,value]) => {
  const label=document.createElement('label'); label.htmlFor=id; label.textContent=labelText;
  const input=document.createElement('input'); input.type='range'; input.id=id; input.min='0'; input.max='1439'; input.step='1'; input.value=String(value); input.setAttribute('aria-describedby','sleep-explanation');
  input.addEventListener('input',()=>{ const minutes=Number(input.value); document.querySelector('#'+fieldId).value=`${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`; updateSleep(); });
  sleepDragControls.append(label,input);
});
document.querySelector('.time-fields').after(sleepDragControls);
const video = document.querySelector('#product-film'), filmButton = document.querySelector('#film-toggle');
// Until the user opts in, this is only a visual poster—not an unavailable player.
video.controls = false;
video.setAttribute('aria-hidden', 'true');
filmButton.addEventListener('click', async () => {
  video.controls = true;
  video.removeAttribute('aria-hidden');
  if (!video.getAttribute('src')) video.src = video.dataset.src;
  if (video.paused) { try { await video.play(); } catch { filmButton.textContent = 'Try playback again or use the video controls'; } }
  else video.pause();
});
video.addEventListener('play', () => { filmButton.textContent = 'Pause video Ⅱ'; });
video.addEventListener('pause', () => { filmButton.textContent = video.ended ? 'Replay the film ↻' : 'Continue the film ▶'; });
video.addEventListener('error', () => { filmButton.textContent = 'Video unavailable—try reloading the page'; });
const dialog = document.querySelector('#screen-dialog');
const originalCaptures = {'assets/main-ui-900.webp':'assets/originals/main-ui.png','assets/sms-ui-900.webp':'assets/originals/sms-ui.png'};
document.querySelectorAll('[data-image]').forEach(button => button.addEventListener('click', () => {
  document.querySelector('#screen-dialog-title').textContent = button.dataset.title;
  const source=originalCaptures[button.dataset.image]||button.dataset.image;
  const image = document.querySelector('#dialog-image'); image.src = source; image.alt = button.querySelector('img').alt;
  document.querySelector('#full-screen-image').href = source;
  dialog.showModal();
}));
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());

// One-shot entry choreography: visible base content, no persistent opacity:0 class.
document.querySelectorAll('.hero-copy>*').forEach((element,index)=>{ element.dataset.reveal=index===1?'hero-title':'text'; element.dataset.delay=String(index*85); });
document.querySelector('.hero-image').dataset.reveal='scene';
document.querySelectorAll('.story-copy').forEach(group=>[...group.children].forEach((element,index)=>{
  element.dataset.delay=String(Math.min(index*90,450));
}));
document.querySelectorAll('.ui-exhibit').forEach(stage=>{
  stage.removeAttribute('data-reveal');
  stage.querySelector('.phone-capture').dataset.reveal='phone';
});
document.querySelectorAll('.reveal').forEach(group=>{
  group.classList.remove('reveal','from-left','from-right');
  if(group.children.length>1) [...group.children].forEach((element,index)=>{element.dataset.reveal='text';element.dataset.delay=String(Math.min(index*100,350));});
  else group.dataset.reveal='text';
});
let entrySequence=0;
if ('IntersectionObserver' in window) {
  const observer=new IntersectionObserver(entries=>{
    entries.filter(entry=>entry.isIntersecting).forEach(entry=>{
      const element=entry.target;
      observer.unobserve(element);
      if(element.dataset.revealed) return;
      element.dataset.revealed='true';
      element.dataset.revealSequence=String(++entrySequence);
      element.dataset.revealAt=String(Math.round(performance.now()));
      const kind=element.dataset.reveal;
      const phone=kind==='phone', scene=kind==='scene';
      const offset=phone?(element.closest('.mirror')?-52:52):0;
      const duration=scene?850:phone?820:720;
      const delay=phone?200:Number(element.dataset.delay|| (kind==='text'?130:0));
      element.dataset.motionDuration=String(duration);
      element.dataset.motionDelay=String(delay);
      animateSafely(element,[
        {opacity:0,transform:`translate3d(${offset}px,${scene?36:phone?0:24}px,0)`,filter:scene?'blur(2px)':'blur(0px)'},
        {opacity:1,transform:'none',filter:'blur(0px)'}
      ],{duration,delay,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'});
    });
  },{threshold:.1,rootMargin:'0px 0px -18px 0px'});
  document.querySelectorAll('[data-reveal]').forEach(element=>observer.observe(element));
}

// Scroll position feedback, not a timer or a continuous animation loop.
let progressScheduled=false;
function updateReadingProgress(){
  const extent=document.documentElement.scrollHeight-innerHeight;
  const progress=extent>0?Math.min(1,Math.max(0,scrollY/extent)):0;
  document.querySelector('#reading-progress').style.transform=`scaleX(${progress})`;
  progressScheduled=false;
}
addEventListener('scroll',()=>{if(!progressScheduled){progressScheduled=true;requestAnimationFrame(updateReadingProgress);}}, {passive:true});
addEventListener('resize',updateReadingProgress);
updateReadingProgress();
