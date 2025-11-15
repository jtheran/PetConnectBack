import jwt from 'jsonwebtoken';
import config from '../config/config.js'; // Asumo que config.key y config.refreshKey están aquí

const createToken = (payload) => {
    // Access Token de corta duración
    const accessToken = jwt.sign(payload, config.keySecret, {
        expiresIn: '30m', // Ejemplo: 30 minutos
    });

    // Refresh Token de larga duración

    return {
        accessToken, // Lo llamo 'accessToken' aquí para consistencia
    };
};

export default createToken;