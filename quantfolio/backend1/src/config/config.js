require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = [
    'PG_HOST', 'PG_PORT', 'PG_USER', 'PG_PASSWORD', 'PG_DATABASE',
    'MONGO_URI'
];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars.join(', '));
    process.exit(1);
}

module.exports = {
    // TimescaleDB config
    pgHost: process.env.PG_HOST,
    pgPort: parseInt(process.env.PG_PORT),
    pgUser: process.env.PG_USER,
    pgPassword: process.env.PG_PASSWORD,
    pgDatabase: process.env.PG_DATABASE,
    
    // MongoDB config
    mongoUri: process.env.MONGO_URI,
    
    // Other config
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    port: parseInt(process.env.PORT) || 5000
};