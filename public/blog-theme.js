(() => {
  const key = 'searya-client-state-v1';
  const button = document.querySelector('#blog-theme-toggle');
  const setLabel = () => {
    if (!button) return;
    const dark = document.documentElement.classList.contains('dark');
    button.title = dark ? 'Switch to light theme' : 'Switch to dark theme';
    button.setAttribute('aria-label', button.title);
  };

  setLabel();
  button?.addEventListener('click', () => {
    const dark = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', dark);
    try {
      const saved = JSON.parse(localStorage.getItem(key) || '{}');
      localStorage.setItem(key, JSON.stringify({ ...saved, theme: dark ? 'dark' : 'light' }));
    } catch {
      // Theme switching remains available if browser storage is disabled.
    }
    setLabel();
  });
})();
