(() => {
  const token = sessionStorage.getItem('kofo_token');
  const albumData = sessionStorage.getItem('kofo_album');

  if (!token || !albumData) {
    window.location.href = '/';
    return;
  }

  const album = JSON.parse(albumData);
  const headers = { Authorization: `Bearer ${token}` };

  // State
  let photos = [];
  let selected = new Set();
  let lightboxIndex = -1;

  // DOM refs
  const titleEl = document.getElementById('album-title');
  const skeletonGrid = document.getElementById('skeleton-grid');
  const photoGrid = document.getElementById('photo-grid');
  const errorEl = document.getElementById('gallery-error');
  const selCountEl = document.getElementById('selection-count');
  const selectAllBtn = document.getElementById('select-all-btn');
  const downloadBtn = document.getElementById('download-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCounter = document.getElementById('lightbox-counter');

  titleEl.textContent = album.name;
  document.title = `${album.name} — Kofo Photography`;

  // ─── Load photos ───
  async function loadPhotos() {
    try {
      const res = await fetch('/api/photos', { headers });
      if (res.status === 401) {
        sessionStorage.clear();
        window.location.href = '/';
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      photos = data.photos;
      renderGrid();
    } catch (err) {
      skeletonGrid.style.display = 'none';
      errorEl.textContent = err.message || 'Failed to load photos';
      errorEl.style.display = 'block';
    }
  }

  // ─── Render grid ───
  function renderGrid() {
    skeletonGrid.style.display = 'none';
    photoGrid.style.display = '';
    photoGrid.innerHTML = '';

    photos.forEach((photo, i) => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.dataset.index = i;

      item.innerHTML = `
        <label class="checkbox-wrapper" onclick="event.stopPropagation()">
          <input type="checkbox" data-name="${encodeURIComponent(photo.name)}" />
          <span class="checkmark"></span>
        </label>
        <img src="${photo.url}" alt="${photo.name}" loading="lazy" />
      `;

      // Click image -> lightbox
      item.addEventListener('click', () => openLightbox(i));

      // Checkbox change
      const cb = item.querySelector('input[type="checkbox"]');
      cb.addEventListener('change', () => {
        if (cb.checked) {
          selected.add(photo.name);
          item.classList.add('selected');
        } else {
          selected.delete(photo.name);
          item.classList.remove('selected');
        }
        updateSelectionUI();
      });

      photoGrid.appendChild(item);
    });
  }

  // ─── Selection UI ───
  function updateSelectionUI() {
    const count = selected.size;
    if (count > 0) {
      selCountEl.textContent = `${count} selected`;
      selCountEl.style.display = '';
      downloadBtn.disabled = false;
    } else {
      selCountEl.style.display = 'none';
      downloadBtn.disabled = true;
    }
    selectAllBtn.textContent = count === photos.length ? 'Deselect All' : 'Select All';
  }

  selectAllBtn.addEventListener('click', () => {
    const allSelected = selected.size === photos.length;
    photoGrid.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.checked = !allSelected;
      const name = decodeURIComponent(cb.dataset.name);
      const item = cb.closest('.gallery-item');
      if (!allSelected) {
        selected.add(name);
        item.classList.add('selected');
      } else {
        selected.delete(name);
        item.classList.remove('selected');
      }
    });
    updateSelectionUI();
  });

  // ─── Download ───
  downloadBtn.addEventListener('click', async () => {
    if (selected.size === 0) return;
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Downloading…';

    for (const filename of selected) {
      try {
        const res = await fetch(`/api/photos/${encodeURIComponent(filename)}`, { headers });
        if (!res.ok) continue;
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
      } catch { /* skip failed downloads */ }
    }

    downloadBtn.disabled = false;
    downloadBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      Download`;
  });

  // ─── Lightbox ───
  function openLightbox(index) {
    lightboxIndex = index;
    updateLightbox();
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.style.display = 'none';
    document.body.style.overflow = '';
    lightboxIndex = -1;
  }

  function updateLightbox() {
    const photo = photos[lightboxIndex];
    lightboxImg.src = photo.url;
    lightboxImg.alt = photo.name;
    lightboxCounter.textContent = `${lightboxIndex + 1} / ${photos.length}`;
  }

  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  document.getElementById('lightbox-prev').addEventListener('click', () => {
    lightboxIndex = (lightboxIndex - 1 + photos.length) % photos.length;
    updateLightbox();
  });
  document.getElementById('lightbox-next').addEventListener('click', () => {
    lightboxIndex = (lightboxIndex + 1) % photos.length;
    updateLightbox();
  });

  // Keyboard nav
  document.addEventListener('keydown', (e) => {
    if (lightbox.style.display === 'none') return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') {
      lightboxIndex = (lightboxIndex - 1 + photos.length) % photos.length;
      updateLightbox();
    }
    if (e.key === 'ArrowRight') {
      lightboxIndex = (lightboxIndex + 1) % photos.length;
      updateLightbox();
    }
  });

  // Click overlay to close
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
      closeLightbox();
    }
  });

  // ─── Logout ───
  logoutBtn.addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = '/';
  });

  // ─── Init ───
  loadPhotos();
})();
