import bcrypt from 'bcryptjs';
import logger from '../logs/logger.js';

export const encryptPass = async (pass) => {
    try{
        const salt = await bcrypt.genSalt();
        const passHash = await bcrypt.hash(pass, salt);

        if(!passHash){
            logger.warn('[BCRYPT] ERROR AL ENCRIPTAR LA PASSWORD!!!');
            return null;
        }

        logger.info('[BCRYPT] ENCRIPTACION DE PASSWORD EXITOSA!!!!');
        return passHash;
    }catch(err){
        logger.error('[BCRYPT] ERROR AL PROCESAR LA PASSWORD: '+err.message);
        return null;
    }
};

export const matchPass = async (pass, hash) => {
    try{
        const match = await bcrypt.compare(pass, hash);

        if(!match){
            logger.warn('[BCRYPT] ERROR AL COMPARAR LAS CONTRASEÑA!!!');
            return false;
        }

        logger.info('[BCRYPT] ENCRIPTACION DE PASSWORD EXITOSA!!!!');
        return match;
    }catch(err){
        logger.error('[BCRYPT] ERROR AL PROCESAR LA COMPARACION DE PASSWORD: '+err.message);
        return null;
    }
};

