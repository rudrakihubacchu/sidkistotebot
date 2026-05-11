const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const DB_PATH = './database.json';

// --- CONFIGURATION ---
const BOT_TOKEN = "8637135798:AAEdTzCnL3fn1keuLzLxQN0BUULXlTMicVY";
const OWNER_ID = "2119464081";
const UPI_ID = "7722026588@ptaxis";

// --- DATABASE PERSISTENCE ---
function loadDB() {
    if (!fs.existsSync(DB_PATH)) {
        const initial = { 
            accounts: {}, 
            market: [
                { id: 1, title: "Premium VIP Access", price: 15.00, image: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=400" },
                { id: 2, title: "Cloud Storage 1TB", price: 5.99, image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400" },
                { id: 3, title: "Custom Bot License", price: 25.00, image: "https://images.unsplash.com/photo-1527430295725-4995058cae32?w=400" }
            ], 
            deposits: [] 
        };
        fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
        return initial;
    }
    return JSON.parse(fs.readFileSync(DB_PATH));
}
function saveDB(data) { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2)); }
let db = loadDB();

// --- API ENDPOINTS ---
app.post('/api/register', (req, res) => {
    const { username, password, tgId } = req.body;
    if (db.accounts[username]) return res.status(400).json({ error: "Username already exists" });
    db.accounts[username] = { password, balance: 0.00, tgId, joined: new Date().toLocaleDateString() };
    saveDB(db);
    res.json({ success: true });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.accounts[username];
    if (user && user.password === password) {
        res.json({ 
            success: true, 
            user: { username, balance: user.balance, joined: user.joined },
            market: db.market,
            upi: UPI_ID,
            isOwner: String(user.tgId) === String(OWNER_ID)
        });
    } else {
        res.status(401).json({ error: "Invalid login details" });
    }
});

app.post('/api/admin/update-price', (req, res) => {
    const { username, itemId, newPrice } = req.body;
    const user = db.accounts[username];
    if (!user || String(user.tgId) !== String(OWNER_ID)) return res.status(403).send("Forbidden");
    const item = db.market.find(i => i.id === itemId);
    if (item) { item.price = parseFloat(newPrice); saveDB(db); res.json({ success: true }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Pro App running on port ${PORT}`));
