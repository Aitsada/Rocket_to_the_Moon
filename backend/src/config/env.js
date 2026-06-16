import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'development-only-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5174',
  autoMigrate: process.env.DB_AUTO_MIGRATE !== 'false'
};

if (!env.databaseUrl) {
  console.log("ENV : ", env)
  throw new Error('DATABASE_URL is required');
}
if (env.nodeEnv === 'production' && env.jwtSecret === 'development-only-secret') {
  throw new Error('JWT_SECRET must be set in production');
}
