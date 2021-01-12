// @format
class ConfigError extends Error {
  constructor(...params) {
    super(...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConfigError);
    }

    this.name = "ConfigError";
  }
}

module.exports = { ConfigError };
