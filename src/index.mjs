// @format
import {
  CONFIG_FILE_NAME,
  CONFIG_SCHEMA,
  loadConfig,
  validateConfig
} from "./configuration.mjs";
import { tree, load, loadDir, traverse } from "./build.mjs";

const configuration = {
  CONFIG_FILE_NAME,
  CONFIG_SCHEMA,
  loadConfig,
  validateConfig
};

const build = {
  tree,
  load,
  loadDir,
  traverse
};

export { configuration, build };
