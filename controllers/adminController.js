const { getTeamById, updateTeamStatsAndRecalculate } = require('../services/teamService');
const { logSecurityEvent } = require('../utils/logger');

async function updateTeamStats(req, res) {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const teamId = parseInt(req.params.id, 10);
    const { pj, pg, pe, pp, gf, gc } = req.body;

    if (isNaN(teamId)) {
        await logSecurityEvent('WARN', ip, 'INVALID_TEAM_ID', 'Se proporcionó un ID de equipo no numérico.');
        return res.status(400).json({ error: 'El ID del equipo debe ser numérico.' });
    }

    try {
        // Verificar si el equipo existe
        const team = await getTeamById(teamId);
        if (!team) {
            await logSecurityEvent('WARN', ip, 'TEAM_NOT_FOUND', `Intento de modificar equipo inexistente con ID: ${teamId}.`);
            return res.status(404).json({ error: 'Equipo no encontrado.' });
        }

        // Convertir estadísticas recibidas a números
        const stats = {
            pj: pj !== undefined ? Number(pj) : NaN,
            pg: pg !== undefined ? Number(pg) : NaN,
            pe: pe !== undefined ? Number(pe) : NaN,
            pp: pp !== undefined ? Number(pp) : NaN,
            gf: gf !== undefined ? Number(gf) : NaN,
            gc: gc !== undefined ? Number(gc) : NaN
        };

        // Actualizar y recalcular
        await updateTeamStatsAndRecalculate(teamId, stats);

        // Registrar en logs y tabla Auditoria
        await logSecurityEvent(
            'INFO',
            ip,
            'STATS_UPDATE_SUCCESS',
            `Estadísticas actualizadas con éxito para el equipo "${team.nombre}" (ID: ${teamId}).`
        );

        return res.json({ success: true, message: 'Estadísticas actualizadas y clasificación recalculada.' });

    } catch (error) {
        if (error.message.startsWith('VAL_ERROR:')) {
            const validationMessage = error.message.replace('VAL_ERROR: ', '');
            
            // Registrar advertencia por datos inválidos
            await logSecurityEvent(
                'WARN',
                ip,
                'STATS_UPDATE_FAILED',
                `Datos inválidos al actualizar estadísticas para ID ${teamId}: ${validationMessage}`
            );
            return res.status(400).json({ error: validationMessage });
        }

        console.error('Error in adminController.updateTeamStats:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

module.exports = {
    updateTeamStats
};
