// @format
import path from "path";
import process from "process";
import yup from "yup";
import crypto from "crypto";

import { ConfigError } from "./errors.mjs";

const CONFIG_FILE_NAME = "kloi.config.mjs";
const CONFIG_SCHEMA = yup.object().shape({
  directories: yup.object().shape({
    pages: yup.object().shape({
      path: yup.string().required(),
      options: yup.object().shape({
        // TODO: Is there a yup type of RegEx?
        extensions: yup.mixed()
      })
    })
  })
});
export { CONFIG_SCHEMA };
export { CONFIG_FILE_NAME };

export async function loadConfig(configPath) {
  const token = crypto.randomBytes(8).toString("hex");
  // NOTE: import can throw if no module is found at the `configPath`
  // NOTE2: `token` is used to make sure that eacht time `loadConfig` is called,
  // the module is loaded from scratch (and non-cached).
  const config = (await import(`${configPath}?${token}`)).default;
  console.info(`Successfully loaded config file at: ${configPath}`);
  return config;
}

export async function validateConfig(config) {
  try {
    return await CONFIG_SCHEMA.validate(config);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
