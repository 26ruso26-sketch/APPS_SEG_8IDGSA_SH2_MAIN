const { getSession } = require('../utils/session');
const { logSecurityEvent } = require('../utils/logger');

// Parser manual de cookies
function parseCookies(cookieHeader) {
    const list = {};
    if (!cookieHeader) return list;
    cookieHeader.split(';').forEach(cookie => {
        const parts = cookie.split('=');
        const name = parts.shift().trim();
        const value = parts.join('=');
        list[name] = decodeURIComponent(value);
    });
    return list;
}

// Middleware para validar autenticación
async function requireAuth(req, res, next) {
    const cookies = parseCookies(req.headers.cookie);
    const sessionId = cookies['session_id'];
    const session = getSession(sessionId);

    if (!session) {
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        
        // Registrar intento de modificación no autenticada como CRITICAL
        await logSecurityEvent(
            'CRITICAL',
            ip,
            'UNAUTHORIZED_ADMIN_ACCESS',
            `Intento de acción administrativa sin sesión válida: ${req.method} ${req.originalUrl}`
        );

        return res.status(401).json({ error: 'No autorizado. Inicie sesión.' });
    }

    req.session = session;
    next();
}

module.exports = {
    requireAuth,
    parseCookies
};
