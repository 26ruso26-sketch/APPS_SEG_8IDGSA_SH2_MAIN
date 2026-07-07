const express = require('express');
const router = express.Router();
const { login, logout } = require('../controllers/authController');
const { loginRateLimiter, checkAuthLockout } = require('../middleware/rateLimiter');

router.post('/login', loginRateLimiter, checkAuthLockout, login);
router.post('/logout', logout);

module.exports = router;
