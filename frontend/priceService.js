/**
 * Nexa-Price Intelligence Service
 * Provides real-time mock conversion for NEXA asset pairs
 */

const NEXA_USD_RATE = 1.25;
const NEXA_NGN_RATE = 1850; // Dynamic market rate

const getPrice = (currency = 'USD') => {
    return currency === 'USD' ? NEXA_USD_RATE : NEXA_NGN_RATE;
};

const convertToCurrency = (amount, currency = 'USD') => {
    const rate = getPrice(currency);
    const converted = amount * rate;
    
    if (currency === 'USD') {
        return converted.toLocaleString(undefined, { 
            style: 'currency', 
            currency: 'USD',
            minimumFractionDigits: 2 
        });
    } else {
        return '₦' + converted.toLocaleString(undefined, { 
            minimumFractionDigits: 2 
        });
    }
};

// Exporting as a global for simplicity in the current frontend structure
window.PriceService = {
    getPrice,
    convertToCurrency
};
