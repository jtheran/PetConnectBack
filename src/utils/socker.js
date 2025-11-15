import logger from '../logs/logger.js';
import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
    io = new Server(server);
    if(!io){
        logger.warn('[SOCKET]🔴 SERVIDOR DE SOCKET NO INICIADO!!!!');
        throw new Error('❌ Socket.IO no iniciado');
    }

    io.on('connection', (socket) => {
        logger.info('[SOCKET] 🟢 Nuevo socket conectado: '+socket.id);

        socket.on('disconnect', () => {
            logger.warn('[SOCKET] 🔴 Socket desconectado: '+socket.id);
        });
    });

    logger.info('[SOCKET]🟢 SERVIDOR DE SOCKET INICIADO!!!!');
    return io;
};

export const getIO = () => {
    if(!io){
        logger.error('[SOCKET] ❌ Socket.IO no ha sido inicializado!!!');
        throw new Error('❌ Socket.IO no ha sido inicializado');
    }else{
        logger.info('[SOCKET] 🟢 Socket.IO Inicializado!!!!');
        return io;
    }
    
};
