import express from 'express';
import 'dotenv/config';
import { connectDB } from './db.js';
import agentesRoutes from './routes/agentes.js';
import ticketsRoutes from './routes/tickets.js';

const app = express();

// Conectar a la base de datos
connectDB();

// Middlewares
app.use(express.json());
app.use(express.static('public'));

// Rutas de la API
app.use('/api/agentes', agentesRoutes);
app.use('/api/tickets', ticketsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});