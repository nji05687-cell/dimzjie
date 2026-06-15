const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

const notificationsFile = path.join(__dirname, 'checkout-notifications.json');
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: uploadDir });

function saveNotification(data) {
  const existing = fs.existsSync(notificationsFile)
    ? JSON.parse(fs.readFileSync(notificationsFile, 'utf-8'))
    : [];
  existing.push(data);
  fs.writeFileSync(notificationsFile, JSON.stringify(existing, null, 2));
}

app.post('/checkout-notification', upload.single('proof'), (req, res) => {
  try {
    const notification = {
      id: Date.now(),
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      paymentMethod: req.body.paymentMethod,
      total: Number(req.body.total) || 0,
      cart: req.body.cart ? JSON.parse(req.body.cart) : [],
      transferredTo: req.body.transferredTo,
      transferAmount: Number(req.body.transferAmount) || 0,
      status: req.body.status || 'Menunggu Konfirmasi',
      shipmentStage: 'Menunggu Konfirmasi',
      createdAt: req.body.createdAt || new Date().toISOString(),
      proofPath: req.file ? `/uploads/${req.file.filename}` : null,
      proofName: req.file ? req.file.originalname : null,
    };
    saveNotification(notification);
    console.log('Notifikasi checkout baru:', notification);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const productsFile = path.join(__dirname, 'data', 'products.json');

function saveProduct(data) {
  const existing = fs.existsSync(productsFile)
    ? JSON.parse(fs.readFileSync(productsFile, 'utf-8'))
    : [];
  existing.push(data);
  fs.writeFileSync(productsFile, JSON.stringify(existing, null, 2));
}

app.post('/products', upload.single('imageFile'), (req, res) => {
  try {
    const name = req.body.name;
    const price = Number(req.body.price) || 0;
    const category = req.body.category;
    const slug = req.body.slug;
    const description = req.body.description;
    const features = req.body.features ? JSON.parse(req.body.features) : [];
    const imageUrl = req.body.imageUrl && req.body.imageUrl.trim().length > 0
      ? req.body.imageUrl.trim()
      : null;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !price || !category || !slug || !description) {
      return res.status(400).json({ success: false, error: 'Data produk tidak lengkap.' });
    }

    const product = {
      id: Date.now(),
      name,
      price,
      slug,
      category,
      description,
      features,
      image: imagePath || imageUrl,
    };

    saveProduct(product);
    console.log('Produk baru ditambahkan:', product);
    res.json({ success: true, product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/checkout-notifications', (req, res) => {
  try {
    const notifications = fs.existsSync(notificationsFile)
      ? JSON.parse(fs.readFileSync(notificationsFile, 'utf-8'))
      : [];
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/config', (req, res) => {
  res.json({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });
});

app.put('/checkout-notification/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const notifications = fs.existsSync(notificationsFile)
      ? JSON.parse(fs.readFileSync(notificationsFile, 'utf-8'))
      : [];

    const index = notifications.findIndex(item => item.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Order tidak ditemukan.' });
    }

    const updatedLocation = req.body.location && typeof req.body.location === 'object'
      ? {
          lat: Number(req.body.location.lat) || notifications[index].location?.lat || null,
          lng: Number(req.body.location.lng) || notifications[index].location?.lng || null,
        }
      : notifications[index].location || null;

    notifications[index] = {
      ...notifications[index],
      ...req.body,
      location: updatedLocation,
      shipmentStage: req.body.shipmentStage || notifications[index].shipmentStage,
      status: req.body.status || notifications[index].status,
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(notificationsFile, JSON.stringify(notifications, null, 2));
    res.json({ success: true, order: notifications[index] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
