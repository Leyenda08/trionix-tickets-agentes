import exprees from "express";
import Joi from "joi";
import Agente from "../models/Agente.js";
import Ticket from "../models/Ticket.js";

const router = exprees.Router();

//Esquema de validacion con joi para agentes
const agenteSchemaJoi = Joi.object({
    nombre: Joi.string().trim().min(3).max(100).required(),
    email: Joi.string().trim().email().required(),
    especialidad: Joi.string().valid("redes", "software", "hardware", "general").required(),
    activo: Joi.boolean().default(true)
});
// 7. GET /api/agentes - Listar agentes (filtros opcionales ?especialidad= y ?activo=)
router.get('/', async (req, res) => {
    try {
        const { especialidad, activo } = req.query;
        const filtro = {};

        if (especialidad) filtro.especialidad = especialidad;
        if (activo !== undefined) filtro.activo = activo === 'true';

        const agentes = await Agente.find(filtro);
        res.json(agentes);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
});

// 14. GET /api/agentes/:id/tickets - Tickets asignados a este agente
router.get('/:id/tickets', async (req, res) => {
    try {
        const tickets = await Ticket.find({ agenteId: req.params.id });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
});

// 8. GET /api/agentes/:id - Un agente por id[cite: 3]
router.get('/:id', async (req, res) => {
    try {
        const agente = await Agente.findById(req.params.id);
        if (!agente) return res.status(404).json({ mensaje: 'Agente no encontrado' });
        res.json(agente);
    } catch (error) {
        res.status(400).json({ mensaje: 'ID con formato inválido' });
    }
});

// 9. POST /api/agentes - Crear agente[cite: 3]
router.post('/', async (req, res) => {
    const { error, value } = agenteSchemaJoi.validate(req.body);
    if (error) return res.status(400).json({ mensaje: error.details[0].message });

    try {
        const nuevoAgente = new Agente(value);
        await nuevoAgente.save();
        res.status(201).json(nuevoAgente);
    } catch (err) {
        // Captura explícita del error de índice único unique: true en email (código 11000)[cite: 3, 6]
        if (err.code === 11000) {
            return res.status(400).json({ mensaje: 'El correo electrónico ya se encuentra registrado' });
        }
        res.status(500).json({ mensaje: err.message });
    }
});

// 10. PUT /api/agentes/:id - Actualizar agente[cite: 3]
router.put('/:id', async (req, res) => {
    const { error, value } = agenteSchemaJoi.validate(req.body);
    if (error) return res.status(400).json({ mensaje: error.details[0].message });

    try {
        const agenteActualizado = await Agente.findByIdAndUpdate(
            req.params.id, 
            value, 
            { new: true, runValidators: true } // Opciones requeridas runValidators y new[cite: 3, 6]
        );
        if (!agenteActualizado) return res.status(404).json({ mensaje: 'Agente no encontrado' });
        res.json(agenteActualizado);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ mensaje: 'El correo electrónico ya pertenece a otro agente' });
        }
        res.status(400).json({ mensaje: err.message });
    }
});

// 11. DELETE /api/agentes/:id - Eliminar agente si no tiene tickets abiertos[cite: 3]
router.delete('/:id', async (req, res) => {
    try {
        const ticketsAbiertos = await Ticket.find({ agenteId: req.params.id, estado: 'abierto' });
        if (ticketsAbiertos.length > 0) {
            return res.status(409).json({ 
                mensaje: 'No se puede eliminar el agente porque tiene tickets abiertos asignados' 
            });
        }

        const agenteEliminado = await Agente.findByIdAndDelete(req.params.id);
        if (!agenteEliminado) return res.status(404).json({ mensaje: 'Agente no encontrado' });

        res.status(204).send();
    } catch (error) {
        res.status(400).json({ mensaje: 'ID con formato inválido' });
    }
});

export default router;