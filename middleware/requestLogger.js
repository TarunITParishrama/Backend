const crypto = require("crypto");
const logger = require("../utils/logger");

const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  const requestId = crypto.randomUUID();

  req.requestId = requestId;

  res.on("finish", () => {
    const duration = Date.now() - startTime;

    logger.info(
      [
        `RequestID=${requestId}`,
        `${req.method}`,
        `${req.originalUrl}`,
        `Status=${res.statusCode}`,
        `Time=${duration}ms`,
      ].join(" | ")
    );
  });

  next();
};

module.exports = requestLogger;