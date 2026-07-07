let isAdmin = false;
let allTeamsCached = [];

// Cargar y mostrar el Leaderboard desde el backend
async function loadLeaderboard() {
    const loadingDiv = document.getElementById('loading');
    const containerDiv = document.getElementById('groups-container');
    
    try {
        const response = await fetch('/api/leaderboard');
        if (!response.ok) {
            throw new Error('Error de servidor al cargar posiciones.');
        }
        
        const teams = await response.json();
        allTeamsCached = teams;
        
        containerDiv.innerHTML = '';
        
        // Agrupar por grupo A-L
        const groups = {};
        teams.forEach(team => {
            if (!groups[team.grupo]) {
                groups[team.grupo] = [];
            }
            groups[team.grupo].push(team);
        });

        // Crear tarjetas de grupo en orden
        const sortedGroups = Object.keys(groups).sort();
        
        sortedGroups.forEach(grpName => {
            const card = document.createElement('div');
            card.className = 'group-card';
            
            const title = document.createElement('h2');
            title.textContent = `GRUPO ${grpName}`;
            card.appendChild(title);
            
            const table = document.createElement('table');
            table.className = 'leaderboard-table';
            
            table.innerHTML = `
                <thead>
                    <tr>
                        <th class="col-pos">#</th>
                        <th class="col-team">Equipo</th>
                        <th class="col-num">PJ</th>
                        <th class="col-num">PG</th>
                        <th class="col-num">PE</th>
                        <th class="col-num">PP</th>
                        <th class="col-goals">GF:GC</th>
                        <th class="col-pts">PTS</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            
            const tbody = table.querySelector('tbody');
            
            groups[grpName].forEach(team => {
                const row = document.createElement('tr');
                row.className = 'team-row';
                row.dataset.id = team.id;
                
                // Formatear diferencia de goles con signo +/-
                const diffSign = team.dif > 0 ? `+${team.dif}` : team.dif;
                
                row.innerHTML = `
                    <td class="col-pos"><span class="pos-badge pos-${team.pos}">${team.pos}</span></td>
                    <td class="col-team" title="Diferencia de goles: ${diffSign}">${team.nombre}</td>
                    <td class="col-num">${team.pj}</td>
                    <td class="col-num">${team.pg}</td>
                    <td class="col-num">${team.pe}</td>
                    <td class="col-num">${team.pp}</td>
                    <td class="col-goals">${team.gf}:${team.gc}</td>
                    <td class="col-pts" title="Pts / Dif Goles">${team.pts}</td>
                `;
                
                // Evento al hacer clic en un equipo en modo administrador
                row.addEventListener('click', () => {
                    if (isAdmin) {
                        showEditStatsModal(team);
                    }
                });
                
                tbody.appendChild(row);
            });
            
            card.appendChild(table);
            containerDiv.appendChild(card);
        });

        loadingDiv.style.display = 'none';
        containerDiv.style.display = 'grid';

    } catch (error) {
        console.error('Error cargando el leaderboard:', error);
        loadingDiv.innerHTML = `<p style="color: var(--color-red); font-weight: bold;">Error al obtener la tabla de posiciones. Intente de nuevo más tarde.</p>`;
    }
}

// Activar modo administración en el cliente
function enableAdminMode() {
    isAdmin = true;
    document.body.classList.add('admin-mode');
    alert('Modo Administrador activado. Puede hacer clic sobre cualquier equipo de la lista para actualizar sus estadísticas de partidos.');
}

// Mostrar modal dinámico de Login (no presente en el HTML inicial)
function showLoginModal() {
    if (document.getElementById('login-modal')) return;

    const overlay = document.createElement('div');
    overlay.id = 'login-modal';
    overlay.className = 'modal-overlay';

    overlay.innerHTML = `
        <div class="modal-content">
            <button class="modal-close-btn" id="close-login">&times;</button>
            <h3>Autenticación Administrativa</h3>
            <div id="login-error" class="alert-box alert-error"></div>
            <form id="login-form">
                <div class="form-group">
                    <label for="login-username">Usuario</label>
                    <input type="text" id="login-username" required autocomplete="off">
                </div>
                <div class="form-group">
                    <label for="login-password">Contraseña</label>
                    <input type="password" id="login-password" required autocomplete="off">
                </div>
                <button type="submit" class="btn-primary">Ingresar</button>
            </form>
        </div>
    `;

    document.body.appendChild(overlay);

    // Controladores de cierre
    const closeBtn = document.getElementById('close-login');
    closeBtn.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });

    // Envío del formulario de Login
    const form = document.getElementById('login-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const usuario = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const errorBox = document.getElementById('login-error');

        errorBox.style.display = 'none';

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                overlay.remove();
                enableAdminMode();
            } else {
                errorBox.textContent = data.error || 'Credenciales inválidas.';
                errorBox.style.display = 'block';
            }
        } catch (err) {
            errorBox.textContent = 'Fallo en la comunicación con el servidor.';
            errorBox.style.display = 'block';
        }
    });
}

// Mostrar modal dinámico para editar estadísticas de un equipo
function showEditStatsModal(team) {
    if (document.getElementById('edit-stats-modal')) return;

    const overlay = document.createElement('div');
    overlay.id = 'edit-stats-modal';
    overlay.className = 'modal-overlay';

    overlay.innerHTML = `
        <div class="modal-content">
            <button class="modal-close-btn" id="close-edit">&times;</button>
            <h3>Estadísticas de Equipo</h3>
            <p style="margin-bottom: 20px; text-align: center; color: var(--color-gold); font-weight: bold;">
                ${team.nombre} (Grupo ${team.grupo})
            </p>
            <div id="edit-error" class="alert-box alert-error"></div>
            <form id="edit-form">
                <div class="stats-grid">
                    <div class="form-group">
                        <label for="edit-pj">Jugados (PJ)</label>
                        <input type="number" id="edit-pj" min="0" value="${team.pj}" required readonly>
                    </div>
                    <div class="form-group">
                        <label for="edit-pg">Ganados (PG)</label>
                        <input type="number" id="edit-pg" min="0" value="${team.pg}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-pe">Empatados (PE)</label>
                        <input type="number" id="edit-pe" min="0" value="${team.pe}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-pp">Perdidos (PP)</label>
                        <input type="number" id="edit-pp" min="0" value="${team.pp}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-gf">Goles Favor (GF)</label>
                        <input type="number" id="edit-gf" min="0" value="${team.gf}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-gc">Goles Contra (GC)</label>
                        <input type="number" id="edit-gc" min="0" value="${team.gc}" required>
                    </div>
                </div>
                <button type="submit" class="btn-primary">Guardar Cambios</button>
            </form>
        </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = document.getElementById('close-edit');
    closeBtn.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });

    // Ayuda al usuario: Calcular PJ automáticamente como (PG + PE + PP) para evitar fallos de validación
    const pjInput = document.getElementById('edit-pj');
    const pgInput = document.getElementById('edit-pg');
    const peInput = document.getElementById('edit-pe');
    const ppInput = document.getElementById('edit-pp');

    function calculatePJ() {
        const pg = parseInt(pgInput.value, 10) || 0;
        const pe = parseInt(peInput.value, 10) || 0;
        const pp = parseInt(ppInput.value, 10) || 0;
        pjInput.value = pg + pe + pp;
    }

    pgInput.addEventListener('input', calculatePJ);
    peInput.addEventListener('input', calculatePJ);
    ppInput.addEventListener('input', calculatePJ);

    // Enviar estadísticas editadas
    const form = document.getElementById('edit-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorBox = document.getElementById('edit-error');
        errorBox.style.display = 'none';

        const payload = {
            pj: parseInt(pjInput.value, 10),
            pg: parseInt(pgInput.value, 10),
            pe: parseInt(peInput.value, 10),
            pp: parseInt(ppInput.value, 10),
            gf: parseInt(document.getElementById('edit-gf').value, 10),
            gc: parseInt(document.getElementById('edit-gc').value, 10)
        };

        try {
            const response = await fetch(`/api/admin/teams/${team.id}/stats`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                overlay.remove();
                await loadLeaderboard(); // Recargar el leaderboard actualizado
            } else {
                errorBox.textContent = data.error || 'Error al guardar estadísticas.';
                errorBox.style.display = 'block';
            }
        } catch (err) {
            errorBox.textContent = 'Error de comunicación con el servidor.';
            errorBox.style.display = 'block';
        }
    });
}

// Configurar el listener del Easter Egg en el Footer
function setupEasterEgg() {
    const trigger = document.getElementById('admin-trigger');
    
    if (trigger) {
        trigger.addEventListener('click', (e) => {
            // Requiere que CTRL + SHIFT + ALT estén presionados
            if (e.ctrlKey && e.shiftKey && e.altKey) {
                e.preventDefault();
                showLoginModal();
            }
        });
    }
}

// Inicialización de la App
document.addEventListener('DOMContentLoaded', () => {
    loadLeaderboard();
    setupEasterEgg();
});
