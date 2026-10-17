(() => {
  const TYPES = [
    { id: 'all', label: 'ALL ITEMS' },
    { id: 'happy-jarz', label: 'HAPPY JARZ' },
    { id: 'bloomslice', label: 'BLOOMSLICE' },
    { id: 'bloomtrelis', label: 'BLOOMTRELIS' },
    { id: 'other', label: 'OTHER BUILDS' }
  ];
  const TYPE_NAMES = { 'happy-jarz': 'HAPPY JARZ', bloomslice: 'BLOOMSLICE', bloomtrelis: 'BLOOMTRELIS', other: 'OTHER BUILDS' };
  const money = (value) => value === '' || value === null || value === undefined ? '' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));
  const cleanImage = (name) => `./assets/products/${encodeURIComponent(name || '')}`;
  let allItems = [];
  let activeType = 'all';
  const grid = document.querySelector('#product-grid');
  if (!grid) return;

  const filters = document.querySelector('#type-filters');
  const count = document.querySelector('#inventory-total');
  const empty = document.querySelector('#empty-state');
  const hudItems = [...document.querySelectorAll('.hud-item[data-filter]')];

  function itemCard(item) {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `View ${item.name || item.id}`);
    const photo = document.createElement('div');
    photo.className = 'product-photo';
    if (item.image) {
      const img = document.createElement('img');
      img.src = cleanImage(item.image);
      img.alt = item.imageAlt || item.name || item.id;
      img.loading = 'lazy';
      img.onerror = () => { photo.innerHTML = ''; fallback(photo, item.id); };
      photo.append(img);
    } else fallback(photo, 'PHOTO SLOT');
    const corner = document.createElement('span'); corner.className = 'product-corner'; corner.textContent = TYPE_NAMES[item.type] || 'FIELD OBJECT';
    const tag = document.createElement('span'); tag.className = 'status-tag'; tag.textContent = item.kind === 'unique' ? 'ONE OF ONE' : 'SMALL RUN';
    photo.append(corner, tag);
    const info = document.createElement('div'); info.className = 'product-info';
    const meta = document.createElement('div'); meta.className = 'product-meta';
    meta.innerHTML = `<span>${item.condition === 'new' ? 'NEW BUILD' : item.condition === 'prototype' ? 'PROTOTYPE' : 'MAKER GOODS'}</span><span>VIEW DETAILS ↗</span>`;
    const name = document.createElement('h3'); name.className = 'product-name'; name.textContent = item.name || item.id;
    const desc = document.createElement('p'); desc.className = 'product-description'; desc.textContent = item.description || 'Details for this piece are being added.';
    const bottom = document.createElement('div'); bottom.className = 'product-card-bottom';
    const id = document.createElement('span'); id.className = 'product-id'; id.textContent = item.id;
    const price = document.createElement('span'); price.className = 'product-price'; price.textContent = money(item.price) || 'PRICE TBD';
    bottom.append(id, price); info.append(meta, name, desc, bottom); card.append(photo, info);
    const open = () => showDetails(item);
    card.addEventListener('click', open);
    card.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
    return card;
  }

  function fallback(target, label) {
    const box = document.createElement('div'); box.className = 'photo-fallback';
    const span = document.createElement('span'); span.textContent = label;
    box.append(span); target.append(box);
  }

  function renderFilters() {
    filters.innerHTML = '';
    TYPES.forEach((type) => {
      const button = document.createElement('button'); button.type = 'button';
      button.className = `filter-pill${activeType === type.id ? ' active' : ''}`;
      button.textContent = type.label;
      button.addEventListener('click', () => setFilter(type.id));
      filters.append(button);
    });
  }

  function setFilter(type) {
    activeType = type;
    renderFilters();
    hudItems.forEach((link) => link.classList.toggle('is-active', link.dataset.filter === type));
    renderItems();
  }

  function renderItems() {
    const visible = allItems.filter((item) => item.status === 'available' && item.published !== false && (activeType === 'all' || item.type === activeType));
    grid.innerHTML = '';
    visible.forEach((item) => grid.append(itemCard(item)));
    count.textContent = `${visible.length} ${visible.length === 1 ? 'ITEM' : 'ITEMS'}`;
    empty.hidden = visible.length > 0;
    grid.hidden = visible.length === 0;
  }

  const dialog = document.querySelector('#item-dialog');
  function showDetails(item) {
    const photo = document.querySelector('#dialog-photo'); photo.innerHTML = '';
    if (item.image) { const img = document.createElement('img'); img.src = cleanImage(item.image); img.alt = item.imageAlt || item.name || item.id; img.onerror = () => fallback(photo, 'PHOTO SLOT'); photo.append(img); }
    else fallback(photo, 'PHOTO SLOT');
    document.querySelector('#dialog-type').textContent = TYPE_NAMES[item.type] || 'FIELD OBJECT';
    document.querySelector('#dialog-title').textContent = item.name || item.id;
    document.querySelector('#dialog-id').textContent = `ITEM ID / ${item.id}`;
    document.querySelector('#dialog-description').textContent = item.description || 'Details for this piece are being added.';
    const specs = document.querySelector('#dialog-specs'); specs.innerHTML = '';
    const entries = [['BUILD', item.condition || 'handmade'], ['UPC', item.upc || '—'], ['AVAILABILITY', item.kind === 'unique' ? 'One individual piece' : `${item.quantity || 1} in this run`]];
    entries.forEach(([label, value]) => { const dt = document.createElement('dt'); dt.textContent = label; const dd = document.createElement('dd'); dd.textContent = value; specs.append(dt, dd); });
    const buy = document.querySelector('#dialog-buy'); buy.innerHTML = '';
    if (item.checkoutUrl) { const a = document.createElement('a'); a.className = 'button button-primary'; a.href = item.checkoutUrl; a.target = '_blank'; a.rel = 'noreferrer'; a.innerHTML = '<span>CONTINUE TO SPIRALSIDE</span><b aria-hidden="true">↗</b>'; buy.append(a); }
    else { const button = document.createElement('button'); button.className = 'button button-disabled'; button.type = 'button'; button.disabled = true; button.innerHTML = '<span>CHECKOUT LINK PENDING</span><b aria-hidden="true">↗</b>'; buy.append(button); }
    dialog.showModal();
  }
  document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  hudItems.forEach((link) => link.addEventListener('click', () => setFilter(link.dataset.filter)));

  fetch('./data/catalog.json').then((response) => response.ok ? response.json() : []).then((data) => {
    allItems = Array.isArray(data.items) ? data.items : [];
    const hash = location.hash.replace('#', '');
    if (TYPES.some((type) => type.id === hash)) activeType = hash;
    renderFilters(); renderItems();
  }).catch(() => { allItems = []; renderFilters(); renderItems(); });
})();
