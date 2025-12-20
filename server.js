require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());

/* ---------------- MongoDB Connection ---------------- */

// Prevent multiple connections on Vercel
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI);
  isConnected = true;
  console.log("MongoDB connected");
};

/* ---------------- Schema Design ---------------- */

// Product Schema (based on JSON)
const productSchema = new mongoose.Schema({
  product_id: Number,
  name: String,
  quantity: Number,
  price: Number
});

// Order Schema (based on order-products.json)
const orderSchema = new mongoose.Schema({
  order_id: {
    type: Number,
    required: true
  },
  customer_id: {
    type: Number,
    required: true
  },
  products: [productSchema],
  total_price: Number,
  order_date: String,
  status: String
});

// Model
const Order = mongoose.model("Order", orderSchema);

/* ---------------- Routes ---------------- */

// Test Route
app.get("/", async (req, res) => {
  await connectDB();
  res.send("Order Products API is running successfully 🚀");
});

// GET – Fetch all orders
app.get("/orders", async (req, res) => {
  try {
    await connectDB();
    const orders = await Order.find();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET – Fetch order by order_id
app.get("/order/:id", async (req, res) => {
  try {
    await connectDB();
    const order = await Order.findOne({ order_id: req.params.id });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST – Create new order
app.post("/order", async (req, res) => {
  try {
    await connectDB();

    const totalPrice = req.body.products.reduce(
      (sum, p) => sum + p.quantity * p.price,
      0
    );

    const order = await Order.create({
      order_id: req.body.order_id,
      customer_id: req.body.customer_id,
      products: req.body.products,
      total_price: totalPrice,
      order_date: req.body.order_date,
      status: req.body.status
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT – Update order
app.put("/order/:id", async (req, res) => {
  try {
    await connectDB();

    const order = await Order.findOneAndUpdate(
      { order_id: req.params.id },
      req.body,
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE – Delete order
app.delete("/order/:id", async (req, res) => {
  try {
    await connectDB();

    const order = await Order.findOneAndDelete({ order_id: req.params.id });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---------------- Export for Vercel ---------------- */

module.exports = app;
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}