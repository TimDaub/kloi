// @format
import path from "path";
import { fileURLToPath } from "url";
import { existsSync, writeFileSync, mkdirSync, rmdirSync } from "fs";
import ava from "ava";
import { Component } from "preact";
import { html } from "htm/preact/index.js";
import quibble from "quibble";

import { Builder, ModuleLoader } from "../src/build.mjs";

const test = ava.serial;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEST_FOLDER = path.resolve(__dirname, "./virtual_project");

test.afterEach.always(t => {
  rmdirSync(TEST_FOLDER, { recursive: true });
  mkdirSync(TEST_FOLDER);
  writeFileSync(`${TEST_FOLDER}/.keep`, "");
});

test("that module loader cache is set", t => {
  const loader = new ModuleLoader();
  t.false(loader.cache.has("abc"));
  loader.getNewToken("abc");
  t.true(loader.cache.has("abc"));
});

test("that module loader can circumvent nodejs import fn cache", async t => {
  const loader = new ModuleLoader();
  const filePath = `${TEST_FOLDER}/index.server.mjs`;
  writeFileSync(
    filePath,
    `
    const hello = "world";
    export default hello;
  `
  );
  const mod = await loader.load(filePath);
  t.is(mod, "world");
});

test("if matching react server and client components is possible", async t => {
  t.deepEqual(Builder.labelModule("index.server.js"), "server");
  t.deepEqual(Builder.labelModule("index.client.js"), "client");
  t.throws(() => Builder.labelModule("index.bla.js"));
  t.throws(() => Builder.labelModule("index.js"));
});

test("rendering a valid preact class and fn component with props", async t => {
  function FnComponent(props) {
    return html`${props.msg}`;
  }

  class Test extends Component {
    render() {
      return html`
        <span>
          <${FnComponent} ...${this.props} />
        </span>`;
    }
  }

  const msg = "hello";
  const rendered = await Builder.renderModule(Test, { msg });
  t.is(rendered, `<span>${msg}</span>`);
});

test("if traverse visits and yields all branches of a directory tree", async t => {
  const files = [
    {
      type: "directory",
      path: "./src/first.server.mjs",
      name: "first",
      children: [
        {
          type: "file",
          name: "subfile",
          path: "./src/subdir/subfile.server.mjs"
        }
      ]
    },
    {
      type: "file",
      name: "second",
      path: "./src/second.server.mjs"
    }
  ];
  await quibble.esm("directory-tree", undefined, () => ({
    children: files
  }));
  const MockBuilder = (await import("../src/build.mjs")).Builder;
  t.true(typeof MockBuilder === "function");
  const builder = new MockBuilder({
    directories: { input: { path: "input" }, output: { path: "output" } }
  });

  let it = builder.traverse("fake", "fake2");
  let head = it.next();
  t.is(head.value.type, "directory");
  t.is(head.value.name, "first");
  t.truthy(head.value.outPath);

  head = it.next();
  t.is(head.value.name, "second");
  t.truthy(head.value.outPath);

  head = it.next();
  t.is(head.value.name, "subfile");
  t.truthy(head.value.outPath);
});

test("if an error is thrown when a file's path and type don't match", t => {
  const config = {
    output: {}
  };
  const builder = new Builder(config);
  t.throws(() => builder.resolveOutPath("file.client.js", "file"));
  t.throws(() => builder.resolveOutPath("file.js", "file"));
  t.throws(() => builder.resolveOutPath("bin", "file"));
  t.throws(() => builder.resolveOutPath("bin", "file"));
});

test("if resolving a file's output path is possible", t => {
  const config = {
    directories: {
      input: {
        path: "./src/pages"
      },
      output: {
        path: "./dist/",
        extension: ".html"
      }
    }
  };
  const builder = new Builder(config);

  const file = path.resolve(config.directories.input.path, "file.server.mjs");
  t.is(builder.resolveOutPath(file, "file"), `${process.cwd()}/dist/file.html`);
  const file2 = path.resolve(
    config.directories.input.path,
    "subdir/file.server.mjs"
  );
  t.is(
    builder.resolveOutPath(file2, "file"),
    `${process.cwd()}/dist/subdir/file.html`
  );

  const dir = path.resolve(config.directories.input.path, "dir");
  t.is(builder.resolveOutPath(dir, "directory"), `${process.cwd()}/dist/dir`);
});

