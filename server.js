const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = {
  licenses: {
    "NEXUS-CORP-2026-VIP": { status: "ACTIVE", company: "Comercial Larry C.A." }
  }
};

const ADMIN_SECRET = "LarryAdmin2026";

app.get('/', (req, res) => {
  res.send('Servidor Nexus ERP Activo.');
});

app.get('/admin', (req, res) => {
  res.send(`
    <html>
    <head><title>Admin Nexus</title></head>
    <body style="background:#0f172a; color:#fff; font-family:Arial; padding:40px; text-align:center;">
        <h2>Panel Admin Nexus ERP</h2>
        <form action="/api/admin/activar" method="POST" style="display:inline-block; text-align:left; background:#1e293b; padding:20px; border-radius:10px;">
            <label>Clave Admin:</label><br>
            <input type="password" name="secret" required style="width:100%; padding:8px; margin:5px 0;"><br>
            <label>Clave de Licencia:</label><br>
            <input type="text" name="licenseKey" required style="width:100%; padding:8px; margin:5px 0;"><br>
            <label>Empresa:</label><br>
            <input type="text" name="clientName" required style="width:100%; padding:8px; margin:5px 0;"><br>
            <label>Días:</label><br>
            <input type="number" name="daysValid" value="30" required style="width:100%; padding:8px; margin:5px 0;"><br><br>
            <button type="submit" style="width:100%; background:#0284c7; color:#fff; border:none; padding:10px; font-weight:bold; cursor:pointer;">Activar</button>
        </form>
    </body>
    </html>
  `);
});

app.post('/api/admin/activar', (req, res) => {
  const { secret, licenseKey, clientName, daysValid } = req.body;
  if (secret !== ADMIN_SECRET) {
    return res.status(403).send('<h1 style="color:red; text-align:center; font-family:Arial;">Clave de administrador incorrecta.</h1>');
  }
  const expDate = new Date(Date.now() + (daysValid || 30) * 86400000).toISOString().split('T')[0];
  db.licenses[licenseKey] = { status: "ACTIVE", company: clientName, expires: expDate };
  res.send(`<h1 style="color:green; font-family:Arial; text-align:center; margin-top:50px;">¡Licencia ${licenseKey} activada con éxito hasta el ${expDate}!</h1><div style="text-align:center;"><a href="/admin">Volver al panel</a></div>`);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo exitosamente en el puerto ${PORT}`);
});
