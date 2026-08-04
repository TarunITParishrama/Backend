const logger = {
  info: (message) => {
    console.log(
      `\x1b[36m[INFO]\x1b[0m ${new Date().toISOString()} - ${message}`
    );
  },

  success: (message) => {
    console.log(
      `\x1b[32m[SUCCESS]\x1b[0m ${new Date().toISOString()} - ${message}`
    );
  },

  warn: (message) => {
    console.warn(
      `\x1b[33m[WARNING]\x1b[0m ${new Date().toISOString()} - ${message}`
    );
  },

  error: (message) => {
    console.error(
      `\x1b[31m[ERROR]\x1b[0m ${new Date().toISOString()} - ${message}`
    );
  },
};

module.exports = logger;