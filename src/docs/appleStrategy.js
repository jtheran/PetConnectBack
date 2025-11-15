import passport from "passport";
import AppleStrategy from "passport-apple";
import prisma from '../libs/prisma.js';
import { createToken } from "../utils/jwt.js";
import config from "../config/config.js";

const options = {
    clientID: config.appleClientId,                  // Service ID de Apple
    teamID: config.appleTeamId,                     // Tu Team ID en Apple Developer
    keyID: config.appleKeyId,                       // Key ID del private key
    privateKeyLocation: config.applePrivateKeyPath, // Ruta al .p8 que descargaste en Apple
    callbackURL: config.appleCallbackURL,
    passReqToCallback: true,                        // Para recibir req en callback
    scope: ["name", "email"],                        // Pedir email y nombre (si aplica)
}

const appleStrategy = passport.use(
  new AppleStrategy(options,
    async (idToken, profile, done) => {
      try {
        // `idToken` es un JWT decodificado con datos de usuario Apple
        // En este idToken va el sub (identificador único), email, etc.
        const appleId = idToken.sub;
        const email = idToken.email;
        // profile puede tener `name` la primera vez, sino será undefined
        const name = profile?.name?.firstName + " " + profile?.name?.lastName;

        // Buscar si ya hay un AuthProvider para Apple
        let provider = await prisma.authProvider.findUnique({
          where: {
            provider_providerId: {
              provider: "apple",
              providerId: appleId,
            }
          },
          include: { user: true },
        });

        let user;
        if (!provider) {
          // No existe proveedor -> crear o asociar usuario
          user = await prisma.user.findUnique({ where: { email } });

          if (!user) {
            // Crear usuario nuevo
            user = await prisma.user.create({
              data: {
                email,
                name,
                providers: {
                  create: {
                    provider: "apple",
                    providerId: appleId,
                  }
                }
              }
            });
          } else {
            // Si ya existía el usuario con ese email, solo asociar Apple
            await prisma.authProvider.create({
              data: {
                provider: "apple",
                providerId: appleId,
                userId: user.id,
              }
            });
          }

          // Recargar provider
          provider = await prisma.authProvider.findUnique({
            where: {
              provider_providerId: {
                provider: "apple",
                providerId: appleId,
              }
            },
            include: { user: true },
          });
        } else {
          user = provider.user;
        }

        // Generar tu JWT para tu sistema
        const token = createToken(user);

        return done(null, { user, token });
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

export default appleStrategy;