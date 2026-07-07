const express = require('express');
const router = express.Router();
const { updateTeamStats } = require('../controllers/adminController');
const { requireAuth } = require('../middleware/auth');

router.put('/teams/:id/stats', requireAuth, updateTeamStats);

module.exports = router;
