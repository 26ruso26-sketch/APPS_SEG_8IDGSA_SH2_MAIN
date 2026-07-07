const { logSecurityEvent } = require('../utils/logger');

const blockedPaths = ['/admin', '/login', '/dashboard', '/administrator'];

async function honeytokenMiddleware(req, res, next) {
    const url = req.path.toLowerCase().replace(/\/$/, ''); // Normalizar barra inclinada al final
    if (blockedPaths.includes(url) || blockedPaths.includes(req.path.toLowerCase())) {
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        
        // Registrar alerta de nivel CRITICAL de forma inmediata
        await logSecurityEvent(
            'CRITICAL',
            ip,
            'HONEYTOKEN_ACCESS_ATTEMPT',
            `Intento de acceso no autorizado a ruta administrativa protegida: ${req.originalUrl}`
        );

        return res.status(404).send('Not Found');
    }
    next();
}

module.exports = honeytokenMiddleware;
