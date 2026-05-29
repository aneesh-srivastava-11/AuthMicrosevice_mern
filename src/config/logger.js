const pino = require('pino');
const { AsyncLocalStorage } = require('async_hooks');

const asyncLocalStorage = new AsyncLocalStorage();

const baseLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
        },
      }
    : undefined,
});

// Proxy logger to automatically inject requestId from AsyncLocalStorage if active
const logger = new Proxy(baseLogger, {
  get(target, property) {
    if (['info', 'error', 'warn', 'debug', 'trace', 'fatal'].includes(property)) {
      return function (...args) {
        const store = asyncLocalStorage.getStore();
        if (store && store.requestId) {
          const firstArg = args[0];
          if (typeof firstArg === 'object' && firstArg !== null && !(firstArg instanceof Error)) {
            return target[property]({ requestId: store.requestId, ...firstArg }, ...args.slice(1));
          } else if (firstArg instanceof Error) {
            return target[property]({ requestId: store.requestId, err: firstArg }, firstArg.message, ...args.slice(1));
          } else {
            return target[property]({ requestId: store.requestId }, ...args);
          }
        }
        return target[property](...args);
      };
    }
    return target[property];
  }
});

module.exports = logger;
module.exports.asyncLocalStorage = asyncLocalStorage;
