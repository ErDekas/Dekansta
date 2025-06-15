import express, { urlencoded } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';

import connectDB from './utils/db.js';
import userRoute from './routes/user.route.js';
import postRoute from './routes/post.route.js';
import messageRoute from './routes/message.route.js';
import notificationRoute from './routes/notification.route.js';

// Importa app y server desde socket.js
import { app, server } from './socket/socket.js';

dotenv.config();

const PORT = process.env.PORT || 3000;
const __dirname = path.resolve();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({ extended: true }));

// Configuración de CORS desde .env
const corsOptions = {
  origin: process.env.URL, // ej: http://localhost:5173
  credentials: true,
};
app.use(cors(corsOptions));

// Rutas de la API
app.use('/api/v1/user', userRoute);
app.use('/api/v1/post', postRoute);
app.use('/api/v1/message', messageRoute);
app.use('/api/v1/notification', notificationRoute);

// Servir frontend en producción
app.use(express.static(path.join(__dirname, '/frontend/dist')));

import fs from 'fs';
const distPath = path.join(__dirname, "frontend", "dist");

if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
    });
} else {
    console.warn("⚠️  frontend/dist no existe, no se sirve frontend aún.");
}


// Iniciar servidor y conectar a la base de datos
server.listen(PORT, () => {
  connectDB();
  console.log(`✅ Server is running on port ${PORT}`);
});
