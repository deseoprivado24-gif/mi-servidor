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

// Base de datos de licencias, usuarios e inventario
const db = {
    licensedCount: 0, // Contador para el límite de 100 licencias promocionales al 50%
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
    users: {},
    inventory: [
        { id: 1, barcode: "750123456789", name: "Producto Demo", price: 10.00, stock: 100 }
    ],
    countriesConfig: {
        "VEN": { name: "Venezuela", currency: "VES", exchangeRates: ["Bolívares (VES)", "Dólar BCB", "Euro"] },
        "MEX": { name: "México", currency: "MXN", exchangeRates: ["Peso Mexicano (MXN)"] },
        "COL": { name: "Colombia", currency: "COP", exchangeRates: ["Peso Colombiano (COP)"] }
    }
};

const WEBHOOK_SECRET_KEY = "nexus_secure_secret_enterprise_2026";

// Endpoint para verificar la tarifa promocional de la licencia
app.get('/api/promo-price', (req, res) => {
    const isPromoActive = db.licensedCount < 100;
    const discountFactor = isPromoActive ? 0.5 : 1.0;

    res.json({
        success: true,
        licensedCount: db.licensedCount,
        isPromoActive: isPromoActive,
        pricesUSD: {
            basic: 15 * discountFactor,
            premium: 45 * discountFactor,
            platinum: 120 * discountFactor
        },
        message: isPromoActive 
            ? `Promoción activa del 50% de descuento en la tarifa de la licencia. Quedan ${100 - db.licensedCount} cupos.`
            : "Tarifa estándar aplicable."
    });
});

// Endpoint de validación global de licencias y país
app.post('/api/verify-global', (req, res) => {
    const { key, country, language } = req.body;
    const countryConfig = db.countriesConfig[country] || { currency: "USD", name: "Global" };

    if (db.licenses[key] && db.licenses[key].status === "ACTIVE") {
        res.json({
            success: true,
            country: countryConfig.name,
            currency: countryConfig.currency,
            company: db.licenses[key].company,
            message: `Licencia VÁLIDA. Entorno configurado para ${countryConfig.name} (${countryConfig.currency}).`
        });
    } else {
        res.json({
            success: false,
            message: "Licencia no válida o vencida. Adquiere tu acceso a través de @cobro_deseo_privado_bot."
        });
    }
});

// Webhook para pagos USDT / Binance Pay / MacroDroid / Telegram
app.post('/api/webhook/payment', (req, res) => {
    const { secret, clientName, licenseKey, country, language, planType } = req.body;

    if (secret !== WEBHOOK_SECRET_KEY) {
        return res.status(403).json({ error: "Token de seguridad inválido." });
    }

    // Incrementar contador de licencias con descuento
    db.licensedCount += 1;

    // Generar clave de licencia si no se especifica
    const generatedKey = licenseKey || `NEXUS-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Generar usuario y contraseña temporal autónoma
    const tempUsername = `user_${Math.floor(1000 + Math.random() * 9000)}`;
    const tempPassword = Math.random().toString(36).slice(-8);

    db.licenses[generatedKey] = {
        status: "ACTIVE",
        tier: planType || "Licencia Completa ERP",
        expires: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0],
        country: country || "VEN",
        language: language || "es",
        company: clientName || "Cliente Corporativo"
    };

    db.users[tempUsername] = {
        password: tempPassword,
        licenseKey: generatedKey,
        mustChangePassword: true
    };

    console.log(`[AUTOMATION] Licencia ${generatedKey} emitida para ${clientName} (${db.licensedCount}/100 promocionales).`);

    res.json({ 
        success: true, 
        message: "Licencia emitida y activada con éxito.",
        licenseKey: generatedKey,
        credentials: {
            username: tempUsername,
            password: tempPassword,
            mustChangePassword: true
        }
    });
});

// Rutas integradas de Inventario y Escaneo (Código de Barras / QR)
app.get('/api/inventory', (req, res) => {
    res.json({ success: true, items: db.inventory });
});

app.post('/api/inventory/scan', (req, res) => {
    const { code } = req.body;
    const product = db.inventory.find(item => item.barcode === code);

    if (product) {
        res.json({ success: true, product });
    } else {
        res.status(404).json({ success: false, message: "Producto no encontrado en inventario." });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor Nexus ERP ejecutándose en el puerto ${PORT}`);
});
