// @format
import { CONFIG_FILE_NAME, CONFIG_SCHEMA, load } from "./configuration.mjs";
import { Builder } from "./build.mjs";

const configuration = {
  CONFIG_FILE_NAME,
  CONFIG_SCHEMA,
  load
};

const build = {
  Builder
};

export { configuration, Builder };
