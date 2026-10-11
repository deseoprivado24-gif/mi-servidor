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
    licensedCount: 0,
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

// Coloca aquí tu token actual de Telegram (asegúrate de que sea el tuyo correcto)
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || 'PEG_A_AQUÍ_TU_TOKEN';
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

// Endpoint para verificar la tarifa promocional
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
            ? `Promoción activa del 50% de descuento. Quedan ${100 - db.licensedCount} cupos.`
            : "Tarifa estándar aplicable."
    });
});

// Endpoint automatizado para recibir pagos
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

    res.json({
        success: true,
        message: "Licencia emitida y activada con éxito.",
        licenseKey: generatedKey,
        credentials: { username: tempUsername, password: tempPassword }
    });
});

// Webhook principal de Telegram
app.post(`/webhook/${TELEGRAM_TOKEN}`, (req, res) => {
    const update = req.body;

    // Manejo de clics en botones interactivos
    if (update.callback_query) {
        const chatId = update.callback_query.message.chat.id;
        const data = update.callback_query.data;

        if (data === 'ver_qr') {
            sendTelegramMessage(chatId, `📱 *Datos de Pago USDT (Binance Pay / P2P):*\n\n• *Correo:* cambiostoday24@gmail.com\n• *Red:* TRC20 / BEP20`);
        } else if (data === 'cortesia') {
            db.licensedCount += 1;
            const newKey = `NEXUS-CORTESIA-${Math.floor(1000 + Math.random() * 9000)}`;
            db.licenses[newKey] = {
                status: "ACTIVE",
                tier: "Licencia Cortesía VIP",
                expires: "2027-12-31",
                country: "VEN",
                currency: "VES",
                company: "Comercial Larry C.A."
            };
            sendTelegramMessage(chatId, `✅ *¡Licencia generada con éxito!*\n\n• *Clave:* \`${newKey}\`\n• *Cupos usados:* ${db.licensedCount}/100.`);
        } else if (data === 'ver_inventario') {
            sendTelegramMessage(chatId, `📊 *Estado del Servidor:*\n• Licencias Activas: ${Object.keys(db.licenses).length}\n• Cupos Promocionales: ${db.licensedCount}/100.`);
        }
        return res.sendStatus(200);
    }

    // Manejo de mensajes de texto en el chat
    if (update.message && update.message.text) {
        const chatId = update.message.chat.id;
        const textMessage = update.message.text.trim();
        const userName = update.message.from.first_name || 'Emprendedor';

        // Si escribes tu correo exacto, te da acceso de administrador
        if (textMessage === 'cambiostoday24@gmail.com') {
            const adminText = `👑 *¡Bienvenido al Panel de Administración!*\n\nSistema *Nexus ERP & POS* sincronizado con éxito.\n\nSelecciona una opción:`;
            
            const adminKeyboard = {
                inline_keyboard: [
                    [
                        { text: "🎁 Generar Cortesía", callback_data: "cortesia" },
                        { text: "📊 Ver Inventario", callback_data: "ver_inventario" }
                    ],
                    [
                        { text: "📱 Mostrar Datos de Pago", callback_data: "ver_qr" }
                    ]
                ]
            };
            sendTelegramMessage(chatId, adminText, adminKeyboard);
        }
        else if (textMessage.toLowerCase().includes('/start') || textMessage.toLowerCase().includes('hola')) {
            const welcomeText = `¡Hola, *${userName}*! 🤖 Bienvenido a *Nexus ERP*.\n\nEnvía tu correo registrado para acceder al panel de administración:`;
            sendTelegramMessage(chatId, welcomeText);
        } else {
            sendTelegramMessage(chatId, `Recibido. Escribe tu correo autorizado para entrar al panel o envía /start.`);
        }
    }

    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(`Servidor Nexus ERP ejecutándose en el puerto ${PORT}`);
});

