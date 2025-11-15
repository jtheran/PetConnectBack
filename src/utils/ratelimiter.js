import rateLimit from 'express-rate-limit';
import logger from '../logs/logger.js';

const Limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // Máximo de intentos de login por IP
    headers: true,
    statusCode: true,
    keyGenerator: (req) => {
        logger.info('[SERVER] Petición desde: '+req.headers.location);
        return req.headers.location;
    },
    handler: (req, res) => {
        logger.warn('[SERVER] DEMASIADOS INTENTOS, POR FAVOR ESPERE 15m')
        return res.status(429).json({ msg: 'DEMASIADOS INTENTOS, POR FAVOR ESPERE 15m' });
    }
});

export default Limiter;
