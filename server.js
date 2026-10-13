const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. IMPORTANTE: Esto le dice a Express que sirva todos los archivos estáticos de la carpeta
app.use(express.static(__dirname));

// 2. IMPORTANTE: Esto asegura que al entrar a la raíz ('/') se cargue tu index.html limpio
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// El resto de tus rutas de API y el bot se quedan igual...
