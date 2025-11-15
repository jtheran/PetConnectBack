import winston from 'winston';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import 'colors';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { combine, timestamp, printf } = winston.format;

// ----------------------------
// FORMATO CONSOLA + ARCHIVO
// ----------------------------
const logFormat = printf(({ level, message, timestamp }) => {
  const safeMessage = String(message);
  const safeTimestamp = String(timestamp);

  return `[${safeTimestamp.toUpperCase()}]:[${level.toUpperCase()}] :: [${safeMessage}]`;
});

// ----------------------------
// CREACIÓN DEL LOGGER WINSTON
// ----------------------------
const logger = winston.createLogger({
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.File({
      filename: `${__dirname}/logger.log`,
    }),
    new winston.transports.Console(),
  ],
});

// ---------------------------------------------
// OVERRIDE PARA GUARDAR LOGS EN MONGODB (PRISMA)
// ---------------------------------------------

// Guardar en DB según nivel
const saveLogToDB = async (level, message, meta = {}) => {
  try {
    await prisma.log.create({
      data: {
        action: message,
        module: meta.module || "SYSTEM",
        userId: meta.userId || null,
      },
    });
  } catch (err) {
    console.error("❌ Error guardando log en DB:", err);
  }
};

// Override general
['info', 'warn', 'error'].forEach(level => {
  const original = logger[level];

  logger[level] = (message, meta = {}) => {
    // 1️⃣ Registrar en archivo + consola
    original.call(logger, message);

    // 2️⃣ Registrar en MongoDB
    saveLogToDB(level, message, meta);
  };
});

export default logger;
