// Image viewer for strombos.dev pages: a link to an image (png, jpg, webp, gif) that wraps an <img>
// opens the picture in an overlay instead of the raw file. Close with the × button, Esc, or a click outside the picture.
// Load it with <script src="../lightbox.js?v=1" defer></script>. Ctrl/Cmd/middle-click still opens the file in a new tab.
(function () {
  var css =
    '.lb{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;padding:64px 24px 32px;background:rgba(5,8,10,.92);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}' +
    '.lb[hidden]{display:none}' +
    '.lb img{max-width:100%;max-height:100%;width:auto;height:auto;border-radius:12px;border:1px solid #22303A;box-shadow:0 24px 80px rgba(0,0,0,.6)}' +
    '.lb-close{position:absolute;top:14px;right:14px;display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;padding:0;border-radius:999px;border:1px solid #22303A;background:#10181E;color:#F2F6F8;cursor:pointer}' +
    '.lb-close:hover{border-color:#6FB3CC}' +
    '.lb-close:focus-visible{outline:2px solid #6FB3CC;outline-offset:3px}' +
    '.lb-open{overflow:hidden}';
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var box = document.createElement('div');
  box.className = 'lb';
  box.hidden = true;
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Image viewer');
  box.innerHTML = '<button type="button" class="lb-close" aria-label="Close image viewer"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button><img alt="">';
  document.body.appendChild(box);
  var big = box.querySelector('img'), closeBtn = box.querySelector('.lb-close'), back = null;

  var close = function () {
    if (box.hidden) return;
    box.hidden = true;
    big.removeAttribute('src');
    document.documentElement.classList.remove('lb-open');
    if (back) back.focus();
  };
  var open = function (link) {
    var thumb = link.querySelector('img');
    back = link;
    big.src = link.getAttribute('href');
    big.alt = thumb ? thumb.alt : '';
    box.hidden = false;
    document.documentElement.classList.add('lb-open');
    closeBtn.focus();
  };

  closeBtn.addEventListener('click', close);
  box.addEventListener('click', function (e) { if (e.target === box) close(); });
  document.addEventListener('keydown', function (e) {
    if (box.hidden) return;
    if (e.key === 'Escape') { close(); e.preventDefault(); }
    if (e.key === 'Tab') { closeBtn.focus(); e.preventDefault(); }   // keep focus inside the viewer
  });

  Array.prototype.forEach.call(document.querySelectorAll('a[href]'), function (a) {
    if (!/\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(a.getAttribute('href')) || !a.querySelector('img')) return;
    a.addEventListener('click', function (e) {
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      open(a);
    });
  });
})();
