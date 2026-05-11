const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const DB_PATH = './database.json';

// --- YOUR CREDENTIALS ---
const BOT_TOKEN = "8637135798:AAEdTzCnL3fn1keuLzLxQN0BUULXlTMicVY";
const OWNER_ID = "2119464081";
const UPI_ID = "7722026588@ptaxis";
const WEBAPP_URL = "https://sidkistotebot-production.up.railway.app"; 

// --- DATABASE PERSISTENCE ---
function loadDB() {
    if (!fs.existsSync(DB_PATH)) {
        const initialData = { 
            users: {}, 
            market: [
                { id: 1, title: "Premium VIP Account", price: 10, image: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=400" },
                { id: 2, title: "Rare Username @Sid", price: 50, image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400" }
            ], 
            deposits: [] 
        };
        fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
        return initialData;
    }
    return JSON.parse(fs.readFileSync(DB_PATH));
}
function saveDB(data) { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2)); }
let db = loadDB();

// --- TELEGRAM AUTO-SETUP ---
async function setupBot() {
    try {
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton`, {
            menu_button: { type: "web_app", text: "🛒 Sid Store", web_app: { url: WEBAPP_URL } }
        });
        console.log("✅ Bot Menu Linked!");
    } catch (e) { console.log("❌ Bot Setup Error"); }
}

// --- API ROUTES ---
app.post('/api/init', (req, res) => {
    const { id, username } = req.body;
    if (!id) return res.status(400).send("ID missing");
    if (!db.users[id]) {
        db.users[id] = { balance: 0.00, username: username || "Guest" };
        saveDB(db);
    }
    res.json({ user: db.users[id], market: db.market, upi: UPI_ID });
});

app.post('/api/buy', (req, res) => {
    const { buyerId, itemId } = req.body;
    const user = db.users[buyerId];
    const item = db.market.find(i => i.id === itemId);

    if (user && item && user.balance >= item.price) {
        user.balance -= item.price;
        saveDB(db);
        
        // Notify Owner of Sale
        axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: OWNER_ID,
            text: `🛍️ *New Sale!*\nUser: ${user.username}\nItem: ${item.title}\nPrice: $${item.price}`,
            parse_mode: "Markdown"
        });
        return res.json({ success: true });
    }
    res.status(400).json({ success: false });
});

app.post('/api/deposit', (req, res) => {
    const { userId, amount, utr, username } = req.body;
    if (db.deposits.find(d => d.utr === utr)) return res.status(400).json({ error: "Used UTR" });
    
    db.deposits.push({ userId, username, amount, utr, status: 'pending' });
    saveDB(db);

    axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        chat_id: OWNER_ID,
        text: `💰 *New Deposit*\nUser: ${username}\nAmt: ${amount}\nUTR: ${utr}`,
        parse_mode: "Markdown"
    });
    res.json({ success: true });
});

app.listen(process.env.PORT || 3000, () => {
    console.log("🚀 Sid Store Active");
    setupBot();
});
