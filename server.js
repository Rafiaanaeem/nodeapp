const express = require('express');
const PORT = process.env.MONGOB_URI || 8080;

const dotenv = require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose')
const app = express();
app.use(express.json());
// app.get('/', (req, res) => {
//     res.send('API is working');
// });
const personSchema = new mongoose.Schema({
    id: Number,
    name: String,
    age: Number,
    sem: Number
});
const Personmodel = mongoose.model('Person', personSchema);
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log("MongoDB connection error:", err));

const dataFile = path.join(__dirname, 'order-products.json');

const readOrders = () => {
    const data = fs.readFileSync(dataFile, 'utf-8');
    return JSON.parse(data);
};

const writeOrders = (orders) => {
    fs.writeFileSync(dataFile, JSON.stringify(orders, null, 2));
};

app.get('/orders', (req, res) => {
    const orders = readOrders();
    res.json(orders);
});

app.get('/order/:id', (req, res) => {
    const orderId = parseInt(req.params.id);
    const orders = readOrders();
    const order = orders.find(o => o.order_id === orderId);

    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
});

app.post('/order', (req, res) => {
    const newOrder = req.body;
    const orders = readOrders();

    if (!newOrder.order_id || !newOrder.customer_id || !newOrder.products) {
        return res.status(400).json({ message: 'Invalid order data' });
    }

    newOrder.total_price = newOrder.products.reduce((sum, p) => sum + p.quantity * p.price, 0);

    orders.push(newOrder);
    writeOrders(orders);

    res.status(201).json({ message: 'Order created successfully', order: newOrder });
});

// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });

