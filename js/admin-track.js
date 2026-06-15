const trackListEl = document.getElementById('track-list');
const trackSearchEl = document.getElementById('track-search');
const orderDetailsEl = document.getElementById('order-details');
const mapStatusEl = document.getElementById('map-status');
const mapEl = document.getElementById('map');

const SHIPMENT_STAGES = [
  'Menunggu Konfirmasi',
  'Dikemas',
  'Dikirim',
  'Dalam Perjalanan',
  'Tiba di Tujuan',
];

let map;
let marker;
let orders = [];
let selectedOrder = null;

function loadOrders() {
  fetch('/checkout-notifications')
    .then(response => response.json())
    .then(data => {
      orders = data.map(item => ({
        ...item,
        shipmentStage: item.shipmentStage || 'Menunggu Konfirmasi',
        location: item.location || getOrderLocationSample(item.id),
      }));
      renderTrackList();
    })
    .catch(() => {
      if (trackListEl) {
        trackListEl.innerHTML = '<p>Gagal memuat pesanan. Silakan coba lagi nanti.</p>';
      }
    });
}

function formatPrice(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

function renderTrackList() {
  const searchTerm = trackSearchEl.value.trim().toLowerCase();
  const filteredOrders = orders.filter(order =>
    order.name.toLowerCase().includes(searchTerm) ||
    String(order.id).includes(searchTerm) ||
    order.address.toLowerCase().includes(searchTerm)
  );

  if (!trackListEl) return;

  if (filteredOrders.length === 0) {
    trackListEl.innerHTML = '<p>Tidak ada pesanan yang cocok.</p>';
    return;
  }

  trackListEl.innerHTML = filteredOrders.map(order => {
    const progressIndex = SHIPMENT_STAGES.indexOf(order.shipmentStage);
    return `
      <div class="track-card ${selectedOrder && selectedOrder.id === order.id ? 'selected' : ''}" data-id="${order.id}">
        <div class="track-card-header">
          <h4>${order.name}</h4>
          <span class="track-badge">${order.shipmentStage}</span>
        </div>
        <p><strong>ID:</strong> ${order.id}</p>
        <p><strong>Alamat:</strong> ${order.address}</p>
        <div class="track-mini-progress">
          ${SHIPMENT_STAGES.map((stage, index) => `
            <span class="mini-step ${index <= progressIndex ? 'active' : ''}" title="${stage}"></span>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.track-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = Number(card.dataset.id);
      selectedOrder = orders.find(order => order.id === id);
      renderOrderDetails();
      updateMap();
      renderTrackList();
    });
  });
}

