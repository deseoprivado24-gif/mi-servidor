const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;
const TELEGRAM_TOKEN = '8930061734:AAHya1EWKl5EuZXRAvTeynH0MpjmLuml-uI';
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
const ADMIN_EMAIL = 'cambiostoday24@gmail.com';

let licensedCount = 15;

// Servir la página web corporativa (index.html)
app.use(express.static(__dirname));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint de promociones para el index.html
app.get('/api/promo-price', (req, res) => {
    res.json({
        success: true,
        licensedCount: licensedCount,
        isPromoActive: licensedCount < 100
    });
});

// Función auxiliar para enviar mensajes a Telegram
async function sendMessage(chatId, text, replyMarkup = null) {
    try {
        const payload = { chat_id: chatId, text: text, parse_mode: 'Markdown' };
        if (replyMarkup) payload.reply_markup = replyMarkup;
        await axios.post(`${TELEGRAM_API}/sendMessage`, payload);
    } catch (error) {
        console.error('Error enviando mensaje:', error.message);
    }
}

// Webhook principal de Telegram
app.post(`/webhook/${TELEGRAM_TOKEN}`, async (req, res) => {
    try {
        const { message, callback_query } = req.body;

        if (message && message.text) {
            const chatId = message.chat.id; 
            const textMessage = message.text.trim().toLowerCase();

            if (textMessage === '/start' || textMessage === 'hola') {
                await sendMessage(chatId, `👋 *¡Bienvenido al Bot Nexus ERP & POS!*\n\nIngresa tu *correo autorizado* para acceder.`);
            } else if (textMessage === ADMIN_EMAIL) {
                const keyboard = {
                    inline_keyboard: [
                        [{ text: "🎁 Generar Cortesía / Créditos", callback_data: \"cmd_cortesia\" }],
                        [{ text: "📊 Ver Reporte de Ventas", callback_data: \"cmd_ventas\" }],
                        [{ text: "📦 Consultar Inventario", callback_data: \"cmd_inventario\" }],
                        [{ text: "📱 Generar Código QR", callback_data: \"cmd_qr\" }]
                    ]
                };
                await sendMessage(chatId, `🔓 *Acceso Concedido*\nBienvenido \`${ADMIN_EMAIL}\`. Selecciona una opción:`, keyboard);
            } else {
                await sendMessage(chatId, '⚠️ Correo no reconocido. Ingresa el correo de administración.');
            }
        }

        if (callback_query) {
            const chatId = callback_query.message.chat.id; 
            const data = callback_query.data;

            if (data === 'cmd_cortesia') {
                licensedCount++;
                await sendMessage(chatId, `🎁 *Cortesía Generada*\nCupos usados: ${licensedCount}/100.`);
            } else if (data === 'cmd_ventas') {
                await sendMessage(chatId, '📊 *Resumen de Ventas Hoy:*\n• Transacciones: 0\n• Total: 0.00 VES / USDT');
            } else if (data === 'cmd_inventario') {
                await sendMessage(chatId, '📦 *Inventario:*\nTodos los módulos sincronizados.');
            } else if (data === 'cmd_qr') {
                await sendMessage(chatId, '📱 *Pago Binance Pay:*\n`cambiostoday24@gmail.com`'); 
            }

            await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callback_query.id });
        }
    } catch (error) {
        console.error('Error interno:', error.message);
    }
    return res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(`Servidor activo en puerto ${PORT}`);
});

