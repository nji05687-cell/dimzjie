const adminLoginForm = document.getElementById('admin-login-form');
const adminPasswordInput = document.getElementById('admin-password-input');
const adminLoginError = document.getElementById('admin-login-error');

function displayAdminLoginError(message) {
  if (!adminLoginError) return;
  adminLoginError.textContent = message;
}

adminLoginForm?.addEventListener('submit', async event => {
  event.preventDefault();
  const password = adminPasswordInput?.value.trim();
  if (!password) {
    displayAdminLoginError('Masukkan kata sandi terlebih dahulu.');
    return;
  }

  try {
    const resp = await fetch('/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await resp.json();
    if (data.success) {
      localStorage.setItem('dimzjie_admin_authenticated', 'true');
      window.location.href = 'admin.html';
    } else {
      displayAdminLoginError(data.error || 'Kata sandi salah. Silakan coba lagi.');
    }
  } catch (err) {
    displayAdminLoginError('Gagal memeriksa kata sandi. Coba lagi.');
  }
});

