// @format
const path = require("path");
const process = require("process");
const {
  copyFileSync,
  constants: { COPYFILE_EXCL }
} = require("fs");
const yup = require("yup");

const { ConfigError } = require("./errors.js");

const CONFIG_FILE_NAME = "kloi.config.js";
const TEMPLATE_DIR = path.resolve(__dirname, "./templates");
const PROJECT_DIR = process.cwd();
const CONFIG_SCHEMA = yup.object().shape({
  directories: yup.object().shape({
    pages: yup.string().required()
  })
});

function loadConfig() {
  const configPath = path.resolve(PROJECT_DIR, CONFIG_FILE_NAME);

  let config;
  try {
    config = require(configPath);
  } catch (err) {
    const msg = err.toString();
    if (
      msg.includes("Cannot find module") ||
      msg.includes("no such file or directory")
    ) {
      throw new ConfigError(
        `Expected a config to be present at path: ${configPath}`
      );
    } else {
      throw err;
    }
  }

  console.info(`Successfully loaded config file at: ${configPath}`);
  return config;
}

function copyConfig() {
  const configPath = `${PROJECT_DIR}/${CONFIG_FILE_NAME}`;
  copyFileSync(
    `${TEMPLATE_DIR}/${CONFIG_FILE_NAME}`,
    configPath,
    COPYFILE_EXCL
  );
  console.info(`Successfully created new config file at: ${configPath}`);
}

async function init() {
  let config;

  try {
    config = loadConfig();
  } catch (err) {
    if (err instanceof ConfigError) {
      copyConfig();

      try {
        config = loadConfig();
      } catch (err) {
        console.error(
          `Failed loading config file after creation: ${err.toString()}`
        );
        process.exit(1);
      }
    } else {
      throw err;
      process.exit(1);
    }
  }

  let validationResult;
  try {
    validationResult = await CONFIG_SCHEMA.validate(config);
  } catch (err) {
      throw err;
      process.exit(1);
  }

  return validationResult;
}

module.exports = {
  CONFIG_FILE_NAME,
  CONFIG_SCHEMA,
  init,
  loadConfig,
  copyConfig
};
