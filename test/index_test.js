// @format
const test = require("ava").serial;
const proxyquire = require("proxyquire");
const path = require("path");
const { copyFileSync, unlinkSync, existsSync } = require("fs");

const { ConfigError } = require("../src/errors.js");
const { CONFIG_FILE_NAME } = require("../src/index.js");

const TEST_FOLDER = path.resolve(__dirname, "./virtual_project");

test.afterEach(t => {
  const configPath = `${TEST_FOLDER}/${CONFIG_FILE_NAME}.js`;
  if (existsSync(configPath)) unlinkSync(configPath);
});

test("that loading a config throws a specific error when none is available", t => {
  const { loadConfig } = proxyquire("../src/index.js", {
    process: {
      cwd: () => path.resolve(__dirname, TEST_FOLDER)
    }
  });

  t.throws(() => loadConfig(), { instanceOf: ConfigError });
});

test("that regular config can be loaded", t => {
  const { loadConfig } = proxyquire("../src/index.js", {
    process: {
      cwd: () => path.resolve(__dirname, TEST_FOLDER)
    }
  });

  copyFileSync(
    path.resolve(__dirname, `../src/templates/${CONFIG_FILE_NAME}`),
    `${TEST_FOLDER}/${CONFIG_FILE_NAME}`
  );

  const config = loadConfig();
  t.assert(typeof config === "object");
  t.assert(config.directories);
  t.assert(config.directories.pages);
});
