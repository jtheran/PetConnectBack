import { createClient } from 'redis';
import logger from './logs/logger.js';

const redisClient = createClient({
  url: 'redis://localhost:6379' 
});

redisClient.on('error', err => logger.error('[REDIS] ERROR CONECTION: ' + err.message));
redisClient.connect();

export default redisClient;
