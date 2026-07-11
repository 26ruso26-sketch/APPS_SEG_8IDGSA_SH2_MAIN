const bcrypt = require('bcrypt');
const xss = require('xss');

const { dbGet, dbRun } = require('../database/connection');
const { createSession, destroySession } = require('../utils/session');
const { parseCookies } = require('../middleware/auth');
const { logSecurityEvent } = require('../utils/logger');
const { recordFailedLogin, resetFailedLogin } = require('../middleware/rateLimiter');

async function login(req, res) {

    const ip =
        req.ip ||
        req.headers['x-forwarded-for'] ||
        req.socket.remoteAddress;

    // Solo aceptar JSON
    if (!req.is('application/json')) {
        return res.status(415).json({
            error: 'Content-Type inválido.'
        });
    }

    let { usuario, password } = req.body;

    // Validación de tipos
    if (
        typeof usuario !== 'string' ||
        typeof password !== 'string'
    ) {

        await logSecurityEvent(
            'WARN',
            ip,
            'INVALID_INPUT',
            'Tipos de datos inválidos en autenticación.'
        );

        return res.status(400).json({
            error: 'Solicitud inválida.'
        });
    }

    // Normalizar y sanitizar
    usuario = xss(usuario.normalize('NFKC').trim());
    password = password.normalize('NFKC');

    // Validación del usuario
    if (
        usuario.length < 3 ||
        usuario.length > 30 ||
        !/^[A-Za-z0-9_]+$/.test(usuario)
    ) {

        await logSecurityEvent(
            'WARN',
            ip,
            'INVALID_USERNAME',
            'Nombre de usuario inválido.'
        );

        return res.status(400).json({
            error: 'Usuario inválido.'
        });
    }

    // Validación de contraseña
    if (
        password.length < 8 ||
        password.length > 100
    ) {

        await logSecurityEvent(
            'WARN',
            ip,
            'INVALID_PASSWORD',
            'Longitud de contraseña inválida.'
        );

        return res.status(400).json({
            error: 'Credenciales inválidas.'
        });
    }

    try {

        // Consulta parametrizada
        const user = await dbGet(
            'SELECT * FROM Usuarios WHERE usuario = ?;',
            [usuario]
        );

        if (!user) {

            recordFailedLogin(ip, usuario);

            await logSecurityEvent(
                'WARN',
                ip,
                'LOGIN_FAILED',
                'Intento de autenticación fallido.'
            );

            return res.status(401).json({
                error: 'Credenciales inválidas.'
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {

            const record = recordFailedLogin(ip, usuario);

            const lockMsg =
                record.lockUntil
                    ? ' Usuario bloqueado temporalmente.'
                    : '';

            await logSecurityEvent(
                'WARN',
                ip,
                'LOGIN_FAILED',
                `Contraseña incorrecta.${lockMsg}`
            );

            return res.status(401).json({
                error: 'Credenciales inválidas.'
            });
        }

        // Reiniciar contador
        resetFailedLogin(ip, usuario);

        // Crear sesión
        const { sessionId } = createSession(user.usuario);

        // Actualizar último acceso
        const nowStr = new Date().toISOString();

        await dbRun(
            'UPDATE Usuarios SET ultimo_login = ? WHERE id = ?;',
            [nowStr, user.id]
        );

        await logSecurityEvent(
            'INFO',
            ip,
            'LOGIN_SUCCESS',
            'Administrador autenticado correctamente.'
        );

        const isSecure =
            req.headers['x-forwarded-proto'] === 'https' ||
            req.secure;

        const secureFlag = isSecure ? 'Secure; ' : '';

        res.setHeader(
            'Set-Cookie',
            `session_id=${sessionId}; HttpOnly; ${secureFlag}SameSite=Strict; Priority=High; Path=/; Max-Age=3600`
        );

        return res.json({
            success: true,
            message: 'Autenticación exitosa.'
        });

    } catch (error) {

        console.error('Error in authController.login:', error);

        return res.status(500).json({
            error: 'Error interno del servidor.'
        });

    }

}

async function logout(req, res) {

    const ip =
        req.ip ||
        req.headers['x-forwarded-for'] ||
        req.socket.remoteAddress;
    try {

        const cookies = parseCookies(req.headers.cookie);

        const sessionId = cookies['session_id'];

        if (sessionId) {

            destroySession(sessionId);

            await logSecurityEvent(
                'INFO',
                ip,
                'LOGOUT_SUCCESS',
                'Administrador cerró sesión.'
            );

        }

res.setHeader(
    'Set-Cookie',
    'session_id=; HttpOnly; SameSite=Strict; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0'
);

return res.json({
    success: true,
    message: 'Sesión cerrada exitosamente.'
});
    } catch (error) {

        console.error('Error in authController.logout:', error);

        return res.status(500).json({
            error: 'Error interno del servidor.'
        });

    }

}

module.exports = {
    login,
    logout
};