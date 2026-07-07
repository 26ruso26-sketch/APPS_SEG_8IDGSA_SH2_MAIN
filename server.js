require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const honeytokenMiddleware = require('./middleware/honeytoken');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar confianza en proxies para obtener la IP del cliente real (ej. detrás de ngrok)
app.set('trust proxy', 1);

// 1. Configuración de Morgan para registrar el tráfico en access.log
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));

// 2. Hardening con Helmet y directivas estrictas de Content Security Policy (CSP)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'"],
            imgSrc: ["'self'"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    }
}));

// Parsers de cuerpo de solicitud
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Middleware Honeytoken (bloqueo de rutas antes del servidor estático)
app.use(honeytokenMiddleware);

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'public')));

// Enrutamiento de las APIs
app.use('/api', leaderboardRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Manejo general de rutas inexistentes (404)
app.use((req, res) => {
    res.status(404).send('Not Found');
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`[BLUE-TEAM] Servidor iniciado correctamente en el puerto ${PORT}`);
});
