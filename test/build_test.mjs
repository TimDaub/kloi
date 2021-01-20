// @format
import path from "path";
import { fileURLToPath } from "url";
import { writeFileSync, mkdirSync, rmdirSync } from "fs";
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
      path: "./src/first.txt",
      name: "first",
      children: [
        {
          type: "file",
          name: "subfile",
          path: "./src/subdir/subfile.txt"
        }
      ]
    },
    {
      type: "file",
      name: "second",
      path: "./src/second.txt"
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

test("if resolving a file's output path is possible", t => {
  const config = {
    directories: {
      input: {
        path: "./src/pages"
      },
      output: {
        path: "./dist/"
      }
    }
  };
  const builder = new Builder(config);

  const file = path.resolve(config.directories.input.path, "file.txt");
  t.is(builder.resolveOutPath(file), `${process.cwd()}/dist/file.txt`);
  const file2 = path.resolve(config.directories.input.path, "subdir/file.txt");
  t.is(builder.resolveOutPath(file2), `${process.cwd()}/dist/subdir/file.txt`);
});
