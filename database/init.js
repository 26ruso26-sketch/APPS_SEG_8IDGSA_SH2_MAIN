const bcrypt = require('bcrypt');
const { db, dbRun } = require('./connection');
const readline = require('readline');

const teamsData = [
    // Grupo A
    { nombre: 'México', grupo: 'A', pj: 3, pg: 3, pe: 0, pp: 0, gf: 6, gc: 0 },
    { nombre: 'Sudáfrica', grupo: 'A', pj: 3, pg: 1, pe: 1, pp: 1, gf: 2, gc: 3 },
    { nombre: 'Corea del Sur', grupo: 'A', pj: 3, pg: 1, pe: 0, pp: 2, gf: 2, gc: 3 },
    { nombre: 'República Checa', grupo: 'A', pj: 3, pg: 0, pe: 1, pp: 2, gf: 2, gc: 6 },
    // Grupo B
    { nombre: 'Suiza', grupo: 'B', pj: 3, pg: 2, pe: 1, pp: 0, gf: 7, gc: 3 },
    { nombre: 'Canadá', grupo: 'B', pj: 3, pg: 1, pe: 1, pp: 1, gf: 8, gc: 3 },
    { nombre: 'Bosnia y Herzegovina', grupo: 'B', pj: 3, pg: 1, pe: 1, pp: 1, gf: 5, gc: 6 },
    { nombre: 'Catar', grupo: 'B', pj: 3, pg: 0, pe: 1, pp: 2, gf: 2, gc: 10 },
    // Grupo C
    { nombre: 'Brasil', grupo: 'C', pj: 3, pg: 2, pe: 1, pp: 0, gf: 7, gc: 1 },
    { nombre: 'Marruecos', grupo: 'C', pj: 3, pg: 2, pe: 1, pp: 0, gf: 6, gc: 3 },
    { nombre: 'Escocia', grupo: 'C', pj: 3, pg: 1, pe: 0, pp: 2, gf: 1, gc: 4 },
    { nombre: 'Haití', grupo: 'C', pj: 3, pg: 0, pe: 0, pp: 3, gf: 2, gc: 8 },
    // Grupo D
    { nombre: 'Estados Unidos', grupo: 'D', pj: 3, pg: 2, pe: 0, pp: 1, gf: 8, gc: 4 },
    { nombre: 'Australia', grupo: 'D', pj: 3, pg: 1, pe: 1, pp: 1, gf: 2, gc: 2 },
    { nombre: 'Paraguay', grupo: 'D', pj: 3, pg: 1, pe: 1, pp: 1, gf: 2, gc: 4 },
    { nombre: 'Turquía', grupo: 'D', pj: 3, pg: 1, pe: 0, pp: 2, gf: 3, gc: 5 },
    // Grupo E
    { nombre: 'Alemania', grupo: 'E', pj: 3, pg: 2, pe: 0, pp: 1, gf: 10, gc: 4 },
    { nombre: 'Costa de Marfil', grupo: 'E', pj: 3, pg: 2, pe: 0, pp: 1, gf: 4, gc: 2 },
    { nombre: 'Ecuador', grupo: 'E', pj: 3, pg: 1, pe: 1, pp: 1, gf: 2, gc: 2 },
    { nombre: 'Curazao', grupo: 'E', pj: 3, pg: 0, pe: 1, pp: 2, gf: 1, gc: 9 },
    // Grupo F
    { nombre: 'Países Bajos', grupo: 'F', pj: 3, pg: 2, pe: 1, pp: 0, gf: 10, gc: 4 },
    { nombre: 'Japón', grupo: 'F', pj: 3, pg: 1, pe: 2, pp: 0, gf: 7, gc: 3 },
    { nombre: 'Suecia', grupo: 'F', pj: 3, pg: 1, pe: 1, pp: 1, gf: 7, gc: 7 },
    { nombre: 'Túnez', grupo: 'F', pj: 3, pg: 0, pe: 0, pp: 3, gf: 2, gc: 12 },
    // Grupo G
    { nombre: 'Bélgica', grupo: 'G', pj: 3, pg: 1, pe: 2, pp: 0, gf: 6, gc: 2 },
    { nombre: 'Egipto', grupo: 'G', pj: 3, pg: 1, pe: 2, pp: 0, gf: 5, gc: 3 },
    { nombre: 'Irán', grupo: 'G', pj: 3, pg: 0, pe: 3, pp: 0, gf: 3, gc: 3 },
    { nombre: 'Nueva Zelanda', grupo: 'G', pj: 3, pg: 0, pe: 1, pp: 2, gf: 4, gc: 10 },
    // Grupo H
    { nombre: 'España', grupo: 'H', pj: 3, pg: 2, pe: 1, pp: 0, gf: 5, gc: 0 },
    { nombre: 'Cabo Verde', grupo: 'H', pj: 3, pg: 0, pe: 3, pp: 0, gf: 2, gc: 2 },
    { nombre: 'Uruguay', grupo: 'H', pj: 3, pg: 0, pe: 2, pp: 1, gf: 3, gc: 4 },
    { nombre: 'Arabia Saudita', grupo: 'H', pj: 3, pg: 0, pe: 2, pp: 1, gf: 1, gc: 5 },
    // Grupo I
    { nombre: 'Francia', grupo: 'I', pj: 3, pg: 3, pe: 0, pp: 0, gf: 10, gc: 2 },
    { nombre: 'Noruega', grupo: 'I', pj: 3, pg: 2, pe: 0, pp: 1, gf: 8, gc: 7 },
    { nombre: 'Senegal', grupo: 'I', pj: 3, pg: 1, pe: 0, pp: 2, gf: 8, gc: 6 },
    { nombre: 'Irak', grupo: 'I', pj: 3, pg: 0, pe: 0, pp: 3, gf: 11, gc: 12 },
    // Grupo J
    { nombre: 'Argentina', grupo: 'J', pj: 3, pg: 3, pe: 0, pp: 0, gf: 8, gc: 1 },
    { nombre: 'Austria', grupo: 'J', pj: 3, pg: 1, pe: 1, pp: 1, gf: 6, gc: 6 },
    { nombre: 'Argelia', grupo: 'J', pj: 3, pg: 1, pe: 1, pp: 1, gf: 5, gc: 7 },
    { nombre: 'Jordania', grupo: 'J', pj: 3, pg: 0, pe: 0, pp: 3, gf: 3, gc: 8 },
    // Grupo K
    { nombre: 'Colombia', grupo: 'K', pj: 3, pg: 2, pe: 1, pp: 0, gf: 4, gc: 1 },
    { nombre: 'Portugal', grupo: 'K', pj: 3, pg: 1, pe: 2, pp: 0, gf: 6, gc: 1 },
    { nombre: 'RD del Congo', grupo: 'K', pj: 3, pg: 1, pe: 1, pp: 1, gf: 4, gc: 3 },
    { nombre: 'Uzbekistán', grupo: 'K', pj: 3, pg: 0, pe: 0, pp: 3, gf: 2, gc: 11 },
    // Grupo L
    { nombre: 'Inglaterra', grupo: 'L', pj: 3, pg: 2, pe: 1, pp: 0, gf: 6, gc: 2 },
    { nombre: 'Croacia', grupo: 'L', pj: 3, pg: 2, pe: 0, pp: 1, gf: 5, gc: 5 },
    { nombre: 'Ghana', grupo: 'L', pj: 3, pg: 1, pe: 1, pp: 1, gf: 2, gc: 2 },
    { nombre: 'Panamá', grupo: 'L', pj: 3, pg: 0, pe: 0, pp: 3, gf: 0, gc: 4 }
];

