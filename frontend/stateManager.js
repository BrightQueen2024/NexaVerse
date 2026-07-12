/**
 * NEXA STATE MANAGER
 * Unified Reactive Architecture for Production-Grade Data Binding
 */

class NexaStateManager {
    constructor() {
        this.state = {
            user: null,
            balance: '0.00',
            transactions: [],
            goldRates: null,
            isVaultUnlocked: false
        };
        this.listeners = [];
        this.init();
    }

    async init() {
        this.loadSession();
        if (this.getToken()) {
            await this.sync();
        }
        // Background Refresh every 60s
        setInterval(() => this.sync(), 60000);
    }

    loadSession() {
        const token = this.getToken();
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                this.state.user = {
                    nexa_id: payload.nexa_id,
                    address: payload.address
                };
            } catch (e) {
                console.error("Invalid Session");
                this.logout();
            }
        }
    }

    getToken() {
        return sessionStorage.getItem('nexa_session_token') || localStorage.getItem('nexa_auth_token');
    }

    async sync() {
        const token = this.getToken();
        if (!token) return;

        try {
            const response = await fetch('http://localhost:5000/api/v1/wallet/state', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();

            if (result.success) {
                this.state.balance = result.data.balance;
                this.state.transactions = result.data.transactions;
                this.state.goldRates = result.gold_standard;
                this.state.isVaultUnlocked = true;
                this.notify();
            } else if (result.error === "Invalid session") {
                this.logout();
            }
        } catch (e) {
            console.warn("Offline Mode: Using Cached State");
        }
    }

    subscribe(callback) {
        this.listeners.push(callback);
        callback(this.state);
    }

    notify() {
        this.listeners.forEach(cb => cb(this.state));
    }

    logout() {
        sessionStorage.removeItem('nexa_session_token');
        localStorage.removeItem('nexa_auth_token');
        window.location.href = '/login.html';
    }

    // Vault Handshake
    async unlockVault(method, value) {
        try {
            const response = await fetch('http://localhost:5000/api/v1/vault/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nexa_id: this.state.user.nexa_id, method, value })
            });
            const result = await response.json();
            if (result.success) {
                sessionStorage.setItem('nexa_session_token', result.token);
                await this.sync();
                return true;
            }
        } catch (e) {
            return false;
        }
        return false;
    }
}

window.NexaState = new NexaStateManager();
