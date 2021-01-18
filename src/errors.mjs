// @format
export class ConfigError extends Error {
  constructor(...params) {
    super(...params);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConfigError);
    }
    this.name = "ConfigError";
  }
}

export class NotImplementedError extends Error {
  constructor(...params) {
    super(...params);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NotImplementedError);
    }
    this.name = "NotImplementedError";
  }
}
