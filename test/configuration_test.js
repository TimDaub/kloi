// @format
const test = require("ava").serial;
const proxyquire = require("proxyquire");
const path = require("path");
const { copyFileSync, unlinkSync, existsSync, writeFileSync } = require("fs");
const yup = require("yup");

const { ConfigError } = require("../src/errors.js");
const { CONFIG_FILE_NAME, CONFIG_SCHEMA } = require("../src/configuration.js");

const TEST_FOLDER = path.resolve(__dirname, "./virtual_project");
const configPath = `${TEST_FOLDER}/${CONFIG_FILE_NAME}`;

const invalidateCache = () => {
  delete require.cache[configPath];
};
const cleanup = t => {
  if (existsSync(configPath)) unlinkSync(configPath);
  invalidateCache();
};

test.afterEach.always(cleanup);

test("that loading a config throws a specific error when none is available", async t => {
  const { loadConfig } = proxyquire("../src/configuration.js", {
    process: {
      cwd: () => path.resolve(__dirname, TEST_FOLDER)
    }
  });

  await t.throwsAsync(async () => loadConfig(), {
    instanceOf: ConfigError
  });
});

test("that regular config can be loaded", async t => {
  const { loadConfig } = proxyquire("../src/configuration.js", {
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

test("that template config can be copied", t => {
  const { copyConfig } = proxyquire("../src/configuration.js", {
    process: {
      cwd: () => path.resolve(__dirname, TEST_FOLDER)
    }
  });

  copyConfig();
  t.true(existsSync(path.resolve(__dirname, TEST_FOLDER, CONFIG_FILE_NAME)));
});

test("if template config is valid according to schema", async t => {
  const config = require("esm")(module)(`../src/templates/${CONFIG_FILE_NAME}`);
  t.true(await CONFIG_SCHEMA.isValid(config));
});

test("if init tries loading a config but creates it if none is existent", async t => {
  const { init } = proxyquire("../src/configuration.js", {
    process: {
      cwd: () => path.resolve(__dirname, TEST_FOLDER)
    }
  });

  t.false(existsSync(path.resolve(__dirname, TEST_FOLDER, CONFIG_FILE_NAME)));
  const config = await init();
  t.true(existsSync(path.resolve(__dirname, TEST_FOLDER, CONFIG_FILE_NAME)));
  t.true(await CONFIG_SCHEMA.isValid(config));
});

test("if init loads already existing config and doesn't create new one", async t => {
  const { init } = proxyquire("../src/configuration.js", {
    process: {
      cwd: () => path.resolve(__dirname, TEST_FOLDER)
    }
  });

  const pages = "abc";
  const copyFile = `module.exports = { directories: { pages: "${pages}" } }`;
  const configPath = `${TEST_FOLDER}/${CONFIG_FILE_NAME}`;
  t.false(existsSync(configPath));
  writeFileSync(configPath, copyFile);

  const config = await init();
  t.true(existsSync(path.resolve(__dirname, TEST_FOLDER, CONFIG_FILE_NAME)));
  t.true(await CONFIG_SCHEMA.isValid(config));
  t.assert(config.directories.pages === pages);
});

test("if init throws an error when config file has invalid schema", async t => {
  const { init } = proxyquire("../src/configuration.js", {
    process: {
      cwd: () => path.resolve(__dirname, TEST_FOLDER)
    }
  });

  const copyFile = `module.exports = { hello: "world" }`;
  const configPath = `${TEST_FOLDER}/${CONFIG_FILE_NAME}`;
  t.false(existsSync(configPath));
  writeFileSync(configPath, copyFile);

  await t.throwsAsync(async () => await init(), {
    instanceOf: yup.ValidationError
  });
});
