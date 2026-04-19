const form = document.getElementById('admin-form');
const errorEl = document.getElementById('form-error');
const successEl = document.getElementById('form-success');
const btnText = document.getElementById('btn-text');
const btnSpinner = document.getElementById('btn-spinner');
const submitBtn = document.getElementById('submit-btn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.style.display = 'none';
  successEl.style.display = 'none';
  btnText.textContent = 'Creating…';
  btnSpinner.style.display = 'inline';
  submitBtn.disabled = true;

  const adminKey = document.getElementById('admin-key').value.trim();
  const name = document.getElementById('album-name').value.trim();
  const password = document.getElementById('album-password').value;

  try {
    const res = await fetch('/api/admin/albums', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      },
      body: JSON.stringify({ name, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to create album');
    }

    successEl.textContent = `Album created! ID: ${data.albumId} — Bucket: ${data.bucketId}`;
    successEl.style.display = 'block';

    // Clear name and password fields for next album
    document.getElementById('album-name').value = '';
    document.getElementById('album-password').value = '';
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
  } finally {
    btnText.textContent = 'Create Album';
    btnSpinner.style.display = 'none';
    submitBtn.disabled = false;
  }
});
