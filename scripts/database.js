const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'nexa_vault.db');
const db = new sqlite3.Database(dbPath);

function initDb() {
    db.serialize(() => {
        // Citizens Table
        db.run(`CREATE TABLE IF NOT EXISTS citizens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nexa_id TEXT UNIQUE,
            public_address TEXT UNIQUE,
            pin_hash TEXT,
            biometric_hash TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Ledger Table
        db.run(`CREATE TABLE IF NOT EXISTS ledger (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nexa_id TEXT,
            tx_hash TEXT UNIQUE,
            type TEXT, -- incoming/outgoing
            amount REAL,
            asset TEXT DEFAULT 'NEXA',
            reserve_asset_gold REAL, -- Gold Equivalent in Grams
            status TEXT, -- Audited, Pending, Failed
            date DATETIME DEFAULT CURRENT_TIMESTAMP,
            audit_proof TEXT,
            FOREIGN KEY(nexa_id) REFERENCES citizens(nexa_id)
        )`);

        // Database initialized in Active-Only state
        console.log('[Nexa-DB] Secure Vault Ready.');
    });
}

module.exports = { db, initDb };
