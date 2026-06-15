const express = require('express');
const cors = require('cors');
const path = require('path');
const Stripe = require('stripe');
require('dotenv').config();

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { cart, customer, paymentMethod } = req.body;
    const lineItems = cart.map(item => ({
      price_data: {
        currency: 'idr',
        product_data: {
          name: item.name,
          description: item.description || item.category || 'Produk Dimzjie Outfit',
        },
        unit_amount: item.price,
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      customer_email: customer.email,
      success_url: `${req.protocol}://${req.get('host')}/confirm.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.protocol}://${req.get('host')}/checkout.html`,
      metadata: {
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        paymentMethod,
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
