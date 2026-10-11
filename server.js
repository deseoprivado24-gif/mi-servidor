const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TELEGRAM_TOKEN = '8930061734:AAHya1EWKl5EuZXRAvTeynH0MpjmLuml-uI';
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
const ADMIN_EMAIL = 'cambiostoday24@gmail.com';

app.get('/', (req, res) => {
    res.send('Servidor Nexus ERP en linea');
});

app.post(`/webhook/${TELEGRAM_TOKEN}`, async (req, res) => {
    try {
        const { message } = req.body;
        if (message && message.text) {
            const chatId = message.chat.id;
            const textMessage = message.text.trim().toLowerCase();

            if (textMessage === ADMIN_EMAIL) {
                const welcomeMessage = `🚀 *Panel Nexus ERP & POS*\n\nAcceso concedido para: \`${ADMIN_EMAIL}\``;
                
                const keyboard = {
                    inline_keyboard: [
                        [{ text: "🎁 Generar Cortesía", callback_data: "cmd_cortesia" }],
                        [{ text: "📦 Ver Inventario", callback_data: "cmd_inventario" }]
                    ]
                };

                await axios.post(`${TELEGRAM_API}/sendMessage`, {
                    chat_id: chatId,
                    text: welcomeMessage,
                    parse_mode: 'Markdown',
                    reply_markup: keyboard
                });
            } else {
                await axios.post(`${TELEGRAM_API}/sendMessage`, {
                    chat_id: chatId,
                    text: '⚠️ Acceso no autorizado. Introduce el correo administrativo.'
                });
            }
        }
    } catch (error) {
        console.error('Error webhook:', error.message);
    }
    return res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(`Servidor activo en puerto ${PORT}`);
});
