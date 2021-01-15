// @format
import path from "path";
import { fileURLToPath } from "url";
import {
  existsSync,
  unlinkSync,
  writeFileSync,
  mkdirSync,
  rmdirSync
} from "fs";
import ava from "ava";

import { loadDirectoryTree } from "../src/build.mjs";

const test = ava.serial;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEST_FOLDER = path.resolve(__dirname, "./virtual_project");

test.afterEach.always(t => {
  rmdirSync(TEST_FOLDER, { recursive: true });
  mkdirSync(TEST_FOLDER);
  writeFileSync(`${TEST_FOLDER}/.keep`, "");
});

test("if tree folder structure is parsed correctly", async t => {
  writeFileSync(
    `${TEST_FOLDER}/index.mjs`,
    `
    const hello = "world";
    export default hello;
  `
  );
  mkdirSync(`${TEST_FOLDER}/subdir`);
  writeFileSync(
    `${TEST_FOLDER}/subdir/subdirfile.mjs`,
    `
    const hello = "subdir";
    export default hello;
  `
  );

  const projectStruct = await loadDirectoryTree(TEST_FOLDER, {
    extensions: /\.mjs/
  });
  t.is(projectStruct.children.length, 2);

  const subDir = projectStruct.children.find(elem => elem.type === "directory");
  t.is(subDir.children.length, 1);
  const indexFile = projectStruct.children.find(
    ({ name }) => name === "index.mjs"
  );
  t.truthy(indexFile);
  t.true(indexFile.module === "world");

  const subdirFile = subDir.children.find(
    ({ name }) => name === "subdirfile.mjs"
  );
  t.truthy(subdirFile);
  t.true(subdirFile.module === "subdir");
});
