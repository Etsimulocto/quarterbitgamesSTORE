(() => {
  const $ = (selector) => document.querySelector(selector);
  const state = { root: null, items: [], photos: [], selected: null, currentImage: '', foldersFound: 0 };
  const fields = ['id','name','type','kind','price','upc','quantity','condition','status','published','description','imageAlt','checkout'];
  const typeFromName = (name) => {
    const lower = name.toLowerCase();
    if (lower.startsWith('hj-') || lower.includes('happyjar')) return 'happy-jarz';
    if (lower.startsWith('bloomslice')) return 'bloomslice';
    if (lower.startsWith('bloomtrelis')) return 'bloomtrelis';
    return 'other';
  };
  const defaultTitle = (id) => id.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  const typeName = (type) => ({'happy-jarz':'Happy Jarz',bloomslice:'BloomSlice',bloomtrelis:'Bloomtrelis',other:'Other'}[type] || 'Other');
  const supportedImage = (name) => /\.(jpe?g|png|webp|gif)$/i.test(name);
  const publicImageUrl = (image) => {
    const value = String(image || '');
    if (value.startsWith('photos-to-add/')) return `./photos-to-add/${encodeURIComponent(value.slice('photos-to-add/'.length))}`;
    if (value.startsWith('assets/products/')) return `./assets/products/${encodeURIComponent(value.slice('assets/products/'.length))}`;
    return `./assets/products/${encodeURIComponent(value)}`;
  };

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
      renderRows();
      await scanPhotos();
      $('#edit-state').textContent = `Loaded ${state.items.length} listing(s). Select any photo below to edit its listing.`;
    } catch (error) {
      renderRows();
      const selectedName = state.root?.name || 'selected folder';
      state.root = null;
      $('#folder-state').textContent = `Could not load data/catalog.json from ${selectedName}. Select the repository root folder (the one containing index.html, data, and assets).`;
      $('#edit-state').textContent = 'Read-only catalog preview is shown below. Select the repository root folder to save edits.';
      showCatalogPreview();
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

  async function scanPhotos() {
    if (!state.root) {
      $('#photo-library-state').textContent = 'Connect your local repository folder first. The catalog photo previews above can be viewed without it.';
      return;
    }
    state.photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    state.photos = [];
    let foldersFound = 0;
    for (const folder of ['photos-to-add', 'assets/products']) {
      let dir;
      try { dir = await subdir(state.root, folder); foldersFound++; }
      catch (error) { if (error.name !== 'NotFoundError') console.warn(`Cannot read ${folder}:`, error); continue; }
      for await (const [name, handle] of dir.entries()) {
        if (handle.kind !== 'file' || !supportedImage(name)) continue;
        try {
          const file = await handle.getFile();
          const catalogImage = folder === 'photos-to-add' ? `${folder}/${name}` : name;
          const id = name.replace(/\.[^.]+$/, '');
          const item = state.items.find((record) => String(record.image || '').toLowerCase() === catalogImage.toLowerCase())
            || state.items.find((record) => String(record.id || '').toLowerCase() === id.toLowerCase());
          state.photos.push({ name, id, folder, catalogImage, file, previewUrl: URL.createObjectURL(file), itemId: item?.id || null, status: item?.status || 'NEW DRAFT' });
        } catch (error) { console.warn(`Cannot read image ${folder}/${name}:`, error); }
      }
    }
    state.foldersFound = foldersFound;
    state.photos.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    renderPhotoLibrary(foldersFound);
  }

  function showCatalogPreview() {
    state.photos = state.items.filter((item) => item.image).map((item) => {
      const image = String(item.image);
      const inbox = image.startsWith('photos-to-add/');
      const name = image.split('/').pop();
      return { name, id: item.id, folder: inbox ? 'photos-to-add' : 'assets/products', catalogImage: image, previewUrl: publicImageUrl(image), itemId: item.id, status: item.status || 'draft', remotePreview: true };
    });
    state.foldersFound = 2;
    renderPhotoLibrary(2);
    $('#photo-library-state').textContent = `${state.photos.length} catalog photo(s) loaded. Connect the local repo folder to scan every image and save edits.`;
  }

  function renderPhotoLibrary(foldersFound = 0) {
    const library = $('#photo-library'); library.innerHTML = '';
    const status = $('#photo-library-state');
    if (!state.photos.length) {
      const empty = document.createElement('div'); empty.className = 'photo-library-empty';
      empty.textContent = foldersFound ? 'No photos found in photos-to-add or assets/products yet.' : 'Could not find the photo folders. Check that you selected the repository root.';
      library.append(empty);
      status.textContent = '0 photos found.';
      return;
    }
    state.photos.forEach((photo) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = `photo-tile${state.selected === photo.itemId && photo.itemId ? ' is-selected' : ''}`;
      button.setAttribute('aria-label', `${photo.name}, ${photo.status}. Select to edit listing.`);
      const img = document.createElement('img'); img.src = photo.previewUrl; img.alt = '';
      const copy = document.createElement('span'); copy.className = 'photo-tile-copy';
      const name = document.createElement('span'); name.className = 'photo-tile-name'; name.textContent = photo.name;
      const meta = document.createElement('span'); meta.className = 'photo-tile-meta';
      const folder = document.createElement('span'); folder.textContent = photo.folder === 'assets/products' ? 'PRODUCT PHOTO' : 'PHOTO INBOX';
      const stateLabel = document.createElement('b'); stateLabel.textContent = photo.status === 'NEW DRAFT' ? 'NEW' : String(photo.status || 'DRAFT').toUpperCase();
      meta.append(folder, stateLabel); copy.append(name, meta); button.append(img, copy);
      button.addEventListener('click', () => selectPhoto(photo));
      library.append(button);
    });
    status.textContent = `${state.photos.length} photo(s) found. Select one to edit or create its listing.`;
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
      published: read('published') === 'true', description: read('description').trim(), imageAlt: read('imageAlt').trim(),
      checkoutUrl: read('checkout').trim(), image: state.currentImage
    };
  }

  function populate(item) {
    const values = { id: item.id, name: item.name, type: item.type || 'other', kind: item.kind || 'unique', price: item.price, upc: item.upc, quantity: item.quantity || 1, condition: item.condition || 'handmade', status: item.status || 'draft', published: String(item.published === true), description: item.description, imageAlt: item.imageAlt, checkout: item.checkoutUrl };
    fields.forEach((field) => { const element = $(`#field-${field}`); if (element) element.value = values[field] ?? ''; });
    state.selected = item.id;
    state.currentImage = item.image || '';
    $('#edit-state').textContent = `Editing ${item.id}`;
    renderPhotoLibrary(state.foldersFound);
  }

  function selectItem(id) {
    const item = state.items.find((record) => record.id === id);
    if (item) populate(item);
  }

  function selectPhoto(photo) {
    const item = state.items.find((record) => String(record.image || '').toLowerCase() === photo.catalogImage.toLowerCase())
      || state.items.find((record) => String(record.id || '').toLowerCase() === photo.id.toLowerCase());
    if (item) {
      populate(item);
      $('#photo-library-state').textContent = `Selected ${photo.name} · editing ${item.id}.`;
      return;
    }
    populate({ id: photo.id, name: defaultTitle(photo.id), type: typeFromName(photo.id), kind: typeFromName(photo.id) === 'happy-jarz' ? 'unique' : 'stock', price: '', upc: '', quantity: 1, condition: 'prototype', status: 'draft', published: false, description: '', imageAlt: photo.name, checkoutUrl: '', image: photo.catalogImage });
    $('#photo-library-state').textContent = `Selected ${photo.name} · new draft. Save its details to add it to the catalog.`;
  }

  function blank() {
    state.selected = null; state.currentImage = ''; $('#item-form').reset(); $('#field-quantity').value = 1;
    $('#field-status').value = 'draft'; $('#field-published').value = 'false';
    $('#edit-state').textContent = 'New listing. Set its ID and details, then save.';
    renderPhotoLibrary(state.foldersFound);
  }

  async function importFiles(files) {
    const list = [...files].filter((file) => /^image\/(jpeg|png|webp|gif)$/.test(file.type) || supportedImage(file.name));
    if (!list.length) { $('#import-state').textContent = 'No supported image files selected.'; return; }
    if (!state.root) { $('#import-state').textContent = 'Select the local repo folder first.'; return; }
    let added = 0, skipped = 0;
    for (const file of list) {
      const id = file.name.replace(/\.[^.]+$/, '');
      if (state.items.some((item) => item.id.toLowerCase() === id.toLowerCase())) { skipped++; continue; }
      try {
        await saveImage(file);
        state.items.push({ id, name: defaultTitle(id), type: typeFromName(id), kind: typeFromName(id) === 'happy-jarz' ? 'unique' : 'stock', price: '', upc: '', quantity: 1, condition: 'handmade', status: 'draft', published: false, description: '', checkoutUrl: '', image: file.name, imageAlt: file.name });
        added++;
      } catch (error) { $('#import-state').textContent = `Could not save ${file.name}: ${error.message}`; }
    }
    if (added) await writeCatalog();
    renderRows(); await scanPhotos();
    $('#import-state').textContent = `${added} photo(s) added as draft${added === 1 ? '' : 's'}${skipped ? ` · ${skipped} duplicate ID(s) skipped` : ''}. Select any photo in the library to edit it.`;
    if (added) selectItem(state.items[state.items.length - added].id);
    $('#photo-files').value = '';
  }


  const orderStoreKey = 'bloomcore-market-orders-v1';
  const orderState = { orders: [], selectedId: null };
  const orderStatusLabel = (status) => ({
    'awaiting-shipping':'WAITING FOR SHIPPING', 'ready-to-invoice':'READY TO INVOICE',
    invoiced:'INVOICED', paid:'PAID', shipped:'SHIPPED'
  }[status] || 'WAITING FOR SHIPPING');
  const money = (value) => `${Number(value || 0).toFixed(2)}`;
  function nextOrderRef() {
    const now = new Date();
    const date = [now.getFullYear(), String(now.getMonth()+1).padStart(2,'0'), String(now.getDate()).padStart(2,'0')].join('');
    return `BC-${date}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
  }
  function loadOrders() {
    try {
      const saved = JSON.parse(localStorage.getItem(orderStoreKey) || '[]');
      orderState.orders = Array.isArray(saved) ? saved : [];
    } catch (error) {
      orderState.orders = [];
      $('#order-state').textContent = 'Could not read local order records in this browser.';
    }
  }
  function orderFormValue() {
    return {
      id: $('#order-ref').value.trim(),
      buyer: $('#order-buyer').value.trim(),
      email: $('#order-email').value.trim(),
      items: $('#order-items').value.trim(),
      subtotal: Number($('#order-subtotal').value),
      shipping: $('#order-shipping').value === '' ? null : Number($('#order-shipping').value),
      status: $('#order-status').value,
      updatedAt: new Date().toISOString()
    };
  }
  function updateOrderTotal() {
    const subtotal = Number($('#order-subtotal').value || 0);
    const shippingRaw = $('#order-shipping').value;
    const total = subtotal + Number(shippingRaw || 0);
    $('#order-total').textContent = money(total);
    const ready = shippingRaw !== '' && Number.isFinite(subtotal) && Number.isFinite(Number(shippingRaw));
    $('#copy-invoice').disabled = !ready;
    $('#order-total-note').textContent = ready
      ? 'Shipping is included. Copy the details, then review the invoice in PayPal before sending.'
      : 'Enter the actual shipping amount before preparing the invoice.';
  }
  function renderOrders() {
    const body = $('#order-rows');
    body.innerHTML = '';
    const sorted = [...orderState.orders].sort((a,b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
    if (!sorted.length) {
      const row = document.createElement('tr'); const cell = document.createElement('td');
      cell.colSpan = 5; cell.textContent = 'No orders logged yet. Add one when an order comes in.';
      row.append(cell); body.append(row); return;
    }
    sorted.forEach((order) => {
      const row = document.createElement('tr');
      [order.id, order.buyer || order.email || '—', orderStatusLabel(order.status), order.shipping == null ? 'Shipping pending' : money(Number(order.subtotal) + Number(order.shipping))]
        .forEach((value) => { const cell=document.createElement('td'); cell.textContent=value; row.append(cell); });
      const action=document.createElement('td'); const button=document.createElement('button');
      button.type='button'; button.className='order-edit-button'; button.textContent='OPEN';
      button.addEventListener('click', () => selectOrder(order.id));
      action.append(button); row.append(action); body.append(row);
    });
  }
  function selectOrder(id) {
    const order = orderState.orders.find((record) => record.id === id);
    if (!order) return;
    orderState.selectedId = id;
    $('#order-ref').value = order.id;
    $('#order-buyer').value = order.buyer || '';
    $('#order-email').value = order.email || '';
    $('#order-items').value = order.items || '';
    $('#order-subtotal').value = order.subtotal ?? '';
    $('#order-shipping').value = order.shipping ?? '';
    $('#order-status').value = order.status || 'awaiting-shipping';
    $('#delete-order').disabled = false;
    $('#order-state').textContent = `Editing ${id}. Order details are stored only in this browser.`;
    updateOrderTotal();
  }
  function resetOrder() {
    orderState.selectedId = null;
    $('#order-form').reset();
    $('#order-ref').value = nextOrderRef();
    $('#order-status').value = 'awaiting-shipping';
    $('#delete-order').disabled = true;
    $('#invoice-copy-text').value = '';
    $('#order-state').textContent = 'New order. Buyer and order information stays in this browser.';
    updateOrderTotal();
  }
  function invoiceText(order) {
    return [
      'Bloomcore Market · PayPal invoice',
      `Order reference: ${order.id}`,
      `Buyer: ${order.buyer || '(add buyer name in PayPal)'}`,
      `Buyer email: ${order.email || '(enter buyer email in PayPal)'}`,
      `Items: ${order.items}`,
      `Items subtotal: ${money(order.subtotal)}`,
      `Shipping: ${money(order.shipping)}`,
      `TOTAL DUE: ${money(Number(order.subtotal) + Number(order.shipping))}`
    ].join('\\n');
  }
  $('#order-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const order = orderFormValue();
    if (!order.id || !order.items || !Number.isFinite(order.subtotal) || order.subtotal < 0) {
      $('#order-state').textContent = 'Add an order reference, item summary, and valid item subtotal.';
      return;
    }
    if (order.shipping !== null && (!Number.isFinite(order.shipping) || order.shipping < 0)) {
      $('#order-state').textContent = 'Shipping must be zero or a positive amount.';
      return;
    }
    if (order.shipping !== null && order.status === 'awaiting-shipping') order.status = 'ready-to-invoice';
    const existing = orderState.orders.findIndex((record) => record.id === orderState.selectedId);
    if (existing >= 0) orderState.orders[existing] = order;
    else if (orderState.orders.some((record) => record.id.toLowerCase() === order.id.toLowerCase())) {
      $('#order-state').textContent = 'That order reference already exists. Open it from the queue to edit it.';
      return;
    } else orderState.orders.push(order);
    orderState.selectedId = order.id;
    try {
      localStorage.setItem(orderStoreKey, JSON.stringify(orderState.orders));
      $('#order-status').value = order.status;
      $('#delete-order').disabled = false;
      $('#order-state').textContent = order.shipping === null
        ? `Saved ${order.id}. Add the shipping charge when you know it; the invoice copy button will become available.`
        : `Saved ${order.id}. Total due: ${money(order.subtotal + order.shipping)}. Review and send the invoice in PayPal.`;
      renderOrders(); updateOrderTotal();
    } catch (error) {
      $('#order-state').textContent = 'Browser storage could not save this order. Check browser storage settings.';
    }
  });
  $('#order-subtotal').addEventListener('input', updateOrderTotal);
  $('#order-shipping').addEventListener('input', updateOrderTotal);
  $('#order-status').addEventListener('change', () => {
    const order = orderState.orders.find((record) => record.id === orderState.selectedId);
    if (order) { order.status = $('#order-status').value; order.updatedAt = new Date().toISOString(); }
  });
  $('#copy-invoice').addEventListener('click', async () => {
    const order = orderFormValue();
    if (order.shipping === null) { $('#order-state').textContent = 'Enter shipping first so the invoice includes the full total.'; return; }
    if (!order.id || !order.items || !Number.isFinite(order.subtotal)) { $('#order-state').textContent = 'Save the order details before preparing the invoice.'; return; }
    const text = invoiceText(order);
    $('#invoice-copy-text').value = text;
    try {
      await navigator.clipboard.writeText(text);
      $('#order-state').textContent = 'Invoice details copied. Open PayPal, enter/review the buyer and amounts, then send the invoice there.';
    } catch (error) {
      $('#invoice-copy-text').focus(); $('#invoice-copy-text').select();
      $('#order-state').textContent = 'Select and copy the invoice details below, then paste them into PayPal and review before sending.';
    }
  });
  $('#new-order').addEventListener('click', resetOrder);
  $('#delete-order').addEventListener('click', () => {
    if (!orderState.selectedId) return;
    orderState.orders = orderState.orders.filter((record) => record.id !== orderState.selectedId);
    try {
      localStorage.setItem(orderStoreKey, JSON.stringify(orderState.orders));
      renderOrders(); resetOrder();
      $('#order-state').textContent = 'Order removed from this browser.';
    } catch (error) { $('#order-state').textContent = 'Could not update browser order storage.'; }
  });
  loadOrders(); renderOrders(); resetOrder();

  $('#connect-folder').addEventListener('click', connect);
  $('#reload-catalog').addEventListener('click', loadCatalog);
  $('#scan-photos').addEventListener('click', scanPhotos);
  $('#item-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      if (!state.root) throw new Error('Read-only preview: select the local repository root folder before saving edits.');
      const item = formItem();
      if (!item.id) throw new Error('Add an item ID.');
      const existing = state.items.findIndex((record) => record.id === state.selected);
      if (state.items.some((record, index) => record.id.toLowerCase() === item.id.toLowerCase() && index !== existing)) throw new Error('That item ID already exists.');
      if (existing >= 0) state.items[existing] = item; else state.items.push(item);
      state.selected = item.id;
      await writeCatalog(); renderRows(); await scanPhotos();
      $('#edit-state').textContent = `Saved ${item.id} to data/catalog.json. You can change its status and public visibility here.`;
    } catch (error) { $('#edit-state').textContent = error.message; }
  });
  $('#new-item').addEventListener('click', blank);
  $('#remove-item').addEventListener('click', async () => {
    if (!state.selected) { $('#edit-state').textContent = 'Select a saved item first.'; return; }
    if (!state.root) { $('#edit-state').textContent = 'Read-only preview: select the local repository root folder before removing a listing.'; return; }
    state.items = state.items.filter((item) => item.id !== state.selected);
    try { await writeCatalog(); renderRows(); blank(); await scanPhotos(); $('#edit-state').textContent = 'Listing removed from catalog. Its photo file stays in the repo photo library.'; }
    catch (error) { $('#edit-state').textContent = error.message; }
  });
  $('#photo-files').addEventListener('change', (event) => importFiles(event.target.files));
  const zone = $('#upload-zone');
  ['dragenter','dragover'].forEach((name) => zone.addEventListener(name, (event) => { event.preventDefault(); zone.classList.add('dragging'); }));
  ['dragleave','drop'].forEach((name) => zone.addEventListener(name, (event) => { event.preventDefault(); zone.classList.remove('dragging'); }));
  zone.addEventListener('drop', (event) => importFiles(event.dataTransfer.files));
  renderRows();
  fetch('./data/catalog.json').then((response) => response.ok ? response.json() : Promise.reject(new Error('Catalog file not available.'))).then((catalog) => {
    if (state.root) return;
    state.items = Array.isArray(catalog.items) ? catalog.items : [];
    renderRows(); showCatalogPreview();
    $('#folder-state').textContent = 'Catalog loaded for preview. Select your local repo folder to edit and save listings.';
    $('#edit-state').textContent = `Showing ${state.items.length} catalog listing(s) in read-only preview.`;
  }).catch(() => {
    $('#folder-state').textContent = 'Select your local repo folder to load photos and edit listings.';
  });
})();
