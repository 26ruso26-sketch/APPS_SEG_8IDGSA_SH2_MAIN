const rateLimit = require('express-rate-limit');
const { logSecurityEvent } = require('../utils/logger');

// Mapa en memoria para intentos fallidos: "ip:usuario" -> { count, lockUntil }
const loginFailures = new Map();

// Limitador de tasa general usando express-rate-limit para endpoint de login
const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 15, // Máximo 15 intentos totales por IP en el periodo
    message: { error: 'Demasiadas solicitudes de autenticación. Intente más tarde.' },
    standardHeaders: true,
    legacyHeaders: false
});

// Middleware para verificar bloqueo temporal de IP + Usuario
function checkAuthLockout(req, res, next) {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const username = (req.body.usuario || '').trim().toLowerCase();

    if (!username) {
        return next();
    }

    const key = `${ip}:${username}`;
    const record = loginFailures.get(key);

    if (record && record.lockUntil && Date.now() < record.lockUntil) {
        const remainingMinutes = Math.ceil((record.lockUntil - Date.now()) / (60 * 1000));
        
        // Registrar evento crítico de seguridad
        logSecurityEvent(
            'CRITICAL',
            ip,
            'LOGIN_LOCKED_ATTEMPT',
            `Intento de inicio de sesión bloqueado para usuario: "${username}" debido a bloqueo por fuerza bruta (intentos excedidos).`
        );
        
        return res.status(429).json({
            error: `Acceso bloqueado temporalmente. Intente de nuevo en ${remainingMinutes} minutos.`
        });
    }

    next();
}

// Registrar intento fallido
function recordFailedLogin(ip, username) {
    const key = `${ip}:${username.trim().toLowerCase()}`;
    let record = loginFailures.get(key);

    if (!record) {
        record = { count: 0, lockUntil: null };
    }

    record.count += 1;

    if (record.count >= 5) {
        record.lockUntil = Date.now() + 10 * 60 * 1000; // Bloqueo de 10 minutos
    }

    loginFailures.set(key, record);
    return record;
}

// Limpiar intentos fallidos tras login exitoso
function resetFailedLogin(ip, username) {
    const key = `${ip}:${username.trim().toLowerCase()}`;
    loginFailures.delete(key);
}

module.exports = {
    loginRateLimiter,
    checkAuthLockout,
    recordFailedLogin,
    resetFailedLogin
};
