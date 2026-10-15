const API_URL = '/api';

document.addEventListener('DOMContentLoaded', () => {
    cargarAgentes();
    cargarTickets();

    document.getElementById('formTicket').addEventListener('submit', crearTicket);
});

function mostrarError(mensaje) {
    const divError = document.getElementById('mensajeError');
    divError.textContent = mensaje;
    setTimeout(() => { divError.textContent = ''; }, 5000);
}

// Cargar lista de Agentes
async function cargarAgentes() {
    try {
        const res = await fetch(`${API_URL}/agentes`);
        const agentes = await res.json();
        
        const lista = document.getElementById('listaAgentes');
        lista.innerHTML = agentes.map(a => `
            <li>
                <strong>${a.nombre}</strong> (${a.especialidad}) - 
                <em>${a.activo ? 'Activo' : 'Inactivo'}</em>
            </li>
        `).join('');
    } catch (err) {
        mostrarError('Error al cargar agentes');
    }
}

// Cargar Lista de Tickets
async function cargarTickets() {
    try {
        const [resTickets, resAgentes] = await Promise.all([
            fetch(`${API_URL}/tickets`),
            fetch(`${API_URL}/agentes?activo=true`)
        ]);

        const tickets = await resTickets.json();
        const agentesActivos = await resAgentes.json();

        const contenedor = document.getElementById('contenedorTickets');
        contenedor.innerHTML = tickets.map(t => {
            const agenteNombre = t.agente ? `${t.agente.nombre} (${t.agente.especialidad})` : 'Sin asignar';
            
            const opcionesAgentes = agentesActivos.map(a => 
                `<option value="${a._id}">${a.nombre} (${a.especialidad})</option>`
            ).join('');

            return `
                <div class="card">
                    <h3>[${t.estado.toUpperCase()}] ${t.asunto}</h3>
                    <p><strong>Cliente:</strong> ${t.cliente} | 
                       <strong>Prioridad:</strong> <span class="badge ${t.prioridad}">${t.prioridad}</span></p>
                    <p><strong>Agente Asignado:</strong> ${agenteNombre}</p>
                    
                    ${t.estado === 'abierto' ? `
                        <div style="margin-top: 10px;">
                            <select id="select-\${t._id}">
                                <option value="">-- Seleccionar Agente --</option>
                                \${opcionesAgentes}
                            </select>
                            <button onclick="asignarAgente('\${t._id}')" style="width: auto; display: inline-block;">Asignar</button>
                            <button onclick="resolverTicket('\${t._id}')" class="btn-success" style="width: auto; display: inline-block;">Marcar Resuelto</button>
                        </div>
                    ` : ''}
                    
                    <button onclick="eliminarTicket('${t._id}')" class="btn-danger" style="width: auto; margin-top: 10px;">Eliminar</button>
                </div>
            `;
        }).join('');
    } catch (err) {
        mostrarError('Error al cargar tickets');
    }
}

// Crear Ticket
async function crearTicket(e) {
    e.preventDefault();
    const cliente = document.getElementById('cliente').value;
    const asunto = document.getElementById('asunto').value;
    const prioridad = document.getElementById('prioridad').value;

    const res = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente, asunto, prioridad })
    });

    const data = await res.json();
    if (!res.ok) return mostrarError(data.mensaje);

    document.getElementById('formTicket').reset();
    cargarTickets();
}

// Asignar Agente
async function asignarAgente(ticketId) {
    const agenteId = document.getElementById(`select-${ticketId}`).value;
    if (!agenteId) return mostrarError('Seleccione un agente válido');

    const res = await fetch(`${API_URL}/tickets/${ticketId}/asignar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agenteId })
    });

    const data = await res.json();
    if (!res.ok) return mostrarError(data.mensaje);

    cargarTickets();
}

// Marcar Resuelto
async function resolverTicket(ticketId) {
    // Para actualizar solo el estado conservando los requerimientos de la API
    const resTicket = await fetch(`${API_URL}/tickets/${ticketId}`);
    const ticketActual = await resTicket.json();

    const res = await fetch(`${API_URL}/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            cliente: ticketActual.cliente,
            asunto: ticketActual.asunto,
            prioridad: ticketActual.prioridad,
            estado: 'resuelto'
        })
    });

    if (!res.ok) {
        const data = await res.json();
        return mostrarError(data.mensaje);
    }

    cargarTickets();
}

// Eliminar Ticket
async function eliminarTicket(ticketId) {
    if (!confirm('¿Desea eliminar este ticket?')) return;

    const res = await fetch(`${API_URL}/tickets/${ticketId}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) {
        const data = await res.json();
        return mostrarError(data.mensaje);
    }

    cargarTickets();
}