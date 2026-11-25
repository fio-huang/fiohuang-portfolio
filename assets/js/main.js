/* =====================================================================
   Fiona Huang — portfolio
   1) Page router: the site is a set of full-screen "views" (home, about,
      experience, works, contact). The URL hash decides which one is
      visible, so browser back / forward just work.
   2) Vinyl: the half-disc on the right edge is the navigation. When the
      page changes, the disc spins (CSS transition, ease-in-out) and ends
      with the chosen track at the 9 o'clock position.
   3) "My works": one project shown at a time (list + #works/<id>), plus the sideways gallery strip.
   ===================================================================== */
(function () {
  var VIEWS = ['home', 'about', 'experience', 'works', 'contact'];
  var SITE_TITLE = document.title || "Fiona Huang's Portfolio";   // set from content/site.json by content.js before this file runs
  var TITLES = {       // the browser-tab title is the same on every page
    home: SITE_TITLE,
    about: SITE_TITLE,
    experience: SITE_TITLE,
    works: SITE_TITLE,
    contact: SITE_TITLE
  };
  var ALIASES = { '': 'home', top: 'home', cv: 'home', work: 'works', projects: 'works', contact: 'contact' };

  var root = document.documentElement;
  var body = document.body;
  var vinyl = document.getElementById('vinyl');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mobile = window.matchMedia('(max-width: 700px)');

  var current = null;      // name of the visible view
  var rot = 0;             // accumulated vinyl rotation in degrees (keeps growing so it always spins smoothly)
  var lastStep = null;
  var spinTimer = null;

  function mod(a, n) { return ((a % n) + n) % n; }
  function stepDeg() { return parseFloat(getComputedStyle(root).getPropertyValue('--step')) || 26; }

  // Rotation (mod 360) that puts a view's track at the 9 o'clock position. Five tracks (home, about, experience, works,
  // contact); the middle one (experience) sits at 9 o'clock when the disc is at rest. Home = the resting position (0),
  // where the "home" track is the highlighted one at the top of the visible half.
  function targetFor(view) {
    var k = VIEWS.indexOf(view);            // 0..4
    return k <= 0 ? 0 : (k - 2) * stepDeg();
  }

  function parseHash() {
    var parts = location.hash.replace(/^#\/?/, '').split('/');
    var v = ALIASES.hasOwnProperty(parts[0]) ? ALIASES[parts[0]] : parts[0];
    if (VIEWS.indexOf(v) < 0) v = 'home';
    return { view: v, project: parts[1] || null };
  }

  function spinTo(next, prev, instant) {
    var target = targetFor(next);
    if (instant || reduceMotion.matches || prev === null) {
      rot = target + 360 * Math.round(rot / 360);
    } else if (VIEWS.indexOf(next) >= VIEWS.indexOf(prev)) {
      rot = rot + 360 + mod(target - rot, 360);          // forward: a full turn clockwise, landing on the track
    } else {
      rot = rot - 360 - mod(rot - target, 360);          // going back: spin the other way
    }
    vinyl.style.transform = 'rotate(' + rot + 'deg)';
  }

  function setProject(id) {
    var figs = document.querySelectorAll('.project');
    var ids = Array.prototype.map.call(figs, function (f) { return f.dataset.project; });
    if (!id || ids.indexOf(id) < 0) {
      if (id && location.hash.indexOf('#works/') === 0) {   // unknown / removed project id: tidy the URL back to #works and keep the current project
        try { history.replaceState(null, '', '#works'); } catch (e) {}
      }
      var cur = document.querySelector('.project.is-current');
      id = cur ? cur.dataset.project : ids[0];
    }
    Array.prototype.forEach.call(figs, function (f) { f.classList.toggle('is-current', f.dataset.project === id); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-project-link]'), function (a) {
      if (a.dataset.projectLink === id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }

  function markNav(view) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-route]'), function (a) {
      if (a.dataset.route === view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  function route(first) {
    var p = parseHash();
    var next = p.view;
    if (next === 'works') setProject(p.project);
    // stop any playing project video once it is off screen (another project or another page)
    Array.prototype.forEach.call(document.querySelectorAll('video'), function (v) { if (next !== 'works' || !v.closest('.project.is-current')) v.pause(); });

    if (next !== current) {
      var prev = current;
      var nextEl = document.getElementById('view-' + next);
      var prevEl = prev ? document.getElementById('view-' + prev) : null;

      if (!prevEl) {   // first load: make sure only the requested view is showing
        Array.prototype.forEach.call(document.querySelectorAll('.view'), function (v) { v.classList.remove('is-active'); });
      }
      if (prevEl) {
        prevEl.classList.remove('is-active');
        if (!first && !reduceMotion.matches) {
          prevEl.classList.add('is-leaving');
          setTimeout(function () { prevEl.classList.remove('is-leaving'); prevEl.scrollTop = 0; }, 800);
        }
      }
      nextEl.classList.remove('is-leaving');
      nextEl.classList.add('is-active');

      body.setAttribute('data-view', next);
      markNav(next);
      spinTo(next, prev, first);
      if (!first && !reduceMotion.matches) {      // mark the transition so hover fills (e.g. on the home icon) stay off until it settles
        body.classList.add('is-spinning');
        clearTimeout(spinTimer);
        spinTimer = setTimeout(function () { body.classList.remove('is-spinning'); }, 1500);
      }
      document.title = TITLES[next];
      current = next;

      if (!first) {
        var h = nextEl.querySelector('h1');
        if (h) h.focus({ preventScroll: true });
      }
    }
  }

  // Tapping the small corner disc on phones goes back to the contents.
  vinyl.addEventListener('click', function (e) {
    if (e.target.closest('a')) return;
    if (mobile.matches && current !== 'home') location.hash = '#home';
  });

  // If the breakpoint changes the spacing of the tracks, re-seat the disc without animating.
  window.addEventListener('resize', function () {
    var s = stepDeg();
    if (s !== lastStep) {
      lastStep = s;
      body.classList.add('no-anim');
      spinTo(current, current, true);
      requestAnimationFrame(function () { requestAnimationFrame(function () { body.classList.remove('no-anim'); }); });
    }
  });

  window.addEventListener('hashchange', function () { endIntro(); route(false); });
  lastStep = stepDeg();
  route(true);
  requestAnimationFrame(function () { requestAnimationFrame(function () { body.classList.remove('no-anim'); }); });

  /* ---------- first-load intro ----------
     The record starts big and centred, then pans out to its half-visible spot while turning about half a turn and
     slowing as it settles. Header, headline and captions fade up just after. Only transform + opacity are animated
     (Web Animations API), and every animation ends on the element's normal CSS values, so there is no jump at hand-off.
     Plays once per session, only on a direct load of #home (index.html adds class "intro" to <html> to allow it). */
  var htmlEl = document.documentElement;
  var introAnims = [];
  var introTimers = [];
  var introOn = false;

  function endIntro() {
    if (!introOn) return;
    introOn = false;
    introTimers.forEach(clearTimeout);
    introAnims.forEach(function (a) { try { a.finish(); } catch (e) {} });
    htmlEl.classList.remove('intro', 'intro-run');       // elements are now on their natural values (animations ended on them)
    introAnims.forEach(function (a) { try { a.cancel(); } catch (e) {} });
    introAnims = [];
  }

  function playIntro() {
    if (!htmlEl.classList.contains('intro')) return;
    try { sessionStorage.setItem('fh-intro', '1'); } catch (e) {}
    if (reduceMotion.matches || current !== 'home' || !Element.prototype.animate) { htmlEl.classList.remove('intro'); return; }
    introOn = true;
    htmlEl.classList.add('intro-run');      // tracks stay unclickable until the intro ends

    var wrap = document.querySelector('.vinyl-wrap');
    var tracks = document.querySelector('.tracks');
    var D = wrap.offsetWidth;
    var r = wrap.getBoundingClientRect();                       // resting position (home, scale 1)
    var k = Math.max(1.2, Math.min(0.92 * window.innerHeight / D, 2));   // start zoom: nearly fills the screen
    var dx = window.innerWidth / 2 - (r.left + r.width / 2);
    var dy = window.innerHeight / 2 - (r.top + r.height / 2);
    var DUR = 1900;
    var inOut = 'cubic-bezier(.65,0,.25,1)';
    var settle = 'cubic-bezier(.22,.65,.2,1)';

    function add(el, frames, opts) {
      opts.fill = 'both';
      var a = el.animate(frames, opts);
      introAnims.push(a);
      return a;
    }

    // the pan-out (scale + move) and the spin share one clock; the spin decelerates into the resting angle
    add(wrap, [
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + k + ')', opacity: 0 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + k + ')', opacity: 1, offset: .08 },
      { transform: 'translate(0,0) scale(1)', opacity: 1 }
    ], { duration: DUR, easing: inOut });
    add(vinyl, [
      { transform: 'rotate(' + (rot - 170) + 'deg)' },
      { transform: 'rotate(' + rot + 'deg)' }
    ], { duration: DUR + 100, easing: settle });
    add(tracks, [{ opacity: 0 }, { opacity: 0, offset: .55 }, { opacity: 1 }], { duration: DUR + 100, easing: 'ease-out' });

    function rise(el, delay, dur, dist, to) {
      if (!el) return;
      add(el, [
        { opacity: 0, transform: 'translate3d(0,' + dist + 'px,0)' },
        { opacity: to || 1, transform: 'translate3d(0,0,0)' }
      ], { duration: dur, delay: delay, easing: 'cubic-bezier(.2,.7,.2,1)' });
    }
    rise(document.querySelector('.nav'), 900, 800, -10);
    Array.prototype.forEach.call(document.querySelectorAll('.hero__line'), function (el, i) { rise(el, 1000 + i * 110, 900, 26); });
    rise(document.querySelector('.hero__intro'), 1380, 800, 16);
    rise(document.querySelector('.hero__interest'), 1560, 800, 14);
    rise(document.querySelector('.footer'), 1650, 800, 6, 0.7);   // footer rests at 70% opacity

    // release the intro hold once the disc has started landing
    introTimers.push(setTimeout(function () { htmlEl.classList.remove('intro'); }, 1100));
    var last = introAnims.reduce(function (m, a) { var t = a.effect.getComputedTiming(); return Math.max(m, t.endTime); }, 0);
    introTimers.push(setTimeout(endIntro, last + 50));
  }
  var introW = window.innerWidth;
  window.addEventListener('resize', function () { if (Math.abs(window.innerWidth - introW) > 40) endIntro(); });   // ignore phone address-bar height changes
  playIntro();

  /* ---------- rotating "I'm interested in . . ." word (home page) ----------
     Every 2s the visible word gets .is-out (slides up and fades) while the next one loses its resting position
     below and gets .is-on (slides up in). CSS in style.css does the motion (transform/opacity, .6s). Stops when the tab is hidden,
     the page is not home, or "reduce motion" is on (the static line is shown instead). Edit the words in index.html. */
  (function () {
    var words = document.querySelectorAll('.roller__w');
    if (words.length < 2) return;
    var i = 0, timer = null, INTERVAL = 2000;
    function tick() {
      if (document.hidden || current !== 'home') return;
      var out = words[i];
      i = (i + 1) % words.length;
      var nxt = words[i];
      nxt.classList.remove('is-out');
      out.classList.remove('is-on');
      out.classList.add('is-out');
      void nxt.offsetWidth;                 // make sure the incoming word starts from its resting spot below
      nxt.classList.add('is-on');
      setTimeout(function () {              // park the word that left back below the window (invisible, no jump)
        if (out !== words[i]) { out.style.transition = 'none'; out.classList.remove('is-out'); void out.offsetWidth; out.style.transition = ''; }
      }, 700);
    }
    function start() { if (!timer && !reduceMotion.matches) timer = setInterval(tick, INTERVAL); }
    function stop() { clearInterval(timer); timer = null; }
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
    var onChange = function () { if (reduceMotion.matches) stop(); else start(); };
    if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', onChange);
    start();
  })();

  /* ---------- gallery strips (UBC VSA, Sports Photography): the arrows scroll the strip sideways (keyboard: focus the strip, use ← →) ---------- */
  document.querySelectorAll('.vsa__strip').forEach(function (strip) {
    var project = strip.closest('.project');
    project.querySelectorAll('[data-strip]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        strip.scrollBy({ left: Number(btn.dataset.strip) * strip.clientWidth * 0.8, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      });
    });
  });
})();
