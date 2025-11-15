import nodemailer from 'nodemailer';
import config from '../config/config.js';
import logger from '../logs/logger.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
    host: config.mailHost,   
    port: config.mailPort,                    
    secure: true,
    auth: { 
        user: config.mailAdmin, 
        pass: config.mailPass
    },
  tls: {
    rejectUnauthorized: false, // Ignora certificados inválidos
  },
});

export const sendEmail = async (to, subject, text, name) => {
    try{
        if(name == undefined || name == null){
            name = 'Usuario';
        }
        
        const templatePath = path.resolve('src/templates/plnatillaCorreoMadurezLSVMadurez.html');
        let html = fs.readFileSync(templatePath, 'utf8');

        html = html.replace('{{name}}', name);
        html = html.replace('{{subject}}', subject);
        html = html.replace('{{message}}', text);
        html = html.replace('{{url}}', config.urlBase);

        await transporter.sendMail(
            { 
                from: config.adminEmail, 
                to,
                subject,
                html,
                text,
            });

        logger.info(`[EMAIL] ✅ CORREO ENVIADO A: ${to}`);
    }catch(err){
        logger.error(`[EMAIL] ❌ ERROR AL ENVIAR A: ${to} → ${err.message}`);
        return new Error(`❌ ERROR AL ENVIAR A: ${to} → ${err.message}`);
    }
    
};

export const sendMassiveEmail = async (subject, text) => {
    try {
        const users = await prisma.user.findMany({
            where: {
                role: 'INTERNO'
            }
        });

        if(!users){
            logger.warn('[PRISMA] ❗ USERS NOT FOUND!!!!')
        }

        const emailPromises = users.map((user) =>
            sendEmail({
                to: user.email,
                subject,
                text,
                name: user.name,
            })
        );

        const results = await Promise.allSettled(emailPromises);

        const failed = results.filter((r) => r.status === 'rejected');
        const succeeded = results.filter((r) => r.status === 'fulfilled');

        logger.info(`[EMAIL] ✅ ENVIADOS: ${succeeded.length}, ❌ FALLIDOS: ${failed.length}`);

        failed.forEach((fail, index) => {
            const user = users[index];
            logger.error(`[EMAIL] ❌ FALLÓ PARA: ${user.name} <${user.email}> → ${fail.reason.message}`);
        });
    } catch (err) {
        logger.error('[EMAIL] ❌ ERROR GENERAL EN ENVÍO MASIVO: ' + err.message);
        return new Error(` ❌ ERROR GENERAL EN ENVÍO MASIVO: ${err.message}`);
    }
};

