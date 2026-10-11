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
// Token fijo configurado directamente para evitar fallos de lectura
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '8930061734:AAFZf_--kVQAWVOn-Cj2pUG6s6WkRj4Z50Y';
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

// Webhook que recibe las interacciones de tu bot en Telegram
app.post(`/webhook/${TELEGRAM_TOKEN}`, (req, res) => {
    const update = req.body;

    if (update.message && update.message.text) {
        const chatId = update.message.chat.id;
        const textMessage = update.message.text.trim();
        const userName = update.message.from.first_name || 'Emprendedor';

        // Acceso exclusivo de administrador por correo
        if (textMessage === 'cambiostoday24@gmail.com') {
            const adminText = `👑 *¡Bienvenido al Panel de Administración, Larry!*\\n\\nSistema *Nexus ERP & POS* sincronizado y operando con éxito en producción.\\n\\nSelecciona una opción de gestión:`;
            
            const adminKeyboard = {
                inline_keyboard: [
                    [
                        { text: "🎁 Generar Cortesía (/cortesia)", callback_data: "cortesia" },
                        { text: "📊 Ver Inventario y Estado", callback_data: "ver_inventario" }
                    ],
                    [
                        { text: "📱 Mostrar Código QR de Pago", callback_data: "ver_qr" }
                    ]
                ]
            };
            sendTelegramMessage(chatId, adminText, adminKeyboard);
        } 
        else if (textMessage.toLowerCase().includes('/start') || textMessage.toLowerCase().includes('hola')) {
            const welcomeText = `¡Hola, *${userName}*! 🤖 Bienvenido a *Nexus ERP*, el sistema autónomo impulsado por bots.\\n\\nEnvía tu correo registrado para acceder al panel de administración o selecciona una opción:`;

            const keyboard = {
                inline_keyboard: [
                    [
                        { text: "📦 Ver Planes y Precios", callback_data: "ver_planes" },
                        { text: "💳 Pagar con Binance Pay", callback_data: "pagar_binance" }
                    ]
                ]
            };
            sendTelegramMessage(chatId, welcomeText, keyboard);
        } else {
            sendTelegramMessage(chatId, `Recibido. Escribe tu correo autorizado para entrar al panel o envía /start.`);
        }
    }

    res.sendStatus(200);
});

// Manejo de botones interactivos (Callback Queries) de Telegram
app.post(`/webhook/callback/${TELEGRAM_TOKEN}`, (req, res) => {
    const update = req.body;
    if (update.callback_query) {
        const chatId = update.callback_query.message.chat.id;
        const data = update.callback_query.data;

        if (data === 'ver_qr') {
            sendTelegramMessage(chatId, `📱 *Código QR y Datos de Pago USDT (Binance Pay / P2P):*\\n\\n• *Binance ID / Correo:* cambiostoday24@gmail.com\\n• *Red:* TRC20 / BEP20\\n\\nRealiza tu pago y reporta tu comprobante para emitir tu licencia al instante.`);
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
            sendTelegramMessage(chatId, `✅ *¡Licencia de cortesía generada con éxito!*\\n\\n• *Clave:* \`${newKey}\`\\n• *Estado:* Activa hasta 2027.\\n• *Cupos usados:* ${db.licensedCount}/100.`);
        } else if (data === 'ver_inventario') {
            sendTelegramMessage(chatId, `📊 *Estado del Servidor y Licencias:*\\n• Licencias Activas: ${Object.keys(db.licenses).length}\\n• Cupos Promocionales: ${db.licensedCount}/100 utilizados.`);
        }
    }
    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(`Servidor Nexus ERP ejecutándose en el puerto ${PORT}`);
});
