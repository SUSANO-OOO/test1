(() => {
  const q = (s, r = document) => r.querySelector(s);
  const qa = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer:fine)').matches;
  const mobilePortrait = q('#mobilePortraitImage');
  if (mobilePortrait && window.PAOPAO_PORTRAIT) mobilePortrait.src = window.PAOPAO_PORTRAIT;
  const counters = qa('[data-count]');
  const countObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = Number(el.dataset.count);
      if (!Number.isFinite(target) || reduced) {
        el.textContent = String(target);
        countObserver.unobserve(el);
        return;
      }
      const decimals = String(target).includes('.') ? 1 : 0;
      const start = performance.now();
      const duration = 850;
      function tick(now) {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(decimals);
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target.toFixed(decimals);
      }
      requestAnimationFrame(tick);
      countObserver.unobserve(el);
    });
  }, { threshold: .55 });
  counters.forEach(el => countObserver.observe(el));
  if (fine && !reduced) {
    qa('.career-case,.capability-deep-grid article,.project-card,.evidence-grid article').forEach(card => {
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--card-x', `${x}%`);
        card.style.setProperty('--card-y', `${y}%`);
      }, { passive: true });
    });
  }
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('section-arrived');
      setTimeout(() => entry.target.classList.remove('section-arrived'), 900);
    });
  }, { threshold: .22 });
  qa('.portfolio-profile,.career-deep,.capability-deep,.projects-section,.now-deep').forEach(section => sectionObserver.observe(section));
})();