function askQuestion(query, isPassword = false) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        if (!isPassword) {
            rl.question(query, (answer) => {
                rl.close();
                resolve(answer.trim());
            });
        } else {
            // Verificar si el flujo es un TTY antes de activar rawMode
            if (process.stdin.isTTY) {
                process.stdout.write(query);
                let password = '';
                process.stdin.setRawMode(true);
                process.stdin.resume();

                const onData = (char) => {
                    char = char.toString();
                    switch (char) {
                        case '\n':
                        case '\r':
                        case '\u0004':
                            process.stdin.setRawMode(false);
                            process.stdin.removeListener('data', onData);
                            process.stdout.write('\n');
                            rl.close();
                            resolve(password);
                            break;
                        case '\u0003': // Ctrl+C
                            process.stdin.setRawMode(false);
                            process.stdin.removeListener('data', onData);
                            process.stdout.write('\n');
                            rl.close();
                            process.exit(1);
                            break;
                        case '\u007f': // Backspace
                        case '\b':
                            if (password.length > 0) {
                                password = password.slice(0, -1);
                                process.stdout.write('\b \b');
                            }
                            break;
                        default:
                            if (char.charCodeAt(0) >= 32 && char.charCodeAt(0) < 127) {
                                password += char;
                                process.stdout.write('*');
                            }
                            break;
                    }
                };

                process.stdin.on('data', onData);
            } else {
                // Caída de seguridad: Leer normalmente sin enmascaramiento si no es una terminal interactiva (TTY)
                rl.question(query, (answer) => {
                    rl.close();
                    resolve(answer.trim());
                });
            }
        }
    });
}

