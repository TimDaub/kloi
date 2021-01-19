// @format
import {
  CONFIG_FILE_NAME,
  CONFIG_SCHEMA,
  loadConfig,
  validateConfig
} from "./configuration.mjs";
import { tree, traverse, render } from "./build.mjs";

const configuration = {
  CONFIG_FILE_NAME,
  CONFIG_SCHEMA,
  loadConfig,
  validateConfig
};

const build = {
  tree,
  traverse,
  render
};

export { configuration, build };
