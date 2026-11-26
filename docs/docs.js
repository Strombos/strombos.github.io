// Shared script for strombos.dev/docs/.
// When you change docs.css or docs.js, bump the ?v= number where every page loads them.
// To add a doc: create docs/<name>/index.html (copy docs/terminal/index.html) and add ONE line to DOCS below.
// The sidebar, the docs overview cards and the previous/next links are all built from this list.
// The sidebar groups entries by tag (App → "Apps", Guide → "Guides"), in the order tags first appear.
var DOCS = [
  { title: 'Terminal', href: 'terminal/', tag: 'App', desc: 'All Triton Terminal commands.' },
  { title: 'Making apps', href: 'making-apps/', tag: 'Guide', desc: 'Build a Triton App: extend AbstractModule, add @ModProtection and the app’s settings files.' },
  { title: 'Bottom-bar menu', href: 'bottom-bar-menu/', tag: 'Guide', desc: 'Add your app’s own items to its bottom-bar button’s right-click menu with BottomBarMenuProvider.' },
  { title: 'Vortex Loading', href: 'vortex-loading/', tag: 'Guide', desc: 'Override Triton’s own classes or add new ones from vortex-module/, with sources Triton compiles and @Vortexable to seal a class.' }
];

(function () {
  var script = document.currentScript;
  var base = script.src.replace(/docs\.js(\?.*)?$/, '');   // URL of docs/
  var root = base + '../';                                  // URL of the homepage
  var norm = function (u) { return u.split('#')[0].split('?')[0].replace(/index\.html$/, '').replace(/\/$/, ''); };
  var here = norm(location.href);
  // Group by tag, in the order each tag first appears; the sidebar and previous/next follow this order.
  var GROUP_NAMES = { App: 'Apps', Guide: 'Guides' };
  var groups = [];
  DOCS.forEach(function (d) {
    var g = groups.filter(function (x) { return x.tag === d.tag; })[0];
    if (!g) groups.push(g = { tag: d.tag, title: GROUP_NAMES[d.tag] || d.tag, items: [] });
    g.items.push(d);
  });
  var pages = [{ title: 'Overview', href: '' }];
  groups.forEach(function (g) { pages = pages.concat(g.items); });
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  // ---- Sidebar ----
  var side = document.getElementById('sidebar');
  if (side) {
    var item = function (p) {
      var url = base + p.href, cur = norm(url) === here;
      return '<li><a href="' + esc(url) + '"' + (cur ? ' aria-current="page"' : '') + '>' + esc(p.title) + (p.tag ? '<small>' + esc(p.tag) + '</small>' : '') + '</a></li>';
    };
    var ext = [['Triton homepage', ''], ['Download', '#download'], ['How to start', '#run'], ['Get Java 21 or higher', '#java']];
    side.innerHTML =
      '<nav aria-label="Docs">' +
      '<div class="group"><span class="group-title">Documentation</span><ul>' + item(pages[0]) + '</ul></div>' +
      groups.map(function (g) {
        return '<div class="group"><span class="group-title">' + esc(g.title) + '</span><ul>' + g.items.map(item).join('') + '</ul></div>';
      }).join('') +
      '<div class="group"><span class="group-title">Get Triton</span><ul>' + ext.map(function (e) {
        return '<li><a class="ext" href="' + esc(root + e[1]) + '">' + esc(e[0]) + '</a></li>';
      }).join('') + '</ul></div></nav>';
  }

  // ---- Overview cards ----
  var list = document.getElementById('doc-list');
  if (list) {
    list.innerHTML = DOCS.map(function (d) {
      return '<li><a class="doc-card" href="' + esc(base + d.href) + '"><span class="tag">' + esc(d.tag) + '</span><strong>' + esc(d.title) + '</strong><span class="desc">' + esc(d.desc) + '</span><span class="go">Read →</span></a></li>';
    }).join('');
  }

  // ---- Previous / next ----
  var pager = document.getElementById('pager');
  if (pager) {
    var i = -1;
    pages.forEach(function (p, n) { if (norm(base + p.href) === here) i = n; });
    var html = '';
    if (i > 0) html += '<a class="prev" href="' + esc(base + pages[i - 1].href) + '"><small>← Previous</small><span>' + esc(pages[i - 1].title) + '</span></a>';
    if (i >= 0 && i < pages.length - 1) html += '<a class="next" href="' + esc(base + pages[i + 1].href) + '"><small>Next →</small><span>' + esc(pages[i + 1].title) + '</span></a>';
    if (html) pager.innerHTML = html; else pager.hidden = true;
  }

  // ---- Mobile menu ----
  var btn = document.querySelector('.menu-btn');
  var setNav = function (open) { document.body.classList.toggle('nav-open', open); if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false'); };
  if (btn) btn.addEventListener('click', function () { setNav(!document.body.classList.contains('nav-open')); });
  var scrim = document.querySelector('.scrim');
  if (scrim) scrim.addEventListener('click', function () { setNav(false); });

  // ---- Heading links ----
  Array.prototype.forEach.call(document.querySelectorAll('.doc h2[id]'), function (h) {
    var a = document.createElement('a');
    a.className = 'anchor'; a.href = '#' + h.id; a.textContent = '#';
    a.setAttribute('aria-label', 'Link to ' + h.textContent);
    h.appendChild(a);
  });

  // ---- Code colours: <pre><code class="lang-java"> or class="lang-properties"> ----
  // Wraps tokens in <span class="tok-…">; the text itself is unchanged, so Copy and the filter see plain code.
  var LANGS = {
    java: [
      ['com', /\/\*[\s\S]*?\*\/|\/\/[^\n]*/],
      ['str', /"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])'/],
      ['ann', /@[A-Za-z_]\w*/],
      ['kw', /\b(?:abstract|boolean|break|case|catch|char|class|continue|default|do|double|else|enum|extends|false|final|finally|float|for|if|implements|import|instanceof|int|interface|long|new|null|package|private|protected|public|return|short|static|super|switch|synchronized|this|throw|throws|true|try|var|void|volatile|while)\b/],
      ['num', /\b\d+(?:\.\d+)?[fFdDlL]?\b/],
      ['const', /\b[A-Z][A-Z0-9_]+\b/],
      ['type', /\b[A-Z]\w*\b/],
      ['fn', /\b[a-z_]\w*(?=\s*\()/]
    ],
    properties: [
      ['com', /^[ \t]*[#!][^\n]*/],
      ['key', /^[ \t]*[^\s=:#!][^=:\n]*?(?=[ \t]*[=:])/],
      ['str', /"(?:\\.|[^"\\\n])*"/]
    ]
  };
  var highlight = function (text, rules) {
    var re = new RegExp(rules.map(function (r) { return '(' + r[1].source + ')'; }).join('|'), 'gm');
    var out = '', last = 0, m;
    while ((m = re.exec(text))) {
      if (!m[0]) { re.lastIndex++; continue; }
      var k = 1; while (m[k] === undefined) k++;
      out += esc(text.slice(last, m.index)) + '<span class="tok-' + rules[k - 1][0] + '">' + esc(m[0]) + '</span>';
      last = re.lastIndex;
    }
    return out + esc(text.slice(last));
  };
  Array.prototype.forEach.call(document.querySelectorAll('.doc pre code[class*="lang-"]'), function (code) {
    var lang = (code.className.match(/lang-(\w+)/) || [])[1];
    if (LANGS[lang]) code.innerHTML = highlight(code.textContent, LANGS[lang]);
  });

  // ---- Copy buttons on code blocks ----
  Array.prototype.forEach.call(document.querySelectorAll('.doc pre'), function (pre) {
    var wrap = document.createElement('div');
    wrap.className = 'code';
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'copy'; b.textContent = 'Copy';
    b.addEventListener('click', function () {
      var text = pre.innerText.replace(/\n$/, '');
      var show = function (label, done) { b.textContent = label; b.classList.toggle('done', done); setTimeout(function () { b.textContent = 'Copy'; b.classList.remove('done'); }, 2200); };
      var legacy = function () {
        var t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
        document.body.appendChild(t); t.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) {} t.remove();
        return ok;
      };
      var fail = function () {   // the browser refused: select the text so Ctrl+C / long-press works
        var r = document.createRange(); r.selectNodeContents(pre.querySelector('code') || pre);
        var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
        show(/Mac|iPhone|iPad/.test(navigator.platform) ? 'Press ⌘C' : 'Press Ctrl+C', false);
      };
      var after = function () { if (legacy()) show('Copied', true); else fail(); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { show('Copied', true); }, after);
      else after();
    });
    wrap.appendChild(b);
  });

  // ---- Filter this page ----
  var input = document.getElementById('filter');
  var sections = Array.prototype.slice.call(document.querySelectorAll('.doc section'));
  var cards = list ? Array.prototype.slice.call(list.children) : [];
  var none = document.getElementById('no-results');
  if (input) {
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase(), any = false;
      sections.forEach(function (s) {
        var title = (s.querySelector('h2') || s).textContent.toLowerCase();
        var whole = !q || title.indexOf(q) >= 0, shown = whole;
        Array.prototype.forEach.call(s.querySelectorAll('.cmds tbody tr, .code'), function (el) {
          var hit = whole || el.textContent.toLowerCase().indexOf(q) >= 0;
          el.hidden = !hit; if (hit) shown = true;
        });
        Array.prototype.forEach.call(s.querySelectorAll('.cmds tbody'), function (tb) {
          tb.hidden = !Array.prototype.some.call(tb.rows, function (r) { return !r.hidden; });
        });
        Array.prototype.forEach.call(s.querySelectorAll('.table-wrap'), function (w) {
          w.hidden = !w.querySelector('tbody tr:not([hidden])');
        });
        Array.prototype.forEach.call(s.querySelectorAll('.ex-label'), function (l) {
          var next = l.nextElementSibling; l.hidden = !!(next && next.hidden);
        });
        s.hidden = !shown; if (shown) any = true;
      });
      var first = sections.filter(function (s) { return !s.hidden; })[0];
      sections.forEach(function (s) { s.classList.toggle('first', s === first); });
      cards.forEach(function (c) { var hit = !q || c.textContent.toLowerCase().indexOf(q) >= 0; c.hidden = !hit; if (hit) any = true; });
      if (none) none.hidden = any;
      document.querySelectorAll('.toc a[href^="#"]').forEach(function (a) {
        var t = document.getElementById(a.getAttribute('href').slice(1));
        a.parentNode.hidden = !!(t && t.closest('section') && t.closest('section').hidden);
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && document.activeElement !== input && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); input.focus(); }
      else if (e.key === 'Escape') {
        if (document.activeElement === input && input.value) { input.value = ''; input.dispatchEvent(new Event('input')); }
        setNav(false);
      }
    });
  }

  // ---- Highlight the section being read in "On this page" ----
  var links = Array.prototype.slice.call(document.querySelectorAll('.toc a[href^="#"]'));
  if (links.length) {
    var targets = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
    var update = function () {
      var cur = 0;
      targets.forEach(function (t, n) { if (t && !t.closest('[hidden]') && t.getBoundingClientRect().top <= 140) cur = n; });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) cur = targets.length - 1;
      links.forEach(function (a, n) { a.classList.toggle('active', n === cur); if (n === cur) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }
})();
