require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const honeytokenMiddleware = require('./middleware/honeytoken');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

app.disable('x-powered-by');

const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'),
    { flags: 'a' }
);

app.use(morgan('combined', {
    stream: accessLogStream
}));


app.use(compression());


app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'"],
                imgSrc: ["'self'", "data:"],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                baseUri: ["'self'"],
                frameAncestors: ["'none'"],
                formAction: ["'self'"],
                upgradeInsecureRequests: []
            }
        },
        referrerPolicy: {
            policy: "no-referrer"
        },
        frameguard: {
            action: "deny"
        },
        noSniff: true,
        hidePoweredBy: true
    })
);



const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "Demasiadas solicitudes. Intente nuevamente más tarde."
    }
});

app.use(limiter);


app.use(express.json({
    limit: "20kb"
}));

app.use(express.urlencoded({
    extended: true,
    limit: "20kb"
}));

app.use((req, res, next) => {

    if (req.originalUrl.startsWith('/api')) {

        res.setHeader(
            'Cache-Control',
            'no-store, no-cache, must-revalidate, private'
        );

    }

    next();

});

app.use((req, res, next) => {

    res.setHeader(
        'Permissions-Policy',
        'geolocation=(), microphone=(), camera=()'
    );

    next();

});


app.use(honeytokenMiddleware);


app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', leaderboardRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);


app.use((req, res) => {

    res.status(404).json({
        error: 'Recurso no encontrado.'
    });

});

app.use((err, req, res, next) => {

    console.error(err);

    res.status(500).json({
        error: 'Error interno del servidor.'
    });

});

app.listen(PORT, () => {

    console.log(
        `[BLUE-TEAM] Servidor iniciado correctamente en el puerto ${PORT}`
    );

});