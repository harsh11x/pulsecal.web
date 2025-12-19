import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import { config } from './env';
import prisma from './database';
import { comparePassword } from '../utils/encrypt';
import { logger } from '../utils/logger';

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwt.secret,
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          lockedUntil: true,
        },
      });

      if (!user) {
        return done(null, false);
      }

      if (!user.isActive) {
        return done(null, false, { message: 'Account is inactive' });
      }

      if (user.lockedUntil && user.lockedUntil > new Date()) {
        return done(null, false, { message: 'Account is locked' });
      }

      return done(null, user);
    } catch (error) {
      logger.error('JWT Strategy error:', error);
      return done(error, false);
    }
  })
);

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email: string, password: string, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        if (!user.isActive) {
          return done(null, false, { message: 'Account is inactive' });
        }

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          return done(null, false, { message: 'Account is locked' });
        }

        const isPasswordValid = await comparePassword(password, user.password);

        if (!isPasswordValid) {
          const failedAttempts = (user.failedLoginAttempts || 0) + 1;
          const maxAttempts = 5;
          const lockDuration = 15 * 60 * 1000; // 15 minutes

          if (failedAttempts >= maxAttempts) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: failedAttempts,
                lockedUntil: new Date(Date.now() + lockDuration),
              },
            });
            return done(null, false, {
              message: 'Account locked due to too many failed attempts',
            });
          }

          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: failedAttempts },
          });

          return done(null, false, { message: 'Invalid credentials' });
        }

        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          },
        });

        return done(null, user);
      } catch (error) {
        logger.error('Local Strategy error:', error);
        return done(error, false);
      }
    }
  )
);

export default passport;

