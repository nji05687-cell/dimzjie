const ADMIN_PAGES = ['admin.html', 'admin-track.html'];
const path = window.location.pathname.split('/').pop();
const isAdminPage = ADMIN_PAGES.includes(path);

if (isAdminPage) {
  const authenticated = window.localStorage.getItem('dimzjie_admin_authenticated') === 'true';
  if (!authenticated) {
    window.location.href = 'admin-login.html';
  }
}

const logoutButton = document.getElementById('admin-logout');
logoutButton?.addEventListener('click', () => {
  window.localStorage.removeItem('dimzjie_admin_authenticated');
  window.location.href = 'admin-login.html';
});
