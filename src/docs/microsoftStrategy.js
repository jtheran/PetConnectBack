import passport from "passport";
import logger from '../logs/logger.js';
import { Strategy as MicrosoftStrategy } from "passport-microsoft";
import prisma from '../libs/prisma.js';
import { createToken } from "../utils/jwt.js"; // tu función para generar JWT
import config from "../config/config.js";

const options = {
    clientID: config.microsoftClientId,
    clientSecret: config.microsoftClientSecret,
    callbackURL: config.microsoftCallbackURL,
    scope: ["user.read"],  // permiso para leer el perfil del usuario
    tenant: config.microsoftTenant || "common",
    // authorizationURL: config.microsoftAuthorizationURL,  // opcional
    // tokenURL: config.microsoftTokenURL,                  // opcional
    // graphApiVersion también es una opción según la librería
    // graphApiVersion: "v1.0",
    // addUPNAsEmail: false,
    // apiEntryPoint: config.microsoftGraphEntryPoint || 'https://graph.microsoft.com',
}

const microsoftStrategy = passport.use(new MicrosoftStrategy(options,
  async (profile, done) => {
    try {
      const msId = profile.id;  
      const email = profile._json?.userPrincipalName || profile._json?.mail;
      const name = profile.displayName;

      // Buscar en AuthProvider
      let provider = await prisma.authProvider.findUnique({
        where: {
          provider_providerId: {
            provider: "microsoft",
            providerId: msId,
          }
        },
        include: { user: true },
      });

      let user;
      if (!provider) {
        // No existe el authProvider: crear o vincular usuario
        user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          // Crear usuario nuevo
          user = await prisma.user.create({
            data: {
              email,
              name,
              providers: {
                create: {
                  provider: "microsoft",
                  providerId: msId,
                }
              }
            }
          });
        } else {
          // Asociar Microsoft como proveedor
          await prisma.authProvider.create({
            data: {
              provider: "microsoft",
              providerId: msId,
              userId: user.id,
            }
          });
        }

        // Recargar provider con el usuario
        provider = await prisma.authProvider.findUnique({
          where: {
            provider_providerId: {
              provider: "microsoft",
              providerId: msId,
            }
          },
          include: { user: true },
        });
      } else {
        user = provider.user;
      }

      // Generar tu JWT para tu app
      const token = createToken(user);

      // Devolver al Passport
      return done(null, { user, token });
    } catch (err) {
      return done(err, null);
    }
  }
));

export default microsoftStrategy;