test("that write function throws when no dist file exists", t => {
  const config = {
    directories: {
      output: {
        path: "./dist/"
      }
    }
  };
  const builder = new Builder(config);
  t.throws(() => builder.write(), { instanceOf: Error });
});

test("that write function is safe for writing a directory when it already exists", t => {
  const distDir = `${TEST_FOLDER}/dist`;
  mkdirSync(distDir);
  t.true(existsSync(distDir));
  const config = {
    directories: {
      output: {
        path: "test/virtual_project/dist/"
      }
    }
  };
  const testDir = `${distDir}/test`;
  mkdirSync(testDir);
  t.true(existsSync(testDir));

  const builder = new Builder(config);
  builder.write({
    type: "directory",
    outPath: testDir
  });
  t.pass();
});

test("that both directories and files can be written", t => {
  const distDir = `${TEST_FOLDER}/dist/`;
  mkdirSync(distDir);
  t.true(existsSync(distDir));
  const config = {
    directories: {
      output: {
        path: "test/virtual_project/dist/"
      }
    }
  };

  const builder = new Builder(config);
  const outPath1 = `${TEST_FOLDER}/dist/subdir`;
  builder.write({ type: "directory", outPath: outPath1 });
  t.true(existsSync(outPath1));

  const outPath2 = `${TEST_FOLDER}/dist/index.html`;
  builder.write({
    type: "file",
    outPath: outPath2,
    rendered: "<p>hello world</p>"
  });
  t.true(existsSync(outPath2));
});

test("recursively copying a folder structure using asset property", t => {
  mkdirSync(`${TEST_FOLDER}/src`);
  mkdirSync(`${TEST_FOLDER}/dist`);
  mkdirSync(`${TEST_FOLDER}/src/pages`);
  mkdirSync(`${TEST_FOLDER}/src/pages/assets/`);
  mkdirSync(`${TEST_FOLDER}/src/pages/assets/foldertocopy`);
  writeFileSync(
    `${TEST_FOLDER}/src/pages/assets/foldertocopy/file.txt`,
    `hello`
  );

  const config = {
    directories: {
      input: {
        assets: {
          path: `${TEST_FOLDER}/src/pages/assets`
        },
        path: `${TEST_FOLDER}/src/pages/`
      },
      output: {
        path: `${TEST_FOLDER}/dist/`,
        extension: ".html"
      }
    }
  };

  const builder = new Builder(config);
  builder.copyAssets();
  t.true(existsSync(`${TEST_FOLDER}/dist/assets/foldertocopy`));
  t.true(existsSync(`${TEST_FOLDER}/dist/assets/foldertocopy/file.txt`));
});

test("if recursive dir structure copy throws errors when structure exists", t => {
  mkdirSync(`${TEST_FOLDER}/src`);
  mkdirSync(`${TEST_FOLDER}/dist`);
  mkdirSync(`${TEST_FOLDER}/src/pages`);
  mkdirSync(`${TEST_FOLDER}/src/pages/assets/`);
  mkdirSync(`${TEST_FOLDER}/src/pages/assets/foldertocopy`);
  writeFileSync(
    `${TEST_FOLDER}/src/pages/assets/foldertocopy/file.txt`,
    `hello`
  );

  const config = {
    directories: {
      input: {
        assets: {
          path: `${TEST_FOLDER}/src/pages/assets`
        },
        path: `${TEST_FOLDER}/src/pages/`
      },
      output: {
        path: `${TEST_FOLDER}/dist/`,
        extension: ".html"
      }
    }
  };

  const builder = new Builder(config);
  builder.copyAssets();
  t.true(existsSync(`${TEST_FOLDER}/dist/assets/foldertocopy`));
  t.true(existsSync(`${TEST_FOLDER}/dist/assets/foldertocopy/file.txt`));

  builder.copyAssets();
  t.pass();
});
