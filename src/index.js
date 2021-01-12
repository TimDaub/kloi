// @format
const path = require("path");
const process = require("process");

const { ConfigError } = require("./errors.js");

const CONFIG_FILE_NAME = "kloi.config.js";

function loadConfig() {
  const configPath = path.resolve(process.cwd(), CONFIG_FILE_NAME);

  let config;
  try {
    config = require(configPath);
  } catch (err) {
    if (err.toString().includes("Cannot find module")) {
      throw new ConfigError(
        `Expected a config to be present at path: ${configPath}`
      );
    } else {
      throw err;
    }
  }

  return config;
}

function run() {
  let config;

  try {
    config = loadConfig();
  } catch (err) {
    console.error(err);
  }
}

module.exports = {
  CONFIG_FILE_NAME,
  run,
  loadConfig
};
