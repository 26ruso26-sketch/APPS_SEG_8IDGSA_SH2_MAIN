const { dbRun } = require('../database/connection');

async function insertAuditLog(fecha, ip, accion, descripcion, nivel) {
    return await dbRun(
        `INSERT INTO Auditoria (fecha, ip, accion, descripcion, nivel) VALUES (?, ?, ?, ?, ?);`,
        [fecha, ip, accion, descripcion, nivel]
    );
}

module.exports = {
    insertAuditLog
};
