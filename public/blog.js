(() => {
  const input = document.querySelector('#blog-search');
  const buttons = [...document.querySelectorAll('[data-blog-filter]')];
  const cards = [...document.querySelectorAll('[data-blog-card]')];
  const count = document.querySelector('#blog-result-count');
  const empty = document.querySelector('#blog-empty');
  if (!input || !cards.length) return;

  let category = 'all';
  const filter = () => {
    const query = input.value.trim().toLowerCase();
    let visible = 0;
    for (const card of cards) {
      const categoryMatch = category === 'all' || card.dataset.category === category;
      const textMatch = !query || `${card.dataset.title} ${card.dataset.keywords}`.includes(query);
      card.hidden = !(categoryMatch && textMatch);
      if (!card.hidden) visible += 1;
    }
    count.textContent = `${visible} article${visible === 1 ? '' : 's'}`;
    empty.hidden = visible !== 0;
  };

  input.addEventListener('input', filter);
  for (const button of buttons) button.addEventListener('click', () => {
    category = button.dataset.blogFilter;
    for (const candidate of buttons) candidate.classList.toggle('active', candidate === button);
    filter();
  });
})();
