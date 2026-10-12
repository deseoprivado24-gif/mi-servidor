const express = require('express');
const axios = require('axios');
const path = require('path'); // <-- Agregas esta línea

const app = express();
app.use(express.json());

// Sirve tu archivo index.html formal en la página principal
app.use(express.static(__dirname));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
const TELEGRAM_TOKEN = '8930061734:AAHya1EWKl5EuZXRAvTeynH0MpjmLuml-uI';
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
const ADMIN_EMAIL = 'cambiostoday24@gmail.com';

// El resto de tus funciones de Telegram y webhook se quedan exactamente igual...

