// @format
import { CONFIG_FILE_NAME, CONFIG_SCHEMA, load } from "./configuration.mjs";
import { tree, traverse, render } from "./build.mjs";

const configuration = {
  CONFIG_FILE_NAME,
  CONFIG_SCHEMA,
  load
};

const build = {
  tree,
  traverse,
  render
};

export { configuration, build };
