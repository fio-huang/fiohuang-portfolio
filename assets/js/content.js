/* =====================================================================
   Fiona Huang — portfolio: fills the page from the files in /content.
   Those files are what the editor (Pages CMS, see .pages.yml) changes.
   The HTML in index.html is the fallback: if anything here fails, the page
   still shows the text that is already written in it.
   When it's done (or has failed), it starts main.js (see the loader at the
   bottom of index.html), so the animations and the vinyl see the final page.
   ===================================================================== */
(function () {
  function start() { if (window.fhStart) window.fhStart(); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  // "/assets/images/x.jpg" (what the editor saves) -> "assets/images/x.jpg" (works from any folder). Full web addresses are left alone.
  function path(p) { p = String(p || ''); return (p.charAt(0) === '/' && p.charAt(1) !== '/') ? p.slice(1) : p; }
  function q(sel, root) { return (root || document).querySelector(sel); }
  function qa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function setText(sel, text, root) { var el = q(sel, root); if (el && text != null && text !== '') el.textContent = text; }
  function setMeta(sel, value) { qa(sel).forEach(function (m) { if (value) m.setAttribute('content', value); }); }
  // [[small grey text]] inside a line becomes the smaller grey note
  function rich(s) { return esc(s).replace(/\[\[([\s\S]*?)\]\]/g, '<span class="row__note">$1</span>'); }
  function list(a) { return Array.isArray(a) ? a.filter(function (x) { return x != null && x !== ''; }) : []; }
  function guard(fn, data) { if (!data) return; try { fn(data); } catch (e) { if (window.console) console.warn('content: kept the built-in text for a section', e); } }

  function fillSite(d) {
    if (d.title) document.title = d.title;
    setMeta('meta[name="description"]', d.description);
    if (d.share) {
      setMeta('meta[property="og:title"]', d.share.title);
      setMeta('meta[property="og:description"]', d.share.description);
      setMeta('meta[property="og:url"]', d.share.url);
      var origin = String(d.share.url || '').replace(/\/+$/, '');
      var img = d.share.image ? (/^https?:/.test(d.share.image) ? d.share.image : origin + '/' + path(d.share.image)) : '';
      setMeta('meta[property="og:image"]', img);
      setMeta('meta[name="twitter:image"]', img);
    }
    var n = d.now_playing, np = q('a.np');
    if (n && np) {
      if (n.link) np.setAttribute('href', n.link);
      np.setAttribute('aria-label', 'What I\'m listening to: ' + n.song + ' by ' + n.artist + ', open on Spotify (new tab)');
      setText('.np__label', n.label);
      var song = q('.np__song', np);
      if (song) song.innerHTML = esc(n.song) + ' <span class="np__artist">· ' + esc(n.artist) + '</span>';
    }
    setText('.footer__home', d.footer_home);
    setText('.footer__main', d.footer_main);
  }

  function fillHome(d) {
    var status = q('.hero__status');
    if (status && d.status) status.innerHTML = '<span class="hero__dot" aria-hidden="true"></span>' + esc(d.status);
    setText('.hero__intro', d.intro);
    var words = list(d.interests);
    if (words.length) {
      var spoken = words.length > 1 ? words.slice(0, -1).join(', ') + ', and ' + words[words.length - 1] : words[0];
      setText('.hero__interest .sr-only', 'I’m interested in ' + spoken);
      var roller = q('.roller');
      if (roller) roller.innerHTML = words.map(function (w, i) { return '<span class="roller__w' + (i === 0 ? ' is-on' : '') + '">' + esc(w) + '</span>'; }).join('\n                ');
      setText('.interest__static', words.join(', '));
    }
    var cta = q('.hero__cta');
    if (cta && d.button) cta.innerHTML = esc(d.button) + ' <span aria-hidden="true">→</span>';
  }

  function fillAbout(d) {
    setText('.about__text', d.text);
    [['.frame--portrait', d.portrait], ['.frame--landscape', d.landscape]].forEach(function (pair) {
      var f = q(pair[0]), v = pair[1];
      if (!f || !v) return;
      var im = q('img', f);
      if (im && v.image) im.setAttribute('src', path(v.image));
      if (im && v.alt != null) im.setAttribute('alt', v.alt);
      setText('figcaption', v.caption, f);
    });
    var ul = q('.rows--facts');
    if (ul && Array.isArray(d.facts)) ul.innerHTML = d.facts.map(function (r) {
      return '<li class="row"><span class="row__tag">' + esc(r.label) + '</span><span class="row__title">' + esc(r.title) + '</span><span class="row__role">' + esc(r.detail) + '</span></li>';
    }).join('\n          ');
  }

  function fillExperience(d) {
    setText('#view-experience .page-sub', d.subtitle);
    var ol = q('.rows--exp');
    if (ol && Array.isArray(d.entries)) ol.innerHTML = d.entries.map(function (r) {
      return '<li class="row"><span class="row__tag">' + esc(r.label) + '</span><span class="row__title">' + esc(r.title) + '</span><span class="row__role">' + rich(r.detail) + '</span><span class="row__date">' + esc(r.date) + '</span></li>';
    }).join('\n        ');
    setText('.skills__label', d.skills_label);
    var skills = list(d.skills);
    if (skills.length) {
      var lis = skills.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');
      qa('.skills__track').forEach(function (u) { u.innerHTML = lis; });
      var m = q('.skills__marquee');
      if (m) m.setAttribute('aria-label', 'Software and skills: ' + skills.join(', '));
    }
  }

  function button(p) {
    if (p.button_file && p.button_label) return '<a class="btn" href="' + esc(path(p.button_file)) + '" download>' + esc(p.button_label) + ' <span aria-hidden="true">↓</span></a>';
    if (p.button_link && p.button_label) return '<a class="btn" href="' + esc(p.button_link) + '" target="_blank" rel="noopener noreferrer">' + esc(p.button_label) + ' <span aria-hidden="true">↗</span></a>';
    return '';
  }
  var ARROWS = '<div class="controls">' +
    '<button class="arrow" type="button" data-strip="-1" aria-label="Scroll gallery left"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16 10H4m0 0 5-5m-5 5 5 5" /></svg></button>' +
    '<button class="arrow" type="button" data-strip="1" aria-label="Scroll gallery right"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12m0 0-5-5m5 5-5 5" /></svg></button></div>';

  function projectHtml(p, first) {
    var isVideo = !!p.video;
    var h = '<figure class="project ' + (isVideo ? 'project--uv' : 'project--gallery') + (first ? ' is-current' : '') + '" id="' + esc(p.id) + '" data-project="' + esc(p.id) + '">' +
      '<div class="vsa__head"><div class="vsa__text">' +
      '<p class="vsa__meta">' + esc(p.meta) + '</p><h2 class="vsa__title">' + esc(p.name) + '</h2>' +
      '<p class="vsa__desc">' + esc(p.description) + '</p><p class="vsa__tags">' + esc(p.tags) + '</p></div>' +
      '<div class="vsa__actions">' + button(p) + (isVideo ? '' : ARROWS) + '</div></div>';
    if (isVideo) {
      h += '<video class="uv__video" controls playsinline muted loop preload="metadata"' + (p.poster ? ' poster="' + esc(path(p.poster)) + '"' : '') + ' width="1280" height="708" aria-label="' + esc(p.video_alt) + '">' +
        '<source src="' + esc(path(p.video)) + '" type="video/mp4">Your browser can’t play this video. <a href="' + esc(path(p.video)) + '">Open the video file</a>.</video>';
    } else {
      h += '<ul class="vsa__strip" tabindex="0" aria-label="' + esc(p.name) + ' gallery (scroll sideways)">' +
        list(p.images).filter(function (i) { return i && i.image; }).map(function (i) {
          return '<li class="vsa__item' + (i.square ? ' vsa__item--sq' : '') + '"><img src="' + esc(path(i.image)) + '" width="' + (i.square ? 1254 : 1050) + '" height="' + (i.square ? 1254 : 1400) + '" alt="' + esc(i.alt) + '" decoding="async"></li>';
        }).join('') + '</ul>';
    }
    return h + '</figure>';
  }

  function fillWorks(d) {
    setText('#view-works .page-sub', d.subtitle);
    setText('.works__side .hint', d.hint);
    var ps = (Array.isArray(d.projects) ? d.projects : []).filter(function (p) { return p && p.id && p.name; });
    if (!ps.length) return;
    var ol = q('.plist');
    if (ol) ol.innerHTML = ps.map(function (p, i) {
      var n = i < 9 ? '0' + (i + 1) : String(i + 1);
      return '<li><a href="#works/' + esc(p.id) + '" data-project-link="' + esc(p.id) + '"><span class="plist__n">' + n + '</span><span class="plist__name' + (p.name.length > 24 ? ' plist__name--long' : '') + '">' + esc(p.name) + '</span><span class="plist__cat">' + esc(p.category) + '</span>' +
        (p.thumb ? '<img class="plist__thumb" src="' + esc(path(p.thumb)) + '" width="240" height="240" alt="' + esc(p.thumb_alt) + '" loading="lazy" decoding="async">' : '') + '</a></li>';
    }).join('\n            ');
    var stage = q('.works__stage');
    if (stage) {
      qa('figure.project', stage).forEach(function (f) { f.parentNode.removeChild(f); });
      stage.insertAdjacentHTML('beforeend', ps.map(function (p, i) { return projectHtml(p, i === 0); }).join('\n\n        '));
    }
  }

  function fillContact(d) {
    setText('.contact__line', d.line);
    setText('.pill', d.pill);
    var ul = q('.rows--links');
    if (ul) {
      var rows = [];
      if (d.email) rows.push('<li class="row"><span class="row__tag">Email</span><a class="row__title" href="mailto:' + esc(d.email) + '">' + esc(d.email) + '</a></li>');
      if (d.linkedin_url) rows.push('<li class="row"><span class="row__tag">LinkedIn</span><a class="row__title" href="' + esc(d.linkedin_url) + '" target="_blank" rel="noopener noreferrer">' + esc(d.linkedin_text || d.linkedin_url) + '</a></li>');
      if (d.instagram_url) rows.push('<li class="row"><span class="row__tag">Instagram</span><a class="row__title" href="' + esc(d.instagram_url) + '" target="_blank" rel="noopener noreferrer">' + esc(d.instagram_text || d.instagram_url) + '</a></li>');
      if (d.resume_file) rows.push('<li class="row"><span class="row__tag">Résumé</span><a class="row__title" href="' + esc(path(d.resume_file)) + '" target="_blank" rel="noopener">' + esc(d.resume_text || 'Résumé (PDF)') + '</a></li>');
      ul.innerHTML = rows.join('\n          ');
    }
    // the three small icons on the home page use the same links
    var li = q('.footer__social a[title="LinkedIn"]'); if (li && d.linkedin_url) li.setAttribute('href', d.linkedin_url);
    var em = q('.footer__social a[title="Email"]'); if (em && d.email) em.setAttribute('href', 'mailto:' + d.email);
    var ig = q('.footer__social a[title="Instagram"]'); if (ig && d.instagram_url) ig.setAttribute('href', d.instagram_url);
  }

  function load(name) {
    return fetch('content/' + name + '.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .catch(function () { return null; });
  }

  try {
    if (!window.fetch || !window.Promise) { start(); return; }
    Promise.all(['site', 'home', 'about', 'experience', 'works', 'contact'].map(load)).then(function (all) {
      if (window.fhStarted) return;   // too slow: the page already started with its built-in text, don't change it under the visitor
      guard(fillSite, all[0]); guard(fillHome, all[1]); guard(fillAbout, all[2]);
      guard(fillExperience, all[3]); guard(fillWorks, all[4]); guard(fillContact, all[5]);
      start();
    }, start);
  } catch (e) { start(); }
})();
