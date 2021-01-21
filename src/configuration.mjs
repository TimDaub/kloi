// @format
import path from "path";
import process from "process";
import yup from "yup";
import crypto from "crypto";

import { ConfigError } from "./errors.mjs";

const CONFIG_FILE_NAME = "kloi.config.mjs";
const CONFIG_SCHEMA = yup.object().shape({
  directories: yup.object().shape({
    input: yup.object().shape({
      path: yup.string().required(),
      options: yup.object().shape({
        // TODO: Is there a yup type of RegEx?
        extensions: yup.mixed()
      })
    }),
    output: yup.object().shape({
      path: yup.string().required(),
      extension: yup
        .string()
        .matches(/\.[A-Za-z]+/)
        .required()
    })
  })
});
export { CONFIG_SCHEMA };
export { CONFIG_FILE_NAME };

const defaultOptions = {
  resolvePaths: true
};

export async function load(config, options) {
  options = { ...defaultOptions, ...options };

  // NOTE: loade input here already to make sure that the optional
  // transformation steps provided in `options` don't fail.
  try {
    await CONFIG_SCHEMA.validate(config);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  if (options.resolvePaths) {
    config.directories.input.path = path.resolve(
      process.cwd(),
      config.directories.input.path
    );
    config.directories.output.path = path.resolve(
      process.cwd(),
      config.directories.output.path
    );
  }

  // NOTE: Lastly, we validate the config once again and return the value on
  // success
  try {
    return await CONFIG_SCHEMA.validate(config);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
