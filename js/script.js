const navToggle = document.getElementById('nav-toggle');
const mainNav = document.getElementById('main-nav');
const productGrid = document.getElementById('product-grid');

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    mainNav.classList.toggle('active');
  });
}

function formatPrice(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

function loadHomepageProducts() {
  if (!productGrid) return;

  fetch('data/products.json')
    .then(response => response.json())
    .then(products => {
      productGrid.innerHTML = products.map(product => `
        <article class="product-card">
          <h3>${product.name}</h3>
          <p>${product.description}</p>
          <span class="price">${formatPrice(product.price)}</span>
          <a href="product.html?product=${product.slug}" class="btn btn-secondary">Lihat Detail</a>
        </article>
      `).join('');
    })
    .catch(() => {
      productGrid.innerHTML = `
        <article class="product-card">
          <h3>Gagal memuat produk</h3>
          <p>Silakan refresh halaman atau coba lagi nanti.</p>
        </article>
      `;
    });
}

loadHomepageProducts();
