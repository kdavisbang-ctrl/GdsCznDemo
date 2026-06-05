/* Contact modal: open/close, validation, Supabase submission.
   Loaded before scroll.js and uses capture phase so it can
   stopImmediatePropagation before scroll.js's bubble-phase handler fires.

   SETUP:
   1. In index.html set window.GC_SUPABASE_URL and window.GC_SUPABASE_KEY
      to your project's URL and anon (public) key.
   2. Run the SQL in the repo README to create the table + RLS policy.
*/
(function () {
  var modal   = document.getElementById('contact-modal');
  var form    = document.getElementById('contact-form');
  var success = document.querySelector('.form-success');
  if (!modal || !form) return;

  // ---- Supabase client -----------------------------------------------------
  var db = null;
  var SUPABASE_URL = window.GC_SUPABASE_URL || '';
  var SUPABASE_KEY = window.GC_SUPABASE_KEY || '';
  if (SUPABASE_URL && SUPABASE_KEY && window.supabase) {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }

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

  var backdrop = modal.querySelector('.modal-backdrop');
  if (backdrop) backdrop.addEventListener('click', closeModal);

  modal.querySelectorAll('.js-modal-close').forEach(function (btn) {
    btn.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  // ---- Validation ----------------------------------------------------------
  function validate() {
    var ok = true;
    form.querySelectorAll('[required]').forEach(function (el) {
      el.classList.remove('field-error');
      var empty    = !el.value.trim();
      var badEmail = el.type === 'email' && el.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value);
      if (empty || badEmail) { el.classList.add('field-error'); ok = false; }
    });
    return ok;
  }

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

    var data = {
      name:         form.querySelector('#cf-name').value.trim(),
      email:        form.querySelector('#cf-email').value.trim(),
      company:      form.querySelector('#cf-company').value.trim() || null,
      project_type: form.querySelector('#cf-type').value || null,
      budget:       form.querySelector('#cf-budget').value || null,
      timeline:     form.querySelector('#cf-timeline').value || null,
      message:      form.querySelector('#cf-message').value.trim()
    };

    if (!db) {
      // Supabase not configured — fall back to mailto so nothing is silently lost
      window.location.href = 'mailto:hello@gideonschosen.dev'
        + '?subject=' + encodeURIComponent('Project inquiry from ' + data.name)
        + '&body='    + encodeURIComponent(JSON.stringify(data, null, 2));
      btn.disabled = false;
      btn.innerHTML = 'Send it <span class="arrow">→</span>';
      return;
    }

    db.from('contact_submissions')
      .insert([data])
      .then(function (res) {
        if (res.error) {
          showError(btn, res.error.message || 'Something went wrong.');
        } else {
          form.hidden = true;
          success.hidden = false;
          success.focus();
        }
      })
      .catch(function (err) {
        showError(btn, err.message || 'Network error — please email us directly.');
      });
  });

  function showError(btn, msg) {
    btn.disabled = false;
    btn.innerHTML = 'Send it <span class="arrow">→</span>';
    var err = form.querySelector('.form-submit-error');
    if (err) { err.textContent = msg; err.hidden = false; }
  }
})();
