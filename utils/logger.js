const fs = require('fs');
const path = require('path');
const { insertAuditLog } = require('../services/logService');

const securityLogPath = path.join(__dirname, '..', 'security.log');

// Escribir en el archivo security.log
function writeToFile(level, ip, action, description) {
    const now = new Date().toISOString();
    const logLine = `[${now}] [${level}] [IP: ${ip}] [ACCION: ${action}] - ${description}\n`;
    fs.appendFile(securityLogPath, logLine, (err) => {
        if (err) {
            console.error('Error writing to security.log:', err.message);
        }
    });
}

// Función principal para registrar eventos de seguridad en archivo y en la tabla Auditoria
async function logSecurityEvent(level, ip, action, description) {
    const now = new Date().toISOString();
    
    // 1. Escribir en archivo local
    writeToFile(level, ip, action, description);

    // 2. Guardar en base de datos mediante logService
    try {
        await insertAuditLog(now, ip || '0.0.0.0', action, description, level);
    } catch (err) {
        console.error('Error saving audit log to DB:', err.message);
    }
}

module.exports = {
    logSecurityEvent
};
