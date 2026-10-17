(() => {
  const $ = (selector) => document.querySelector(selector);
  const state = { root: null, items: [], selected: null };
  const fields = ['id','name','type','kind','price','upc','quantity','condition','status','published','description','checkout'];
  const typeFromName = (name) => {
    const lower = name.toLowerCase();
    if (lower.startsWith('hj-') || lower.includes('happyjar')) return 'happy-jarz';
    if (lower.startsWith('bloomslice')) return 'bloomslice';
    if (lower.startsWith('bloomtrelis')) return 'bloomtrelis';
    return 'other';
  };
  const defaultTitle = (id) => id.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  const typeName = (type) => ({'happy-jarz':'Happy Jarz',bloomslice:'BloomSlice',bloomtrelis:'Bloomtrelis',other:'Other'}[type] || 'Other');

  async function connect() {
    if (!window.showDirectoryPicker) {
      $('#folder-state').textContent = 'This browser does not support local folder editing. Use current Chrome or Edge on localhost/HTTPS.';
      return;
    }
    try {
      state.root = await window.showDirectoryPicker({ mode: 'readwrite' });
      $('#folder-state').textContent = `Connected: ${state.root.name}. Catalog files will be written only after you save.`;
      await loadCatalog();
    } catch (error) { if (error.name !== 'AbortError') $('#folder-state').textContent = `Folder access failed: ${error.message}`; }
  }

  async function subdir(root, path, create = false) {
    let current = root;
    for (const piece of path.split('/').filter(Boolean)) current = await current.getDirectoryHandle(piece, { create });
    return current;
  }

  async function loadCatalog() {
    if (!state.root) return;
    try {
      const dir = await subdir(state.root, 'data');
      const handle = await dir.getFileHandle('catalog.json');
      const file = await handle.getFile();
      const catalog = JSON.parse(await file.text());
      state.items = Array.isArray(catalog.items) ? catalog.items : [];
      renderRows(); $('#edit-state').textContent = `Loaded ${state.items.length} listing(s).`;
    } catch (error) {
      state.items = [];
      renderRows();
      $('#edit-state').textContent = 'Could not read data/catalog.json. Make sure you selected the repository root folder.';
    }
  }

  async function writeCatalog() {
    if (!state.root) throw new Error('Select your local repository folder first.');
    const dir = await subdir(state.root, 'data', true);
    const handle = await dir.getFileHandle('catalog.json', { create: true });
    const writable = await handle.createWritable();
    await writable.write(`${JSON.stringify({ version: 1, items: state.items }, null, 2)}\n`);
    await writable.close();
  }

  async function saveImage(file) {
    const dir = await subdir(state.root, 'assets/products', true);
    const handle = await dir.getFileHandle(file.name, { create: true });
    const writable = await handle.createWritable();
    await writable.write(file);
    await writable.close();
  }

  function renderRows() {
    const body = $('#catalog-rows'); body.innerHTML = '';
    state.items.forEach((item) => {
      const row = document.createElement('tr'); row.tabIndex = 0; row.style.cursor = 'pointer';
      [item.id, item.name, typeName(item.type), item.status, item.price === '' || item.price == null ? '—' : `$${Number(item.price).toFixed(2)}`].forEach((value) => { const cell = document.createElement('td'); cell.textContent = value || '—'; row.append(cell); });
      row.addEventListener('click', () => selectItem(item.id));
      row.addEventListener('keydown', (event) => { if (event.key === 'Enter') selectItem(item.id); });
      body.append(row);
    });
    if (!state.items.length) { const row = document.createElement('tr'); const cell = document.createElement('td'); cell.colSpan = 5; cell.textContent = 'No listings yet. Connect the repo folder and add your first photo batch.'; row.append(cell); body.append(row); }
  }

  function formItem() {
    const read = (name) => $(`#field-${name}`).value;
    return {
      id: read('id').trim(), name: read('name').trim(), type: read('type'), kind: read('kind'),
      price: read('price') === '' ? '' : Number(read('price')), upc: read('upc').trim(),
      quantity: Number(read('quantity') || 1), condition: read('condition'), status: read('status'),
      published: read('published') === 'true', description: read('description').trim(),
      checkoutUrl: read('checkout').trim(), image: state.items.find((item) => item.id === state.selected)?.image || ''
    };
  }

  function populate(item) {
    const values = { id: item.id, name: item.name, type: item.type || 'other', kind: item.kind || 'unique', price: item.price, upc: item.upc, quantity: item.quantity || 1, condition: item.condition || 'handmade', status: item.status || 'draft', published: String(item.published === true), description: item.description, checkout: item.checkoutUrl };
    fields.forEach((field) => { const element = $(`#field-${field}`); if (element) element.value = values[field] ?? ''; });
    state.selected = item.id;
    $('#edit-state').textContent = `Editing ${item.id}`;
  }

  function selectItem(id) { const item = state.items.find((record) => record.id === id); if (item) populate(item); }
  function blank() { state.selected = null; $('#item-form').reset(); $('#field-quantity').value = 1; $('#field-status').value = 'draft'; $('#field-published').value = 'false'; $('#edit-state').textContent = 'New listing. Set its ID and details, then save.'; }

  async function importFiles(files) {
    const list = [...files].filter((file) => /^image\/(jpeg|png|webp|gif)$/.test(file.type));
    if (!list.length) { $('#import-state').textContent = 'No supported image files selected.'; return; }
    if (!state.root) { $('#import-state').textContent = 'Select the local repo folder first.'; return; }
    let added = 0, skipped = 0;
    for (const file of list) {
      const id = file.name.replace(/\.[^.]+$/, '');
      if (state.items.some((item) => item.id.toLowerCase() === id.toLowerCase())) { skipped++; continue; }
      try {
        await saveImage(file);
        state.items.push({ id, name: defaultTitle(id), type: typeFromName(id), kind: typeFromName(id) === 'happy-jarz' ? 'unique' : 'stock', price: '', upc: '', quantity: 1, condition: 'handmade', status: 'draft', published: false, description: '', checkoutUrl: '', image: file.name });
        added++;
      } catch (error) { $('#import-state').textContent = `Could not save ${file.name}: ${error.message}`; }
    }
    if (added) await writeCatalog();
    renderRows();
    $('#import-state').textContent = `${added} photo(s) added as draft${added === 1 ? '' : 's'}${skipped ? ` · ${skipped} duplicate ID(s) skipped` : ''}. Select a row to finish each listing.`;
    if (added) selectItem(state.items[state.items.length - added].id);
    $('#photo-files').value = '';
  }

  $('#connect-folder').addEventListener('click', connect);
  $('#reload-catalog').addEventListener('click', loadCatalog);
  $('#item-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const item = formItem();
      if (!item.id) throw new Error('Add an item ID.');
      const existing = state.items.findIndex((record) => record.id === state.selected);
      if (state.items.some((record, index) => record.id.toLowerCase() === item.id.toLowerCase() && index !== existing)) throw new Error('That item ID already exists.');
      if (existing >= 0) state.items[existing] = item; else state.items.push(item);
      state.selected = item.id;
      await writeCatalog(); renderRows(); $('#edit-state').textContent = `Saved ${item.id} to data/catalog.json.`;
    } catch (error) { $('#edit-state').textContent = error.message; }
  });
  $('#new-item').addEventListener('click', blank);
  $('#remove-item').addEventListener('click', async () => {
    if (!state.selected) { $('#edit-state').textContent = 'Select a saved item first.'; return; }
    state.items = state.items.filter((item) => item.id !== state.selected);
    try { await writeCatalog(); renderRows(); blank(); $('#edit-state').textContent = 'Listing removed from catalog. Its photo file stays in the repo.'; }
    catch (error) { $('#edit-state').textContent = error.message; }
  });
  $('#photo-files').addEventListener('change', (event) => importFiles(event.target.files));
  const zone = $('#upload-zone');
  ['dragenter','dragover'].forEach((name) => zone.addEventListener(name, (event) => { event.preventDefault(); zone.classList.add('dragging'); }));
  ['dragleave','drop'].forEach((name) => zone.addEventListener(name, (event) => { event.preventDefault(); zone.classList.remove('dragging'); }));
  zone.addEventListener('drop', (event) => importFiles(event.dataTransfer.files));
  renderRows();
})();
