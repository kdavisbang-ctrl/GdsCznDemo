/* Contact modal: open/close, validation, Formspree submission.
   Loaded before scroll.js and uses capture phase so it can
   stopImmediatePropagation before scroll.js's bubble-phase handler fires. */
(function () {
  var modal   = document.getElementById('contact-modal');
  var form    = document.getElementById('contact-form');
  var success = document.querySelector('.form-success');
  if (!modal || !form) return;

  // ---- Open / close --------------------------------------------------------
  function openModal() {
    modal.removeAttribute('aria-hidden');
    modal.classList.add('open');
    document.documentElement.classList.add('modal-lock');
    setTimeout(function () {
      var first = form.querySelector('input:not([type=hidden]), select, textarea');
      if (first) first.focus();
    }, 350);
  }

  function closeModal() {
    modal.setAttribute('aria-hidden', 'true');
    modal.classList.remove('open');
    document.documentElement.classList.remove('modal-lock');
  }

  // Intercept CTA links in capture phase so scroll.js (bubble phase) never fires
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-contact]');
    if (!trigger) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    openModal();
  }, true);

  // Backdrop click
  var backdrop = modal.querySelector('.modal-backdrop');
  if (backdrop) backdrop.addEventListener('click', closeModal);

  // All close buttons inside the modal
  modal.querySelectorAll('.js-modal-close').forEach(function (btn) {
    btn.addEventListener('click', closeModal);
  });

  // Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  // ---- Validation ----------------------------------------------------------
  function validate() {
    var ok = true;
    form.querySelectorAll('[required]').forEach(function (el) {
      el.classList.remove('field-error');
      var empty = !el.value.trim();
      var badEmail = el.type === 'email' && el.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value);
      if (empty || badEmail) { el.classList.add('field-error'); ok = false; }
    });
    return ok;
  }

  // Remove error highlight on input
  form.querySelectorAll('input, select, textarea').forEach(function (el) {
    el.addEventListener('input', function () { el.classList.remove('field-error'); });
  });

  // ---- Submission ----------------------------------------------------------
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;

    var btn = form.querySelector('.submit-btn');
    btn.disabled = true;
    btn.textContent = 'Sending…';

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    })
      .then(function (r) {
        if (r.ok) {
          form.hidden = true;
          success.hidden = false;
          success.focus();
        } else {
          r.json().then(function (data) {
            var msg = (data.errors && data.errors.map(function(e){return e.message;}).join(', ')) || 'Something went wrong.';
            showError(btn, msg);
          }).catch(function () { showError(btn, 'Something went wrong.'); });
        }
      })
      .catch(function () { showError(btn, 'Network error — please try again or email us directly.'); });
  });

  function showError(btn, msg) {
    btn.disabled = false;
    btn.innerHTML = 'Send it <span class="arrow">→</span>';
    var err = form.querySelector('.form-submit-error');
    if (err) { err.textContent = msg; err.hidden = false; }
  }
})();
