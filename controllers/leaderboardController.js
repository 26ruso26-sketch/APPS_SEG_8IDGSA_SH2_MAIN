const { getAllTeams } = require('../services/teamService');
const { logSecurityEvent } = require('../utils/logger');

async function getLeaderboard(req, res) {
    try {
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const teams = await getAllTeams();
        
        // Registrar la consulta pública como evento INFO
        await logSecurityEvent('INFO', ip, 'PUBLIC_QUERY', 'Consulta pública del leaderboard realizada.');

        res.json(teams);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Error al obtener el leaderboard.' });
    }
}

module.exports = {
    getLeaderboard
};
