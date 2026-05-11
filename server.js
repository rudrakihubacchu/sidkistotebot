const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- CONFIGURATION (FILL THESE OUT) ---
const BOT_TOKEN = "8637135798:AAEdTzCnL3fn1keuLzLxQN0BUULXlTMicVY"; 
const OWNER_ID = 2119464081; // Get from @userinfobot
const UPI_ID = "7722026588@ptaxis"; 
const WEBAPP_URL = "sidkistotebot-production.up.railway.app"; 

// --- AUTO-SETUP BOT MENU ---
async function setupBot() {
    try {
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton`, {
            menu_button: {
                type: "web_app",
                text: "🛒 Sid Store",
                web_app: { url: WEBAPP_URL }
            }
        });
        console.log("✅ Sid Store: Telegram Menu Button Linked!");
    } catch (e) { console.log("❌ Bot Setup Error: Check Token/URL"); }
}

// --- DATABASE (TEMPORARY) ---
let db = {
    users: {}, 
    market: [
        { id: 1, title: "Verified Premium ID", price: 20, image: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=400", sellerId: "admin" },
        { id: 2, title: "OG Username @Sid", price: 100, image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400", sellerId: "admin" }
    ],
    pendingDeposits: []
};

// --- API ROUTES ---
app.post('/api/init', (req, res) => {
    const { id, username } = req.body;
    if (!db.users[id]) db.users[id] = { balance: 0.00, username: username || "Guest" };
    res.json({ user: db.users[id], market: db.market, isOwner: parseInt(id) === OWNER_ID, upi: UPI_ID });
});

app.post('/api/deposit', (req, res) => {
    const { userId, amount, utr, username } = req.body;
    db.pendingDeposits.push({ id: Date.now(), userId, username, amount: parseFloat(amount), utr, status: 'pending' });
    res.json({ success: true });
});

app.post('/api/buy', (req, res) => {
    const { buyerId, itemId } = req.body;
    const item = db.market.find(i => i.id === itemId);
    if (item && db.users[buyerId].balance >= item.price) {
        db.users[buyerId].balance -= item.price;
        db.market = db.market.filter(i => i.id !== itemId);
        res.json({ success: true, balance: db.users[buyerId].balance });
    } else { res.status(400).json({ error: "Insufficient Balance" }); }
});

app.post('/api/sell', (req, res) => {
    const { sellerId, title, price, image } = req.body;
    db.market.push({ id: Date.now(), title, price: parseFloat(price), image, sellerId });
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Sid Store Live on Port ${PORT}`);
    if (BOT_TOKEN !== "YOUR_BOT_TOKEN_HERE") setupBot();
});
