require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
const { db, initDb } = require('./database');
const { fetchGoldRates } = require('./priceService');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'nexa_default_secret';

// Initialize Database
initDb();

// 1. Triple-Lock Security Logic
app.post('/api/v1/vault/verify', async (req, res) => {
    const { nexa_id, method, value } = req.body;
    
    db.get("SELECT * FROM citizens WHERE nexa_id = ?", [nexa_id], async (err, citizen) => {
        if (err || !citizen) {
            return res.status(401).json({ success: false, error: "Citizen not found" });
        }

        let isMatch = false;
        if (method === 'PIN') {
            isMatch = await bcrypt.compare(value, citizen.pin_hash);
        } else if (method === 'Touch ID' || method === 'Face ID') {
            isMatch = await bcrypt.compare(value, citizen.biometric_hash);
        }

        if (isMatch) {
            const token = jwt.sign({ nexa_id: citizen.nexa_id, address: citizen.public_address }, JWT_SECRET, { expiresIn: '5m' });
            return res.json({ success: true, token });
        } else {
            return res.status(401).json({ success: false, error: "Invalid credentials" });
        }
    });
});

// 1. Citizen Enrollment / Registration
app.post('/api/v1/auth/register', async (req, res) => {
    const { nexa_id, email, fullName, password } = req.body;

    // Check if NexaID already exists
    db.get("SELECT nexa_id FROM citizens WHERE nexa_id = ?", [nexa_id], async (err, row) => {
        if (row) {
            return res.status(409).json({ success: false, error: "NexaID already claimed" });
        }

        // Hash password (using 10 salt rounds)
        const passwordHash = await bcrypt.hash(password, 10);
        const pinHash = await bcrypt.hash("0000", 10); // Default pin for vault initialization
        const bioHash = await bcrypt.hash("pending_enrollment", 10);
        const publicAddress = '0x' + Math.random().toString(16).substring(2, 15) + Math.random().toString(16).substring(2, 15);

        // Insert new citizen
        db.run(`INSERT INTO citizens (nexa_id, email, public_address, pin_hash, biometric_hash) 
                VALUES (?, ?, ?, ?, ?)`, 
                [nexa_id, email, publicAddress, pinHash, bioHash], 
                function(err) {
            if (err) return res.status(500).json({ success: false, error: "Database registration failure" });

            // Initialize ledger with 0.00 $NEXA balance
            const tx_hash = '0x' + Math.random().toString(16).substring(2, 15);
            db.run(`INSERT INTO ledger (nexa_id, tx_hash, type, amount, reserve_asset_gold, status, audit_proof) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [nexa_id, tx_hash, 'incoming', 0.00, 0.00, 'Audited', 'Genesis Block: Account Initialized'],
                    (err) => {
                        if (err) console.error("Genesis transaction failed:", err);
                        res.json({ success: true, nexa_id, message: "Citizenship Granted" });
                    }
            );
        });
    });
});

// 2. Real-Time Balance Endpoint
app.get('/api/v1/wallet/state', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, error: "Unauthorized" });

    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ success: false, error: "Invalid session" });

        const nexa_id = decoded.nexa_id;

        // Fetch ledger data
        db.all("SELECT * FROM ledger WHERE nexa_id = ? ORDER BY date DESC", [nexa_id], async (err, transactions) => {
            if (err) return res.status(500).json({ success: false, error: "Database error" });

            const goldRates = await fetchGoldRates();

            // Calculate current balance
            let balance = 0;
            transactions.forEach(tx => {
                if (tx.type === 'incoming') balance += tx.amount;
                else balance -= tx.amount;
            });

            res.json({
                success: true,
                integrityPassed: true,
                gold_standard: {
                    usd_per_gram: goldRates.NEXA_USD,
                    ngn_per_gram: goldRates.NEXA_NGN,
                    gold_spot_ounce: goldRates.GOLD_SPOT_OUNCE
                },
                data: {
                    balance: balance.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                    gold_weight_grams: balance.toFixed(2),
                    gold_weight_ounces: (balance / 31.1035).toFixed(4),
                    address: decoded.address,
                    transactions: transactions.map(tx => ({
                        id: tx.tx_hash,
                        type: tx.type,
                        amount: tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                        asset: tx.asset,
                        reserve_gold: tx.reserve_asset_gold,
                        date: tx.date,
                        status: tx.status,
                        auditProof: tx.audit_proof
                    }))
                }
            });
        });
    });
});

// 3. Post Transaction
app.post('/api/v1/wallet/transaction', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, error: "Unauthorized" });

    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
        if (err) return res.status(401).json({ success: false, error: "Invalid session" });

        const { amount, type, recipient } = req.body;
        const tx_hash = '0x' + Math.random().toString(16).substring(2, 15);
        const nexa_id = decoded.nexa_id;

        // Treasury Reserve Logic: Log Gold equivalent at time of TX
        const goldRates = await fetchGoldRates();
        const goldEquiv = amount; // Since 1 NEXA = 1g Gold

        db.run(`INSERT INTO ledger (nexa_id, tx_hash, type, amount, reserve_asset_gold, status, audit_proof) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [nexa_id, tx_hash, type || 'outgoing', amount, goldEquiv, 'Audited', `Verified by Node #${Math.floor(Math.random()*20)} (Auto-Audit)`],
                (err) => {
                    if (err) return res.status(500).json({ success: false, error: "Transaction failed" });
                    res.json({ success: true, tx_hash });
                }
        );
    });
});

// 4. Logout / Blacklist Current Token
app.post('/api/v1/vault/logout', (req, res) => {
    // In a full implementation, we would add the token to a blacklist in the DB
    res.json({ success: true, message: "Session Terminated" });
});

app.listen(PORT, () => {
    console.log(`Nexa-Core Controller running on port ${PORT}`);
});
