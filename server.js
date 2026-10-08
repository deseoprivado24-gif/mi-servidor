/**
 * ============================================================================
 * NEXUS ERP & POS - SERVIDOR OFICIAL PARA PRODUCCIÓN
 * ============================================================================
 */

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sirve tu landing page / index.html estático
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Base de datos de licencias y configuraciones globales
const db = {
    licenses: {
        "NEXUS-CORP-2026-VIP": {
            status: "ACTIVE",
            tier: "Enterprise Tier ($120/mes)",
            expires: "2027-03-30",
            country: "VEN",
            currency: "VES",
            company: "Comercial Larry C.A."
        }
    },
    countriesConfig: {
        "VEN": { name: "Venezuela", currency: "VES", exchangeRates: ["Bolívares (VES)", "Dólar BCB", "Euro"] },
        "MEX": { name: "México", currency: "MXN", exchangeRates: ["Peso Mexicano (MXN)"] },
        "COL": { name: "Colombia", currency: "COP", exchangeRates: ["Peso Colombiano (COP)"] }
    }
};

const WEBHOOK_SECRET_KEY = "nexus_secure_secret_enterprise_2026";

// Endpoint de validación global de licencias y país
app.post('/api/verify-global', (req, res) => {
    const { key, country, language } = req.body;
    const countryConfig = db.countriesConfig[country] || { currency: "USD", name: "Global" };

    if (db.licenses[key]) {
        res.json({
            success: true,
            country: countryConfig.name,
            currency: countryConfig.currency,
            message: `Licencia VÁLIDA. Entorno configurado para ${countryConfig.name} (${countryConfig.currency}).`
        });
    } else {
        res.json({
            success: false,
            message: "Licencia no válida o vencida. Adquiere tu acceso a través de @cobro_deseo_privado_bot."
        });
    }
});

// Webhook para pagos USDT vía Binance Pay / MacroDroid / Telegram
app.post('/api/webhook/payment', (req, res) => {
    const { secret, clientName, licenseKey, country, language } = req.body;

    if (secret !== WEBHOOK_SECRET_KEY) {
        return res.status(403).json({ error: "Token de seguridad inválido." });
    }

    db.licenses[licenseKey] = {
        status: "ACTIVE",
        tier: "Enterprise Tier ($120/mes)",
        expires: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0],
        country: country || "VEN",
        language: language || "es",
        company: clientName || "Cliente Corporativo"
    };

    console.log(`[AUTOMATION] Licencia emitida y activada para ${clientName} en país ${country}`);
    res.json({ success: true, message: "Licencia emitida y activada con éxito." });
});

app.listen(PORT, () => {
    console.log(`Servidor Nexus ERP ejecutándose en el puerto ${PORT}`);
});
