const crypto = require('crypto');

// Mapa en memoria para almacenar sesiones activas: sessionId -> { username, expiresAt }
const sessions = new Map();

// Duración de la sesión: 1 hora
const SESSION_DURATION = 3600000;

function createSession(username) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + SESSION_DURATION;
    sessions.set(sessionId, { username, expiresAt });
    return { sessionId, expiresAt };
}

function getSession(sessionId) {
    if (!sessionId) return null;
    const session = sessions.get(sessionId);
    if (!session) return null;

    // Verificar si expiró
    if (Date.now() > session.expiresAt) {
        sessions.delete(sessionId);
        return null;
    }

    return session;
}

function destroySession(sessionId) {
    if (sessionId) {
        sessions.delete(sessionId);
    }
}

module.exports = {
    createSession,
    getSession,
    destroySession
};
