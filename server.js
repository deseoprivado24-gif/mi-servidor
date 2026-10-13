const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware básico
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir la página web corporativa (index.html)
app.use(express.static(__dirname));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint de prueba para la promoción
app.get('/api/promo-price', (req, res) => {
    res.json({
        success: true,
        licensedCount: 15,
        isPromoActive: true
    });
});

app.listen(PORT, () => {
    console.log(`Servidor Nexus ERP activo en el puerto ${PORT}`);
});
