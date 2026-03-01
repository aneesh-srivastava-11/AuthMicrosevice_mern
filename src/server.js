const app = require('./app');
const logger = require('./config/logger');
const env = require('./config/env');
const prisma = require('./config/prisma');

const port = env.PORT || 3000;

let server;

// Prisma connection check
prisma
    .$connect()
    .then(() => {
        logger.info('📦 Connected to PostgreSQL Database successfully.');
        server = app.listen(port, () => {
            logger.info(`🚀 Identity Microservice running on port ${port} in ${env.NODE_ENV} mode.`);
        });
    })
    .catch((err) => {
        logger.error('❌ Failed to connect to database', err);
        process.exit(1);
    });

// Graceful shutdown
const exitHandler = () => {
    if (server) {
        server.close(() => {
            logger.info('Server closed');
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
};

const unexpectedErrorHandler = (error) => {
    logger.error(error);
    exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
    logger.info('SIGTERM received');
    if (server) {
        server.close();
    }
});
