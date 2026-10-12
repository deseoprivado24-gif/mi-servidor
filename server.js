const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Base de datos temporal de licencias
const db = {
  licenses: {
    "NEXUS-CORP-2026-VIP": { status: "ACTIVE", company: "Comercial Larry C.A." }
  }
};

const ADMIN_SECRET = "LarryAdmin2026";

// 1. Ruta Principal
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nexus ERP - El ERP Autónomo</title>
    <style>
        body { background-color: #0b0f19; color: #f3f4f6; font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #10b981; font-size: 36px; }
        p { color: #9ca3af; font-size: 18px; }
        .btn { display: inline-block; margin-top: 20px; background: #10b981; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; }
    </style>
</head>
<body>
    <h1>🚀 Servidor Nexus ERP Activo</h1>
    <p>El sistema está funcionando correctamente en la nube de Render.</p>
    <a href="/admin" class="btn">Ir al Panel de Administración</a>
</body>
</html>`);
});

// 2. Ruta del Panel Admin (/admin)
app.get('/admin', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin - Nexus ERP</title>
        <style>
            body { font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 20px; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .card { background: #1e293b; padding: 25px; border-radius: 12px; width: 100%; max-width: 400px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
            h2 { text-align: center; color: #38bdf8; margin-bottom: 20px; }
            label { display: block; margin-top: 12px; font-size: 14px; color: #cbd5e1; }
            input { width: 100%; padding: 10px; margin-top: 5px; border-radius: 6px; border: 1px solid #475569; background: #0f172a; color: #fff; box-sizing: border-box; }
            button { width: 100%; background: #0284c7; color: white; border: none; padding: 12px; margin-top: 20px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 16px; }
            button:hover { background: #0ea5e9; }
            #mensaje { margin-top: 15px; text-align: center; font-size: 14px; font-weight: bold; }
        </style>
    </head>
    <body>
    <div class="card">
        <h2>Nexus ERP Admin</h2>
        <form id="formAdmin">
            <label>Clave Secreta Admin:</label>
            <input type="password" id="secret" required placeholder="Tu clave maestra">
            <label>Clave de Licencia del Cliente:</label>
            <input type="text" id="licenseKey" required placeholder="Ej: NEXUS-CLIENTE-01">
            <label>Nombre del Cliente / Empresa:</label>
            <input type="text" id="clientName" required placeholder="Comercial Cliente">
            <label>Días de Vigencia:</label>
            <input type="number" id="daysValid" value="30" required>
            <button type="submit">Activar Licencia</button>
        </form>
        <div id="mensaje"></div>
    </div>
    <script>
        document.getElementById('formAdmin').addEventListener('submit', async (e) =>
