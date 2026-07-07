const { db, dbRun, dbAll, dbGet } = require('../database/connection');

async function getTeamById(id) {
    return await dbGet('SELECT * FROM Equipos WHERE id = ?;', [id]);
}

async function getAllTeams() {
    // Retorna todos los equipos ordenados por grupo y posición interna (1 a 4)
    return await dbAll('SELECT * FROM Equipos ORDER BY grupo ASC, pos ASC;');
}

async function updateTeamStatsAndRecalculate(id, stats) {
    const { pj, pg, pe, pp, gf, gc } = stats;

    // 1. Validaciones de tipo y rangos
    if (
        !Number.isInteger(pj) || pj < 0 ||
        !Number.isInteger(pg) || pg < 0 ||
        !Number.isInteger(pe) || pe < 0 ||
        !Number.isInteger(pp) || pp < 0 ||
        !Number.isInteger(gf) || gf < 0 ||
        !Number.isInteger(gc) || gc < 0
    ) {
        throw new Error('VAL_ERROR: Todos los valores deben ser enteros mayores o iguales a cero.');
    }

    // 2. Validación de regla de negocio: PJ = PG + PE + PP
    if (pj !== (pg + pe + pp)) {
        throw new Error('VAL_ERROR: Regla de integridad violada: PJ debe ser igual a (PG + PE + PP).');
    }

    // Ejecutar transaccionalmente la actualización y el recalculo de posiciones
    return new Promise((resolve, reject) => {
        db.serialize(async () => {
            try {
                await dbRun('BEGIN TRANSACTION;');

                const nowStr = new Date().toISOString();

                // Actualizar las estadísticas crudas del equipo
                await dbRun(
                    `UPDATE Equipos SET pj = ?, pg = ?, pe = ?, pp = ?, gf = ?, gc = ?, updated_at = ? WHERE id = ?;`,
                    [pj, pg, pe, pp, gf, gc, nowStr, id]
                );

                // Obtener todos los equipos para recalcular el leaderboard
                const allTeams = await dbAll('SELECT * FROM Equipos;');

                // Agrupar por grupo y calcular pts/dif
                const groups = {};
                allTeams.forEach(t => {
                    const pts = t.pg * 3 + t.pe;
                    const dif = t.gf - t.gc;
                    if (!groups[t.grupo]) groups[t.grupo] = [];
                    groups[t.grupo].push({ ...t, pts, dif });
                });

                // Ordenar por criterios de desempate en cada grupo y actualizar
                for (const grp in groups) {
                    groups[grp].sort((a, b) => {
                        if (b.pts !== a.pts) return b.pts - a.pts;
                        if (b.dif !== a.dif) return b.dif - a.dif;
                        return b.gf - a.gf;
                    });
                    
                    // Asignar pos (1 a 4) y actualizar base de datos
                    for (let idx = 0; idx < groups[grp].length; idx++) {
                        const team = groups[grp][idx];
                        const pos = idx + 1;
                        await dbRun(
                            `UPDATE Equipos SET pts = ?, dif = ?, pos = ?, updated_at = ? WHERE id = ?;`,
                            [team.pts, team.dif, pos, nowStr, team.id]
                        );
                    }
                }

                await dbRun('COMMIT;');
                resolve({ success: true });
            } catch (err) {
                dbRun('ROLLBACK;').catch(console.error);
                reject(err);
            }
        });
    });
}

module.exports = {
    getTeamById,
    getAllTeams,
    updateTeamStatsAndRecalculate
};