function renderOrderDetails() {
  if (!orderDetailsEl || !selectedOrder) return;

  const location = selectedOrder.location || { lat: -6.200000, lng: 106.816666 };
  const progressIndex = SHIPMENT_STAGES.indexOf(selectedOrder.shipmentStage);

  orderDetailsEl.innerHTML = `
    <div class="details-card">
      <h3>Detail Pesanan</h3>
      <p><strong>ID:</strong> ${selectedOrder.id}</p>
      <p><strong>Nama:</strong> ${selectedOrder.name}</p>
      <p><strong>Alamat:</strong> ${selectedOrder.address}</p>
      <p><strong>Total:</strong> ${formatPrice(selectedOrder.total)}</p>
      <p><strong>Nomor DANA:</strong> ${selectedOrder.transferredTo}</p>
      <p><strong>Status Saat Ini:</strong> ${selectedOrder.status}</p>

      <div class="shipment-progress-bar">
        ${SHIPMENT_STAGES.map((stage, index) => `
          <div class="progress-step ${index <= progressIndex ? 'active' : ''}">
            <span>${index + 1}</span>
            <p>${stage}</p>
          </div>
        `).join('')}
      </div>

      <div class="location-fields">
        <label>
          <strong>Latitude</strong>
          <input id="location-lat-input" type="number" step="0.000001" value="${location.lat}" />
        </label>
        <label>
          <strong>Longitude</strong>
          <input id="location-lng-input" type="number" step="0.000001" value="${location.lng}" />
        </label>
      </div>

      <label>
        <strong>Update Stage Pengiriman</strong>
        <select id="shipment-stage-select">
          ${SHIPMENT_STAGES.map(stage => `<option value="${stage}">${stage}</option>`).join('')}
        </select>
      </label>
      <label>
        <strong>Update Status</strong>
        <input id="shipment-status-input" type="text" value="${selectedOrder.status}" />
      </label>
      <button id="save-shipment-update" class="btn btn-secondary">Simpan Pembaruan</button>
      <h4>Items</h4>
      <ul>${selectedOrder.cart.map(item => `<li>${item.name} x ${item.quantity}</li>`).join('')}</ul>
    </div>
  `;

  const stageSelect = document.getElementById('shipment-stage-select');
  const statusInput = document.getElementById('shipment-status-input');
  const latInput = document.getElementById('location-lat-input');
  const lngInput = document.getElementById('location-lng-input');
  const saveButton = document.getElementById('save-shipment-update');

  if (stageSelect) {
    stageSelect.value = selectedOrder.shipmentStage;
  }

  saveButton?.addEventListener('click', () => {
    const updatedStage = stageSelect?.value || selectedOrder.shipmentStage;
    const updatedStatus = statusInput?.value.trim() || selectedOrder.status;
    const updatedLat = Number(latInput?.value) || location.lat;
    const updatedLng = Number(lngInput?.value) || location.lng;
    updateOrderShipment(selectedOrder.id, updatedStage, updatedStatus, { lat: updatedLat, lng: updatedLng });
  });
}

function initMap() {
  if (!mapEl) return;

  map = new google.maps.Map(mapEl, {
    center: { lat: -6.200000, lng: 106.816666 },
    zoom: 12,
  });

  marker = new google.maps.Marker({
    map,
    position: { lat: -6.200000, lng: 106.816666 },
    draggable: false,
  });
}

function updateMap() {
  if (!map || !marker || !selectedOrder) return;

  const position = selectedOrder.location || { lat: -6.200000, lng: 106.816666 };
  map.setCenter(position);
  marker.setPosition(position);
  mapStatusEl.textContent = `Lokasi terakhir: ${selectedOrder.address} (Stage: ${selectedOrder.shipmentStage})`;
}

function fetchConfig() {
  return fetch('/config')
    .then(response => response.json())
    .catch(() => ({ googleMapsApiKey: '' }));
}

function loadGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function updateOrderShipment(id, stage, status, location) {
  try {
    const body = { shipmentStage: stage, status };
    if (location) {
      body.location = location;
    }

    const response = await fetch(`/checkout-notification/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (data.success) {
      const index = orders.findIndex(order => order.id === id);
      if (index !== -1) {
        orders[index] = data.order;
        selectedOrder = data.order;
        renderOrderDetails();
        renderTrackList();
        updateMap();
      }
    } else {
      alert(data.error || 'Gagal memperbarui status pengiriman.');
    }
  } catch (err) {
    alert('Terjadi kesalahan saat menyimpan pembaruan pengiriman.');
  }
}

window.initTrackAdmin = async () => {
  const config = await fetchConfig();
  if (!config.googleMapsApiKey) {
    if (mapStatusEl) {
      mapStatusEl.textContent = 'Google Maps API key tidak ditemukan. Silakan atur di server.';
    }
    return;
  }

  try {
    await loadGoogleMaps(config.googleMapsApiKey);
    initMap();
    loadOrders();
  } catch (error) {
    if (mapStatusEl) {
      mapStatusEl.textContent = 'Gagal memuat Google Maps. Periksa API key Anda.';
    }
  }
};

window.addEventListener('load', () => {
  window.initTrackAdmin();
});

function getOrderLocationSample(orderId) {
  const samples = [
    { lat: -6.200000, lng: 106.816666 },
    { lat: -6.229386, lng: 106.689429 },
    { lat: -6.121435, lng: 106.774124 },
    { lat: -6.244256, lng: 106.806367 },
  ];
  return samples[orderId % samples.length];
}

trackSearchEl?.addEventListener('input', renderTrackList);
