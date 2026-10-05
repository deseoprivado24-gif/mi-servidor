const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Endpoint que recibe el material generado por tus bots de marketing
app.post('/api/enviar-a-publer', async (req, res) => {
    try {
        const { titulo, contenido, mediaUrl } = req.body;

        // Aquí colocas la URL del Webhook que te proporcione tu plataforma puente (ej. Make)
       const webhookUrl1 = 'https://hooks.zapier.com/hooks/catch/...';

        const payload = {
            workspace: 'deseo privado',
            title: titulo,
            body: contenido,
            media: mediaUrl,
            timestamp: new Date().toISOString()
        };

        // Enviamos el material generado
        const response = await axios.post(webhookUrl, payload);

        res.status(200).json({
            success: true,
            message: 'Material enviado correctamente hacia el flujo de distribución.',
            publerResponse: response.data
        });

    } catch (error) {
        console.error('Error al enviar el material:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de marketing corriendo en el puerto ${PORT}`);
});

