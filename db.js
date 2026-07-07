require('dotenv').config();
const { initDB } = require('./database/init');

initDB().catch(err => {
    console.error('Error general durante la ejecución de db.js:', err);
    process.exit(1);
});
