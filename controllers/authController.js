const bcrypt = require('bcrypt');
const { dbGet, dbRun } = require('../database/connection');
const { createSession, destroySession } = require('../utils/session');
const { parseCookies } = require('../middleware/auth');
const { logSecurityEvent } = require('../utils/logger');
const { recordFailedLogin, resetFailedLogin } = require('../middleware/rateLimiter');

async function login(req, res) {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const { usuario, password } = req.body;

    // Validación de entrada
    if (!usuario || !password || typeof usuario !== 'string' || typeof password !== 'string') {
        await logSecurityEvent('WARN', ip, 'INVALID_INPUT', 'Intento de inicio de sesión con campos vacíos o tipos incorrectos.');
        return res.status(400).json({ error: 'Usuario y contraseña obligatorios.' });
    }

    const usernameTrimmed = usuario.trim();

    try {
        // Consulta parametrizada segura contra inyección SQL
        const user = await dbGet('SELECT * FROM Usuarios WHERE usuario = ?;', [usernameTrimmed]);

        if (!user) {
            recordFailedLogin(ip, usernameTrimmed);
            await logSecurityEvent('WARN', ip, 'LOGIN_FAILED', `Intento de login fallido: El usuario "${usernameTrimmed}" no existe.`);
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        // Validar contraseña
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            const record = recordFailedLogin(ip, usernameTrimmed);
            const lockMsg = record.lockUntil ? ' (Usuario bloqueado temporalmente por 10 minutos)' : '';
            await logSecurityEvent('WARN', ip, 'LOGIN_FAILED', `Intento de login fallido: Contraseña incorrecta para el usuario "${usernameTrimmed}"${lockMsg}.`);
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        // Limpiar contador de intentos fallidos
        resetFailedLogin(ip, usernameTrimmed);

        // Crear sesión en memoria
        const { sessionId } = createSession(user.usuario);

        // Actualizar último login en base de datos
        const nowStr = new Date().toISOString();
        await dbRun('UPDATE Usuarios SET ultimo_login = ? WHERE id = ?;', [nowStr, user.id]);

        // Registrar inicio de sesión exitoso en Auditoria y archivo de logs
        await logSecurityEvent('INFO', ip, 'LOGIN_SUCCESS', `Inicio de sesión correcto para el usuario: "${usernameTrimmed}".`);

        // Configurar cookie HTTP-Only, Secure (condicional para desarrollo local y producción ngrok), SameSite=Strict
        const isSecure = req.headers['x-forwarded-proto'] === 'https' || req.secure;
        const secureFlag = isSecure ? 'Secure; ' : '';
        res.setHeader('Set-Cookie', `session_id=${sessionId}; HttpOnly; ${secureFlag}SameSite=Strict; Path=/; Max-Age=3600`);

        return res.json({ success: true, message: 'Autenticación exitosa.' });

    } catch (error) {
        console.error('Error in authController.login:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

async function logout(req, res) {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    try {
        const cookies = parseCookies(req.headers.cookie);
        const sessionId = cookies['session_id'];

        if (sessionId) {
            destroySession(sessionId);
            await logSecurityEvent('INFO', ip, 'LOGOUT_SUCCESS', 'Cierre de sesión del administrador exitoso.');
        }

        // Eliminar la cookie en el cliente
        res.setHeader('Set-Cookie', 'session_id=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0');

        return res.json({ success: true, message: 'Sesión cerrada exitosamente.' });
    } catch (error) {
        console.error('Error in authController.logout:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

module.exports = {
    login,
    logout
};
