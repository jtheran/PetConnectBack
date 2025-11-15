import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth";
import logger from '../logs/logger.js';
import prisma from '../libs/prisma.js';
import { createToken } from "../utils/jwt.js";  // tu función para generar JWT
import config from "../config/config.js";

const options = {
    clientID: config.googleClientId,
    clientSecret: config.googleClientSecret,
    callbackURL: config.googleCallbackURL, 
}

const googleStrategy = passport.use(
  new GoogleStrategy(options,
    async ( profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;

        // Buscar AuthProvider con Google
        let provider = await prisma.authProvider.findUnique({
          where: {
            provider_providerId: {
              provider: "google",
              providerId: googleId
            }
          },
          include: { user: true }
        });

        let user;
        if (!provider) {
          // Si no existe el proveedor, crear o asociar usuario
          user = await prisma.user.findUnique({ where: { email } });

          if (!user) {
            // 1) no hay usuario con ese email: crear nuevo
            user = await prisma.user.create({
              data: {
                email,
                name,
                providers: {
                  create: {
                    provider: "google",
                    providerId: googleId
                  }
                }
              }
            });
          } else {
            // 2) sí hay usuario con ese email: asociar Google
            await prisma.authProvider.create({
              data: {
                provider: "google",
                providerId: googleId,
                userId: user.id
              }
            });
          }

          // Recargar para incluir la relación
          provider = await prisma.authProvider.findUnique({
            where: {
              provider_providerId: {
                provider: "google",
                providerId: googleId
              }
            },
            include: { user: true }
          });
        } else {
          // Ya existía el proveedor → usamos el usuario asociado
          user = provider.user;
        }

        // Generar tu token JWT para tu sistema
        const token = createToken(user);

        // Puedes pasar un objeto con más datos si quieres
        return done(null, { user, token });
      }catch(err){
        return done(err, null);
      }
    }
  )
);

export default googleStrategy;
