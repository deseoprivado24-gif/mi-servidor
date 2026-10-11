const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TELEGRAM_TOKEN = '8930061734:AAHya1EWKl5EuZXRAvTeynH0MpjmLuml-uI';
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
const ADMIN_EMAIL = 'cambiostoday24@gmail.com';

// Verificación de estado del servidor
app.get('/', (req, res) => {
    res.send('🚀 Servidor Nexus ERP & POS ejecutándose correctamente.');
});

// Enviar mensaje a Telegram
async function sendMessage(chatId, text, replyMarkup = null) {
    try {
        const payload = {
            chat_id: chatId,
            text: text,
            parse_mode: 'Markdown'
        };
        if (replyMarkup) {
            payload.reply_markup = replyMarkup;
        }
        await axios.post(`${TELEGRAM_API}/sendMessage`, payload);
    } catch (error) {
        console.error('Error enviando mensaje a Telegram:', error.response ? error.response.data : error.message);
    }
}

// Webhook Principal
app.post(`/webhook/${TELEGRAM_TOKEN}`, async (req, res) => {
    try {
        const { message, callback_query } = req.body;

        // Manejo de mensajes de texto
        if (message && message.text) {
            const chatId = message.chat.id;
            const textMessage = message.text.trim().toLowerCase();

            // Comando /start o saludo
            if (textMessage === '/start' || textMessage === 'hola') {
                const welcomeText = `👋 *¡Bienvenido al Bot de Gestión Nexus ERP & POS!*\n\nPara acceder al panel de administración, por favor ingresa tu *correo autorizado*.`;
                await sendMessage(chatId, welcomeText);
            } 
            // Validación de Administrador
            else if (textMessage === ADMIN_EMAIL) {
                const adminText = `🔓 *Acceso Concedido - Panel de Administración Nexus ERP*\n\nBienvenido, \`${ADMIN_EMAIL}\`.\nSelecciona una acción del menú:`;
                
                const keyboard = {
                    inline_keyboard: [
                        [{ text: "🎁 Generar Cortesía / Créditos", callback_data: "cmd_cortesia" }],
                        [{ text: "📊 Ver Reporte de Ventas", callback_data: "cmd_ventas" }],
                        [{ text: "📦 Consultar Inventario", callback_data: "cmd_inventario" }],
                        [{ text: "📱 Generar Código QR", callback_data: "cmd_qr" }]
                    ]
                };

                await sendMessage(chatId, adminText, keyboard);
            } 
            // Mensaje genérico para usuarios no autorizados
            else {
                await sendMessage(chatId, '⚠️ Correo no reconocido o comando inválido. Ingresa el correo de administración registrado.');
            }
        }

        // Manejo de botones (Callback Queries)
        if (callback_query) {
            const chatId = callback_query.message.chat.id;
            const data = callback_query.data;

            if (data === 'cmd_cortesia') {
                await sendMessage(chatId, '🎁 *Generador de Cortesías Nexus*\n\nEscribe la cantidad de créditos a asignar o selecciona una opción rápida:');
            } else if (data === 'cmd_ventas') {
                await sendMessage(chatId, '📊 *Resumen de Ventas Hoy:*\n\n• Transacciones: 0\n• Total VES: 0.00\n• Total USDT: 0.00');
            } else if (data === 'cmd_inventario') {
                await sendMessage(chatId, '📦 *Estado del Inventario:*\n\nTodos los módulos se encuentran sincronizados correctamente con Nexus POS.');
            } else if (data === 'cmd_qr') {
                await sendMessage(chatId, '📱 *Código QR de Acceso Rápido:*\n\nProcesando enlace de validación para caja...');
            }

            // Responder a Telegram para cerrar la animación del botón
            await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
                callback_query_id: callback_query.id
            });
        }

    } catch (error) {
        console.error('Error interno en Webhook:', error.message);
    }

    return res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(`Servidor Nexus ERP activo en puerto ${PORT}`);
});

