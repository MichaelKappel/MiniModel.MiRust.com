(() => {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('#primary-nav');
  const navLinks = Array.from(document.querySelectorAll('#primary-nav a[href^="#"]'));
  const progress = document.querySelector('.scroll-progress span');
  const backToTop = document.querySelector('.back-to-top');
  const copyStatus = document.querySelector('.copy-status');

  const closeNavigation = () => {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', 'false');
    nav.dataset.open = 'false';
  };

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const nextOpen = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(nextOpen));
      nav.dataset.open = String(nextOpen);
    });

    navLinks.forEach((link) => link.addEventListener('click', closeNavigation));

    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest('.topbar')) return;
      closeNavigation();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      closeNavigation();
      toggle.focus();
    });
  }

  const setActiveLink = (sectionId) => {
    navLinks.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${sectionId}`;
      link.classList.toggle('is-active', isActive);
      if (isActive) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  if ('IntersectionObserver' in window) {
    const sections = Array.from(document.querySelectorAll('main section[id]'));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => right.intersectionRatio - left.intersectionRatio);
      if (visible[0]) setActiveLink(visible[0].target.id);
    }, { rootMargin: '-20% 0px -65% 0px', threshold: [0.05, 0.25, 0.5] });
    sections.forEach((section) => observer.observe(section));
  }

  const updateScrollState = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
    if (progress) progress.style.width = `${ratio * 100}%`;
    if (backToTop) backToTop.classList.toggle('is-visible', window.scrollY > 640);
  };

  window.addEventListener('scroll', updateScrollState, { passive: true });
  window.addEventListener('resize', () => {
    if (window.matchMedia('(min-width: 1041px)').matches) closeNavigation();
    updateScrollState();
  });
  updateScrollState();

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      document.querySelector('.brand')?.focus({ preventScroll: true });
    });
  }

  const copyText = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    if (!copied) throw new Error('Copy command was rejected');
  };

  document.querySelectorAll('.code-panel pre').forEach((pre) => {
    const panel = pre.closest('.code-panel');
    if (!panel) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-copy';
    button.textContent = 'Copy';
    button.setAttribute('aria-label', `Copy ${panel.dataset.codeLabel || 'code'} block`);
    button.addEventListener('click', async () => {
      try {
        await copyText(pre.textContent || '');
        button.textContent = 'Copied';
        if (copyStatus) copyStatus.textContent = 'Code copied to clipboard.';
      } catch {
        button.textContent = 'Copy failed';
        if (copyStatus) copyStatus.textContent = 'Code could not be copied.';
      }
      window.setTimeout(() => { button.textContent = 'Copy'; }, 1800);
    });
    panel.appendChild(button);
  });
})();
