(function () {
  var toggleBtn = document.querySelector('.js-nav-toggle');
  var mobileNav = document.getElementById('mobile-nav');
  if (!toggleBtn || !mobileNav) return;

  function openNav() {
    mobileNav.removeAttribute('aria-hidden');
    toggleBtn.setAttribute('aria-expanded', 'true');
    toggleBtn.setAttribute('aria-label', 'Close navigation menu');
    document.documentElement.classList.add('nav-open', 'modal-lock');
  }

  function closeNav() {
    mobileNav.setAttribute('aria-hidden', 'true');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-label', 'Open navigation menu');
    document.documentElement.classList.remove('nav-open', 'modal-lock');
  }

  toggleBtn.addEventListener('click', function () {
    mobileNav.hasAttribute('aria-hidden') ? openNav() : closeNav();
  });

  mobileNav.querySelectorAll('a, button').forEach(function (el) {
    el.addEventListener('click', closeNav);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !mobileNav.hasAttribute('aria-hidden')) closeNav();
  });
})();
