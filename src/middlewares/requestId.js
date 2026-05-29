const { v4: uuidv4 } = require('uuid');
const { asyncLocalStorage } = require('../config/logger');

const requestId = (req, res, next) => {
    const id = req.headers['x-request-id'] || uuidv4();
    req.id = id;
    res.setHeader('X-Request-Id', id);
    
    // Run the request execution context within AsyncLocalStorage to persist correlation ID
    asyncLocalStorage.run({ requestId: id }, () => {
        next();
    });
};

module.exports = requestId;
