import config  from './config/config.js';
import server  from './server.js';
import logger  from './logs/logger.js';
import adminCreate from './seed/admin.js';
import { initSocket } from './utils/socket.js';

adminCreate().then(() => {
    server.listen(config.port, '0.0.0.0', () => {
        logger.info(`[SERVER] 🚀 Server running on port: ${config.port}`);
        initSocket(server);
    });
});
