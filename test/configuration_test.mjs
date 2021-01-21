// @format
import ava from "ava";
import process from "process";
import path from "path";
import { fileURLToPath } from "url";
import { unlinkSync, existsSync } from "fs";
import yup from "yup";
import quibble from "quibble";

import { ConfigError } from "../src/errors.mjs";
import {
  CONFIG_FILE_NAME,
  CONFIG_SCHEMA,
  load
} from "../src/configuration.mjs";

const test = ava.serial;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEST_FOLDER = path.resolve(__dirname, "./virtual_project");

test.afterEach.always(t => {
  const configPath = `${TEST_FOLDER}/${CONFIG_FILE_NAME}`;
  if (existsSync(configPath)) unlinkSync(configPath);
  quibble.reset();
});

test("that a config can be validated according to a schema", async t => {
  const config = {
    directories: {
      input: {
        path: "./src/pages",
        options: {
          extensions: /\.mjs/
        }
      },
      output: {
        path: "./dist",
        extension: ".html"
      }
    }
  };

  t.true(await CONFIG_SCHEMA.isValid(config));
});

test("if config can be validated with function", async t => {
  const config = {
    directories: {
      input: {
        path: "./src/pages",
        options: {
          extensions: /\.mjs/
        }
      },
      output: {
        path: "./dist",
        extension: ".html"
      }
    }
  };

  await load(config);
  t.pass();
});

test("if incorrect config throws validation error", async t => {
  const config = {
    bogus: "hello"
  };

  const processMock = {
    exit: code => t.true(code === 1) && t.pass()
  };

  await quibble.esm("process", processMock, processMock);
  const configuration = await import("../src/configuration.mjs");
  await configuration.load(config, { resolvePaths: false });
});

test("if output extensions are validated", async t => {
  let config = {
    directories: {
      input: {
        path: "./src/pages",
        options: {
          extensions: /\.mjs/
        }
      },
      output: {
        path: "./dist",
        extension: "html"
      }
    }
  };

  const processMock = {
    exit: code => t.true(code === 1),
    cwd: process.cwd
  };

  await quibble.esm("process", processMock, processMock);
  const configuration = await import("../src/configuration.mjs");
  await configuration.load(config);

  config.directories.output.extension = "a.b.c";
  await configuration.load(config);
});

test("if loading config resolves relative paths", async t => {
  const config = {
    directories: {
      input: {
        path: "./src/pages",
        options: {
          extensions: /\.mjs/
        }
      },
      output: {
        path: "./dist",
        extension: ".html"
      }
    }
  };

  const loadedConf = await load(config);
  t.true(path.isAbsolute(loadedConf.directories.input.path));
  t.true(path.isAbsolute(loadedConf.directories.output.path));
});
