/**
 * ============================================================================
 * NEXUS ERP & POS - ACCESO ADMINISTRADOR POR CORREO Y BOT AUTÓNOMO
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

// Base de datos y configuración del Administrador
const db = {
    licensedCount: 0,
    publicContactEmail: "deseoprivado@gmail.com",
    adminSecretEmail: "cambiostoday24@gmail.com", // Tu correo autorizado
    licenses: {
        "NEXUS-CORP-2026-VIP": {
            status: "ACTIVE",
            tier: "Enterprise Tier ($120/mes)",
            expires: "2027-03-30",
            company: "Comercial Larry C.A."
        }
    },
    inventory: [
        { id: 1, barcode: "750123456789", name: "Producto Demo", price: 10.00, stock: 100 }
    ]
};

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '7930061734:AAH...';
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// Funciones auxiliares para Telegram
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
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    };

    const req = https.request(options, (res) => {});
    req.on('error', (error) => console.error('Error:', error));
    req.write(data);
    req.end();
}

function sendTelegramPhoto(chatId, photoUrl, captionText) {
    const data = JSON.stringify({
        chat_id: chatId,
        photo: photoUrl,
        caption: captionText,
        parse_mode: 'Markdown'
    });

    const url = new URL(`${TELEGRAM_API}/sendPhoto`);
    const options = {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    };

    const req = https.request(options, (res) => {});
    req.on('error', (error) => console.error('Error:', error));
    req.write(data);
    req.end();
}

// Webhook que procesa los mensajes y el reconocimiento de tu correo en Telegram
app.post(`/webhook/${TELEGRAM_TOKEN}`, (req, res) => {
    const update = req.body;
    
    if (update.message && update.message.text) {
        const chatId = update.message.chat.id;
        const textMessage = update.message.text.trim();
        const textLower = textMessage.toLowerCase();
        const userName = update.message.from.first_name || 'Emprendedor';

        // SI ESCRIBES TU CORREO DE ADMINISTRADOR DIRECTAMENTE EN EL CHAT
        if (textLower === db.adminSecretEmail.toLowerCase()) {
            const adminKeyboard = {
                inline_keyboard: [
                    [
                        { text: "🚀 Abrir Panel Administrador", url: "https://" + (req.headers.host || "localhost:3000") }
                    ],
                    [
                        { text: "🎁 Generar Licencia Cortesía", callback_data: "menu_cortesia" },
                        { text: "💳 Ver QR de Pago", callback_data: "enviar_qr" }
                    ]
                ]
            };

            sendTelegramMessage(chatId, `🔐 *¡Acceso de Administrador Autorizado!*\n\nCorreo detectado: \`${db.adminSecretEmail}\`\n\nBienvenido al núcleo de control de *Nexus ERP*. Sesión iniciada con privilegios totales. Selecciona una acción:`, adminKeyboard);
        }
        else if (textLower.includes('/start') || textLower.includes('hola')) {
            const welcomeText = `¡Hola, *${userName}*! 🤖 Bienvenido a *Nexus ERP*.\n\nPara ingresar como Administrador o identificar tu sesión, **envía tu correo electrónico registrado** por este chat, o selecciona una opción:`;
            
            const keyboard = {
                inline_keyboard: [
                    [
                        { text: "📦 Ver Planes", callback_data: "ver_planes" },
                        { text: "💳 Pedir Código QR de Pago", callback_data: "enviar_qr" }
                    ],
                    [
                        { text: "💬 Soporte", url: "https://t.me/cobro_deseo_privado_bot" }
                    ]
                ]
            };

            sendTelegramMessage(chatId, welcomeText, keyboard);
        } 
        else if (textLower.startsWith('/cortesia')) {
            // Comando para emitir licencias de regalo de forma directa
            const beneficiary = textMessage.split(' ').slice(1).join(' ') || "Familiar / Amistad";
            const courtesyKey = `VIP-CORTESIA-${Math.floor(100000 + Math.random() * 900000)}`;
            
            db.licenses[courtesyKey] = {
                status: "ACTIVE",
                tier: "Licencia Cortesía VIP Exclusiva",
                expires: "2027-12-31",
                company: beneficiary
            };

            sendTelegramMessage(chatId, `🎁 *¡Licencia de Cortesía Generada con Éxito!*\n\nAutorizado por: \`${db.adminSecretEmail}\`\nBeneficiario: *${beneficiary}*\nClave de Licencia: \`${courtesyKey}\``);
        } 
        else if (textLower.includes('qr') || textLower.includes('pagar') || textLower.includes('binance')) {
            const qrImageUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80";
            const caption = `💳 *Pasarela de Pago Automática (Binance Pay / USDT)*\n\nEscanea el código QR o transfiere al ID corporativo. Si eres administrador, escribe directamente tu correo \`${db.adminSecretEmail}\` para entrar al panel.`;
            sendTelegramPhoto(chatId, qrImageUrl, caption);
        } 
        else {
            sendTelegramMessage(chatId, `Comando recibido. Si eres administrador, recuerda escribir tu correo electrónico para abrir el panel de control.`);
        }
    } 
    else if (update.callback_query) {
        const chatId = update.callback_query.message.chat.id;
        const data = update.callback_query.data;

        if (data === "enviar_qr") {
            const qrImageUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80";
            sendTelegramPhoto(chatId, qrImageUrl, `💳 *Código QR de Pago (Binance Pay)*`);
        } else if (data === "menu_cortesia") {
            sendTelegramMessage(chatId, `🎁 *Módulo de Cortesías*\n\nPara regalar una licencia, escribe el comando:\n\`/cortesia [Nombre del Familiar]\``);
        } else {
            sendTelegramMessage(chatId, `Operación procesada.`);
        }
    }
    
    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(`Servidor Nexus ERP ejecutándose en el puerto ${PORT}`);
});