async function initDB() {
    console.log('=== Inicialización de la Base de Datos ===');
    
    let adminUser = '';
    while (!adminUser) {
        adminUser = await askQuestion('Usuario administrador: ');
        if (!adminUser) console.log('El usuario no puede estar vacío.');
    }

    let adminPass = '';
    while (!adminPass) {
        adminPass = await askQuestion('Contraseña: ', true);
        if (!adminPass) console.log('La contraseña no puede estar vacía.');
    }

    console.log('\nHasheando contraseña y preparando base de datos...');
    const passwordHash = await bcrypt.hash(adminPass, 12);

    db.serialize(async () => {
        try {
            // Eliminar tablas previas si existen
            await dbRun(`DROP TABLE IF EXISTS Usuarios;`);
            await dbRun(`DROP TABLE IF EXISTS Auditoria;`);
            await dbRun(`DROP TABLE IF EXISTS Equipos;`);

            // Crear tablas
            await dbRun(`
                CREATE TABLE Usuarios (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    usuario TEXT NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL,
                    ultimo_login TEXT
                );
            `);

            await dbRun(`
                CREATE TABLE Auditoria (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    fecha TEXT NOT NULL,
                    ip TEXT NOT NULL,
                    accion TEXT NOT NULL,
                    descripcion TEXT NOT NULL,
                    nivel TEXT NOT NULL
                );
            `);

            await dbRun(`
                CREATE TABLE Equipos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nombre TEXT NOT NULL UNIQUE,
                    grupo TEXT NOT NULL,
                    pj INTEGER NOT NULL,
                    pg INTEGER NOT NULL,
                    pe INTEGER NOT NULL,
                    pp INTEGER NOT NULL,
                    gf INTEGER NOT NULL,
                    gc INTEGER NOT NULL,
                    pts INTEGER NOT NULL,
                    dif INTEGER NOT NULL,
                    pos INTEGER NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
            `);

            // Insertar administrador
            await dbRun(
                `INSERT INTO Usuarios (usuario, password_hash, ultimo_login) VALUES (?, ?, null);`,
                [adminUser, passwordHash]
            );
            console.log('Usuario administrador creado con éxito.');

            // Agrupar y ordenar equipos para asignar posición pos (1 a 4) dentro de cada grupo
            const groups = {};
            teamsData.forEach(t => {
                const pts = t.pg * 3 + t.pe;
                const dif = t.gf - t.gc;
                if (!groups[t.grupo]) groups[t.grupo] = [];
                groups[t.grupo].push({ ...t, pts, dif });
            });

            const nowStr = new Date().toISOString();
            
            // Ordenar por criterios de desempate en cada grupo y asignar posición
            for (const grp in groups) {
                groups[grp].sort((a, b) => {
                    if (b.pts !== a.pts) return b.pts - a.pts;
                    if (b.dif !== a.dif) return b.dif - a.dif;
                    return b.gf - a.gf;
                });
                groups[grp].forEach((t, idx) => {
                    t.pos = idx + 1; // Posición 1 a 4 dentro de su grupo
                });
            }

            // Insertar equipos en la base de datos
            const stmt = db.prepare(`
                INSERT INTO Equipos (nombre, grupo, pj, pg, pe, pp, gf, gc, pts, dif, pos, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            `);

            for (const grp in groups) {
                for (const t of groups[grp]) {
                    await new Promise((resolve, reject) => {
                        stmt.run([t.nombre, t.grupo, t.pj, t.pg, t.pe, t.pp, t.gf, t.gc, t.pts, t.dif, t.pos, nowStr, nowStr], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                }
            }
            stmt.finalize();
            console.log('Equipos inicializados y ordenados por grupo.');

            // Registrar log de auditoría
            await dbRun(
                `INSERT INTO Auditoria (fecha, ip, accion, descripcion, nivel) VALUES (?, ?, ?, ?, ?);`,
                [nowStr, '127.0.0.1', 'DB_INIT', 'Base de datos inicializada y ordenada.', 'INFO']
            );

            console.log('Inicialización completada con éxito.');
            db.close();
            process.exit(0);

        } catch (error) {
            console.error('Error durante la inicialización:', error);
            db.close();
            process.exit(1);
        }
    });
}

module.exports = { initDB };
