/* ============================================================
   TARANG.OS — drone flight controller
   Launch on ready · fly with scroll · tilt with velocity ·
   lock onto each section with a boost + shockwave.
   ============================================================ */
(function () {
  'use strict';

  const drone = document.getElementById('drone');
  const tether = document.getElementById('tether');
  const labelMain = document.getElementById('droneMain');
  if (!drone || !tether) return;

  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // travel band within the viewport (drone appears to fly down the page)
  const TOP_MIN = 0.16;   // 16vh
  const TOP_MAX = 0.80;   // 80vh
  const X_BASE  = 0.87;   // 87vw resting lane (right gutter)
  const X_SWAY  = 0.03;   // drifts ±3vw

  let curTop = TOP_MIN, tgtTop = TOP_MIN;
  let curX = X_BASE, tgtX = X_BASE;
  let tilt = 0, tgtTilt = 0;
  let launched = false, scale = 0.4;
  let lastScrollY = window.scrollY;

  // responsive lane + size: tuck tighter to the edge on narrower screens
  function lane() { return window.innerWidth > 1300 ? 0.88 : 0.93; }
  function maxScale() { return window.innerWidth > 1300 ? 1 : 0.82; }

  function docProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  }

  // --- scroll: set targets + velocity tilt ---
  let vel = 0;
  function onScroll() {
    const y = window.scrollY;
    vel = y - lastScrollY;
    lastScrollY = y;
    const p = docProgress();
    tgtTop = TOP_MIN + (TOP_MAX - TOP_MIN) * p;
    // gentle horizontal sway following progress
    tgtX = lane() + Math.sin(p * Math.PI * 3) * X_SWAY;
    // tilt: lean into the direction of travel (clamped)
    tgtTilt = Math.max(-22, Math.min(22, vel * 0.9));
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  // --- animation loop ---
  function frame() {
    // ease toward targets
    curTop += (tgtTop - curTop) * 0.08;
    curX += (tgtX - curX) * 0.06;
    tilt += (tgtTilt - tilt) * 0.12;
    tgtTilt *= 0.86; // decay tilt back to level
    if (launched && scale < 1) scale += (1 - scale) * 0.1;
    const sc = Math.min(scale, maxScale());

    const px = curX * window.innerWidth;
    const py = curTop * window.innerHeight;
    drone.style.left = px + 'px';
    drone.style.top = py + 'px';
    drone.style.transform =
      'translate(-50%,-50%) rotate(' + tilt.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';

    // tether connects top of screen to the craft
    tether.style.left = px + 'px';
    tether.style.height = Math.max(0, py - 40) + 'px';
    tether.style.transform = 'rotate(' + (tilt * 0.18).toFixed(2) + 'deg)';

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // --- launch sequence (fired when boot completes) ---
  function launch() {
    if (launched) return;
    launched = true;
    drone.classList.add('launched');
    // start below view and rocket up into the travel band
    curTop = 1.18; tgtTop = TOP_MIN;
    boost(900);
    setTimeout(onScroll, 50);
  }

  let boostTimer = null;
  function boost(ms) {
    drone.classList.add('boosting');
    clearTimeout(boostTimer);
    boostTimer = setTimeout(() => drone.classList.remove('boosting'), ms || 520);
    fireShock();
  }

  function fireShock() {
    if (reduced) return;
    const s = document.createElement('span');
    s.className = 'shockwave fire';
    drone.appendChild(s);
    setTimeout(() => s.remove(), 720);
  }

  // --- section lock-on: update label + boost + ping header ---
  const SEC_NAMES = {
    hero: 'OPERATOR', experience: 'DEPLOYMENT LOG', projects: 'MISSION ARCHIVE',
    skills: 'CAPABILITIES', education: 'TRAINING REC', achievements: 'COMMENDATIONS',
    contact: 'COMMS UPLINK'
  };
  let activeSec = null;
  const secs = Object.keys(SEC_NAMES).map((id) => document.getElementById(id)).filter(Boolean);
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting && en.target.id !== activeSec) {
        activeSec = en.target.id;
        if (labelMain) labelMain.textContent = SEC_NAMES[activeSec] || 'SCANNING';
        if (launched) boost(520);
        const head = en.target.querySelector('.sec-head');
        if (head) {
          head.classList.remove('locked'); void head.offsetWidth; head.classList.add('locked');
        }
      }
    });
  }, { threshold: 0.45 });
  secs.forEach((s) => obs.observe(s));

  // --- hook into boot completion ---
  window.addEventListener('tarang:ready', launch);
  // fallback: if boot already gone, launch shortly
  if (!document.body.classList.contains('booting')) {
    setTimeout(launch, 300);
  }
})();
