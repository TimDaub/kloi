// @format
import {
  CONFIG_FILE_NAME,
  CONFIG_SCHEMA,
  loadConfig,
  validateConfig
} from "./configuration.mjs";
import { loadDirectoryTree } from "./build.mjs";

const configuration = {
  CONFIG_FILE_NAME,
  CONFIG_SCHEMA,
  loadConfig,
  validateConfig
};

const build = {
  loadDirectoryTree
};

export { configuration, build };
