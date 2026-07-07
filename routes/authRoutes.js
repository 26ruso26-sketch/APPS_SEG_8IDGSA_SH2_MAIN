const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const { loginRateLimiter, checkAuthLockout } = require('../middleware/rateLimiter');

router.post('/login', loginRateLimiter, checkAuthLockout, login);

module.exports = router;
