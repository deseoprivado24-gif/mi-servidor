const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Base de datos temporal de licencias en el servidor
// Aquí se irán guardando las licencias que tú actives
const db = {
  licenses: {
    "NEXUS-CORP-2026-VIP": {
      status: "ACTIVE",
      tier: "Enterprise Tier",
      expires: "2027-12-31",
      company: "Comercial Larry C.A."
    }
  }
};

// Clave secreta para que SOLO TÚ puedas activar licencias desde el celular
const ADMIN_SECRET = "LarryAdmin2026";

// 1. RUTA PRINCIPAL: Muestra tu página web comercial (index.html)
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nexus ERP - El ERP Autónomo</title>
    <style>
        :root {
            --bg-color: #0b0f19;
            --card-bg: #131c2e;
            --accent-green: #10b981;
            --accent-glow: rgba(16, 185, 129, 0.4);
            --text-main: #f3f4f6;
            --text-muted: #9ca3af;
            --border-color: #1f293d;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        body { background-color: var(--bg-color); color: var(--text-main); line-height: 1.6; overflow-x: hidden; position: relative; }
        .promo-banner { background: linear-gradient(90deg, #059669 0%, #10b981 100%); color: #000; text-align: center; padding: 10px 20px; font-weight: 700; font-size: 15px; }
        header { display: flex; justify-content: space-between; align-items: center; padding: 15px 8%; border-bottom: 1px solid var(--border-color); background-color: rgba(11, 15, 25, 0.98); position: sticky; top: 0; z-index: 100; flex-wrap: wrap; gap: 15px; }
        .logo-container { display: flex; align-items: center; gap: 12px; }
        .nexus-logo { width: 34px; height: 34px; background: var(--bg-color); border: 2px solid var(--accent-green); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 900; color: var(--accent-green); font-size: 20px; box-shadow: 0 0 10px var(--accent-glow); font-family: monospace; }
        .logo-text { font-size: 24px; font-weight: 700; color: var(--text-main); letter-spacing: 1px; }
        .logo-text span { color: var(--accent-green); }
        .header-controls { display: flex; align-items: center; gap: 15px; flex-wrap: wrap; }
        .selector-box { background-color: var(--card-bg); border: 1px solid var(--border-color); color: var(--text-main); padding: 6px 12px; border-radius: 6px; font-size: 14px; cursor: pointer; outline: none; max-width: 240px; }
        nav a { color: var(--text-muted); text-decoration: none; margin-left: 20px; font-size: 15px; transition: color 0.2s; }
        nav a:hover { color: var(--accent-green); }
        .marquee-container { width: 100%; background-color: #080a10; padding: 15px 0; overflow: hidden; white-space: nowrap; border-bottom: 1px solid var(--border-color); }
        .marquee-content { display: inline-block; animation: marquee 35s linear infinite; }
        .marquee-item { display: inline-block; color: var(--text-muted); font-size: 16px; margin: 0 30px; font-weight: 500; }
        @keyframes marquee { 0% { transform: translate(0, 0); } 100% { transform: translate(-50%, 0); } }
        .hero { text-align: center; padding: 60px 20px 50px 20px; max-width: 900px; margin: 0 auto; }
        .hero h1 { font-size: 48px; margin-bottom: 20px; font-weight: 800; }
        .hero h1 span { color: var(--accent-green); }
        .hero p { font-size: 18px; color: var(--text-muted); margin-bottom: 40px; }
        .cta-buttons { display: flex; justify-content: center; gap: 15px; margin-bottom: 50px; }
        .btn { padding: 14px 28px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; text-decoration: none; transition: all 0.2s; }
        .btn-primary { background-color: var(--accent-green); color: #000; box-shadow: 0 4px 14px var(--accent-glow); }
        .btn-primary:hover { background-color: #059669; }
        .btn-secondary { background-color: transparent; border: 1px solid var(--border-color); color: var(--text-main); }
        section { padding: 80px 8%; max-width: 1200px; margin: 0 auto; }
        .section-title { text-align: center; font-size: 32px; margin-bottom: 50px; font-weight: 700; }
        .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
        .card { background-color: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 30px; }
        .card h3 { font-size: 20px; margin-bottom: 15px; color: var(--accent-green); }
        .card p { color: var(--text-muted); font-size: 14px; }
        .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 30px; }
        .price-card { background-color: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 40px 30px; display: flex; flex-direction: column; justify-content: space-between; }
        .price-card.featured { border-color: var(--accent-green); box-shadow: 0 0 20px rgba(16, 185, 129, 0.15); }
        .price { font-size: 36px; font-weight: 800; color: var(--accent-green); margin: 20px 0; }
        .price span { font-size: 14px; color: var(--text-muted); font-weight: normal; }
        .price-features { list-style: none; margin-bottom: 30px; }
        .price-features li { font-size: 14px; color: var(--text-muted); margin-bottom: 12px; }
        .price-features li::before { content: "✓"; color: var(--accent-green); font-weight: bold; margin-right: 10px; }
        .mission-vision { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; }
        .contact-section { background-color: var(--card-bg); border: 1px solid var(--border-color); border-radius: 16px; padding: 50px; max-width: 800px; margin: 40px auto; text-align: center; }
        .contact-email { font-size: 20px; font-weight: 600; color: var(--text-main); margin: 20px 0; display: inline-block; background: rgba(16, 185, 129, 0.1); padding: 12px 24px; border-radius: 8px; border: 1px dashed var(--accent-green); text-decoration: none; }
        .floating-support { position: fixed; bottom: 30px; right: 30px; background-color: var(--accent-green); color: #000; padding: 14px 22px; border-radius: 30px; font-weight: 700; text-decoration: none; box-shadow: 0 4px 20px var(--accent-glow); z-index: 1000; display: flex; align-items: center; gap: 8px; }
        footer { text-align: center; padding: 40px; border-top: 1px solid var(--border-color); color: var(--text-muted); font-size: 14px; }
        @media (max-width: 768px) { .mission-vision { grid-template-columns: 1fr; } .hero h1 { font-size: 36px; } header { flex-direction: column; align-items: flex-start; padding: 15px 5%; } }
    </style>
</head>
<body>
    <div class="promo-banner">🔥 PROMOCIÓN ESPECIAL: 50% DE DESCUENTO EN LICENCIAS PARA LOS PRIMEROS 100 USUARIOS</div>
    <header>
        <div class="logo-container">
            <div class="nexus-logo">N</div>
            <div class="logo-text">Nexus<span>ERP</span></div>
        </div>
        <div class="header-controls">
            <select class="selector-box" id="countrySelector" onchange="cambiarPais()">
                <option value="global_usd" selected>🌐 Global (USD)</option>
                <option value="ve">🇻🇪 Venezuela (VES)</option>
                <option value="do">🇩🇴 República Dominicana (DOP)</option>
                <option value="co">🇨🇱 Colombia (COP)</option>
            </select>
        </div>
        <nav>
            <a href="#caracteristicas">Características</a>
            <a href="#mision-vision">Nosotros</a>
            <a href="#precios">Licencias</a>
            <a href="#contacto">Contacto</a>
        </nav>
    </header>
    <div class="marquee-container">
        <div class="marquee-content">
            <span class="marquee-item">🚀 Automatización Total</span>
            <span class="marquee-item">🤖 Ecosistema de Bots 24/7</span>
            <span class="marquee-item">💬 Integración Directa por WhatsApp</span>
            <span class="marquee-item">💰 Pagos con Binance Pay</span>
            <span class="marquee-item">📊 Control Financiero y Fiscal</span>
        </div>
    </div>
    <section class="hero">
        <h1>Tu empresa en <span>piloto automático</span>, sin fricción administrativa.</h1>
        <p>El ERP autónomo gestionado por bots inteligentes. Solicita tu licencia vía WhatsApp, paga con Binance o Pago Móvil y automatiza tu contabilidad.</p>
        <div class="cta-buttons">
            <a href="#precios" class="btn btn-primary">Comprar Licencia</a>
            <a href="#caracteristicas" class="btn btn-secondary">Conocer Más</a>
        </div>
    </section>
    <section id="caracteristicas">
        <h2 class="section-title">Ecosistema Autónomo Integrado</h2>
        <div class="grid-3">
            <div class="card">
                <h3>🤖 Bots de Operación 24/7</h3>
                <p>Gestión automatizada de contabilidad fiscal adaptada a las leyes de tu país y control de almacén en tiempo real.</p>
            </div>
            <div class="card">
                <h3>🛡️ Control Universal de Pérdidas</h3>
                <p>Rastreo transversal de mermas, diferencias en caja y costos ocultos para blindar la rentabilidad de tu negocio.</p>
            </div>
            <div class="card">
                <h3>🍽️ Comanda Digital Integrada</h3>
                <p>Opción flexible ideal para locales de comida rápida, conectando pedidos con la cocina de inmediato.</p>
            </div>
        </div>
    </section>
    <section id="precios">
        <h2 class="section-title">Planes y Licencias</h2>
        <div class="pricing-grid">
            <div class="price-card">
                <div>
                    <h3>Plan Básico</h3>
                    <p>Ideal para emprendimientos y comercios locales.</p>
                    <div class="price" id="price1">$15 <span>/ mes</span></div>
                    <ul class="price-features">
                        <li>Contabilidad básica</li>
                        <li>Control de inventario sencillo</li>
                        <li>Control básico de pérdidas</li>
                        <li>Suspensión automática por impago</li>
                    </ul>
                </div>
                <a href="https://wa.me/584128910215?text=Hola,%20deseo%20adquirir%20el%20Plan%20B%C3%A1sico%20de%20Nexus%20ERP" target="_blank" class="btn btn-primary" style="text-align: center;">Adquirir por WhatsApp</a>
            </div>
            <div class="price-card featured">
                <div>
                    <h3>Plan Premium</h3>
                    <p>Para comercios en expansión y mayor volumen.</p>
                    <div class="price" id="price2">$45 <span>/ mes</span></div>
                    <ul class="price-features">
                        <li>Contabilidad avanzada con cumplimiento fiscal</li>
                        <li>Almacén con reposición automática</li>
                        <li>Control analítico de pérdidas y auditoría</li>
                        <li>Múltiples usuarios con permisos</li>
                    </ul>
                </div>
                <a href="https://wa.me/584128910215?text=Hola,%20deseo%20adquirir%20el%20Plan%20Premium%20de%20Nexus%20ERP" target="_blank" class="btn btn-primary" style="text-align: center;">Adquirir por WhatsApp</a>
            </div>
            <div class="price-card">
                <div>
                    <h3>Plan Platinum</h3>
                    <p>Macro-operación, corporaciones e industria.</p>
                    <div class="price" id="price3">$120 <span>/ mes</span></div>
                    <ul class="price-features">
                        <li>Ecosistema completo de bots autónomos</li>
                        <li>Control de producción macro</li>
                        <li>Logística avanzada y rutas de despacho</li>
                        <li>Control macro de pérdidas en cadena</li>
                    </ul>
                </div>
                <a href="https://wa.me/584128910215?text=Hola,%20deseo%20adquirir%20el%20Plan%20Platinum%20de%20Nexus%20ERP" target="_blank" class="btn btn-primary" style="text-align: center;">Adquirir por WhatsApp</a>
            </div>
        </div>
    </section>
    <section id="contacto">
        <div class="contact-section">
            <h3>Contacto Oficial</h3>
            <p>¿Tienes dudas o necesitas una cotización corporativa a la medida? Escríbenos directamente:</p>
            <a href="mailto:deseoprivado@gmail.com" class="contact-email">deseoprivado@gmail.com</a>
        </div>
    </section>
    <a href="https://wa.me/584128910215?text=Hola,%20necesito%20soporte%20o%20informaci%C3%B3n%20sobre%20Nexus%20ERP" target="_blank" class="floating-support" title="Soporte y Atención al Cliente">
        💬 Soporte 24/7
    </a>
    <footer>
        <p>&copy; 2026 Nexus ERP &bull; Deseo Privado. Todos los derechos reservados.</p>
    </footer>
    <script>
        function cambiarPais() {
            const pais = document.getElementById('countrySelector').value;
            const p1 = document.getElementById('price1'), p2 = document.getElementById('price2'), p3 = document.getElementById('price3');
            if (pais === 've') {
                p1.innerHTML = 'Bs. 570 <span>Bs. / mes</span>';
                p2.innerHTML = 'Bs. 1,710 <span>Bs. / mes</span>';
                p3.innerHTML = 'Bs. 4,560 <span>Bs. / mes</span>';
            } else if (pais === 'do') {
                p1.innerHTML = 'RD$ 880 <span>DOP / mes</span>';
                p2.innerHTML = 'RD$ 2,640 <span>DOP / mes</span>';
                p3.innerHTML = 'RD$ 7,040 <span>DOP / mes</span>';
            } else {
                p1.innerHTML = '$15 <span>USD / mes</span>';
                p2.innerHTML = '$45 <span>USD / mes</span>';
                p3.innerHTML = '$120 <span>USD / mes</span>';
            }
        }
    </script>
</body>
</html>`);
});

// 2. RUTA DE VALIDACIÓN (La que consulta el Nexus ERP del cliente)
app.post('/api/verify-global', (req, res) => {
  const { key } = req.body;
  if (db.licenses[key] && db.licenses[key].status === "ACTIVE") {
    return res.json({ success: true, message: "Licencia VÁLIDA y ACTIVA." });
  }
  return res.json({ success: false, message: "Licencia no válida o vencida." });
});

// 3. RUTA DE ACCESO AL PANEL ADMIN DESDE EL CELULAR (/admin)
app.get('/admin', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin - Nexus ERP</title>
        <style>
            body { font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 20px; display: flex; justify-content: center; }
            .card { background: #1e293b; padding: 20px; border-radius: 10px; width: 100%; max-width: 400px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
            h2 { text-align: center; color: #38bdf8; }
            label { display: block; margin-top: 10px; font-size: 14px; }
            input { width: 100%; padding: 10px; margin-top: 5px; border-radius: 5px; border: 1px solid #475569; background: #0f172a; color: #fff; box-sizing: border-box; }
            button { width: 100%; background: #0284c7; color: white; border: none; padding: 12px; margin-top: 20px; border-radius: 5px; font-weight: bold; cursor: pointer; }
            button:hover { background: #0ea5e9; }
            #mensaje { margin-top: 15px; text-align: center; font-size: 14px; }
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
        document.getElementById('formAdmin').addEventListener('submit', async (e) => {
            e.preventDefault();
            const msg = document.getElementById('mensaje');
            msg.style.color = '#cbd5e1';
            msg.innerText = 'Activando...';
            
            const data = {
                secret: document.getElementById('secret').value,
                licenseKey: document.getElementById('licenseKey').value,
                clientName: document.getElementById('clientName').value,
                daysValid: parseInt(document.getElementById('daysValid').value)
            };

            const res = await fetch('/api/admin/activar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            msg.style.color = result.success ? '#4ade80' : '#f87171';
            msg.innerText = result.message;
        });
    </script>
    </body>
    </html>
  `);
});

// 4. ENDPOINT QUE PROCESA LA ACTIVACIÓN DESDE EL PANEL
app.post('/api/admin/activar', (req, res) => {
  const { secret, licenseKey, clientName, daysValid } = req.body;

  if (secret !== ADMIN_SECRET) {
    return res.status(403).json({ success: false, message: "Clave de administrador incorrecta." });
  }

  const expDate = new Date(Date.now() + (daysValid || 30) * 86400000).toISOString().split('T')[0];

  db.licenses[licenseKey] = {
    status: "ACTIVE",
    tier: "Licencia Comercial ERP",
    expires: expDate,
    company: clientName
  };

  console.log(`[MANUAL] Licencia activada: ${licenseKey} para ${clientName}`);
  return res.json({ success: true, message: `¡Licencia ${licenseKey} activada con éxito hasta el ${expDate}!` });
});

app.listen(PORT, () => {
  console.log(`Servidor Nexus ERP activo en puerto ${PORT}`);
});

