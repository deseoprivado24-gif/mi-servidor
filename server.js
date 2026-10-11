const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TELEGRAM_TOKEN = '8930061734:AAHya1EWKl5EuZXRAvTeynH0MpjmLuml-uI';
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
const ADMIN_EMAIL = 'cambiostoday24@gmail.com';

// Ruta principal para verificar que el servidor esté encendido
app.get('/', (req, res) => {
    res.send('Servidor Nexus ERP & POS ejecutándose correctamente.');
});

// Ruta del Webhook de Telegram
app.post(`/webhook/${TELEGRAM_TOKEN}`, async (req, res) => {
    try {
        const { message } = req.body;

        if (message && message.text) {
            const chatId = message.chat.id;
            const textMessage = message.text.trim().toLowerCase();

            if (textMessage === ADMIN_EMAIL) {
                const welcomeMessage = `🚀 *Bienvenido al Panel Nexus ERP & POS*\n\nAcceso concedido para: \`${ADMIN_EMAIL}\`\n\nSelecciona una opción del menú:`;
                
                const keyboard = {
                    inline_keyboard: [
                        [{ text: "🎁 Generar Cortesía", callback_data: "cmd_cortesia" }],
                        [{ text: "📦 Ver Inventario", callback_data: "cmd_inventario" }],
                        [{ text: "📱 Mostrar QR", callback_data: "cmd_qr" }]
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
                    text: '⚠️ Acceso no autorizado o comando no reconocido. Introduce el correo administrativo.'
                });
            }
        }
    } catch (error) {
        console.error('Error al procesar el mensaje del Webhook:', error.message);
    }

    return res.sendStatus(200);
});

// Manejo de botones (Callback Queries)
app.post(`/webhook/${TELEGRAM_TOKEN}/callback`, async (req, res) => {
    try {
        const { callback_query } = req.body;
        if (callback_query) {
            const chatId = callback_query.message.chat.id;
            const data = callback_query.data;

            let responseText = 'Opción procesada.';
            if (data === 'cmd_cortesia') responseText = '✅ Función de Generar Cortesía seleccionada.';
            if (data === 'cmd_inventario') responseText = '📦 Mostrando inventario actual...';
            if (data === 'cmd_qr') responseText = '📱 Generando código QR de acceso...';

            await axios.post(`${TELEGRAM_API}/sendMessage`, {
                chat_id: chatId,
                text: responseText
            });
        }
    } catch (error) {
        console.error('Error en callback:', error.message);
    }
    return res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});

