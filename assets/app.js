/* ============================================================
   TARANG.OS — interface runtime
   ============================================================ */
(function () {
  'use strict';

  /* ---------- live clock (top bar) ---------- */
  const clock = document.getElementById('clock');
  function tick() {
    if (!clock) return;
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    clock.textContent = p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }
  tick(); setInterval(tick, 1000);

  /* ---------- boot sequence ---------- */
  const boot = document.getElementById('boot');
  const bootLines = document.getElementById('bootLines');
  const bootPf = document.getElementById('bootPf');
  const bootSkip = document.getElementById('bootSkip');

  const SEQ = [
    'BIOS check .................... <span class="ok">OK</span>',
    'Mounting TARANG.OS kernel ..... <span class="ok">OK</span>',
    'Loading operator profile ...... <span class="ok">TARANG SRIVAS</span>',
    'Embedded core // ESP32 ........ <span class="ok">ONLINE</span>',
    'FreeRTOS scheduler ............ <span class="ok">ACTIVE</span>',
    'Calibrating sensors I2C/SPI ... <span class="ok">OK</span>',
    'Optical tether uplink ......... <span class="ok">1.2 Gbps</span>',
    'Establishing telemetry link ... <span class="ok">STABLE</span>',
    'Decrypting mission archive .... <span class="dim">6 records</span>',
    'Render HUD ....................<span class="ok"> READY</span>',
  ];

  let finished = false;
  function finishBoot() {
    if (finished) return;
    finished = true;
    boot.style.opacity = '0';
    document.body.classList.remove('booting');
    setTimeout(() => { boot.style.display = 'none'; }, 650);
    startReveals();
    window.dispatchEvent(new Event('tarang:ready'));
  }

  function runBoot() {
    if (sessionStorage.getItem('booted') === '1' || prefersReduced()) {
      // skip immediately on repeat visits / reduced motion
      boot.style.display = 'none';
      document.body.classList.remove('booting');
      startReveals();
      window.dispatchEvent(new Event('tarang:ready'));
      return;
    }
    let i = 0;
    const total = SEQ.length;
    const step = () => {
      if (i >= total) {
        bootPf.style.width = '100%';
        setTimeout(finishBoot, 480);
        sessionStorage.setItem('booted', '1');
        return;
      }
      const el = document.createElement('div');
      el.className = 'line';
      el.innerHTML = '<span class="dim">&gt;</span> ' + SEQ[i] +
        (i === total - 1 ? ' <span class="cursor"></span>' : '');
      bootLines.appendChild(el);
      requestAnimationFrame(() => el.classList.add('show'));
      i++;
      bootPf.style.width = (i / total * 100) + '%';
      setTimeout(step, 150 + Math.random() * 130);
    };
    step();
  }

  function prefersReduced() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  if (bootSkip) bootSkip.addEventListener('click', () => { sessionStorage.setItem('booted', '1'); finishBoot(); });
  document.addEventListener('keydown', (e) => {
    if (!finished && (e.key === 'Enter' || e.key === 'Escape')) { sessionStorage.setItem('booted', '1'); finishBoot(); }
  });

  /* ---------- scroll reveals + protocol bars ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        // fill protocol bars when skills panel reveals
        en.target.querySelectorAll && en.target.querySelectorAll('.fill').forEach((f) => {
          f.style.width = (f.dataset.pct || 80) + '%';
        });
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });

  let revealsStarted = false;
  function startReveals() {
    if (revealsStarted) return;
    revealsStarted = true;
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
    // also catch any standalone fill bars
    document.querySelectorAll('.fill').forEach((f) => {
      const panel = f.closest('.reveal');
      if (!panel) f.style.width = (f.dataset.pct || 80) + '%';
    });
  }

  /* ---------- side-nav active highlighting ---------- */
  const navLinks = Array.from(document.querySelectorAll('.sidenav a'));
  const sections = navLinks.map((a) => document.getElementById(a.dataset.sec)).filter(Boolean);
  const navIo = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        navLinks.forEach((a) => a.classList.toggle('active', a.dataset.sec === en.target.id));
      }
    });
  }, { threshold: 0.4 });
  sections.forEach((s) => navIo.observe(s));

  /* ---------- kick off ---------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runBoot);
  } else {
    runBoot();
  }
})();
