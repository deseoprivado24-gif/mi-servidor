/**
 * ============================================================================
 * NEXUS ERP & POS - SERVIDOR OFICIAL PARA PRODUCCIÓN Y BOTS AUTÓNOMOS
 * ============================================================================
 */

const express = require('express');
const https = require('https');
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

// Base de datos lógica de licencias, usuarios e inventario
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
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '7930061734:AAH...';
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// Función auxiliar para enviar mensajes a Telegram
function sendTelegramMessage(chatId, text, replyMarkup = null) {
    const data = JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
        reply_markup: replyMarkup
    });

    const url = new URL(`${TELEGRAM_API}/sendMessage`);
    const options = {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
        }
    };

    const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => responseBody += chunk);
        res.on('end', () => {});
    });

    req.on('error', (error) => {
        console.error('Error enviando mensaje a Telegram:', error);
    });

    req.write(data);
    req.end();
}

// Endpoint para verificar la tarifa promocional de la licencia desde la web
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

    db.licensedCount += 1;
    const generatedKey = licenseKey || `NEXUS-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
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

// Webhook que recibe las interacciones de tu bot en Telegram
app.post(`/webhook/${TELEGRAM_TOKEN}`, (req, res) => {
    const update = req.body;
    
    if (update.message && update.message.text) {
        const chatId = update.message.chat.id;
        const textMessage = update.message.text.trim().toLowerCase();
        const userName = update.message.from.first_name || 'Emprendedor';

        if (textMessage.includes('/start') || textMessage.includes('hola')) {
            const welcomeText = `¡Hola, *${userName}*! 🤖 Bienvenido a *Nexus ERP*, el sistema autónomo impulsado por bots.\n\nSelecciona una opción para gestionar tu licencia o consultar nuestros planes:`;
            
            const keyboard = {
                inline_keyboard: [
                    [
                        { text: "📦 Ver Planes y Precios", callback_data: "ver_planes" },
                        { text: "💳 Pagar con Binance Pay", callback_data: "pagar_binance" }
                    ],
                    [
                        { text: "📡 Módulo ISPs y TV", callback_data: "ver_isps" },
                        { text: "💬 Soporte 24/7", url: "https://t.me/cobro_deseo_privado_bot" }
                    ]
                ]
            };

            sendTelegramMessage(chatId, welcomeText, keyboard);
        } else {
            sendTelegramMessage(chatId, `Recibido. Escribe /start para desplegar el menú de automatización y licencias.`);
        }
    }
    
    res.sendStatus(200);
});

// Rutas de Inventario y Escaneo
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
