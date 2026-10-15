import express from 'express';
import 'dotenv/config';
import { connectDB } from './db.js';

import agentesRoutes from './routes/agentes.js';
import ticketsRoutes from './routes/tickets.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Registro de endpoints de la API[cite: 2, 3]
app.use('/api/agentes', agentesRoutes);
app.use('/api/tickets', ticketsRoutes);

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
});