import mongoose from 'mongoose';
import 'dotenv/config';
import Agente from './models/Agente.js';
import Ticket from './models/Ticket.js';

const poblarBD = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado a MongoDB para ejecutar el Seed...');

        // Limpiar colecciones
        await Agente.deleteMany({});
        await Ticket.deleteMany({});

        // Crear Agentes iniciales guardándolos en la constante 'agentes'
        const agentes = await Agente.insertMany([
            { nombre: 'Carlos Mendoza', email: 'carlos@trionix.com', especialidad: 'redes', activo: true },
            { nombre: 'Ana Gómez', email: 'ana@trionix.com', especialidad: 'software', activo: true },
            { nombre: 'Luis Torres', email: 'luis@trionix.com', especialidad: 'hardware', activo: false }
        ]);

        console.log('Agentes creados con éxito');

        // Crear Tickets iniciales
        await Ticket.insertMany([
            {
                cliente: 'Empresa Alfa',
                asunto: 'Fallo en la conexión del router principal',
                prioridad: 'alta',
                estado: 'abierto',
                agenteId: agentes[0]._id, // Toma el ID del primer agente creado
                comentarios: [{ autor: 'Cliente', texto: 'El router se reinicia constantemente' }]
            },
            {
                cliente: 'María López',
                asunto: 'Error al iniciar sesión en el sistema',
                prioridad: 'media',
                estado: 'abierto',
                agenteId: null
            }
        ]);

        console.log('Tickets creados con éxito');
        console.log('Semilla ejecutada correctamente.');
        process.exit(0);
    } catch (error) {
        console.error(`Error en la semilla: ${error.message}`);
        process.exit(1);
    }
};

poblarBD();