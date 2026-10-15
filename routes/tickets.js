import express from 'express';
import Joi from 'joi';
import mongoose from 'mongoose';
import Ticket from '../models/Ticket.js';
import Agente from '../models/Agente.js';

const router = express.Router();

// Esquemas Joi[cite: 3]
const ticketSchemaJoi = Joi.object({
    cliente: Joi.string().trim().min(2).max(100).required(),
    asunto: Joi.string().trim().min(5).max(200).required(),
    prioridad: Joi.string().valid("baja", "media", "alta").required()
});

const comentarioSchemaJoi = Joi.object({
    autor: Joi.string().trim().min(2).required(),
    texto: Joi.string().trim().min(3).required()
});

// Helper para transformar agenteId a agente[cite: 3]
const formatoRespuestaTicket = (doc) => {
    if (!doc) return null;
    const ticket = doc.toObject ? doc.toObject() : doc;
    ticket.agente = ticket.agenteId || null;
    delete ticket.agenteId;
    return ticket;
};

// 1. GET /api/tickets - Listar tickets con populate[cite: 2, 3]
router.get('/', async (req, res) => {
    try {
        const { estado, prioridad } = req.query;
        const filtro = {};

        if (estado) filtro.estado = estado;
        if (prioridad) filtro.prioridad = prioridad;

        const tickets = await Ticket.find(filtro).populate('agenteId', 'nombre especialidad');
        res.json(tickets.map(formatoRespuestaTicket));
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
});

// 2. GET /api/tickets/:id - Un ticket por id con populate[cite: 2, 3]
router.get('/:id', async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ mensaje: 'ID con formato inválido' });
    }

    try {
        const ticket = await Ticket.findById(req.params.id).populate('agenteId', 'nombre especialidad');
        if (!ticket) return res.status(404).json({ mensaje: 'Ticket no encontrado' });
        res.json(formatoRespuestaTicket(ticket));
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
});

// 3. POST /api/tickets - Crear ticket (siempre nace abierto)[cite: 3]
router.post('/', async (req, res) => {
    const { error, value } = ticketSchemaJoi.validate(req.body);
    if (error) return res.status(400).json({ mensaje: error.details[0].message });

    try {
        const nuevoTicket = new Ticket({
            ...value,
            estado: 'abierto' // Fuerza que nazca en 'abierto'[cite: 3]
        });
        await nuevoTicket.save();
        res.status(201).json(formatoRespuestaTicket(nuevoTicket));
    } catch (err) {
        res.status(500).json({ mensaje: err.message });
    }
});

// 4. PUT /api/tickets/:id - Actualizar ticket[cite: 3]
router.put('/:id', async (req, res) => {
    const { error, value } = ticketSchemaJoi.validate(req.body);
    if (error) return res.status(400).json({ mensaje: error.details[0].message });

    try {
        const ticketActualizado = await Ticket.findByIdAndUpdate(
            req.params.id,
            value,
            { new: true, runValidators: true } //[cite: 3, 6]
        ).populate('agenteId', 'nombre especialidad');

        if (!ticketActualizado) return res.status(404).json({ mensaje: 'Ticket no encontrado' });
        res.json(formatoRespuestaTicket(ticketActualizado));
    } catch (err) {
        res.status(400).json({ mensaje: err.message });
    }
});

// 5. DELETE /api/tickets/:id - Eliminar ticket[cite: 3]
router.delete('/:id', async (req, res) => {
    try {
        const ticketEliminado = await Ticket.findByIdAndDelete(req.params.id);
        if (!ticketEliminado) return res.status(404).json({ mensaje: 'Ticket no encontrado' });
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ mensaje: 'ID con formato inválido' });
    }
});

// 6. POST /api/tickets/:id/comentarios - Agregar comentario embebido[cite: 3]
router.post('/:id/comentarios', async (req, res) => {
    const { error, value } = comentarioSchemaJoi.validate(req.body);
    if (error) return res.status(400).json({ mensaje: error.details[0].message });

    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ mensaje: 'Ticket no encontrado' });

        ticket.comentarios.push(value);
        await ticket.save();

        const ticketActualizado = await Ticket.findById(ticket._id).populate('agenteId', 'nombre especialidad');
        res.status(201).json(formatoRespuestaTicket(ticketActualizado));
    } catch (err) {
        res.status(400).json({ mensaje: err.message });
    }
});

// 12. POST /api/tickets/:id/asignar - Asignar agente a ticket (El corazón del parcial)[cite: 3]
router.post('/:id/asignar', async (req, res) => {
    const { agenteId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id) || !mongoose.Types.ObjectId.isValid(agenteId)) {
        return res.status(400).json({ mensaje: 'IDs con formato inválido' });
    }

    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ mensaje: 'Ticket no encontrado' });

        const agente = await Agente.findById(agenteId);
        if (!agente) return res.status(404).json({ mensaje: 'El agente no existe' });
        if (!agente.activo) return res.status(400).json({ mensaje: 'El agente se encuentra inactivo' });

        ticket.agenteId = agenteId;
        await ticket.save();

        const ticketActualizado = await Ticket.findById(ticket._id).populate('agenteId', 'nombre especialidad');
        res.status(200).json(formatoRespuestaTicket(ticketActualizado));
    } catch (err) {
        res.status(500).json({ mensaje: err.message });
    }
});

export default router;