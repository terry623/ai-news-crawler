class Logger {
  static info(message, ...args) {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
  }

  static error(message, ...args) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
  }

  static warn(message, ...args) {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
  }

  static debug(message, ...args) {
    if (process.env.DEBUG) {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
    }
  }

  static success(message, ...args) {
    console.log(`[SUCCESS] ${new Date().toISOString()} - ${message}`, ...args);
  }
}

module.exports = Logger;
