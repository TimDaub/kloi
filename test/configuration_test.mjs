// @format
import ava from "ava";
import path from "path";
import { fileURLToPath } from "url";
import { copyFileSync, unlinkSync, existsSync, writeFileSync } from "fs";
import yup from "yup";
import quibble from "quibble";

import { ConfigError } from "../src/errors.mjs";
import {
  loadConfig,
  CONFIG_FILE_NAME,
  CONFIG_SCHEMA,
  validateConfig
} from "../src/configuration.mjs";

const test = ava.serial;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEST_FOLDER = path.resolve(__dirname, "./virtual_project");

test.afterEach.always(t => {
  const configPath = `${TEST_FOLDER}/${CONFIG_FILE_NAME}`;
  if (existsSync(configPath)) unlinkSync(configPath);
});

test("that loading a config throws a specific error when none is available", async t => {
  await t.throwsAsync(async () => await loadConfig("abc.config.js"), {
    instanceOf: Error
  });
});

test("that a regular config can be loaded", async t => {
  const config = `
    export default {
      directories: {
        pages: "./src/pages"
      }
    };
  `;

  const configPath = `${TEST_FOLDER}/${CONFIG_FILE_NAME}`;
  writeFileSync(configPath, config);

  const actual = await loadConfig(configPath);
  t.assert(typeof actual === "object");
  t.assert(actual.directories);
  t.assert(actual.directories.pages);
});

test("that a config can be validated according to a schema", async t => {
  const config = {
    directories: {
      pages: {
        path: "./src/pages",
        options: {
          extensions: /\.mjs/
        }
      }
    }
  };

  t.true(await CONFIG_SCHEMA.isValid(config));
});

test("if config can be validated with function", async t => {
  const config = {
    directories: {
      pages: {
        path: "./src/pages",
        options: {
          extensions: /\.mjs/
        }
      }
    }
  };

  await validateConfig(config);
  t.pass();
});

test("if incorrect config throws validation error", async t => {
  const config = {
    bogus: "hello"
  };
  
  const processMock = {
    exit: code => t.true(code === 1)
  };

  await quibble.esm("process", processMock, processMock);
  const configuration = await import("../src/configuration.mjs");
  await configuration.validateConfig(config);
});
