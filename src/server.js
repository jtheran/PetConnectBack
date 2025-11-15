import cors from 'cors';
import express from 'express';
import http from 'http';
import config from './config/config.js';
import passport from 'passport';
import jwtStrategy from './middlewares/passport.js';
import appleStrategy from './docs/appleStrategy.js';
import googleStrategy from './docs/googleStrategy.js';
import microsoftStrategy from './docs/microsoftStrategy.js';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

// Inicializaciones
const prisma = new PrismaClient();
const app = express()
server = http.createServer(app);

// Lista de orígenes permitidos
const allowedOrigins = [
    'http://localhost:3000',
    `http://localhost:${config.port}`
];

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Origen no permitido por CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'accessToken'],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(helmet({ contentSecurityPolicy: false }));

//Strategys
passport.use(jwtStrategy);
passport.use(appleStrategy);
passport.use(googleStrategy);
passport.use(microsoftStrategy);
app.use(passport.initialize());

// Swagger Docs
app.use('/api/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    withCredentials: true,
    requestInterceptor: (request) => {
      // Asegura que las cookies se envíen
      request.credentials = 'include';
      return request;
    }
  },
  customSiteTitle: 'API Docs - PawLink',
}));

//Rutas


// Manejo de apagado del servidor y cierre de conexiones
const shutdown = async () => {
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
};
process.on('SIGINT', shutdown);   // Ctrl + C
process.on('SIGTERM', shutdown);  // Terminación por sistema
export default server;